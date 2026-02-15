/**
 * 📊 Email Metrics Collector (Prometheus)
 *
 * Collecte et expose des métriques détaillées pour le système d'email :
 * - Emails envoyés/échoués (par priorité, template, etc.)
 * - Latence d'envoi
 * - État de la queue
 * - État du circuit breaker
 * - Performance du worker
 *
 * @module metrics-collector
 * @since Phase 2
 */

import { Registry, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

/**
 * Interface pour les labels des métriques d'email
 */
interface EmailMetricLabels {
  priority?: 'urgent' | 'normal' | 'low';
  template?: string;
  status?: 'success' | 'failure' | 'pending' | 'cancelled';
  error_type?: string;
  circuit_breaker_state?: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

/**
 * Configuration des métriques
 */
interface MetricsConfig {
  enabled: boolean;
  defaultLabels?: Record<string, string>;
  prefix?: string;
}

/**
 * Collecteur de métriques Prometheus pour le système d'email
 */
export class EmailMetricsCollector {
  private registry: Registry;
  private config: MetricsConfig;

  // === Counters ===
  private emailsSentTotal: Counter<string>;
  private emailsFailedTotal: Counter<string>;
  private emailsQueuedTotal: Counter<string>;
  private emailsCancelledTotal: Counter<string>;
  private emailRetriesTotal: Counter<string>;

  // === Gauges ===
  private emailsInQueue: Gauge<string>;
  private emailsInProgress: Gauge<string>;
  private emailsStuck: Gauge<string>;
  private circuitBreakerState: Gauge<string>;
  private workerActive: Gauge<string>;
  private queueProcessingRate: Gauge<string>;

  // === Histograms ===
  private emailSendDuration: Histogram<string>;
  private queueWaitTime: Histogram<string>;
  private emailSize: Histogram<string>;

  constructor(config: Partial<MetricsConfig> = {}) {
    this.config = {
      enabled: true,
      prefix: 'email_',
      ...config
    };

    // Créer un nouveau registre
    this.registry = new Registry();

    // Ajouter les labels par défaut
    if (this.config.defaultLabels) {
      this.registry.setDefaultLabels(this.config.defaultLabels);
    }

    // Collecter les métriques système par défaut
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'nodejs_'
    });

    // Initialiser les métriques
    this.initializeMetrics();
  }

  /**
   * Initialise toutes les métriques Prometheus
   */
  private initializeMetrics(): void {
    const prefix = this.config.prefix || '';

    // === COUNTERS ===

    this.emailsSentTotal = new Counter({
      name: `${prefix}sent_total`,
      help: 'Total number of emails successfully sent',
      labelNames: ['priority', 'template'],
      registers: [this.registry]
    });

    this.emailsFailedTotal = new Counter({
      name: `${prefix}failed_total`,
      help: 'Total number of emails that failed to send',
      labelNames: ['priority', 'template', 'error_type'],
      registers: [this.registry]
    });

    this.emailsQueuedTotal = new Counter({
      name: `${prefix}queued_total`,
      help: 'Total number of emails added to queue',
      labelNames: ['priority', 'template'],
      registers: [this.registry]
    });

    this.emailsCancelledTotal = new Counter({
      name: `${prefix}cancelled_total`,
      help: 'Total number of emails cancelled',
      labelNames: ['priority', 'template'],
      registers: [this.registry]
    });

    this.emailRetriesTotal = new Counter({
      name: `${prefix}retries_total`,
      help: 'Total number of email send retries',
      labelNames: ['priority', 'template', 'attempt'],
      registers: [this.registry]
    });

    // === GAUGES ===

    this.emailsInQueue = new Gauge({
      name: `${prefix}queue_size`,
      help: 'Current number of emails in queue',
      labelNames: ['priority', 'status'],
      registers: [this.registry]
    });

    this.emailsInProgress = new Gauge({
      name: `${prefix}in_progress`,
      help: 'Number of emails currently being processed',
      registers: [this.registry]
    });

    this.emailsStuck = new Gauge({
      name: `${prefix}stuck_count`,
      help: 'Number of emails stuck in processing',
      registers: [this.registry]
    });

    this.circuitBreakerState = new Gauge({
      name: `${prefix}circuit_breaker_state`,
      help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
      labelNames: ['state'],
      registers: [this.registry]
    });

    this.workerActive = new Gauge({
      name: `${prefix}worker_active`,
      help: 'Whether the email worker is active (1=active, 0=inactive)',
      registers: [this.registry]
    });

    this.queueProcessingRate = new Gauge({
      name: `${prefix}queue_processing_rate`,
      help: 'Number of emails processed per minute',
      registers: [this.registry]
    });

    // === HISTOGRAMS ===

    this.emailSendDuration = new Histogram({
      name: `${prefix}send_duration_seconds`,
      help: 'Duration of email send operations',
      labelNames: ['priority', 'template', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30], // secondes
      registers: [this.registry]
    });

    this.queueWaitTime = new Histogram({
      name: `${prefix}queue_wait_time_seconds`,
      help: 'Time an email waits in queue before processing',
      labelNames: ['priority'],
      buckets: [1, 5, 10, 30, 60, 300, 600, 1800], // secondes
      registers: [this.registry]
    });

    this.emailSize = new Histogram({
      name: `${prefix}size_bytes`,
      help: 'Size of email content in bytes',
      labelNames: ['template'],
      buckets: [1024, 5120, 10240, 51200, 102400, 512000], // bytes
      registers: [this.registry]
    });
  }

  /**
   * Enregistre un email envoyé avec succès
   */
  recordEmailSent(labels: EmailMetricLabels, durationSeconds: number): void {
    if (!this.config.enabled) return;

    this.emailsSentTotal.inc({
      priority: labels.priority || 'normal',
      template: labels.template || 'unknown'
    });

    this.emailSendDuration.observe(
      {
        priority: labels.priority || 'normal',
        template: labels.template || 'unknown',
        status: 'success'
      },
      durationSeconds
    );
  }

  /**
   * Enregistre un échec d'envoi d'email
   */
  recordEmailFailed(labels: EmailMetricLabels, durationSeconds: number): void {
    if (!this.config.enabled) return;

    this.emailsFailedTotal.inc({
      priority: labels.priority || 'normal',
      template: labels.template || 'unknown',
      error_type: labels.error_type || 'unknown'
    });

    this.emailSendDuration.observe(
      {
        priority: labels.priority || 'normal',
        template: labels.template || 'unknown',
        status: 'failure'
      },
      durationSeconds
    );
  }

  /**
   * Enregistre un email ajouté à la queue
   */
  recordEmailQueued(labels: EmailMetricLabels): void {
    if (!this.config.enabled) return;

    this.emailsQueuedTotal.inc({
      priority: labels.priority || 'normal',
      template: labels.template || 'unknown'
    });
  }

  /**
   * Enregistre un email annulé
   */
  recordEmailCancelled(labels: EmailMetricLabels): void {
    if (!this.config.enabled) return;

    this.emailsCancelledTotal.inc({
      priority: labels.priority || 'normal',
      template: labels.template || 'unknown'
    });
  }

  /**
   * Enregistre une tentative de réessai
   */
  recordEmailRetry(labels: EmailMetricLabels, attemptNumber: number): void {
    if (!this.config.enabled) return;

    this.emailRetriesTotal.inc({
      priority: labels.priority || 'normal',
      template: labels.template || 'unknown',
      attempt: attemptNumber.toString()
    });
  }

  /**
   * Met à jour la taille de la queue
   */
  updateQueueSize(priority: string, status: string, count: number): void {
    if (!this.config.enabled) return;

    this.emailsInQueue.set({ priority, status }, count);
  }

  /**
   * Met à jour le nombre d'emails en cours de traitement
   */
  updateEmailsInProgress(count: number): void {
    if (!this.config.enabled) return;

    this.emailsInProgress.set(count);
  }

  /**
   * Met à jour le nombre d'emails bloqués
   */
  updateStuckEmails(count: number): void {
    if (!this.config.enabled) return;

    this.emailsStuck.set(count);
  }

  /**
   * Met à jour l'état du circuit breaker
   * @param state - État actuel (CLOSED=0, OPEN=1, HALF_OPEN=2)
   */
  updateCircuitBreakerState(state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'): void {
    if (!this.config.enabled) return;

    const stateValue = { CLOSED: 0, OPEN: 1, HALF_OPEN: 2 }[state];
    this.circuitBreakerState.set({ state }, stateValue);
  }

  /**
   * Met à jour l'état du worker
   */
  updateWorkerActive(active: boolean): void {
    if (!this.config.enabled) return;

    this.workerActive.set(active ? 1 : 0);
  }

  /**
   * Met à jour le taux de traitement de la queue
   */
  updateProcessingRate(emailsPerMinute: number): void {
    if (!this.config.enabled) return;

    this.queueProcessingRate.set(emailsPerMinute);
  }

  /**
   * Enregistre le temps d'attente d'un email dans la queue
   */
  recordQueueWaitTime(priority: string, waitTimeSeconds: number): void {
    if (!this.config.enabled) return;

    this.queueWaitTime.observe({ priority }, waitTimeSeconds);
  }

  /**
   * Enregistre la taille d'un email
   */
  recordEmailSize(template: string, sizeBytes: number): void {
    if (!this.config.enabled) return;

    this.emailSize.observe({ template }, sizeBytes);
  }

  /**
   * Récupère les métriques au format Prometheus
   */
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  /**
   * Récupère le registre Prometheus
   */
  getRegistry(): Registry {
    return this.registry;
  }

  /**
   * Réinitialise toutes les métriques (utile pour les tests)
   */
  reset(): void {
    this.registry.clear();
    this.initializeMetrics();
  }

  /**
   * Récupère un snapshot des métriques actuelles
   */
  async getSnapshot(): Promise<Record<string, any>> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics.reduce((acc, metric) => {
      acc[metric.name] = metric;
      return acc;
    }, {} as Record<string, any>);
  }

  /**
   * Active ou désactive la collecte de métriques
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Vérifie si la collecte de métriques est activée
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

/**
 * Instance singleton du collecteur de métriques
 */
