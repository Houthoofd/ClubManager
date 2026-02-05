import { EmailService } from "../../../../services/emailService.js";
import { EmailTemplateService } from "../../../../services/emailTemplateService.js";
import { messageClient } from "../../../../db/clients/messages/messageClient.js";

/**
 * Service pour la gestion des emails
 *
 * Ce service encapsule la logique métier pour l'envoi d'emails,
 * la gestion des templates et la validation des emails.
 *
 * @class EmailsService
 */
export class EmailsService {
  private emailService: EmailService;
  private templateService: EmailTemplateService;

  constructor() {
    this.emailService = new EmailService();
    this.templateService = new EmailTemplateService();
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
      console.log("📧 [EmailsService] Envoi email de bienvenue à:", email);

      const result = await this.emailService.envoyerEmailBienvenue(
        email,
        firstName,
        lastName,
        userId,
      );

      // Sauvegarder en base si utilisateurId fourni
      if (utilisateurId && result.success) {
        await messageClient.saveMessageToDatabase({
          utilisateur_id: utilisateurId,
          type_message: "welcome_email",
          contenu: `Email de bienvenue envoyé à ${email}`,
          status_envoi: "sent",
          email_recipient: email,
        });
      }

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
      console.error("❌ [EmailsService] Erreur sendWelcomeEmail:", error);
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
      console.log("📧 [EmailsService] Envoi email de validation à:", email);

      const result = await this.emailService.envoyerEmailBienvenue(
        email,
        firstName,
        "",
        userId,
      );

      // Sauvegarder en base si utilisateurId fourni
      if (utilisateurId && result.success) {
        await messageClient.saveMessageToDatabase({
          utilisateur_id: utilisateurId,
          type_message: "validation_email",
          contenu: `Email de validation envoyé à ${email}`,
          status_envoi: "sent",
          email_recipient: email,
        });
      }

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
      console.error("❌ [EmailsService] Erreur sendValidationEmail:", error);
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
      console.log("🔍 [EmailsService] Récupération userId pour:", email);

      // Fonction de récupération d'userId à implémenter selon votre logique
      return {
        success: false,
        message: "Fonction non implémentée",
        userId: undefined,
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur recoverUserId:", error);
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
      console.log("✅ [EmailsService] Confirmation email avec token:", token);

      // Fonction de confirmation d'email à implémenter selon votre logique
      return {
        success: false,
        message: "Fonction non implémentée",
        data: null,
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur confirmEmail:", error);
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

      console.log("📧 [EmailsService] Envoi email personnalisé à:", to);

      let dbMessageId: number | undefined;

      // Sauvegarder en base si demandé
      if (saveToDb && utilisateurId) {
        dbMessageId = await messageClient.saveMessageToDatabase({
          utilisateur_id: utilisateurId,
          type_message,
          contenu: html || text,
          status_envoi: "pending",
          email_recipient: to,
        });
      }

      // Envoyer l'email
      const emailResult = await this.emailService.envoyerEmailPersonnalise({
        to,
        subject,
        html: html || "",
        text: text || "",
        cc,
        bcc,
      });

      // Mettre à jour le statut en base si sauvegardé
      if (saveToDb && dbMessageId) {
        await messageClient.updateMessageStatus(
          dbMessageId,
          emailResult.success ? "sent" : "failed",
          emailResult.messageId,
          emailResult.error,
        );
      }

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
      console.error("❌ [EmailsService] Erreur sendCustomEmail:", error);
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
      console.log("🧪 [EmailsService] Envoi email de test à:", email);

      const result = await this.emailService.envoyerEmailTest(email);

      return {
        success: result.success,
        message: result.success
          ? "Email de test envoyé"
          : "Erreur lors de l'envoi",
        messageId: result.messageId,
        error: result.error,
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur sendTestEmail:", error);
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
      console.log("📋 [EmailsService] Récupération de tous les templates");

      const templates = await this.templateService.getAllTemplates();

      return {
        success: true,
        message: "Templates récupérés avec succès",
        templates,
        count: templates.length,
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur getAllTemplates:", error);
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

      console.log(
        "📧 [EmailsService] Envoi email avec template:",
        templateTitle,
        "à:",
        to,
      );

      // Récupérer le template
      const template =
        await this.templateService.getTemplateByTitle(templateTitle);

      if (!template) {
        return {
          success: false,
          message: "Template non trouvé",
        };
      }

      // Traiter le template avec les variables
      const processedTemplate = this.templateService.processTemplate(
        template.content,
        variables,
      );

      let dbMessageId: number | undefined;

      // Sauvegarder en base si demandé
      if (saveToDb && utilisateurId) {
        dbMessageId = await messageClient.saveMessageToDatabase({
          utilisateur_id: utilisateurId,
          type_message: "template_email",
          contenu: processedTemplate.html,
          status_envoi: "pending",
          email_recipient: to,
        });
      }

      // Envoyer l'email
      const emailResult = await this.emailService.envoyerEmailPersonnalise({
        to,
        subject: processedTemplate.subject,
        html: processedTemplate.html,
        text: processedTemplate.text,
      });

      // Mettre à jour le statut en base si sauvegardé
      if (saveToDb && dbMessageId) {
        await messageClient.updateMessageStatus(
          dbMessageId,
          emailResult.success ? "sent" : "failed",
          emailResult.messageId,
          emailResult.error,
        );
      }

      return {
        success: emailResult.success,
        message: emailResult.success
          ? "Email avec template envoyé avec succès"
          : "Erreur lors de l'envoi de l'email avec template",
        messageId: emailResult.messageId,
        error: emailResult.error,
        details: emailResult.details,
        dbMessageId,
        template: {
          title: template.title,
          processed: processedTemplate,
        },
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur sendTemplateEmail:", error);
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
      console.log(
        "📚 [EmailsService] Récupération historique pour utilisateur:",
        utilisateurId,
      );

      const messages = await messageClient.getMessageHistory(
        utilisateurId,
        limit,
      );

      return {
        success: true,
        message: "Historique récupéré avec succès",
        data: messages,
        count: messages.length,
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur getMessageHistory:", error);
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
      console.log(
        "📊 [EmailsService] Récupération statistiques pour utilisateur:",
        utilisateurId,
      );

      const messages = await messageClient.getMessageHistory(
        utilisateurId,
        limit,
      );

      const stats = {
        total: messages.length,
        sent: messages.filter((m) => m.status_envoi === "sent").length,
        failed: messages.filter((m) => m.status_envoi === "failed").length,
        pending: messages.filter((m) => m.status_envoi === "pending").length,
        types: messages.reduce((acc: any, m: any) => {
          acc[m.type_message] = (acc[m.type_message] || 0) + 1;
          return acc;
        }, {}),
        lastWeek: messages.filter((m) => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(m.date_creation) > weekAgo;
        }).length,
      };

      return {
        success: true,
        message: "Statistiques récupérées avec succès",
        stats,
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur getEmailStats:", error);
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
      console.log("🧹 [EmailsService] Nettoyage des tokens expirés");

      const MysqlConnector = (
        await import("../../../../db/connector/mysqlconnector.js")
      ).default;
      const mysqlConnector = MysqlConnector.getInstance();

      const deletedCount = await new Promise<number>((resolve, reject) => {
        const sql = `
          DELETE FROM email_validation_tokens
          WHERE expires_at < NOW() OR used = TRUE
        `;

        mysqlConnector.query(sql, [], (error: any, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows || 0);
          }
        });
      });

      console.log(`🗑️ [EmailsService] ${deletedCount} tokens supprimés`);

      return {
        success: true,
        message: `${deletedCount} tokens expirés supprimés`,
        deleted_count: deletedCount,
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur cleanupExpiredTokens:", error);
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
      console.log("🔧 [EmailsService] Test de la configuration email");

      const result = await this.emailService.testerConfiguration();

      return {
        success: result.success,
        message: result.success
          ? "Configuration valide"
          : "Configuration invalide",
      };
    } catch (error: any) {
      console.error("❌ [EmailsService] Erreur testConfiguration:", error);
      throw new Error(`Erreur lors du test de configuration: ${error.message}`);
    }
  }
}

// Export d'une instance singleton
export const emailsService = new EmailsService();
