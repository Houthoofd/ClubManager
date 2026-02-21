/**
 * Email Queue Worker
 *
 * Processus en arrière-plan qui traite la file d'attente des emails.
 * S'exécute en permanence et réessaie automatiquement les emails échoués.
 *
 * Fonctionnalités :
 * - Traitement continu de la queue
 * - Réessais automatiques avec backoff exponentiel
 * - Priorisation des emails (urgent/normal/low)
 * - Gestion des emails bloqués
 * - Logs détaillés
 */

import { PrismaClient, EmailQueueStatus } from "@prisma/client";
import { EmailSendRequest, EmailSendResult } from "@clubmanager/types";
import { alertService, AlertType } from "../../services/alert.service.js";

const prisma = new PrismaClient();

export interface EmailQueueWorkerConfig {
  pollInterval: number; // Intervalle de vérification (ms)
  batchSize: number; // Nombre d'emails à traiter par batch
  maxAttempts: number; // Nombre max de tentatives
  backoffMultiplier: number; // Multiplicateur pour backoff exponentiel
  stuckEmailThreshold: number; // Temps pour considérer un email comme bloqué (ms)
}

const DEFAULT_CONFIG: EmailQueueWorkerConfig = {
  pollInterval: 5000, // Vérifier toutes les 5 secondes
  batchSize: 10, // Traiter 10 emails à la fois
  maxAttempts: 5, // Max 5 tentatives
  backoffMultiplier: 2, // Backoff : 2min, 4min, 8min, 16min, 32min
  stuckEmailThreshold: 10 * 60 * 1000, // 10 minutes
};

export class EmailQueueWorker {
  private isRunning = false;
  private isPaused = false;
  private currentBatch: number[] = []; // IDs des emails en cours de traitement

  // Statistiques
  private stats = {
    totalProcessed: 0,
    totalSucceeded: 0,
    totalFailed: 0,
    currentBatchSize: 0,
    lastProcessedAt: null as Date | null,
    startedAt: null as Date | null,
  };

  constructor(
    private readonly config: EmailQueueWorkerConfig = DEFAULT_CONFIG,
    private readonly emailSender: (
      request: EmailSendRequest,
    ) => Promise<EmailSendResult>,
  ) {
    console.log(
      "📬 [EmailQueueWorker] Initialized with config:",
      JSON.stringify(config, null, 2),
    );
  }

  /**
   * Démarrer le worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn("⚠️ [EmailQueueWorker] Already running");
      return;
    }

    this.isRunning = true;
    this.stats.startedAt = new Date();
    console.log("🚀 [EmailQueueWorker] Starting...");

    // Boucle principale
    while (this.isRunning) {
      try {
        if (!this.isPaused) {
          await this.processQueue();
        }
      } catch (error) {
        console.error("❌ [EmailQueueWorker] Error in main loop:", error);
      }

      // Attendre avant la prochaine itération
      await this.sleep(this.config.pollInterval);
    }

    console.log("🛑 [EmailQueueWorker] Stopped");
  }

  /**
   * Arrêter le worker
   */
  async stop(): Promise<void> {
    console.log("🛑 [EmailQueueWorker] Stopping...");
    this.isRunning = false;

    // Attendre que le batch actuel se termine
    if (this.currentBatch.length > 0) {
      console.log(
        `⏳ [EmailQueueWorker] Waiting for current batch to complete (${this.currentBatch.length} emails)...`,
      );
      // Max 30 secondes d'attente
      for (let i = 0; i < 30; i++) {
        if (this.currentBatch.length === 0) break;
        await this.sleep(1000);
      }
    }
  }

  /**
   * Mettre en pause le worker
   */
  pause(): void {
    console.log("⏸️ [EmailQueueWorker] Paused");
    this.isPaused = true;
  }

  /**
   * Reprendre le worker
   */
  resume(): void {
    console.log("▶️ [EmailQueueWorker] Resumed");
    this.isPaused = false;
  }

  /**
   * Traiter la queue
   */
  private async processQueue(): Promise<void> {
    // 1. Nettoyer les emails bloqués
    await this.cleanStuckEmails();

    // 2. Récupérer les emails à traiter
    const emails = await this.fetchEmailsToProcess();

    if (emails.length === 0) {
      // Rien à traiter
      return;
    }

    console.log(`📧 [EmailQueueWorker] Processing ${emails.length} emails...`);
    this.stats.currentBatchSize = emails.length;
    this.currentBatch = emails.map((e) => e.id);

    // 3. Traiter chaque email
    const results = await Promise.allSettled(
      emails.map((email) => this.processEmail(email)),
    );

    // 4. Compter les succès/échecs
    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    this.stats.totalProcessed += emails.length;
    this.stats.totalSucceeded += succeeded;
    this.stats.totalFailed += failed;
    this.stats.lastProcessedAt = new Date();
    this.currentBatch = [];

    console.log(
      `✅ [EmailQueueWorker] Batch completed: ${succeeded} succeeded, ${failed} failed`,
    );
  }

