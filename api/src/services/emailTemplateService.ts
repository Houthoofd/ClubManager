import MysqlConnector from '../db/connector/mysqlconnector.js';
import { EmailTemplate } from '../types/emailTypes.js';

export interface DbEmailTemplate {
  id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface TemplateVariable {
  key: string;
  value: string;
}

export class EmailTemplateService {
  private mysqlConnector: MysqlConnector;
  private initialized: boolean = false;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
    // Ne pas initialiser automatiquement
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.syncDefaultTemplates();
    }
  }

  async syncDefaultTemplates(): Promise<void> {
    if (this.initialized) {
      console.log('✅ [EmailTemplateService] Déjà initialisé');
      return;
    }

    try {
      console.log('🔄 [EmailTemplateService] Synchronisation des templates...');
      
      // Attendre que la DB soit disponible
      await this.waitForDatabase();
      
      // Vérifier que la table existe, sinon la créer
      await this.ensureTableExists();
      
      // Logique de synchronisation des templates par défaut
      const defaultTemplates = this.getDefaultTemplates();
      
      for (const template of defaultTemplates) {
        try {
          await this.upsertTemplate(template.title, template.content);
        } catch (templateError) {
          console.warn(`⚠️ [EmailTemplateService] Erreur template "${template.title}":`, templateError);
          // Continuer avec les autres templates
        }
      }
      
      this.initialized = true;
      console.log('✅ [EmailTemplateService] Templates synchronisés');
    } catch (error) {
      console.error('❌ [EmailTemplateService] Erreur synchronisation:', error);
      // NE PAS marquer comme initialisé en cas d'erreur
      throw error;
    }
  }

  private async waitForDatabase(maxRetries: number = 5, delayMs: number = 500): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await new Promise((resolve, reject) => {
          this.mysqlConnector.query('SELECT 1', [], (error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        });
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error('Base de données non disponible pour EmailTemplateService');
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  private async ensureTableExists(): Promise<void> {
    return new Promise((resolve, reject) => {
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS types_messages_personnalises (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL UNIQUE,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      this.mysqlConnector.query(createTableSql, [], (error, results) => {
        if (error) {
          console.error('❌ Erreur création table templates:', error);
          reject(error);
        } else {
          console.log('✅ Table types_messages_personnalises prête');
          resolve(results);
        }
      });
    });
  }

  private async upsertTemplate(title: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO types_messages_personnalises (title, content)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        content = VALUES(content),
        updated_at = CURRENT_TIMESTAMP
      `;
      
      this.mysqlConnector.query(sql, [title, content], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  private getDefaultTemplates(): Array<{title: string, content: string}> {
    return [
      {
        title: 'Bienvenue',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2c3e50;">🥋 Bienvenue {{userName}} !</h1>
            <p>Nous sommes ravis de vous accueillir dans notre club.</p>
            <p><strong>Votre identifiant :</strong> {{userId}}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{loginUrl}}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Se connecter
              </a>
            </div>
          </div>
        `
      },
      {
        title: 'Validation email',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #3498db;">✉️ Confirmez votre email</h1>
            <p>Bonjour {{prenom}},</p>
            <p>Veuillez confirmer votre adresse email en cliquant sur le lien ci-dessous :</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{confirmationUrl}}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Confirmer mon email
              </a>
            </div>
          </div>
        `
      },
      {
        title: 'Notification cours',
        content: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #e74c3c;">📅 {{action}}</h1>
            <p>Bonjour {{userName}},</p>
            <p><strong>Cours :</strong> {{courseType}}</p>
            <p><strong>Date :</strong> {{courseDate}}</p>
            <p><strong>Heure :</strong> {{courseTime}}</p>
            <p><strong>Professeur :</strong> {{instructor}}</p>
          </div>
        `
      }
    ];
  }

  // Récupérer tous les templates depuis la DB
  async getAllTemplates(): Promise<DbEmailTemplate[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, title, content, created_at, updated_at
        FROM types_messages_personnalises
        ORDER BY title ASC
      `;
      
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('❌ Erreur récupération templates:', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Récupérer un template par titre
  async getTemplateByTitle(title: string): Promise<DbEmailTemplate | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, title, content, created_at, updated_at
        FROM types_messages_personnalises
        WHERE title = ?
        LIMIT 1
      `;
      
      this.mysqlConnector.query(sql, [title], (error, results) => {
        if (error) {
          console.error('❌ Erreur récupération template:', error);
          reject(error);
        } else {
          resolve(results.length > 0 ? results[0] : null);
        }
      });
    });
  }

  // Récupérer un template par ID
  async getTemplateById(id: number): Promise<DbEmailTemplate | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, title, content, created_at, updated_at
        FROM types_messages_personnalises
        WHERE id = ?
        LIMIT 1
      `;
      
      this.mysqlConnector.query(sql, [id], (error, results) => {
        if (error) {
          console.error('❌ Erreur récupération template:', error);
          reject(error);
        } else {
          resolve(results.length > 0 ? results[0] : null);
        }
      });
    });
  }

  // NOUVELLE MÉTHODE : Créer un template
  async createTemplate(title: string, content: string): Promise<number> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO types_messages_personnalises (title, content)
        VALUES (?, ?)
      `;
      
      this.mysqlConnector.query(sql, [title, content], (error, results) => {
        if (error) {
          console.error('❌ Erreur création template:', error);
          reject(error);
        } else {
          console.log('✅ Template créé avec ID:', results.insertId);
          resolve(results.insertId);
        }
      });
    });
  }

  // NOUVELLE MÉTHODE : Mettre à jour un template
  async updateTemplate(id: number, title: string, content: string): Promise<boolean> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE types_messages_personnalises
        SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.mysqlConnector.query(sql, [title, content, id], (error, results) => {
        if (error) {
          console.error('❌ Erreur mise à jour template:', error);
          reject(error);
        } else {
          const success = results.affectedRows > 0;
          if (success) {
            console.log('✅ Template mis à jour, ID:', id);
          } else {
            console.warn('⚠️ Aucun template trouvé avec ID:', id);
          }
          resolve(success);
        }
      });
    });
  }

  // NOUVELLE MÉTHODE : Supprimer un template
  async deleteTemplate(id: number): Promise<boolean> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const sql = `
        DELETE FROM types_messages_personnalises
        WHERE id = ?
      `;
      
      this.mysqlConnector.query(sql, [id], (error, results) => {
        if (error) {
          console.error('❌ Erreur suppression template:', error);
          reject(error);
        } else {
          const success = results.affectedRows > 0;
          if (success) {
            console.log('✅ Template supprimé, ID:', id);
          } else {
            console.warn('⚠️ Aucun template trouvé avec ID:', id);
          }
          resolve(success);
        }
      });
    });
  }

  // Traiter un template avec des variables
  processTemplate(content: string, variables: Record<string, string>): EmailTemplate {
    let processedHtml = content;
    let processedText = content;

    // Remplacer les variables dans le contenu
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedHtml = processedHtml.replace(regex, variables[key]);
    });

    // Générer une version texte depuis le HTML
    processedText = processedHtml
      .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
      .replace(/\s+/g, ' ')    // Normaliser les espaces
      .trim();

    // Extraire le sujet (première ligne ou titre)
    const titleMatch = processedHtml.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const subject = titleMatch 
      ? titleMatch[1].replace(/<[^>]*>/g, '').trim()
      : `Message de ${process.env.EMAIL_FROM_NAME || 'Club Manager'}`;

    return {
      subject,
      text: processedText,
      html: processedHtml
    };
  }

  // Méthodes utilitaires pour traiter les templates prédéfinis par type
  async getWelcomeTemplate(variables: {
    userName: string;
    userId?: string;
    loginUrl?: string;
  }): Promise<EmailTemplate> {
    const template = await this.getTemplateByTitle('Bienvenue');
    
    if (template) {
      return this.processTemplate(template.content, {
        ...variables, // Spread d'abord les variables passées
        userId: variables.userId || 'Non fourni',
        loginUrl: variables.loginUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/connexion`
      });
    }

    // Template par défaut si non trouvé en DB
    return this.createDefaultWelcomeTemplate(variables);
  }

  async getPasswordResetTemplate(variables: {
    userName: string;
    resetUrl: string;
    expiryHours?: string;
  }): Promise<EmailTemplate> {
    const template = await this.getTemplateByTitle('Réinitialisation mot de passe');
    
    if (template) {
      return this.processTemplate(template.content, {
        ...variables, // Spread d'abord les variables passées
        expiryHours: variables.expiryHours || '24'
      });
    }

    return this.createDefaultPasswordResetTemplate(variables);
  }

  async getCourseNotificationTemplate(variables: {
    userName: string;
    action: string;
    courseType: string;
    courseDate: string;
    courseTime: string;
    instructor?: string;
  }): Promise<EmailTemplate> {
    const templateName = `Notification cours - ${variables.action}`;
    let template = await this.getTemplateByTitle(templateName);
    
    // Fallback vers template générique
    if (!template) {
      template = await this.getTemplateByTitle('Notification cours');
    }
    
    if (template) {
      return this.processTemplate(template.content, variables);
    }

    return this.createDefaultCourseNotificationTemplate(variables);
  }

  async getPaymentReminderTemplate(level: 1 | 2 | 3, variables: {
    userName: string;
    amount?: string;
    dueDate?: string;
  }): Promise<EmailTemplate> {
    const templateNames = {
      1: 'Rappel 1 - Facture impayée',
      2: 'Rappel 2 - Facture toujours en attente', 
      3: 'Dernier rappel - Suspension possible'
    };
    
    const template = await this.getTemplateByTitle(templateNames[level]);
    
    if (template) {
      return this.processTemplate(template.content, variables);
    }

    return this.createDefaultPaymentReminderTemplate(level, variables);
  }

  async getPaymentConfirmationTemplate(variables: {
    userName: string;
    amount: string;
    paymentDate: string;
  }): Promise<EmailTemplate> {
    const template = await this.getTemplateByTitle('Confirmation de paiement reçu');
    
    if (template) {
      return this.processTemplate(template.content, variables);
    }

    return this.createDefaultPaymentConfirmationTemplate(variables);
  }

  async getEmailValidationTemplate(variables: {
    prenom: string;
    email: string;
    userId: string;
    confirmationUrl: string;
    passwordSetupUrl?: string;
  }): Promise<EmailTemplate> {
    const template = await this.getTemplateByTitle('Validation email');
    
    if (template) {
      return this.processTemplate(template.content, variables);
    }

    return this.createDefaultEmailValidationTemplate(variables);
  }

  // Templates par défaut si non trouvés en DB
  private createDefaultWelcomeTemplate(variables: {
    userName: string;
    userId?: string;
    loginUrl?: string;
  }): EmailTemplate {
    return {
      subject: `Bienvenue au Club Manager, ${variables.userName} !`,
      text: `Bonjour ${variables.userName},\n\nBienvenue dans notre club ! ${variables.userId ? `Votre identifiant unique est : ${variables.userId}` : ''}\n\nConnectez-vous : ${variables.loginUrl}\n\nÀ bientôt !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">🥋 Bienvenue ${variables.userName} !</h2>
          <p>Félicitations ! Votre inscription à notre club a été confirmée.</p>
          ${variables.userId ? `<p><strong>Votre identifiant unique :</strong> ${variables.userId}</p>` : ''}
          <p><a href="${variables.loginUrl}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Se connecter</a></p>
        </div>
      `
    };
  }

  private createDefaultPasswordResetTemplate(variables: {
    userName: string;
    resetUrl: string;
    expiryHours?: string;
  }): EmailTemplate {
    return {
      subject: 'Réinitialisation de votre mot de passe - Club Manager',
      text: `Bonjour ${variables.userName},\n\nCliquez sur ce lien pour réinitialiser votre mot de passe :\n${variables.resetUrl}\n\nCe lien expire dans ${variables.expiryHours || '24'} heures.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e74c3c;">🔒 Réinitialisation de mot de passe</h2>
          <p>Bonjour ${variables.userName},</p>
          <p><a href="${variables.resetUrl}" style="background: #e74c3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a></p>
          <p><small>Ce lien expire dans ${variables.expiryHours || '24'} heures.</small></p>
        </div>
      `
    };
  }

  private createDefaultCourseNotificationTemplate(variables: {
    userName: string;
    action: string;
    courseType: string;
    courseDate: string;
    courseTime: string;
    instructor?: string;
  }): EmailTemplate {
    return {
      subject: `${variables.action} - ${variables.courseType}`,
      text: `Bonjour ${variables.userName},\n\n${variables.action} : ${variables.courseType}\nDate : ${variables.courseDate} à ${variables.courseTime}\n${variables.instructor ? `Professeur : ${variables.instructor}` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #3498db;">📅 ${variables.action}</h2>
          <p>Bonjour ${variables.userName},</p>
          <div style="background: #ecf0f1; padding: 15px; border-radius: 5px;">
            <p><strong>Cours :</strong> ${variables.courseType}</p>
            <p><strong>Date :</strong> ${variables.courseDate} à ${variables.courseTime}</p>
            ${variables.instructor ? `<p><strong>Professeur :</strong> ${variables.instructor}</p>` : ''}
          </div>
        </div>
      `
    };
  }

  private createDefaultPaymentReminderTemplate(level: 1 | 2 | 3, variables: {
    userName: string;
    amount?: string;
    dueDate?: string;
  }): EmailTemplate {
    const urgencyLevel = {
      1: { emoji: '💳', color: '#f39c12', title: 'Rappel de paiement' },
      2: { emoji: '⚠️', color: '#e67e22', title: 'Rappel urgent de paiement' },
      3: { emoji: '🚨', color: '#e74c3c', title: 'Dernier rappel - Suspension possible' }
    };

    const current = urgencyLevel[level];

    return {
      subject: `${current.title} - Club Manager`,
      text: `Bonjour ${variables.userName},\n\nNous vous rappelons que votre paiement${variables.amount ? ` de ${variables.amount}` : ''} reste en attente.\n\nMerci de régulariser votre situation.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${current.color};">${current.emoji} ${current.title}</h2>
          <p>Bonjour ${variables.userName},</p>
          <p>Nous vous rappelons que votre paiement${variables.amount ? ` de <strong>${variables.amount}</strong>` : ''} reste en attente.</p>
          ${level === 3 ? '<p style="color: #e74c3c;"><strong>Sans régularisation dans les 5 jours, nous serons contraints de suspendre votre accès.</strong></p>' : ''}
        </div>
      `
    };
  }

  private createDefaultPaymentConfirmationTemplate(variables: {
    userName: string;
    amount: string;
    paymentDate: string;
  }): EmailTemplate {
    return {
      subject: 'Confirmation de paiement - Club Manager',
      text: `Bonjour ${variables.userName},\n\nNous avons bien reçu votre paiement de ${variables.amount} le ${variables.paymentDate}.\n\nMerci !`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #27ae60;">✅ Paiement confirmé</h2>
          <p>Bonjour ${variables.userName},</p>
          <p>Nous avons bien reçu votre paiement de <strong>${variables.amount}</strong> le ${variables.paymentDate}.</p>
          <p>Merci !</p>
        </div>
      `
    };
  }

  private createDefaultEmailValidationTemplate(variables: {
    prenom: string;
    email: string;
    userId: string;
    confirmationUrl: string;
    passwordSetupUrl?: string;
  }): EmailTemplate {
    return {
      subject: 'Confirmez votre email - Club Manager',
      text: `Bonjour ${variables.prenom},\n\nMerci pour votre inscription ! Votre compte a été créé avec succès.\n\nVoici vos identifiants de connexion :\n- Email : ${variables.email}\n- UserId : ${variables.userId}\n- Mot de passe : ${variables.passwordSetupUrl || 'À définir lors de la première connexion'}\n\nCliquez ici pour confirmer votre email et activer votre compte :\n${variables.confirmationUrl}\n\nÀ bientôt sur les tatamis !\nL'équipe de ClubManager`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🥋 Club Manager</h1>
              <h2 style="color: #3498db; margin: 10px 0 0 0; font-size: 22px;">Confirmez votre email</h2>
            </div>
            
            <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                Bonjour <strong>${variables.prenom}</strong>,
              </p>
              <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                Merci pour votre inscription ! Votre compte a été créé avec succès.
              </p>
              
              <div style="background-color: #3498db; color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: white;">📋 Vos identifiants de connexion :</p>
                <p style="margin: 10px 0 5px 0; color: white;"><strong>Email :</strong> ${variables.email}</p>
                <p style="margin: 5px 0; color: white;"><strong>UserId :</strong> ${variables.userId}</p>
                <p style="margin: 5px 0 0 0; color: white; font-size: 12px;">(à utiliser pour les mineurs ou si plusieurs membres partagent cet email)</p>
                ${variables.passwordSetupUrl ? 
                  `<p style="margin: 10px 0 0 0; color: white;"><strong>Mot de passe :</strong> <a href="${variables.passwordSetupUrl}" style="color: #ecf0f1; text-decoration: underline;">Cliquez ici pour définir votre mot de passe</a></p>` :
                  `<p style="margin: 10px 0 0 0; color: white;"><strong>Mot de passe :</strong> À définir lors de la première connexion</p>`
                }
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${variables.confirmationUrl}" 
                 style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
                ✉️ Confirmer mon email et activer mon compte
              </a>
            </div>

            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Important :</strong> Vous devez confirmer votre email avant de pouvoir vous connecter à votre compte.
              </p>
            </div>

            <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center;">
              <p style="margin: 0;">À bientôt sur les tatamis !</p>
              <p style="margin: 10px 0 0 0;"><strong>L'équipe de ClubManager</strong></p>
              <p style="margin: 15px 0 0 0; font-size: 12px;">
                Cet email a été envoyé automatiquement. Si vous n'avez pas créé de compte, ignorez cet email.
              </p>
            </div>
          </div>
        </div>
      `
    };
  }

  // Méthodes utilitaires
  private textToHtml(text: string): string {
    if (text.includes('<') && text.includes('>')) {
      return text; // Déjà du HTML
    }
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          ${text.replace(/\n/g, '<br>')}
          <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center;">
            <p style="margin: 0;">Cet email a été envoyé automatiquement par Club Manager</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Club Manager - Tous droits réservés</p>
          </div>
        </div>
      </div>
    `;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

// Instance singleton
export const emailTemplateService = new EmailTemplateService();
