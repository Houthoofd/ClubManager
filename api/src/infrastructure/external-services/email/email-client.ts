/**
 * Client Email principal - Façade pour tous les services d'emails
 */

import type {
  EmailSendRequest,
  EmailSendResult,
  PromotionEmailOptions,
  OrderConfirmationVariables,
} from "@clubmanager/types";

import { templateLoader } from "./template-loader.js";
import { variablesPreparator } from "./variables-preparator.js";
import { sendGridSender } from "./sendgrid-sender.js";
import { emailTemplateService } from "../../services/emailTemplateService.js";

export class EmailClient {
  /**
   * Envoie un email simple
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

      // Si un template est spécifié, l'utiliser
      if (request.templateId || request.templateTitle) {
        const template = request.templateId
          ? await emailTemplateService.getTemplateById(request.templateId)
          : await emailTemplateService.getTemplateByTitle(
              request.templateTitle!,
            );

        if (template) {
          const processedTemplate = emailTemplateService.processTemplate(
            template.content,
            request.variables || {},
          );

          finalSubject = finalSubject || processedTemplate.subject;
          finalMessage = processedTemplate.html;
        } else {
          console.warn(
            "⚠️ [EmailClient] Template non trouvé:",
            request.templateId || request.templateTitle,
          );
        }
      }

      return await sendGridSender.send(
        request.to,
        finalSubject || "Message de Club Manager",
        finalMessage || "Message vide",
        {
          fallbackOnError: true,
          saveToDb: request.saveToDb,
          utilisateurId: request.utilisateurId,
        },
      );
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
      return {
        success: false,
        error: error.message,
      };
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

      // Fallback vers email simple
      const fallbackHtml = `
        <h2>👋 Bienvenue !</h2>
        <p>Bonjour ${user.first_name} ${user.last_name},</p>
        <p>Bienvenue sur Club Manager !</p>
        <p>Votre compte a été créé avec succès.</p>
        <p>Cordialement,<br>L'équipe Club Manager</p>
      `;

      return await sendGridSender.send(
        user.email,
        `Bienvenue ${user.first_name} - Club Manager`,
        fallbackHtml,
        { fallbackOnError: true },
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

      // Fallback
      const fallbackHtml = `
        <h2>🛒 Commande confirmée !</h2>
        <p>Bonjour ${variables.userName},</p>
        <p>Votre commande <strong>${variables.numeroCommande}</strong> a été confirmée.</p>
        <ul>
          <li>Date : ${variables.dateCommande}</li>
          <li>Statut : ${variables.statutCommande}</li>
          <li>Articles : ${variables.nbArticles}</li>
          <li>Total : ${variables.totalCommande} €</li>
        </ul>
        <p>Vous recevrez un email quand votre commande sera prête.</p>
        <p>Cordialement,<br>L'équipe Club Manager</p>
      `;

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
        expirationTime: "1 heure",
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

        // Fallback vers email simple et sécurisé
        const fallbackHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
              .button { display: inline-block; padding: 12px 30px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Réinitialisation de mot de passe</h1>
              </div>
              <div class="content">
                <p>Bonjour ${prenom},</p>

                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Club Manager.</p>

                <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
                </div>

                <p>Ou copiez-collez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">
                  ${resetUrl}
                </p>

                <div class="warning">
                  <strong>⚠️ Important :</strong>
                  <ul>
                    <li>Ce lien expire dans <strong>1 heure</strong></li>
                    <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
                    <li>Ne partagez jamais ce lien avec personne</li>
                  </ul>
                </div>

                <p>Si le bouton ne fonctionne pas, vous pouvez utiliser directement ce code :</p>
                <p style="background: #fff; padding: 15px; border: 2px solid #4CAF50; text-align: center; font-size: 18px; font-weight: bold; letter-spacing: 2px;">
                  ${token.substring(0, 8)}...
                </p>

                <p>Cordialement,<br>L'équipe Club Manager</p>
              </div>
              <div class="footer">
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                <p>© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
              </div>
            </div>
          </body>
          </html>
        `;

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
}

// Instance singleton
export const emailClient = new EmailClient();
