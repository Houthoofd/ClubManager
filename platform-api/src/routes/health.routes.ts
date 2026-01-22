/**
 * Health Check Routes
 * Provides endpoints for monitoring application health, cache, and database
 */

import { Router, Request, Response } from 'express';
import { redisHealthCheck, redisInfo, isRedisReady } from '../cache/index.js';
import { cacheService } from '../cache/cache.service.js';
import { checkDatabaseConnection } from '../db/prisma.client.js';

const router = Router();

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Detailed health check with all services
 * GET /health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    // Check database
    const dbHealthy = await checkDatabaseConnection();

    // Check Redis
    const redisHealth = await redisHealthCheck();
    const redisReady = isRedisReady();

    // Get cache stats
    const cacheStats = cacheService.getStats();
    const cacheHitRate = cacheService.getHitRate();

    const allHealthy = dbHealthy && redisHealth.status === 'healthy';

    const health = {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          connected: dbHealthy,
        },
        redis: {
          status: redisHealth.status,
          connected: redisReady,
          latency: redisHealth.latency,
          error: redisHealth.error,
        },
        cache: {
          status: redisReady ? 'healthy' : 'degraded',
          stats: cacheStats,
          hitRate: `${(cacheHitRate * 100).toFixed(2)}%`,
        },
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        },
      },
    };

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Database health check
 * GET /health/database
 */
router.get('/database', async (req: Request, res: Response) => {
  try {
    const isHealthy = await checkDatabaseConnection();

    if (isHealthy) {
      res.status(200).json({
        status: 'healthy',
        connected: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'unhealthy',
        connected: false,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Redis/Cache health check
 * GET /health/cache
 */
router.get('/cache', async (req: Request, res: Response) => {
  try {
    const redisHealth = await redisHealthCheck();
    const redisReady = isRedisReady();
    const info = await redisInfo();
    const stats = cacheService.getStats();
    const hitRate = cacheService.getHitRate();

    const health = {
      status: redisHealth.status,
      connected: redisReady,
      latency: redisHealth.latency,
      error: redisHealth.error,
      info: {
        host: info.host,
        port: info.port,
        db: info.db,
        keyPrefix: info.keyPrefix,
        status: info.status,
      },
      stats: {
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes,
        errors: stats.errors,
        hitRate: `${(hitRate * 100).toFixed(2)}%`,
      },
      timestamp: new Date().toISOString(),
    };

    const statusCode = redisHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Cache statistics
 * GET /health/cache/stats
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const stats = cacheService.getStats();
    const hitRate = cacheService.getHitRate();

    res.status(200).json({
      stats: {
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        deletes: stats.deletes,
        errors: stats.errors,
      },
      performance: {
        hitRate: hitRate,
        hitRatePercent: `${(hitRate * 100).toFixed(2)}%`,
        totalRequests: stats.hits + stats.misses,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Reset cache statistics
 * POST /health/cache/stats/reset
 */
router.post('/cache/stats/reset', async (req: Request, res: Response) => {
  try {
    cacheService.resetStats();

    res.status(200).json({
      message: 'Cache statistics reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Readiness probe (for Kubernetes)
 * GET /health/ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await checkDatabaseConnection();
    const redisHealth = await redisHealthCheck();

    const ready = dbHealthy && redisHealth.status === 'healthy';

    if (ready) {
      res.status(200).json({
        ready: true,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        ready: false,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness probe (for Kubernetes)
 * GET /health/live
 */
router.get('/live', async (req: Request, res: Response) => {
  // Simple liveness check - just respond if the process is running
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
