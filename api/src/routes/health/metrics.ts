/**
 * 📊 Metrics Endpoint for Prometheus
 *
 * Expose des métriques Prometheus pour le système d'email :
 * - Métriques applicatives (emails, queue, circuit breaker)
 * - Métriques système (CPU, mémoire, Node.js)
 * - Format compatible Prometheus
 *
 * @route GET /metrics
 * @route GET /metrics/email
 */

import { Router, Request, Response } from 'express';
import { getMetricsCollector } from '../../infrastructure/external-services/email/metrics-collector';
import { getCurrentCorrelationId } from '../../infrastructure/external-services/email/correlation-id-manager';

const router = Router();

/**
 * GET /metrics
 * Expose toutes les métriques au format Prometheus
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Metrics] Prometheus scraping${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();

    if (!metricsCollector.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Metrics collection is disabled',
        timestamp: new Date().toISOString()
      });
    }

    // Récupérer les métriques au format Prometheus
    const metrics = await metricsCollector.getMetrics();

    // Retourner au format texte pour Prometheus
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    console.error('❌ [Metrics] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /metrics/email
 * Expose uniquement les métriques email (filtré)
 */
router.get('/email', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Metrics] Email metrics request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();

    if (!metricsCollector.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Metrics collection is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const metrics = await metricsCollector.getMetrics();

    // Filtrer uniquement les métriques email (préfixées par "email_")
    const emailMetrics = metrics
      .split('\n')
      .filter(line => line.includes('email_') || line.startsWith('#'))
      .join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(emailMetrics);
  } catch (error) {
    console.error('❌ [Metrics] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /metrics/snapshot
 * Retourne un snapshot JSON des métriques (pour debugging)
 */
router.get('/snapshot', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Metrics] Snapshot request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();

    if (!metricsCollector.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Metrics collection is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const snapshot = await metricsCollector.getSnapshot();

    res.json({
      success: true,
      data: snapshot,
      timestamp: new Date().toISOString(),
      correlationId
    });
  } catch (error) {
    console.error('❌ [Metrics] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /metrics/status
 * Retourne le statut du système de métriques
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const metricsCollector = getMetricsCollector();

    res.json({
      success: true,
      data: {
        enabled: metricsCollector.isEnabled(),
        config: {
          prefix: 'email_',
          defaultLabels: {}
        },
        registry: {
          metrics: await metricsCollector.getRegistry().getMetricsAsJSON()
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Metrics] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /metrics/reset
 * Réinitialise toutes les métriques (dev/test uniquement)
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    // Vérifier l'environnement
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Cannot reset metrics in production',
        timestamp: new Date().toISOString()
      });
    }

    const metricsCollector = getMetricsCollector();
    metricsCollector.reset();

    console.log('🔄 [Metrics] Metrics reset');

    res.json({
      success: true,
      message: 'Metrics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Metrics] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /metrics/enable
 * Active la collecte de métriques
 */
router.put('/enable', async (req: Request, res: Response) => {
  try {
    const metricsCollector = getMetricsCollector();
    metricsCollector.setEnabled(true);

    console.log('✅ [Metrics] Metrics collection enabled');

    res.json({
      success: true,
      message: 'Metrics collection enabled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Metrics] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /metrics/disable
 * Désactive la collecte de métriques
 */
router.put('/disable', async (req: Request, res: Response) => {
  try {
    const metricsCollector = getMetricsCollector();
    metricsCollector.setEnabled(false);

    console.log('⏸️ [Metrics] Metrics collection disabled');

    res.json({
      success: true,
      message: 'Metrics collection disabled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Metrics] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
