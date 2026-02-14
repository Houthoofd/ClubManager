/**
 * Rate Limiting Service
 *
 * Gère le rate limiting pour les opérations sensibles (login, password reset, etc.)
 * Supporte deux backends :
 * - In-memory (simple, dev/test)
 * - Redis (production, multi-instance)
 */

import { RATE_LIMIT_CONFIG, STORAGE_CONFIG } from "../config/auth.config.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration pour une règle de rate limit
 */
export interface AuthRateLimitRule {
  windowMs: number;
  maxAttempts: number;
  blockDurationMs?: number;
  message?: string;
}

/**
 * Normaliser un preset config en AuthRateLimitRule
 */
function normalizeRateLimitConfig(
  config:
    | (typeof RATE_LIMIT_CONFIG)[keyof typeof RATE_LIMIT_CONFIG]
    | AuthRateLimitRule,
): AuthRateLimitRule {
  // Si c'est déjà au bon format
  if ("windowMs" in config) {
    return config;
  }

  // Convertir depuis le format UPPER_CASE
  return {
    windowMs: config.WINDOW_MS,
    maxAttempts: config.MAX_ATTEMPTS,
    blockDurationMs:
      "BLOCK_DURATION_MS" in config ? config.BLOCK_DURATION_MS : undefined,
    message: undefined,
  };
}

/**
 * Entrée de rate limit stockée
 */
interface RateLimitEntry {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
  lastAttemptAt: number;
}

/**
 * Résultat d'une vérification de rate limit
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  blockedUntil?: Date;
  message?: string;
}

/**
 * Store abstrait pour le rate limiting
 */
interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string): Promise<number>;
}

// ============================================================================
// In-Memory Store
// ============================================================================

/**
 * Store en mémoire (simple, pour dev/test)
 * Attention : ne persiste pas et ne scale pas sur plusieurs instances
 */
class InMemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, { entry: RateLimitEntry; expiresAt: number }> =
    new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Nettoyage automatique des entrées expirées toutes les minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const item = this.store.get(key);
    if (!item) {
      return null;
    }

    // Vérifier expiration
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return item.entry;
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    this.store.set(key, {
      entry,
      expiresAt: Date.now() + ttlMs,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async increment(key: string): Promise<number> {
    const entry = await this.get(key);
    const now = Date.now();

    if (!entry) {
      const newEntry: RateLimitEntry = {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      };
      await this.set(key, newEntry, 24 * 60 * 60 * 1000); // 24h par défaut
      return 1;
    }

    entry.count += 1;
    entry.lastAttemptAt = now;
    await this.set(key, entry, 24 * 60 * 60 * 1000);
    return entry.count;
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, item] of entries) {
      if (now > item.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Nettoyer et arrêter le cleanup interval (pour tests)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }

  /**
   * Obtenir le nombre d'entrées (pour debug)
   */
  size(): number {
    return this.store.size;
  }
}

// ============================================================================
// Redis Store (préparé pour future implémentation)
// ============================================================================

/**
 * Store Redis (pour production multi-instance)
 * TODO: Implémenter avec ioredis ou redis client
 */
class RedisRateLimitStore implements RateLimitStore {
  // private client: RedisClient;

  constructor() {
    // TODO: Initialiser le client Redis
    // this.client = createRedisClient(STORAGE_CONFIG.redis);
    throw new Error(
      "Redis store not yet implemented. Use in-memory store for now.",
    );
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    // TODO: Implémenter avec Redis GET
    throw new Error("Not implemented");
  }

  async set(key: string, entry: RateLimitEntry, ttlMs: number): Promise<void> {
    // TODO: Implémenter avec Redis SETEX
    throw new Error("Not implemented");
  }

  async delete(key: string): Promise<void> {
    // TODO: Implémenter avec Redis DEL
    throw new Error("Not implemented");
  }

  async increment(key: string): Promise<number> {
    // TODO: Implémenter avec Redis INCR + EXPIRE
    throw new Error("Not implemented");
  }
}

// ============================================================================
// Rate Limit Service
// ============================================================================

export class RateLimitService {
  private store: RateLimitStore;

  constructor(
    storeType: "memory" | "redis" = STORAGE_CONFIG.RATE_LIMIT_STORE as
      | "memory"
      | "redis",
  ) {
    if (storeType === "redis") {
      // Pour l'instant, fallback sur memory si Redis demandé
      console.warn(
        "Redis rate limit store not implemented yet. Using in-memory store.",
      );
      this.store = new InMemoryRateLimitStore();
    } else {
      this.store = new InMemoryRateLimitStore();
    }
  }

  /**
   * Vérifier et enregistrer une tentative
   *
   * @param identifier - Identifiant unique (userId, IP, email, etc.)
   * @param action - Type d'action (login, passwordReset, etc.)
   * @param rule - Règle de rate limit (optionnel, utilise config par défaut)
   * @returns Résultat avec allowed/remaining/resetAt
   */
  async checkLimit(
    identifier: string,
    action: keyof typeof RATE_LIMIT_CONFIG,
    rule?: AuthRateLimitRule,
  ): Promise<RateLimitResult> {
    const configRule = rule || RATE_LIMIT_CONFIG[action];
    const limitRule = normalizeRateLimitConfig(configRule);
    const key = this.buildKey(identifier, action);
    const now = Date.now();

    // Récupérer l'entrée existante
    let entry = await this.store.get(key);

    // Si blocage actif, vérifier s'il est toujours valide
    if (entry?.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        blockedUntil: new Date(entry.blockedUntil),
        message: "Too many requests. Please try again later.",
      };
    }

    // Si la fenêtre a expiré, réinitialiser
    if (entry && now - entry.firstAttemptAt > limitRule.windowMs) {
      entry = null;
      await this.store.delete(key);
    }

    // Créer nouvelle entrée si nécessaire
    if (!entry) {
      entry = {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      };
      await this.store.set(key, entry, limitRule.windowMs);

      return {
        allowed: true,
        remaining: limitRule.maxAttempts - 1,
        resetAt: new Date(now + limitRule.windowMs),
      };
    }

    // Incrémenter le compteur
    entry.count += 1;
    entry.lastAttemptAt = now;

    // Vérifier si la limite est dépassée
    if (entry.count > limitRule.maxAttempts) {
      // Bloquer si blockDurationMs est défini
      if (limitRule.blockDurationMs) {
        entry.blockedUntil = now + limitRule.blockDurationMs;
      }

      await this.store.set(
        key,
        entry,
        limitRule.windowMs + (limitRule.blockDurationMs || 0),
      );

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.firstAttemptAt + limitRule.windowMs),
        blockedUntil: entry.blockedUntil
          ? new Date(entry.blockedUntil)
          : undefined,
        message:
          limitRule.message || "Too many requests. Please try again later.",
      };
    }

    // Sauvegarder l'entrée mise à jour
    // Mettre à jour l'entrée
    await this.store.set(key, entry, limitRule.windowMs);

    return {
      allowed: true,
      remaining: limitRule.maxAttempts - entry.count,
      resetAt: new Date(entry.firstAttemptAt + limitRule.windowMs),
    };
  }

  /**
   * Réinitialiser le compteur pour un identifier/action
   */
  async reset(
    identifier: string,
    action: keyof typeof RATE_LIMIT_CONFIG,
  ): Promise<void> {
    const key = this.buildKey(identifier, action);
    await this.store.delete(key);
  }

  /**
   * Obtenir l'état actuel sans incrémenter
   */
  async getStatus(
    identifier: string,
    action: keyof typeof RATE_LIMIT_CONFIG,
  ): Promise<RateLimitResult | null> {
    const limitRule = RATE_LIMIT_CONFIG[action];
    const key = this.buildKey(identifier, action);
    const now = Date.now();

    const entry = await this.store.get(key);
    if (!entry) {
      return null;
    }

    // Vérifier blocage
    if (entry.blockedUntil && entry.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        blockedUntil: new Date(entry.blockedUntil),
        message: "Too many requests. Please try again later.",
      };
    }

    // Vérifier expiration de la fenêtre
    if (now - entry.firstAttemptAt > limitRule.WINDOW_MS) {
      return null;
    }

    return {
      allowed: entry.count <= limitRule.MAX_ATTEMPTS,
      remaining: Math.max(0, limitRule.MAX_ATTEMPTS - entry.count),
      resetAt: new Date(entry.firstAttemptAt + limitRule.WINDOW_MS),
    };
  }

  /**
   * Bloquer manuellement un identifier pour une durée
   */
  async block(
    identifier: string,
    action: keyof typeof RATE_LIMIT_CONFIG,
    durationMs: number,
  ): Promise<void> {
    const key = this.buildKey(identifier, action);
    const now = Date.now();

    const entry: RateLimitEntry = {
      count: 999, // Nombre arbitraire élevé
      firstAttemptAt: now,
      lastAttemptAt: now,
      blockedUntil: now + durationMs,
    };

    await this.store.set(key, entry, durationMs);
  }

  /**
   * Débloquer manuellement un identifier
   */
  async unblock(
    identifier: string,
    action: keyof typeof RATE_LIMIT_CONFIG,
  ): Promise<void> {
    await this.reset(identifier, action);
  }

  /**
   * Construire la clé de stockage
   */
  private buildKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  /**
   * Nettoyer le store (pour tests)
   */
  destroy(): void {
    if (this.store instanceof InMemoryRateLimitStore) {
      this.store.destroy();
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let rateLimitServiceInstance: RateLimitService | null = null;

/**
 * Créer une nouvelle instance du service de rate limiting
 */
export const createRateLimitService = (): RateLimitService => {
  if (rateLimitServiceInstance) {
    rateLimitServiceInstance.destroy();
  }
  rateLimitServiceInstance = new RateLimitService();
  return rateLimitServiceInstance;
};

/**
 * Obtenir l'instance singleton du service de rate limiting
 */
export const getRateLimitService = (): RateLimitService => {
  if (!rateLimitServiceInstance) {
    rateLimitServiceInstance = new RateLimitService();
  }
  return rateLimitServiceInstance;
};

/**
 * Détruire l'instance (pour tests)
 */
export const destroyRateLimitService = (): void => {
  if (rateLimitServiceInstance) {
    rateLimitServiceInstance.destroy();
    rateLimitServiceInstance = null;
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Vérifier rate limit pour login
 */
export const checkLoginRateLimit = async (
  identifier: string,
): Promise<RateLimitResult> => {
  const service = getRateLimitService();
  return service.checkLimit(identifier, "LOGIN");
};

/**
 * Vérifier rate limit pour password reset
 */
export const checkPasswordResetRateLimit = async (
  identifier: string,
): Promise<RateLimitResult> => {
  const service = getRateLimitService();
  return service.checkLimit(identifier, "PASSWORD_RESET");
};

/**
 * Vérifier rate limit pour email verification
 */
export const checkEmailVerificationRateLimit = async (
  identifier: string,
): Promise<RateLimitResult> => {
  const service = getRateLimitService();
  return service.checkLimit(identifier, "EMAIL_VERIFICATION");
};

/**
 * Vérifier rate limit pour registration
 */
export const checkRegistrationRateLimit = async (
  identifier: string,
): Promise<RateLimitResult> => {
  const service = getRateLimitService();
  return service.checkLimit(identifier, "REGISTRATION");
};

/**
 * Vérifier rate limit pour refresh token
 */
export const checkRefreshTokenRateLimit = async (
  identifier: string,
): Promise<RateLimitResult> => {
  const service = getRateLimitService();
  return service.checkLimit(identifier, "API");
};

/**
 * Réinitialiser le rate limit après succès (ex: login réussi)
 */
export const resetAuthRateLimit = async (
  identifier: string,
  action: keyof typeof RATE_LIMIT_CONFIG,
): Promise<void> => {
  const service = getRateLimitService();
  await service.reset(identifier, action);
};

// Export default
export default {
  RateLimitService,
  getRateLimitService,
  destroyRateLimitService,
  checkLoginRateLimit,
  checkPasswordResetRateLimit,
  checkEmailVerificationRateLimit,
  checkRegistrationRateLimit,
  checkRefreshTokenRateLimit,
  resetAuthRateLimit,
};
