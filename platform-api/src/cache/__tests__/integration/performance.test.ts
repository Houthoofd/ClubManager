/**
 * Performance Tests for Redis Cache
 * Load testing and performance benchmarks
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { cacheService } from '../../cache.service.js';
import { tenantCacheService } from '../../tenant-cache.service.js';
import { userCacheService } from '../../user-cache.service.js';
import { rateLimiterService } from '../../rate-limiter.service.js';
import { waitForRedis, disconnectRedis, getRedisHealth } from '../../../db/redis.client.js';

describe('Performance Tests', () => {
  beforeAll(async () => {
    try {
      await waitForRedis(10000);
      console.log('\n=== Redis Performance Tests ===\n');
    } catch (error) {
      console.error('Redis not available for performance tests');
      throw error;
    }
  });

  afterAll(async () => {
    await cacheService.deletePattern('perf:*');
    await disconnectRedis();
    console.log('\n=== Performance Tests Completed ===\n');
  });

  beforeEach(async () => {
    await cacheService.deletePattern('perf:*');
  });

  describe('Cache Write Performance', () => {
    it('should handle 1000 sequential writes efficiently', async () => {
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await cacheService.set(`perf:write:seq:${i}`, { index: i, data: `data-${i}` }, { ttl: 60 });
      }

      const duration = Date.now() - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`  ✓ ${iterations} sequential writes: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(opsPerSecond).toBeGreaterThan(50); // At least 50 ops/sec
    });

    it('should handle 1000 concurrent writes efficiently', async () => {
      const iterations = 1000;
      const startTime = Date.now();

      const promises = Array.from({ length: iterations }, (_, i) =>
        cacheService.set(`perf:write:conc:${i}`, { index: i, data: `data-${i}` }, { ttl: 60 })
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`  ✓ ${iterations} concurrent writes: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(5000);
      expect(opsPerSecond).toBeGreaterThan(100);
    });

    it('should handle batch writes efficiently', async () => {
      const batchSize = 100;
      const batches = 10;
      const startTime = Date.now();

      for (let batch = 0; batch < batches; batch++) {
        const items = Array.from({ length: batchSize }, (_, i) => ({
          key: `perf:write:batch:${batch}:${i}`,
          value: { batch, index: i },
          ttl: 60,
        }));

        await cacheService.mset(items);
      }

      const duration = Date.now() - startTime;
      const totalItems = batchSize * batches;
      const opsPerSecond = (totalItems / duration) * 1000;

      console.log(`  ✓ ${batches} batches of ${batchSize} writes: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Cache Read Performance', () => {
    beforeEach(async () => {
      // Prepare test data
      const promises = Array.from({ length: 100 }, (_, i) =>
        cacheService.set(`perf:read:${i}`, { index: i, data: `cached-data-${i}` }, { ttl: 300 })
      );
      await Promise.all(promises);
    });

    it('should handle 1000 sequential reads efficiently', async () => {
      const iterations = 1000;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await cacheService.get(`perf:read:${i % 100}`);
      }

      const duration = Date.now() - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`  ✓ ${iterations} sequential reads: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(5000);
      expect(opsPerSecond).toBeGreaterThan(100);
    });

    it('should handle 1000 concurrent reads efficiently', async () => {
      const iterations = 1000;
      const startTime = Date.now();

      const promises = Array.from({ length: iterations }, (_, i) =>
        cacheService.get(`perf:read:${i % 100}`)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`  ✓ ${iterations} concurrent reads: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(3000);
      expect(opsPerSecond).toBeGreaterThan(200);
    });

    it('should handle batch reads efficiently', async () => {
      const batchSize = 50;
      const batches = 20;
      const startTime = Date.now();

      for (let batch = 0; batch < batches; batch++) {
        const keys = Array.from({ length: batchSize }, (_, i) => `perf:read:${(batch * batchSize + i) % 100}`);
        await cacheService.mget(keys);
      }

      const duration = Date.now() - startTime;
      const totalReads = batchSize * batches;
      const opsPerSecond = (totalReads / duration) * 1000;

      console.log(`  ✓ ${batches} batches of ${batchSize} reads: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Mixed Operations Performance', () => {
    it('should handle mixed read/write operations', async () => {
      const iterations = 500;
      const startTime = Date.now();

      const operations = Array.from({ length: iterations }, (_, i) => {
        if (i % 3 === 0) {
          return cacheService.set(`perf:mixed:${i}`, { data: i }, { ttl: 60 });
        } else if (i % 3 === 1) {
          return cacheService.get(`perf:mixed:${i - 1}`);
        } else {
          return cacheService.delete(`perf:mixed:${i - 2}`);
        }
      });

      await Promise.all(operations);
      const duration = Date.now() - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`  ✓ ${iterations} mixed operations: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle concurrent mixed operations', async () => {
      const sets = 200;
      const gets = 300;
      const deletes = 100;
      const total = sets + gets + deletes;

      const startTime = Date.now();

      const operations = [
        ...Array.from({ length: sets }, (_, i) =>
          cacheService.set(`perf:concurrent:${i}`, { data: i }, { ttl: 60 })
        ),
        ...Array.from({ length: gets }, (_, i) =>
          cacheService.get(`perf:concurrent:${i % sets}`)
        ),
        ...Array.from({ length: deletes }, (_, i) =>
          cacheService.delete(`perf:concurrent:${i}`)
        ),
      ];

      await Promise.all(operations);
      const duration = Date.now() - startTime;
      const opsPerSecond = (total / duration) * 1000;

      console.log(`  ✓ ${total} concurrent mixed operations: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(4000);
    });
  });

  describe('Rate Limiter Performance', () => {
    it('should handle 1000 rate limit checks efficiently', async () => {
      const iterations = 1000;
      const startTime = Date.now();

      const promises = Array.from({ length: iterations }, (_, i) =>
        rateLimiterService.checkRateLimit(`perf:ratelimit:${i % 100}`, 1000, 60)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`  ✓ ${iterations} rate limit checks: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(5000);
      expect(opsPerSecond).toBeGreaterThan(100);
    });

    it('should handle sliding window checks efficiently', async () => {
      const iterations = 500;
      const startTime = Date.now();

      const promises = Array.from({ length: iterations }, (_, i) =>
        rateLimiterService.checkRateLimitSlidingWindow(`perf:sliding:${i % 50}`, 100, 60)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      console.log(`  ✓ ${iterations} sliding window checks: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Complex Data Structure Performance', () => {
    it('should handle large objects efficiently', async () => {
      const largeObject = {
        id: 'large-object-test',
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
          metadata: {
            created: new Date().toISOString(),
            tags: ['tag1', 'tag2', 'tag3'],
            nested: {
              level1: { level2: { level3: `data-${i}` } },
            },
          },
        })),
      };

      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await cacheService.set(`perf:large:${i}`, largeObject, { ttl: 60 });
        await cacheService.get(`perf:large:${i}`);
      }

      const duration = Date.now() - startTime;
      const opsPerSecond = ((iterations * 2) / duration) * 1000;

      console.log(`  ✓ ${iterations} large object operations: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(10000);
    });

    it('should handle deep nesting efficiently', async () => {
      const createDeepObject = (depth: number): any => {
        if (depth === 0) return { value: 'leaf' };
        return { nested: createDeepObject(depth - 1), level: depth };
      };

      const deepObject = createDeepObject(20);
      const iterations = 100;
      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        await cacheService.set(`perf:deep:${i}`, deepObject, { ttl: 60 });
        await cacheService.get(`perf:deep:${i}`);
      }

      const duration = Date.now() - startTime;

      console.log(`  ✓ ${iterations} deep nested object operations: ${duration}ms`);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Counter Performance', () => {
    it('should handle concurrent increments correctly', async () => {
      const key = 'perf:counter:concurrent';
      const increments = 1000;
      const startTime = Date.now();

      const promises = Array.from({ length: increments }, () =>
        cacheService.increment(key)
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      const finalCount = await cacheService.get(key);
      const opsPerSecond = (increments / duration) * 1000;

      console.log(`  ✓ ${increments} concurrent increments: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(parseInt(finalCount as string)).toBe(increments);
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple counters efficiently', async () => {
      const counters = 100;
      const incrementsPerCounter = 50;
      const startTime = Date.now();

      const operations = [];
      for (let i = 0; i < counters; i++) {
        for (let j = 0; j < incrementsPerCounter; j++) {
          operations.push(cacheService.increment(`perf:counter:multi:${i}`));
        }
      }

      await Promise.all(operations);
      const duration = Date.now() - startTime;
      const totalOps = counters * incrementsPerCounter;
      const opsPerSecond = (totalOps / duration) * 1000;

      console.log(`  ✓ ${counters} counters × ${incrementsPerCounter} increments: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Set Operations Performance', () => {
    it('should handle set operations efficiently', async () => {
      const key = 'perf:set:operations';
      const members = 1000;
      const startTime = Date.now();

      // Add members
      const addPromises = Array.from({ length: members }, (_, i) =>
        cacheService.addToSet(key, `member-${i}`)
      );
      await Promise.all(addPromises);

      // Check membership
      const checkPromises = Array.from({ length: members }, (_, i) =>
        cacheService.isInSet(key, `member-${i}`)
      );
      await Promise.all(checkPromises);

      const duration = Date.now() - startTime;
      const totalOps = members * 2;
      const opsPerSecond = (totalOps / duration) * 1000;

      console.log(`  ✓ ${members} set add + ${members} membership checks: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(8000);

      await cacheService.delete(key);
    });

    it('should handle sorted set operations efficiently', async () => {
      const key = 'perf:sortedset:operations';
      const members = 500;
      const startTime = Date.now();

      // Add members with scores
      const addPromises = Array.from({ length: members }, (_, i) =>
        cacheService.addToSortedSet(key, i, `member-${i}`)
      );
      await Promise.all(addPromises);

      // Range queries
      const rangePromises = Array.from({ length: 100 }, (_, i) =>
        cacheService.getSortedSetByScore(key, i * 5, (i + 1) * 5)
      );
      await Promise.all(rangePromises);

      const duration = Date.now() - startTime;
      const totalOps = members + 100;
      const opsPerSecond = (totalOps / duration) * 1000;

      console.log(`  ✓ ${members} sorted set operations + 100 range queries: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      expect(duration).toBeLessThan(8000);

      await cacheService.delete(key);
    });
  });

  describe('Pattern Operations Performance', () => {
    it('should handle pattern deletion efficiently', async () => {
      // Create test keys
      const keysToCreate = 500;
      const createPromises = Array.from({ length: keysToCreate }, (_, i) =>
        cacheService.set(`perf:pattern:delete:${i}`, { index: i }, { ttl: 60 })
      );
      await Promise.all(createPromises);

      // Delete by pattern
      const startTime = Date.now();
      const deletedCount = await cacheService.deletePattern('perf:pattern:delete:*');
      const duration = Date.now() - startTime;

      console.log(`  ✓ Pattern deletion of ${deletedCount} keys: ${duration}ms`);
      expect(deletedCount).toBeGreaterThanOrEqual(keysToCreate);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Memory Usage', () => {
    it('should report memory usage after operations', async () => {
      // Perform various operations
      const operations = 1000;
      const promises = Array.from({ length: operations }, (_, i) =>
        cacheService.set(`perf:memory:${i}`, { index: i, data: 'test-data' }, { ttl: 60 })
      );
      await Promise.all(promises);

      const health = await getRedisHealth();

      console.log(`  ✓ Memory after ${operations} operations: ${health.memoryUsedHuman}`);
      console.log(`  ✓ Connected clients: ${health.connectedClients}`);
      console.log(`  ✓ Total commands: ${health.totalCommandsProcessed}`);

      expect(health.memoryUsed).toBeGreaterThan(0);
      expect(health.connected).toBe(true);
    });
  });

  describe('Stress Test', () => {
    it('should handle sustained load', async () => {
      const duration = 5000; // 5 seconds
      const startTime = Date.now();
      let operationCount = 0;

      while (Date.now() - startTime < duration) {
        const batchPromises = Array.from({ length: 50 }, (_, i) => {
          const key = `perf:stress:${operationCount + i}`;
          if (Math.random() > 0.5) {
            return cacheService.set(key, { data: operationCount + i }, { ttl: 10 });
          } else {
            return cacheService.get(key);
          }
        });

        await Promise.all(batchPromises);
        operationCount += 50;
      }

      const actualDuration = Date.now() - startTime;
      const opsPerSecond = (operationCount / actualDuration) * 1000;

      console.log(`  ✓ Sustained load test: ${operationCount} operations in ${actualDuration}ms`);
      console.log(`  ✓ Average throughput: ${opsPerSecond.toFixed(0)} ops/sec`);

      expect(opsPerSecond).toBeGreaterThan(50);

      await cacheService.deletePattern('perf:stress:*');
    });
  });

  describe('Cache Hit Rate Performance', () => {
    it('should demonstrate cache effectiveness', async () => {
      cacheService.resetStats();

      // Create cached data
      const items = 100;
      for (let i = 0; i < items; i++) {
        await cacheService.set(`perf:hitrate:${i}`, { data: i }, { ttl: 60 });
      }

      // Simulate access pattern (80% cache hits)
      const accesses = 1000;
      const startTime = Date.now();

      for (let i = 0; i < accesses; i++) {
        const key = `perf:hitrate:${i % items}`;
        await cacheService.get(key);
      }

      const duration = Date.now() - startTime;
      const hitRate = cacheService.getHitRate();
      const opsPerSecond = (accesses / duration) * 1000;

      console.log(`  ✓ ${accesses} cache accesses: ${duration}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
      console.log(`  ✓ Cache hit rate: ${(hitRate * 100).toFixed(2)}%`);

      expect(hitRate).toBeGreaterThan(0.8); // At least 80% hit rate
      expect(opsPerSecond).toBeGreaterThan(100);
    });
  });

  describe('Latency Tests', () => {
    it('should have acceptable p50, p95, p99 latencies', async () => {
      const iterations = 1000;
      const latencies: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await cacheService.get(`perf:latency:${i % 100}`);
        latencies.push(Date.now() - start);
      }

      latencies.sort((a, b) => a - b);

      const p50 = latencies[Math.floor(iterations * 0.5)];
      const p95 = latencies[Math.floor(iterations * 0.95)];
      const p99 = latencies[Math.floor(iterations * 0.99)];
      const max = latencies[latencies.length - 1];

      console.log(`  ✓ Latency percentiles:`);
      console.log(`    - p50: ${p50}ms`);
      console.log(`    - p95: ${p95}ms`);
      console.log(`    - p99: ${p99}ms`);
      console.log(`    - max: ${max}ms`);

      expect(p50).toBeLessThan(10);
      expect(p95).toBeLessThan(50);
      expect(p99).toBeLessThan(100);
    });
  });
});
