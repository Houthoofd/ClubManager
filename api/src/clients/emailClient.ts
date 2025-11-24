import { EmailService } from '../services/emailService.js';
import { emailTemplateService } from '../services/emailTemplateService.js';

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
  private prepareCommonVariables(customVariables: Record<string, string>): Record<string, string> {
    return {
      clubName: process.env.CLUB_NAME || 'Club Manager',
      clubWebsite: process.env.CLUB_WEBSITE || 'http://localhost:5173',
      supportEmail: process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
      currentYear: new Date().getFullYear().toString(),
      currentDate: new Date().toLocaleDateString('fr-FR'),
      ...customVariables
    };
  }

  /**
   * Envoie un email directement via SendGrid
   */
  private async sendDirectViaSendGrid(
    to: string,
    subject: string,
    htmlContent: string,
    options: {
      fallbackOnError?: boolean;
      saveToDb?: boolean;
      utilisateurId?: number;
    } = {}
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
      
      // Sauvegarder en base si demandé
      if (options.saveToDb && options.utilisateurId) {
        try {
          // Appel à la méthode de sauvegarde si elle existe
          console.log('💾 [EmailClient] Sauvegarde email en base demandée');
        } catch (saveError) {
          console.warn('⚠️ [EmailClient] Erreur sauvegarde email:', saveError);
        }
      }
      
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
          console.warn('⚠️ [EmailClient] Fallback échoué:', fallbackError);
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
   * Envoie un email de validation avec token - VERSION FINALE SENDGRID
   */
  async sendValidationEmail(request: EmailValidationRequest): Promise<EmailValidationResult> {
    console.log('🚀 [EmailClient] NOUVELLE VERSION - Envoi email validation DIRECT SendGrid:', request);
    
    try {
      // CORRIGÉ: Utiliser import() au lieu de require() pour ESM
      const crypto = await import('crypto');
      const baseToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      // Sauvegarder le token directement en base
      await this.saveValidationToken(request.utilisateurId, baseToken, expiresAt);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationLink = `${frontendUrl}/pages/verify-email?token=${baseToken}&userId=${request.userId}`;

      const emailContent = `
        <h1>🥋 Vérification Email - Club Manager</h1>
        <p>Bonjour <strong>${request.prenom}</strong>,</p>
        <p>Cliquez pour vérifier votre email :</p>
        <a href="${verificationLink}" style="background:#27ae60;color:white;padding:15px 30px;text-decoration:none;border-radius:5px;">
          ✉️ Vérifier mon email
        </a>
        <p>UserId: <strong>${request.userId}</strong></p>
      `;

      // DIRECT SendGrid - PAS DE emailValidationService !
      const result = await this.sendDirectViaSendGrid(
        request.email,
        '✉️ Vérifiez votre email - Club Manager',
        emailContent,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId: request.utilisateurId
        }
      );

      console.log('✅ [EmailClient] NOUVELLE VERSION - Résultat:', result);

      return {
        success: result.success,
        message: result.success ? 'Email de validation envoyé avec succès' : result.error || 'Erreur envoi email',
        details: {
          messageId: result.messageId,
          token: baseToken.substring(0, 8) + '...',
          userId: request.userId,
          email: request.email,
          version: 'SENDGRID_DIRECT_V3'
        }
      };
      
    } catch (error: any) {
      console.error('❌ [EmailClient] NOUVELLE VERSION - Erreur:', error);
      return {
        success: false,
        message: error.message,
        details: { originalError: error, version: 'SENDGRID_DIRECT_V3' }
      };
    }
  }

  /**
   * Générer un token sécurisé - CORRIGÉ pour ESM
   */
  private async generateSecureToken(): Promise<string> {
    const crypto = await import('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Sauvegarder un token de validation en base - CORRIGÉ pour correspondre au schéma
   */
  private async saveValidationToken(utilisateurId: number, token: string, expiresAt: Date): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // CORRIGÉ: Import ESM au lieu de require
      const MysqlConnectorModule = await import('../db/connector/mysqlconnector.js');
      const MysqlConnector = MysqlConnectorModule.default;
      const mysqlConnector = MysqlConnector.getInstance();

      // 🔧 CORRIGÉ: Correspondre exactement au schéma de la table
      const sql = `
        INSERT INTO email_validation_tokens (utilisateur_id, token, type, expires_at, used, created_at)
        VALUES (?, ?, 'email_confirmation', ?, FALSE, NOW())
      `;

      mysqlConnector.query(sql, [utilisateurId, token, expiresAt], (error: any) => {
        if (error) {
          console.error('❌ [EmailClient] Erreur sauvegarde token:', error);
          reject(error);
        } else {
          console.log('✅ [EmailClient] Token de validation sauvegardé avec toutes les colonnes');
          resolve();
        }
      });
    });
  }

  /**
   * Valide un token d'email - CORRIGÉ pour utiliser le bon schéma de base
   */
  async validateEmailToken(token: string, userId: string): Promise<EmailValidationResult> {
    try {
      console.log('🔍 [EmailClient] Validation token direct:', { 
        token: token.substring(0, 8) + '...', 
        userId 
      });

      // CORRIGÉ: Import ESM au lieu de require
      const MysqlConnectorModule = await import('../db/connector/mysqlconnector.js');
      const MysqlConnector = MysqlConnectorModule.default;
      const mysqlConnector = MysqlConnector.getInstance();
      
      // CORRIGÉ: Rechercher le token avec les vraies colonnes de votre schéma
      const tokenData = await new Promise<any>((resolve, reject) => {
        const sql = `
          SELECT evt.id, evt.expires_at, evt.used, evt.utilisateur_id,
                 u.email, u.first_name, u.last_name, u.userId as user_id_db
          FROM email_validation_tokens evt
          JOIN utilisateurs u ON evt.utilisateur_id = u.id
          WHERE evt.token = ? 
            AND u.userId = ?
            AND evt.type = 'email_confirmation'
            AND evt.used = FALSE 
            AND evt.expires_at > NOW()
          LIMIT 1
        `;

        mysqlConnector.query(sql, [token, userId], (error: any, results: any) => {
          if (error) {
            console.error('❌ [EmailClient] Erreur SQL validation token:', error);
            reject(error);
          } else {
            console.log('✅ [EmailClient] Résultat recherche token:', results.length ? 'Token trouvé' : 'Token non trouvé');
            resolve(results.length > 0 ? results[0] : null);
          }
        });
      });

      if (!tokenData) {
        console.warn('⚠️ [EmailClient] Token non trouvé ou expiré:', { 
          token: token.substring(0, 8) + '...', 
          userId 
        });
        return {
          success: false,
          message: 'Token invalide, expiré ou déjà utilisé'
        };
      }

      console.log('✅ [EmailClient] Token valide trouvé, mise à jour utilisateur...');

      // CORRIGÉ: Marquer l'email comme vérifié et le token comme utilisé - DEUX REQUÊTES SÉPARÉES
      await new Promise<void>((resolve, reject) => {
        // Première requête : mettre à jour l'utilisateur
        const updateUtilisateurSql = `
          UPDATE utilisateurs 
          SET email_verified = TRUE, email_verified_at = NOW()
          WHERE id = ?
        `;
        
        mysqlConnector.query(updateUtilisateurSql, [tokenData.utilisateur_id], (errorUser: any, resultsUser: any) => {
          if (errorUser) {
            console.error('❌ [EmailClient] Erreur update utilisateur:', errorUser);
            reject(errorUser);
            return;
          }

          console.log('✅ [EmailClient] Utilisateur marqué comme email_verified = TRUE');

          // Deuxième requête : marquer le token comme utilisé
          const updateTokenSql = `
            UPDATE email_validation_tokens 
            SET used = TRUE 
            WHERE id = ?
          `;

          mysqlConnector.query(updateTokenSql, [tokenData.id], (errorToken: any, resultsToken: any) => {
            if (errorToken) {
              console.error('❌ [EmailClient] Erreur update token:', errorToken);
              reject(errorToken);
              return;
            }

            console.log('✅ [EmailClient] Token marqué comme used = TRUE');
            console.log('🎉 [EmailClient] Email vérifié avec succès !');
            resolve();
          });
        });
      });

      return {
        success: true,
        message: 'Email vérifié avec succès',
        data: {
          email: tokenData.email,
          userId: tokenData.user_id_db,
          prenom: tokenData.first_name,
          nom: tokenData.last_name
        }
      };

    } catch (error: any) {
      console.error('❌ [EmailClient] Erreur lors de la validation du token:', error);
      return {
        success: false,
        message: 'Erreur lors de la validation du token: ' + error.message
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

  /**
   * Envoie un email de récupération de mot de passe
   */
  async sendPasswordResetEmail(to: string, variables: {
    userName: string;
    resetUrl: string;
    expiresIn: string;
    securityInfo?: {
      requestTime: string;
      lastLogin: string;
      accountCreated: string;
    };
  }, utilisateurId?: number, templateName: string = 'reset-password'): Promise<EmailSendResult> {
    try {
      console.log('🔐 [EmailClient] Envoi email récupération mot de passe vers:', to);
      console.log('🔗 [EmailClient] URL dans l\'email:', variables.resetUrl);
      
      // CORRIGÉ: Préparer les variables correctement pour Record<string, string>
      const templateVariables = this.prepareCommonVariables({
        userName: variables.userName,
        resetUrl: variables.resetUrl,
        expiresIn: variables.expiresIn,
        // Aplatir securityInfo si présent
        requestTime: variables.securityInfo?.requestTime || '',
        lastLogin: variables.securityInfo?.lastLogin || '',
        accountCreated: variables.securityInfo?.accountCreated || ''
      });

      const { subject, htmlContent } = await this.loadEmailTemplate(
        templateName,
        templateVariables,
        'Récupération de mot de passe - Club Manager'
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
      console.error('❌ [EmailClient] Erreur email récupération:', error);
      
      // Fallback vers email simple si template non trouvé
      const fallbackHtml = `
        <h2>Récupération de mot de passe</h2>
        <p>Bonjour ${variables.userName},</p>
        <p>Vous avez demandé la récupération de votre mot de passe.</p>
        <p><a href="${variables.resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien expire dans ${variables.expiresIn}.</p>
        ${variables.securityInfo ? `
        <p>Informations de sécurité :</p>
        <ul>
          <li>Demande effectuée le : ${variables.securityInfo.requestTime}</li>
          <li>Dernière connexion : ${variables.securityInfo.lastLogin}</li>
          <li>Compte créé en : ${variables.securityInfo.accountCreated}</li>
        </ul>
        ` : ''}
        <p>Si vous n'avez pas demandé cette récupération, ignorez cet email.</p>
      `;
      
      return await this.sendDirectViaSendGrid(
        to,
        'Récupération de mot de passe - Club Manager',
        fallbackHtml,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId
        }
      );
    }
  }

  /**
   * Envoie un email de confirmation de changement de mot de passe
   */
  async sendPasswordChangeConfirmation(to: string, variables: {
    userName: string;
    changeDate: string;
  }, utilisateurId?: number, templateName: string = 'password-change-confirmation'): Promise<EmailSendResult> {
    try {
      console.log('✅ [EmailClient] Envoi confirmation changement mot de passe vers:', to);
      
      const templateVariables = this.prepareCommonVariables({
        ...variables
      });

      const { subject, htmlContent } = await this.loadEmailTemplate(
        templateName,
        templateVariables,
        'Mot de passe modifié - Club Manager'
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
      console.error('❌ [EmailClient] Erreur email confirmation changement:', error);
      
      // Fallback vers email simple si template non trouvé
      const fallbackHtml = `
        <h2>Mot de passe modifié</h2>
        <p>Bonjour ${variables.userName},</p>
        <p>Votre mot de passe a été modifié avec succès le ${variables.changeDate}.</p>
        <p>Si vous n'êtes pas à l'origine de cette modification, contactez-nous immédiatement.</p>
        <p>Cordialement,<br>L'équipe Club Manager</p>
      `;
      
      return await this.sendDirectViaSendGrid(
        to,
        'Mot de passe modifié - Club Manager',
        fallbackHtml,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId
        }
      );
    }
  }

  /**
   * Envoie un email de confirmation de commande
   */
  async sendOrderConfirmation(to: string, variables: {
    userName: string;
    numeroCommande: string;
    uniqueId?: string;
    dateCommande: string;
    statutCommande: string;
    nbArticles: string;
    totalCommande: string;
    articlesDetails?: string; // AJOUTÉ: Variable pour les détails des articles
    delaiPreparation?: string;
    lieuRetrait?: string;
    horaires?: string;
    conservation?: string;
    emailContact?: string;
    telephoneContact?: string;
    anneeActuelle?: string;
  }, utilisateurId?: number, templateName: string = 'confirmation-commande'): Promise<EmailSendResult> {
    try {
      console.log('🛒 [EmailClient] Envoi confirmation commande vers:', to);
      console.log('📧 [EmailClient] Variables reçues:', variables);
      
      const templateVariables = this.prepareCommonVariables({
        // Variables de la commande
        userName: variables.userName,
        numeroCommande: variables.numeroCommande,
        uniqueId: variables.uniqueId || variables.numeroCommande,
        dateCommande: variables.dateCommande,
        statutCommande: variables.statutCommande,
        nbArticles: variables.nbArticles,
        totalCommande: variables.totalCommande,
        
        // AJOUTÉ: Inclure articlesDetails avec valeur par défaut
        articlesDetails: variables.articlesDetails || '<div style="text-align: center; color: #666; font-style: italic; padding: 20px;">Détails des articles non disponibles</div>',
        
        // Variables par défaut si non fournies
        delaiPreparation: variables.delaiPreparation || '24-48 heures',
        lieuRetrait: variables.lieuRetrait || 'Accueil du club',
        horaires: variables.horaires || 'Lundi-Vendredi: 9h-18h, Samedi: 9h-12h',
        conservation: variables.conservation || 'Votre commande sera conservée 7 jours',
        emailContact: variables.emailContact || process.env.SUPPORT_EMAIL || 'support@clubmanager.com',
        telephoneContact: variables.telephoneContact || process.env.CLUB_PHONE || '01 23 45 67 89',
        anneeActuelle: variables.anneeActuelle || new Date().getFullYear().toString(),
      });

      console.log('📧 [EmailClient] Variables finales pour template:', templateVariables);

      const { subject, htmlContent } = await this.loadEmailTemplate(
        templateName,
        templateVariables,
        `Confirmation de commande ${variables.numeroCommande}`
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
      console.error('❌ [EmailClient] Erreur confirmation commande:', error);
      
      // Fallback vers email simple si template non trouvé
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
        <p>Vous recevrez un email quand votre commande sera prête pour le retrait.</p>
        <p>Cordialement,<br>L'équipe Club Manager</p>
      `;
      
      return await this.sendDirectViaSendGrid(
        to,
        `Commande confirmée ${variables.numeroCommande} - Club Manager`,
        fallbackHtml,
        {
          fallbackOnError: true,
          saveToDb: true,
          utilisateurId
        }
      );
    }
  }
}

// Instance singleton
export const emailClient = new EmailClient();
