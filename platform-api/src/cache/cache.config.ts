/**
 * Cache Configuration
 * Centralized cache settings and TTL values
 */

/**
 * Cache TTL values in seconds
 */
export const CacheTTL = {
  // Very short-lived (seconds)
  RATE_LIMIT: 60, // 1 minute
  SESSION_TOKEN: 300, // 5 minutes

  // Short-lived (minutes)
  TENANT_CONFIG: 600, // 10 minutes
  USER_SESSION: 1800, // 30 minutes
  API_RESPONSE: 300, // 5 minutes

  // Medium-lived (hours)
  TENANT_SETTINGS: 3600, // 1 hour
  USER_PROFILE: 3600, // 1 hour
  STATIC_DATA: 7200, // 2 hours

  // Long-lived (days)
  REFERENCE_DATA: 86400, // 24 hours
  FEATURE_FLAGS: 43200, // 12 hours
  PRICING_PLANS: 86400, // 24 hours

  // Very long-lived (weeks)
  SYSTEM_CONFIG: 604800, // 7 days
} as const;

/**
 * Cache key prefixes
 */
export const CachePrefix = {
  TENANT: 'tenant',
  USER: 'user',
  SESSION: 'session',
  RATE_LIMIT: 'ratelimit',
  API: 'api',
  FEATURE: 'feature',
  BILLING: 'billing',
  WEBHOOK: 'webhook',
  LOCK: 'lock',
  QUEUE: 'queue',
} as const;

/**
 * Cache namespaces for better organization
 */
export const CacheNamespace = {
  TENANT_DATA: `${CachePrefix.TENANT}:data`,
  TENANT_CONFIG: `${CachePrefix.TENANT}:config`,
  TENANT_LIMITS: `${CachePrefix.TENANT}:limits`,
  USER_PROFILE: `${CachePrefix.USER}:profile`,
  USER_PERMISSIONS: `${CachePrefix.USER}:permissions`,
  SESSION_ACTIVE: `${CachePrefix.SESSION}:active`,
  RATE_LIMIT_IP: `${CachePrefix.RATE_LIMIT}:ip`,
  RATE_LIMIT_TENANT: `${CachePrefix.RATE_LIMIT}:tenant`,
  RATE_LIMIT_USER: `${CachePrefix.RATE_LIMIT}:user`,
  API_CACHE: `${CachePrefix.API}:response`,
} as const;

/**
 * Rate limiting configuration
 */
export const RateLimitConfig = {
  // Global rate limits (per IP)
  GLOBAL_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),
  GLOBAL_WINDOW_SECONDS: 60,

  // Auth endpoints (stricter)
  AUTH_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_AUTH || '5', 10),
  AUTH_WINDOW_SECONDS: 300, // 5 minutes

  // API endpoints (per tenant/user)
  API_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_API || '1000', 10),
  API_WINDOW_SECONDS: 60,

  // Webhook endpoints
  WEBHOOK_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_WEBHOOK || '100', 10),
  WEBHOOK_WINDOW_SECONDS: 60,
} as const;

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  namespace?: string; // Namespace for organization
  compress?: boolean; // Compress large values
  tags?: string[]; // Tags for cache invalidation
}

/**
 * Default cache options
 */
export const defaultCacheOptions: CacheOptions = {
  ttl: CacheTTL.API_RESPONSE,
  compress: false,
  tags: [],
};

/**
 * Redis connection configuration
 */
export const RedisConfig = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  PASSWORD: process.env.REDIS_PASSWORD || undefined,
  DB: parseInt(process.env.REDIS_DB || '0', 10),
  KEY_PREFIX: process.env.REDIS_KEY_PREFIX || 'clubmanager:',
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 50,
  CONNECTION_TIMEOUT_MS: 5000,
  COMMAND_TIMEOUT_MS: 3000,
} as const;

/**
 * Cache error handling
 */
export const CacheErrorHandling = {
  FAIL_SILENTLY: process.env.CACHE_FAIL_SILENTLY === 'true',
  LOG_ERRORS: process.env.CACHE_LOG_ERRORS !== 'false',
  FALLBACK_TO_DB: process.env.CACHE_FALLBACK_DB !== 'false',
} as const;

/**
 * Cache metrics and monitoring
 */
export const CacheMetrics = {
  ENABLED: process.env.CACHE_METRICS_ENABLED === 'true',
  TRACK_HIT_RATE: true,
  TRACK_LATENCY: true,
  TRACK_SIZE: false, // Can be expensive
} as const;
