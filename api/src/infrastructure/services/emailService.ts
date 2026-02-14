/**
 * Email Service - Wrapper de compatibilité
 *
 * Ce service sert de pont entre l'ancien code utilisant EmailService
 * et le nouveau EmailClient. Il délègue les appels vers EmailClient.
 */

import {
  emailClient,
  EmailClient,
} from "../external-services/email/email-client.js";
import type { EmailSendResult } from "@clubmanager/types";

export class EmailService {
  private client: EmailClient;

  constructor() {
    this.client = emailClient;
  }

  /**
   * Envoie un email simple (compatibilité)
   */
  async envoyerEmail(
    to: string,
    subject: string,
    message: string,
    options?: {
      templateId?: number;
      templateTitle?: string;
      variables?: Record<string, string | number>;
      utilisateurId?: number;
      saveToDb?: boolean;
    },
  ): Promise<EmailSendResult> {
    // Convertir toutes les variables en string
    const stringVariables = options?.variables
      ? Object.fromEntries(
          Object.entries(options.variables).map(([key, value]) => [
            key,
            String(value),
          ]),
        )
      : undefined;

    return this.client.sendEmail({
      to,
      subject,
      message,
      templateId: options?.templateId,
      templateTitle: options?.templateTitle,
      variables: stringVariables,
      utilisateurId: options?.utilisateurId,
      saveToDb: options?.saveToDb,
    });
  }

  /**
   * Envoie un email de bienvenue
   */
  async envoyerEmailBienvenue(
    user: any,
    options?: { variables?: Record<string, string> },
  ): Promise<EmailSendResult> {
    return this.client.sendWelcomeEmail(user, options);
  }

  /**
   * Envoie un email de promotion
   */
  async envoyerEmailPromotion(
    user: any,
    options?: {
      templateName?: string;
      variables?: Record<string, string>;
    },
  ): Promise<EmailSendResult> {
    return this.client.sendPromotionEmail(user, options);
  }

  /**
   * Envoie un email de confirmation de commande
   */
  async envoyerEmailConfirmationCommande(
    to: string,
    utilisateurId: number,
    variables: {
      userName: string;
      numeroCommande: string;
      dateCommande: string;
      statutCommande: string;
      nbArticles: number;
      totalCommande: string;
    },
  ): Promise<EmailSendResult> {
    // Convertir nbArticles en string pour le template
    const templateVariables = {
      ...variables,
      nbArticles: variables.nbArticles.toString(),
    };
    return this.client.sendOrderConfirmationEmail(
      to,
      utilisateurId,
      templateVariables,
    );
  }

  /**
   * Teste la configuration du service email
   */
  async testerConfiguration(): Promise<{ success: boolean; message?: string }> {
    try {
      // Test simple : vérifier que SendGrid est configuré
      if (!process.env.SENDGRID_API_KEY) {
        return {
          success: false,
          message: "SENDGRID_API_KEY non configurée",
        };
      }

      if (!process.env.SENDGRID_FROM_EMAIL) {
        return {
          success: false,
          message: "SENDGRID_FROM_EMAIL non configurée",
        };
      }

      return {
        success: true,
        message: "Configuration email OK",
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Envoie un email avec template personnalisé
   */
  async envoyerEmailAvecTemplate(
    to: string,
    templateTitle: string,
    variables: Record<string, string | number>,
    options?: {
      utilisateurId?: number;
      saveToDb?: boolean;
    },
  ): Promise<EmailSendResult> {
    // Convertir toutes les variables en string
    const stringVariables = Object.fromEntries(
      Object.entries(variables).map(([key, value]) => [key, String(value)]),
    );

    return this.client.sendEmail({
      to,
      subject: "", // Sera extrait du template
      message: "", // Sera extrait du template
      templateTitle,
      variables: stringVariables,
      utilisateurId: options?.utilisateurId,
      saveToDb: options?.saveToDb,
    });
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async envoyerEmailResetPassword(
    to: string,
    userName: string,
    resetLink: string,
    utilisateurId?: number,
  ): Promise<EmailSendResult> {
    return this.client.sendEmail({
      to,
      subject: "Réinitialisation de votre mot de passe",
      message: "",
      templateTitle: "reset-password",
      variables: {
        userName,
        resetLink,
        expirationTime: "24 heures",
      },
      utilisateurId,
      saveToDb: true,
    });
  }

  /**
   * Envoie un email de notification
   */
  async envoyerNotification(
    to: string,
    subject: string,
    message: string,
    utilisateurId?: number,
  ): Promise<EmailSendResult> {
    return this.client.sendEmail({
      to,
      subject,
      message,
      utilisateurId,
      saveToDb: true,
    });
  }
}

// Instance singleton pour compatibilité
export const emailService = new EmailService();

// Export par défaut pour compatibilité avec les imports
export default EmailService;
