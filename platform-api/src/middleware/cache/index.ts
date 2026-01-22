/**
 * Cache Middleware Exports
 * Central export point for all cache-related middleware
 */

// Rate limiting middleware
export {
  rateLimitByIp,
  rateLimitByTenant,
  rateLimitByUser,
  authRateLimit,
  combinedRateLimit,
  rateLimiters,
  type RateLimitMiddlewareOptions,
} from './rate-limit.middleware.js';

// Response caching middleware
export {
  responseCache,
  invalidateCache,
  invalidateAllApiCache,
  invalidateTenantCache,
  invalidateUserCache,
  cachedResponse,
  type ResponseCacheOptions,
} from './response-cache.middleware.js';
