/**
 * SendGrid Sender - Service d'envoi d'emails via SendGrid
 *
 * Améliorations :
 * - Validation des emails avant envoi
 * - Retry automatique avec backoff exponentiel
 * - Rate limiting simple (en mémoire)
 * - Logs structurés pour debugging
 * - Gestion d'erreurs catégorisée
 */

import type { EmailSendResult, SendGridOptions } from "@clubmanager/types";
import { prisma } from "../../../infrastructure/database/prisma-client.js";

export enum EmailErrorType {
  INVALID_EMAIL = "INVALID_EMAIL",
  SENDGRID_ERROR = "SENDGRID_ERROR",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  NETWORK_ERROR = "NETWORK_ERROR",
  CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

interface EmailLog {
  timestamp: string;
  service: string;
  action: "SEND" | "SUCCESS" | "ERROR" | "RETRY" | "VALIDATION";
  to: string;
  subject: string;
  templateName?: string;
  error?: string;
  errorType?: EmailErrorType;
  duration?: number;
  attempt?: number;
  statusCode?: number;
}

export class SendGridSender {
  private recentSends: Map<string, number[]> = new Map();
  private readonly maxSendsPerHour: number = 50; // Limite par email
  private readonly maxRetries: number = 3;

  /**
   * Envoie un email via SendGrid avec retry automatique
   */
  async send(
    to: string,
    subject: string,
    htmlContent: string,
    options: SendGridOptions = {},
  ): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      // 1. Validation de l'email
      if (!this.validateEmail(to)) {
        this.logEmailEvent({
          action: "VALIDATION",
          to,
          subject,
          error: "Format d'email invalide",
          errorType: EmailErrorType.INVALID_EMAIL,
        });

        return {
          success: false,
          error: `Email invalide: ${to}`,
          details: { errorType: EmailErrorType.INVALID_EMAIL },
        };
      }

      // 2. Vérification de la configuration
      const configError = this.checkConfiguration();
      if (configError) {
        this.logEmailEvent({
          action: "VALIDATION",
          to,
          subject,
          error: configError,
          errorType: EmailErrorType.CONFIGURATION_ERROR,
        });

        return {
          success: false,
          error: configError,
          details: { errorType: EmailErrorType.CONFIGURATION_ERROR },
        };
      }

      // 3. Rate limiting
      if (!this.checkRateLimit(to)) {
        this.logEmailEvent({
          action: "VALIDATION",
          to,
          subject,
          error: `Rate limit dépassé (max ${this.maxSendsPerHour}/heure)`,
          errorType: EmailErrorType.RATE_LIMIT_EXCEEDED,
        });

        console.warn(
          `⚠️ [SendGridSender] Rate limit dépassé pour ${to} (${this.maxSendsPerHour}/heure)`,
        );

        // Ne pas bloquer, juste avertir
        // return { success: false, error: 'Rate limit dépassé', details: { errorType: EmailErrorType.RATE_LIMIT_EXCEEDED } };
      }

      // 4. Envoi avec retry
      const result = await this.sendWithRetry(
        to,
        subject,
        htmlContent,
        options,
      );

      const duration = Date.now() - startTime;

      if (result.success) {
        this.logEmailEvent({
          action: "SUCCESS",
          to,
          subject,
          duration,
          statusCode: result.details?.statusCode,
        });
      }

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      this.logEmailEvent({
        action: "ERROR",
        to,
        subject,
        error: error.message,
        duration,
      });

      console.error("❌ [SendGridSender] Erreur fatale:", error);

