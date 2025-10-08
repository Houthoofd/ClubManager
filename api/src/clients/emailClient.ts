import { EmailService } from '../services/emailService.js';
import { emailTemplateService } from '../services/emailTemplateService.js';
import { emailValidationService } from '../services/emailValidationService.js';

export interface EmailSendRequest {
  to: string;
  subject?: string;
  message?: string;
  templateId?: number;
  templateTitle?: string;
  variables?: Record<string, string>;
  isHtml?: boolean;
  saveToDb?: boolean;
  utilisateurId?: number;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export interface EmailValidationRequest {
  email: string;
  prenom: string;
  nom: string;
  userId: string;
  utilisateurId: number;
}

export interface EmailValidationResult {
  success: boolean;
  message: string;
  data?: any;
  details?: any;
}

export class EmailClient {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Envoie un email simple
   */
  async sendEmail(request: EmailSendRequest): Promise<EmailSendResult> {
    try {
      console.log('📧 [EmailClient] Envoi email:', { 
        to: request.to, 
        subject: request.subject,
        hasTemplate: !!request.templateId || !!request.templateTitle 
      });

      // Vérifier que le service email est prêt
      if (!this.emailService.isReady()) {
        console.error('❌ [EmailClient] Service email non disponible');
        return {
          success: false,
          error: 'Service email non configuré - vérifiez les variables d\'environnement'
        };
      }

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
          console.warn('⚠️ [EmailClient] Template non trouvé:', request.templateId || request.templateTitle);
        }
      }

      // Envoyer l'email
      const result = await this.emailService.envoyerMessage({
        to: request.to,
        subject: finalSubject || 'Message de Club Manager',
        message: finalMessage || 'Message vide',
        isHtml: request.isHtml !== false, // Par défaut true
        saveToDb: request.saveToDb !== false, // Par défaut true
        utilisateurId: request.utilisateurId
      });

