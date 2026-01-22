/**
 * Cache Service Tests
 * Basic tests for cache service functionality
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cacheService } from '../cache.service.js';
import { redis, waitForRedis, disconnectRedis } from '../../db/redis.client.js';

describe('CacheService', () => {
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

  beforeEach(() => {
    // Reset stats before each test
    cacheService.resetStats();
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      const key = 'test:basic:value';
      const value = { name: 'Test', id: 123 };

      const setResult = await cacheService.set(key, value, { ttl: 60 });
      expect(setResult).toBe(true);

      const retrieved = await cacheService.get(key);
      expect(retrieved).toEqual(value);

      // Cleanup
      await cacheService.delete(key);
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('test:nonexistent:key');
      expect(result).toBeNull();
    });

    it('should delete a key', async () => {
      const key = 'test:delete:key';
      await cacheService.set(key, 'value', { ttl: 60 });

      const deleted = await cacheService.delete(key);
      expect(deleted).toBe(true);

      const retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test:exists:key';

      let exists = await cacheService.exists(key);
      expect(exists).toBe(false);

      await cacheService.set(key, 'value', { ttl: 60 });
      exists = await cacheService.exists(key);
      expect(exists).toBe(true);

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect TTL', async () => {
      const key = 'test:ttl:key';
      await cacheService.set(key, 'value', { ttl: 2 }); // 2 seconds

      let value = await cacheService.get(key);
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 2500));

      value = await cacheService.get(key);
      expect(value).toBeNull();
    });

    it('should get TTL for a key', async () => {
      const key = 'test:get-ttl:key';
      await cacheService.set(key, 'value', { ttl: 300 });

      const ttl = await cacheService.getTTL(key);
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);

      // Cleanup
      await cacheService.delete(key);
    });

    it('should update expiration time', async () => {
      const key = 'test:expire:key';
      await cacheService.set(key, 'value', { ttl: 60 });

      const updated = await cacheService.expire(key, 300);
      expect(updated).toBe(true);

      const ttl = await cacheService.getTTL(key);
      expect(ttl).toBeGreaterThan(60);

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Batch Operations', () => {
    it('should set multiple values', async () => {
      const items = [
        { key: 'test:batch:1', value: 'value1', ttl: 60 },
        { key: 'test:batch:2', value: 'value2', ttl: 60 },
        { key: 'test:batch:3', value: 'value3', ttl: 60 },
      ];

      const result = await cacheService.mset(items);
      expect(result).toBe(true);

      // Verify values
      const value1 = await cacheService.get('test:batch:1');
      const value2 = await cacheService.get('test:batch:2');
      const value3 = await cacheService.get('test:batch:3');

      expect(value1).toBe('value1');
      expect(value2).toBe('value2');
      expect(value3).toBe('value3');

      // Cleanup
      await cacheService.delete('test:batch:1');
      await cacheService.delete('test:batch:2');
      await cacheService.delete('test:batch:3');
    });

    it('should get multiple values', async () => {
      await cacheService.set('test:mget:1', 'value1', { ttl: 60 });
      await cacheService.set('test:mget:2', 'value2', { ttl: 60 });

      const values = await cacheService.mget<string>([
        'test:mget:1',
        'test:mget:2',
        'test:mget:nonexistent',
      ]);

      expect(values).toHaveLength(3);
      expect(values[0]).toBe('value1');
      expect(values[1]).toBe('value2');
      expect(values[2]).toBeNull();

      // Cleanup
      await cacheService.delete('test:mget:1');
      await cacheService.delete('test:mget:2');
    });
  });

  describe('Cache-Aside Pattern', () => {
    it('should use getOrSet correctly', async () => {
      const key = 'test:cache-aside:key';
      let factoryCalled = false;

      // First call - should call factory
      const value1 = await cacheService.getOrSet(
        key,
        async () => {
          factoryCalled = true;
          return { data: 'from-factory' };
        },
        { ttl: 60 }
      );

      expect(factoryCalled).toBe(true);
      expect(value1).toEqual({ data: 'from-factory' });

      // Second call - should return from cache
      factoryCalled = false;
      const value2 = await cacheService.getOrSet(
        key,
        async () => {
          factoryCalled = true;
          return { data: 'should-not-be-called' };
        },
        { ttl: 60 }
      );

      expect(factoryCalled).toBe(false);
      expect(value2).toEqual({ data: 'from-factory' });

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Counter Operations', () => {
    it('should increment counter', async () => {
      const key = 'test:counter:incr';

      const count1 = await cacheService.increment(key);
      expect(count1).toBe(1);

      const count2 = await cacheService.increment(key);
      expect(count2).toBe(2);

      const count3 = await cacheService.increment(key, 5);
      expect(count3).toBe(7);

      // Cleanup
      await cacheService.delete(key);
    });

    it('should decrement counter', async () => {
      const key = 'test:counter:decr';

      await cacheService.set(key, '10', { ttl: 60 });

      const count1 = await cacheService.decrement(key);
      expect(count1).toBe(9);

      const count2 = await cacheService.decrement(key, 3);
      expect(count2).toBe(6);

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Set Operations', () => {
    it('should add and remove from set', async () => {
      const key = 'test:set:members';

      await cacheService.addToSet(key, 'member1', 'member2', 'member3');

      const isMember = await cacheService.isInSet(key, 'member2');
      expect(isMember).toBe(true);

      const members = await cacheService.getSetMembers(key);
      expect(members).toContain('member1');
      expect(members).toContain('member2');
      expect(members).toContain('member3');

      await cacheService.removeFromSet(key, 'member2');
      const stillMember = await cacheService.isInSet(key, 'member2');
      expect(stillMember).toBe(false);

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Sorted Set Operations', () => {
    it('should manage sorted sets', async () => {
      const key = 'test:sortedset:scores';

      await cacheService.addToSortedSet(key, 100, 'user1');
      await cacheService.addToSortedSet(key, 200, 'user2');
      await cacheService.addToSortedSet(key, 150, 'user3');

      const members = await cacheService.getSortedSetByScore(key, 0, 200);
      expect(members).toContain('user1');
      expect(members).toContain('user2');
      expect(members).toContain('user3');

      const topUsers = await cacheService.getSortedSetByScore(key, 150, 200);
      expect(topUsers).toContain('user2');
      expect(topUsers).toContain('user3');
      expect(topUsers).not.toContain('user1');

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Pattern Deletion', () => {
    it('should delete keys by pattern', async () => {
      await cacheService.set('test:pattern:1', 'value1', { ttl: 60 });
      await cacheService.set('test:pattern:2', 'value2', { ttl: 60 });
      await cacheService.set('test:pattern:3', 'value3', { ttl: 60 });
      await cacheService.set('test:other:1', 'other', { ttl: 60 });

      const deletedCount = await cacheService.deletePattern('test:pattern:*');
      expect(deletedCount).toBeGreaterThanOrEqual(3);

      const exists1 = await cacheService.exists('test:pattern:1');
      const exists2 = await cacheService.exists('test:pattern:2');
      const existsOther = await cacheService.exists('test:other:1');

      expect(exists1).toBe(false);
      expect(exists2).toBe(false);
      expect(existsOther).toBe(true);

      // Cleanup
      await cacheService.delete('test:other:1');
    });
  });

  describe('Distributed Lock', () => {
    it('should acquire and release lock', async () => {
      const key = 'test:lock:resource';

      const lockValue = await cacheService.acquireLock(key, 10);
      expect(lockValue).not.toBeNull();

      // Try to acquire again - should fail
      const secondLock = await cacheService.acquireLock(key, 10, 1);
      expect(secondLock).toBeNull();

      // Release lock
      if (lockValue) {
        const released = await cacheService.releaseLock(key, lockValue);
        expect(released).toBe(true);
      }

      // Should be able to acquire now
      const thirdLock = await cacheService.acquireLock(key, 10);
      expect(thirdLock).not.toBeNull();

      // Cleanup
      if (thirdLock) {
        await cacheService.releaseLock(key, thirdLock);
      }
    });

    it('should not release lock with wrong value', async () => {
      const key = 'test:lock:wrong-value';

      const lockValue = await cacheService.acquireLock(key, 10);
      expect(lockValue).not.toBeNull();

      // Try to release with wrong value
      const released = await cacheService.releaseLock(key, 'wrong-value');
      expect(released).toBe(false);

      // Cleanup
      if (lockValue) {
        await cacheService.releaseLock(key, lockValue);
      }
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      cacheService.resetStats();

      const key = 'test:stats:key';

      // Set operation
      await cacheService.set(key, 'value', { ttl: 60 });

      // Hit
      await cacheService.get(key);

      // Miss
      await cacheService.get('nonexistent');

      // Delete
      await cacheService.delete(key);

      const stats = cacheService.getStats();
      expect(stats.sets).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.deletes).toBe(1);
    });

    it('should calculate hit rate', async () => {
      cacheService.resetStats();

      const key = 'test:hitrate:key';
      await cacheService.set(key, 'value', { ttl: 60 });

      // 3 hits
      await cacheService.get(key);
      await cacheService.get(key);
      await cacheService.get(key);

      // 1 miss
      await cacheService.get('nonexistent');

      const hitRate = cacheService.getHitRate();
      expect(hitRate).toBe(0.75); // 3/4 = 75%

      // Cleanup
      await cacheService.delete(key);
    });
  });
});
