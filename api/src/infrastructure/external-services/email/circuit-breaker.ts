/**
 * Circuit Breaker pour SendGrid
 *
 * Implémente le pattern Circuit Breaker pour protéger l'application
 * contre les pannes de SendGrid et éviter les surcharges.
 *
 * États :
 * - CLOSED : Tout fonctionne, requêtes passent normalement
 * - OPEN : Trop d'échecs, circuit coupé, requêtes bloquées
 * - HALF_OPEN : Test après timeout, essai d'une requête
 */

export class CircuitBreakerOpenError extends Error {
  constructor(
    message: string,
    public readonly nextAttemptTime: Date,
    public readonly state: CircuitBreakerState,
  ) {
    super(message);
    this.name = 'CircuitBreakerOpenError';
  }
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Nombre d'échecs avant ouverture
  successThreshold: number; // Nombre de succès pour fermer en HALF_OPEN
  timeout: number; // Temps d'attente avant réessai (ms)
  monitoringWindow: number; // Fenêtre de surveillance des échecs (ms)
}

export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  nextAttemptTime: Date | null;
  lastFailureTime: Date | null;
  lastSuccessTime: Date | null;
  totalFailures: number;
  totalSuccesses: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5, // Ouvrir après 5 échecs
  successThreshold: 2, // Fermer après 2 succès consécutifs
  timeout: 5 * 60 * 1000, // 5 minutes
  monitoringWindow: 60 * 1000, // 1 minute
};

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime: number | null = null;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;

  // Statistiques globales
  private totalFailures = 0;
  private totalSuccesses = 0;
  private totalRequests = 0;

  // Historique des échecs récents
  private recentFailures: Array<{ timestamp: number; error: string }> = [];

  constructor(
    private readonly config: CircuitBreakerConfig = DEFAULT_CONFIG,
    private readonly name: string = 'CircuitBreaker',
  ) {
    console.log(
      `🔌 [${this.name}] Initialized with config:`,
      JSON.stringify(config, null, 2),
    );
  }

  /**
   * Exécute une fonction en passant par le circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    // Nettoyer les échecs anciens
    this.cleanOldFailures();

    // État OPEN : Circuit coupé
    if (this.state === 'OPEN') {
      const now = Date.now();

      if (this.nextAttemptTime && now < this.nextAttemptTime) {
        const remainingMs = this.nextAttemptTime - now;
        const remainingSec = Math.ceil(remainingMs / 1000);

        throw new CircuitBreakerOpenError(
          `⛔ [${this.name}] Circuit is OPEN. Service unavailable. Next attempt in ${remainingSec}s`,
          new Date(this.nextAttemptTime),
          this.state,
        );
      }

      // Timeout écoulé : passer en HALF_OPEN
      this.transitionTo('HALF_OPEN');
      console.log(`⚡ [${this.name}] OPEN → HALF_OPEN (testing connection)`);
    }

    try {
      // Exécuter la fonction
      const result = await fn();

      // Succès !
      this.onSuccess();
      return result;
    } catch (error) {
      // Échec
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Appelé en cas de succès
   */
  private onSuccess(): void {
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();
    this.failureCount = 0; // Reset le compteur d'échecs

    if (this.state === 'HALF_OPEN') {
      this.successCount++;

      console.log(
        `✅ [${this.name}] Success in HALF_OPEN (${this.successCount}/${this.config.successThreshold})`,
      );

      if (this.successCount >= this.config.successThreshold) {
        // Assez de succès : fermer le circuit
        this.transitionTo('CLOSED');
        this.successCount = 0;
        console.log(
          `✅ [${this.name}] HALF_OPEN → CLOSED (service recovered)`,
        );
      }
    } else if (this.state === 'CLOSED') {
      // Tout va bien, rien de spécial
      console.log(`✅ [${this.name}] Request successful (state: CLOSED)`);
    }
  }

  /**
   * Appelé en cas d'échec
   */
  private onFailure(error: any): void {
    this.totalFailures++;
    this.lastFailureTime = Date.now();
    this.successCount = 0; // Reset le compteur de succès

    // Enregistrer l'échec
    this.recentFailures.push({
      timestamp: Date.now(),
      error: error?.message || 'Unknown error',
    });

    // Limiter l'historique
    if (this.recentFailures.length > 100) {
      this.recentFailures = this.recentFailures.slice(-50);
    }

    if (this.state === 'HALF_OPEN') {
      // Échec en HALF_OPEN : réouvrir immédiatement
      this.transitionTo('OPEN');
      this.nextAttemptTime = Date.now() + this.config.timeout;

      console.error(
        `❌ [${this.name}] Failure in HALF_OPEN → OPEN (service still unavailable)`,
      );
      console.error(`⏰ [${this.name}] Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`);
    } else if (this.state === 'CLOSED') {
      this.failureCount++;

      console.error(
        `❌ [${this.name}] Failure in CLOSED (${this.failureCount}/${this.config.failureThreshold})`,
      );

      if (this.failureCount >= this.config.failureThreshold) {
        // Trop d'échecs : ouvrir le circuit
        this.transitionTo('OPEN');
        this.nextAttemptTime = Date.now() + this.config.timeout;

        console.error(
          `⛔ [${this.name}] CLOSED → OPEN (failure threshold reached: ${this.failureCount} failures)`,
        );
        console.error(`⏰ [${this.name}] Next attempt at ${new Date(this.nextAttemptTime).toISOString()}`);

        // Alerter l'admin
        this.alertAdmin();
      }
    }
  }

  /**
   * Nettoie les échecs anciens hors de la fenêtre de surveillance
   */
  private cleanOldFailures(): void {
    const cutoffTime = Date.now() - this.config.monitoringWindow;
    this.recentFailures = this.recentFailures.filter(
      (f) => f.timestamp >= cutoffTime,
    );
  }

  /**
   * Change l'état du circuit
   */
  private transitionTo(newState: CircuitBreakerState): void {
    const oldState = this.state;
    this.state = newState;

    if (newState === 'CLOSED') {
      this.failureCount = 0;
      this.successCount = 0;
      this.nextAttemptTime = null;
    } else if (newState === 'OPEN') {
      this.successCount = 0;
    } else if (newState === 'HALF_OPEN') {
      this.successCount = 0;
      this.failureCount = 0;
    }

    console.log(`🔄 [${this.name}] State transition: ${oldState} → ${newState}`);
  }

  /**
   * Alerte l'administrateur (à implémenter selon vos besoins)
   */
  private alertAdmin(): void {
    const alert = {
      level: 'critical',
      service: this.name,
      message: `Circuit Breaker is OPEN - Service unavailable`,
      failureCount: this.failureCount,
      recentErrors: this.recentFailures.slice(-5),
      nextAttemptTime: this.nextAttemptTime
        ? new Date(this.nextAttemptTime).toISOString()
        : null,
    };

    console.error('🚨 [ALERT]', JSON.stringify(alert, null, 2));

    // TODO: Implémenter notification (email, Slack, Discord, etc.)
    // Exemples :
    // - await sendSlackNotification(alert);
    // - await sendEmailToAdmin(alert);
    // - await sendDiscordWebhook(alert);
  }

  /**
   * Obtenir le statut actuel du circuit breaker
   */
  getStatus(): CircuitBreakerStatus {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime
        ? new Date(this.nextAttemptTime)
        : null,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime)
        : null,
      lastSuccessTime: this.lastSuccessTime
        ? new Date(this.lastSuccessTime)
        : null,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Obtenir les métriques détaillées
   */
  getMetrics() {
    const recentFailuresCount = this.recentFailures.length;
    const failureRate =
      this.totalRequests > 0
        ? ((this.totalFailures / this.totalRequests) * 100).toFixed(2)
        : '0.00';

    return {
      state: this.state,
      counts: {
        totalRequests: this.totalRequests,
        totalSuccesses: this.totalSuccesses,
        totalFailures: this.totalFailures,
        recentFailures: recentFailuresCount,
      },
      rates: {
        failureRate: `${failureRate}%`,
        successRate: `${(100 - parseFloat(failureRate)).toFixed(2)}%`,
      },
      current: {
        failureCount: this.failureCount,
        successCount: this.successCount,
      },
      thresholds: {
        failureThreshold: this.config.failureThreshold,
        successThreshold: this.config.successThreshold,
      },
      timing: {
        nextAttemptTime: this.nextAttemptTime
          ? new Date(this.nextAttemptTime).toISOString()
          : null,
        lastFailureTime: this.lastFailureTime
          ? new Date(this.lastFailureTime).toISOString()
          : null,
        lastSuccessTime: this.lastSuccessTime
          ? new Date(this.lastSuccessTime).toISOString()
          : null,
      },
      recentErrors: this.recentFailures
        .slice(-10)
        .map((f) => ({
          timestamp: new Date(f.timestamp).toISOString(),
          error: f.error,
        })),
    };
  }

  /**
   * Réinitialiser le circuit breaker (pour tests ou forcer reset)
   */
  reset(): void {
    console.log(`🔄 [${this.name}] Manual reset`);
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;
    this.recentFailures = [];
  }

  /**
   * Forcer l'ouverture du circuit (pour tests ou maintenance)
   */
  forceOpen(durationMs?: number): void {
    console.warn(`⚠️ [${this.name}] Force OPEN for ${durationMs || this.config.timeout}ms`);
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + (durationMs || this.config.timeout);
  }

  /**
   * Forcer la fermeture du circuit (pour tests ou récupération manuelle)
   */
  forceClose(): void {
    console.log(`✅ [${this.name}] Force CLOSED`);
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = null;
  }
}

// Instance singleton pour SendGrid
export const sendGridCircuitBreaker = new CircuitBreaker(
  {
    failureThreshold: 5, // 5 échecs consécutifs
    successThreshold: 2, // 2 succès pour récupérer
    timeout: 5 * 60 * 1000, // 5 minutes
    monitoringWindow: 60 * 1000, // 1 minute
  },
  'SendGrid',
);

// Helper pour vérifier si le circuit est ouvert
export function isCircuitOpen(): boolean {
  return sendGridCircuitBreaker.getStatus().state === 'OPEN';
}

// Helper pour obtenir le statut
export function getCircuitStatus(): CircuitBreakerStatus {
  return sendGridCircuitBreaker.getStatus();
}
