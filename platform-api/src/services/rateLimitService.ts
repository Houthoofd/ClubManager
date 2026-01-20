/**
 * Service de Rate Limiting
 * Note: Cette version utilise la mémoire. Pour la production, utilisez Redis.
 */

interface RateLimitConfig {
  requests: number;
  windowMs: number; // en millisecondes
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

// Configuration des limites par plan
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  ANONYMOUS: { requests: 10, windowMs: 15 * 60 * 1000 },      // 10 req/15min
  FREE: { requests: 100, windowMs: 15 * 60 * 1000 },          // 100 req/15min
  BASIC: { requests: 500, windowMs: 15 * 60 * 1000 },         // 500 req/15min
  PREMIUM: { requests: 2000, windowMs: 15 * 60 * 1000 },      // 2000 req/15min
  ENTERPRISE: { requests: 10000, windowMs: 15 * 60 * 1000 },  // 10k req/15min
  API: { requests: 100, windowMs: 15 * 60 * 1000 },           // 100 req/15min pour API publique
};

// Store en mémoire (À REMPLACER PAR REDIS EN PRODUCTION)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

class RateLimitService {
  private store: RateLimitStore = {};

  /**
   * Vérifier la limite de taux
   */
  async checkLimit(
    tenantId: string,
    identifier: string,
    plan: string
  ): Promise<RateLimitResult> {
    const config = RATE_LIMITS[plan] || RATE_LIMITS.BASIC;
    const key = `${tenantId}:${identifier}`;
    const now = Date.now();

    // Initialiser ou récupérer l'entrée
    if (!this.store[key] || this.store[key].resetAt < now) {
      this.store[key] = {
        count: 0,
        resetAt: now + config.windowMs,
      };
    }

    const entry = this.store[key];
    entry.count++;

    const allowed = entry.count <= config.requests;
    const remaining = Math.max(0, config.requests - entry.count);
    const retryAfter = allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000);

    return {
      allowed,
      limit: config.requests,
      remaining,
      resetAt: entry.resetAt,
      retryAfter,
    };
  }

  /**
   * Réinitialiser la limite pour un tenant/user
   */
  async resetLimit(tenantId: string, identifier: string): Promise<void> {
    const key = `${tenantId}:${identifier}`;
    delete this.store[key];
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  async getStats(tenantId: string): Promise<any> {
    const keys = Object.keys(this.store).filter(k => k.startsWith(tenantId));
    
    return {
      totalRequests: keys.reduce((sum, k) => sum + this.store[k].count, 0),
      activeUsers: keys.length,
    };
  }

  /**
   * Nettoyer les entrées expirées (à appeler périodiquement)
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetAt < now) {
        delete this.store[key];
      }
    });
  }
}

export default new RateLimitService();

// Nettoyer toutes les 5 minutes
setInterval(() => {
  const service = new RateLimitService();
  service.cleanup();
}, 5 * 60 * 1000);
