/**
 * Email Queue Service
 *
 * Service pour ajouter des emails dans la file d'attente persistante.
 * Les emails seront traités automatiquement par le worker en arrière-plan.
 *
 * Fonctionnalités :
 * - Ajout d'emails à la queue
 * - Priorisation (urgent, normal, low)
 * - Scheduling (envoi différé)
 * - Bulk insert (ajout en masse)
 * - Statistiques et monitoring
 */

import { PrismaClient, EmailQueueStatus } from '@prisma/client';
import { EmailSendRequest } from '@clubmanager/types';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export interface AddToQueueOptions {
  priority?: number; // -1 = low, 0 = normal, 1 = high
  scheduleAt?: Date; // Date d'envoi différé
  maxAttempts?: number; // Nombre max de tentatives
  correlationId?: string; // ID de correlation pour tracing
}

export interface QueuedEmail {
  id: number;
  to: string;
  status: EmailQueueStatus;
  priority: number;
  createdAt: Date;
  correlationId: string | null;
}

export class EmailQueueService {
  /**
   * Ajouter un email à la queue
   */
  async addToQueue(
    request: EmailSendRequest,
    options: AddToQueueOptions = {},
  ): Promise<QueuedEmail> {
    const {
      priority = 0,
      scheduleAt,
      maxAttempts = 5,
      correlationId = randomUUID(),
    } = options;

    console.log(
      `📥 [EmailQueueService] Adding email to queue: ${request.to} (priority: ${priority})`,
    );

    // Déterminer nextRetryAt
    const nextRetryAt = scheduleAt || null;

    // Créer l'email dans la queue
    const queuedEmail = await prisma.emailQueue.create({
      data: {
        to: request.to,
        subject: request.subject || null,
        templateTitle: request.templateTitle || null,
        variables: request.variables ? (request.variables as any) : null,
        htmlContent: request.message || null,
        priority,
        maxAttempts,
        nextRetryAt,
        correlationId,
        utilisateurId: request.utilisateurId || null,
        status: EmailQueueStatus.PENDING,
      },
    });

    console.log(
      `✅ [EmailQueueService] Email queued successfully (ID: ${queuedEmail.id}, correlationId: ${correlationId})`,
    );

    if (scheduleAt) {
      console.log(
        `⏰ [EmailQueueService] Email scheduled for ${scheduleAt.toISOString()}`,
      );
    }

    return {
      id: queuedEmail.id,
      to: queuedEmail.to,
      status: queuedEmail.status,
      priority: queuedEmail.priority,
      createdAt: queuedEmail.createdAt,
      correlationId: queuedEmail.correlationId,
    };
  }

  /**
   * Ajouter plusieurs emails à la queue (bulk)
   */
  async addBulkToQueue(
    requests: EmailSendRequest[],
    options: AddToQueueOptions = {},
  ): Promise<QueuedEmail[]> {
    console.log(
      `📥 [EmailQueueService] Adding ${requests.length} emails to queue (bulk)`,
    );

    const {
      priority = 0,
      scheduleAt,
      maxAttempts = 5,
    } = options;

    // Préparer les données
    const data = requests.map((request) => ({
      to: request.to,
      subject: request.subject || null,
      templateTitle: request.templateTitle || null,
      variables: request.variables ? (request.variables as any) : null,
      htmlContent: request.message || null,
      priority,
      maxAttempts,
      nextRetryAt: scheduleAt || null,
      correlationId: randomUUID(),
      utilisateurId: request.utilisateurId || null,
      status: EmailQueueStatus.PENDING,
    }));

    // Insérer en masse
    await prisma.emailQueue.createMany({
      data,
    });

    // Récupérer les emails créés (derniers N)
    const queuedEmails = await prisma.emailQueue.findMany({
      where: {
        to: { in: requests.map((r) => r.to) },
      },
      orderBy: { createdAt: 'desc' },
      take: requests.length,
    });

    console.log(
      `✅ [EmailQueueService] ${queuedEmails.length} emails queued successfully (bulk)`,
    );

    return queuedEmails.map((e) => ({
      id: e.id,
      to: e.to,
      status: e.status,
      priority: e.priority,
      createdAt: e.createdAt,
      correlationId: e.correlationId,
    }));
  }

  /**
   * Ajouter un email urgent (haute priorité)
   */
  async addUrgentToQueue(request: EmailSendRequest): Promise<QueuedEmail> {
    return this.addToQueue(request, { priority: 1 });
  }

  /**
   * Ajouter un email low priority
   */
  async addLowPriorityToQueue(request: EmailSendRequest): Promise<QueuedEmail> {
    return this.addToQueue(request, { priority: -1 });
  }

  /**
   * Scheduler un email pour plus tard
   */
  async scheduleEmail(
    request: EmailSendRequest,
    scheduleAt: Date,
  ): Promise<QueuedEmail> {
    return this.addToQueue(request, { scheduleAt });
  }

  /**
   * Obtenir un email de la queue par ID
   */
  async getQueuedEmail(id: number) {
    return await prisma.emailQueue.findUnique({
      where: { id },
    });
  }

