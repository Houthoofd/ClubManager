import MysqlConnector from '../../connector/mysqlconnector.js';
import { EmailService } from '../../../services/emailService.js';
import { EmailTemplateService } from '../../../services/emailTemplateService.js';
export class MessageClient {
    mysqlConnector;
    emailService;
    templateService;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
        this.emailService = new EmailService();
        this.templateService = new EmailTemplateService();
    }
    // Sauvegarder un message en base de données
    async saveMessageToDatabase(messageData) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO messages (
          utilisateur_id, type_message, contenu, status_envoi, 
          email_recipient, sendgrid_message_id, error_details, date_creation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;
            const values = [
                messageData.utilisateur_id,
                messageData.type_message,
                messageData.contenu,
                messageData.status_envoi,
                messageData.email_recipient || null,
                messageData.sendgrid_message_id || null,
                messageData.error_details || null
            ];
            this.mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('❌ [MessageClient] Erreur sauvegarde message:', error);
                    reject(error);
                }
                else {
                    console.log('✅ [MessageClient] Message sauvegardé avec ID:', results.insertId);
                    resolve(results.insertId);
                }
            });
        });
    }
    // Mettre à jour le statut d'un message
    async updateMessageStatus(messageId, status, sendgridMessageId, errorDetails) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE messages 
        SET status_envoi = ?, sendgrid_message_id = ?, error_details = ?, date_envoi = NOW()
        WHERE id = ?
      `;
            this.mysqlConnector.query(sql, [status, sendgridMessageId, errorDetails, messageId], (error) => {
                if (error) {
                    console.error('❌ [MessageClient] Erreur mise à jour statut:', error);
                    reject(error);
                }
                else {
                    console.log(`✅ [MessageClient] Statut message ${messageId} mis à jour: ${status}`);
                    resolve();
                }
            });
        });
    }
    // Envoyer l'email de bienvenue avec template personnalisé
    async envoyerEmailBienvenue(data) {
        try {
            console.log('📧 [MessageClient] Envoi email de bienvenue pour:', data.email);
            // Récupérer ou créer le template de bienvenue
            const template = await this.templateService.getWelcomeTemplate({
                userName: `${data.prenom} ${data.nom}`,
                userId: data.userId,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/connexion`
            });
            let dbMessageId;
            // Sauvegarder en base si demandé
            if (data.saveToDb) {
                dbMessageId = await this.saveMessageToDatabase({
                    utilisateur_id: data.utilisateurId,
                    type_message: 'welcome_email',
                    contenu: template.html,
                    status_envoi: 'pending',
                    email_recipient: data.email
                });
            }
            // Envoyer l'email via SendGrid
            const emailResult = await this.emailService.envoyerEmailBienvenue(data.email, data.prenom, data.nom, data.userId);
            // Mettre à jour le statut en base si sauvegardé
            if (data.saveToDb && dbMessageId) {
                await this.updateMessageStatus(dbMessageId, emailResult.success ? 'sent' : 'failed', emailResult.messageId, emailResult.error);
            }
            return {
                success: emailResult.success,
                messageId: emailResult.messageId,
                error: emailResult.error,
                details: emailResult.details,
                dbMessageId
            };
        }
        catch (error) {
            console.error('❌ [MessageClient] Erreur envoi email bienvenue:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    // Envoyer l'email de validation avec tokens
    async envoyerValidationEmail(data) {
        try {
            console.log('📧 [MessageClient] Envoi email de validation pour:', data.email);
            // Créer le template de validation avec les tokens
            const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/confirm-email?token=${data.confirmationToken}`;
            const passwordSetupUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/setup-password?token=${data.passwordSetupToken}`;
            const template = await this.createValidationEmailTemplate({
                prenom: data.prenom,
                userId: data.userId,
                confirmationUrl,
                passwordSetupUrl
            });
            let dbMessageId;
            // Sauvegarder en base si demandé
            if (data.saveToDb) {
                dbMessageId = await this.saveMessageToDatabase({
                    utilisateur_id: data.utilisateurId,
                    type_message: 'email_validation',
                    contenu: template.html,
                    status_envoi: 'pending',
                    email_recipient: data.email
                });
            }
            // Envoyer l'email
            const emailResult = await this.emailService.envoyerEmailPersonnalise({
                to: data.email,
                subject: template.subject,
                html: template.html,
                text: template.text
            });
            // Mettre à jour le statut en base si sauvegardé
            if (data.saveToDb && dbMessageId) {
                await this.updateMessageStatus(dbMessageId, emailResult.success ? 'sent' : 'failed', emailResult.messageId, emailResult.error);
            }
            return {
                success: emailResult.success,
                messageId: emailResult.messageId,
                error: emailResult.error,
                details: emailResult.details,
                dbMessageId
            };
        }
        catch (error) {
            console.error('❌ [MessageClient] Erreur envoi email validation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    // Envoyer l'email de récupération d'UserId
    async envoyerRecuperationUserId(data) {
        try {
            console.log('📧 [MessageClient] Envoi email récupération UserId pour:', data.email);
            // Créer le template de récupération
            const template = await this.createUserIdRecoveryTemplate({
                prenom: data.prenom,
                userId: data.userId,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/connexion`
            });
            let dbMessageId;
            // Sauvegarder en base si demandé
            if (data.saveToDb) {
                dbMessageId = await this.saveMessageToDatabase({
                    utilisateur_id: data.utilisateurId,
                    type_message: 'userid_recovery',
                    contenu: template.html,
                    status_envoi: 'pending',
                    email_recipient: data.email
                });
            }
            // Envoyer l'email
            const emailResult = await this.emailService.envoyerEmailPersonnalise({
                to: data.email,
                subject: template.subject,
                html: template.html,
                text: template.text
            });
            // Mettre à jour le statut en base si sauvegardé
            if (data.saveToDb && dbMessageId) {
                await this.updateMessageStatus(dbMessageId, emailResult.success ? 'sent' : 'failed', emailResult.messageId, emailResult.error);
            }
            return {
                success: emailResult.success,
                messageId: emailResult.messageId,
                error: emailResult.error,
                details: emailResult.details,
                dbMessageId
            };
        }
        catch (error) {
            console.error('❌ [MessageClient] Erreur envoi récupération UserId:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    // Créer le template d'email de validation
    async createValidationEmailTemplate(data) {
        const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmez votre email - Club Manager</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e74c3c; }
            .logo { font-size: 2.5em; margin-bottom: 10px; }
            .title { color: #e74c3c; margin: 0; font-size: 1.8em; }
            .button { display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 10px; font-weight: bold; }
            .button.secondary { background-color: #2ecc71; }
            .info-box { background-color: #e8f4fd; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🥋</div>
                <h1 class="title">Club Manager</h1>
                <p>Confirmez votre inscription</p>
            </div>
            
            <h2>Bonjour ${data.prenom} !</h2>
            
            <p>Votre compte Club Manager a été créé avec succès !</p>
            <p><strong>Votre identifiant unique : ${data.userId}</strong></p>
            
            <div class="info-box">
                <h3>🔧 Finalisation de votre compte</h3>
                <p>Pour compléter votre inscription, vous devez :</p>
                <ol>
                    <li><strong>Confirmer votre adresse email</strong></li>
                    <li><strong>Configurer votre mot de passe définitif</strong></li>
                </ol>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmationUrl}" class="button">
                    ✅ Confirmer mon email
                </a>
                <a href="${data.passwordSetupUrl}" class="button secondary">
                    🔐 Configurer mon mot de passe
                </a>
            </div>
            
            <div class="info-box">
                <p><strong>⚠️ Important :</strong></p>
                <ul>
                    <li>Ces liens expirent dans 24h (confirmation) et 7 jours (mot de passe)</li>
                    <li>Vous devez effectuer ces deux étapes pour accéder à votre compte</li>
                    <li>Si les boutons ne fonctionnent pas, copiez-collez les liens dans votre navigateur</li>
                </ul>
            </div>
            
            <div class="footer">
                <p><strong>Club Manager</strong> - Votre plateforme de gestion sportive</p>
                <p>Support : <a href="mailto:support@clubmanager.fr">support@clubmanager.fr</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
        const text = `
Bonjour ${data.prenom} !

Votre compte Club Manager a été créé avec succès !
Votre identifiant unique : ${data.userId}

Pour finaliser votre inscription :

1. Confirmez votre email : ${data.confirmationUrl}
2. Configurez votre mot de passe : ${data.passwordSetupUrl}

Ces étapes sont obligatoires pour accéder à votre compte.

Club Manager - Votre plateforme de gestion sportive
Support : support@clubmanager.fr
    `;
        return {
            subject: `🥋 Confirmez votre inscription Club Manager - ${data.userId}`,
            html,
            text
        };
    }
    // Créer le template de récupération d'UserId
    async createUserIdRecoveryTemplate(data) {
        const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Récupération UserId - Club Manager</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
            .container { background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e74c3c; }
            .logo { font-size: 2.5em; margin-bottom: 10px; }
            .title { color: #e74c3c; margin: 0; font-size: 1.8em; }
            .userid-box { background-color: #f8f9fa; border: 2px solid #e74c3c; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
            .userid-value { font-family: monospace; font-size: 1.5em; font-weight: bold; background-color: #e9ecef; padding: 10px; border-radius: 5px; }
            .button { display: inline-block; background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🥋</div>
                <h1 class="title">Club Manager</h1>
                <p>Récupération de votre identifiant</p>
            </div>
            
            <h2>Bonjour ${data.prenom} !</h2>
            
            <p>Vous avez demandé la récupération de votre identifiant Club Manager.</p>
            
            <div class="userid-box">
                <h3>🆔 Votre identifiant unique</h3>
                <div class="userid-value">${data.userId}</div>
            </div>
            
            <p>Utilisez cet identifiant pour vous connecter à votre compte Club Manager.</p>
            
            <div style="text-align: center;">
                <a href="${data.loginUrl}" class="button">
                    🚀 Se connecter maintenant
                </a>
            </div>
            
            <p><strong>⚠️ Sécurité :</strong> Si vous n'avez pas demandé cette récupération, ignorez cet email et contactez notre support.</p>
            
            <div class="footer">
                <p><strong>Club Manager</strong> - Votre plateforme de gestion sportive</p>
                <p>Support : <a href="mailto:support@clubmanager.fr">support@clubmanager.fr</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
        const text = `
Bonjour ${data.prenom} !

Récupération de votre identifiant Club Manager :

🆔 Votre identifiant unique : ${data.userId}

Utilisez cet identifiant pour vous connecter : ${data.loginUrl}

Si vous n'avez pas demandé cette récupération, ignorez cet email.

Club Manager - Support : support@clubmanager.fr
    `;
        return {
            subject: `🆔 Récupération de votre identifiant Club Manager`,
            html,
            text
        };
    }
    // Récupérer l'historique des messages d'un utilisateur
    async getMessageHistory(utilisateurId, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          id, type_message, email_recipient, status_envoi,
          sendgrid_message_id, error_details, date_creation, date_envoi
        FROM messages
        WHERE utilisateur_id = ?
        ORDER BY date_creation DESC
        LIMIT ?
      `;
            this.mysqlConnector.query(sql, [utilisateurId, limit], (error, results) => {
                if (error) {
                    console.error('❌ [MessageClient] Erreur récupération historique:', error);
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    // Tester la configuration email
    async testerConfiguration() {
        return this.emailService.testerConfiguration();
    }
}
// Instance singleton
export const messageClient = new MessageClient();
