import { Router, Request, Response } from 'express';
import healthCheckService from '../../services/health-check/health-check.service.js';

const router = Router();

/**
 * GET /health
 * Endpoint de santé complet avec tous les checks
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const health = await healthCheckService.checkHealth();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /health/ready
 * Readiness probe - Kubernetes/Docker compatible
 * Vérifie si le service peut accepter du trafic
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const isReady = await healthCheckService.isReady();
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /health/live
 * Liveness probe - Kubernetes/Docker compatible
 * Vérifie si le service est vivant
 */
router.get('/live', async (req: Request, res: Response) => {
  try {
    const isAlive = await healthCheckService.isAlive();
    
    if (isAlive) {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    res.status(503).json({
      status: 'dead',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

export default router;
