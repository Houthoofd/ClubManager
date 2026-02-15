/**
 * Health Check Endpoint pour le système d'email
 *
 * GET /health/email
 *
 * Vérifie la santé du système d'email et retourne un statut détaillé :
 * - SendGrid : connexion et latence
 * - Queue : emails en attente, bloqués
 * - Circuit Breaker : état actuel
 * - Échecs récents
 * - Statistiques
 */

import { Router, Request, Response } from 'express';
import sendGridMail from '@sendgrid/mail';
import { PrismaClient, EmailQueueStatus } from '@prisma/client';
import { getCircuitStatus } from '../../infrastructure/external-services/email/circuit-breaker';
import { getEmailQueueWorker } from '../../infrastructure/external-services/email/email-queue-worker';
import { emailQueueService } from '../../infrastructure/external-services/email/email-queue-service';

const router = Router();
const prisma = new PrismaClient();

const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || '';

interface HealthCheck {
  name: string;
  ok: boolean;
  message: string;
  details?: any;
}

/**
 * GET /health/email
 * Endpoint principal de health check
 */
router.get('/email', async (req: Request, res: Response) => {
  try {
    console.log('🏥 [HealthCheck] Checking email system health...');

    // Exécuter tous les checks en parallèle
    const [sendgridCheck, queueCheck, circuitBreakerCheck, failuresCheck] =
      await Promise.all([
        checkSendGridConnection(),
        checkEmailQueue(),
        checkCircuitBreaker(),
        checkRecentFailures(),
      ]);

    // Vérifier la santé globale
    const isHealthy =
      sendgridCheck.ok && queueCheck.ok && circuitBreakerCheck.ok;

    // Obtenir les stats
    const stats = await getEmailStats();

    // Réponse
    const response = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        sendgrid: sendgridCheck,
        queue: queueCheck,
        circuitBreaker: circuitBreakerCheck,
        failures: failuresCheck,
      },
      stats,
    };

    // Code HTTP
    const statusCode = isHealthy ? 200 : 503;

    console.log(
      `🏥 [HealthCheck] Status: ${response.status} (${statusCode})`,
    );

    res.status(statusCode).json(response);
  } catch (error: any) {
    console.error('❌ [HealthCheck] Error:', error);

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * Vérifier la connexion à SendGrid
 */
async function checkSendGridConnection(): Promise<HealthCheck> {
  try {
    const start = Date.now();

    // Test simple avec sandbox mode (ne pas envoyer réellement)
    await sendGridMail.send({
      to: 'test@example.com',
      from: SENDGRID_FROM_EMAIL,
      subject: 'Health Check',
      text: 'Health check test',
      mailSettings: {
        sandboxMode: {
          enable: true,
        },
      },
    });

    const latency = Date.now() - start;

    return {
      name: 'SendGrid',
      ok: true,
      message: 'Connected ✅',
      details: {
        latency: `${latency}ms`,
        status: latency < 1000 ? 'fast' : latency < 3000 ? 'normal' : 'slow',
      },
    };
  } catch (error: any) {
    console.error('❌ [HealthCheck] SendGrid error:', error.message);

    return {
      name: 'SendGrid',
      ok: false,
      message: 'Connection failed ❌',
      details: {
        error: error.message,
        code: error.code,
      },
    };
  }
}

/**
 * Vérifier l'état de la queue
 */
async function checkEmailQueue(): Promise<HealthCheck> {
  try {
    const now = new Date();
    const stuckThreshold = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes

    // Compter les emails par statut
    const [pending, processing, stuck] = await Promise.all([
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PENDING },
      }),
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PROCESSING },
      }),
      prisma.emailQueue.count({
        where: {
          status: EmailQueueStatus.PROCESSING,
          updatedAt: { lt: stuckThreshold },
        },
      }),
    ]);

    // Vérifier le worker
    const worker = getEmailQueueWorker();
    const workerRunning = worker !== null;

    const ok = stuck === 0 && workerRunning;

    const warnings: string[] = [];
    if (stuck > 0) warnings.push(`${stuck} emails stuck`);
    if (!workerRunning) warnings.push('Worker not running');
    if (pending > 1000) warnings.push(`High pending count: ${pending}`);

    return {
      name: 'Email Queue',
      ok,
      message: ok ? 'Queue healthy ✅' : 'Issues detected ⚠️',
      details: {
        pending,
        processing,
        stuck,
        workerRunning,
        warnings: warnings.length > 0 ? warnings : undefined,
      },
    };
  } catch (error: any) {
    console.error('❌ [HealthCheck] Queue error:', error.message);

    return {
      name: 'Email Queue',
      ok: false,
      message: 'Queue check failed ❌',
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Vérifier l'état du Circuit Breaker
 */
async function checkCircuitBreaker(): Promise<HealthCheck> {
  try {
    const status = getCircuitStatus();

    const ok = status.state !== 'OPEN';

    let message = '';
    if (status.state === 'CLOSED') {
      message = 'All operational ✅';
    } else if (status.state === 'HALF_OPEN') {
      message = 'Testing connection ⚡';
    } else {
      message = 'SendGrid unavailable ❌';
    }

    return {
      name: 'Circuit Breaker',
      ok,
      message,
      details: {
        state: status.state,
        failureCount: status.failureCount,
        successCount: status.successCount,
        nextAttemptTime: status.nextAttemptTime?.toISOString(),
      },
    };
  } catch (error: any) {
    console.error('❌ [HealthCheck] Circuit Breaker error:', error.message);

    return {
      name: 'Circuit Breaker',
      ok: false,
      message: 'Circuit Breaker check failed ❌',
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Vérifier les échecs récents
 */
async function checkRecentFailures(): Promise<HealthCheck> {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const failedCount = await prisma.emailQueue.count({
      where: {
        status: EmailQueueStatus.FAILED,
        updatedAt: { gte: last24h },
      },
    });

    const ok = failedCount < 10; // < 10 échecs dans les 24h = OK

    return {
      name: 'Recent Failures',
      ok,
      message:
        failedCount === 0
          ? 'No failures ✅'
          : failedCount < 10
            ? 'Low failure rate ⚠️'
            : 'High failure rate ❌',
      details: {
        last24h: failedCount,
        threshold: 10,
      },
    };
  } catch (error: any) {
    console.error('❌ [HealthCheck] Failures check error:', error.message);

    return {
      name: 'Recent Failures',
      ok: false,
      message: 'Failures check failed ❌',
      details: {
        error: error.message,
      },
    };
  }
}

/**
 * Obtenir les statistiques globales
 */
async function getEmailStats() {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [sent, failed, pending] = await Promise.all([
      prisma.emailQueue.count({
        where: {
          status: EmailQueueStatus.COMPLETED,
          processedAt: { gte: last24h },
        },
      }),
      prisma.emailQueue.count({
        where: {
          status: EmailQueueStatus.FAILED,
          updatedAt: { gte: last24h },
        },
      }),
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PENDING },
      }),
    ]);

    const total = sent + failed;
    const successRate = total > 0 ? ((sent / total) * 100).toFixed(2) : '100.00';

    return {
      last24h: {
        sent,
        failed,
        total,
        successRate: `${successRate}%`,
      },
      queue: {
        pending,
      },
    };
  } catch (error: any) {
    console.error('❌ [HealthCheck] Stats error:', error.message);
    return {
      error: error.message,
    };
  }
}

