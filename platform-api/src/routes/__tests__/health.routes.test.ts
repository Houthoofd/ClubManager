/**
 * Health Routes Tests
 * Comprehensive tests for all health check endpoints including Redis cache
 */

import request from 'supertest';
import express, { Express } from 'express';
import { jest } from '@jest/globals';
import healthRouter from '../health.routes.js';
import {
  redisHealthCheck,
  redisInfo,
  isRedisReady,
} from '../../db/redis.client.js';
import { cacheService } from '../../cache/cache.service.js';
import { checkDatabaseConnection } from '../../db/prisma.client.js';

// Mock dependencies
jest.mock('../../db/redis.client.js');
jest.mock('../../cache/cache.service.js');
jest.mock('../../db/prisma.client.js');

describe('Health Routes Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/health', healthRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return 200 with basic health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
      });
    });

    it('should include valid timestamp in ISO format', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should return positive uptime', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.uptime).toBeGreaterThan(0);
    });

    it('should return current environment', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(['development', 'test', 'production', 'staging']).toContain(
        response.body.environment
      );
    });

    it('should handle errors gracefully', async () => {
      // Force an error by mocking process.uptime
      const originalUptime = process.uptime;
      process.uptime = (() => {
        throw new Error('Uptime error');
      }) as any;

      const response = await request(app).get('/health');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: expect.any(String),
      });

      process.uptime = originalUptime;
    });
  });

  describe('GET /health/detailed', () => {
    it('should return 200 with detailed health status when all services healthy', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 100,
        misses: 20,
        sets: 50,
        deletes: 10,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.8333);

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        services: {
          database: {
            status: 'healthy',
            connected: true,
          },
          redis: {
            status: 'healthy',
            connected: true,
            latency: 5,
          },
          cache: {
            status: 'healthy',
            stats: {
              hits: 100,
              misses: 20,
              sets: 50,
              deletes: 10,
              errors: 0,
            },
            hitRate: '83.33%',
          },
        },
        system: expect.any(Object),
      });
    });

    it('should return 503 when database is unhealthy', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(false);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0);

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('degraded');
      expect(response.body.services.database.status).toBe('unhealthy');
    });

    it('should return 503 when Redis is unhealthy', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'unhealthy',
        error: 'Connection failed',
      });
      (isRedisReady as jest.Mock).mockReturnValue(false);
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 5,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0);

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('degraded');
      expect(response.body.services.redis.status).toBe('unhealthy');
      expect(response.body.services.redis.error).toBe('Connection failed');
    });

    it('should include system information', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0);

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(200);
      expect(response.body.system).toMatchObject({
        nodeVersion: expect.any(String),
        platform: expect.any(String),
        memory: {
          used: expect.stringMatching(/\d+MB/),
          total: expect.stringMatching(/\d+MB/),
          rss: expect.stringMatching(/\d+MB/),
        },
      });
    });

    it('should show degraded status when cache has errors', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (isRedisReady as jest.Mock).mockReturnValue(false);
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 10,
        misses: 5,
        sets: 10,
        deletes: 2,
        errors: 15,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.6667);

      const response = await request(app).get('/health/detailed');

      expect(response.body.services.cache.status).toBe('degraded');
      expect(response.body.services.cache.stats.errors).toBe(15);
    });

    it('should handle exceptions gracefully', async () => {
      (checkDatabaseConnection as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/health/detailed');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'unhealthy',
        timestamp: expect.any(String),
        error: expect.any(String),
      });
    });
  });

  describe('GET /health/database', () => {
    it('should return 200 when database is healthy', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);

      const response = await request(app).get('/health/database');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        connected: true,
        timestamp: expect.any(String),
      });
    });

    it('should return 503 when database is unhealthy', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(false);

      const response = await request(app).get('/health/database');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'unhealthy',
        connected: false,
        timestamp: expect.any(String),
      });
    });

    it('should return 503 when database check throws error', async () => {
      (checkDatabaseConnection as jest.Mock).mockRejectedValue(
        new Error('Connection timeout')
      );

      const response = await request(app).get('/health/database');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'unhealthy',
        connected: false,
        error: 'Connection timeout',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /health/cache', () => {
    it('should return 200 with cache details when Redis is healthy', async () => {
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 3,
      });
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 150,
        misses: 30,
        sets: 80,
        deletes: 15,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.8333);

      const response = await request(app).get('/health/cache');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'healthy',
        connected: true,
        latency: 3,
        info: {
          host: 'localhost',
          port: 6379,
          db: 0,
          keyPrefix: 'test:',
          status: 'ready',
        },
        stats: {
          hits: 150,
          misses: 30,
          sets: 80,
          deletes: 15,
          errors: 0,
          hitRate: '83.33%',
        },
        timestamp: expect.any(String),
      });
    });

    it('should return 503 when Redis is unhealthy', async () => {
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'unhealthy',
        error: 'Connection refused',
      });
      (isRedisReady as jest.Mock).mockReturnValue(false);
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'disconnected',
      });
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 10,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0);

      const response = await request(app).get('/health/cache');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.error).toBe('Connection refused');
    });

    it('should show poor hit rate', async () => {
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 10,
        misses: 90,
        sets: 50,
        deletes: 5,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.1);

      const response = await request(app).get('/health/cache');

      expect(response.status).toBe(200);
      expect(response.body.stats.hitRate).toBe('10.00%');
      expect(response.body.stats.hits).toBe(10);
      expect(response.body.stats.misses).toBe(90);
    });

    it('should handle cache errors', async () => {
      (redisHealthCheck as jest.Mock).mockRejectedValue(
        new Error('Redis timeout')
      );

      const response = await request(app).get('/health/cache');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        status: 'unhealthy',
        connected: false,
        error: 'Redis timeout',
        timestamp: expect.any(String),
      });
    });

    it('should show high latency warning', async () => {
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 250,
      });
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 100,
        misses: 20,
        sets: 50,
        deletes: 10,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.8333);

      const response = await request(app).get('/health/cache');

      expect(response.status).toBe(200);
      expect(response.body.latency).toBe(250);
      expect(response.body.latency).toBeGreaterThan(100);
    });
  });

  describe('GET /health/cache/stats', () => {
    it('should return 200 with cache statistics', async () => {
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 200,
        misses: 50,
        sets: 100,
        deletes: 20,
        errors: 2,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.8);

      const response = await request(app).get('/health/cache/stats');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        stats: {
          hits: 200,
          misses: 50,
          sets: 100,
          deletes: 20,
          errors: 2,
        },
        performance: {
          hitRate: 0.8,
          hitRatePercent: '80.00%',
          totalRequests: 250,
        },
        timestamp: expect.any(String),
      });
    });

    it('should calculate total requests correctly', async () => {
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 75,
        misses: 25,
        sets: 50,
        deletes: 10,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.75);

      const response = await request(app).get('/health/cache/stats');

      expect(response.status).toBe(200);
      expect(response.body.performance.totalRequests).toBe(100);
    });

    it('should handle zero hit rate', async () => {
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 0,
        misses: 100,
        sets: 50,
        deletes: 10,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0);

      const response = await request(app).get('/health/cache/stats');

      expect(response.status).toBe(200);
      expect(response.body.performance.hitRatePercent).toBe('0.00%');
    });

    it('should handle errors gracefully', async () => {
      (cacheService.getStats as jest.Mock).mockImplementation(() => {
        throw new Error('Stats error');
      });

      const response = await request(app).get('/health/cache/stats');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'Stats error',
        timestamp: expect.any(String),
      });
    });
  });

  describe('POST /health/cache/stats/reset', () => {
    it('should reset cache statistics successfully', async () => {
      (cacheService.resetStats as jest.Mock).mockReturnValue(undefined);

      const response = await request(app).post('/health/cache/stats/reset');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        message: 'Cache statistics reset successfully',
        timestamp: expect.any(String),
      });
      expect(cacheService.resetStats).toHaveBeenCalled();
    });

    it('should handle reset errors', async () => {
      (cacheService.resetStats as jest.Mock).mockImplementation(() => {
        throw new Error('Reset failed');
      });

      const response = await request(app).post('/health/cache/stats/reset');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        error: 'Reset failed',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /health/ready (Kubernetes Readiness)', () => {
    it('should return 200 when all services are ready', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
      });

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        ready: true,
        timestamp: expect.any(String),
      });
    });

    it('should return 503 when database is not ready', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(false);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
      });

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(503);
      expect(response.body.ready).toBe(false);
    });

    it('should return 503 when Redis is not ready', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'unhealthy',
      });

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(503);
      expect(response.body.ready).toBe(false);
    });

    it('should handle errors in readiness check', async () => {
      (checkDatabaseConnection as jest.Mock).mockRejectedValue(
        new Error('DB connection failed')
      );

      const response = await request(app).get('/health/ready');

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        ready: false,
        error: 'DB connection failed',
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /health/live (Kubernetes Liveness)', () => {
    it('should always return 200 if process is running', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        alive: true,
        timestamp: expect.any(String),
        uptime: expect.any(Number),
      });
    });

    it('should return valid uptime', async () => {
      const response = await request(app).get('/health/live');

      expect(response.status).toBe(200);
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should respond quickly', async () => {
      const start = Date.now();
      const response = await request(app).get('/health/live');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Health Routes Performance', () => {
    it('should respond to basic health check within 100ms', async () => {
      const start = Date.now();
      const response = await request(app).get('/health');
      const duration = Date.now() - start;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent health checks', async () => {
      (checkDatabaseConnection as jest.Mock).mockResolvedValue(true);
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });

      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/health'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });
    });

    it('should not leak memory on repeated calls', async () => {
      for (let i = 0; i < 100; i++) {
        await request(app).get('/health');
      }

      const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      expect(memUsage).toBeLessThan(500); // Less than 500MB
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing environment variable', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.environment).toBe('development');

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle very high cache error count', async () => {
      (redisHealthCheck as jest.Mock).mockResolvedValue({
        status: 'healthy',
        latency: 5,
      });
      (isRedisReady as jest.Mock).mockReturnValue(true);
      (redisInfo as jest.Mock).mockResolvedValue({
        host: 'localhost',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        status: 'ready',
      });
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 100,
        misses: 50,
        sets: 100,
        deletes: 20,
        errors: 999,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(0.6667);

      const response = await request(app).get('/health/cache');

      expect(response.status).toBe(200);
      expect(response.body.stats.errors).toBe(999);
    });

    it('should handle NaN hit rate gracefully', async () => {
      (cacheService.getStats as jest.Mock).mockReturnValue({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
      });
      (cacheService.getHitRate as jest.Mock).mockReturnValue(NaN);

      const response = await request(app).get('/health/cache/stats');

      expect(response.status).toBe(200);
      expect(response.body.performance.totalRequests).toBe(0);
    });
  });
});
