/**
 * Cache Module Exports
 * Central export point for all cache services and utilities
 */

// Core cache service
export { cacheService, CacheService } from './cache.service.js';

// Specialized cache services
export { tenantCacheService, TenantCacheService } from './tenant-cache.service.js';
export { userCacheService, UserCacheService } from './user-cache.service.js';
export { rateLimiterService, RateLimiterService } from './rate-limiter.service.js';

// Configuration and constants
export {
  CacheTTL,
  CachePrefix,
  CacheNamespace,
  RateLimitConfig,
  RedisConfig,
  CacheErrorHandling,
  CacheMetrics,
  defaultCacheOptions,
  type CacheOptions,
} from './cache.config.js';

// Cache key generators
export {
  generateCacheKey,
  parseCacheKey,
  TenantCacheKeys,
  UserCacheKeys,
  SessionCacheKeys,
  RateLimitCacheKeys,
  ApiCacheKeys,
  FeatureCacheKeys,
  BillingCacheKeys,
  WebhookCacheKeys,
  LockCacheKeys,
  CacheKeyUtils,
} from './cache-keys.js';

// Rate limiting types
export type {
  RateLimitResult,
  RateLimitOptions,
  RateLimitKeyType,
} from './rate-limiter.service.js';

// User cache types
export type {
  UserProfile,
  UserPermissions,
  UserSession,
  UserPreferences,
} from './user-cache.service.js';

// Redis client (re-export from db module)
export { redis, waitForRedis, disconnectRedis, redisHealthCheck, redisInfo, isRedisReady, clearRedisCache } from '../db/redis.client.js';
