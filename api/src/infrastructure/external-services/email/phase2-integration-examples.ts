/**
 * 🚀 Phase 2 Integration Examples
 *
 * Exemples pratiques d'utilisation des fonctionnalités Phase 2 :
 * - Métriques Prometheus
 * - Correlation IDs
 * - Système d'alertes
 * - Dashboard admin
 *
 * @module phase2-integration-examples
 * @since Phase 2
 */

import { PrismaClient } from '@prisma/client';
import {
  getMetricsCollector,
  measureDuration,
  exportMetricsSnapshot
} from './metrics-collector';
import {
  getCorrelationIdManager,
  withCorrelationId,
  getCurrentCorrelationId,
  createCorrelatedLogger,
  Traced
} from './correlation-id-manager';
import {
  AlertSystem,
  AlertType,
  AlertSeverity
} from './alert-system';
import { getDashboardService } from './dashboard-service';

// ============================================================================
// EXEMPLE 1 : Envoi d'Email avec Métriques et Tracing
// ============================================================================

/**
 * Exemple complet d'envoi d'email avec métriques et correlation ID
 */
export async function sendEmailWithFullMonitoring(
  emailService: any,
  recipient: string,
  templateName: string,
  variables: Record<string, any>,
  userId?: string
): Promise<void> {
  const metricsCollector = getMetricsCollector();

  // Exécuter avec correlation ID pour tracing
  await withCorrelationId(
    {
      operation: 'send_email',
      template: templateName,
      userId: userId,
      tags: {
        recipient_domain: recipient.split('@')[1]
      }
    },
    async () => {
      const logger = createCorrelatedLogger(console);
      const getDuration = measureDuration();

      // Logger enrichi avec correlation ID
      logger.info(`Starting email send to ${recipient}`);

      try {
        // Enregistrer l'email mis en queue
        metricsCollector.recordEmailQueued({
          priority: 'normal',
          template: templateName
        });

        // Envoyer l'email
        await emailService.send({
          to: recipient,
          templateTitle: templateName,
          variables
        });

        const duration = getDuration();

        // Enregistrer le succès
        metricsCollector.recordEmailSent({
          priority: 'normal',
          template: templateName
        }, duration);

        logger.info(`Email sent successfully in ${duration.toFixed(2)}s`);

      } catch (error) {
        const duration = getDuration();

        // Enregistrer l'échec
        metricsCollector.recordEmailFailed({
          priority: 'normal',
          template: templateName,
          error_type: error instanceof Error ? error.constructor.name : 'unknown'
        }, duration);

        logger.error(`Email failed after ${duration.toFixed(2)}s:`, error);
        throw error;
      }
    }
  );
}

// ============================================================================
// EXEMPLE 2 : Monitoring du Circuit Breaker avec Alertes
// ============================================================================

/**
 * Surveille le circuit breaker et envoie des alertes
 */
export async function monitorCircuitBreakerWithAlerts(
  circuitBreaker: any,
  alertSystem: AlertSystem
): Promise<void> {
  const metricsCollector = getMetricsCollector();
  const state = circuitBreaker.getState();
  const metrics = circuitBreaker.getMetrics();

  // Mettre à jour les métriques
  metricsCollector.updateCircuitBreakerState(state);

  // Envoyer une alerte si le circuit breaker est ouvert
  if (state === 'OPEN') {
    await alertSystem.sendAlert({
      type: AlertType.CIRCUIT_BREAKER_OPEN,
      severity: AlertSeverity.CRITICAL,
      title: '🚨 Circuit Breaker Ouvert',
      message: `Le circuit breaker du système d'email est passé en état OPEN suite à ${metrics.failures} échecs consécutifs.`,
      details: {
        failures: metrics.failures,
        lastError: metrics.lastError,
        state: state,
        timestamp: new Date().toISOString()
      },
      correlationId: getCurrentCorrelationId() || undefined
    });
  }

  // Alerte quand il passe en HALF_OPEN (récupération)
  if (state === 'HALF_OPEN') {
    await alertSystem.sendAlert({
      type: AlertType.CIRCUIT_BREAKER_HALF_OPEN,
      severity: AlertSeverity.WARNING,
      title: '⚠️ Circuit Breaker en Récupération',
      message: 'Le circuit breaker tente de se rétablir (état HALF_OPEN).',
      details: {
        failures: metrics.failures,
        successes: metrics.successes,
        state: state
      }
    });
  }
}

// ============================================================================
// EXEMPLE 3 : Worker avec Métriques Détaillées
// ============================================================================

/**
 * Worker qui traite la queue avec métriques complètes
 */
