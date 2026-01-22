/**
 * End-to-End Scenarios Tests
 * Real-world scenarios testing the entire cache system
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cacheService } from '../../cache.service.js';
import { tenantCacheService } from '../../tenant-cache.service.js';
import { userCacheService } from '../../user-cache.service.js';
import { rateLimiterService } from '../../rate-limiter.service.js';
import { waitForRedis, disconnectRedis } from '../../../db/redis.client.js';
import { prisma } from '../../../db/prisma.client.js';

describe('E2E Scenarios', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    try {
      await waitForRedis(10000);
      console.log('\n=== Starting E2E Scenario Tests ===\n');

      // Create test tenants
      const tenant1 = await prisma.tenant.create({
        data: {
          name: 'E2E Tenant 1',
          slug: `e2e-tenant1-${Date.now()}`,
          email: `e2e-tenant1-${Date.now()}@example.com`,
          subscription: {
            create: {
              plan: 'PREMIUM',
              status: 'ACTIVE',
              startDate: new Date(),
            },
          },
        },
      });
      tenant1Id = tenant1.id;

      const tenant2 = await prisma.tenant.create({
        data: {
          name: 'E2E Tenant 2',
          slug: `e2e-tenant2-${Date.now()}`,
          email: `e2e-tenant2-${Date.now()}@example.com`,
          subscription: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE',
              startDate: new Date(),
            },
          },
        },
      });
      tenant2Id = tenant2.id;

      // Create test users
      const user1 = await prisma.user.create({
        data: {
          email: `e2e-user1-${Date.now()}@example.com`,
          password: 'hashed-password-1',
          firstName: 'User',
          lastName: 'One',
          tenantId: tenant1Id,
        },
      });
      user1Id = user1.id;

      const user2 = await prisma.user.create({
        data: {
          email: `e2e-user2-${Date.now()}@example.com`,
          password: 'hashed-password-2',
          firstName: 'User',
          lastName: 'Two',
          tenantId: tenant2Id,
        },
      });
      user2Id = user2.id;

      console.log('✓ Test data created');
    } catch (error) {
      console.error('Failed to setup E2E tests:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Cleanup
    if (user1Id) {
      await prisma.user.delete({ where: { id: user1Id } }).catch(() => {});
    }
    if (user2Id) {
      await prisma.user.delete({ where: { id: user2Id } }).catch(() => {});
    }
    if (tenant1Id) {
      await prisma.subscription.deleteMany({ where: { tenantId: tenant1Id } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenant1Id } }).catch(() => {});
    }
    if (tenant2Id) {
      await prisma.subscription.deleteMany({ where: { tenantId: tenant2Id } }).catch(() => {});
      await prisma.tenant.delete({ where: { id: tenant2Id } }).catch(() => {});
    }

    await cacheService.deletePattern('e2e:*');
    await disconnectRedis();
    await prisma.$disconnect();
    console.log('\n=== E2E Tests Completed ===\n');
  });

  beforeEach(async () => {
    await cacheService.deletePattern('e2e:*');
  });

  describe('Scenario: User Login and Session Management', () => {
    it('should handle complete login flow with caching', async () => {
      console.log('  → Testing login flow...');

      // Step 1: Rate limit check (simulating login attempts)
      const ip = '192.168.1.100';
      const loginRateLimit = await rateLimiterService.checkRateLimit(
        `auth:login:${ip}`,
        5,
        300
      );
      expect(loginRateLimit.allowed).toBe(true);

      // Step 2: Load user from cache
      const user = await userCacheService.getUser(user1Id);
      expect(user).not.toBeNull();
      expect(user?.id).toBe(user1Id);

      // Step 3: Check user permissions
      const permissions = ['read:dashboard', 'write:posts', 'manage:team'];
      await userCacheService.setUserPermissions(user1Id, permissions);
      const hasPermission = await userCacheService.userHasPermission(
        user1Id,
        'read:dashboard'
      );
      expect(hasPermission).toBe(true);

      // Step 4: Create session
      const sessionData = {
        userId: user1Id,
        tenantId: tenant1Id,
        ip,
        userAgent: 'Mozilla/5.0',
        loginAt: new Date().toISOString(),
      };
      const sessionId = await userCacheService.createSession(user1Id, sessionData, 86400);
      expect(sessionId).toBeTruthy();

      // Step 5: Mark user online
      await userCacheService.markUserOnline(user1Id, tenant1Id);
      const isOnline = await userCacheService.isUserOnline(user1Id);
      expect(isOnline).toBe(true);

      // Step 6: Update last activity
      await userCacheService.updateUserLastActivity(user1Id);
      const lastActivity = await userCacheService.getUserLastActivity(user1Id);
      expect(lastActivity).not.toBeNull();

      console.log('  ✓ Login flow completed successfully');

      // Cleanup
      await userCacheService.deleteSession(sessionId);
      await userCacheService.markUserOffline(user1Id, tenant1Id);
    });

    it('should block excessive login attempts', async () => {
      console.log('  → Testing rate limiting on login...');

      const ip = '192.168.1.200';
      const maxAttempts = 5;

      // Exhaust rate limit
      for (let i = 0; i < maxAttempts; i++) {
        const result = await rateLimiterService.checkRateLimit(
          `auth:login:${ip}`,
          maxAttempts,
          300
        );
        expect(result.allowed).toBe(true);
      }

      // Next attempt should be blocked
      const blocked = await rateLimiterService.checkRateLimit(
        `auth:login:${ip}`,
        maxAttempts,
        300
      );
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfter).toBeGreaterThan(0);

      console.log('  ✓ Rate limiting works correctly');
    });
  });

  describe('Scenario: Multi-Tenant Data Isolation', () => {
    it('should isolate data between tenants', async () => {
      console.log('  → Testing tenant isolation...');

      // Tenant 1 settings
      const settings1 = {
        theme: 'dark',
        language: 'en',
        timezone: 'America/New_York',
        notifications: { email: true, sms: false },
      };
      await tenantCacheService.setTenantSettings(tenant1Id, settings1);

      // Tenant 2 settings
      const settings2 = {
        theme: 'light',
        language: 'fr',
        timezone: 'Europe/Paris',
        notifications: { email: false, sms: true },
      };
      await tenantCacheService.setTenantSettings(tenant2Id, settings2);

      // Verify isolation
      const retrieved1 = await tenantCacheService.getTenantSettings(tenant1Id);
      const retrieved2 = await tenantCacheService.getTenantSettings(tenant2Id);

      expect(retrieved1).toEqual(settings1);
      expect(retrieved2).toEqual(settings2);
      expect(retrieved1).not.toEqual(retrieved2);

      // Verify users are isolated too
      await userCacheService.markUserOnline(user1Id, tenant1Id);
      await userCacheService.markUserOnline(user2Id, tenant2Id);

      const onlineTenant1 = await userCacheService.getOnlineUsers(tenant1Id);
      const onlineTenant2 = await userCacheService.getOnlineUsers(tenant2Id);

      expect(onlineTenant1).toContain(user1Id);
      expect(onlineTenant1).not.toContain(user2Id);
      expect(onlineTenant2).toContain(user2Id);
      expect(onlineTenant2).not.toContain(user1Id);

      console.log('  ✓ Tenant isolation verified');

      // Cleanup
      await userCacheService.markUserOffline(user1Id, tenant1Id);
      await userCacheService.markUserOffline(user2Id, tenant2Id);
    });

    it('should enforce different rate limits per tenant', async () => {
      console.log('  → Testing per-tenant rate limits...');

      const tenant1Limit = 100;
      const tenant2Limit = 10;

      // Tenant 1 should have higher limit
      for (let i = 0; i < 50; i++) {
        const result = await rateLimiterService.checkTenantRateLimit(
          tenant1Id,
          tenant1Limit,
          60
        );
        expect(result.allowed).toBe(true);
      }

      // Tenant 2 should hit limit faster
      for (let i = 0; i < tenant2Limit; i++) {
        await rateLimiterService.checkTenantRateLimit(tenant2Id, tenant2Limit, 60);
      }

      const tenant2Blocked = await rateLimiterService.checkTenantRateLimit(
        tenant2Id,
        tenant2Limit,
        60
      );
      expect(tenant2Blocked.allowed).toBe(false);

      console.log('  ✓ Per-tenant rate limits working');
    });
  });

  describe('Scenario: API Request Lifecycle', () => {
    it('should handle complete API request with caching and rate limiting', async () => {
      console.log('  → Testing API request lifecycle...');

      const ip = '10.0.0.50';
      const endpoint = '/api/dashboard/stats';

      // Step 1: Check IP rate limit
      const ipLimit = await rateLimiterService.checkIpRateLimit(ip, 100, 60);
      expect(ipLimit.allowed).toBe(true);

      // Step 2: Check tenant rate limit
      const tenantLimit = await rateLimiterService.checkTenantRateLimit(
        tenant1Id,
        1000,
        60
      );
      expect(tenantLimit.allowed).toBe(true);

      // Step 3: Check user rate limit
      const userLimit = await rateLimiterService.checkUserRateLimit(user1Id, 50, 60);
      expect(userLimit.allowed).toBe(true);

      // Step 4: Check cache for response
      const cacheKey = `e2e:response:${tenant1Id}:${endpoint}`;
      let cachedResponse = await cacheService.get(cacheKey);

      if (!cachedResponse) {
        // Simulate API processing
        const response = {
          stats: {
            users: 150,
            posts: 1250,
            comments: 3500,
            likes: 12000,
          },
          generatedAt: new Date().toISOString(),
        };

        // Cache the response
        await cacheService.set(cacheKey, response, { ttl: 300 });
        cachedResponse = response;

        console.log('  ✓ Response generated and cached');
      } else {
        console.log('  ✓ Response served from cache');
      }

      expect(cachedResponse).toBeDefined();
      expect(cachedResponse).toHaveProperty('stats');

      // Step 5: Update user activity
      await userCacheService.updateUserLastActivity(user1Id);
      await userCacheService.incrementUserAction(user1Id, 'api_calls');

      const actionCount = await userCacheService.getUserActionCount(user1Id, 'api_calls');
      expect(actionCount).toBeGreaterThanOrEqual(1);

      console.log('  ✓ API request lifecycle completed');
    });

    it('should handle concurrent requests efficiently', async () => {
      console.log('  → Testing concurrent API requests...');

      const endpoint = '/api/users/list';
      const cacheKey = `e2e:response:${tenant1Id}:${endpoint}`;

      // Pre-cache the response
      const response = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: `user-${i}`,
          name: `User ${i}`,
        })),
      };
      await cacheService.set(cacheKey, response, { ttl: 300 });

      // Make 100 concurrent requests
      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, async () => {
        // Check rate limits
        await rateLimiterService.checkTenantRateLimit(tenant1Id, 1000, 60);
        // Get cached response
        return cacheService.get(cacheKey);
      });

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(results.every(r => r !== null)).toBe(true);
      expect(duration).toBeLessThan(2000); // Should be fast with cache

      console.log(`  ✓ 100 concurrent requests completed in ${duration}ms`);
    });
  });

  describe('Scenario: Real-time Collaboration', () => {
    it('should track online users and activity', async () => {
      console.log('  → Testing real-time collaboration features...');

      // Multiple users come online
      const additionalUsers = await Promise.all([
        prisma.user.create({
          data: {
            email: `e2e-collab-${Date.now()}-1@example.com`,
            password: 'password',
            firstName: 'Collab',
            lastName: 'User1',
            tenantId: tenant1Id,
          },
        }),
        prisma.user.create({
          data: {
            email: `e2e-collab-${Date.now()}-2@example.com`,
            password: 'password',
            firstName: 'Collab',
            lastName: 'User2',
            tenantId: tenant1Id,
          },
        }),
      ]);

      const collabUser1Id = additionalUsers[0].id;
      const collabUser2Id = additionalUsers[1].id;

      // Mark users as online
      await userCacheService.markUserOnline(user1Id, tenant1Id);
      await userCacheService.markUserOnline(collabUser1Id, tenant1Id);
      await userCacheService.markUserOnline(collabUser2Id, tenant1Id);

      // Check online count
      const onlineCount = await userCacheService.getOnlineUsersCount(tenant1Id);
      expect(onlineCount).toBeGreaterThanOrEqual(3);

      // Get all online users
      const onlineUsers = await userCacheService.getOnlineUsers(tenant1Id);
      expect(onlineUsers).toContain(user1Id);
      expect(onlineUsers).toContain(collabUser1Id);
      expect(onlineUsers).toContain(collabUser2Id);

      // Simulate activity
      await userCacheService.updateUserLastActivity(user1Id);
      await userCacheService.updateUserLastActivity(collabUser1Id);

      // One user goes offline
      await userCacheService.markUserOffline(collabUser1Id, tenant1Id);

      const newOnlineCount = await userCacheService.getOnlineUsersCount(tenant1Id);
      expect(newOnlineCount).toBe(onlineCount - 1);

      console.log('  ✓ Real-time collaboration features working');

      // Cleanup
      await userCacheService.markUserOffline(user1Id, tenant1Id);
      await userCacheService.markUserOffline(collabUser2Id, tenant1Id);
      await prisma.user.delete({ where: { id: collabUser1Id } }).catch(() => {});
      await prisma.user.delete({ where: { id: collabUser2Id } }).catch(() => {});
    });
  });

  describe('Scenario: Cache Invalidation on Updates', () => {
    it('should invalidate cache when data changes', async () => {
      console.log('  → Testing cache invalidation...');

      // Cache tenant data
      const tenant = await tenantCacheService.getTenant(tenant1Id);
      expect(tenant).not.toBeNull();

      // Verify it's cached
      const cacheKey = `tenant:${tenant1Id}`;
      let cached = await cacheService.get(cacheKey);
      expect(cached).not.toBeNull();

      // Simulate tenant update
      await prisma.tenant.update({
        where: { id: tenant1Id },
        data: { name: 'Updated Tenant Name' },
      });

      // Invalidate cache
      await tenantCacheService.invalidateTenant(tenant1Id);

      // Verify cache is cleared
      cached = await cacheService.get(cacheKey);
      expect(cached).toBeNull();

      // Next fetch should get updated data
      const updatedTenant = await tenantCacheService.getTenant(tenant1Id);
      expect(updatedTenant?.name).toBe('Updated Tenant Name');

      console.log('  ✓ Cache invalidation working correctly');
    });

    it('should handle cascading invalidation', async () => {
      console.log('  → Testing cascading invalidation...');

      // Cache tenant and related data
      await tenantCacheService.getTenant(tenant1Id);
      await tenantCacheService.setTenantSettings(tenant1Id, { theme: 'dark' });
      await tenantCacheService.setTenantFeatures(tenant1Id, { feature1: true });

      // Invalidate tenant (should clear all related caches)
      await tenantCacheService.invalidateTenant(tenant1Id);

      // Verify all related caches are cleared
      const tenant = await cacheService.get(`tenant:${tenant1Id}`);
      const settings = await tenantCacheService.getTenantSettings(tenant1Id);
      const features = await tenantCacheService.getTenantFeatures(tenant1Id);

      expect(tenant).toBeNull();
      expect(settings).toBeNull();
      expect(features).toBeNull();

      console.log('  ✓ Cascading invalidation working');
    });
  });

  describe('Scenario: High Traffic Spike', () => {
    it('should handle traffic spike with rate limiting', async () => {
      console.log('  → Testing high traffic spike handling...');

      const ip = '203.0.113.100';
      const maxRequests = 50;
      const requestsToMake = 100;

      let allowed = 0;
      let blocked = 0;

      // Simulate traffic spike
      const promises = Array.from({ length: requestsToMake }, async () => {
        const result = await rateLimiterService.checkIpRateLimit(ip, maxRequests, 60);
        if (result.allowed) {
          allowed++;
        } else {
          blocked++;
        }
        return result;
      });

      await Promise.all(promises);

      expect(allowed).toBeLessThanOrEqual(maxRequests);
      expect(blocked).toBeGreaterThan(0);
      expect(allowed + blocked).toBe(requestsToMake);

      console.log(`  ✓ Traffic spike handled: ${allowed} allowed, ${blocked} blocked`);
    });
  });

  describe('Scenario: Session Timeout and Cleanup', () => {
    it('should expire sessions after TTL', async () => {
      console.log('  → Testing session expiration...');

      // Create session with short TTL
      const sessionData = {
        userId: user1Id,
        tenantId: tenant1Id,
      };
      const sessionId = await userCacheService.createSession(user1Id, sessionData, 2);

      // Verify session exists
      let session = await userCacheService.getSession(sessionId);
      expect(session).not.toBeNull();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Verify session expired
      session = await userCacheService.getSession(sessionId);
      expect(session).toBeNull();

      console.log('  ✓ Session expiration working');
    });
  });

  describe('Scenario: Performance Under Load', () => {
    it('should maintain performance with mixed operations', async () => {
      console.log('  → Testing performance under mixed load...');

      const operations = 500;
      const startTime = Date.now();

      const promises = Array.from({ length: operations }, async (_, i) => {
        const key = `e2e:perf:${i}`;

        if (i % 4 === 0) {
          // Write operation
          await cacheService.set(key, { data: i }, { ttl: 60 });
        } else if (i % 4 === 1) {
          // Read operation
          await cacheService.get(key);
        } else if (i % 4 === 2) {
          // Rate limit check
          await rateLimiterService.checkRateLimit(`perf:${i}`, 100, 60);
        } else {
          // Counter increment
          await cacheService.increment(`e2e:counter:${i % 10}`);
        }
      });

      await Promise.all(promises);
      const duration = Date.now() - startTime;
      const opsPerSecond = (operations / duration) * 1000;

      console.log(`  ✓ ${operations} mixed operations: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(5000);
      expect(opsPerSecond).toBeGreaterThan(50);
    });
  });
});