/**
 * GET /health/email/detailed
 * Version détaillée avec plus d'informations
 */
router.get('/email/detailed', async (req: Request, res: Response) => {
  try {
    console.log('🏥 [HealthCheck] Checking detailed email system health...');

    // Checks de base
    const [sendgridCheck, queueCheck, circuitBreakerCheck, failuresCheck] =
      await Promise.all([
        checkSendGridConnection(),
        checkEmailQueue(),
        checkCircuitBreaker(),
        checkRecentFailures(),
      ]);

    // Stats détaillées
    const [stats, queueStats, recentFailures, upcomingEmails] =
      await Promise.all([
        getEmailStats(),
        emailQueueService.getStatistics(),
        emailQueueService.getRecentFailures(5),
        emailQueueService.getUpcomingEmails(5),
      ]);

    // Worker stats
    const worker = getEmailQueueWorker();
    const workerStats = worker ? worker.getStats() : null;

    const isHealthy =
      sendgridCheck.ok && queueCheck.ok && circuitBreakerCheck.ok;

    const response = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        sendgrid: sendgridCheck,
        queue: queueCheck,
        circuitBreaker: circuitBreakerCheck,
        failures: failuresCheck,
      },
      stats,
      queue: queueStats,
      worker: workerStats,
      recentFailures: recentFailures.map((f) => ({
        id: f.id,
        to: f.to,
        template: f.templateTitle,
        attempts: f.attempts,
        error: f.lastError,
        failedAt: f.updatedAt,
      })),
      upcoming: upcomingEmails.map((e) => ({
        id: e.id,
        to: e.to,
        template: e.templateTitle,
        priority: e.priority,
        attempts: e.attempts,
        scheduledFor: e.nextRetryAt || e.createdAt,
      })),
    };

    const statusCode = isHealthy ? 200 : 503;

    res.status(statusCode).json(response);
  } catch (error: any) {
    console.error('❌ [HealthCheck] Detailed check error:', error);

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});

/**
 * GET /health/email/worker
 * Statut du worker uniquement
 */
router.get('/email/worker', async (req: Request, res: Response) => {
  try {
    const worker = getEmailQueueWorker();

    if (!worker) {
      return res.status(503).json({
        status: 'stopped',
        message: 'Worker is not running',
      });
    }

    const stats = worker.getStats();
    const queueStatus = await worker.getQueueStatus();

    res.json({
      status: stats.status,
      stats,
      queue: queueStatus,
    });
  } catch (error: any) {
    console.error('❌ [HealthCheck] Worker check error:', error);

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

export default router;