export async function emailWorkerWithMetrics(
  prisma: PrismaClient,
  emailService: any
): Promise<void> {
  const metricsCollector = getMetricsCollector();
  const correlationIdManager = getCorrelationIdManager();
  const logger = createCorrelatedLogger(console);

  // Marquer le worker comme actif
  metricsCollector.updateWorkerActive(true);

  try {
    // Récupérer les emails en attente
    const pendingEmails = await prisma.emailQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' }
      ],
      take: 10
    });

    // Mettre à jour les statistiques de la queue
    const queueStats = await getQueueStatistics(prisma);
    metricsCollector.updateQueueSize('urgent', 'pending', queueStats.urgent);
    metricsCollector.updateQueueSize('normal', 'pending', queueStats.normal);
    metricsCollector.updateQueueSize('low', 'pending', queueStats.low);
    metricsCollector.updateEmailsInProgress(queueStats.processing);
    metricsCollector.updateStuckEmails(queueStats.stuck);

    // Traiter chaque email
    for (const email of pendingEmails) {
      // Créer un nouveau correlation ID pour chaque email
      const correlationId = correlationIdManager.generateId();

      await correlationIdManager.runWithIdAsync(
        correlationId,
        {
          operation: 'process_email',
          emailId: email.id.toString(),
          template: email.template || undefined,
          priority: email.priority as any
        },
        async () => {
          const getDuration = measureDuration();
          const queueWaitTime = (Date.now() - email.createdAt.getTime()) / 1000;

          logger.info(`Processing email ${email.id}`);

          // Enregistrer le temps d'attente en queue
          metricsCollector.recordQueueWaitTime(email.priority, queueWaitTime);

          try {
            // Marquer comme en traitement
            await prisma.emailQueue.update({
              where: { id: email.id },
              data: { status: 'PROCESSING' }
            });

            // Envoyer l'email
            await emailService.send({
              to: email.to,
              subject: email.subject,
              message: email.message,
              templateId: email.templateId || undefined
            });

            const duration = getDuration();

            // Marquer comme envoyé
            await prisma.emailQueue.update({
              where: { id: email.id },
              data: {
                status: 'SENT',
                sentAt: new Date()
              }
            });

            // Métriques de succès
            metricsCollector.recordEmailSent({
              priority: email.priority as any,
              template: email.template || 'unknown'
            }, duration);

            if (email.template) {
              const emailSize = JSON.stringify(email).length;
              metricsCollector.recordEmailSize(email.template, emailSize);
            }

            logger.info(`Email ${email.id} sent in ${duration.toFixed(2)}s`);

          } catch (error) {
            const duration = getDuration();

            logger.error(`Email ${email.id} failed:`, error);

            // Incrémenter les tentatives
            const newAttempts = email.attempts + 1;

            // Enregistrer la tentative
            metricsCollector.recordEmailRetry({
              priority: email.priority as any,
              template: email.template || 'unknown'
            }, newAttempts);

            // Métriques d'échec
            metricsCollector.recordEmailFailed({
              priority: email.priority as any,
              template: email.template || 'unknown',
              error_type: error instanceof Error ? error.constructor.name : 'unknown'
            }, duration);

            // Marquer comme échoué si max tentatives atteint
            if (newAttempts >= 5) {
              await prisma.emailQueue.update({
                where: { id: email.id },
                data: {
                  status: 'FAILED',
                  error: error instanceof Error ? error.message : 'Unknown error',
                  attempts: newAttempts
                }
              });
            } else {
              // Réessayer plus tard
              await prisma.emailQueue.update({
                where: { id: email.id },
                data: {
                  status: 'PENDING',
                  attempts: newAttempts,
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              });
            }
          }
        }
      );
    }

    // Calculer le taux de traitement (emails/minute)
    const processingRate = await calculateProcessingRate(prisma);
    metricsCollector.updateProcessingRate(processingRate);

  } finally {
    // Le worker reste actif même en cas d'erreur
    metricsCollector.updateWorkerActive(true);
  }
}

// ============================================================================
// EXEMPLE 4 : Surveillance de la Queue avec Alertes
// ============================================================================

/**
 * Surveille la queue et envoie des alertes si nécessaire
 */
