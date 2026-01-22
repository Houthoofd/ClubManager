/**
 * Cache Key Generator
 * Provides consistent key naming conventions across the application
 */

import { CacheNamespace, CachePrefix } from './cache.config.js';

/**
 * Generate a cache key with consistent formatting
 */
export function generateCacheKey(
  namespace: string,
  identifier: string | number,
  suffix?: string
): string {
  const parts = [namespace, identifier.toString()];
  if (suffix) {
    parts.push(suffix);
  }
  return parts.join(':');
}

/**
 * Parse a cache key back into its components
 */
export function parseCacheKey(key: string): {
  namespace: string;
  identifier: string;
  suffix?: string;
} {
  const parts = key.split(':');
  return {
    namespace: parts[0] || '',
    identifier: parts[1] || '',
    suffix: parts[2],
  };
}

/**
 * Tenant cache keys
 */
export const TenantCacheKeys = {
  /**
   * Get tenant data cache key
   */
  data: (tenantId: string): string =>
    generateCacheKey(CacheNamespace.TENANT_DATA, tenantId),

  /**
   * Get tenant config cache key
   */
  config: (tenantId: string): string =>
    generateCacheKey(CacheNamespace.TENANT_CONFIG, tenantId),

  /**
   * Get tenant settings cache key
   */
  settings: (tenantId: string, key?: string): string =>
    generateCacheKey(CacheNamespace.TENANT_CONFIG, tenantId, key ? `settings:${key}` : 'settings'),

  /**
   * Get tenant limits cache key
   */
  limits: (tenantId: string): string =>
    generateCacheKey(CacheNamespace.TENANT_LIMITS, tenantId),

  /**
   * Get tenant subscription cache key
   */
  subscription: (tenantId: string): string =>
    generateCacheKey(CachePrefix.TENANT, tenantId, 'subscription'),

  /**
   * Get tenant features cache key
   */
  features: (tenantId: string): string =>
    generateCacheKey(CachePrefix.TENANT, tenantId, 'features'),

  /**
   * Get tenant users list cache key
   */
  users: (tenantId: string): string =>
    generateCacheKey(CachePrefix.TENANT, tenantId, 'users'),

  /**
   * Get all tenant keys pattern
   */
  pattern: (tenantId: string): string =>
    `${CachePrefix.TENANT}:*:${tenantId}*`,
};

/**
 * User cache keys
 */
export const UserCacheKeys = {
  /**
   * Get user profile cache key
   */
  profile: (userId: string): string =>
    generateCacheKey(CacheNamespace.USER_PROFILE, userId),

  /**
   * Get user permissions cache key
   */
  permissions: (userId: string, tenantId?: string): string =>
    generateCacheKey(
      CacheNamespace.USER_PERMISSIONS,
      userId,
      tenantId ? `tenant:${tenantId}` : undefined
    ),

  /**
   * Get user session cache key
   */
  session: (userId: string, sessionId?: string): string =>
    generateCacheKey(
      CachePrefix.USER,
      userId,
      sessionId ? `session:${sessionId}` : 'session'
    ),

  /**
   * Get user preferences cache key
   */
  preferences: (userId: string): string =>
    generateCacheKey(CachePrefix.USER, userId, 'preferences'),

  /**
   * Get all user keys pattern
   */
  pattern: (userId: string): string =>
    `${CachePrefix.USER}:*:${userId}*`,
};

/**
 * Session cache keys
 */
export const SessionCacheKeys = {
  /**
   * Get active session cache key
   */
  active: (sessionId: string): string =>
    generateCacheKey(CacheNamespace.SESSION_ACTIVE, sessionId),

  /**
   * Get session data cache key
   */
  data: (sessionId: string): string =>
    generateCacheKey(CachePrefix.SESSION, sessionId, 'data'),

  /**
   * Get user sessions list cache key
   */
  byUser: (userId: string): string =>
    generateCacheKey(CachePrefix.SESSION, userId, 'list'),

  /**
   * Get session token cache key
   */
  token: (token: string): string =>
    generateCacheKey(CachePrefix.SESSION, token, 'token'),
};

/**
 * Rate limit cache keys
 */
