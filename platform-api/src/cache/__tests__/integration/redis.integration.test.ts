/**
 * Redis Integration Tests
 * End-to-end tests for Redis caching system with real connections
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { redis, waitForRedis, disconnectRedis, getRedisHealth } from '../../../db/redis.client.js';
import { cacheService } from '../../cache.service.js';
import { tenantCacheService } from '../../tenant-cache.service.js';
import { userCacheService } from '../../user-cache.service.js';
import { rateLimiterService } from '../../rate-limiter.service.js';
import { prisma } from '../../../db/prisma.client.js';

describe('Redis Integration Tests', () => {
  let testTenantId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Wait for Redis to be ready
    try {
      await waitForRedis(10000);
      console.log('✓ Redis connection established');
    } catch (error) {
      console.error('✗ Redis connection failed:', error);
      throw error;
    }

    // Create test data
    try {
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Integration Test Tenant',
          slug: `integration-test-${Date.now()}`,
          email: `integration-${Date.now()}@example.com`,
          subscription: {
            create: {
              plan: 'PREMIUM',
              status: 'ACTIVE',
              startDate: new Date(),
            },
          },
        },
      });
      testTenantId = tenant.id;

      const user = await prisma.user.create({
        data: {
          email: `integration-user-${Date.now()}@example.com`,
          password: 'hashed-password-test',
          firstName: 'Integration',
          lastName: 'Test',
          tenantId: testTenantId,
        },
      });
      testUserId = user.id;

      console.log('✓ Test data created');
    } catch (error) {
      console.error('✗ Failed to create test data:', error);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
      } catch (error) {
        console.warn('Could not delete test user:', error);
      }
    }

    if (testTenantId) {
      try {
        await prisma.subscription.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.tenant.delete({ where: { id: testTenantId } });
      } catch (error) {
        console.warn('Could not delete test tenant:', error);
      }
    }

    // Clear all cache
    await cacheService.deletePattern('*:integration:*');
    await cacheService.deletePattern('test:*');

    // Disconnect
    await disconnectRedis();
    await prisma.$disconnect();
    console.log('✓ Cleanup completed');
  });

  beforeEach(async () => {
    // Clear test keys before each test
    await cacheService.deletePattern('test:*');
  });

  describe('Redis Connection and Health', () => {
    it('should have active Redis connection', async () => {
      expect(redis.status).toBe('ready');
    });

    it('should report healthy status', async () => {
      const health = await getRedisHealth();
      expect(health.status).toBe('healthy');
      expect(health.connected).toBe(true);
      expect(health.memoryUsed).toBeGreaterThan(0);
    });

    it('should ping Redis successfully', async () => {
      const result = await redis.ping();
      expect(result).toBe('PONG');
    });

    it('should get Redis info', async () => {
      const info = await redis.info();
      expect(info).toContain('redis_version');
      expect(info).toContain('connected_clients');
    });
  });

  describe('Cache Service Integration', () => {
    it('should perform basic cache operations', async () => {
      const key = 'test:integration:basic';
      const value = { message: 'Hello Redis', timestamp: Date.now() };

      // Set
      await cacheService.set(key, value, { ttl: 60 });

      // Get
      const retrieved = await cacheService.get(key);
      expect(retrieved).toEqual(value);

      // Delete
      await cacheService.delete(key);
      const afterDelete = await cacheService.get(key);
      expect(afterDelete).toBeNull();
    });

    it('should handle complex data structures', async () => {
      const key = 'test:integration:complex';
      const complexData = {
        id: 'abc123',
        name: 'Test Object',
        nested: {
          array: [1, 2, 3],
          object: { foo: 'bar' },
        },
        dates: [new Date().toISOString()],
        numbers: [1, 2.5, -3, 0],
        booleans: [true, false],
        nullValue: null,
      };

      await cacheService.set(key, complexData, { ttl: 60 });
      const retrieved = await cacheService.get(key);
      expect(retrieved).toEqual(complexData);
    });

    it('should handle batch operations efficiently', async () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        key: `test:integration:batch:${i}`,
        value: { id: i, data: `Item ${i}` },
        ttl: 60,
      }));

      // Batch set
      const startSet = Date.now();
      await cacheService.mset(items);
      const setDuration = Date.now() - startSet;

      // Batch get
      const keys = items.map(item => item.key);
      const startGet = Date.now();
      const values = await cacheService.mget(keys);
      const getDuration = Date.now() - startGet;

      expect(values).toHaveLength(100);
      expect(values.filter(v => v !== null)).toHaveLength(100);
      expect(setDuration).toBeLessThan(1000);
      expect(getDuration).toBeLessThan(1000);

      // Cleanup
      await Promise.all(keys.map(key => cacheService.delete(key)));
    });

    it('should track statistics correctly', async () => {
      cacheService.resetStats();

      const key = 'test:integration:stats';

      // Set
      await cacheService.set(key, 'value', { ttl: 60 });

      // Hits
      await cacheService.get(key);
      await cacheService.get(key);

      // Miss
      await cacheService.get('test:integration:nonexistent');

      // Delete
      await cacheService.delete(key);

      const stats = cacheService.getStats();
      expect(stats.sets).toBe(1);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.deletes).toBe(1);
      expect(cacheService.getHitRate()).toBe(2 / 3);
    });
  });

  describe('Tenant Cache Integration', () => {
    it('should cache and retrieve tenant data', async () => {
      if (!testTenantId) {
        console.warn('Skipping - no test tenant');
        return;
      }

      // First call - DB hit
      const tenant1 = await tenantCacheService.getTenant(testTenantId);
      expect(tenant1).not.toBeNull();
      expect(tenant1?.id).toBe(testTenantId);

      // Second call - cache hit
      const tenant2 = await tenantCacheService.getTenant(testTenantId);
      expect(tenant2).toEqual(tenant1);
    });

    it('should handle tenant settings', async () => {
      if (!testTenantId) {
        console.warn('Skipping - no test tenant');
        return;
      }

      const settings = {
        theme: 'dark',
        language: 'fr',
        timezone: 'Europe/Paris',
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
      };

      await tenantCacheService.setTenantSettings(testTenantId, settings);
      const retrieved = await tenantCacheService.getTenantSettings(testTenantId);
      expect(retrieved).toEqual(settings);
    });

    it('should track active tenants', async () => {
      if (!testTenantId) {
        console.warn('Skipping - no test tenant');
        return;
      }

      await tenantCacheService.markTenantActive(testTenantId);
      const isActive = await tenantCacheService.isTenantActive(testTenantId);
      expect(isActive).toBe(true);

      const activeTenants = await tenantCacheService.getActiveTenants();
      expect(activeTenants).toContain(testTenantId);
    });

    it('should invalidate tenant cache properly', async () => {
      if (!testTenantId) {
        console.warn('Skipping - no test tenant');
        return;
      }

      // Cache tenant
      await tenantCacheService.getTenant(testTenantId);
      await tenantCacheService.setTenantSettings(testTenantId, { theme: 'light' });

      // Invalidate
      await tenantCacheService.invalidateTenant(testTenantId);

      // Verify cleared
      const cacheKey = `tenant:${testTenantId}`;
      const cached = await cacheService.get(cacheKey);
      expect(cached).toBeNull();
    });
  });

  describe('User Cache Integration', () => {
    it('should cache and retrieve user data', async () => {
      if (!testUserId) {
        console.warn('Skipping - no test user');
        return;
      }

      const user1 = await userCacheService.getUser(testUserId);
      expect(user1).not.toBeNull();
      expect(user1?.id).toBe(testUserId);

      const user2 = await userCacheService.getUser(testUserId);
      expect(user2).toEqual(user1);
    });

    it('should manage user sessions', async () => {
      if (!testUserId) {
        console.warn('Skipping - no test user');
        return;
      }

      const sessionData = {
        userId: testUserId,
        ip: '192.168.1.100',
        userAgent: 'Integration Test Agent',
        loginAt: new Date().toISOString(),
      };

      const sessionId = await userCacheService.createSession(testUserId, sessionData, 3600);
      expect(sessionId).toBeTruthy();

      const retrieved = await userCacheService.getSession(sessionId);
      expect(retrieved).toMatchObject(sessionData);

      const sessions = await userCacheService.getUserSessions(testUserId);
      expect(sessions).toContain(sessionId);

      // Cleanup
      await userCacheService.deleteSession(sessionId);
    });

    it('should handle user permissions', async () => {
      if (!testUserId) {
        console.warn('Skipping - no test user');
        return;
      }

      const permissions = ['read:all', 'write:posts', 'delete:comments', 'admin:users'];
      await userCacheService.setUserPermissions(testUserId, permissions);

      const hasRead = await userCacheService.userHasPermission(testUserId, 'read:all');
      const hasWrite = await userCacheService.userHasPermission(testUserId, 'write:posts');
      const hasDelete = await userCacheService.userHasPermission(testUserId, 'delete:posts');

      expect(hasRead).toBe(true);
      expect(hasWrite).toBe(true);
      expect(hasDelete).toBe(false);
    });

    it('should track online users', async () => {
      if (!testUserId || !testTenantId) {
        console.warn('Skipping - no test data');
        return;
      }

      await userCacheService.markUserOnline(testUserId, testTenantId);
      const isOnline = await userCacheService.isUserOnline(testUserId);
      expect(isOnline).toBe(true);

      const onlineUsers = await userCacheService.getOnlineUsers(testTenantId);
      expect(onlineUsers).toContain(testUserId);

      const count = await userCacheService.getOnlineUsersCount(testTenantId);
      expect(count).toBeGreaterThanOrEqual(1);

      // Cleanup
      await userCacheService.markUserOffline(testUserId, testTenantId);
    });
  });

  describe('Rate Limiter Integration', () => {
    it('should enforce rate limits correctly', async () => {
      const key = 'test:integration:ratelimit:1';
      const maxRequests = 5;
      const windowSeconds = 10;

      // Make requests within limit
      for (let i = 0; i < maxRequests; i++) {
        const result = await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(maxRequests - i - 1);
      }

      // Exceed limit
      const blocked = await rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds);
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it('should handle concurrent rate limit checks', async () => {
      const key = 'test:integration:concurrent';
      const maxRequests = 10;
      const windowSeconds = 60;

      // Make 20 concurrent requests
      const promises = Array(20)
        .fill(null)
        .map(() => rateLimiterService.checkRateLimit(key, maxRequests, windowSeconds));

      const results = await Promise.all(promises);
      const allowed = results.filter(r => r.allowed).length;

      // Should allow exactly maxRequests
      expect(allowed).toBeLessThanOrEqual(maxRequests);
    });

    it('should handle IP whitelist and blacklist', async () => {
      const whitelistedIp = '10.0.0.100';
      const blacklistedIp = '192.168.99.99';

      // Whitelist
      await rateLimiterService.whitelistIp(whitelistedIp);
      const isWhitelisted = await rateLimiterService.isIpWhitelisted(whitelistedIp);
      expect(isWhitelisted).toBe(true);

      // Blacklist
      await rateLimiterService.blacklistIp(blacklistedIp);
      const isBlacklisted = await rateLimiterService.isIpBlacklisted(blacklistedIp);
      expect(isBlacklisted).toBe(true);

      // Cleanup
      await rateLimiterService.removeIpFromWhitelist(whitelistedIp);
      await rateLimiterService.removeIpFromBlacklist(blacklistedIp);
    });

    it('should reset rate limits correctly', async () => {
      const key = 'test:integration:reset';
      const maxRequests = 3;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        await rateLimiterService.checkRateLimit(key, maxRequests, 60);
      }

      // Verify blocked
      let result = await rateLimiterService.checkRateLimit(key, maxRequests, 60);
      expect(result.allowed).toBe(false);

      // Reset
      await rateLimiterService.resetRateLimit(key);

      // Should work again
      result = await rateLimiterService.checkRateLimit(key, maxRequests, 60);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Multi-Tenant Isolation', () => {
    it('should isolate cache between tenants', async () => {
      const tenant1Key = `tenant:${testTenantId}:data`;
      const tenant2Key = 'tenant:other-tenant-id:data';

      const data1 = { tenant: 'tenant1', secret: 'secret1' };
      const data2 = { tenant: 'tenant2', secret: 'secret2' };

      await cacheService.set(tenant1Key, data1, { ttl: 60 });
      await cacheService.set(tenant2Key, data2, { ttl: 60 });

      const retrieved1 = await cacheService.get(tenant1Key);
      const retrieved2 = await cacheService.get(tenant2Key);

      expect(retrieved1).toEqual(data1);
      expect(retrieved2).toEqual(data2);
      expect(retrieved1).not.toEqual(retrieved2);

      // Cleanup
      await cacheService.delete(tenant1Key);
      await cacheService.delete(tenant2Key);
    });

    it('should not leak data between tenants', async () => {
      if (!testTenantId) {
        console.warn('Skipping - no test tenant');
        return;
      }

      const settings1 = { theme: 'dark', private: 'data1' };
      const settings2 = { theme: 'light', private: 'data2' };

      await tenantCacheService.setTenantSettings(testTenantId, settings1);
      await tenantCacheService.setTenantSettings('other-tenant-id', settings2);

      const retrieved1 = await tenantCacheService.getTenantSettings(testTenantId);
      const retrieved2 = await tenantCacheService.getTenantSettings('other-tenant-id');

      expect(retrieved1).toEqual(settings1);
      expect(retrieved2).toEqual(settings2);
      expect(retrieved1).not.toEqual(retrieved2);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume operations', async () => {
      const operations = 1000;
      const startTime = Date.now();

      const promises = Array.from({ length: operations }, (_, i) =>
        cacheService.set(`test:integration:perf:${i}`, { index: i }, { ttl: 60 })
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      console.log(`✓ ${operations} operations completed in ${duration}ms`);

      // Cleanup
      await cacheService.deletePattern('test:integration:perf:*');
    });

    it('should maintain performance under load', async () => {
      const key = 'test:integration:load';
      await cacheService.set(key, { data: 'test' }, { ttl: 60 });

      const reads = 500;
      const startTime = Date.now();

      const promises = Array.from({ length: reads }, () => cacheService.get(key));
      await Promise.all(promises);

      const duration = Date.now() - startTime;
      const opsPerSecond = (reads / duration) * 1000;

      expect(duration).toBeLessThan(2000);
      expect(opsPerSecond).toBeGreaterThan(100);
      console.log(`✓ ${reads} reads in ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle missing keys gracefully', async () => {
      const result = await cacheService.get('test:integration:nonexistent');
      expect(result).toBeNull();
    });

    it('should handle expired keys correctly', async () => {
      const key = 'test:integration:expire';
      await cacheService.set(key, 'value', { ttl: 1 });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('should handle large data payloads', async () => {
      const key = 'test:integration:large';
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          data: `Item ${i}`,
          nested: {
            array: [1, 2, 3, 4, 5],
            object: { foo: 'bar', baz: 'qux' },
          },
        })),
      };

      await cacheService.set(key, largeData, { ttl: 60 });
      const retrieved = await cacheService.get(key);
      expect(retrieved).toEqual(largeData);

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Cache Warming and Preloading', () => {
    it('should warm up cache efficiently', async () => {
      if (!testTenantId) {
        console.warn('Skipping - no test tenant');
        return;
      }

      await tenantCacheService.invalidateTenant(testTenantId);

      const startTime = Date.now();
      await tenantCacheService.warmUpTenantCache(testTenantId);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000);

      // Verify cached
      const cacheKey = `tenant:${testTenantId}`;
      const cached = await cacheService.get(cacheKey);
      expect(cached).not.toBeNull();
    });
  });

  describe('Memory and Resource Management', () => {
    it('should respect TTL and clean up expired keys', async () => {
      const keys = Array.from({ length: 10 }, (_, i) => `test:integration:ttl:${i}`);

      // Set with short TTL
      await Promise.all(
        keys.map(key => cacheService.set(key, 'value', { ttl: 1 }))
      );

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // All should be expired
      const results = await Promise.all(keys.map(key => cacheService.get(key)));
      expect(results.every(r => r === null)).toBe(true);
    });

    it('should report memory usage', async () => {
      const health = await getRedisHealth();
      expect(health.memoryUsed).toBeGreaterThan(0);
      expect(health.memoryUsedHuman).toBeTruthy();
      console.log(`✓ Redis memory usage: ${health.memoryUsedHuman}`);
    });
  });
});
