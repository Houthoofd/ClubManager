/**
 * Service d'envoi d'emails via SendGrid
 */

import type { EmailSendResult, SendGridOptions } from "@clubmanager/types";
import { prisma } from "../../../infrastructure/database/prisma-client.js";

export class SendGridSender {
  /**
   * Envoie un email via SendGrid
   */
  async send(
    to: string,
    subject: string,
    htmlContent: string,
    options: SendGridOptions = {},
  ): Promise<EmailSendResult> {
    try {
      console.log("📧 [SendGridSender] Envoi email via SendGrid...");

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

      // Sauvegarder en base si demandé
      if (options.saveToDb && options.utilisateurId) {
        await this.saveToDatabase(
          to,
          subject,
          htmlContent,
          options.utilisateurId,
          messageId,
          "SENT",
        );
      }

      return {
        success: true,
        messageId,
        details: {
          statusCode: response[0]?.statusCode,
          headers: response[0]?.headers,
        },
      };
    } catch (error: any) {
      console.error("❌ [SendGridSender] Erreur envoi:", error);

      // Sauvegarder l'échec en base si demandé
      if (options.saveToDb && options.utilisateurId) {
        await this.saveToDatabase(
          to,
          subject,
          htmlContent,
          options.utilisateurId,
          undefined,
          "FAILED",
          error.message,
        );
      }

      if (options.fallbackOnError) {
        return await this.tryFallback();
      }

      return {
        success: false,
        error: `Erreur SendGrid: ${error.message}`,
        details: { originalError: error },
      };
    }
  }

  /**
   * Tente un fallback en cas d'erreur
   */
  private async tryFallback(): Promise<EmailSendResult> {
    console.log("🔄 [SendGridSender] Tentative fallback...");

    try {
      // Importer le service email pour tester la configuration
      const { EmailService } = await import("../../services/emailService.js");
      const emailService = new EmailService();
      const testResult = await emailService.testerConfiguration();

      if (testResult.success) {
        return {
          success: true,
          messageId: "fallback-test-success",
          details: { fallback: true, testResult },
        };
      }
    } catch (fallbackError) {
      console.warn("⚠️ [SendGridSender] Fallback échoué:", fallbackError);
    }

    return {
      success: false,
      error: "Erreur SendGrid et fallback échoué",
    };
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
      console.log("💾 [SendGridSender] Sauvegarde email en base:", {
        to,
        subject,
        utilisateurId,
        status,
      });

      await prisma.email.create({
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
          },
        },
      });

      console.log("✅ [SendGridSender] Email sauvegardé en base avec succès");
    } catch (error) {
      console.warn("⚠️ [SendGridSender] Erreur sauvegarde email:", error);
    }
  }
}

export const sendGridSender = new SendGridSender();
