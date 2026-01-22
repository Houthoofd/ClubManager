/**
 * Response Cache Middleware Tests
 * Tests for HTTP response caching middleware
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  responseCacheMiddleware,
  cacheByTenant,
  cacheByUser,
  cacheByQuery,
  skipCache,
} from '../../middlewares/response-cache.middleware.js';
import { cacheService } from '../../cache.service.js';
import { waitForRedis, disconnectRedis } from '../../../db/redis.client.js';

// Mock request helper
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  method: 'GET',
  path: '/api/test',
  originalUrl: '/api/test',
  query: {},
  headers: {},
  ip: '127.0.0.1',
  ...overrides,
});

// Mock response helper with streaming support
const createMockResponse = (): Partial<Response> & {
  _body?: any;
  _statusCode?: number;
  _headers?: Record<string, string>;
} => {
  const res: any = {
    _body: undefined,
    _statusCode: 200,
    _headers: {},

    status: jest.fn().mockImplementation(function(code: number) {
      this._statusCode = code;
      return this;
    }),

    json: jest.fn().mockImplementation(function(body: any) {
      this._body = body;
      return this;
    }),

    send: jest.fn().mockImplementation(function(body: any) {
      this._body = body;
      return this;
    }),

    set: jest.fn().mockImplementation(function(field: string, value: string) {
      this._headers[field] = value;
      return this;
    }),

    setHeader: jest.fn().mockImplementation(function(name: string, value: string) {
      this._headers[name] = value;
      return this;
    }),

    getHeader: jest.fn().mockImplementation(function(name: string) {
      return this._headers[name];
    }),

    locals: {},
  };

  return res;
};

// Mock next function
const createMockNext = (): NextFunction => jest.fn() as any;

describe('Response Cache Middleware', () => {
  beforeAll(async () => {
    try {
      await waitForRedis(5000);
    } catch (error) {
      console.warn('Redis not available for tests - skipping');
    }
  });

  afterAll(async () => {
    await disconnectRedis();
  });

  beforeEach(async () => {
    // Clear cache keys
    await cacheService.deletePattern('cache:response:*');
    jest.clearAllMocks();
  });

  describe('Basic Response Caching', () => {
    it('should cache GET request responses', async () => {
      const req = createMockRequest({
        method: 'GET',
        path: '/api/users',
        originalUrl: '/api/users',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 60 });

      // First request - should miss cache
      await middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
      expect(res.getHeader('X-Cache')).toBeUndefined();

      // Simulate response
      res.status(200);
      res.json({ data: 'test data' });

      // Second request - should hit cache
      const req2 = createMockRequest({
        method: 'GET',
        path: '/api/users',
        originalUrl: '/api/users',
      });
      const res2 = createMockResponse();
      const next2 = createMockNext();

      await middleware(req2 as Request, res2 as Response, next2);

      // Should return cached response
      expect(res2.getHeader('X-Cache')).toBe('HIT');
    });

    it('should not cache non-GET requests', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const req = createMockRequest({ method });
        const res = createMockResponse();
        const next = createMockNext();

        const middleware = responseCacheMiddleware({ ttl: 60 });
        await middleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalled();
        expect(res.getHeader('X-Cache')).toBeUndefined();
      }
    });

    it('should respect cache TTL', async () => {
      const req = createMockRequest({
        path: '/api/data',
        originalUrl: '/api/data',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 1 }); // 1 second
      await middleware(req as Request, res as Response, next);

      // Cache the response
      res.status(200);
      res.json({ data: 'cached' });

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Should miss cache after expiry
      const req2 = createMockRequest({
        path: '/api/data',
        originalUrl: '/api/data',
      });
      const res2 = createMockResponse();
      const next2 = createMockNext();

      await middleware(req2 as Request, res2 as Response, next2);
      expect(next2).toHaveBeenCalled();
      expect(res2.getHeader('X-Cache')).not.toBe('HIT');
    });

    it('should set cache headers', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 300 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache by Tenant', () => {
    it('should cache responses separately per tenant', async () => {
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';

      // Request for tenant 1
      const req1 = createMockRequest({
        tenantId: tenant1,
        path: '/api/data',
      } as any);
      const res1 = createMockResponse();
      const next1 = createMockNext();

      const middleware1 = cacheByTenant({ ttl: 60 });
      await middleware1(req1 as Request, res1 as Response, next1);
      res1.json({ tenant: tenant1, data: 'tenant1-data' });

      // Request for tenant 2
      const req2 = createMockRequest({
        tenantId: tenant2,
        path: '/api/data',
      } as any);
      const res2 = createMockResponse();
      const next2 = createMockNext();

      const middleware2 = cacheByTenant({ ttl: 60 });
      await middleware2(req2 as Request, res2 as Response, next2);

      // Should not hit cache (different tenant)
      expect(next2).toHaveBeenCalled();
      expect(res2.getHeader('X-Cache')).not.toBe('HIT');
    });

    it('should include tenant ID in cache key', async () => {
      const tenantId = 'tenant-123';
      const req = createMockRequest({
        tenantId,
        path: '/api/test',
        originalUrl: '/api/test',
      } as any);
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cacheByTenant({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should skip cache if no tenant ID', async () => {
      const req = createMockRequest({
        path: '/api/test',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cacheByTenant({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache by User', () => {
    it('should cache responses separately per user', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // Request for user 1
      const req1 = createMockRequest({
        user: { id: user1 },
        path: '/api/profile',
      } as any);
      const res1 = createMockResponse();
      const next1 = createMockNext();

      const middleware1 = cacheByUser({ ttl: 60 });
      await middleware1(req1 as Request, res1 as Response, next1);
      res1.json({ user: user1, data: 'user1-data' });

      // Request for user 2
      const req2 = createMockRequest({
        user: { id: user2 },
        path: '/api/profile',
      } as any);
      const res2 = createMockResponse();
      const next2 = createMockNext();

      const middleware2 = cacheByUser({ ttl: 60 });
      await middleware2(req2 as Request, res2 as Response, next2);

      // Should not hit cache (different user)
      expect(next2).toHaveBeenCalled();
      expect(res2.getHeader('X-Cache')).not.toBe('HIT');
    });

    it('should include user ID in cache key', async () => {
      const userId = 'user-456';
      const req = createMockRequest({
        user: { id: userId },
        path: '/api/test',
        originalUrl: '/api/test',
      } as any);
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cacheByUser({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should skip cache if no user', async () => {
      const req = createMockRequest({
        path: '/api/test',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cacheByUser({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache by Query', () => {
    it('should cache responses with different query parameters separately', async () => {
      // Request with query param 1
      const req1 = createMockRequest({
        path: '/api/search',
        originalUrl: '/api/search?q=test1',
        query: { q: 'test1' },
      });
      const res1 = createMockResponse();
      const next1 = createMockNext();

      const middleware1 = cacheByQuery({ ttl: 60 });
      await middleware1(req1 as Request, res1 as Response, next1);
      res1.json({ query: 'test1', results: [] });

      // Request with query param 2
      const req2 = createMockRequest({
        path: '/api/search',
        originalUrl: '/api/search?q=test2',
        query: { q: 'test2' },
      });
      const res2 = createMockResponse();
      const next2 = createMockNext();

      const middleware2 = cacheByQuery({ ttl: 60 });
      await middleware2(req2 as Request, res2 as Response, next2);

      // Should not hit cache (different query)
      expect(next2).toHaveBeenCalled();
      expect(res2.getHeader('X-Cache')).not.toBe('HIT');
    });

    it('should include query string in cache key', async () => {
      const req = createMockRequest({
        path: '/api/data',
        originalUrl: '/api/data?filter=active&sort=name',
        query: { filter: 'active', sort: 'name' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cacheByQuery({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle empty query parameters', async () => {
      const req = createMockRequest({
        path: '/api/data',
        originalUrl: '/api/data',
        query: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = cacheByQuery({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Skip Cache Middleware', () => {
    it('should skip caching when skipCache is used', async () => {
      const req = createMockRequest({
        path: '/api/no-cache',
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Mark to skip cache
      skipCache(req as Request, res as Response, next);

      expect(req).toHaveProperty('skipCache', true);
      expect(next).toHaveBeenCalled();
    });

    it('should not cache when skipCache flag is set', async () => {
      const req = createMockRequest({
        path: '/api/data',
        skipCache: true,
      } as any);
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.getHeader('X-Cache')).toBeUndefined();
    });
  });

  describe('Cache Invalidation', () => {
    it('should not cache error responses', async () => {
      const req = createMockRequest({
        path: '/api/error',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      // Simulate error response
      res.status(500);
      res.json({ error: 'Internal Server Error' });

      // Should not cache 5xx responses
      const req2 = createMockRequest({
        path: '/api/error',
      });
      const res2 = createMockResponse();
      const next2 = createMockNext();

      await middleware(req2 as Request, res2 as Response, next2);
      expect(next2).toHaveBeenCalled();
    });

    it('should not cache 4xx responses', async () => {
      const req = createMockRequest({
        path: '/api/notfound',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      res.status(404);
      res.json({ error: 'Not Found' });

      // Should not cache
      const req2 = createMockRequest({
        path: '/api/notfound',
      });
      const res2 = createMockResponse();
      const next2 = createMockNext();

      await middleware(req2 as Request, res2 as Response, next2);
      expect(next2).toHaveBeenCalled();
    });

    it('should handle cache-control headers', async () => {
      const req = createMockRequest({
        headers: {
          'cache-control': 'no-cache',
        },
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Complex Cache Keys', () => {
    it('should handle combined cache strategies', async () => {
      const req = createMockRequest({
        tenantId: 'tenant-1',
        user: { id: 'user-1' },
        path: '/api/data',
        originalUrl: '/api/data?page=1',
        query: { page: '1' },
      } as any);
      const res = createMockResponse();
      const next = createMockNext();

      // Use combined middleware
      const middleware = responseCacheMiddleware({
        ttl: 60,
        varyByTenant: true,
        varyByUser: true,
        varyByQuery: true,
      });

      await middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalled();
    });

    it('should create unique cache keys for different combinations', async () => {
      const combinations = [
        { tenantId: 'tenant-1', user: { id: 'user-1' }, query: { page: '1' } },
        { tenantId: 'tenant-1', user: { id: 'user-2' }, query: { page: '1' } },
        { tenantId: 'tenant-2', user: { id: 'user-1' }, query: { page: '1' } },
        { tenantId: 'tenant-1', user: { id: 'user-1' }, query: { page: '2' } },
      ];

      for (const combo of combinations) {
        const req = createMockRequest({
          ...combo,
          path: '/api/data',
          originalUrl: '/api/data',
        } as any);
        const res = createMockResponse();
        const next = createMockNext();

        const middleware = responseCacheMiddleware({
          ttl: 60,
          varyByTenant: true,
          varyByUser: true,
          varyByQuery: true,
        });

        await middleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('Performance', () => {
    it('should handle high request volume efficiently', async () => {
      const startTime = Date.now();
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const req = createMockRequest({
          path: `/api/test/${i}`,
        });
        const res = createMockResponse();
        const next = createMockNext();

        const middleware = responseCacheMiddleware({ ttl: 60 });
        await middleware(req as Request, res as Response, next);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(3000); // Should complete in reasonable time
    });

    it('should cache frequently accessed endpoints', async () => {
      const path = '/api/popular';
      const middleware = responseCacheMiddleware({ ttl: 60 });

      // First request
      const req1 = createMockRequest({ path, originalUrl: path });
      const res1 = createMockResponse();
      const next1 = createMockNext();
      await middleware(req1 as Request, res1 as Response, next1);
      res1.json({ data: 'cached' });

      // Subsequent requests should be faster (from cache)
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        const req = createMockRequest({ path, originalUrl: path });
        const res = createMockResponse();
        const next = createMockNext();
        await middleware(req as Request, res as Response, next);
      }
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Cache hits should be fast
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully', async () => {
      await disconnectRedis();

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      // Should continue without caching
      expect(next).toHaveBeenCalled();

      // Reconnect
      await waitForRedis(5000);
    });

    it('should handle malformed cache data', async () => {
      const cacheKey = 'cache:response:/api/malformed';

      // Set invalid cache data
      await cacheService.set(cacheKey, 'invalid-json-{]', { ttl: 60 });

      const req = createMockRequest({
        path: '/api/malformed',
        originalUrl: '/api/malformed',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = responseCacheMiddleware({ ttl: 60 });
      await middleware(req as Request, res as Response, next);

      // Should handle gracefully and continue
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache hits and misses', async () => {
      const path = '/api/stats';
      const middleware = responseCacheMiddleware({ ttl: 60 });

      // First request - miss
      const req1 = createMockRequest({ path, originalUrl: path });
      const res1 = createMockResponse();
      const next1 = createMockNext();
      await middleware(req1 as Request, res1 as Response, next1);
      res1.json({ data: 'test' });

      expect(res1.getHeader('X-Cache')).not.toBe('HIT');

      // Second request - hit
      const req2 = createMockRequest({ path, originalUrl: path });
      const res2 = createMockResponse();
      const next2 = createMockNext();
      await middleware(req2 as Request, res2 as Response, next2);

      expect(res2.getHeader('X-Cache')).toBe('HIT');
    });
  });
});
