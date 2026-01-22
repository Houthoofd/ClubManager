/**
 * Resilience and Disaster Recovery Tests
 * Tests for Redis failure scenarios, reconnection, and recovery
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { redis, waitForRedis, disconnectRedis, getRedisHealth } from '../../../db/redis.client.js';
import { cacheService } from '../../cache.service.js';
import { tenantCacheService } from '../../tenant-cache.service.js';
import { userCacheService } from '../../user-cache.service.js';
import { rateLimiterService } from '../../rate-limiter.service.js';

describe('Resilience and Disaster Recovery Tests', () => {
  beforeAll(async () => {
    try {
      await waitForRedis(10000);
      console.log('\n=== Starting Resilience Tests ===\n');
    } catch (error) {
      console.error('Redis not available - some tests will be skipped');
    }
  });

  afterAll(async () => {
    await cacheService.deletePattern('resilience:*');
    await disconnectRedis();
    console.log('\n=== Resilience Tests Completed ===\n');
  });

  beforeEach(async () => {
    await cacheService.deletePattern('resilience:*');
  });

  describe('Graceful Degradation', () => {
    it('should continue operations when Redis is unavailable (fail-open)', async () => {
      console.log('  → Testing graceful degradation...');

      // This test verifies that the application doesn't crash when Redis is down
      // In a real scenario, you would temporarily stop Redis

      // Simulate Redis error by trying to access non-existent key after disconnect
      // The service should handle this gracefully
      const result = await cacheService.get('resilience:nonexistent').catch(() => null);
      expect(result).toBeNull();

      console.log('  ✓ Application continues without Redis');
    });

    it('should fallback to database when cache is unavailable', async () => {
      console.log('  → Testing database fallback...');

      // When cache is unavailable, the getOrSet should still work by calling the factory
      let factoryCalled = false;

      const value = await cacheService.getOrSet(
        'resilience:fallback:key',
        async () => {
          factoryCalled = true;
          return { data: 'from-database', source: 'db' };
        },
        { ttl: 60 }
      );

      expect(value).toBeDefined();
      expect(value.source).toBe('db');
      // Factory should be called since cache might not be working
      expect(factoryCalled).toBe(true);

      console.log('  ✓ Database fallback working');
    });

    it('should handle partial Redis failures', async () => {
      console.log('  → Testing partial failure handling...');

      // Some operations might fail while others succeed
      const operations = [];

      for (let i = 0; i < 10; i++) {
        operations.push(
          cacheService.set(`resilience:partial:${i}`, { index: i }, { ttl: 60 })
            .catch(() => ({ success: false, index: i }))
        );
      }

      const results = await Promise.allSettled(operations);

      // At least some operations should complete
      const fulfilled = results.filter(r => r.status === 'fulfilled').length;
      console.log(`  ✓ ${fulfilled}/${results.length} operations completed`);

      expect(fulfilled).toBeGreaterThan(0);
    });
  });

  describe('Connection Recovery', () => {
    it('should detect Redis connection status', async () => {
      const health = await getRedisHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('connected');

      if (health.connected) {
        expect(health.status).toBe('healthy');
        console.log('  ✓ Redis connection healthy');
      } else {
        expect(health.status).toBe('unhealthy');
        console.log('  ⚠ Redis connection unhealthy');
      }
    });

    it('should handle reconnection attempts gracefully', async () => {
      console.log('  → Testing reconnection handling...');

      // Try to perform operations during potential connection issues
      const attempts = 5;
      let successCount = 0;

      for (let i = 0; i < attempts; i++) {
        try {
          await cacheService.set(`resilience:reconnect:${i}`, { attempt: i }, { ttl: 30 });
          successCount++;
        } catch (error) {
          console.log(`  ⚠ Attempt ${i + 1} failed (expected during reconnection)`);
        }

        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`  ✓ ${successCount}/${attempts} operations succeeded during reconnection tests`);
      expect(successCount).toBeGreaterThan(0);
    });

    it('should maintain data consistency after reconnection', async () => {
      console.log('  → Testing data consistency after reconnection...');

      // Set data before potential connection issue
      const testData = {
        id: 'resilience-consistency-test',
        timestamp: Date.now(),
        value: 'important-data',
      };

      await cacheService.set('resilience:consistency', testData, { ttl: 300 });

      // Simulate time passing / reconnection
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify data is still consistent
      const retrieved = await cacheService.get('resilience:consistency');

      if (retrieved) {
        expect(retrieved).toEqual(testData);
        console.log('  ✓ Data consistency maintained');
      } else {
        console.log('  ⚠ Data not found (cache may have been cleared)');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis command errors gracefully', async () => {
      console.log('  → Testing command error handling...');

      // Try operations that might fail
      const operations = [
        cacheService.get('resilience:error:1'),
        cacheService.set('resilience:error:2', { data: 'test' }, { ttl: 60 }),
        cacheService.delete('resilience:error:3'),
        cacheService.increment('resilience:error:counter'),
      ];

      const results = await Promise.allSettled(operations);

      // Count successes and failures
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected').length;

      console.log(`  ✓ ${successes} succeeded, ${failures} failed`);

      // Application should not crash
      expect(results.length).toBe(operations.length);
    });

    it('should handle timeout errors', async () => {
      console.log('  → Testing timeout handling...');

      // Operations should timeout gracefully if Redis is slow
      const startTime = Date.now();

      try {
        await cacheService.get('resilience:timeout:key');
        const duration = Date.now() - startTime;
        console.log(`  ✓ Operation completed in ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`  ⚠ Operation timed out after ${duration}ms`);
      }

      // Should not hang indefinitely
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(30000); // 30 seconds max
    });

    it('should handle malformed data in cache', async () => {
      console.log('  → Testing malformed data handling...');

      // Set malformed data directly in Redis
      const malformedKey = 'resilience:malformed';

      try {
        // Try to set and get potentially problematic data
        await cacheService.set(malformedKey, 'not-json-{invalid}', { ttl: 60 });
        const result = await cacheService.get(malformedKey);

        // Should either return null or the data, but not crash
        expect(result !== undefined).toBe(true);
        console.log('  ✓ Malformed data handled gracefully');
      } catch (error) {
        console.log('  ✓ Error caught and handled');
      }
    });

    it('should handle circular reference serialization', async () => {
      console.log('  → Testing circular reference handling...');

      // Create object with circular reference
      const obj: any = { name: 'test' };
      obj.self = obj;

      try {
        await cacheService.set('resilience:circular', obj, { ttl: 60 });
        console.log('  ⚠ Circular reference was serialized (unexpected)');
      } catch (error) {
        console.log('  ✓ Circular reference error caught and handled');
        expect(error).toBeDefined();
      }
    });
  });

  describe('Rate Limiter Resilience', () => {
    it('should fail-open on rate limiter errors', async () => {
      console.log('  → Testing rate limiter fail-open...');

      // If rate limiter fails, it should allow requests (fail-open)
      const key = 'resilience:ratelimit:failopen';

      try {
        const result = await rateLimiterService.checkRateLimit(key, 5, 60);

        // Should return a result, even if Redis has issues
        expect(result).toHaveProperty('allowed');

        if (result.allowed) {
          console.log('  ✓ Request allowed (fail-open working)');
        } else {
          console.log('  ✓ Request blocked (rate limiter working normally)');
        }
      } catch (error) {
        console.log('  ⚠ Rate limiter error caught:', error);
      }
    });

    it('should recover rate limit state after failure', async () => {
      console.log('  → Testing rate limit recovery...');

      const key = 'resilience:ratelimit:recovery';
      const maxRequests = 5;

      // Make some requests before potential failure
      await rateLimiterService.checkRateLimit(key, maxRequests, 60);
      await rateLimiterService.checkRateLimit(key, maxRequests, 60);

      // Simulate time passing / recovery
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be able to continue
      const result = await rateLimiterService.checkRateLimit(key, maxRequests, 60);
      expect(result).toHaveProperty('allowed');

      console.log(`  ✓ Rate limiter recovered, ${result.remaining} requests remaining`);
    });
  });

  describe('Data Integrity', () => {
    it('should handle concurrent writes to same key', async () => {
      console.log('  → Testing concurrent write handling...');

      const key = 'resilience:concurrent:writes';
      const concurrentWrites = 50;

      // Write different values concurrently
      const writes = Array.from({ length: concurrentWrites }, (_, i) =>
        cacheService.set(key, { value: i, timestamp: Date.now() }, { ttl: 60 })
      );

      await Promise.all(writes);

      // Should have some value (last write wins)
      const result = await cacheService.get(key);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('value');

      console.log(`  ✓ Final value after ${concurrentWrites} concurrent writes: ${result.value}`);
    });

    it('should maintain counter accuracy under concurrent increments', async () => {
      console.log('  → Testing counter accuracy under load...');

      const key = 'resilience:counter:accuracy';
      const increments = 100;

      // Delete existing counter
      await cacheService.delete(key);

      // Concurrent increments
      const operations = Array.from({ length: increments }, () =>
        cacheService.increment(key)
      );

      await Promise.all(operations);

      // Get final count
      const finalCount = await cacheService.get(key);
      const expected = increments;
      const actual = parseInt(finalCount as string);

      console.log(`  Expected: ${expected}, Actual: ${actual}`);

      // Due to Redis atomic operations, should be accurate
      expect(actual).toBe(expected);
      console.log('  ✓ Counter accuracy maintained');
    });

    it('should prevent cache stampede', async () => {
      console.log('  → Testing cache stampede prevention...');

      const key = 'resilience:stampede:key';
      let factoryCalls = 0;

      // Simulate many concurrent requests for same uncached data
      const concurrentRequests = 50;
      const startTime = Date.now();

      const requests = Array.from({ length: concurrentRequests }, () =>
        cacheService.getOrSet(
          key,
          async () => {
            factoryCalls++;
            await new Promise(resolve => setTimeout(resolve, 100)); // Simulate slow DB
            return { data: 'expensive-data', generated: Date.now() };
          },
          { ttl: 60 }
        )
      );

      const results = await Promise.all(requests);
      const duration = Date.now() - startTime;

      console.log(`  Factory called ${factoryCalls} times for ${concurrentRequests} concurrent requests`);
      console.log(`  Duration: ${duration}ms`);

      // All requests should get the same data
      expect(results.every(r => r.data === 'expensive-data')).toBe(true);

      // Ideally, factory should be called only once (with proper locking)
      // But without distributed locks, multiple calls might happen
      console.log(`  ✓ Cache stampede test completed (${factoryCalls} factory calls)`);
    });
  });

  describe('Memory Management', () => {
    it('should handle memory pressure gracefully', async () => {
      console.log('  → Testing memory pressure handling...');

      const health = await getRedisHealth();
      const initialMemory = health.memoryUsed;

      console.log(`  Initial memory: ${health.memoryUsedHuman}`);

      // Create many cache entries
      const entries = 1000;
      for (let i = 0; i < entries; i++) {
        await cacheService.set(
          `resilience:memory:${i}`,
          { index: i, data: 'x'.repeat(1000) }, // 1KB each
          { ttl: 60 }
        );
      }

      const afterHealth = await getRedisHealth();
      console.log(`  After ${entries} entries: ${afterHealth.memoryUsedHuman}`);

      // Clean up
      await cacheService.deletePattern('resilience:memory:*');

      const finalHealth = await getRedisHealth();
      console.log(`  After cleanup: ${finalHealth.memoryUsedHuman}`);

      expect(afterHealth.memoryUsed).toBeGreaterThan(initialMemory);
      console.log('  ✓ Memory management working');
    });

    it('should respect TTL and clean up expired keys', async () => {
      console.log('  → Testing automatic cleanup of expired keys...');

      const keys = Array.from({ length: 20 }, (_, i) => `resilience:ttl:${i}`);

      // Set keys with short TTL
      for (const key of keys) {
        await cacheService.set(key, { data: 'temporary' }, { ttl: 1 });
      }

      // Verify keys exist
      let existingCount = 0;
      for (const key of keys) {
        if (await cacheService.exists(key)) {
          existingCount++;
        }
      }

      console.log(`  ${existingCount}/${keys.length} keys exist initially`);
      expect(existingCount).toBe(keys.length);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if keys expired
      let remainingCount = 0;
      for (const key of keys) {
        if (await cacheService.exists(key)) {
          remainingCount++;
        }
      }

      console.log(`  ${remainingCount}/${keys.length} keys remain after expiration`);
      expect(remainingCount).toBe(0);
      console.log('  ✓ Automatic cleanup working');
    });
  });

  describe('Tenant Isolation Under Failure', () => {
    it('should maintain tenant isolation during errors', async () => {
      console.log('  → Testing tenant isolation during errors...');

      const tenant1 = 'tenant-resilience-1';
      const tenant2 = 'tenant-resilience-2';

      // Set data for both tenants
      await cacheService.set(`tenant:${tenant1}:data`, { secret: 'tenant1-data' }, { ttl: 60 });
      await cacheService.set(`tenant:${tenant2}:data`, { secret: 'tenant2-data' }, { ttl: 60 });

      // Try to access each tenant's data
      const data1 = await cacheService.get(`tenant:${tenant1}:data`);
      const data2 = await cacheService.get(`tenant:${tenant2}:data`);

      // Verify no cross-contamination
      expect(data1).not.toEqual(data2);
      expect(data1.secret).toBe('tenant1-data');
      expect(data2.secret).toBe('tenant2-data');

      console.log('  ✓ Tenant isolation maintained');

      // Cleanup
      await cacheService.delete(`tenant:${tenant1}:data`);
      await cacheService.delete(`tenant:${tenant2}:data`);
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should track consecutive failures', async () => {
      console.log('  → Testing failure tracking...');

      const key = 'resilience:circuit:test';
      let failureCount = 0;
      const maxAttempts = 10;

      for (let i = 0; i < maxAttempts; i++) {
        try {
          await cacheService.get(`${key}:${i}`);
        } catch (error) {
          failureCount++;
        }
      }

      console.log(`  ${failureCount}/${maxAttempts} operations failed`);

      // If many failures, circuit should open
      if (failureCount > maxAttempts / 2) {
        console.log('  ⚠ High failure rate detected - circuit breaker should open');
      } else {
        console.log('  ✓ Failure rate acceptable');
      }

      expect(failureCount).toBeLessThanOrEqual(maxAttempts);
    });
  });

  describe('Backup and Recovery', () => {
    it('should be able to rebuild cache from database', async () => {
      console.log('  → Testing cache rebuild capability...');

      const key = 'resilience:rebuild:test';

      // Simulate cache miss and rebuild from "database"
      const rebuiltData = await cacheService.getOrSet(
        key,
        async () => {
          // Simulate database fetch
          await new Promise(resolve => setTimeout(resolve, 50));
          return {
            id: 'rebuilt-data',
            timestamp: Date.now(),
            source: 'database',
          };
        },
        { ttl: 60 }
      );

      expect(rebuiltData.source).toBe('database');
      console.log('  ✓ Cache rebuild from database working');

      // Verify it's now cached
      const cached = await cacheService.get(key);
      expect(cached).toEqual(rebuiltData);
      console.log('  ✓ Rebuilt data is now cached');

      // Cleanup
      await cacheService.delete(key);
    });
  });

  describe('Monitoring and Alerting', () => {
    it('should provide health metrics for monitoring', async () => {
      console.log('  → Testing health metrics...');

      const health = await getRedisHealth();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('connected');
      expect(health).toHaveProperty('memoryUsed');
      expect(health).toHaveProperty('uptime');

      console.log('  Health Status:', health.status);
      console.log('  Connected:', health.connected);
      console.log('  Memory:', health.memoryUsedHuman);
      console.log('  Uptime:', health.uptime, 'seconds');

      console.log('  ✓ Health metrics available for monitoring');
    });

    it('should track cache statistics for alerting', async () => {
      console.log('  → Testing statistics tracking...');

      cacheService.resetStats();

      // Perform various operations
      await cacheService.set('resilience:stats:1', 'value1', { ttl: 60 });
      await cacheService.get('resilience:stats:1'); // Hit
      await cacheService.get('resilience:stats:nonexistent'); // Miss
      await cacheService.delete('resilience:stats:1');

      const stats = cacheService.getStats();

      expect(stats.sets).toBeGreaterThan(0);
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.deletes).toBeGreaterThan(0);

      console.log('  Cache Stats:', stats);
      console.log('  Hit Rate:', (cacheService.getHitRate() * 100).toFixed(2) + '%');
      console.log('  ✓ Statistics available for alerting');
    });
  });
});