  /**
   * Récupérer les emails à traiter
   */
  private async fetchEmailsToProcess() {
    const now = new Date();

    return await prisma.emailQueue.findMany({
      where: {
        status: EmailQueueStatus.PENDING,
        attempts: {
          lt: this.config.maxAttempts,
        },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }],
      },
      orderBy: [
        { priority: "desc" }, // Haute priorité d'abord
        { createdAt: "asc" }, // FIFO
      ],
      take: this.config.batchSize,
    });
  }

  /**
   * Traiter un email
   */
  private async processEmail(email: any): Promise<void> {
    const emailId = email.id;

    try {
      console.log(
        `📤 [EmailQueueWorker] Processing email #${emailId} (attempt ${email.attempts + 1}/${this.config.maxAttempts})`,
      );

      // Marquer comme "en cours"
      await prisma.emailQueue.update({
        where: { id: emailId },
        data: {
          status: EmailQueueStatus.PROCESSING,
          updatedAt: new Date(),
        },
      });

      // Préparer la requête d'envoi
      const request: EmailSendRequest = {
        to: email.to,
        subject: email.subject || undefined,
        templateTitle: email.templateTitle || undefined,
        variables: email.variables ? (email.variables as any) : undefined,
        message: email.htmlContent || undefined,
        utilisateurId: email.utilisateurId || undefined,
        saveToDb: false, // Déjà en DB via la queue
      };

      // Envoyer l'email
      const result = await this.emailSender(request);

      if (result.success) {
        // ✅ Succès
        await prisma.emailQueue.update({
          where: { id: emailId },
          data: {
            status: EmailQueueStatus.COMPLETED,
            processedAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(
          `✅ [EmailQueueWorker] Email #${emailId} sent successfully (messageId: ${result.messageId})`,
        );
      } else {
        // ❌ Échec mais retourné comme succès (erreur métier)
        throw new Error(result.error || "Unknown error");
      }
    } catch (error: any) {
      // ❌ Échec
      const newAttempts = email.attempts + 1;
      const isLastAttempt = newAttempts >= this.config.maxAttempts;

      console.error(
        `❌ [EmailQueueWorker] Email #${emailId} failed (attempt ${newAttempts}/${this.config.maxAttempts}):`,
        error.message,
      );

      if (isLastAttempt) {
        // Échec définitif
        await prisma.emailQueue.update({
          where: { id: emailId },
          data: {
            status: EmailQueueStatus.FAILED,
            attempts: newAttempts,
            lastError: error.message,
            errorDetails: {
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            },
            updatedAt: new Date(),
          },
        });

        console.error(
          `💀 [EmailQueueWorker] Email #${emailId} FAILED permanently after ${newAttempts} attempts`,
        );

        // TODO: Alerter l'admin
        await this.alertAdminPermanentFailure(email, error);
      } else {
        // Réessayer plus tard avec backoff exponentiel
        const delayMinutes = Math.pow(
          this.config.backoffMultiplier,
          newAttempts,
        );
        const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

        await prisma.emailQueue.update({
          where: { id: emailId },
          data: {
            status: EmailQueueStatus.PENDING,
            attempts: newAttempts,
            nextRetryAt,
            lastError: error.message,
            errorDetails: {
              message: error.message,
              stack: error.stack,
              timestamp: new Date().toISOString(),
            },
            updatedAt: new Date(),
          },
        });

        console.log(
          `⏰ [EmailQueueWorker] Email #${emailId} will retry at ${nextRetryAt.toISOString()} (in ${delayMinutes} minutes)`,
        );
      }
    }
  }

  /**
   * Nettoyer les emails bloqués en statut PROCESSING depuis trop longtemps
   */
  private async cleanStuckEmails(): Promise<void> {
    const threshold = new Date(Date.now() - this.config.stuckEmailThreshold);

    const stuckEmails = await prisma.emailQueue.findMany({
      where: {
        status: EmailQueueStatus.PROCESSING,
        updatedAt: {
          lt: threshold,
        },
      },
    });

    if (stuckEmails.length > 0) {
      console.warn(
        `⚠️ [EmailQueueWorker] Found ${stuckEmails.length} stuck emails, resetting to PENDING`,
      );

      for (const email of stuckEmails) {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: EmailQueueStatus.PENDING,
            lastError: "Email was stuck in PROCESSING state",
            updatedAt: new Date(),
          },
        });
      }
    }
  }

  /**
   * Alerter l'admin en cas d'échec permanent
   */
  private async alertAdminPermanentFailure(
    email: any,
    error: Error,
  ): Promise<void> {
    const alert = {
      level: "error",
      type: "email_permanent_failure",
      emailId: email.id,
      to: email.to,
      template: email.templateTitle,
      attempts: email.attempts,
      error: error.message,
      createdAt: email.createdAt,
    };

    console.error(
      "🚨 [ALERT] Email permanent failure:",
      JSON.stringify(alert, null, 2),
    );

    // Send alert notification to admin
    try {
      // Find system admin user (ID 1 is typically the main admin)
      const adminUserId = 1;

      await alertService.createAlert({
        utilisateurId: adminUserId,
        typeCode: AlertType.SYSTEM_ERROR,
        priority: "haute" as any,
        context: {
          emailId: email.id,
          recipient: email.to,
          template: email.templateTitle,
          attempts: email.attempts,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        notes: `Permanent email failure after ${email.attempts} attempts - Recipient: ${email.to}, Template: ${email.templateTitle}`,
      });

      console.log("✅ [EmailQueueWorker] Alert notification sent to admin");
    } catch (alertError) {
      console.error(
        "❌ [EmailQueueWorker] Failed to send alert notification:",
        alertError,
      );
    }
  }

  /**
   * Obtenir les statistiques du worker
   */
  getStats() {
    const uptime = this.stats.startedAt
      ? Date.now() - this.stats.startedAt.getTime()
      : 0;

    return {
      status: this.isRunning
        ? this.isPaused
          ? "paused"
          : "running"
        : "stopped",
      uptime: this.formatUptime(uptime),
      stats: {
        ...this.stats,
        currentBatchSize: this.currentBatch.length,
        successRate:
          this.stats.totalProcessed > 0
            ? (
                (this.stats.totalSucceeded / this.stats.totalProcessed) *
                100
              ).toFixed(2) + "%"
            : "0%",
      },
      config: this.config,
    };
  }

  /**
   * Obtenir l'état de la queue
   */
  async getQueueStatus() {
    const [pending, processing, completed, failed, total] = await Promise.all([
      prisma.emailQueue.count({ where: { status: EmailQueueStatus.PENDING } }),
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.PROCESSING },
      }),
      prisma.emailQueue.count({
        where: { status: EmailQueueStatus.COMPLETED },
      }),
      prisma.emailQueue.count({ where: { status: EmailQueueStatus.FAILED } }),
      prisma.emailQueue.count(),
    ]);

    // Emails bloqués
    const stuckThreshold = new Date(
      Date.now() - this.config.stuckEmailThreshold,
    );
    const stuck = await prisma.emailQueue.count({
      where: {
        status: EmailQueueStatus.PROCESSING,
        updatedAt: { lt: stuckThreshold },
      },
    });

    // Prochain email à traiter
    const nextEmail = await prisma.emailQueue.findFirst({
      where: {
        status: EmailQueueStatus.PENDING,
        attempts: { lt: this.config.maxAttempts },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        to: true,
        templateTitle: true,
        priority: true,
        attempts: true,
        nextRetryAt: true,
        createdAt: true,
      },
    });

    return {
      counts: {
        pending,
        processing,
        completed,
        failed,
        stuck,
        total,
      },
      nextEmail: nextEmail
        ? {
            ...nextEmail,
            readyAt: nextEmail.nextRetryAt || nextEmail.createdAt,
          }
        : null,
      health: {
        healthy: stuck === 0 && processing < 100,
        warnings: [
          ...(stuck > 0 ? [`${stuck} emails stuck`] : []),
          ...(processing > 50 ? [`High processing count: ${processing}`] : []),
          ...(pending > 1000 ? [`High pending count: ${pending}`] : []),
        ],
      },
    };
  }

  /**
   * Utilitaire : sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Formater le uptime
   */
  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}

// Instance singleton du worker
let workerInstance: EmailQueueWorker | null = null;

/**
 * Initialiser et démarrer le worker
 */
export async function startEmailQueueWorker(
  emailSender: (request: EmailSendRequest) => Promise<EmailSendResult>,
  config?: Partial<EmailQueueWorkerConfig>,
): Promise<EmailQueueWorker> {
  if (workerInstance) {
    console.warn("⚠️ Email queue worker already running");
    return workerInstance;
  }

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  workerInstance = new EmailQueueWorker(finalConfig, emailSender);

  // Démarrer en arrière-plan (ne pas await)
  workerInstance.start().catch((error) => {
    console.error("💀 Email queue worker crashed:", error);
    workerInstance = null;
  });

  return workerInstance;
}

/**
 * Arrêter le worker
 */
export async function stopEmailQueueWorker(): Promise<void> {
  if (!workerInstance) {
    console.warn("⚠️ No email queue worker running");
    return;
  }

  await workerInstance.stop();
  workerInstance = null;
}

/**
 * Obtenir l'instance du worker
 */
export function getEmailQueueWorker(): EmailQueueWorker | null {
  return workerInstance;
}
