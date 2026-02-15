/**
 * 📊 Dashboard Admin Routes
 *
 * Routes pour le dashboard admin avec métriques en temps réel :
 * - Statistiques de la queue
 * - Métriques d'envoi
 * - État du circuit breaker
 * - Graphiques et tendances
 * - WebSocket pour updates en temps réel
 *
 * @route GET /dashboard
 * @route GET /dashboard/summary
 * @route GET /dashboard/timeseries
 * @route GET /dashboard/templates
 * @route GET /dashboard/priorities
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getDashboardService } from '../../infrastructure/external-services/email/dashboard-service';
import { getMetricsCollector } from '../../infrastructure/external-services/email/metrics-collector';
import { getCurrentCorrelationId } from '../../infrastructure/external-services/email/correlation-id-manager';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /dashboard
 * Retourne toutes les données du dashboard
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Dashboard] Full data request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.getDashboardData();

    res.json({
      success: true,
      data,
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/summary
 * Retourne un résumé complet avec toutes les statistiques
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Dashboard] Summary request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const summary = await dashboardService.getSummary();

    res.json({
      success: true,
      data: summary,
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/timeseries
 * Retourne les données de séries temporelles
 * Query params:
 *   - hours: nombre d'heures de données (défaut: 24)
 */
router.get('/timeseries', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();
    const hours = parseInt(req.query.hours as string) || 24;

    if (hours < 1 || hours > 168) {
      return res.status(400).json({
        success: false,
        error: 'Hours must be between 1 and 168 (7 days)',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📊 [Dashboard] Timeseries request (${hours}h)${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.getTimeSeriesData(hours);

    res.json({
      success: true,
      data,
      metadata: {
        hours,
        dataPoints: data.length
      },
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/templates
 * Retourne les statistiques par template
 * Query params:
 *   - hours: nombre d'heures de données (défaut: 24)
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();
    const hours = parseInt(req.query.hours as string) || 24;

    if (hours < 1 || hours > 168) {
      return res.status(400).json({
        success: false,
        error: 'Hours must be between 1 and 168 (7 days)',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`📊 [Dashboard] Template stats request (${hours}h)${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.getTemplateStats(hours);

    res.json({
      success: true,
      data,
      metadata: {
        hours,
        templateCount: data.length
      },
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/priorities
 * Retourne les statistiques par priorité
 */
router.get('/priorities', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Dashboard] Priority stats request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.getPriorityStats();

    res.json({
      success: true,
      data,
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/queue
 * Retourne les statistiques de la queue
 */
router.get('/queue', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Dashboard] Queue stats request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.getQueueStats();

    res.json({
      success: true,
      data,
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/worker
 * Retourne les statistiques du worker
 */
router.get('/worker', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Dashboard] Worker stats request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.getWorkerStats();

    res.json({
      success: true,
      data,
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/errors
 * Retourne les erreurs récentes
 */
router.get('/errors', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`📊 [Dashboard] Recent errors request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.getRecentErrors();

    res.json({
      success: true,
      data,
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /dashboard/refresh
 * Force un rafraîchissement immédiat du dashboard
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`🔄 [Dashboard] Forced refresh${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const data = await dashboardService.refresh();

    res.json({
      success: true,
      data,
      message: 'Dashboard refreshed successfully',
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /dashboard/cleanup
 * Nettoie les anciennes métriques
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const correlationId = getCurrentCorrelationId();

    console.log(`🧹 [Dashboard] Cleanup request${correlationId ? ` [${correlationId}]` : ''}`);

    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    if (!dashboardService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard is disabled',
        timestamp: new Date().toISOString()
      });
    }

    const deleted = await dashboardService.cleanupOldMetrics();

    res.json({
      success: true,
      data: {
        deletedCount: deleted
      },
      message: `Cleaned up ${deleted} old metrics`,
      correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /dashboard/enable
 * Active le dashboard
 */
router.put('/enable', async (req: Request, res: Response) => {
  try {
    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    dashboardService.setEnabled(true);

    console.log('✅ [Dashboard] Dashboard enabled');

    res.json({
      success: true,
      message: 'Dashboard enabled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /dashboard/disable
 * Désactive le dashboard
 */
router.put('/disable', async (req: Request, res: Response) => {
  try {
    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    dashboardService.setEnabled(false);

    console.log('⏸️ [Dashboard] Dashboard disabled');

    res.json({
      success: true,
      message: 'Dashboard disabled',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /dashboard/status
 * Retourne le statut du dashboard
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const metricsCollector = getMetricsCollector();
    const dashboardService = getDashboardService(prisma, metricsCollector);

    const lastData = dashboardService.getLastData();

    res.json({
      success: true,
      data: {
        enabled: dashboardService.isEnabled(),
        lastUpdate: lastData?.timestamp,
        hasData: !!lastData
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ [Dashboard] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
