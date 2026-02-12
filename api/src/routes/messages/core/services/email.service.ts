import { PrismaClient } from "@prisma/client";
import {
  captureException,
  addSentryBreadcrumb,
} from "../../../../shared/config/sentry.config.js";
// TODO: Ces services ont été refactorisés - utiliser EmailClient à la place
// import { EmailService } from "../../../../services/emailService.js";
// import { EmailTemplateService } from "../../../../services/emailTemplateService.js";
import { EmailClient } from "../../../../infrastructure/external-services/emailClient.js";

const prisma = new PrismaClient();

/**
 * Service pour la gestion des emails (migré vers Prisma + Sentry)
 *
 * Ce service encapsule la logique métier pour l'envoi d'emails,
 * la gestion des templates et la validation des emails.
 *
 * @class EmailsService
 */
export class EmailsService {
  private emailClient: EmailClient;

  constructor() {
    this.emailClient = new EmailClient();
  }

  /**
   * Envoyer un email de bienvenue
   *
   * @param {string} email - Adresse email du destinataire
   * @param {string} firstName - Prénom
   * @param {string} lastName - Nom
   * @param {string} userId - Identifiant utilisateur
   * @param {number} utilisateurId - ID utilisateur en base (optionnel)
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async sendWelcomeEmail(
    email: string,
    firstName: string,
    lastName: string,
    userId: string,
    utilisateurId?: number,
  ) {
    try {
      addSentryBreadcrumb(
        `Envoi email de bienvenue à: ${email}`,
        "email",
        "info",
        { email, firstName, lastName },
      );

      console.log("📧 [Email Service] Envoi email de bienvenue à:", email);

      // Utiliser le nouveau EmailClient
      const result = await this.emailClient.sendEmail({
        to: email,
        subject: "Bienvenue",
        message: "",
        templateTitle: "bienvenue",
        variables: {
          firstName,
          lastName,
          userId,
        },
        saveToDb: true,
        utilisateurId,
      });

      // Sauvegarder en base si utilisateurId fourni
      if (utilisateurId && result.success) {
        await prisma.messages_personnalises.create({
          data: {
            utilisateur_id: utilisateurId,
            contenu: `Email de bienvenue envoyé à ${email}`,
            status_envoi: "sent",
            sendgrid_message_id: result.messageId,
          },
        });

        console.log(
          "✅ [Email Service] Message de bienvenue enregistré en base",
        );
      }

      console.log(
        `✅ [Email Service] Email de bienvenue envoyé avec succès à ${email}`,
      );

      return {
        success: result.success,
        message: result.success
          ? "Email de bienvenue envoyé avec succès"
          : "Erreur lors de l'envoi de l'email de bienvenue",
        messageId: result.messageId,
        error: result.error,
        details: result.details,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur sendWelcomeEmail:", error);
      captureException(error as Error, {
        tags: { context: "sendWelcomeEmail" },
        extra: { email, firstName, lastName, utilisateurId },
      });
      throw new Error(
        `Erreur lors de l'envoi de l'email de bienvenue: ${error.message}`,
      );
    }
  }

  /**
   * Envoyer un email de validation
   *
   * @param {string} email - Adresse email du destinataire
   * @param {string} firstName - Prénom
   * @param {string} userId - Identifiant utilisateur
   * @param {number} utilisateurId - ID utilisateur en base (optionnel)
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async sendValidationEmail(
    email: string,
    firstName: string,
    userId: string,
    utilisateurId?: number,
  ) {
    try {
      addSentryBreadcrumb(
        `Envoi email de validation à: ${email}`,
        "email",
        "info",
        { email, firstName },
      );

      console.log("📧 [Email Service] Envoi email de validation à:", email);

      // Utiliser le nouveau EmailClient
      const result = await this.emailClient.sendEmail({
        to: email,
        subject: "Validation de votre email",
        message: "",
        templateTitle: "validation",
        variables: {
          firstName,
          userId,
        },
        saveToDb: true,
        utilisateurId,
      });

      // Sauvegarder en base si utilisateurId fourni
      if (utilisateurId && result.success) {
        await prisma.messages_personnalises.create({
          data: {
            utilisateur_id: utilisateurId,
            contenu: `Email de validation envoyé à ${email}`,
            status_envoi: "sent",
            sendgrid_message_id: result.messageId,
          },
        });

        console.log(
          "✅ [Email Service] Message de validation enregistré en base",
        );
      }

      console.log(
        `✅ [Email Service] Email de validation envoyé avec succès à ${email}`,
      );

      return {
        success: result.success,
        message: result.success
          ? "Email de validation envoyé avec succès"
          : "Erreur lors de l'envoi de l'email de validation",
        messageId: result.messageId,
        error: result.error,
        details: result.details,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur sendValidationEmail:", error);
      captureException(error as Error, {
        tags: { context: "sendValidationEmail" },
        extra: { email, firstName, utilisateurId },
      });
      throw new Error(
        `Erreur lors de l'envoi de l'email de validation: ${error.message}`,
      );
    }
  }

  /**
   * Récupérer l'userId par email
   *
   * @param {string} email - Adresse email
   * @returns {Promise<any>} Résultat de la récupération
   */
  async recoverUserId(email: string) {
    try {
      addSentryBreadcrumb(
        `Récupération userId pour: ${email}`,
        "email",
        "info",
        { email },
      );

      console.log("🔍 [Email Service] Récupération userId pour:", email);

      const utilisateur = await prisma.utilisateurs.findFirst({
        where: { email },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
        },
      });

      if (!utilisateur) {
        console.log("⚠️ [Email Service] Utilisateur non trouvé:", email);
        return {
          success: false,
          message: "Utilisateur non trouvé",
          userId: undefined,
        };
      }

      console.log("✅ [Email Service] Utilisateur trouvé, ID:", utilisateur.id);

      return {
        success: true,
        message: "Utilisateur trouvé",
        userId: utilisateur.id,
        data: utilisateur,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur recoverUserId:", error);
      captureException(error as Error, {
        tags: { context: "recoverUserId" },
        extra: { email },
      });
      throw new Error(
        `Erreur lors de la récupération de l'userId: ${error.message}`,
      );
    }
  }

