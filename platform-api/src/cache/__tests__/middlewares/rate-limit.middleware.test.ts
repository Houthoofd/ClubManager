/**
 * Rate Limit Middleware Tests
 * Tests for Express rate limiting middleware
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import {
  ipRateLimitMiddleware,
  tenantRateLimitMiddleware,
  userRateLimitMiddleware,
  authRateLimitMiddleware,
  combinedRateLimitMiddleware,
} from '../../middlewares/rate-limit.middleware.js';
import { rateLimiterService } from '../../rate-limiter.service.js';
import { cacheService } from '../../cache.service.js';
import { waitForRedis, disconnectRedis } from '../../../db/redis.client.js';

// Mock request helper
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  ip: '127.0.0.1',
  headers: {},
  method: 'GET',
  path: '/api/test',
  ...overrides,
});

// Mock response helper
const createMockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis() as any,
    json: jest.fn().mockReturnThis() as any,
    set: jest.fn().mockReturnThis() as any,
  };
  return res;
};

// Mock next function
const createMockNext = (): NextFunction => jest.fn() as any;

describe('Rate Limit Middleware', () => {
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
    // Clear rate limit keys
    await cacheService.deletePattern('ratelimit:*');
    jest.clearAllMocks();
  });

  describe('IP Rate Limit Middleware', () => {
    it('should allow requests within rate limit', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = ipRateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block requests exceeding rate limit', async () => {
      const req = createMockRequest({ ip: '192.168.1.100' });
      const res = createMockResponse();
      const maxRequests = 3;

      // Exhaust rate limit
      for (let i = 0; i < maxRequests; i++) {
        const next = createMockNext();
        const middleware = ipRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
        await middleware(req as Request, res as Response, next);
      }

      // Next request should be blocked
      const next = createMockNext();
      const middleware = ipRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests',
        })
      );
    });

    it('should set rate limit headers', async () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = ipRateLimitMiddleware({ maxRequests: 10, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
      expect(res.set).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(String));
    });

    it('should use X-Forwarded-For header if available', async () => {
      const forwardedIp = '203.0.113.1';
      const req = createMockRequest({
        headers: { 'x-forwarded-for': forwardedIp },
        ip: '10.0.0.1',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = ipRateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle missing IP address', async () => {
      const req = createMockRequest({ ip: undefined });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = ipRateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      // Should handle gracefully
      expect(next).toHaveBeenCalled();
    });

    it('should skip rate limiting for whitelisted IPs', async () => {
      const whitelistedIp = '10.0.0.100';
      await rateLimiterService.whitelistIp(whitelistedIp);

      const req = createMockRequest({ ip: whitelistedIp });
      const middleware = ipRateLimitMiddleware({ maxRequests: 1, windowSeconds: 60 });

      // Make more requests than the limit
      for (let i = 0; i < 5; i++) {
        const res = createMockResponse();
        const next = createMockNext();
        await middleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
      }

      // Cleanup
      await rateLimiterService.removeIpFromWhitelist(whitelistedIp);
    });

    it('should block blacklisted IPs immediately', async () => {
      const blacklistedIp = '192.168.99.99';
      await rateLimiterService.blacklistIp(blacklistedIp);

      const req = createMockRequest({ ip: blacklistedIp });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = ipRateLimitMiddleware({ maxRequests: 100, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Access denied',
        })
      );

      // Cleanup
      await rateLimiterService.removeIpFromBlacklist(blacklistedIp);
    });
  });

  describe('Tenant Rate Limit Middleware', () => {
    it('should rate limit by tenant ID', async () => {
      const tenantId = 'tenant-test-123';
      const req = createMockRequest({ tenantId } as any);
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = tenantRateLimitMiddleware({ maxRequests: 10, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should block tenant exceeding rate limit', async () => {
      const tenantId = 'tenant-blocked-123';
      const req = createMockRequest({ tenantId } as any);
      const maxRequests = 3;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = tenantRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
        await middleware(req as Request, res as Response, next);
      }

      // Should be blocked
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = tenantRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should isolate rate limits between tenants', async () => {
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';
      const maxRequests = 2;

      // Exhaust tenant1
      for (let i = 0; i < maxRequests; i++) {
        const req = createMockRequest({ tenantId: tenant1 } as any);
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = tenantRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
        await middleware(req as Request, res as Response, next);
      }

      // tenant1 should be blocked
      const req1 = createMockRequest({ tenantId: tenant1 } as any);
      const res1 = createMockResponse();
      const next1 = createMockNext();
      const middleware1 = tenantRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware1(req1 as Request, res1 as Response, next1);
      expect(next1).not.toHaveBeenCalled();

      // tenant2 should still be allowed
      const req2 = createMockRequest({ tenantId: tenant2 } as any);
      const res2 = createMockResponse();
      const next2 = createMockNext();
      const middleware2 = tenantRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware2(req2 as Request, res2 as Response, next2);
      expect(next2).toHaveBeenCalled();
    });

    it('should skip if no tenant ID found', async () => {
      const req = createMockRequest(); // No tenantId
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = tenantRateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('User Rate Limit Middleware', () => {
    it('should rate limit by user ID', async () => {
      const userId = 'user-test-456';
      const req = createMockRequest({ user: { id: userId } } as any);
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = userRateLimitMiddleware({ maxRequests: 20, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should block user exceeding rate limit', async () => {
      const userId = 'user-blocked-456';
      const req = createMockRequest({ user: { id: userId } } as any);
      const maxRequests = 3;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = userRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
        await middleware(req as Request, res as Response, next);
      }

      // Should be blocked
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = userRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should isolate rate limits between users', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const maxRequests = 2;

      // Exhaust user1
      for (let i = 0; i < maxRequests; i++) {
        const req = createMockRequest({ user: { id: user1 } } as any);
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = userRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
        await middleware(req as Request, res as Response, next);
      }

      // user1 blocked
      const req1 = createMockRequest({ user: { id: user1 } } as any);
      const res1 = createMockResponse();
      const next1 = createMockNext();
      const middleware1 = userRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware1(req1 as Request, res1 as Response, next1);
      expect(next1).not.toHaveBeenCalled();

      // user2 allowed
      const req2 = createMockRequest({ user: { id: user2 } } as any);
      const res2 = createMockResponse();
      const next2 = createMockNext();
      const middleware2 = userRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware2(req2 as Request, res2 as Response, next2);
      expect(next2).toHaveBeenCalled();
    });

    it('should skip if no user found', async () => {
      const req = createMockRequest(); // No user
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = userRateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Auth Rate Limit Middleware', () => {
    it('should rate limit authentication attempts', async () => {
      const req = createMockRequest({
        body: { email: 'test@example.com' },
        ip: '192.168.1.1',
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = authRateLimitMiddleware({ maxRequests: 5, windowSeconds: 300 });
      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should block excessive auth attempts', async () => {
      const email = 'blocked@example.com';
      const ip = '192.168.1.50';
      const maxRequests = 3;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        const req = createMockRequest({ body: { email }, ip });
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = authRateLimitMiddleware({ maxRequests, windowSeconds: 300 });
        await middleware(req as Request, res as Response, next);
      }

      // Should be blocked
      const req = createMockRequest({ body: { email }, ip });
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = authRateLimitMiddleware({ maxRequests, windowSeconds: 300 });
      await middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Too many'),
        })
      );
    });

    it('should rate limit by IP if no email provided', async () => {
      const ip = '192.168.1.60';
      const maxRequests = 3;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        const req = createMockRequest({ body: {}, ip });
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = authRateLimitMiddleware({ maxRequests, windowSeconds: 300 });
        await middleware(req as Request, res as Response, next);
      }

      // Should be blocked
      const req = createMockRequest({ body: {}, ip });
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = authRateLimitMiddleware({ maxRequests, windowSeconds: 300 });
      await middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('Combined Rate Limit Middleware', () => {
    it('should apply multiple rate limits', async () => {
      const req = createMockRequest({
        ip: '192.168.1.100',
        tenantId: 'tenant-combined-1',
        user: { id: 'user-combined-1' },
      } as any);
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = combinedRateLimitMiddleware({
        ip: { maxRequests: 100, windowSeconds: 60 },
        tenant: { maxRequests: 50, windowSeconds: 60 },
        user: { maxRequests: 30, windowSeconds: 60 },
      });

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should block if any rate limit is exceeded', async () => {
      const ip = '192.168.2.1';
      const tenantId = 'tenant-combined-2';
      const userId = 'user-combined-2';

      // Exhaust user limit
      for (let i = 0; i < 2; i++) {
        const req = createMockRequest({
          ip,
          tenantId,
          user: { id: userId },
        } as any);
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = combinedRateLimitMiddleware({
          ip: { maxRequests: 100, windowSeconds: 60 },
          tenant: { maxRequests: 50, windowSeconds: 60 },
          user: { maxRequests: 2, windowSeconds: 60 },
        });
        await middleware(req as Request, res as Response, next);
      }

      // Should be blocked due to user limit
      const req = createMockRequest({
        ip,
        tenantId,
        user: { id: userId },
      } as any);
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = combinedRateLimitMiddleware({
        ip: { maxRequests: 100, windowSeconds: 60 },
        tenant: { maxRequests: 50, windowSeconds: 60 },
        user: { maxRequests: 2, windowSeconds: 60 },
      });
      await middleware(req as Request, res as Response, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it('should work with partial configuration', async () => {
      const req = createMockRequest({ ip: '192.168.3.1' });
      const res = createMockResponse();
      const next = createMockNext();

      // Only IP rate limit
      const middleware = combinedRateLimitMiddleware({
        ip: { maxRequests: 10, windowSeconds: 60 },
      });

      await middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // Disconnect Redis temporarily
      await disconnectRedis();

      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = ipRateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      // Should allow request through on Redis error (fail open)
      expect(next).toHaveBeenCalled();

      // Reconnect
      await waitForRedis(5000);
    });

    it('should handle malformed requests', async () => {
      const req = createMockRequest({
        ip: null as any,
        headers: null as any,
      });
      const res = createMockResponse();
      const next = createMockNext();

      const middleware = ipRateLimitMiddleware({ maxRequests: 5, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      // Should handle gracefully
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Headers and Response', () => {
    it('should include retry-after header when rate limited', async () => {
      const ip = '192.168.10.1';
      const maxRequests = 2;

      // Exhaust limit
      for (let i = 0; i < maxRequests; i++) {
        const req = createMockRequest({ ip });
        const res = createMockResponse();
        const next = createMockNext();
        const middleware = ipRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
        await middleware(req as Request, res as Response, next);
      }

      // Get blocked response
      const req = createMockRequest({ ip });
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = ipRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });

    it('should return proper error message', async () => {
      const ip = '192.168.11.1';
      const maxRequests = 1;

      // Exhaust limit
      const req1 = createMockRequest({ ip });
      const res1 = createMockResponse();
      const next1 = createMockNext();
      const middleware1 = ipRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware1(req1 as Request, res1 as Response, next1);

      // Get blocked
      const req = createMockRequest({ ip });
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = ipRateLimitMiddleware({ maxRequests, windowSeconds: 60 });
      await middleware(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
          retryAfter: expect.any(Number),
        })
      );
    });
  });
});
