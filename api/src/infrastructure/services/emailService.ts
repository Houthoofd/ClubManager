/**
 * Email Service - Wrapper de compatibilité
 *
 * Ce service sert de pont entre l'ancien code utilisant EmailService
 * et le nouveau EmailClient unifié.
 *
 * SYSTÈME UNIFIÉ :
 * - Utilise uniquement template-loader.ts (templates HTML depuis fichiers)
 * - Plus de templates en mémoire (emailTemplateService supprimé)
 * - Validation automatique des variables
 * - Retry et rate limiting intégrés
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
      templateTitle: options?.templateTitle,
      variables: stringVariables,
      utilisateurId: options?.utilisateurId,
      saveToDb: options?.saveToDb ?? true,
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
   * Envoie un email de réinitialisation de mot de passe
   */
  async envoyerEmailResetPassword(
    to: string,
    userName: string,
    resetToken: string,
    utilisateurId?: number,
  ): Promise<EmailSendResult> {
    return this.client.sendPasswordResetEmail(to, userName, resetToken, {
      variables: {
        expirationTime: "1 heure",
      },
    });
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
      saveToDb: options?.saveToDb ?? true,
    });
  }

  /**
   * Envoie un email de notification simple
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

      // Vérifier que le répertoire templates existe
      const templates = await this.client.listTemplates();
      if (templates.length === 0) {
        return {
          success: false,
          message: "Aucun template trouvé dans resources/templates/emails/",
        };
      }

      return {
        success: true,
        message: `Configuration email OK - ${templates.length} templates disponibles`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Liste tous les templates disponibles
   */
  async listerTemplates(): Promise<string[]> {
    return this.client.listTemplates();
  }

  /**
   * Preview d'un template (utile pour tests/debug)
   */
  async previewTemplate(
    templateName: string,
    variables: Record<string, string>,
  ): Promise<{
    subject: string;
    html: string;
    validation: {
      isValid: boolean;
      missingVariables: string[];
      unusedVariables: string[];
    };
  }> {
    return this.client.previewTemplate(templateName, variables);
  }

  /**
   * Vérifie si un template existe
   */
  async templateExists(templateName: string): Promise<boolean> {
    return this.client.templateExists(templateName);
  }
}

// Instance singleton pour compatibilité
export const emailService = new EmailService();

// Export par défaut pour compatibilité avec les imports
export default EmailService;