  /**
   * Confirmer un email via token
   *
   * @param {string} token - Token de validation
   * @returns {Promise<any>} Résultat de la confirmation
   */
  async confirmEmail(token: string) {
    try {
      addSentryBreadcrumb("Confirmation email avec token", "email", "info", {
        tokenLength: token.length,
      });

      console.log("✅ [Email Service] Confirmation email avec token");

      // Chercher le token dans la table email_validation_tokens
      const validationToken = await prisma.email_validation_tokens.findUnique({
        where: { token },
      });

      if (!validationToken) {
        console.log("⚠️ [Email Service] Token non trouvé");
        return {
          success: false,
          message: "Token invalide ou expiré",
          data: null,
        };
      }

      // Vérifier si le token est expiré
      if (validationToken.expires_at < new Date()) {
        console.log("⚠️ [Email Service] Token expiré");
        return {
          success: false,
          message: "Token expiré",
          data: null,
        };
      }

      // Vérifier si le token a déjà été utilisé
      if (validationToken.used) {
        console.log("⚠️ [Email Service] Token déjà utilisé");
        return {
          success: false,
          message: "Token déjà utilisé",
          data: null,
        };
      }

      // Marquer le token comme utilisé
      await prisma.email_validation_tokens.update({
        where: { id: validationToken.id },
        data: {
          used: true,
        },
      });

      // Marquer l'email comme vérifié si besoin
      // Récupérer l'utilisateur pour vérifier email_verified
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: validationToken.utilisateur_id },
        select: { email_verified: true, email: true },
      });

      if (utilisateur && !utilisateur.email_verified) {
        await prisma.utilisateurs.update({
          where: { id: validationToken.utilisateur_id },
          data: {
            email_verified: true,
            email_verified_at: new Date(),
          },
        });
      }

      console.log(
        "✅ [Email Service] Email confirmé avec succès pour utilisateur:",
        validationToken.utilisateur_id,
      );

      return {
        success: true,
        message: "Email confirmé avec succès",
        data: {
          utilisateur_id: validationToken.utilisateur_id,
          email: utilisateur?.email || "",
        },
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur confirmEmail:", error);
      captureException(error as Error, {
        tags: { context: "confirmEmail" },
        extra: { tokenLength: token.length },
      });
      throw new Error(
        `Erreur lors de la confirmation de l'email: ${error.message}`,
      );
    }
  }

  /**
   * Envoyer un email personnalisé
   *
   * @param {any} params - Paramètres de l'email
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async sendCustomEmail(params: {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    cc?: string;
    bcc?: string;
    saveToDb?: boolean;
    utilisateurId?: number;
    type_message?: string;
  }) {
    try {
      const {
        to,
        subject,
        html = "",
        text = "",
        cc,
        bcc,
        saveToDb = true,
        utilisateurId,
        type_message = "custom_email",
      } = params;

      addSentryBreadcrumb(
        `Envoi email personnalisé à: ${to}`,
        "email",
        "info",
        { to, subject, type_message },
      );

      console.log("📧 [Email Service] Envoi email personnalisé à:", to);

      let dbMessageId: number | undefined;

      // Sauvegarder en base si demandé
      if (saveToDb && utilisateurId) {
        const message = await prisma.messages_personnalises.create({
          data: {
            utilisateur_id: utilisateurId,
            contenu: html || text,
            status_envoi: "pending",
          },
        });
        dbMessageId = message.id;
        console.log(
          "📝 [Email Service] Message enregistré en base, ID:",
          dbMessageId,
        );
      }

      // Envoyer l'email avec le nouveau EmailClient
      const emailResult = await this.emailClient.sendEmail({
        to,
        subject,
        message: html || text || "",
        saveToDb,
        utilisateurId,
      });

      // Mettre à jour le statut en base si sauvegardé
      if (saveToDb && dbMessageId) {
        await prisma.messages_personnalises.update({
          where: { id: dbMessageId },
          data: {
            status_envoi: emailResult.success ? "sent" : "failed",
            sendgrid_message_id: emailResult.messageId,
            error_details: emailResult.error,
          },
        });
        console.log(
          `✅ [Email Service] Statut du message mis à jour: ${emailResult.success ? "sent" : "failed"}`,
        );
      }

      console.log(
        `✅ [Email Service] Email personnalisé ${emailResult.success ? "envoyé" : "échoué"}`,
      );

      return {
        success: emailResult.success,
        message: emailResult.success
          ? "Email personnalisé envoyé avec succès"
          : "Erreur lors de l'envoi de l'email personnalisé",
        messageId: emailResult.messageId,
        error: emailResult.error,
        details: emailResult.details,
        dbMessageId,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur sendCustomEmail:", error);
      captureException(error as Error, {
        tags: { context: "sendCustomEmail" },
        extra: { to: params.to, subject: params.subject },
      });
      throw new Error(
        `Erreur lors de l'envoi de l'email personnalisé: ${error.message}`,
      );
    }
  }

  /**
   * Envoyer un email de test
   *
   * @param {string} email - Adresse email de test
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async sendTestEmail(email: string) {
    try {
      addSentryBreadcrumb(`Envoi email de test à: ${email}`, "email", "info", {
        email,
      });

      console.log("🧪 [Email Service] Envoi email de test à:", email);

      const result = await this.emailClient.sendEmail({
        to: email,
        subject: "Test Email - Club Manager",
        message: "<h1>Test Email</h1><p>Ceci est un email de test.</p>",
      });

      console.log(
        `✅ [Email Service] Email de test ${result.success ? "envoyé" : "échoué"}`,
      );

      return {
        success: result.success,
        message: result.success
          ? "Email de test envoyé"
          : "Erreur lors de l'envoi",
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur sendTestEmail:", error);
      captureException(error as Error, {
        tags: { context: "sendTestEmail" },
        extra: { email },
      });
      throw new Error(
        `Erreur lors de l'envoi de l'email de test: ${error.message}`,
      );
    }
  }

  /**
   * Obtenir tous les templates disponibles
   *
   * @returns {Promise<any>} Liste des templates
   */
  async getAllTemplates() {
    try {
      addSentryBreadcrumb(
        "Récupération de tous les templates",
        "email",
        "info",
      );

      console.log("📋 [Email Service] Récupération de tous les templates");

      // TODO: Implémenter avec le nouveau système de templates
      const templates: any[] = [];

      console.log(`✅ [Email Service] ${templates.length} templates récupérés`);

      return {
        success: true,
        message: "Templates récupérés avec succès (TODO: nouveau système)",
        templates,
        count: templates.length,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur getAllTemplates:", error);
      captureException(error as Error, {
        tags: { context: "getAllTemplates" },
      });
      throw new Error(
        `Erreur lors de la récupération des templates: ${error.message}`,
      );
    }
  }

  /**
   * Envoyer un email avec un template
   *
   * @param {any} params - Paramètres de l'envoi
   * @returns {Promise<any>} Résultat de l'envoi
   */
  async sendTemplateEmail(params: {
    templateTitle: string;
    to: string;
    variables?: Record<string, any>;
    saveToDb?: boolean;
    utilisateurId?: number;
  }) {
    try {
      const {
        templateTitle,
        to,
        variables = {},
        saveToDb = true,
        utilisateurId,
      } = params;

      addSentryBreadcrumb(
        `Envoi email avec template: ${templateTitle}`,
        "email",
        "info",
        { templateTitle, to },
      );

      console.log(
        "📧 [Email Service] Envoi email avec template:",
        templateTitle,
        "à:",
        to,
      );

      let dbMessageId: number | undefined;

      // Sauvegarder en base si demandé
      if (saveToDb && utilisateurId) {
        const message = await prisma.messages_personnalises.create({
          data: {
            utilisateur_id: utilisateurId,
            contenu: `Email avec template: ${templateTitle}`,
            status_envoi: "pending",
          },
        });
        dbMessageId = message.id;
        console.log(
          "📝 [Email Service] Message template enregistré en base, ID:",
          dbMessageId,
        );
      }

      // Envoyer l'email avec template
      const emailResult = await this.emailClient.sendEmail({
        to,
        subject: templateTitle,
        message: "",
        templateTitle,
        variables,
        saveToDb,
        utilisateurId,
      });

      // Mettre à jour le statut en base si sauvegardé
      if (saveToDb && dbMessageId) {
        await prisma.messages_personnalises.update({
          where: { id: dbMessageId },
          data: {
            status_envoi: emailResult.success ? "sent" : "failed",
            sendgrid_message_id: emailResult.messageId,
            error_details: emailResult.error,
          },
        });
        console.log(
          `✅ [Email Service] Statut du message template mis à jour: ${emailResult.success ? "sent" : "failed"}`,
        );
      }

      console.log(
        `✅ [Email Service] Email template ${emailResult.success ? "envoyé" : "échoué"}`,
      );

      return {
        success: emailResult.success,
        message: emailResult.success
          ? "Email avec template envoyé avec succès"
          : "Erreur lors de l'envoi de l'email avec template",
        messageId: emailResult.messageId,
        error: emailResult.error,
        details: emailResult.details,
        dbMessageId,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur sendTemplateEmail:", error);
      captureException(error as Error, {
        tags: { context: "sendTemplateEmail" },
        extra: { templateTitle: params.templateTitle, to: params.to },
      });
      throw new Error(
        `Erreur lors de l'envoi de l'email avec template: ${error.message}`,
      );
    }
  }

  /**
   * Obtenir l'historique des messages d'un utilisateur
   *
   * @param {number} utilisateurId - ID de l'utilisateur
   * @param {number} limit - Limite de résultats
   * @returns {Promise<any>} Historique des messages
   */
  async getMessageHistory(utilisateurId: number, limit: number = 100) {
    try {
      addSentryBreadcrumb(
        `Récupération historique pour utilisateur: ${utilisateurId}`,
        "email",
        "info",
        { utilisateurId, limit },
      );

      console.log(
        "📚 [Email Service] Récupération historique pour utilisateur:",
        utilisateurId,
      );

      const messages = await prisma.messages_personnalises.findMany({
        where: {
          utilisateur_id: utilisateurId,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
      });

      console.log(
        `✅ [Email Service] ${messages.length} messages récupérés pour l'utilisateur ${utilisateurId}`,
      );

      return {
        success: true,
        message: "Historique récupéré avec succès",
        data: messages,
        count: messages.length,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur getMessageHistory:", error);
      captureException(error as Error, {
        tags: { context: "getMessageHistory" },
        extra: { utilisateurId, limit },
      });
      throw new Error(
        `Erreur lors de la récupération de l'historique: ${error.message}`,
      );
    }
  }

  /**
   * Obtenir les statistiques d'emails d'un utilisateur
   *
   * @param {number} utilisateurId - ID de l'utilisateur
   * @param {number} limit - Limite de résultats
   * @returns {Promise<any>} Statistiques des emails
   */
  async getEmailStats(utilisateurId: number, limit: number = 1000) {
    try {
      addSentryBreadcrumb(
        `Récupération statistiques pour utilisateur: ${utilisateurId}`,
        "email",
        "info",
        { utilisateurId, limit },
      );

      console.log(
        "📊 [Email Service] Récupération statistiques pour utilisateur:",
        utilisateurId,
      );

      const messages = await prisma.messages_personnalises.findMany({
        where: {
          utilisateur_id: utilisateurId,
        },
        orderBy: {
          created_at: "desc",
        },
        take: limit,
      });

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const stats = {
        total: messages.length,
        sent: messages.filter((m) => m.status_envoi === "sent").length,
        failed: messages.filter((m) => m.status_envoi === "failed").length,
        pending: messages.filter((m) => m.status_envoi === "pending").length,
        types: {},
        lastWeek: messages.filter((m) => m.created_at > weekAgo).length,
      };

      console.log("✅ [Email Service] Statistiques calculées:", stats);

      return {
        success: true,
        message: "Statistiques récupérées avec succès",
        stats,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur getEmailStats:", error);
      captureException(error as Error, {
        tags: { context: "getEmailStats" },
        extra: { utilisateurId, limit },
      });
      throw new Error(
        `Erreur lors de la récupération des statistiques: ${error.message}`,
      );
    }
  }

  /**
   * Nettoyer les tokens expirés
   *
   * @returns {Promise<any>} Résultat du nettoyage
   */
  async cleanupExpiredTokens() {
    try {
      addSentryBreadcrumb("Nettoyage des tokens expirés", "email", "info");

      console.log("🧹 [Email Service] Nettoyage des tokens expirés");

      const result = await prisma.email_validation_tokens.deleteMany({
        where: {
          OR: [
            {
              expires_at: {
                lt: new Date(),
              },
            },
            {
              used: true,
            },
          ],
        },
      });

      const deletedCount = result.count;

      console.log(`🗑️ [Email Service] ${deletedCount} tokens supprimés`);

      return {
        success: true,
        message: `${deletedCount} tokens expirés supprimés`,
        deleted_count: deletedCount,
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur cleanupExpiredTokens:", error);
      captureException(error as Error, {
        tags: { context: "cleanupExpiredTokens" },
      });
      throw new Error(`Erreur lors du nettoyage des tokens: ${error.message}`);
    }
  }

  /**
   * Tester la configuration email
   *
   * @returns {Promise<any>} Résultat du test
   */
  async testConfiguration() {
    try {
      addSentryBreadcrumb("Test de la configuration email", "email", "info");

      console.log("🔧 [Email Service] Test de la configuration email");

      // Tester avec un email simple
      const result = await this.emailClient.sendEmail({
        to: "test@clubmanager.com",
        subject: "Test Configuration",
        message: "Test de configuration",
      });

      console.log(
        `✅ [Email Service] Configuration ${result.success ? "valide" : "invalide"}`,
      );

      return {
        success: result.success,
        message: result.success
          ? "Configuration valide"
          : "Configuration invalide",
      };
    } catch (error: any) {
      console.error("❌ [Email Service] Erreur testConfiguration:", error);
      captureException(error as Error, {
        tags: { context: "testConfiguration" },
      });
      throw new Error(`Erreur lors du test de configuration: ${error.message}`);
    }
  }
}

// Export d'une instance singleton
export const emailsService = new EmailsService();