export async function monitorQueueHealth(
  prisma: PrismaClient,
  alertSystem: AlertSystem
): Promise<void> {
  const stats = await getQueueStatistics(prisma);

  // Alerte si trop d'emails bloqués
  if (stats.stuck > 50) {
    await alertSystem.sendAlert({
      type: AlertType.STUCK_EMAILS,
      severity: AlertSeverity.CRITICAL,
      title: '🚨 Emails Bloqués Détectés',
      message: `${stats.stuck} emails sont bloqués en traitement depuis plus de 10 minutes.`,
      details: {
        stuck: stats.stuck,
        processing: stats.processing,
        pending: stats.total
      }
    });
  }

  // Alerte si la queue est saturée
  if (stats.total > 1000) {
    await alertSystem.sendAlert({
      type: AlertType.QUEUE_SATURATED,
      severity: AlertSeverity.WARNING,
      title: '⚠️ Queue Saturée',
      message: `La queue contient ${stats.total} emails en attente. Le système risque de prendre du retard.`,
      details: {
        total: stats.total,
        pending: stats.pending,
        processing: stats.processing,
        byPriority: {
          urgent: stats.urgent,
          normal: stats.normal,
          low: stats.low
        }
      }
    });
  }

  // Alerte si taux d'échec élevé
  const failureRate = await calculateFailureRate(prisma);
  if (failureRate > 10) {
    await alertSystem.sendAlert({
      type: AlertType.HIGH_FAILURE_RATE,
      severity: AlertSeverity.ERROR,
      title: '❌ Taux d\'Échec Élevé',
      message: `Le taux d'échec est de ${failureRate.toFixed(1)}% sur la dernière heure.`,
      details: {
        failureRate: `${failureRate.toFixed(1)}%`,
        period: '1 hour'
      }
    });
  }
}

// ============================================================================
// EXEMPLE 5 : Dashboard avec WebSocket Updates
// ============================================================================

/**
 * Initialise le dashboard avec mises à jour en temps réel
 */
