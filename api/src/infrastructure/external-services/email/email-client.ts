/**
 * Client Email principal - Façade pour tous les services d'emails
 */

import type {
  EmailSendRequest,
  EmailSendResult,
  PromotionEmailOptions,
  OrderConfirmationVariables,
} from '@clubmanager/types';

import { templateLoader } from './template-loader.js';
import { variablesPreparator } from './variables-preparator.js';
import { sendGridSender } from './sendgrid-sender.js';
import { emailTemplateService } from '../../services/emailTemplateService.js';

export class EmailClient {
  /**
   * Envoie un email simple
   */
  async sendEmail(request: EmailSendRequest): Promise<EmailSendResult> {
    try {
      console.log('📧 [EmailClient] Envoi email:', {
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
          : await emailTemplateService.getTemplateByTitle(request.templateTitle!);

        if (template) {
          const processedTemplate = emailTemplateService.processTemplate(
            template.content,
            request.variables || {}
          );

          finalSubject = finalSubject || processedTemplate.subject;
          finalMessage = processedTemplate.html;
        } else {
          console.warn(
            '⚠️ [EmailClient] Template non trouvé:',
            request.templateId || request.templateTitle
          );
        }
      }

      return await sendGridSender.send(
        request.to,
        finalSubject || 'Message de Club Manager',
        finalMessage || 'Message vide',
        {
          fallbackOnError: true,
          saveToDb: request.saveToDb,
          utilisateurId: request.utilisateurId,
        }
      );
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur envoi email:', error);
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
  async sendPromotionEmail(user: any, options?: PromotionEmailOptions): Promise<EmailSendResult> {
    try {
      console.log(
        `📧 [EmailClient] Envoi email de promotion à ${user.email} (ID: ${user.id})`
      );

      const templateName = options?.templateName || 'promotion-professeur';
      const variables = variablesPreparator.preparePromotionVariables(user, options?.variables);

      const { subject, htmlContent } = await templateLoader.loadTemplate(
        templateName,
        variables,
        `Promotion - ${variables.userName}`
      );

      return await sendGridSender.send(user.email, subject, htmlContent, {
        fallbackOnError: true,
        saveToDb: true,
        utilisateurId: user.id,
      });
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email promotion:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(user: any, options?: { variables?: Record<string, string> }): Promise<EmailSendResult> {
    try {
      console.log(`📧 [EmailClient] Envoi email de bienvenue à ${user.email}`);

      const variables = variablesPreparator.prepareWelcomeVariables(user, options?.variables);

      const { subject, htmlContent } = await templateLoader.loadTemplate(
        'bienvenue',
        variables,
        `Bienvenue ${variables.userName} !`
      );

      return await sendGridSender.send(user.email, subject, htmlContent, {
        fallbackOnError: true,
        saveToDb: true,
        utilisateurId: user.id,
      });
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email bienvenue:', error);

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
        { fallbackOnError: true }
      );
    }
  }

  /**
   * Envoie un email de confirmation de commande
   */
  async sendOrderConfirmationEmail(
    to: string,
    utilisateurId: number,
    variables: OrderConfirmationVariables
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
        }
      );

      const { subject, htmlContent } = await templateLoader.loadTemplate(
        'confirmation-commande',
        emailVariables,
        `Confirmation de commande ${variables.numeroCommande}`
      );

      return await sendGridSender.send(to, subject, htmlContent, {
        fallbackOnError: true,
        saveToDb: true,
        utilisateurId,
      });
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur confirmation commande:', error);

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
        }
      );
    }
  }
}

// Instance singleton
export const emailClient = new EmailClient();