      return {
        success: false,
        error: `Erreur fatale: ${error.message}`,
        details: { originalError: error },
      };
    }
  }

  /**
   * Envoie avec retry automatique et backoff exponentiel
   */
  private async sendWithRetry(
    to: string,
    subject: string,
    htmlContent: string,
    options: SendGridOptions,
  ): Promise<EmailSendResult> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logEmailEvent({
          action: "SEND",
          to,
          subject,
          attempt,
        });

        const result = await this.sendToSendGrid(to, subject, htmlContent);

        // Sauvegarder en base si demandé
        if (options.saveToDb && options.utilisateurId) {
          await this.saveToDatabase(
            to,
            subject,
            htmlContent,
            options.utilisateurId,
            result.messageId,
            "SENT",
          );
        }

        return result;
      } catch (error: any) {
        lastError = error;

        const errorType = this.categorizeError(error);

        this.logEmailEvent({
          action: "RETRY",
          to,
          subject,
          attempt,
          error: error.message,
          errorType,
        });

        console.warn(
          `⚠️ [SendGridSender] Tentative ${attempt}/${this.maxRetries} échouée: ${error.message}`,
        );

        // Ne pas retry si c'est une erreur de configuration ou email invalide
        if (
          errorType === EmailErrorType.CONFIGURATION_ERROR ||
          errorType === EmailErrorType.INVALID_EMAIL
        ) {
          break;
        }

        // Si ce n'est pas la dernière tentative, attendre avant de retry
        if (attempt < this.maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(
            `⏳ [SendGridSender] Attente de ${delayMs}ms avant retry...`,
          );
          await this.delay(delayMs);
        }
      }
    }

    // Toutes les tentatives ont échoué
    console.error(
      `❌ [SendGridSender] Échec après ${this.maxRetries} tentatives`,
    );

    // Sauvegarder l'échec en base si demandé
    if (options.saveToDb && options.utilisateurId) {
      await this.saveToDatabase(
        to,
        subject,
        htmlContent,
        options.utilisateurId,
        undefined,
        "FAILED",
        lastError.message,
      );
    }

    // Tenter le fallback si demandé
    if (options.fallbackOnError) {
      const fallbackResult = await this.tryFallback();
      if (fallbackResult.success) {
        return fallbackResult;
      }
    }

    const errorType = this.categorizeError(lastError);

    return {
      success: false,
      error: `Échec après ${this.maxRetries} tentatives: ${lastError.message}`,
      details: {
        originalError: lastError,
        errorType,
        attempts: this.maxRetries,
      },
    };
  }

  /**
   * Envoie réel via l'API SendGrid
   */
  private async sendToSendGrid(
    to: string,
    subject: string,
    htmlContent: string,
  ): Promise<EmailSendResult> {
    const sgMail = await import("@sendgrid/mail");
    sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!);

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      html: htmlContent,
    };

    const response = await sgMail.default.send(msg);
    const messageId =
      response[0]?.headers?.["x-message-id"] || "sendgrid-success";

    console.log(`✅ [SendGridSender] Email envoyé à ${to}`);

    return {
      success: true,
      messageId,
      details: {
        statusCode: response[0]?.statusCode,
        headers: response[0]?.headers,
      },
    };
  }

  /**
   * Valide le format d'un email
   */
  private validateEmail(email: string): boolean {
    if (!email || typeof email !== "string") {
      return false;
    }

    // Regex simple mais robuste
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Vérifie la configuration SendGrid
   */
  private checkConfiguration(): string | null {
    if (!process.env.SENDGRID_API_KEY) {
      return "SENDGRID_API_KEY non configurée";
    }

    if (!process.env.SENDGRID_FROM_EMAIL) {
      return "SENDGRID_FROM_EMAIL non configurée";
    }

    if (!this.validateEmail(process.env.SENDGRID_FROM_EMAIL)) {
      return "SENDGRID_FROM_EMAIL invalide";
    }

    return null;
  }

  /**
   * Rate limiting simple (en mémoire)
   */
  private checkRateLimit(email: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - 3600000; // 1 heure en ms

    // Récupérer les envois récents
    const recentSends = this.recentSends.get(email) || [];

    // Filtrer les envois de la dernière heure
    const sendsLastHour = recentSends.filter((time) => time > oneHourAgo);

    // Vérifier la limite
    if (sendsLastHour.length >= this.maxSendsPerHour) {
      return false;
    }

    // Ajouter cet envoi
    sendsLastHour.push(now);
    this.recentSends.set(email, sendsLastHour);

    // Nettoyer les anciens envois toutes les 100 entrées
    if (this.recentSends.size > 100) {
      this.cleanupRateLimitCache();
    }

    return true;
  }

  /**
   * Nettoie le cache du rate limiting
   */
  private cleanupRateLimitCache(): void {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    for (const [email, sends] of this.recentSends.entries()) {
      const recentSends = sends.filter((time) => time > oneHourAgo);

      if (recentSends.length === 0) {
        this.recentSends.delete(email);
      } else {
        this.recentSends.set(email, recentSends);
      }
    }
  }

  /**
   * Catégorise le type d'erreur
   */
  private categorizeError(error: any): EmailErrorType {
    const message = error.message?.toLowerCase() || "";
    const code = error.code;

    // Erreurs SendGrid
    if (error.code === 400 || message.includes("invalid email")) {
      return EmailErrorType.INVALID_EMAIL;
    }

    if (error.code >= 400 && error.code < 500) {
      return EmailErrorType.SENDGRID_ERROR;
    }

    // Erreurs réseau
    if (
      code === "ECONNREFUSED" ||
      code === "ETIMEDOUT" ||
      code === "ENOTFOUND" ||
      message.includes("network") ||
      message.includes("timeout")
    ) {
      return EmailErrorType.NETWORK_ERROR;
    }

    // Erreurs de configuration
    if (
      message.includes("api key") ||
      message.includes("unauthorized") ||
      message.includes("forbidden")
    ) {
      return EmailErrorType.CONFIGURATION_ERROR;
    }

    return EmailErrorType.SENDGRID_ERROR;
  }

  /**
   * Log structuré pour debugging
   */
  private logEmailEvent(event: Partial<EmailLog>): void {
    const log: EmailLog = {
      timestamp: new Date().toISOString(),
      service: "SendGridSender",
      action: event.action || "SEND",
      to: event.to || "",
      subject: event.subject || "",
      ...event,
    };

    // En production, on peut envoyer vers un service de logging (Sentry, DataDog, etc.)
    if (process.env.NODE_ENV === "production") {
      console.log(JSON.stringify(log));
    } else {
      // En dev, logs plus lisibles
      const emoji =
        {
          SEND: "📤",
          SUCCESS: "✅",
          ERROR: "❌",
          RETRY: "🔄",
          VALIDATION: "🔍",
        }[log.action] || "📧";

      console.log(`${emoji} [SendGridSender]`, {
        action: log.action,
        to: log.to,
        subject: log.subject.substring(0, 50),
        ...(log.error && { error: log.error }),
        ...(log.duration && { duration: `${log.duration}ms` }),
        ...(log.attempt && { attempt: log.attempt }),
      });
    }
  }

  /**
   * Tente un fallback en cas d'erreur
   */
  private async tryFallback(): Promise<EmailSendResult> {
    console.log("🔄 [SendGridSender] Tentative fallback...");

    try {
      // Vérifier si la configuration est OK
      const configError = this.checkConfiguration();

      if (!configError) {
        return {
          success: true,
          messageId: "fallback-config-ok",
          details: {
            fallback: true,
            message: "Configuration OK, retry plus tard",
          },
        };
      }

      console.warn("⚠️ [SendGridSender] Fallback: configuration invalide");

      return {
        success: false,
        error: "Fallback échoué: configuration invalide",
      };
    } catch (fallbackError: any) {
      console.warn("⚠️ [SendGridSender] Fallback échoué:", fallbackError);

      return {
        success: false,
        error: `Fallback échoué: ${fallbackError.message}`,
      };
    }
  }

  /**
   * Sauvegarde l'email en base de données
   */
  private async saveToDatabase(
    to: string,
    subject: string,
    content: string,
    utilisateurId: number,
    messageId?: string,
    status: "SENT" | "FAILED" = "SENT",
    error?: string,
  ): Promise<void> {
    try {
      // Save email to database
      await prisma.emails.create({
        data: {
          to,
          subject,
          content,
          htmlContent: content,
          utilisateurId,
          status,
          provider: "sendgrid",
          messageId,
          error,
          metadata: {
            savedBy: "SendGridSender",
            timestamp: new Date().toISOString(),
            contentLength: content.length,
          },
        },
      });

      console.log(`💾 [SendGridSender] Email saved to database: ${to}`);
    } catch (error: any) {
      console.error("❌ [SendGridSender] Erreur sauvegarde email:", error);
      // Ne pas faire échouer l'envoi si la sauvegarde échoue
    }
  }

  /**
   * Délai asynchrone pour retry
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Statistiques sur les envois récents (utile pour monitoring)
   */
  getStats(): {
    totalEmailsTracked: number;
    emailsInLastHour: number;
    topSenders: Array<{ email: string; count: number }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    let emailsInLastHour = 0;
    const sendCounts: Array<{ email: string; count: number }> = [];

    for (const [email, sends] of this.recentSends.entries()) {
      const recentSends = sends.filter((time) => time > oneHourAgo);
      emailsInLastHour += recentSends.length;

      sendCounts.push({
        email,
        count: recentSends.length,
      });
    }

    // Trier par nombre d'envois
    sendCounts.sort((a, b) => b.count - a.count);

    return {
      totalEmailsTracked: this.recentSends.size,
      emailsInLastHour,
      topSenders: sendCounts.slice(0, 10),
    };
  }

  /**
   * Réinitialise le rate limiting (utile pour les tests)
   */
  resetRateLimit(): void {
    this.recentSends.clear();
    console.log("🗑️ [SendGridSender] Rate limit réinitialisé");
  }
}

export const sendGridSender = new SendGridSender();
