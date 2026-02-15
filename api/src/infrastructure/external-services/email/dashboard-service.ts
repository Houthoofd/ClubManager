/**
 * 📊 Dashboard Service
 *
 * Service pour le dashboard admin avec métriques en temps réel :
 * - Statistiques de la queue
 * - Métriques d'envoi
 * - État du circuit breaker
 * - Performances du worker
 * - Graphiques et tendances
 *
 * @module dashboard-service
 * @since Phase 2
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import type {
  DashboardData,
  DashboardEvent,
  DashboardConfig
} from '@clubmanager/types';
import { EmailMetricsCollector } from './metrics-collector';
import { EmailCircuitBreaker } from './circuit-breaker';

/**
 * Statistiques agrégées par période
 */
export interface TimeSeriesData {
  timestamp: Date;
  sent: number;
  failed: number;
  pending: number;
}

/**
 * Statistiques par template
 */
export interface TemplateStats {
  template: string;
  sent: number;
  failed: number;
  successRate: number;
  avgDuration: number;
}

/**
 * Statistiques par priorité
 */
export interface PriorityStats {
  priority: string;
  pending: number;
  processing: number;
  avgWaitTime: number;
}

/**
 * Service de dashboard admin
 */
export class DashboardService extends EventEmitter {
  private prisma: PrismaClient;
  private metricsCollector: EmailMetricsCollector;
  private circuitBreaker: EmailCircuitBreaker | null = null;
  private config: DashboardConfig;
  private refreshInterval: NodeJS.Timeout | null = null;
  private lastData: DashboardData | null = null;

  constructor(
    prisma: PrismaClient,
    metricsCollector: EmailMetricsCollector,
    config: Partial<DashboardConfig> = {}
  ) {
    super();
    this.prisma = prisma;
    this.metricsCollector = metricsCollector;
    this.config = {
      enabled: true,
      refreshInterval: 5000, // 5 secondes
      metricsRetention: 24 * 60 * 60 * 1000, // 24 heures
      ...config
    };
  }

  /**
   * Configure le circuit breaker pour le monitoring
   */
  setCircuitBreaker(circuitBreaker: EmailCircuitBreaker): void {
    this.circuitBreaker = circuitBreaker;
  }

  /**
   * Démarre le rafraîchissement automatique
   */
  start(): void {
    if (!this.config.enabled || this.refreshInterval) {
      return;
    }

    console.log('📊 [Dashboard] Starting auto-refresh...');

    this.refreshInterval = setInterval(async () => {
      try {
        const data = await this.getDashboardData();
        this.emit('update', {
          type: 'metrics',
          data,
          timestamp: new Date()
        } as DashboardEvent);
      } catch (error) {
        console.error('❌ [Dashboard] Refresh error:', error);
      }
    }, this.config.refreshInterval);

    // Premier rafraîchissement immédiat
    this.getDashboardData().then(data => {
      this.emit('update', {
        type: 'metrics',
        data,
        timestamp: new Date()
      } as DashboardEvent);
    });
  }