  /**
   * Obtenir les emails de la queue par correlation ID
   */
  async getEmailsByCorrelationId(correlationId: string) {
    return await prisma.emailQueue.findMany({
      where: { correlationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Annuler un email en attente
   */
  async cancelQueuedEmail(id: number): Promise<boolean> {
    try {
      const email = await prisma.emailQueue.findUnique({
        where: { id },
      });

      if (!email) {
        console.warn(`⚠️ [EmailQueueService] Email #${id} not found`);
        return false;
      }

      if (email.status !== EmailQueueStatus.PENDING) {
        console.warn(
          `⚠️ [EmailQueueService] Cannot cancel email #${id} (status: ${email.status})`,
        );
        return false;
      }

      await prisma.emailQueue.update({
        where: { id },
        data: {
          status: EmailQueueStatus.FAILED,
          lastError: 'Cancelled by user',
        },
      });

      console.log(`✅ [EmailQueueService] Email #${id} cancelled`);
      return true;
    } catch (error) {
      console.error(`❌ [EmailQueueService] Error cancelling email #${id}:`, error);
      return false;
    }
  }

  /**
   * Réessayer un email échoué
   */
  async retryFailedEmail(id: number): Promise<boolean> {
    try {
      const email = await prisma.emailQueue.findUnique({
        where: { id },
      });

      if (!email) {
        console.warn(`⚠️ [EmailQueueService] Email #${id} not found`);
        return false;
      }

      if (email.status !== EmailQueueStatus.FAILED) {
        console.warn(
          `⚠️ [EmailQueueService] Email #${id} is not failed (status: ${email.status})`,
        );
        return false;
      }

      // Reset et remettre en queue
      await prisma.emailQueue.update({
        where: { id },
        data: {
          status: EmailQueueStatus.PENDING,
          attempts: 0,
          nextRetryAt: null,
          lastError: null,
          errorDetails: null,
        },
      });

      console.log(`✅ [EmailQueueService] Email #${id} reset and re-queued`);
      return true;
    } catch (error) {
      console.error(`❌ [EmailQueueService] Error retrying email #${id}:`, error);
      return false;
    }
  }

  /**
   * Nettoyer les emails anciens (completed/failed)
   */
  async cleanOldEmails(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.emailQueue.deleteMany({
      where: {
        OR: [
          { status: EmailQueueStatus.COMPLETED },
          { status: EmailQueueStatus.FAILED },
        ],
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    console.log(
      `🧹 [EmailQueueService] Cleaned ${result.count} old emails (older than ${olderThanDays} days)`,
    );

    return result.count;
  }

  /**
   * Obtenir les statistiques de la queue
   */
  async getStatistics() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [
      totalPending,
      totalProcessing,
      totalCompleted,
      totalFailed,
      last24h,
      lastHour,
      byPriority,
      scheduled,
    ] = await Promise.all([
      // Totaux par statut
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PENDING },
      }),
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PROCESSING },
      }),
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.COMPLETED },
      }),
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.FAILED },
      }),

      // Dernières 24h
      prisma.emailQueue.count({
        where: { createdAt: { gte: oneDayAgo } },
      }),

      // Dernière heure
      prisma.emailQueue.count({
        where: { createdAt: { gte: oneHourAgo } },
      }),

      // Par priorité
      prisma.emailQueue.groupBy({
        by: ['priority'],
        where: { status: EmailQueueStatus.PENDING },
        _count: true,
      }),

      // Emails schedulés (futurs)
      prisma.emailQueue.count({
        where: {
          status: EmailQueueStatus.PENDING,
          nextRetryAt: { gt: now },
        },
      }),
    ]);

    // Calculer le taux de succès
    const total = totalCompleted + totalFailed;
    const successRate = total > 0 ? (totalCompleted / total) * 100 : 0;

    // Formater les stats par priorité
    const priorityStats = {
      high: byPriority.find((p) => p.priority === 1)?._count || 0,
      normal: byPriority.find((p) => p.priority === 0)?._count || 0,
      low: byPriority.find((p) => p.priority === -1)?._count || 0,
    };

    return {
      queue: {
        pending: totalPending,
        processing: totalProcessing,
        completed: totalCompleted,
        failed: totalFailed,
        total: totalPending + totalProcessing + totalCompleted + totalFailed,
      },
      recent: {
        last24h,
        lastHour,
      },
      performance: {
        successRate: `${successRate.toFixed(2)}%`,
        totalProcessed: total,
      },
      priority: priorityStats,
      scheduled,
    };
  }

  /**
   * Obtenir les emails échoués récents
   */
  async getRecentFailures(limit: number = 10) {
    return await prisma.emailQueue.findMany({
      where: {
        status: EmailQueueStatus.FAILED,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        to: true,
        templateTitle: true,
        attempts: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,
        correlationId: true,
      },
    });
  }

  /**
   * Obtenir les prochains emails à envoyer
   */
  async getUpcomingEmails(limit: number = 10) {
    return await prisma.emailQueue.findMany({
      where: {
        status: EmailQueueStatus.PENDING,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: limit,
      select: {
        id: true,
        to: true,
        templateTitle: true,
        priority: true,
        attempts: true,
        nextRetryAt: true,
        createdAt: true,
        correlationId: true,
      },
    });
  }
}

// Instance singleton
export const emailQueueService = new EmailQueueService();