export const RateLimitCacheKeys = {
  /**
   * Get rate limit key for IP address
   */
  byIp: (ip: string, endpoint?: string): string =>
    generateCacheKey(
      CacheNamespace.RATE_LIMIT_IP,
      ip.replace(/\./g, '-'),
      endpoint
    ),

  /**
   * Get rate limit key for tenant
   */
  byTenant: (tenantId: string, endpoint?: string): string =>
    generateCacheKey(CacheNamespace.RATE_LIMIT_TENANT, tenantId, endpoint),

  /**
   * Get rate limit key for user
   */
  byUser: (userId: string, endpoint?: string): string =>
    generateCacheKey(CacheNamespace.RATE_LIMIT_USER, userId, endpoint),

  /**
   * Get rate limit key for API key
   */
  byApiKey: (apiKey: string): string =>
    generateCacheKey(CachePrefix.RATE_LIMIT, apiKey, 'apikey'),
};

/**
 * API response cache keys
 */
export const ApiCacheKeys = {
  /**
   * Generate API response cache key
   */
  response: (method: string, path: string, query?: Record<string, any>): string => {
    const queryString = query
      ? Object.keys(query)
          .sort()
          .map(key => `${key}=${query[key]}`)
          .join('&')
      : '';
    const suffix = queryString ? `${path}?${queryString}` : path;
    return generateCacheKey(CacheNamespace.API_CACHE, method.toLowerCase(), suffix);
  },

  /**
   * Get API cache pattern for a path
   */
  pattern: (path?: string): string =>
    path
      ? `${CacheNamespace.API_CACHE}:*:${path}*`
      : `${CacheNamespace.API_CACHE}:*`,
};

/**
 * Feature flag cache keys
 */
export const FeatureCacheKeys = {
  /**
   * Get feature flag cache key
   */
  flag: (flagName: string, tenantId?: string): string =>
    generateCacheKey(
      CachePrefix.FEATURE,
      flagName,
      tenantId ? `tenant:${tenantId}` : 'global'
    ),

  /**
   * Get all feature flags for tenant
   */
  allFlags: (tenantId: string): string =>
    generateCacheKey(CachePrefix.FEATURE, tenantId, 'all'),
};

/**
 * Billing cache keys
 */
export const BillingCacheKeys = {
  /**
   * Get billing account cache key
   */
  account: (tenantId: string): string =>
    generateCacheKey(CachePrefix.BILLING, tenantId, 'account'),

  /**
   * Get subscription cache key
   */
  subscription: (subscriptionId: string): string =>
    generateCacheKey(CachePrefix.BILLING, subscriptionId, 'subscription'),

  /**
   * Get invoice cache key
   */
  invoice: (invoiceId: string): string =>
    generateCacheKey(CachePrefix.BILLING, invoiceId, 'invoice'),

  /**
   * Get usage cache key
   */
  usage: (tenantId: string, period: string): string =>
    generateCacheKey(CachePrefix.BILLING, tenantId, `usage:${period}`),
};

/**
 * Webhook cache keys
 */
export const WebhookCacheKeys = {
  /**
   * Get webhook processing lock key
   */
  lock: (webhookId: string): string =>
    generateCacheKey(CachePrefix.WEBHOOK, webhookId, 'lock'),

  /**
   * Get webhook idempotency key
   */
  idempotency: (idempotencyKey: string): string =>
    generateCacheKey(CachePrefix.WEBHOOK, idempotencyKey, 'idempotent'),

  /**
   * Get webhook retry count key
   */
  retry: (webhookId: string): string =>
    generateCacheKey(CachePrefix.WEBHOOK, webhookId, 'retry'),
};

/**
 * Lock cache keys
 */
export const LockCacheKeys = {
  /**
   * Get distributed lock key
   */
  distributed: (resource: string, identifier: string): string =>
    generateCacheKey(CachePrefix.LOCK, resource, identifier),

  /**
   * Get tenant operation lock
   */
  tenantOperation: (tenantId: string, operation: string): string =>
    generateCacheKey(CachePrefix.LOCK, `tenant:${tenantId}`, operation),
};

/**
 * Utility functions
 */
export const CacheKeyUtils = {
  /**
   * Sanitize a string for use in cache key
   */
  sanitize: (value: string): string =>
    value.replace(/[^a-zA-Z0-9_-]/g, '_'),

  /**
   * Generate a wildcard pattern for cache invalidation
   */
  wildcardPattern: (prefix: string, pattern: string = '*'): string =>
    `${prefix}:${pattern}`,

  /**
   * Extract tenant ID from cache key if present
   */
  extractTenantId: (key: string): string | null => {
    const match = key.match(/tenant:([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  },

  /**
   * Check if key matches pattern
   */
  matchesPattern: (key: string, pattern: string): boolean => {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(key);
  },
};
