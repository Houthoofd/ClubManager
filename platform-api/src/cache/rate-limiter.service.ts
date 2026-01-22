/**
 * Rate Limiter Service
 * Distributed rate limiting using Redis with sliding window algorithm
 */

import { cacheService } from './cache.service.js';
import { RateLimitCacheKeys } from './cache-keys.js';
import { RateLimitConfig } from './cache.config.js';

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  max: number; // Maximum number of requests
  windowSeconds: number; // Time window in seconds
  prefix?: string; // Key prefix for grouping
  skipFailedRequests?: boolean; // Don't count failed requests
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

/**
 * Rate limit key types
 */
export type RateLimitKeyType = 'ip' | 'tenant' | 'user' | 'apikey' | 'custom';

/**
 * Rate Limiter Service using Redis
 */
export class RateLimiterService {
  /**
   * Check rate limit using sliding window algorithm
   */
  async checkRateLimit(
    keyType: RateLimitKeyType,
    identifier: string,
    options: RateLimitOptions,
    endpoint?: string
  ): Promise<RateLimitResult> {
    const key = this.generateKey(keyType, identifier, endpoint);
    const now = Date.now();
    const windowMs = options.windowSeconds * 1000;
    const windowStart = now - windowMs;

    try {
      // Use Redis sorted set for sliding window
      // Score is timestamp, member is unique request ID
      const requestId = `${now}-${Math.random()}`;

      // Remove old entries outside the window
      await cacheService.getSortedSetByScore(key, 0, windowStart);

      // Add current request
      await cacheService.addToSortedSet(key, now, requestId);

      // Count requests in current window
      const count = (await cacheService.getSortedSetByScore(key, windowStart, now)).length;

      // Set expiration on the key
      await cacheService.expire(key, options.windowSeconds + 1);

      const remaining = Math.max(0, options.max - count);
      const resetAt = new Date(now + windowMs);

      return {
        allowed: count <= options.max,
        limit: options.max,
        remaining,
        resetAt,
        retryAfter: count > options.max ? Math.ceil((resetAt.getTime() - now) / 1000) : undefined,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        limit: options.max,
        remaining: options.max,
        resetAt: new Date(now + options.windowSeconds * 1000),
      };
    }
  }

  /**
   * Simple token bucket rate limiting
   */
  async checkTokenBucket(
    keyType: RateLimitKeyType,
    identifier: string,
    options: RateLimitOptions,
    endpoint?: string
  ): Promise<RateLimitResult> {
    const key = this.generateKey(keyType, identifier, endpoint);
    const now = Date.now();

    try {
      // Increment counter
      const count = await cacheService.increment(key);

      // Set expiration on first request
      if (count === 1) {
        await cacheService.expire(key, options.windowSeconds);
      }

      // Get TTL to calculate reset time
      const ttl = await cacheService.getTTL(key);
      const resetAt = new Date(now + (ttl > 0 ? ttl * 1000 : options.windowSeconds * 1000));

      const remaining = Math.max(0, options.max - count);

      return {
        allowed: count <= options.max,
        limit: options.max,
        remaining,
        resetAt,
        retryAfter: count > options.max ? ttl : undefined,
      };
    } catch (error) {
      console.error('Token bucket check error:', error);
      // On error, allow the request (fail open)
      return {
        allowed: true,
        limit: options.max,
        remaining: options.max,
        resetAt: new Date(now + options.windowSeconds * 1000),
      };
    }
  }

  /**
   * Check rate limit for IP address
   */
  async checkIpRateLimit(
    ip: string,
    endpoint?: string,
    options?: Partial<RateLimitOptions>
  ): Promise<RateLimitResult> {
    return this.checkTokenBucket('ip', ip, {
      max: options?.max || RateLimitConfig.GLOBAL_MAX_REQUESTS,
      windowSeconds: options?.windowSeconds || RateLimitConfig.GLOBAL_WINDOW_SECONDS,
      ...options,
    }, endpoint);
  }

  /**
   * Check rate limit for tenant
   */
  async checkTenantRateLimit(
    tenantId: string,
    endpoint?: string,
    options?: Partial<RateLimitOptions>
  ): Promise<RateLimitResult> {
    return this.checkTokenBucket('tenant', tenantId, {
      max: options?.max || RateLimitConfig.API_MAX_REQUESTS,
      windowSeconds: options?.windowSeconds || RateLimitConfig.API_WINDOW_SECONDS,
      ...options,
    }, endpoint);
  }

  /**
   * Check rate limit for user
   */
  async checkUserRateLimit(
    userId: string,
    endpoint?: string,
    options?: Partial<RateLimitOptions>
  ): Promise<RateLimitResult> {
    return this.checkTokenBucket('user', userId, {
      max: options?.max || RateLimitConfig.API_MAX_REQUESTS,
      windowSeconds: options?.windowSeconds || RateLimitConfig.API_WINDOW_SECONDS,
      ...options,
    }, endpoint);
  }

  /**
   * Check rate limit for authentication endpoints (stricter)
   */
  async checkAuthRateLimit(ip: string): Promise<RateLimitResult> {
    return this.checkTokenBucket('ip', ip, {
      max: RateLimitConfig.AUTH_MAX_REQUESTS,
      windowSeconds: RateLimitConfig.AUTH_WINDOW_SECONDS,
    }, 'auth');
  }

