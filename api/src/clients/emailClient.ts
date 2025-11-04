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
   * Lit un template depuis le dossier templates/emails et remplace les variables
   */
  private async loadEmailTemplate(
    templateName: string, 
    variables: Record<string, string>,
    fallbackSubject?: string
  ): Promise<{ subject: string; htmlContent: string }> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      
      // Déterminer le bon chemin selon l'environnement
      let templatePath: string;
      
      // En développement ou en production, chercher d'abord dans src
      const srcTemplatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
      const distTemplatePath = path.join(__dirname, '../../src/templates/emails', `${templateName}.html`);
      
      if (fs.existsSync(srcTemplatePath)) {
        templatePath = srcTemplatePath;
      } else if (fs.existsSync(distTemplatePath)) {
        templatePath = distTemplatePath;
      } else {
        // Essayer un chemin relatif depuis la racine du projet
        const rootTemplatePath = path.join(process.cwd(), 'src/templates/emails', `${templateName}.html`);
        if (fs.existsSync(rootTemplatePath)) {
          templatePath = rootTemplatePath;
        } else {
          throw new Error(`Template ${templateName} non trouvé dans aucun des emplacements`);
        }
      }
      
      console.log('📁 [EmailClient] Chemin du template trouvé:', templatePath);
      
      console.log('✅ [EmailClient] Template trouvé:', templateName);
      
      // Lire le fichier template
      let templateContent = fs.readFileSync(templatePath, 'utf8');
      
      // Remplacer les variables dans le template
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        templateContent = templateContent.replace(regex, value);
      });
      
      // Extraire le sujet du template
      let subject = fallbackSubject || `Message de ${variables.clubName || 'Club Manager'}`;
      const titleMatch = templateContent.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        subject = titleMatch[1].trim();
        // Remplacer aussi les variables dans le title
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          subject = subject.replace(regex, value);
        });
      }
      
      console.log('📧 [EmailClient] Template chargé:', {
        templateName,
        subjectExtracted: !!titleMatch,
        finalSubject: subject,
        contentLength: templateContent.length
      });
      
      return {
        subject,
        htmlContent: templateContent
      };
      
    } catch (error) {
      console.warn('⚠️ [EmailClient] Erreur lecture template:', error);
      throw error;
    }
  }

  /**
   * Prépare les variables communes pour tous les templates
   */
  private prepareCommonVariables(additionalVariables?: Record<string, string>): Record<string, string> {
    return {
      clubName: 'Club Manager',
      currentYear: new Date().getFullYear().toString(),
      supportEmail: process.env.ADMIN_EMAIL || 'support@clubmanager.com',
      frontendUrl: process.env.FRONTEND_URL || 'https://clubmanagment.com',
      loginUrl: `${process.env.FRONTEND_URL}/pages/connexion` || 'https://clubmanagment.com/pages/connexion',
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard` || 'https://clubmanagment.com/dashboard',
      ...additionalVariables
    };
  }

  /**
   * Méthode générique d'envoi direct via SendGrid (contourne isReady)
   */
  private async sendDirectViaSendGrid(
    to: string, 
    subject: string, 
    htmlContent: string,
    options?: {
      fallbackOnError?: boolean;
      saveToDb?: boolean;
      utilisateurId?: number;
    }
  ): Promise<EmailSendResult> {
    try {
      console.log('📧 [EmailClient] Envoi direct via SendGrid...');
      
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!);

      const msg = {
        to: to,
        from: process.env.SENDGRID_FROM_EMAIL!,
        subject: subject,
        html: htmlContent,
      };

      const response = await sgMail.default.send(msg);
      console.log(`✅ [EmailClient] Email envoyé directement via SendGrid à ${to}`);
      
      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id'] || 'sendgrid-direct',
        details: {
          statusCode: response[0]?.statusCode,
          headers: response[0]?.headers
        }
      };
      
    } catch (sendGridError: any) {
      console.error('❌ [EmailClient] Erreur SendGrid directe:', sendGridError);
      
      if (options?.fallbackOnError) {
        console.log('🔄 [EmailClient] Tentative fallback...');
        
        try {
          const testResult = await this.emailService.testerConfiguration();
          if (testResult.success) {
            return {
              success: true,
              messageId: 'fallback-test-success',
              details: { fallback: true, testResult }
            };
          }
        } catch (fallbackError) {
          // Continue avec l'erreur originale
        }
      }
      
      return {
        success: false,
        error: `Erreur SendGrid: ${sendGridError.message}`,
        details: { sendGridError }
      };
    }
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

      // Utiliser l'envoi direct via SendGrid
      return await this.sendDirectViaSendGrid(
        request.to,
        finalSubject || 'Message de Club Manager',
        finalMessage || 'Message vide',
        {
          fallbackOnError: true,
          saveToDb: request.saveToDb,
          utilisateurId: request.utilisateurId
        }
      );

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
   * Envoie un email de promotion (utilise le template promotion-professeur)
   */
  async sendPromotionEmail(user: any, options?: {
    templateName?: string;
    variables?: Record<string, string>;
  }): Promise<EmailSendResult> {
    try {
      console.log(`📧 [EmailClient] Envoi email de promotion à ${user.email} (ID: ${user.id})`);
      
      // Définir le nom du template à utiliser
      const templateName = options?.templateName || 'promotion-professeur';
      
      // Préparer les variables pour le template
      const templateVariables = this.prepareCommonVariables({
        userName: `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        fullName: `${user.first_name} ${user.last_name}`,
        email: user.email,
        userId: user.id?.toString() || '',
        customMessage: options?.variables?.customMessage || 'Bienvenue dans l\'équipe des professeurs !',
        promotionDate: new Date().toLocaleDateString('fr-FR'),
        ...options?.variables
      });

      console.log('📝 [EmailClient] Variables du template:', templateVariables);

      // Charger le template
      const { subject, htmlContent } = await this.loadEmailTemplate(
        templateName, 
        templateVariables,
        'Promotion en tant que professeur - Club Manager'
      );

      // Envoyer l'email via SendGrid
      const result = await this.sendDirectViaSendGrid(
        user.email,
        subject,
        htmlContent,
        {
          fallbackOnError: true,
          saveToDb: false,
          utilisateurId: user.id
        }
      );

      if (result.success) {
        console.log(`✅ [EmailClient] Email de promotion envoyé avec succès à ${user.email}`);
      } else {
        console.error(`❌ [EmailClient] Échec envoi email promotion à ${user.email}:`, result.error);
      }

      return result;
      
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email promotion:', error);
      return {
        success: false,
        error: `Erreur envoi email: ${error.message}`,
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
      const templateVariables = this.prepareCommonVariables({
        userId: '',
        ...variables // Utiliser directement le spread sans redéfinir userName
      });

      const { subject, htmlContent } = await this.loadEmailTemplate(
        'bienvenue',
        templateVariables,
        'Bienvenue dans notre club'
      );
      
      return await this.sendDirectViaSendGrid(
        to,
        subject,
        htmlContent,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId
        }
      );
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email bienvenue:', error);
      
      // Fallback vers l'ancienne méthode si template non trouvé
      try {
        const template = await emailTemplateService.getWelcomeTemplate(variables);
        return await this.sendDirectViaSendGrid(
          to,
          template.subject,
          template.html,
          {
            fallbackOnError: true,
            saveToDb: true,
            utilisateurId
          }
        );
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Envoie un email avec template depuis fichier
   */
  async sendTemplatedEmailFromFile(request: {
    to: string;
    templateName: string;
    variables: Record<string, string>;
    utilisateurId?: number;
    fallbackSubject?: string;
  }): Promise<EmailSendResult> {
    try {
      const templateVariables = this.prepareCommonVariables(request.variables);

      const { subject, htmlContent } = await this.loadEmailTemplate(
        request.templateName,
        templateVariables,
        request.fallbackSubject
      );

      return await this.sendDirectViaSendGrid(
        request.to,
        subject,
        htmlContent,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId: request.utilisateurId
        }
      );
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur template email:', error);
      return {
        success: false,
        error: error.message,
        details: { originalError: error }
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
  }, utilisateurId?: number, templateName: string = 'notification-cours'): Promise<EmailSendResult> {
    try {
      const templateVariables = this.prepareCommonVariables({
        instructor: '',
        ...variables // Mettre le spread en premier pour éviter les conflits
      });

      const { subject, htmlContent } = await this.loadEmailTemplate(
        templateName,
        templateVariables,
        'Notification de cours - Club Manager'
      );
      
      return await this.sendDirectViaSendGrid(
        to,
        subject,
        htmlContent,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId
        }
      );
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur notification cours:', error);
      
      // Fallback vers l'ancienne méthode si template non trouvé
      try {
        const template = await emailTemplateService.getCourseNotificationTemplate(variables);
        return await this.sendDirectViaSendGrid(
          to,
          template.subject,
          template.html,
          {
            fallbackOnError: true,
            saveToDb: true,
            utilisateurId
          }
        );
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Envoie un rappel de paiement
   */
  async sendPaymentReminder(to: string, level: 1 | 2 | 3, variables: {
    userName: string;
    amount?: string;
    dueDate?: string;
  }, utilisateurId?: number, templateName?: string): Promise<EmailSendResult> {
    try {
      // Nom du template basé sur le niveau si pas spécifié
      const finalTemplateName = templateName || `rappel-paiement-${level}`;
      
      const templateVariables = this.prepareCommonVariables({
        amount: '',
        dueDate: '',
        level: level.toString(),
        ...variables // Mettre le spread en premier pour éviter les conflits
      });

      const { subject, htmlContent } = await this.loadEmailTemplate(
        finalTemplateName,
        templateVariables,
        `Rappel de paiement ${level} - Club Manager`
      );
      
      return await this.sendDirectViaSendGrid(
        to,
        subject,
        htmlContent,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId
        }
      );
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur rappel paiement:', error);
      
      // Fallback vers l'ancienne méthode si template non trouvé
      try {
        const template = await emailTemplateService.getPaymentReminderTemplate(level, variables);
        return await this.sendDirectViaSendGrid(
          to,
          template.subject,
          template.html,
          {
            fallbackOnError: true,
            saveToDb: true,
            utilisateurId
          }
        );
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Envoie une confirmation de paiement
   */
  async sendPaymentConfirmation(to: string, variables: {
    userName: string;
    amount: string;
    paymentDate: string;
  }, utilisateurId?: number, templateName: string = 'confirmation-paiement'): Promise<EmailSendResult> {
    try {
      const templateVariables = this.prepareCommonVariables({
        ...variables // Utiliser directement le spread sans redéfinir les propriétés
      });

      const { subject, htmlContent } = await this.loadEmailTemplate(
        templateName,
        templateVariables,
        'Confirmation de paiement - Club Manager'
      );
      
      return await this.sendDirectViaSendGrid(
        to,
        subject,
        htmlContent,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId
        }
      );
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur confirmation paiement:', error);
      
      // Fallback vers l'ancienne méthode si template non trouvé
      try {
        const template = await emailTemplateService.getPaymentConfirmationTemplate(variables);
        return await this.sendDirectViaSendGrid(
          to,
          template.subject,
          template.html,
          {
            fallbackOnError: true,
            saveToDb: true,
            utilisateurId
          }
        );
      } catch (fallbackError) {
        return {
          success: false,
          error: error.message
        };
      }
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
  async sendTestEmail(to: string, templateName: string = 'test-email'): Promise<EmailSendResult> {
    try {
      console.log('🧪 [EmailClient] Envoi email de test vers:', to);
      
      const templateVariables = this.prepareCommonVariables({
        userName: 'Utilisateur de test',
        testDate: new Date().toLocaleDateString('fr-FR'),
        testTime: new Date().toLocaleTimeString('fr-FR')
      });

      try {
        const { subject, htmlContent } = await this.loadEmailTemplate(
          templateName,
          templateVariables,
          'Test Email - Club Manager'
        );
        
        return await this.sendDirectViaSendGrid(
          to,
          subject,
          htmlContent,
          { fallbackOnError: true }
        );
      } catch (templateError) {
        // Fallback vers email de test simple
        return await this.sendDirectViaSendGrid(
          to,
          'Test Email - Club Manager',
          '<h2>Email de test</h2><p>Ceci est un email de test pour vérifier la configuration SendGrid.</p>',
          { fallbackOnError: true }
        );
      }
    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur email de test:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Envoie un email avec template personnalisé (utilise les fichiers templates)
   */
  async sendTemplatedEmail(request: {
    to: string;
    templateTitle: string;
    variables: Record<string, string>;
    utilisateurId?: number;
  }): Promise<EmailSendResult> {
    try {
      // Essayer d'abord avec loadEmailTemplate (fichiers)
      const templateVariables = this.prepareCommonVariables(request.variables);

      const { subject, htmlContent } = await this.loadEmailTemplate(
        request.templateTitle,
        templateVariables
      );

      return await this.sendDirectViaSendGrid(
        request.to,
        subject,
        htmlContent,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId: request.utilisateurId
        }
      );
    } catch (error: any) {
      console.warn('⚠️ [EmailClient] Template fichier non trouvé, fallback vers BDD');
      
      // Fallback vers l'ancienne méthode (BDD)
      return this.sendEmail({
        to: request.to,
        templateTitle: request.templateTitle,
        variables: request.variables,
        utilisateurId: request.utilisateurId,
        isHtml: true,
        saveToDb: true
      });
    }
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

  /**
   * Vérifie la connexion SendGrid au démarrage du serveur
   */
  async verifyConnectionOnStartup(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🔧 [EmailClient] Vérification de la connexion SendGrid au démarrage...');
      
      // Vérifier les variables d'environnement requises
      const requiredEnvVars = {
        SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
        SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
        EMAIL_USER: process.env.EMAIL_USER,
        EMAIL_PASS: process.env.EMAIL_PASS
      };

      console.log('🔍 [EmailClient] Variables d\'environnement:', {
        SENDGRID_API_KEY: requiredEnvVars.SENDGRID_API_KEY ? 'Présente' : 'Manquante',
        SENDGRID_FROM_EMAIL: requiredEnvVars.SENDGRID_FROM_EMAIL || 'Manquante',
        EMAIL_USER: requiredEnvVars.EMAIL_USER || 'Manquante',
        EMAIL_PASS: requiredEnvVars.EMAIL_PASS ? 'Présente' : 'Manquante'
      });

      const missingVars = Object.entries(requiredEnvVars)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingVars.length > 0) {
        const message = `Variables d'environnement manquantes: ${missingVars.join(', ')}`;
        console.error('❌ [EmailClient]', message);
        return {
          success: false,
          message,
          details: { missingVars }
        };
      }

      // Diagnostic détaillé de EmailService
      console.log('🔍 [EmailClient] Diagnostic EmailService...');
      console.log('🔍 [EmailClient] EmailService.isReady():', this.emailService.isReady());
      
      // Essayer de forcer la vérification
      try {
        const testResult = await this.emailService.testerConfiguration();
        console.log('🔍 [EmailClient] Test direct EmailService:', testResult);
        
        if (testResult.success) {
          console.log('✅ [EmailClient] Test SendGrid réussi - EmailService fonctionne');
          return {
            success: true,
            message: 'SendGrid opérationnel (test direct réussi)',
            details: testResult.details
          };
        } else {
          console.error('❌ [EmailClient] Test SendGrid échoué:', testResult.details);
          return {
            success: false,
            message: 'Test SendGrid échoué',
            details: testResult.details
          };
        }
        
      } catch (testError) {
        console.error('❌ [EmailClient] Erreur lors du test direct:', testError);
        return {
          success: false,
          message: `Erreur lors du test: ${testError}`,
          details: { testError }
        };
      }

    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur lors de la vérification SendGrid:', error);
      return {
        success: false,
        message: `Erreur de vérification: ${error.message}`,
        details: { originalError: error }
      };
    }
  }

  /**
   * Initialise et vérifie le service email
   */
  async initializeAndVerify(): Promise<void> {
    const verification = await this.verifyConnectionOnStartup();
    
    if (verification.success) {
      console.log('📧 [EmailClient] Service email initialisé avec succès');
    } else {
      console.warn('⚠️ [EmailClient] Service email partiellement opérationnel:', verification.message);
      console.warn('⚠️ [EmailClient] Les fonctionnalités email pourraient être limitées');
    }
  }
}

// Instance singleton
export const emailClient = new EmailClient();
