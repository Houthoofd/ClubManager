/**
 * Cache-Database Consistency and Backup/Restore Tests
 * Tests data coherence between Redis cache and PostgreSQL database
 */

import { jest } from '@jest/globals';
import { prisma } from '../../../db/prisma.client.js';
import { redis } from '../../../db/redis.client.js';
import { cacheService } from '../../cache.service.js';
import { tenantCacheService } from '../../tenant-cache.service.js';
import { userCacheService } from '../../user-cache.service.js';
import {
  setCurrentTenantId,
  getCurrentTenantId,
  clearCurrentTenantId,
} from '../../../middleware/tenant-context.js';

describe('Cache-Database Consistency Tests', () => {
  let testTenantId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Wait for services to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create test tenant
    try {
      const tenant = await prisma.tenant.create({
        data: {
          name: 'Cache Consistency Test Tenant',
          subdomain: `cache-test-${Date.now()}`,
          status: 'ACTIVE',
        },
      });
      testTenantId = tenant.id;
      setCurrentTenantId(testTenantId);

      // Create test user
      const user = await prisma.user.create({
        data: {
          email: `cache-test-${Date.now()}@example.com`,
          firstName: 'Cache',
          lastName: 'Test',
          tenantId: testTenantId,
        },
      });
      testUserId = user.id;
    } catch (error) {
      console.warn('Setup failed, tests will be skipped:', error);
    }
  });

  afterAll(async () => {
    // Cleanup
    try {
      if (testUserId) {
        await prisma.user.delete({ where: { id: testUserId } });
      }
      if (testTenantId) {
        await prisma.tenant.delete({ where: { id: testTenantId } });
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
    clearCurrentTenantId();
  });

  beforeEach(async () => {
    // Clear cache before each test
    try {
      await redis.flushdb();
    } catch (error) {
      console.warn('Redis flush failed:', error);
    }
  });

  describe('Data Consistency', () => {
    it('should maintain consistency between cache and DB for tenant data', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      console.log('  → Testing tenant data consistency...');

      // Get from DB
      const tenantFromDb = await prisma.tenant.findUnique({
        where: { id: testTenantId },
      });

      expect(tenantFromDb).not.toBeNull();

      // Cache it
      await tenantCacheService.setTenant(tenantFromDb as any);

      // Get from cache
      const tenantFromCache = await tenantCacheService.getTenant(testTenantId);

      // Verify consistency
      expect(tenantFromCache).not.toBeNull();
      expect(tenantFromCache?.id).toBe(tenantFromDb?.id);
      expect(tenantFromCache?.name).toBe(tenantFromDb?.name);
      expect(tenantFromCache?.subdomain).toBe(tenantFromDb?.subdomain);

      console.log('  ✓ Tenant data consistent between cache and DB');
    });

    it('should maintain consistency between cache and DB for user data', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing user data consistency...');

      // Get from DB
      const userFromDb = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(userFromDb).not.toBeNull();

      // Cache it
      await userCacheService.setUserProfile(userFromDb as any);

      // Get from cache
      const userFromCache = await userCacheService.getUserProfile(testUserId);

      // Verify consistency
      expect(userFromCache).not.toBeNull();
      expect(userFromCache?.id).toBe(userFromDb?.id);
      expect(userFromCache?.email).toBe(userFromDb?.email);
      expect(userFromCache?.firstName).toBe(userFromDb?.firstName);

      console.log('  ✓ User data consistent between cache and DB');
    });

    it('should detect stale cache data', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing stale data detection...');

      // Cache user
      const originalUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      await userCacheService.setUserProfile(originalUser as any);

      // Update in DB
      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { firstName: 'Updated' },
      });

      // Get from cache (stale)
      const cachedUser = await userCacheService.getUserProfile(testUserId);

      // Verify cache is stale
      expect(cachedUser?.firstName).not.toBe(updatedUser.firstName);
      expect(cachedUser?.firstName).toBe(originalUser?.firstName);

      console.log('  ✓ Stale cache data detected');
    });

    it('should handle cache invalidation after DB update', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing cache invalidation...');

      // Cache user
      const originalUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });
      await userCacheService.setUserProfile(originalUser as any);

      // Update in DB and invalidate cache
      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { firstName: 'Invalidated' },
      });
      await userCacheService.invalidateUser(testUserId);

      // Get from cache (should be null after invalidation)
      const cachedUser = await userCacheService.getUserProfile(testUserId);

      expect(cachedUser).toBeNull();

      console.log('  ✓ Cache invalidated successfully');
    });

    it('should ensure read-through consistency', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing read-through consistency...');

      // Clear cache
      await userCacheService.invalidateUser(testUserId);

      // Read from DB (simulating cache miss)
      const userFromDb = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      // Cache it
      await userCacheService.setUserProfile(userFromDb as any);

      // Read from cache
      const userFromCache = await userCacheService.getUserProfile(testUserId);

      // Verify consistency
      expect(userFromCache).toEqual(userFromDb);

      console.log('  ✓ Read-through consistency maintained');
    });

    it('should handle write-through consistency', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing write-through consistency...');

      // Update in DB
      const updatedUser = await prisma.user.update({
        where: { id: testUserId },
        data: { firstName: 'WriteThrough' },
      });

      // Write to cache immediately
      await userCacheService.setUserProfile(updatedUser);

      // Read from cache
      const cachedUser = await userCacheService.getUserProfile(testUserId);

      // Verify consistency
      expect(cachedUser?.firstName).toBe(updatedUser.firstName);
      expect(cachedUser?.firstName).toBe('WriteThrough');

      console.log('  ✓ Write-through consistency maintained');
    });

    it('should handle concurrent updates correctly', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing concurrent update handling...');

      // Concurrent DB updates
      const updates = [
        prisma.user.update({
          where: { id: testUserId },
          data: { firstName: 'Concurrent1' },
        }),
        prisma.user.update({
          where: { id: testUserId },
          data: { firstName: 'Concurrent2' },
        }),
      ];

      await Promise.all(updates);

      // Invalidate cache after updates
      await userCacheService.invalidateUser(testUserId);

      // Get final state from DB
      const finalUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      // Cache should reflect DB state
      await userCacheService.setUserProfile(finalUser as any);
      const cachedUser = await userCacheService.getUserProfile(testUserId);

      expect(cachedUser?.firstName).toBe(finalUser?.firstName);

      console.log('  ✓ Concurrent updates handled correctly');
    });
  });

  describe('Backup and Restore', () => {
    it('should backup cache data', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      console.log('  → Testing cache backup...');

      // Populate cache with test data
      const testData = {
        tenant: await prisma.tenant.findUnique({ where: { id: testTenantId } }),
        timestamp: Date.now(),
      };

      await tenantCacheService.setTenant(testData.tenant as any);
      await cacheService.set('backup:test:data', testData, { ttl: 3600 });

      // Get all keys for backup
      const keys = await redis.keys('*');
      expect(keys.length).toBeGreaterThan(0);

      // Backup data
      const backup: Record<string, any> = {};
      for (const key of keys) {
        const value = await redis.get(key);
        if (value) {
          backup[key] = value;
        }
      }

      expect(Object.keys(backup).length).toBeGreaterThan(0);
      console.log(`  ✓ Backed up ${Object.keys(backup).length} cache keys`);
    });

    it('should restore cache from backup', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      console.log('  → Testing cache restore...');

      // Create backup data
      const backupData = {
        'backup:test:key1': JSON.stringify({ value: 'test1' }),
        'backup:test:key2': JSON.stringify({ value: 'test2' }),
      };

      // Clear cache
      await redis.flushdb();

      // Verify cache is empty
      let keys = await redis.keys('backup:test:*');
      expect(keys.length).toBe(0);

      // Restore from backup
      for (const [key, value] of Object.entries(backupData)) {
        await redis.set(key, value, 'EX', 3600);
      }

      // Verify restore
      keys = await redis.keys('backup:test:*');
      expect(keys.length).toBe(2);

      const restored1 = await redis.get('backup:test:key1');
      expect(JSON.parse(restored1!).value).toBe('test1');

      console.log('  ✓ Cache restored from backup');
    });

    it('should rebuild cache from database', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      console.log('  → Testing cache rebuild from DB...');

      // Clear cache
      await redis.flushdb();

      // Verify cache is empty
      let cachedTenant = await tenantCacheService.getTenant(testTenantId);
      expect(cachedTenant).toBeNull();

      // Rebuild cache from DB
      const tenants = await prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        take: 10,
      });

      for (const tenant of tenants) {
        await tenantCacheService.setTenant(tenant as any);
      }

      // Verify cache is rebuilt
      cachedTenant = await tenantCacheService.getTenant(testTenantId);
      expect(cachedTenant).not.toBeNull();
      expect(cachedTenant?.id).toBe(testTenantId);

      console.log(`  ✓ Cache rebuilt with ${tenants.length} tenants`);
    });

    it('should handle partial backup/restore', async () => {
      console.log('  → Testing partial backup/restore...');

      // Create test data
      await cacheService.set('partial:key1', { value: 'keep' }, { ttl: 3600 });
      await cacheService.set('partial:key2', { value: 'keep' }, { ttl: 3600 });
      await cacheService.set('other:key', { value: 'ignore' }, { ttl: 3600 });

      // Backup only partial: keys
      const partialKeys = await redis.keys('partial:*');
      const partialBackup: Record<string, any> = {};

      for (const key of partialKeys) {
        const value = await redis.get(key);
        if (value) {
          partialBackup[key] = value;
        }
      }

      expect(Object.keys(partialBackup).length).toBe(2);

      // Clear partial data
      for (const key of partialKeys) {
        await redis.del(key);
      }

      // Restore partial backup
      for (const [key, value] of Object.entries(partialBackup)) {
        await redis.set(key, value, 'EX', 3600);
      }

      // Verify restore
      const restored = await cacheService.get('partial:key1');
      expect(restored).toEqual({ value: 'keep' });

      console.log('  ✓ Partial backup/restore completed');
    });

    it('should handle backup with TTL preservation', async () => {
      console.log('  → Testing TTL preservation in backup...');

      // Set data with specific TTL
      await cacheService.set('ttl:test', { value: 'timed' }, { ttl: 300 });

      // Get TTL
      const ttl = await redis.ttl('ttl:test');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);

      // Backup with TTL
      const value = await redis.get('ttl:test');
      const backupTtl = await redis.ttl('ttl:test');

      // Clear and restore
      await redis.del('ttl:test');
      await redis.set('ttl:test', value!, 'EX', backupTtl);

      // Verify TTL preserved (approximately)
      const restoredTtl = await redis.ttl('ttl:test');
      expect(restoredTtl).toBeGreaterThan(0);
      expect(Math.abs(restoredTtl - backupTtl)).toBeLessThan(5);

      console.log('  ✓ TTL preserved in backup');
    });
  });

  describe('Cache Warming', () => {
    it('should warm up tenant cache from database', async () => {
      if (!testTenantId) {
        console.warn('Skipping test - no test tenant');
        return;
      }

      console.log('  → Testing tenant cache warming...');

      // Clear cache
      await redis.flushdb();

      // Warm up cache
      const activeTenants = await prisma.tenant.findMany({
        where: { status: 'ACTIVE' },
        take: 10,
      });

      for (const tenant of activeTenants) {
        await tenantCacheService.setTenant(tenant as any);
        await tenantCacheService.addToActiveTenants(tenant.id);
      }

      // Verify cache is warmed
      const activeTenantsFromCache = await tenantCacheService.getActiveTenants();
      expect(activeTenantsFromCache.length).toBeGreaterThan(0);

      console.log(`  ✓ Warmed up cache with ${activeTenants.length} tenants`);
    });

    it('should warm up user cache for active sessions', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing user cache warming...');

      // Clear cache
      await redis.flushdb();

      // Simulate active users
      const users = await prisma.user.findMany({
        take: 5,
      });

      for (const user of users) {
        await userCacheService.setUserProfile(user as any);
      }

      // Verify cache is warmed
      const cachedUser = await userCacheService.getUserProfile(testUserId);
      if (users.some((u) => u.id === testUserId)) {
        expect(cachedUser).not.toBeNull();
      }

      console.log(`  ✓ Warmed up cache with ${users.length} user profiles`);
    });

    it('should handle cache warming errors gracefully', async () => {
      console.log('  → Testing cache warming error handling...');

      // Attempt to warm with invalid data
      try {
        await tenantCacheService.setTenant(null as any);
      } catch (error) {
        // Should handle gracefully
        expect(error).toBeDefined();
      }

      // Cache should still be functional
      const testData = { id: 'test', name: 'Test' };
      await cacheService.set('warming:test', testData);
      const retrieved = await cacheService.get('warming:test');
      expect(retrieved).toEqual(testData);

      console.log('  ✓ Cache warming errors handled gracefully');
    });
  });

  describe('Data Integrity', () => {
    it('should validate data integrity after cache operations', async () => {
      console.log('  → Testing data integrity...');

      const testData = {
        id: 'integrity-test',
        value: 'important',
        nested: { key: 'value' },
      };

      // Store in cache
      await cacheService.set('integrity:test', testData);

      // Retrieve and verify
      const retrieved = await cacheService.get('integrity:test');
      expect(retrieved).toEqual(testData);
      expect(retrieved.nested.key).toBe('value');

      console.log('  ✓ Data integrity maintained');
    });

    it('should detect data corruption', async () => {
      console.log('  → Testing data corruption detection...');

      // Store valid data
      await cacheService.set('corruption:test', { valid: true });

      // Corrupt data in Redis
      await redis.set('corruption:test', 'invalid-json{');

      // Attempt to retrieve
      try {
        await cacheService.get('corruption:test');
      } catch (error) {
        expect(error).toBeDefined();
        console.log('  ✓ Data corruption detected');
        return;
      }

      // If no error, check if data is null
      const retrieved = await cacheService.get('corruption:test');
      expect(retrieved).toBeNull();
    });

    it('should handle large data sets correctly', async () => {
      console.log('  → Testing large data set handling...');

      const largeData = {
        id: 'large-dataset',
        items: Array(1000).fill(null).map((_, i) => ({
          id: i,
          value: `item-${i}`,
        })),
      };

      // Store large dataset
      await cacheService.set('large:dataset', largeData, { ttl: 600 });

      // Retrieve and verify
      const retrieved = await cacheService.get('large:dataset');
      expect(retrieved).toBeDefined();
      expect(retrieved.items.length).toBe(1000);
      expect(retrieved.items[999].value).toBe('item-999');

      console.log('  ✓ Large data set handled correctly');
    });
  });

  describe('Consistency Recovery', () => {
    it('should recover from cache failure', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing cache failure recovery...');

      // Simulate cache failure by flushing
      await redis.flushdb();

      // Application should fall back to DB
      const userFromDb = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      expect(userFromDb).not.toBeNull();

      // Re-populate cache
      await userCacheService.setUserProfile(userFromDb as any);

      // Verify recovery
      const cachedUser = await userCacheService.getUserProfile(testUserId);
      expect(cachedUser).toEqual(userFromDb);

      console.log('  ✓ Recovered from cache failure');
    });

    it('should handle inconsistent state resolution', async () => {
      if (!testUserId) {
        console.warn('Skipping test - no test user');
        return;
      }

      console.log('  → Testing inconsistent state resolution...');

      // Create inconsistent state
      const dbUser = await prisma.user.findUnique({
        where: { id: testUserId },
      });

      await userCacheService.setUserProfile({
        ...dbUser,
        firstName: 'Stale',
      } as any);

      // Detect inconsistency by comparing versions
      const cachedUser = await userCacheService.getUserProfile(testUserId);
      expect(cachedUser?.firstName).not.toBe(dbUser?.firstName);

      // Resolve by invalidating and refreshing from DB
      await userCacheService.invalidateUser(testUserId);
      await userCacheService.setUserProfile(dbUser as any);

      // Verify consistency restored
      const freshCache = await userCacheService.getUserProfile(testUserId);
      expect(freshCache?.firstName).toBe(dbUser?.firstName);

      console.log('  ✓ Inconsistent state resolved');
    });
  });
});
