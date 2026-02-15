/**
 * Email Client - Façade unifiée pour tous les envois d'emails
 *
 * Système unifié v2.1 :
 * - Utilise uniquement template-loader.ts (plus de emailTemplateService)
 * - Templates HTML depuis resources/templates/emails/
 * - Validation automatique des variables
 * - Retry et rate limiting via sendgrid-sender
 * - Fallbacks HTML inline pour les cas critiques
 * - Fluent API via EmailBuilder
 * - Méthodes raccourcies pour emails courants
 * - Support sendBulk pour envois multiples
 * - Mode dry-run pour tests
 */

import type {
  EmailSendRequest,
  EmailSendResult,
  PromotionEmailOptions,
  OrderConfirmationVariables,
  BulkEmailRequest,
  BulkEmailResult,
  TemplateName,
} from "@clubmanager/types";

import { templateLoader } from "./template-loader.js";
import { variablesPreparator } from "./variables-preparator.js";
import { sendGridSender } from "./sendgrid-sender.js";
import { createEmailBuilder, EmailBuilder } from "./email-builder.js";

export class EmailClient {
  /**
   * Envoie un email simple (avec ou sans template)
   */
  async sendEmail(request: EmailSendRequest): Promise<EmailSendResult> {
    try {
      console.log("📧 [EmailClient] Envoi email:", {
        to: request.to,
        subject: request.subject,
        hasTemplate: !!request.templateId || !!request.templateTitle,
      });

      let finalSubject = request.subject;
      let finalMessage = request.message;

      // Si un template est spécifié, le charger
      if (request.templateTitle) {
        try {
          const { subject, htmlContent } = await templateLoader.loadTemplate(
            request.templateTitle,
            request.variables || {},
            request.subject,
          );

          finalSubject = subject || finalSubject;
          finalMessage = htmlContent;

          console.log(
            `✅ [EmailClient] Template "${request.templateTitle}" chargé`,
          );
        } catch (templateError: any) {
          console.warn(
            `⚠️ [EmailClient] Template "${request.templateTitle}" non trouvé:`,
            templateError.message,
          );

          // Utiliser le message fourni comme fallback
          if (!finalMessage) {
            finalMessage = this.createFallbackHtml(
              request.subject || "Message",
              request.message || "Aucun contenu disponible",
            );
          }
        }
      }

      // Validation finale
      if (!finalSubject) {
        finalSubject = "Message de Club Manager";
      }

      if (!finalMessage) {
        finalMessage = this.createFallbackHtml(
          finalSubject,
          request.message || "Message vide",
        );
      }

      return await sendGridSender.send(request.to, finalSubject, finalMessage, {
        fallbackOnError: true,
        saveToDb: request.saveToDb,
        utilisateurId: request.utilisateurId,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur envoi email:", error);
      return {
        success: false,
        error: error.message,
        details: { originalError: error },
      };
    }
  }

  /**
   * Envoie un email de promotion
   */
  async sendPromotionEmail(
    user: any,
    options?: PromotionEmailOptions,
  ): Promise<EmailSendResult> {
    try {
      console.log(
        `📧 [EmailClient] Envoi email de promotion à ${user.email} (ID: ${user.id})`,
      );

      const templateName = options?.templateName || "promotion-professeur";
      const variables = variablesPreparator.preparePromotionVariables(
        user,
        options?.variables,
      );

      const { subject, htmlContent } = await templateLoader.loadTemplate(
        templateName,
        variables,
        `Promotion - ${variables.userName}`,
      );

      return await sendGridSender.send(user.email, subject, htmlContent, {
        fallbackOnError: true,
        saveToDb: true,
        utilisateurId: user.id,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur email promotion:", error);

      // Fallback simple
      const fallbackHtml = this.createPromotionFallbackHtml(user);

      return await sendGridSender.send(
        user.email,
        `Promotion - ${user.first_name} ${user.last_name}`,
        fallbackHtml,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId: user.id,
        },
      );
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(
    user: any,
    options?: { variables?: Record<string, string> },
  ): Promise<EmailSendResult> {
    try {
      console.log(`📧 [EmailClient] Envoi email de bienvenue à ${user.email}`);

      const variables = variablesPreparator.prepareWelcomeVariables(
        user,
        options?.variables,
      );

      const { subject, htmlContent } = await templateLoader.loadTemplate(
        "bienvenue",
        variables,
        `Bienvenue ${variables.userName} !`,
      );

      return await sendGridSender.send(user.email, subject, htmlContent, {
        fallbackOnError: true,
        saveToDb: true,
        utilisateurId: user.id,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur email bienvenue:", error);

      // Fallback simple
      const fallbackHtml = this.createWelcomeFallbackHtml(user);

      return await sendGridSender.send(
        user.email,
        `Bienvenue ${user.first_name} - Club Manager`,
        fallbackHtml,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId: user.id,
        },
      );
    }
  }

  /**
   * Envoie un email de confirmation de commande
   */
  async sendOrderConfirmationEmail(
    to: string,
    utilisateurId: number,
    variables: OrderConfirmationVariables,
  ): Promise<EmailSendResult> {
    try {
      console.log(`📧 [EmailClient] Envoi confirmation commande à ${to}`);

      const emailVariables = variablesPreparator.prepareOrderVariables(
        variables.userName,
        variables.numeroCommande,
        {
          dateCommande: variables.dateCommande,
          statutCommande: variables.statutCommande,
          nbArticles: variables.nbArticles,
          totalCommande: variables.totalCommande,
        },
      );

      const { subject, htmlContent } = await templateLoader.loadTemplate(
        "confirmation-commande",
        emailVariables,
        `Confirmation de commande ${variables.numeroCommande}`,
      );

      return await sendGridSender.send(to, subject, htmlContent, {
        fallbackOnError: true,
        saveToDb: true,
        utilisateurId,
      });
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur confirmation commande:", error);

      // Fallback simple
      const fallbackHtml = this.createOrderConfirmationFallbackHtml(variables);

      return await sendGridSender.send(
        to,
        `Commande confirmée ${variables.numeroCommande} - Club Manager`,
        fallbackHtml,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId,
        },
      );
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    email: string,
    prenom: string,
    token: string,
    options?: { variables?: Record<string, string> },
  ): Promise<EmailSendResult> {
    try {
      console.log(
        `📧 [EmailClient] Envoi email de réinitialisation à ${email}`,
      );

      // URL de réinitialisation
      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

      const variables = {
        userName: prenom,
        resetUrl,
        resetToken: token,
        expiresIn: "1 heure",
        clubName: process.env.CLUB_NAME || "Club Manager",
        clubWebsite: process.env.CLUB_WEBSITE || "http://localhost:5173",
        supportEmail: process.env.SUPPORT_EMAIL || "support@clubmanager.com",
        currentYear: new Date().getFullYear().toString(),
        ...options?.variables,
      };

      // Essayer de charger le template
      try {
        const { subject, htmlContent } = await templateLoader.loadTemplate(
          "reset-password",
          variables,
          `Réinitialisation de mot de passe`,
        );

        return await sendGridSender.send(email, subject, htmlContent, {
          fallbackOnError: true,
          saveToDb: true,
        });
      } catch (templateError) {
        console.warn(
          "⚠️ [EmailClient] Template reset-password non trouvé, utilisation du fallback",
        );

        // Fallback critique - email important, HTML inline complet
        const fallbackHtml = this.createPasswordResetFallbackHtml(
          prenom,
          resetUrl,
          token,
        );

        return await sendGridSender.send(
          email,
          "🔐 Réinitialisation de votre mot de passe - Club Manager",
          fallbackHtml,
          {
            fallbackOnError: true,
            saveToDb: true,
          },
        );
      }
    } catch (error: any) {
      console.error("❌ [EmailClient] Erreur email réinitialisation:", error);
      return {
        success: false,
        error: error.message,
        details: { originalError: error },
      };
    }
  }

  /**
   * Preview d'un template (sans envoi)
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
    return await templateLoader.previewTemplate(templateName, variables);
  }

  /**
   * Liste tous les templates disponibles
   */
  async listTemplates(): Promise<string[]> {
    return await templateLoader.listAvailableTemplates();
  }

  /**
   * Vérifie si un template existe
   */
  async templateExists(templateName: string): Promise<boolean> {
    return await templateLoader.templateExists(templateName);
  }

  // ============================================================
  // FALLBACKS HTML INLINE (pour les cas où les templates échouent)
  // ============================================================

  /**
   * Fallback HTML générique
   */
  private createFallbackHtml(title: string, message: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px; margin-bottom: 20px; }
          .content { background: white; padding: 20px; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${message}
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Fallback pour email de bienvenue
   */
  private createWelcomeFallbackHtml(user: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px; }
          .content { background: white; padding: 30px; border-radius: 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Bienvenue !</h1>
            <p>Votre inscription est confirmée</p>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.first_name} ${user.last_name}</strong>,</p>
            <p>Nous sommes ravis de vous accueillir sur Club Manager !</p>
            <p>Votre compte a été créé avec succès. Vous pouvez maintenant accéder à votre espace personnel.</p>
            <h3>Prochaines étapes :</h3>
            <ul>
              <li>Complétez votre profil</li>
              <li>Explorez nos cours disponibles</li>
              <li>Consultez votre planning</li>
              <li>Contactez-nous pour toute question</li>
            </ul>
            <p>Cordialement,<br><strong>L'équipe Club Manager</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Fallback pour email de promotion
   */
  private createPromotionFallbackHtml(user: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px; }
          .content { background: white; padding: 30px; border-radius: 10px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Félicitations !</h1>
            <p>Vous êtes désormais professeur</p>
          </div>
          <div class="content">
            <p>Bonjour <strong>${user.first_name} ${user.last_name}</strong>,</p>
            <p>Nous avons le plaisir de vous annoncer que vous avez été promu au statut de <strong>Professeur</strong> !</p>
            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>Créer et gérer vos cours</li>
              <li>Suivre vos élèves</li>
              <li>Accéder aux outils pédagogiques</li>
            </ul>
            <p>Bienvenue dans l'équipe enseignante !</p>
            <p>Cordialement,<br><strong>L'équipe Club Manager</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Fallback pour confirmation de commande
   */
  private createOrderConfirmationFallbackHtml(
    variables: OrderConfirmationVariables,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #f9f9f9; padding: 30px; border-radius: 10px; }
          .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px; margin-bottom: 20px; }
          .content { background: white; padding: 30px; border-radius: 10px; }
          .order-details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 Commande confirmée !</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${variables.userName}</strong>,</p>
            <p>Votre commande <strong>${variables.numeroCommande}</strong> a été confirmée.</p>
            <div class="order-details">
              <p><strong>Date :</strong> ${variables.dateCommande}</p>
              <p><strong>Statut :</strong> ${variables.statutCommande}</p>
              <p><strong>Articles :</strong> ${variables.nbArticles}</p>
              <p><strong>Total :</strong> ${variables.totalCommande} €</p>
            </div>
            <p>Vous recevrez un email quand votre commande sera prête.</p>
            <p>Cordialement,<br><strong>L'équipe Club Manager</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Fallback pour réinitialisation de mot de passe (critique)
   */
  private createPasswordResetFallbackHtml(
    prenom: string,
    resetUrl: string,
    token: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin: -30px -30px 30px -30px; }
          .icon { font-size: 48px; margin-bottom: 10px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
          .token { background: #f8f9fa; padding: 15px; border: 2px solid #667eea; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          a { color: #667eea; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔐</div>
            <h1>Réinitialisation de mot de passe</h1>
          </div>

          <p>Bonjour <strong>${prenom}</strong>,</p>

          <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Club Manager.</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">🔑 Réinitialiser mon mot de passe</a>
          </p>

          <p>Ou copiez-collez ce lien dans votre navigateur :</p>
          <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            ${resetUrl}
          </p>

          <div class="warning">
            <strong>⚠️ Important :</strong>
            <ul style="margin: 10px 0;">
              <li>Ce lien expire dans <strong>1 heure</strong></li>
              <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              <li>Ne partagez jamais ce lien avec personne</li>
            </ul>
          </div>

          <p>Si le bouton ne fonctionne pas, vous pouvez utiliser directement ce code :</p>
          <div class="token">
            ${token.substring(0, 12)}...
          </div>

          <p><strong>💡 Conseils de sécurité :</strong></p>
          <ul>
            <li>Choisissez un mot de passe d'au moins 8 caractères</li>
            <li>Utilisez une combinaison de lettres, chiffres et symboles</li>
            <li>Évitez les mots de passe trop simples</li>
          </ul>

          <p>Cordialement,<br><strong>L'équipe Club Manager</strong></p>

          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ============================================================
  // MÉTHODES RACCOURCIES - Facilité d'utilisation
  // ============================================================

  /**
   * Envoi email de bienvenue (raccourci ultra-simple)
   */
  async welcome(
    user: any,
    customVariables?: Record<string, string>,
  ): Promise<EmailSendResult> {
    return this.sendWelcomeEmail(user, { variables: customVariables });
  }

  /**
   * Envoi email de réinitialisation de mot de passe (raccourci)
   */
  async resetPassword(
    emailOrUser: string | any,
    token: string,
    customVariables?: Record<string, string>,
  ): Promise<EmailSendResult> {
    const email =
      typeof emailOrUser === "string" ? emailOrUser : emailOrUser.email;
    const prenom =
      typeof emailOrUser === "string"
        ? "Utilisateur"
        : emailOrUser.first_name || emailOrUser.firstName || "Utilisateur";

    return this.sendPasswordResetEmail(email, prenom, token, {
      variables: customVariables,
    });
  }

  /**
   * Envoi notification simple
   */
  async notify(
    userOrEmail: any | string,
    message: string,
    subject?: string,
  ): Promise<EmailSendResult> {
    const to =
      typeof userOrEmail === "string" ? userOrEmail : userOrEmail.email;
    const userId = typeof userOrEmail === "object" ? userOrEmail.id : undefined;

    return this.sendEmail({
      to,
      subject: subject || "Notification - Club Manager",
      message: this.createFallbackHtml(subject || "Notification", message),
      saveToDb: true,
      utilisateurId: userId,
    });
  }

  /**
   * Envoi confirmation de commande (raccourci)
   */
  async orderConfirmation(
    user: any,
    orderDetails: OrderConfirmationVariables,
  ): Promise<EmailSendResult> {
    return this.sendOrderConfirmationEmail(user.email, user.id, orderDetails);
  }

  /**
   * Envoi promotion professeur (raccourci)
   */
  async promotion(user: any, message?: string): Promise<EmailSendResult> {
    return this.sendPromotionEmail(user, {
      variables: message ? { customMessage: message } : undefined,
    });
  }

  // ============================================================
  // ENVOI EN MASSE (BULK)
  // ============================================================

  /**
   * Envoie le même template à plusieurs destinataires avec variables personnalisées
   */
  async sendBulk<T extends TemplateName>(
    request: BulkEmailRequest<T>,
  ): Promise<BulkEmailResult> {
    console.log(
      `📦 [EmailClient] Envoi bulk de ${request.recipients.length} emails (template: ${request.templateTitle})`,
    );

    const results: EmailSendResult[] = [];
    const errors: Array<{ recipient: string; error: string }> = [];
    let successCount = 0;
    let failedCount = 0;

    // Si dry-run, ne pas envoyer réellement
    if (request.dryRun) {
      console.log("🔍 [EmailClient] Mode DRY-RUN activé pour bulk send");
    }

    for (const recipient of request.recipients) {
      try {
        // Extraire email et variables
        const to = recipient.to || recipient.user?.email;
        if (!to) {
          throw new Error("Email ou user requis pour chaque destinataire");
        }

        // Préparer les variables
        let variables = { ...request.commonVariables, ...recipient.variables };

        // Si user fourni, extraire les données automatiquement
        if (recipient.user) {
          const userData = variablesPreparator.fromUser(recipient.user);
          variables = {
            userName: userData.userName,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            ...variables,
          } as any;
        }

        // Normaliser les variables
        const normalizedVars = variablesPreparator.normalize(variables);

        // Construire et envoyer l'email
        const builder = createEmailBuilder()
          .to(to)
          .template(request.templateTitle)
          .variables(variables as any)
          .saveToDb(true)
          .dryRun(request.dryRun || false);

        if (recipient.utilisateurId) {
          builder.userId(recipient.utilisateurId);
        } else if (recipient.user?.id) {
          builder.userId(recipient.user.id);
        }

        const result = await builder.send();

        results.push(result as EmailSendResult);

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
          errors.push({
            recipient: to,
            error: result.error || "Erreur inconnue",
          });
        }

        // Petit délai entre les envois pour éviter le rate limiting
        if (!request.dryRun && request.recipients.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error: any) {
        failedCount++;
        const recipientEmail =
          recipient.to || recipient.user?.email || "unknown";
        errors.push({
          recipient: recipientEmail,
          error: error.message,
        });
        results.push({
          success: false,
          error: error.message,
        });
      }
    }

    console.log(
      `✅ [EmailClient] Bulk send terminé : ${successCount} succès, ${failedCount} échecs`,
    );

    return {
      total: request.recipients.length,
      success: successCount,
      failed: failedCount,
      results,
      errors,
    };
  }

  // ============================================================
  // FLUENT API (Builder)
  // ============================================================

  /**
   * Crée un builder pour construire un email avec Fluent API
   */
  builder<T extends TemplateName = TemplateName>(): EmailBuilder<T> {
    return createEmailBuilder<T>();
  }
}

// Instance singleton
export const emailClient = new EmailClient();
