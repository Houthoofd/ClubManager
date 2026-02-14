/**
 * Rate Limiting Middleware for GraphQL
 *
 * Provides rate limiting middlewares for GraphQL resolvers.
 * Protects against brute force attacks and API abuse.
 */

import { GraphQLResolveInfo } from "graphql";
import { RateLimitError } from "../errors/GraphQLErrors.js";

/**
 * Rate limit store interface
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limit store
 * For production, use Redis or similar distributed cache
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  get(key: string): RateLimitEntry | undefined {
    const entry = this.store.get(key);
    if (entry && entry.resetTime < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global rate limit store
const rateLimitStore = new RateLimitStore();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  max: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom message to show when rate limit is exceeded
   */
  message?: string;

  /**
   * Custom key generator function
   * By default uses IP address or user ID
   */
  keyGenerator?: (context: any) => string;

  /**
   * Skip rate limiting based on condition
   */
  skip?: (context: any) => boolean;

  /**
   * Handler called when rate limit is exceeded
   */
  onLimitReached?: (context: any, limit: RateLimitConfig) => void;
}

/**
 * Default rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * General API rate limit: 100 requests per 15 minutes
   */
  API: {
    max: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Trop de requêtes, veuillez réessayer plus tard",
  } as RateLimitConfig,

  /**
   * Strict rate limit for authentication: 5 attempts per 15 minutes
   */
  LOGIN: {
    max: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message:
      "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes",
  } as RateLimitConfig,

  /**
   * Password reset rate limit: 3 attempts per hour
   */
  PASSWORD_RESET: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message:
      "Trop de demandes de réinitialisation, veuillez réessayer dans 1 heure",
  } as RateLimitConfig,

  /**
   * Registration rate limit: 3 registrations per hour per IP
   */
  REGISTRATION: {
    max: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    message:
      "Trop d'inscriptions depuis cette adresse, veuillez réessayer plus tard",
  } as RateLimitConfig,

  /**
   * Email sending rate limit: 10 emails per hour
   */
  EMAIL: {
    max: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Trop d'emails envoyés, veuillez réessayer plus tard",
  } as RateLimitConfig,

  /**
   * Payment rate limit: 10 payment attempts per hour
   */
  PAYMENT: {
    max: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Trop de tentatives de paiement, veuillez réessayer plus tard",
  } as RateLimitConfig,

  /**
   * File upload rate limit: 20 uploads per hour
   */
  UPLOAD: {
    max: 20,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: "Trop d'uploads, veuillez réessayer plus tard",
  } as RateLimitConfig,

  /**
   * Mutation rate limit: 50 mutations per 15 minutes
   */
  MUTATION: {
    max: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Trop de modifications, veuillez réessayer plus tard",
  } as RateLimitConfig,

  /**
   * Query rate limit: 200 queries per 15 minutes
   */
  QUERY: {
    max: 200,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Trop de requêtes, veuillez ralentir",
  } as RateLimitConfig,

  /**
   * Strict rate limit: 10 requests per 15 minutes
   */
  STRICT: {
    max: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Limite stricte atteinte, veuillez réessayer plus tard",
  } as RateLimitConfig,

  /**
   * Loose rate limit: 500 requests per 15 minutes
   */
  LOOSE: {
    max: 500,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Trop de requêtes, veuillez ralentir",
  } as RateLimitConfig,
} as const;

/**
 * Generate rate limit key
 */
function generateKey(
  context: any,
  config: RateLimitConfig,
  resolverName: string,
): string {
  // Use custom key generator if provided
  if (config.keyGenerator) {
    return config.keyGenerator(context);
  }

  // Use user ID if authenticated
  if (context.user && context.user.id) {
    return `ratelimit:${resolverName}:user:${context.user.id}`;
  }

  // Fallback to IP address
  const ip =
    context.req?.ip ||
    context.req?.connection?.remoteAddress ||
    context.req?.socket?.remoteAddress ||
    "unknown";

  return `ratelimit:${resolverName}:ip:${ip}`;
}

/**
 * Check and update rate limit
 */
function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // No entry or expired entry
  if (!entry) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
    });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.max) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.max - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit<TArgs = any, TContext = any, TResult = any>(
  config: RateLimitConfig,
) {
  return (
    resolver: (
      parent: any,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo,
    ) => Promise<TResult>,
  ) => {
    return async (
      parent: any,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo,
    ): Promise<TResult> => {
      // Skip if condition met
      if (config.skip && config.skip(context)) {
        return resolver(parent, args, context, info);
      }

      const resolverName = info.fieldName;
      const key = generateKey(context, config, resolverName);

      // Check rate limit
      const result = checkRateLimit(key, config);

      // Add rate limit info to context
      (context as any).rateLimit = {
        limit: config.max,
        remaining: result.remaining,
        resetTime: result.resetTime,
      };

      // If limit exceeded, throw error
      if (!result.allowed) {
        const resetDate = new Date(result.resetTime);
        const resetIn = Math.ceil((result.resetTime - Date.now()) / 1000 / 60);

        // Call custom handler if provided
        if (config.onLimitReached) {
          config.onLimitReached(context, config);
        }

        throw new RateLimitError(
          config.message || "Trop de requêtes, veuillez réessayer plus tard",
          resetIn * 60, // retryAfter en secondes
          {
            limit: config.max,
            remaining: result.remaining,
            resetTime: resetDate,
          },
        );
      }

      return resolver(parent, args, context, info);
    };
  };
}

/**
 * Preset middleware: API rate limit
 */
export function withApiRateLimit<TArgs = any, TContext = any, TResult = any>() {
  return withRateLimit(RateLimitPresets.API);
}

/**
 * Preset middleware: Login rate limit
 */
export function withLoginRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.LOGIN);
}

/**
 * Preset middleware: Password reset rate limit
 */
export function withPasswordResetRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.PASSWORD_RESET);
}

/**
 * Preset middleware: Registration rate limit
 */
export function withRegistrationRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.REGISTRATION);
}

/**
 * Preset middleware: Email rate limit
 */
export function withEmailRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.EMAIL);
}

/**
 * Preset middleware: Payment rate limit
 */
export function withStrictRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.STRICT);
}

/**
 * Preset middleware: Upload rate limit
 */
export function withLooseRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.LOOSE);
}

/**
 * Preset middleware: Mutation rate limit
 */
export function withMutationRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.MUTATION);
}

/**
 * Preset middleware: Query rate limit
 */
export function withQueryRateLimit<
  TArgs = any,
  TContext = any,
  TResult = any,
>() {
  return withRateLimit(RateLimitPresets.QUERY);
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(
  context: any,
  resolverName: string,
  config?: RateLimitConfig,
): void {
  const key = generateKey(
    context,
    config || RateLimitPresets.API,
    resolverName,
  );
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(
  context: any,
  resolverName: string,
  config?: RateLimitConfig,
): { count: number; remaining: number; resetTime: number } | null {
  const key = generateKey(
    context,
    config || RateLimitPresets.API,
    resolverName,
  );
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return null;
  }

  const max = config?.max || RateLimitPresets.API.max;
  return {
    count: entry.count,
    remaining: Math.max(0, max - entry.count),
    resetTime: entry.resetTime,
  };
}

/**
 * Cleanup on process exit
 */
process.on("exit", () => {
  rateLimitStore.destroy();
});

process.on("SIGINT", () => {
  rateLimitStore.destroy();
  process.exit(0);
});

process.on("SIGTERM", () => {
  rateLimitStore.destroy();
  process.exit(0);
});
