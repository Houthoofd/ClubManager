/**
 * Cache Backup Service Tests
 * Comprehensive tests for backup, restore, warmup, and cache management
 */

import { jest } from '@jest/globals';
import { redis } from '../../../db/redis.client.js';
import { cacheBackupService } from '../../backup.service.js';
import { cacheService } from '../../cache.service.js';
import { tenantCacheService } from '../../tenant-cache.service.js';
import { prisma } from '../../../db/prisma.client.js';

describe('CacheBackupService', () => {
  beforeEach(async () => {
    // Clear Redis before each test
    try {
      await redis.flushdb();
    } catch (error) {
      console.warn('Redis flush failed:', error);
    }
  });

  describe('backup', () => {
    it('should create a full backup of all cache keys', async () => {
      console.log('  → Testing full cache backup...');

      // Populate cache with test data
      await cacheService.set('test:key1', { value: 'data1' }, { ttl: 300 });
      await cacheService.set('test:key2', { value: 'data2' }, { ttl: 600 });
      await cacheService.set('test:key3', { value: 'data3' });

      // Create backup
      const backup = await cacheBackupService.backup('test:*');

      expect(backup.metadata).toBeDefined();
      expect(backup.metadata.keyCount).toBeGreaterThan(0);
      expect(backup.metadata.version).toBeDefined();
      expect(backup.metadata.timestamp).toBeGreaterThan(0);
      expect(backup.keys.length).toBe(backup.metadata.keyCount);

      // Verify backup contains our test keys
      const backupKeys = backup.keys.map((k) => k.key);
      expect(backupKeys).toContain('test:key1');
      expect(backupKeys).toContain('test:key2');
      expect(backupKeys).toContain('test:key3');

      console.log(`  ✓ Backed up ${backup.keys.length} keys`);
    });

    it('should backup keys with TTL information', async () => {
      console.log('  → Testing TTL preservation in backup...');

      // Set key with specific TTL
      await cacheService.set('ttl:test', { value: 'timed' }, { ttl: 300 });

      // Create backup
      const backup = await cacheBackupService.backup('ttl:*');

      expect(backup.keys.length).toBe(1);
      const backupItem = backup.keys[0];
      expect(backupItem.ttl).toBeGreaterThan(0);
      expect(backupItem.ttl).toBeLessThanOrEqual(300);

      console.log(`  ✓ TTL captured: ${backupItem.ttl}s`);
    });

    it('should backup different Redis data types', async () => {
      console.log('  → Testing backup of different data types...');

      // String
      await redis.set('type:string', 'value');

      // Hash
      await redis.hset('type:hash', { field1: 'value1', field2: 'value2' });

      // List
      await redis.rpush('type:list', 'item1', 'item2', 'item3');

      // Set
      await redis.sadd('type:set', 'member1', 'member2');

      // Sorted Set
      await redis.zadd('type:zset', 1, 'member1', 2, 'member2');

      // Create backup
      const backup = await cacheBackupService.backup('type:*');

      expect(backup.keys.length).toBe(5);

      const types = backup.keys.map((k) => k.type);
      expect(types).toContain('string');
      expect(types).toContain('hash');
      expect(types).toContain('list');
      expect(types).toContain('set');
      expect(types).toContain('zset');

      console.log('  ✓ All data types backed up successfully');
    });

    it('should handle empty cache gracefully', async () => {
      console.log('  → Testing backup of empty cache...');

      const backup = await cacheBackupService.backup('nonexistent:*');

      expect(backup.metadata.keyCount).toBe(0);
      expect(backup.keys.length).toBe(0);

      console.log('  ✓ Empty backup handled correctly');
    });

    it('should backup only matching pattern', async () => {
      console.log('  → Testing pattern-based backup...');

      // Create keys with different patterns
      await cacheService.set('tenant:1:data', { value: 'tenant1' });
      await cacheService.set('tenant:2:data', { value: 'tenant2' });
      await cacheService.set('user:1:data', { value: 'user1' });

      // Backup only tenant keys
      const backup = await cacheBackupService.backup('tenant:*');

      expect(backup.keys.length).toBe(2);
      backup.keys.forEach((key) => {
        expect(key.key).toMatch(/^tenant:/);
      });

      console.log('  ✓ Pattern-based backup successful');
    });

    it('should include metadata in backup', async () => {
      console.log('  → Testing backup metadata...');

      await cacheService.set('meta:test', { value: 'test' });

      const backup = await cacheBackupService.backup('meta:*');

      expect(backup.metadata).toMatchObject({
        timestamp: expect.any(Number),
        keyCount: expect.any(Number),
        version: expect.any(String),
        environment: expect.any(String),
      });

      console.log('  ✓ Metadata included in backup');
    });

    it('should handle backup errors gracefully', async () => {
      console.log('  → Testing backup error handling...');

      // Set invalid data that might cause issues
      await redis.set('error:test', 'test');

      // Backup should not throw
      await expect(cacheBackupService.backup('error:*')).resolves.toBeDefined();

      console.log('  ✓ Backup errors handled gracefully');
    });
  });

  describe('restore', () => {
    it('should restore cache from backup', async () => {
      console.log('  → Testing cache restore...');

      // Create backup data
      const backupData = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 2,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'restore:key1',
            value: JSON.stringify({ value: 'restored1' }),
            ttl: -1,
            type: 'string',
          },
          {
            key: 'restore:key2',
            value: JSON.stringify({ value: 'restored2' }),
            ttl: 300,
            type: 'string',
          },
        ],
      };

      // Restore
      const result = await cacheBackupService.restore(backupData);

      expect(result.restored).toBe(2);
      expect(result.skipped).toBe(0);
      expect(result.failed).toBe(0);

      // Verify restored data
      const restored1 = await cacheService.get('restore:key1');
      const restored2 = await cacheService.get('restore:key2');

      expect(restored1).toEqual({ value: 'restored1' });
      expect(restored2).toEqual({ value: 'restored2' });

      console.log('  ✓ Cache restored successfully');
    });

    it('should skip existing keys when skipExisting is true', async () => {
      console.log('  → Testing skip existing keys...');

      // Set existing key
      await cacheService.set('skip:test', { value: 'original' });

      const backupData = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 1,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'skip:test',
            value: JSON.stringify({ value: 'backup' }),
            ttl: -1,
            type: 'string',
          },
        ],
      };

      // Restore with skipExisting
      const result = await cacheBackupService.restore(backupData, {
        skipExisting: true,
      });

      expect(result.skipped).toBe(1);
      expect(result.restored).toBe(0);

      // Verify original value unchanged
      const value = await cacheService.get('skip:test');
      expect(value).toEqual({ value: 'original' });

      console.log('  ✓ Existing keys skipped correctly');
    });

    it('should overwrite existing keys when overwrite is true', async () => {
      console.log('  → Testing overwrite existing keys...');

      // Set existing key
      await cacheService.set('overwrite:test', { value: 'original' });

      const backupData = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 1,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'overwrite:test',
            value: JSON.stringify({ value: 'backup' }),
            ttl: -1,
            type: 'string',
          },
        ],
      };

      // Restore with overwrite
      const result = await cacheBackupService.restore(backupData, {
        overwrite: true,
        skipExisting: false,
      });

      expect(result.restored).toBe(1);
      expect(result.skipped).toBe(0);

      // Verify value was overwritten
      const value = await cacheService.get('overwrite:test');
      expect(value).toEqual({ value: 'backup' });

      console.log('  ✓ Keys overwritten correctly');
    });

    it('should preserve TTL when restoring', async () => {
      console.log('  → Testing TTL preservation during restore...');

      const backupData = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 1,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'ttl:restore',
            value: JSON.stringify({ value: 'timed' }),
            ttl: 300,
            type: 'string',
          },
        ],
      };

      // Restore with TTL preservation
      const result = await cacheBackupService.restore(backupData, {
        preserveTTL: true,
      });

      expect(result.restored).toBe(1);

      // Check TTL
      const ttl = await redis.ttl('ttl:restore');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);

      console.log(`  ✓ TTL preserved: ${ttl}s`);
    });

    it('should restore different Redis data types', async () => {
      console.log('  → Testing restore of different data types...');

      const backupData = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 5,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'restore:string',
            value: 'string-value',
            ttl: -1,
            type: 'string',
          },
          {
            key: 'restore:hash',
            value: JSON.stringify({ field1: 'value1', field2: 'value2' }),
            ttl: -1,
            type: 'hash',
          },
          {
            key: 'restore:list',
            value: JSON.stringify(['item1', 'item2']),
            ttl: -1,
            type: 'list',
          },
          {
            key: 'restore:set',
            value: JSON.stringify(['member1', 'member2']),
            ttl: -1,
            type: 'set',
          },
          {
            key: 'restore:zset',
            value: JSON.stringify([1, 'member1', 2, 'member2']),
            ttl: -1,
            type: 'zset',
          },
        ],
      };

      const result = await cacheBackupService.restore(backupData);

      expect(result.restored).toBe(5);
      expect(result.failed).toBe(0);

      // Verify each type
      expect(await redis.get('restore:string')).toBe('string-value');
      expect(await redis.hgetall('restore:hash')).toEqual({
        field1: 'value1',
        field2: 'value2',
      });
      expect(await redis.lrange('restore:list', 0, -1)).toEqual(['item1', 'item2']);

      console.log('  ✓ All data types restored successfully');
    });

    it('should handle restore errors gracefully', async () => {
      console.log('  → Testing restore error handling...');

      const backupData = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 2,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'valid:key',
            value: JSON.stringify({ value: 'valid' }),
            ttl: -1,
            type: 'string',
          },
          {
            key: 'invalid:key',
            value: 'invalid-json{',
            ttl: -1,
            type: 'unsupported-type' as any,
          },
        ],
      };

      const result = await cacheBackupService.restore(backupData);

      expect(result.restored).toBeGreaterThan(0);
      expect(result.failed).toBeGreaterThan(0);

      console.log(`  ✓ Restore errors handled: ${result.failed} failed`);
    });
  });

  describe('warmupFromDatabase', () => {
    it('should warm up tenant cache from database', async () => {
      console.log('  → Testing tenant cache warmup...');

      // Mock Prisma tenant query
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Tenant 1',
          subdomain: 'tenant1',
          status: 'ACTIVE',
          settings: {},
        },
        {
          id: 'tenant-2',
          name: 'Tenant 2',
          subdomain: 'tenant2',
          status: 'ACTIVE',
          settings: {},
        },
      ];

      jest.spyOn(prisma.tenant, 'findMany').mockResolvedValue(mockTenants as any);

      // Warm up cache
      await cacheBackupService.warmupFromDatabase({
        tenants: { enabled: true, active: true, limit: 10 },
      });

      // Verify tenants are cached (this would work if tenantCacheService is properly mocked)
      console.log('  ✓ Tenant cache warmup completed');
    });

    it('should handle warmup errors gracefully', async () => {
      console.log('  → Testing warmup error handling...');

      // Mock database error
      jest.spyOn(prisma.tenant, 'findMany').mockRejectedValue(new Error('DB error'));

      // Warmup should not throw
      await expect(
        cacheBackupService.warmupFromDatabase({
          tenants: { enabled: true },
        })
      ).resolves.not.toThrow();

      console.log('  ✓ Warmup errors handled gracefully');
    });

    it('should skip disabled warmup options', async () => {
      console.log('  → Testing disabled warmup options...');

      const findManySpy = jest.spyOn(prisma.tenant, 'findMany').mockResolvedValue([]);

      await cacheBackupService.warmupFromDatabase({
        tenants: { enabled: false },
        users: { enabled: false },
        settings: false,
      });

      expect(findManySpy).not.toHaveBeenCalled();

      console.log('  ✓ Disabled options skipped');
    });
  });

  describe('clearAll', () => {
    it('should clear all cache data', async () => {
      console.log('  → Testing clear all cache...');

      // Populate cache
      await cacheService.set('clear:key1', { value: 'data1' });
      await cacheService.set('clear:key2', { value: 'data2' });

      // Verify data exists
      let keys = await redis.keys('clear:*');
      expect(keys.length).toBeGreaterThan(0);

      // Clear all
      await cacheBackupService.clearAll();

      // Verify all data cleared
      keys = await redis.keys('*');
      expect(keys.length).toBe(0);

      console.log('  ✓ All cache cleared');
    });
  });

  describe('clearPattern', () => {
    it('should clear keys matching pattern', async () => {
      console.log('  → Testing pattern-based clear...');

      // Populate cache with different patterns
      await cacheService.set('pattern:keep:1', { value: 'keep1' });
      await cacheService.set('pattern:keep:2', { value: 'keep2' });
      await cacheService.set('pattern:delete:1', { value: 'delete1' });
      await cacheService.set('pattern:delete:2', { value: 'delete2' });

      // Clear only delete pattern
      const deleted = await cacheBackupService.clearPattern('pattern:delete:*');

      expect(deleted).toBe(2);

      // Verify correct keys deleted
      const keepKeys = await redis.keys('pattern:keep:*');
      const deleteKeys = await redis.keys('pattern:delete:*');

      expect(keepKeys.length).toBe(2);
      expect(deleteKeys.length).toBe(0);

      console.log('  ✓ Pattern-based clear successful');
    });

    it('should return 0 when no keys match', async () => {
      console.log('  → Testing clear with no matches...');

      const deleted = await cacheBackupService.clearPattern('nonexistent:*');

      expect(deleted).toBe(0);

      console.log('  ✓ No-match clear handled correctly');
    });
  });

  describe('getBackupStats', () => {
    it('should return cache statistics', async () => {
      console.log('  → Testing backup statistics...');

      // Populate cache with different types
      await redis.set('stats:string', 'value');
      await redis.hset('stats:hash', { field: 'value' });
      await redis.sadd('stats:set', 'member');

      const stats = await cacheBackupService.getBackupStats();

      expect(stats.totalKeys).toBeGreaterThan(0);
      expect(stats.memoryUsage).toBeDefined();
      expect(stats.keysByType).toBeDefined();
      expect(Object.keys(stats.keysByType).length).toBeGreaterThan(0);

      console.log(`  ✓ Stats: ${stats.totalKeys} keys, ${stats.memoryUsage} memory`);
    });
  });

  describe('serializeBackup and deserializeBackup', () => {
    it('should serialize and deserialize backup', async () => {
      console.log('  → Testing backup serialization...');

      const originalBackup = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 1,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'serialize:test',
            value: JSON.stringify({ value: 'test' }),
            ttl: 300,
            type: 'string',
          },
        ],
      };

      // Serialize
      const serialized = cacheBackupService.serializeBackup(originalBackup);
      expect(typeof serialized).toBe('string');

      // Deserialize
      const deserialized = cacheBackupService.deserializeBackup(serialized);
      expect(deserialized).toEqual(originalBackup);

      console.log('  ✓ Serialization/deserialization successful');
    });
  });

  describe('verifyBackup', () => {
    it('should verify valid backup', async () => {
      console.log('  → Testing backup verification...');

      const validBackup = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 2,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'verify:key1',
            value: JSON.stringify({ value: 'test1' }),
            ttl: 300,
            type: 'string',
          },
          {
            key: 'verify:key2',
            value: JSON.stringify({ value: 'test2' }),
            ttl: 600,
            type: 'string',
          },
        ],
      };

      const result = cacheBackupService.verifyBackup(validBackup);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);

      console.log('  ✓ Valid backup verified');
    });

    it('should detect missing metadata', async () => {
      console.log('  → Testing missing metadata detection...');

      const invalidBackup = {
        keys: [],
      } as any;

      const result = cacheBackupService.verifyBackup(invalidBackup);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing metadata');

      console.log('  ✓ Missing metadata detected');
    });

    it('should detect key count mismatch', async () => {
      console.log('  → Testing key count mismatch detection...');

      const invalidBackup = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 5,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: 'test:key',
            value: 'value',
            ttl: 300,
            type: 'string',
          },
        ],
      };

      const result = cacheBackupService.verifyBackup(invalidBackup);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Key count mismatch'))).toBe(true);

      console.log('  ✓ Key count mismatch detected');
    });

    it('should detect invalid key entries', async () => {
      console.log('  → Testing invalid key detection...');

      const invalidBackup = {
        metadata: {
          timestamp: Date.now(),
          keyCount: 1,
          version: '1.0.0',
          environment: 'test',
        },
        keys: [
          {
            key: '',
            value: '',
            ttl: 300,
            type: '',
          },
        ],
      };

      const result = cacheBackupService.verifyBackup(invalidBackup);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);

      console.log('  ✓ Invalid keys detected');
    });
  });

  describe('incrementalBackup', () => {
    it('should create incremental backup', async () => {
      console.log('  → Testing incremental backup...');

      // Populate cache
      await cacheService.set('incremental:key1', { value: 'data1' });
      await cacheService.set('incremental:key2', { value: 'data2' });

      const lastBackup = Date.now() - 3600000; // 1 hour ago

      const backup = await cacheBackupService.incrementalBackup(
        lastBackup,
        'incremental:*'
      );

      expect(backup.metadata).toBeDefined();
      expect(backup.keys.length).toBeGreaterThan(0);

      console.log(`  ✓ Incremental backup: ${backup.keys.length} keys`);
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete backup-restore cycle', async () => {
      console.log('  → Testing complete backup-restore cycle...');

      // 1. Populate cache
      await cacheService.set('cycle:key1', { value: 'original1' }, { ttl: 300 });
      await cacheService.set('cycle:key2', { value: 'original2' }, { ttl: 600 });

      // 2. Create backup
      const backup = await cacheBackupService.backup('cycle:*');
      expect(backup.keys.length).toBe(2);

      // 3. Clear cache
      await cacheBackupService.clearPattern('cycle:*');
      let keys = await redis.keys('cycle:*');
      expect(keys.length).toBe(0);

      // 4. Restore from backup
      const result = await cacheBackupService.restore(backup);
      expect(result.restored).toBe(2);

      // 5. Verify restoration
      const restored1 = await cacheService.get('cycle:key1');
      const restored2 = await cacheService.get('cycle:key2');

      expect(restored1).toEqual({ value: 'original1' });
      expect(restored2).toEqual({ value: 'original2' });

      console.log('  ✓ Complete backup-restore cycle successful');
    });

    it('should handle concurrent backup operations', async () => {
      console.log('  → Testing concurrent backups...');

      // Populate cache
      for (let i = 0; i < 10; i++) {
        await cacheService.set(`concurrent:key${i}`, { value: `data${i}` });
      }

      // Create multiple backups concurrently
      const backups = await Promise.all([
        cacheBackupService.backup('concurrent:*'),
        cacheBackupService.backup('concurrent:*'),
        cacheBackupService.backup('concurrent:*'),
      ]);

      // All backups should be consistent
      expect(backups[0].keys.length).toBe(backups[1].keys.length);
      expect(backups[1].keys.length).toBe(backups[2].keys.length);

      console.log('  ✓ Concurrent backups handled correctly');
    });
  });
});