      console.log('✅ [EmailClient] Email envoyé:', result.success);
      
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : 'Échec envoi email',
        details: result
      };

    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur envoi email:', error);
      return {
        success: false,
        error: error.message,
        details: { originalError: error }
      };
    }
  }

  /**
   * Envoie un email de bienvenue
   */
  async sendWelcomeEmail(to: string, variables: {
    userName: string;
    userId?: string;
    loginUrl?: string;
  }, utilisateurId?: number): Promise<EmailSendResult> {
    try {
      const template = await emailTemplateService.getWelcomeTemplate(variables);
      
      const result = await this.emailService.envoyerMessage({
        to,
        subject: template.subject,
        message: template.html,
        isHtml: true,
        saveToDb: true,
        utilisateurId
      });

      return {
        success: result.success,
        messageId: result.messageId,
        details: result
      };
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email bienvenue:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie un email de validation avec token
   */
  async sendValidationEmail(request: EmailValidationRequest): Promise<EmailValidationResult> {
    try {
      console.log('📧 [EmailClient] Envoi email validation:', request);
      
      const result = await emailValidationService.sendValidationEmailWithUserId(request);
      
      return result;
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email validation:', error);
      return {
        success: false,
        message: error.message,
        details: { originalError: error }
      };
    }
  }

  /**
   * Valide un token d'email
   */
  async validateEmailToken(token: string, userId: string): Promise<EmailValidationResult> {
    try {
      console.log('🔍 [EmailClient] Validation token:', { 
        token: token.substring(0, 8) + '...', 
        userId 
      });
      
      const result = await emailValidationService.validateEmailTokenWithHash(token, userId);
      
      return result;
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur validation token:', error);
      return {
        success: false,
        message: error.message,
        details: { originalError: error }
      };
    }
  }

  /**
   * Envoie un email de notification de cours
   */
  async sendCourseNotification(to: string, variables: {
    userName: string;
    action: string;
    courseType: string;
    courseDate: string;
    courseTime: string;
    instructor?: string;
  }, utilisateurId?: number): Promise<EmailSendResult> {
    try {
      const template = await emailTemplateService.getCourseNotificationTemplate(variables);
      
      const result = await this.emailService.envoyerMessage({
        to,
        subject: template.subject,
        message: template.html,
        isHtml: true,
        saveToDb: true,
        utilisateurId
      });

      return {
        success: result.success,
        messageId: result.messageId,
        details: result
      };
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur notification cours:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie un rappel de paiement
   */
  async sendPaymentReminder(to: string, level: 1 | 2 | 3, variables: {
    userName: string;
    amount?: string;
    dueDate?: string;
  }, utilisateurId?: number): Promise<EmailSendResult> {
    try {
      const template = await emailTemplateService.getPaymentReminderTemplate(level, variables);
      
      const result = await this.emailService.envoyerMessage({
        to,
        subject: template.subject,
        message: template.html,
        isHtml: true,
        saveToDb: true,
        utilisateurId
      });

      return {
        success: result.success,
        messageId: result.messageId,
        details: result
      };
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur rappel paiement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie une confirmation de paiement
   */
  async sendPaymentConfirmation(to: string, variables: {
    userName: string;
    amount: string;
    paymentDate: string;
  }, utilisateurId?: number): Promise<EmailSendResult> {
    try {
      const template = await emailTemplateService.getPaymentConfirmationTemplate(variables);
      
      const result = await this.emailService.envoyerMessage({
        to,
        subject: template.subject,
        message: template.html,
        isHtml: true,
        saveToDb: true,
        utilisateurId
      });

      return {
        success: result.success,
        messageId: result.messageId,
        details: result
      };
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur confirmation paiement:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Teste la configuration email
   */
  async testConfiguration(): Promise<{
    success: boolean;
    details: any;
  }> {
    try {
      console.log('🔧 [EmailClient] Test de configuration email');
      
      const result = await this.emailService.testerConfiguration();
      
      return result;
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur test configuration:', error);
      return {
        success: false,
        details: { error: error.message }
      };
    }
  }

  /**
   * Envoie un email de test
   */
  async sendTestEmail(to: string): Promise<EmailSendResult> {
    try {
      console.log('🧪 [EmailClient] Envoi email de test vers:', to);
      
      const result = await this.emailService.envoyerEmailTest(to);
      
      return {
        success: result.success,
        messageId: result.messageId,
        error: result.success ? undefined : result.error,
        details: result
      };
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email de test:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie un email avec template personnalisé
   */
  async sendTemplatedEmail(request: {
    to: string;
    templateTitle: string;
    variables: Record<string, string>;
    utilisateurId?: number;
  }): Promise<EmailSendResult> {
    return this.sendEmail({
      to: request.to,
      templateTitle: request.templateTitle,
      variables: request.variables,
      utilisateurId: request.utilisateurId,
      isHtml: true,
      saveToDb: true
    });
  }

  /**
   * Envoie un email en masse (bulk)
   */
  async sendBulkEmails(requests: EmailSendRequest[]): Promise<{
    success: number;
    failed: number;
    results: EmailSendResult[];
  }> {
    console.log(`📨 [EmailClient] Envoi en masse de ${requests.length} emails`);
    
    const results: EmailSendResult[] = [];
    let success = 0;
    let failed = 0;

    for (const request of requests) {
      try {
        const result = await this.sendEmail(request);
        results.push(result);
        
        if (result.success) {
          success++;
        } else {
          failed++;
        }
        
        // Petite pause entre les envois pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error: any) {
        console.error('❌ [EmailClient] Erreur envoi bulk:', error);
        results.push({
          success: false,
          error: error.message
        });
        failed++;
      }
    }

    console.log(`📊 [EmailClient] Résultats bulk: ${success} succès, ${failed} échecs`);
    
    return {
      success,
      failed,
      results
    };
  }
}

// Instance singleton
export const emailClient = new EmailClient();