  /**
   * Arrête le rafraîchissement automatique
   */
  stop(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('📊 [Dashboard] Auto-refresh stopped');
    }
  }

  /**
   * Récupère toutes les données du dashboard
   */
  async getDashboardData(): Promise<DashboardData> {
    const [queue, metrics, circuitBreakerState, worker, recentErrors] = await Promise.all([
      this.getQueueStats(),
      this.getMetricsStats(),
      this.getCircuitBreakerState(),
      this.getWorkerStats(),
      this.getRecentErrors()
    ]);

    const data: DashboardData = {
      timestamp: new Date(),
      queue,
      metrics,
      circuitBreaker: circuitBreakerState,
      worker,
      recentErrors
    };

    this.lastData = data;
    return data;
  }

  /**
   * Récupère les statistiques de la queue
   */
  async getQueueStats(): Promise<DashboardData['queue']> {
    const [pending, inProgress, stuck] = await Promise.all([
      this.prisma.emailQueue.count({
        where: { status: 'PENDING' }
      }),
      this.prisma.emailQueue.count({
        where: { status: 'PROCESSING' }
      }),
      this.prisma.emailQueue.count({
        where: {
          status: 'PROCESSING',
          updatedAt: {
            lt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes
          }
        }
      })
    ]);

    // Statistiques par priorité
    const byPriorityData = await this.prisma.emailQueue.groupBy({
      by: ['priority'],
      where: {
        status: { in: ['PENDING', 'PROCESSING'] }
      },
      _count: true
    });

    const byPriority: Record<string, number> = {};
    byPriorityData.forEach(item => {
      byPriority[item.priority] = item._count;
    });

    return {
      pending,
      inProgress,
      stuck,
      byPriority
    };
  }

  /**
   * Récupère les métriques d'envoi (dernières 24h)
   */
  async getMetricsStats(): Promise<DashboardData['metrics']> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [sent, failed] = await Promise.all([
      this.prisma.emailQueue.count({
        where: {
          status: 'SENT',
          sentAt: { gte: last24h }
        }
      }),
      this.prisma.emailQueue.count({
        where: {
          status: 'FAILED',
          updatedAt: { gte: last24h }
        }
      })
    ]);

    const total = sent + failed;
    const successRate = total > 0 ? (sent / total) * 100 : 100;

    // Calculer la latence moyenne
    const sentEmails = await this.prisma.emailQueue.findMany({
      where: {
        status: 'SENT',
        sentAt: { gte: last24h },
        createdAt: { gte: last24h }
      },
      select: {
        createdAt: true,
        sentAt: true
      },
      take: 1000 // Limite pour performance
    });

    let avgLatency = 0;
    if (sentEmails.length > 0) {
      const totalLatency = sentEmails.reduce((sum, email) => {
        if (email.sentAt) {
          return sum + (email.sentAt.getTime() - email.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgLatency = totalLatency / sentEmails.length / 1000; // Convertir en secondes
    }

    return {
      sent24h: sent,
      failed24h: failed,
      successRate: Math.round(successRate * 100) / 100,
      avgLatency: Math.round(avgLatency * 100) / 100
    };
  }

  /**
   * Récupère l'état du circuit breaker
   */
  async getCircuitBreakerState(): Promise<DashboardData['circuitBreaker']> {
    if (!this.circuitBreaker) {
      return {
        state: 'CLOSED',
        failures: 0,
        successes: 0
      };
    }

    const state = this.circuitBreaker.getState();
    const metrics = this.circuitBreaker.getMetrics();

    return {
      state: state as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
      failures: metrics.failures,
      successes: metrics.successes
    };
  }

  /**
   * Récupère les statistiques du worker
   */
  async getWorkerStats(): Promise<DashboardData['worker']> {
    // Vérifier si le worker est actif en regardant les emails récemment traités
    const recentlyProcessed = await this.prisma.emailQueue.findFirst({
      where: {
        status: { in: ['SENT', 'FAILED'] },
        updatedAt: {
          gte: new Date(Date.now() - 60 * 1000) // Dernière minute
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculer le taux de traitement (emails/minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const processedLastMinute = await this.prisma.emailQueue.count({
      where: {
        status: { in: ['SENT', 'FAILED'] },
        updatedAt: { gte: oneMinuteAgo }
      }
    });

    return {
      active: !!recentlyProcessed,
      lastProcessed: recentlyProcessed?.updatedAt,
      processingRate: processedLastMinute
    };
  }

  /**
   * Récupère les erreurs récentes
   */
  async getRecentErrors(): Promise<DashboardData['recentErrors']> {
    const recentFailed = await this.prisma.emailQueue.findMany({
      where: {
        status: 'FAILED',
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        error: true,
        updatedAt: true
      }
    });

    return recentFailed.map(email => ({
      timestamp: email.updatedAt,
      error: email.error || 'Unknown error',
      emailId: email.id.toString()
    }));
  }

  /**
   * Récupère les données de séries temporelles
   */
  async getTimeSeriesData(hours: number = 24): Promise<TimeSeriesData[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    const interval = hours <= 24 ? 60 : 60 * 4; // 1h ou 4h selon la période

    const timeSlots: TimeSeriesData[] = [];
    const now = Date.now();

    for (let i = 0; i < hours * 60; i += interval) {
      const timestamp = new Date(now - i * 60 * 1000);
      const nextTimestamp = new Date(now - (i - interval) * 60 * 1000);

      const [sent, failed, pending] = await Promise.all([
        this.prisma.emailQueue.count({
          where: {
            status: 'SENT',
            sentAt: {
              gte: timestamp,
              lt: nextTimestamp
            }
          }
        }),
        this.prisma.emailQueue.count({
          where: {
            status: 'FAILED',
            updatedAt: {
              gte: timestamp,
              lt: nextTimestamp
            }
          }
        }),
        this.prisma.emailQueue.count({
          where: {
            status: 'PENDING',
            createdAt: {
              gte: timestamp,
              lt: nextTimestamp
            }
          }
        })
      ]);

      timeSlots.unshift({
        timestamp,
        sent,
        failed,
        pending
      });
    }

    return timeSlots;
  }

  /**
   * Récupère les statistiques par template
   */
  async getTemplateStats(hours: number = 24): Promise<TemplateStats[]> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const templates = await this.prisma.emailQueue.groupBy({
      by: ['template'],
      where: {
        createdAt: { gte: startTime }
      },
      _count: true
    });

    const stats: TemplateStats[] = [];

    for (const template of templates) {
      if (!template.template) continue;

      const [sent, failed] = await Promise.all([
        this.prisma.emailQueue.count({
          where: {
            template: template.template,
            status: 'SENT',
            sentAt: { gte: startTime }
          }
        }),
        this.prisma.emailQueue.count({
          where: {
            template: template.template,
            status: 'FAILED',
            updatedAt: { gte: startTime }
          }
        })
      ]);

      // Calculer durée moyenne
      const sentEmails = await this.prisma.emailQueue.findMany({
        where: {
          template: template.template,
          status: 'SENT',
          sentAt: { gte: startTime }
        },
        select: {
          createdAt: true,
          sentAt: true
        },
        take: 100
      });

      let avgDuration = 0;
      if (sentEmails.length > 0) {
        const totalDuration = sentEmails.reduce((sum, email) => {
          if (email.sentAt) {
            return sum + (email.sentAt.getTime() - email.createdAt.getTime());
          }
          return sum;
        }, 0);
        avgDuration = totalDuration / sentEmails.length / 1000;
      }

      const total = sent + failed;
      const successRate = total > 0 ? (sent / total) * 100 : 0;

      stats.push({
        template: template.template,
        sent,
        failed,
        successRate: Math.round(successRate * 100) / 100,
        avgDuration: Math.round(avgDuration * 100) / 100
      });
    }

    return stats.sort((a, b) => (b.sent + b.failed) - (a.sent + a.failed));
  }

  /**
   * Récupère les statistiques par priorité
   */
  async getPriorityStats(): Promise<PriorityStats[]> {
    const priorities = ['urgent', 'normal', 'low'];
    const stats: PriorityStats[] = [];

    for (const priority of priorities) {
      const [pending, processing] = await Promise.all([
        this.prisma.emailQueue.count({
          where: {
            priority,
            status: 'PENDING'
          }
        }),
        this.prisma.emailQueue.count({
          where: {
            priority,
            status: 'PROCESSING'
          }
        })
      ]);

      // Calculer temps d'attente moyen
      const pendingEmails = await this.prisma.emailQueue.findMany({
        where: {
          priority,
          status: 'PENDING'
        },
        select: {
          createdAt: true
        },
        take: 100
      });

      let avgWaitTime = 0;
      if (pendingEmails.length > 0) {
        const now = Date.now();
        const totalWaitTime = pendingEmails.reduce((sum, email) => {
          return sum + (now - email.createdAt.getTime());
        }, 0);
        avgWaitTime = totalWaitTime / pendingEmails.length / 1000;
      }

      stats.push({
        priority,
        pending,
        processing,
        avgWaitTime: Math.round(avgWaitTime * 100) / 100
      });
    }

    return stats;
  }

  /**
   * Récupère un résumé complet pour le dashboard
   */
  async getSummary() {
    const [
      dashboardData,
      timeSeries,
      templateStats,
      priorityStats
    ] = await Promise.all([
      this.getDashboardData(),
      this.getTimeSeriesData(24),
      this.getTemplateStats(24),
      this.getPriorityStats()
    ]);

    return {
      current: dashboardData,
      timeSeries,
      templates: templateStats,
      priorities: priorityStats,
      updatedAt: new Date()
    };
  }

  /**
   * Émet un événement personnalisé
   */
  emitEvent(event: DashboardEvent): void {
    this.emit('event', event);
  }

  /**
   * Récupère les dernières données en cache
   */
  getLastData(): DashboardData | null {
    return this.lastData;
  }

  /**
   * Force un rafraîchissement immédiat
   */
  async refresh(): Promise<DashboardData> {
    const data = await this.getDashboardData();
    this.emit('update', {
      type: 'metrics',
      data,
      timestamp: new Date()
    } as DashboardEvent);
    return data;
  }

  /**
   * Active ou désactive le dashboard
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stop();
    } else if (!this.refreshInterval) {
      this.start();
    }
  }

  /**
   * Vérifie si le dashboard est activé
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Nettoie les anciennes métriques
   */
  async cleanupOldMetrics(): Promise<number> {
    if (!this.config.metricsRetention) {
      return 0;
    }

    const cutoffDate = new Date(Date.now() - this.config.metricsRetention);

    const result = await this.prisma.emailQueue.deleteMany({
      where: {
        status: { in: ['SENT', 'FAILED', 'CANCELLED'] },
        updatedAt: { lt: cutoffDate }
      }
    });

    console.log(`🧹 [Dashboard] Cleaned ${result.count} old metrics`);
    return result.count;
  }
}

/**
 * Instance singleton du service de dashboard
 */
let dashboardServiceInstance: DashboardService | null = null;

/**
 * Récupère ou crée l'instance singleton
 */
export function getDashboardService(
  prisma: PrismaClient,
  metricsCollector: EmailMetricsCollector,
  config?: Partial<DashboardConfig>
): DashboardService {
  if (!dashboardServiceInstance) {
    dashboardServiceInstance = new DashboardService(prisma, metricsCollector, config);
  }
  return dashboardServiceInstance;
}

/**
 * Réinitialise l'instance singleton (pour tests)
 */
export function resetDashboardService(): void {
  if (dashboardServiceInstance) {
    dashboardServiceInstance.stop();
    dashboardServiceInstance = null;
  }
}
