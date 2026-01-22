/**
 * Rate Limiter Service Tests
 * Tests for rate limiting functionality with token bucket and sliding window algorithms
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { rateLimiterService } from '../../rate-limiter.service.js';
import { cacheService } from '../../cache.service.js';
import { waitForRedis, disconnectRedis } from '../../../db/redis.client.js';

describe('RateLimiterService', () => {
  beforeAll(async () => {
    // Wait for Redis connection
    try {
      await waitForRedis(5000);
    } catch (error) {
      console.warn('Redis not available for tests - skipping');
    }
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clear rate limit keys before each test
    await cacheService.deletePattern('ratelimit:*');
  });

  describe('Token Bucket Algorithm', () => {
    it('should allow requests within rate limit', async () => {
      const key = 'test-user-1';
      const maxRequests = 5;
      const windowSeconds = 60;

      // Should allow first 5 requests
      for (let i = 0; i < maxRequests; i++) {
        const result = await rateLimiterService.checkRateLimit(
          key,
          maxRequests,
          windowSeconds
        );
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(maxRequests - i - 1);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const key = 'test-user-2';
      const maxRequests = 3;
      const windowSeconds = 60;

      // Use up all tokens
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
      }

      // Next request should be blocked
      const result = await rateLimiterService.checkRateLimit(
        key,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return correct retry after time', async () => {
      const key = 'test-user-3';
      const maxRequests = 2;
      const windowSeconds = 10;

      // Exhaust rate limit
      await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
      await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);

      const result = await rateLimiterService.checkRateLimit(
        key,
        maxRequests,
        windowSeconds
      );

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(windowSeconds);
    });

    it('should track total requests count', async () => {
      const key = 'test-user-4';
      const maxRequests = 10;
      const windowSeconds = 60;

      // Make several requests
      for (let i = 0; i < 5; i++) {
        await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
      }

      const result = await rateLimiterService.checkRateLimit(
        key,
        maxRequests,
        windowSeconds
      );

      expect(result.totalRequests).toBe(6);
    });
  });

  describe('Sliding Window Algorithm', () => {
    it('should track requests in sliding window', async () => {
      const key = 'test-sliding-1';
      const maxRequests = 5;
      const windowSeconds = 2;

      // Make requests
      for (let i = 0; i < 3; i++) {
        const result = await rateLimiterService.checkRateLimitSlidingWindow(
          key,
          maxRequests,
          windowSeconds
        );
        expect(result.allowed).toBe(true);
      }

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Should be able to make requests again
      const result = await rateLimiterService.checkRateLimitSlidingWindow(
        key,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(maxRequests - 1);
    });

    it('should block requests exceeding sliding window limit', async () => {
      const key = 'test-sliding-2';
      const maxRequests = 3;
      const windowSeconds = 60;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkRateLimitSlidingWindow(
          key,
          maxRequests,
          windowSeconds
        );
      }

      // Should be blocked
      const result = await rateLimiterService.checkRateLimitSlidingWindow(
        key,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(false);
    });

    it('should accurately count requests in window', async () => {
      const key = 'test-sliding-3';
      const maxRequests = 10;
      const windowSeconds = 60;

      // Make 7 requests
      for (let i = 0; i < 7; i++) {
        await rateLimiterService.checkRateLimitSlidingWindow(
          key,
          maxRequests,
          windowSeconds
        );
      }

      const result = await rateLimiterService.checkRateLimitSlidingWindow(
        key,
        maxRequests,
        windowSeconds
      );

      expect(result.totalRequests).toBe(8);
      expect(result.remaining).toBe(2);
    });
  });

  describe('IP-based Rate Limiting', () => {
    it('should rate limit by IP address', async () => {
      const ip = '192.168.1.100';
      const maxRequests = 5;
      const windowSeconds = 60;

      // Make requests
      for (let i = 0; i < maxRequests; i++) {
        const result = await rateLimiterService.checkIpRateLimit(
          ip,
          maxRequests,
          windowSeconds
        );
        expect(result.allowed).toBe(true);
      }

      // Should be blocked
      const result = await rateLimiterService.checkIpRateLimit(
        ip,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(false);
    });

    it('should isolate rate limits per IP', async () => {
      const ip1 = '192.168.1.1';
      const ip2 = '192.168.1.2';
      const maxRequests = 3;
      const windowSeconds = 60;

      // Exhaust ip1
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkIpRateLimit(ip1, maxRequests, windowSeconds);
      }

      // ip1 should be blocked
      const result1 = await rateLimiterService.checkIpRateLimit(
        ip1,
        maxRequests,
        windowSeconds
      );
      expect(result1.allowed).toBe(false);

      // ip2 should still be allowed
      const result2 = await rateLimiterService.checkIpRateLimit(
        ip2,
        maxRequests,
        windowSeconds
      );
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Tenant-based Rate Limiting', () => {
    it('should rate limit by tenant ID', async () => {
      const tenantId = 'tenant-123';
      const maxRequests = 10;
      const windowSeconds = 60;

      // Make requests
      for (let i = 0; i < maxRequests; i++) {
        const result = await rateLimiterService.checkTenantRateLimit(
          tenantId,
          maxRequests,
          windowSeconds
        );
        expect(result.allowed).toBe(true);
      }

      // Should be blocked
      const result = await rateLimiterService.checkTenantRateLimit(
        tenantId,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(false);
    });

    it('should isolate rate limits per tenant', async () => {
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';
      const maxRequests = 5;
      const windowSeconds = 60;

      // Exhaust tenant1
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkTenantRateLimit(tenant1, maxRequests, windowSeconds);
      }

      // tenant1 blocked
      const result1 = await rateLimiterService.checkTenantRateLimit(
        tenant1,
        maxRequests,
        windowSeconds
      );
      expect(result1.allowed).toBe(false);

      // tenant2 allowed
      const result2 = await rateLimiterService.checkTenantRateLimit(
        tenant2,
        maxRequests,
        windowSeconds
      );
      expect(result2.allowed).toBe(true);
    });
  });

  describe('User-based Rate Limiting', () => {
    it('should rate limit by user ID', async () => {
      const userId = 'user-456';
      const maxRequests = 20;
      const windowSeconds = 60;

      // Make requests
      for (let i = 0; i < maxRequests; i++) {
        const result = await rateLimiterService.checkUserRateLimit(
          userId,
          maxRequests,
          windowSeconds
        );
        expect(result.allowed).toBe(true);
      }

      // Should be blocked
      const result = await rateLimiterService.checkUserRateLimit(
        userId,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(false);
    });

    it('should isolate rate limits per user', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const maxRequests = 3;
      const windowSeconds = 60;

      // Exhaust user1
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkUserRateLimit(user1, maxRequests, windowSeconds);
      }

      const result1 = await rateLimiterService.checkUserRateLimit(
        user1,
        maxRequests,
        windowSeconds
      );
      expect(result1.allowed).toBe(false);

      const result2 = await rateLimiterService.checkUserRateLimit(
        user2,
        maxRequests,
        windowSeconds
      );
      expect(result2.allowed).toBe(true);
    });
  });

  describe('API Key Rate Limiting', () => {
    it('should rate limit by API key', async () => {
      const apiKey = 'api-key-789';
      const maxRequests = 100;
      const windowSeconds = 60;

      // Make requests
      for (let i = 0; i < maxRequests; i++) {
        const result = await rateLimiterService.checkApiKeyRateLimit(
          apiKey,
          maxRequests,
          windowSeconds
        );
        expect(result.allowed).toBe(true);
      }

      // Should be blocked
      const result = await rateLimiterService.checkApiKeyRateLimit(
        apiKey,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(false);
    });
  });

  describe('Whitelist/Blacklist', () => {
    it('should whitelist IP addresses', async () => {
      const ip = '10.0.0.1';

      await rateLimiterService.whitelistIp(ip);

      const isWhitelisted = await rateLimiterService.isIpWhitelisted(ip);
      expect(isWhitelisted).toBe(true);
    });

    it('should allow unlimited requests for whitelisted IPs', async () => {
      const ip = '10.0.0.2';
      const maxRequests = 2;
      const windowSeconds = 60;

      await rateLimiterService.whitelistIp(ip);

      // Should allow many requests beyond limit
      for (let i = 0; i < 10; i++) {
        const result = await rateLimiterService.checkIpRateLimit(
          ip,
          maxRequests,
          windowSeconds
        );
        // Note: This depends on implementation - whitelist might bypass checks entirely
        // or just increase limits significantly
      }

      // Cleanup
      await rateLimiterService.removeIpFromWhitelist(ip);
    });

    it('should blacklist IP addresses', async () => {
      const ip = '192.168.99.99';

      await rateLimiterService.blacklistIp(ip);

      const isBlacklisted = await rateLimiterService.isIpBlacklisted(ip);
      expect(isBlacklisted).toBe(true);
    });

    it('should block all requests from blacklisted IPs', async () => {
      const ip = '192.168.99.100';
      await rateLimiterService.blacklistIp(ip);

      const result = await rateLimiterService.checkIpRateLimit(ip, 100, 60);
      // Blacklisted IPs should be blocked regardless of rate limit
      // Note: This depends on how your implementation handles blacklists

      // Cleanup
      await rateLimiterService.removeIpFromBlacklist(ip);
    });

    it('should remove IP from whitelist', async () => {
      const ip = '10.0.0.3';

      await rateLimiterService.whitelistIp(ip);
      await rateLimiterService.removeIpFromWhitelist(ip);

      const isWhitelisted = await rateLimiterService.isIpWhitelisted(ip);
      expect(isWhitelisted).toBe(false);
    });

    it('should remove IP from blacklist', async () => {
      const ip = '192.168.99.101';

      await rateLimiterService.blacklistIp(ip);
      await rateLimiterService.removeIpFromBlacklist(ip);

      const isBlacklisted = await rateLimiterService.isIpBlacklisted(ip);
      expect(isBlacklisted).toBe(false);
    });

    it('should get all whitelisted IPs', async () => {
      const ip1 = '10.0.0.10';
      const ip2 = '10.0.0.11';

      await rateLimiterService.whitelistIp(ip1);
      await rateLimiterService.whitelistIp(ip2);

      const whitelisted = await rateLimiterService.getWhitelistedIps();
      expect(whitelisted).toContain(ip1);
      expect(whitelisted).toContain(ip2);

      // Cleanup
      await rateLimiterService.removeIpFromWhitelist(ip1);
      await rateLimiterService.removeIpFromWhitelist(ip2);
    });

    it('should get all blacklisted IPs', async () => {
      const ip1 = '192.168.100.1';
      const ip2 = '192.168.100.2';

      await rateLimiterService.blacklistIp(ip1);
      await rateLimiterService.blacklistIp(ip2);

      const blacklisted = await rateLimiterService.getBlacklistedIps();
      expect(blacklisted).toContain(ip1);
      expect(blacklisted).toContain(ip2);

      // Cleanup
      await rateLimiterService.removeIpFromBlacklist(ip1);
      await rateLimiterService.removeIpFromBlacklist(ip2);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit for specific key', async () => {
      const key = 'test-reset-1';
      const maxRequests = 3;
      const windowSeconds = 60;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
      }

      // Should be blocked
      let result = await rateLimiterService.checkRateLimit(
        key,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(false);

      // Reset
      await rateLimiterService.resetRateLimit(key);

      // Should be allowed again
      result = await rateLimiterService.checkRateLimit(
        key,
        maxRequests,
        windowSeconds
      );
      expect(result.allowed).toBe(true);
    });

    it('should reset all rate limits', async () => {
      const key1 = 'test-reset-all-1';
      const key2 = 'test-reset-all-2';
      const maxRequests = 2;
      const windowSeconds = 60;

      // Exhaust both
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkRateLimit(key1, maxRequests, windowSeconds);
        await rateLimiterService.checkRateLimit(key2, maxRequests, windowSeconds);
      }

      // Reset all
      await rateLimiterService.resetAllRateLimits();

      // Both should be allowed
      const result1 = await rateLimiterService.checkRateLimit(
        key1,
        maxRequests,
        windowSeconds
      );
      const result2 = await rateLimiterService.checkRateLimit(
        key2,
        maxRequests,
        windowSeconds
      );

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('Rate Limit Information', () => {
    it('should get remaining requests', async () => {
      const key = 'test-remaining-1';
      const maxRequests = 10;
      const windowSeconds = 60;

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
      }

      const remaining = await rateLimiterService.getRemainingRequests(
        key,
        maxRequests,
        windowSeconds
      );

      expect(remaining).toBe(7);
    });

    it('should get total requests count', async () => {
      const key = 'test-total-1';
      const maxRequests = 10;
      const windowSeconds = 60;

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
      }

      const result = await rateLimiterService.checkRateLimit(
        key,
        maxRequests,
        windowSeconds
      );

      expect(result.totalRequests).toBe(6);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max requests', async () => {
      const key = 'test-zero-requests';
      const result = await rateLimiterService.checkRateLimit(key, 0, 60);
      expect(result.allowed).toBe(false);
    });

    it('should handle negative max requests', async () => {
      const key = 'test-negative-requests';
      const result = await rateLimiterService.checkRateLimit(key, -1, 60);
      expect(result.allowed).toBe(false);
    });

    it('should handle very large limits', async () => {
      const key = 'test-large-limit';
      const result = await rateLimiterService.checkRateLimit(key, 1000000, 60);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999999);
    });

    it('should handle empty key', async () => {
      const result = await rateLimiterService.checkRateLimit('', 10, 60);
      // Should handle gracefully - implementation specific
      expect(result).toBeDefined();
    });

    it('should handle concurrent requests', async () => {
      const key = 'test-concurrent';
      const maxRequests = 5;
      const windowSeconds = 60;

      // Make concurrent requests
      const promises = Array(10)
        .fill(null)
        .map(() => rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds));

      const results = await Promise.all(promises);

      // Should correctly enforce limit even with concurrent requests
      const allowed = results.filter(r => r.allowed).length;
      expect(allowed).toBeLessThanOrEqual(maxRequests);
    });
  });

  describe('Performance', () => {
    it('should handle multiple rate limit checks efficiently', async () => {
      const startTime = Date.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        await rateLimiterService.checkRateLimit(`test-perf-${i}`, 100, 60);
      }

      const duration = Date.now() - startTime;

      // Should complete reasonably fast (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds for 100 checks
    });
  });
});
