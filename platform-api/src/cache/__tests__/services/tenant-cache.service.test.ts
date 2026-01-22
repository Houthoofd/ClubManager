/**
 * Tenant Cache Service Tests
 * Tests for tenant caching functionality with multi-tenant isolation
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { tenantCacheService } from '../tenant-cache.service.js';
import { cacheService } from '../cache.service.js';
import { waitForRedis, disconnectRedis } from '../../db/redis.client.js';
import { prisma } from '../../db/prisma.client.js';

describe('TenantCacheService', () => {
  let testTenantId: string;
  let testTenantSlug: string;

  beforeAll(async () => {
    // Wait for Redis connection
    try {
      await waitForRedis(5000);
    } catch (error) {
      console.warn('Redis not available for tests - skipping');
      return;
    }

    // Create a test tenant in the database
    try {
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Test Tenant Cache',
          slug: `test-tenant-cache-${Date.now()}`,
          email: `test-cache-${Date.now()}@example.com`,
          subscription: {
            create: {
              plan: 'FREE',
              status: 'ACTIVE',
              startDate: new Date(),
            },
          },
        },
      });
      testTenantId = tenant.id;
      testTenantSlug = tenant.slug;
    } catch (error) {
      console.warn('Could not create test tenant:', error);
    }
  });

  afterAll(async () => {
    // Cleanup test tenant
    if (testTenantId) {
      try {
        await prisma.subscription.deleteMany({
          where: { tenantId: testTenantId },
        });
        await prisma.tenant.delete({
          where: { id: testTenantId },
        });
      } catch (error) {
        console.warn('Could not cleanup test tenant:', error);
      }
    }

    // Clear cache and disconnect
    await tenantCacheService.clearAllTenantCaches();
    await disconnectRedis();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear tenant cache before each test
    if (testTenantId) {
      await tenantCacheService.invalidateTenant(testTenantId);
    }
  });

  describe('Tenant Data Caching', () => {
    it('should cache tenant by ID', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      // First call - should fetch from DB and cache
      const tenant1 = await tenantCacheService.getTenant(testTenantId);
      expect(tenant1).not.toBeNull();
      expect(tenant1?.id).toBe(testTenantId);
      expect(tenant1?.slug).toBe(testTenantSlug);

      // Second call - should return from cache
      const tenant2 = await tenantCacheService.getTenant(testTenantId);
      expect(tenant2).toEqual(tenant1);
    });

    it('should cache tenant by slug', async () => {
      if (!testTenantSlug) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      // First call - should fetch from DB and cache
      const tenant1 = await tenantCacheService.getTenantBySlug(testTenantSlug);
      expect(tenant1).not.toBeNull();
      expect(tenant1?.slug).toBe(testTenantSlug);

      // Second call - should return from cache
      const tenant2 = await tenantCacheService.getTenantBySlug(testTenantSlug);
      expect(tenant2).toEqual(tenant1);
    });

    it('should return null for non-existent tenant', async () => {
      const tenant = await tenantCacheService.getTenant('non-existent-id');
      expect(tenant).toBeNull();
    });

    it('should return null for non-existent slug', async () => {
      const tenant = await tenantCacheService.getTenantBySlug('non-existent-slug');
      expect(tenant).toBeNull();
    });
  });

  describe('Tenant ID Lookup', () => {
    it('should lookup tenant ID by slug', async () => {
      if (!testTenantSlug || !testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const tenantId = await tenantCacheService.getTenantIdBySlug(testTenantSlug);
      expect(tenantId).toBe(testTenantId);
    });

    it('should cache tenant ID lookup', async () => {
      if (!testTenantSlug || !testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      // First call
      const id1 = await tenantCacheService.getTenantIdBySlug(testTenantSlug);

      // Second call - should be from cache
      const id2 = await tenantCacheService.getTenantIdBySlug(testTenantSlug);

      expect(id1).toBe(id2);
      expect(id1).toBe(testTenantId);
    });

    it('should return null for non-existent slug lookup', async () => {
      const tenantId = await tenantCacheService.getTenantIdBySlug('non-existent-slug-lookup');
      expect(tenantId).toBeNull();
    });
  });

  describe('Tenant Settings', () => {
    it('should cache tenant settings', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const settings = {
        emailNotifications: true,
        theme: 'dark',
        language: 'fr',
        timezone: 'Europe/Paris',
      };

      await tenantCacheService.setTenantSettings(testTenantId, settings);

      const cached = await tenantCacheService.getTenantSettings(testTenantId);
      expect(cached).toEqual(settings);
    });

    it('should update cached settings', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const settings1 = { theme: 'light' };
      await tenantCacheService.setTenantSettings(testTenantId, settings1);

      const settings2 = { theme: 'dark' };
      await tenantCacheService.setTenantSettings(testTenantId, settings2);

      const cached = await tenantCacheService.getTenantSettings(testTenantId);
      expect(cached).toEqual(settings2);
    });

    it('should return null for non-existent settings', async () => {
      const settings = await tenantCacheService.getTenantSettings('non-existent-tenant');
      expect(settings).toBeNull();
    });
  });

  describe('Tenant Features', () => {
    it('should cache tenant features', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const features = {
        advancedReporting: true,
        customBranding: false,
        apiAccess: true,
        maxUsers: 100,
      };

      await tenantCacheService.setTenantFeatures(testTenantId, features);

      const cached = await tenantCacheService.getTenantFeatures(testTenantId);
      expect(cached).toEqual(features);
    });

    it('should check if feature is enabled', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const features = {
        feature1: true,
        feature2: false,
        feature3: true,
      };

      await tenantCacheService.setTenantFeatures(testTenantId, features);

      const isEnabled1 = await tenantCacheService.isTenantFeatureEnabled(testTenantId, 'feature1');
      const isEnabled2 = await tenantCacheService.isTenantFeatureEnabled(testTenantId, 'feature2');
      const isEnabled3 = await tenantCacheService.isTenantFeatureEnabled(testTenantId, 'nonExistent');

      expect(isEnabled1).toBe(true);
      expect(isEnabled2).toBe(false);
      expect(isEnabled3).toBe(false);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate tenant cache', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      // Cache the tenant
      await tenantCacheService.getTenant(testTenantId);

      // Verify it's cached
      const cacheKey = `tenant:${testTenantId}`;
      const cached = await cacheService.get(cacheKey);
      expect(cached).not.toBeNull();

      // Invalidate
      await tenantCacheService.invalidateTenant(testTenantId);

      // Verify it's removed
      const afterInvalidate = await cacheService.get(cacheKey);
      expect(afterInvalidate).toBeNull();
    });

    it('should invalidate tenant settings', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const settings = { theme: 'light' };
      await tenantCacheService.setTenantSettings(testTenantId, settings);

      await tenantCacheService.invalidateTenantSettings(testTenantId);

      const cached = await tenantCacheService.getTenantSettings(testTenantId);
      expect(cached).toBeNull();
    });

    it('should invalidate tenant features', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const features = { feature1: true };
      await tenantCacheService.setTenantFeatures(testTenantId, features);

      await tenantCacheService.invalidateTenantFeatures(testTenantId);

      const cached = await tenantCacheService.getTenantFeatures(testTenantId);
      expect(cached).toBeNull();
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple tenants', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const tenants = await tenantCacheService.getMultipleTenants([
        testTenantId,
        'non-existent-id',
      ]);

      expect(tenants).toHaveLength(2);
      expect(tenants[0]).not.toBeNull();
      expect(tenants[0]?.id).toBe(testTenantId);
      expect(tenants[1]).toBeNull();
    });

    it('should cache results from batch operations', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      // First call - fetches from DB
      await tenantCacheService.getMultipleTenants([testTenantId]);

      // Verify it's now cached
      const cacheKey = `tenant:${testTenantId}`;
      const cached = await cacheService.get(cacheKey);
      expect(cached).not.toBeNull();
    });
  });

  describe('Tenant Statistics', () => {
    it('should increment tenant counter', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const count1 = await tenantCacheService.incrementTenantCounter(
        testTenantId,
        'api_calls'
      );
      expect(count1).toBeGreaterThanOrEqual(1);

      const count2 = await tenantCacheService.incrementTenantCounter(
        testTenantId,
        'api_calls',
        5
      );
      expect(count2).toBe(count1 + 5);
    });

    it('should get tenant counter', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      await tenantCacheService.incrementTenantCounter(testTenantId, 'requests', 10);

      const count = await tenantCacheService.getTenantCounter(testTenantId, 'requests');
      expect(count).toBeGreaterThanOrEqual(10);
    });

    it('should reset tenant counter', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      await tenantCacheService.incrementTenantCounter(testTenantId, 'errors', 5);
      await tenantCacheService.resetTenantCounter(testTenantId, 'errors');

      const count = await tenantCacheService.getTenantCounter(testTenantId, 'errors');
      expect(count).toBe(0);
    });
  });

  describe('Active Tenants Tracking', () => {
    it('should track active tenants', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      await tenantCacheService.markTenantActive(testTenantId);

      const isActive = await tenantCacheService.isTenantActive(testTenantId);
      expect(isActive).toBe(true);
    });

    it('should get all active tenants', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      await tenantCacheService.markTenantActive(testTenantId);

      const activeTenants = await tenantCacheService.getActiveTenants();
      expect(activeTenants).toContain(testTenantId);
    });

    it('should remove inactive tenant', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      await tenantCacheService.markTenantActive(testTenantId);
      await tenantCacheService.removeTenantActive(testTenantId);

      const isActive = await tenantCacheService.isTenantActive(testTenantId);
      expect(isActive).toBe(false);
    });
  });

  describe('Tenant Cache Warming', () => {
    it('should warm up tenant cache', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      // Clear cache first
      await tenantCacheService.invalidateTenant(testTenantId);

      // Warm up
      await tenantCacheService.warmUpTenantCache(testTenantId);

      // Verify it's cached
      const cacheKey = `tenant:${testTenantId}`;
      const cached = await cacheService.get(cacheKey);
      expect(cached).not.toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle null tenant ID gracefully', async () => {
      const tenant = await tenantCacheService.getTenant('');
      expect(tenant).toBeNull();
    });

    it('should handle null slug gracefully', async () => {
      const tenant = await tenantCacheService.getTenantBySlug('');
      expect(tenant).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      // Try to get a tenant with invalid format
      const tenant = await tenantCacheService.getTenant('invalid-uuid-format');
      expect(tenant).toBeNull();
    });
  });

  describe('Cache Consistency', () => {
    it('should maintain consistency between ID and slug lookups', async () => {
      if (!testTenantId || !testTenantSlug) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      const tenantById = await tenantCacheService.getTenant(testTenantId);
      const tenantBySlug = await tenantCacheService.getTenantBySlug(testTenantSlug);

      expect(tenantById).toEqual(tenantBySlug);
    });

    it('should invalidate all related caches', async () => {
      if (!testTenantId || !testTenantSlug) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      // Cache tenant, settings, and features
      await tenantCacheService.getTenant(testTenantId);
      await tenantCacheService.setTenantSettings(testTenantId, { theme: 'light' });
      await tenantCacheService.setTenantFeatures(testTenantId, { feature1: true });

      // Invalidate all
      await tenantCacheService.invalidateTenant(testTenantId);

      // Verify all are cleared
      const tenant = await cacheService.get(`tenant:${testTenantId}`);
      const settings = await tenantCacheService.getTenantSettings(testTenantId);
      const features = await tenantCacheService.getTenantFeatures(testTenantId);

      expect(tenant).toBeNull();
      expect(settings).toBeNull();
      expect(features).toBeNull();
    });
  });
});