  /**
   * Check rate limit for webhook endpoints
   */
  async checkWebhookRateLimit(source: string): Promise<RateLimitResult> {
    return this.checkTokenBucket('custom', source, {
      max: RateLimitConfig.WEBHOOK_MAX_REQUESTS,
      windowSeconds: RateLimitConfig.WEBHOOK_WINDOW_SECONDS,
    }, 'webhook');
  }

  /**
   * Reset rate limit for a key
   */
  async resetRateLimit(
    keyType: RateLimitKeyType,
    identifier: string,
    endpoint?: string
  ): Promise<boolean> {
    const key = this.generateKey(keyType, identifier, endpoint);
    return await cacheService.delete(key);
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(
    keyType: RateLimitKeyType,
    identifier: string,
    options: RateLimitOptions,
    endpoint?: string
  ): Promise<RateLimitResult> {
    const key = this.generateKey(keyType, identifier, endpoint);
    const now = Date.now();

    try {
      const countStr = await cacheService.get<string>(key);
      const count = countStr ? parseInt(countStr, 10) : 0;
      const ttl = await cacheService.getTTL(key);
      const resetAt = new Date(now + (ttl > 0 ? ttl * 1000 : options.windowSeconds * 1000));

      const remaining = Math.max(0, options.max - count);

      return {
        allowed: count < options.max,
        limit: options.max,
        remaining,
        resetAt,
        retryAfter: count >= options.max ? ttl : undefined,
      };
    } catch (error) {
      console.error('Get rate limit status error:', error);
      return {
        allowed: true,
        limit: options.max,
        remaining: options.max,
        resetAt: new Date(now + options.windowSeconds * 1000),
      };
    }
  }

  /**
   * Consume tokens (for manual rate limiting)
   */
  async consumeTokens(
    keyType: RateLimitKeyType,
    identifier: string,
    tokens: number = 1,
    options: RateLimitOptions,
    endpoint?: string
  ): Promise<RateLimitResult> {
    const key = this.generateKey(keyType, identifier, endpoint);
    const now = Date.now();

    try {
      const count = await cacheService.increment(key, tokens);

      if (count === tokens) {
        await cacheService.expire(key, options.windowSeconds);
      }

      const ttl = await cacheService.getTTL(key);
      const resetAt = new Date(now + (ttl > 0 ? ttl * 1000 : options.windowSeconds * 1000));
      const remaining = Math.max(0, options.max - count);

      return {
        allowed: count <= options.max,
        limit: options.max,
        remaining,
        resetAt,
        retryAfter: count > options.max ? ttl : undefined,
      };
    } catch (error) {
      console.error('Consume tokens error:', error);
      return {
        allowed: true,
        limit: options.max,
        remaining: options.max,
        resetAt: new Date(now + options.windowSeconds * 1000),
      };
    }
  }

  /**
   * Whitelist an identifier (no rate limiting)
   */
  async addToWhitelist(
    keyType: RateLimitKeyType,
    identifier: string,
    ttlSeconds?: number
  ): Promise<boolean> {
    const key = `ratelimit:whitelist:${keyType}:${identifier}`;
    return await cacheService.set(key, 'true', {
      ttl: ttlSeconds || 86400, // Default 24 hours
    });
  }

  /**
   * Remove from whitelist
   */
  async removeFromWhitelist(
    keyType: RateLimitKeyType,
    identifier: string
  ): Promise<boolean> {
    const key = `ratelimit:whitelist:${keyType}:${identifier}`;
    return await cacheService.delete(key);
  }

  /**
   * Check if identifier is whitelisted
   */
  async isWhitelisted(
    keyType: RateLimitKeyType,
    identifier: string
  ): Promise<boolean> {
    const key = `ratelimit:whitelist:${keyType}:${identifier}`;
    return await cacheService.exists(key);
  }

  /**
   * Blacklist an identifier (block all requests)
   */
  async addToBlacklist(
    keyType: RateLimitKeyType,
    identifier: string,
    ttlSeconds?: number
  ): Promise<boolean> {
    const key = `ratelimit:blacklist:${keyType}:${identifier}`;
    return await cacheService.set(key, 'true', {
      ttl: ttlSeconds || 3600, // Default 1 hour
    });
  }

  /**
   * Remove from blacklist
   */
  async removeFromBlacklist(
    keyType: RateLimitKeyType,
    identifier: string
  ): Promise<boolean> {
    const key = `ratelimit:blacklist:${keyType}:${identifier}`;
    return await cacheService.delete(key);
  }

  /**
   * Check if identifier is blacklisted
   */
  async isBlacklisted(
    keyType: RateLimitKeyType,
    identifier: string
  ): Promise<boolean> {
    const key = `ratelimit:blacklist:${keyType}:${identifier}`;
    return await cacheService.exists(key);
  }

  /**
   * Generate rate limit key
   */
  private generateKey(
    keyType: RateLimitKeyType,
    identifier: string,
    endpoint?: string
  ): string {
    switch (keyType) {
      case 'ip':
        return RateLimitCacheKeys.byIp(identifier, endpoint);
      case 'tenant':
        return RateLimitCacheKeys.byTenant(identifier, endpoint);
      case 'user':
        return RateLimitCacheKeys.byUser(identifier, endpoint);
      case 'apikey':
        return RateLimitCacheKeys.byApiKey(identifier);
      case 'custom':
        return `ratelimit:custom:${identifier}${endpoint ? `:${endpoint}` : ''}`;
      default:
        return `ratelimit:${keyType}:${identifier}${endpoint ? `:${endpoint}` : ''}`;
    }
  }
}

// Export singleton instance
export const rateLimiterService = new RateLimiterService();