let metricsCollectorInstance: EmailMetricsCollector | null = null;

/**
 * Récupère ou crée l'instance singleton du collecteur de métriques
 */
export function getMetricsCollector(config?: Partial<MetricsConfig>): EmailMetricsCollector {
  if (!metricsCollectorInstance) {
    metricsCollectorInstance = new EmailMetricsCollector(config);
  }
  return metricsCollectorInstance;
}

/**
 * Réinitialise l'instance singleton (utile pour les tests)
 */
export function resetMetricsCollector(): void {
  if (metricsCollectorInstance) {
    metricsCollectorInstance.reset();
    metricsCollectorInstance = null;
  }
}

/**
 * Helper pour mesurer la durée d'une opération
 */
export function measureDuration(): () => number {
  const start = Date.now();
  return () => (Date.now() - start) / 1000; // retourne en secondes
}

/**
 * Type pour les métriques exportées
 */
export interface MetricsSnapshot {
  timestamp: Date;
  metrics: Record<string, any>;
}

/**
 * Exporte un snapshot complet des métriques avec timestamp
 */
export async function exportMetricsSnapshot(collector: EmailMetricsCollector): Promise<MetricsSnapshot> {
  return {
    timestamp: new Date(),
    metrics: await collector.getSnapshot()
  };
}