export function setupDashboardWithWebSocket(
  prisma: PrismaClient,
  io: any // Socket.IO instance
): void {
  const metricsCollector = getMetricsCollector();
  const dashboardService = getDashboardService(prisma, metricsCollector, {
    enabled: true,
    refreshInterval: 5000 // 5 secondes
  });

  // Démarrer le service
  dashboardService.start();

  // Écouter les mises à jour
  dashboardService.on('update', (event) => {
    // Broadcaster vers tous les clients WebSocket
    io.emit('dashboard:update', event);
  });

  // Écouter les connexions WebSocket
  io.on('connection', (socket: any) => {
    console.log('📊 Dashboard client connected');

    // Envoyer les données actuelles immédiatement
    const lastData = dashboardService.getLastData();
    if (lastData) {
      socket.emit('dashboard:update', {
        type: 'metrics',
        data: lastData,
        timestamp: new Date()
      });
    }

    // Permettre au client de forcer un refresh
    socket.on('dashboard:refresh', async () => {
      const data = await dashboardService.refresh();
      socket.emit('dashboard:update', {
        type: 'metrics',
        data,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log('📊 Dashboard client disconnected');
    });
  });
}

// ============================================================================
// EXEMPLE 6 : Classe Service avec Décorateurs
// ============================================================================

/**
 * Service d'email avec tracing automatique via décorateurs
 */
export class TracedEmailService {
  constructor(private emailService: any) {}

  /**
   * Envoie un email avec tracing automatique
   */
  @Traced('send_welcome_email')
  async sendWelcomeEmail(userId: string, email: string, name: string): Promise<void> {
    const manager = getCorrelationIdManager();
    manager.updateMetadata({ userId, template: 'bienvenue' });

    await this.emailService.send({
      to: email,
      templateTitle: 'bienvenue',
      variables: { userName: name }
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  @Traced('send_password_reset')
  async sendPasswordReset(userId: string, email: string, resetToken: string): Promise<void> {
    const manager = getCorrelationIdManager();
    manager.updateMetadata({ userId, template: 'reset-password' });

    await this.emailService.send({
      to: email,
      templateTitle: 'reset-password',
      variables: { resetUrl: `https://example.com/reset?token=${resetToken}` }
    });
  }

  /**
   * Envoie un email de confirmation de commande
   */
  @Traced('send_order_confirmation')
  async sendOrderConfirmation(
    userId: string,
    email: string,
    orderNumber: string,
    orderDetails: any
  ): Promise<void> {
    const manager = getCorrelationIdManager();
    manager.updateMetadata({ userId, template: 'confirmation-commande' });
    manager.addTag('order_number', orderNumber);

    await this.emailService.send({
      to: email,
      templateTitle: 'confirmation-commande',
      variables: {
        userName: orderDetails.userName,
        numeroCommande: orderNumber,
        dateCommande: orderDetails.date,
        totalCommande: orderDetails.total
      }
    });
  }
}

// ============================================================================
// EXEMPLE 7 : Export de Métriques pour Analyse
// ============================================================================

/**
 * Exporte les métriques dans différents formats
 */
export async function exportMetricsForAnalysis(): Promise<{
  prometheus: string;
  json: any;
  summary: any;
}> {
  const metricsCollector = getMetricsCollector();

  // Format Prometheus (pour scraping)
  const prometheus = await metricsCollector.getMetrics();

  // Format JSON (pour debugging)
  const snapshot = await exportMetricsSnapshot(metricsCollector);

  // Résumé simplifié
  const summary = {
    exportedAt: new Date(),
    metrics: await metricsCollector.getSnapshot()
  };

  return { prometheus, json: snapshot, summary };
}

// ============================================================================
// EXEMPLE 8 : Intégration Complète dans Express
// ============================================================================

/**
 * Configuration complète de Phase 2 dans une app Express
 */
export function setupPhase2Monitoring(app: any, prisma: PrismaClient): void {
  // 1. Middleware Correlation ID (doit être en premier)
  const correlationIdManager = getCorrelationIdManager({
    enabled: process.env.CORRELATION_ID_ENABLED === 'true',
    headerName: 'X-Correlation-ID',
    prefix: process.env.CORRELATION_ID_PREFIX || 'email'
  });
  app.use(correlationIdManager.expressMiddleware());

  // 2. Initialiser les métriques
  const metricsCollector = getMetricsCollector({
    enabled: process.env.METRICS_ENABLED === 'true',
    prefix: process.env.METRICS_PREFIX || 'email_',
    defaultLabels: {
      app: 'clubmanager',
      env: process.env.NODE_ENV || 'development'
    }
  });

  // 3. Initialiser le dashboard
  const dashboardService = getDashboardService(prisma, metricsCollector, {
    enabled: process.env.DASHBOARD_ENABLED === 'true',
    refreshInterval: parseInt(process.env.DASHBOARD_REFRESH_INTERVAL || '5000'),
    metricsRetention: parseInt(process.env.DASHBOARD_METRICS_RETENTION || '86400000')
  });
  dashboardService.start();

  // 4. Initialiser le système d'alertes
  const alertSystem = new AlertSystem({
    enabled: process.env.SLACK_ALERTS_ENABLED === 'true' || process.env.DISCORD_ALERTS_ENABLED === 'true',
    slack: {
      enabled: process.env.SLACK_ALERTS_ENABLED === 'true',
      webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      channel: process.env.SLACK_CHANNEL || '#email-alerts',
      username: process.env.SLACK_USERNAME || 'Email System'
    },
    discord: {
      enabled: process.env.DISCORD_ALERTS_ENABLED === 'true',
      webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
      username: process.env.DISCORD_USERNAME || 'Email System'
    },
    rateLimit: {
      maxAlertsPerHour: parseInt(process.env.ALERT_MAX_PER_HOUR || '10'),
      cooldownMinutes: parseInt(process.env.ALERT_COOLDOWN_MINUTES || '5')
    }
  });

  // 5. Logger les événements du dashboard
  dashboardService.on('update', (event) => {
    console.log('📊 Dashboard updated:', event.type);
  });

  console.log('✅ Phase 2 monitoring initialized');
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère les statistiques de la queue
 */
async function getQueueStatistics(prisma: PrismaClient) {
  const [pending, processing, stuck, urgent, normal, low] = await Promise.all([
    prisma.emailQueue.count({ where: { status: 'PENDING' } }),
    prisma.emailQueue.count({ where: { status: 'PROCESSING' } }),
    prisma.emailQueue.count({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) }
      }
    }),
    prisma.emailQueue.count({ where: { status: 'PENDING', priority: 'urgent' } }),
    prisma.emailQueue.count({ where: { status: 'PENDING', priority: 'normal' } }),
    prisma.emailQueue.count({ where: { status: 'PENDING', priority: 'low' } })
  ]);

  return {
    total: pending + processing,
    pending,
    processing,
    stuck,
    urgent,
    normal,
    low
  };
}

/**
 * Calcule le taux de traitement (emails/minute)
 */
async function calculateProcessingRate(prisma: PrismaClient): Promise<number> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const processed = await prisma.emailQueue.count({
    where: {
      status: { in: ['SENT', 'FAILED'] },
      updatedAt: { gte: oneMinuteAgo }
    }
  });
  return processed;
}

/**
 * Calcule le taux d'échec sur la dernière heure (en %)
 */
async function calculateFailureRate(prisma: PrismaClient): Promise<number> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [sent, failed] = await Promise.all([
    prisma.emailQueue.count({
      where: {
        status: 'SENT',
        sentAt: { gte: oneHourAgo }
      }
    }),
    prisma.emailQueue.count({
      where: {
        status: 'FAILED',
        updatedAt: { gte: oneHourAgo }
      }
    })
  ]);

  const total = sent + failed;
  return total > 0 ? (failed / total) * 100 : 0;
}
