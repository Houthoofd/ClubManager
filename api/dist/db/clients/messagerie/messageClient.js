import { EmailService } from '../../../services/emailService.js';
import { emailTemplateService } from '../../../services/emailTemplateService.js';
import { emailValidationService } from '../../../services/emailValidationService.js';
import { EmailUtils } from '../../../utils/emailUtils.js';
import MysqlConnector from '../../connector/mysqlconnector.js';
export class MessageClient {
    static instance;
    mysqlConnector;
    initialized = false;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
        // Ne pas initialiser automatiquement ici
    }
    static getInstance() {
        if (!MessageClient.instance) {
            MessageClient.instance = new MessageClient();
        }
        return MessageClient.instance;
    }
    // Méthode pour vérifier si l'initialisation est nécessaire
    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialiser();
        }
    }
    // ========== ENVOI D'EMAILS AVEC TEMPLATES DB ==========
    // Méthode unifiée d'envoi d'email avec template ou contenu direct
    async envoyerMessage(options) {
        try {
            await this.ensureInitialized();
            console.log('📧 [MessageClient] Envoi message unifié:', options);
            let emailTemplate;
            let templateUsed = '';
            // 1. Résoudre le template (DB ou contenu direct)
            if (options.templateId || options.templateTitle) {
                // Utiliser un template de la DB
                const dbTemplate = options.templateId
                    ? await emailTemplateService.getTemplateById(options.templateId)
                    : await emailTemplateService.getTemplateByTitle(options.templateTitle);
                if (!dbTemplate) {
                    throw new Error(`Template non trouvé: ${options.templateId || options.templateTitle}`);
                }
                emailTemplate = emailTemplateService.processTemplate(dbTemplate.content, options.variables || {});
                templateUsed = dbTemplate.title;
            }
            else if (options.subject && options.message) {
                // Contenu direct
                emailTemplate = {
                    subject: options.subject,
                    text: options.isHtml ? EmailUtils.htmlToText(options.message) : options.message,
                    html: options.isHtml ? options.message : EmailUtils.textToSafeHtml(options.message)
                };
            }
            else {
                throw new Error('Aucun template ou contenu direct fourni');
            }
            // 2. Préparer les options d'envoi
            const emailOptions = {
                to: Array.isArray(options.to) ? options.to : [options.to],
                subject: emailTemplate.subject,
                text: emailTemplate.text,
                html: emailTemplate.html
            };
            // 3. Sauvegarder en DB si demandé
            let messageDbId;
            if (options.saveToDb && options.utilisateurId) {
                try {
                    messageDbId = await this.saveMessageToDb({
                        utilisateurId: options.utilisateurId,
                        typeMessage: options.templateTitle || 'message_direct',
                        sujet: emailTemplate.subject,
                        contenu: emailTemplate.html,
                        recipients: emailOptions.to
                    });
                }
                catch (dbError) {
                    console.warn('⚠️ [MessageClient] Erreur sauvegarde DB:', dbError);
                }
            }
            // 4. Envoyer l'email via EmailService
            const emailService = new EmailService();
            const emailResult = await emailService.sendEmail({
                to: emailOptions.to,
                subject: emailOptions.subject,
                text: emailOptions.text,
                html: emailOptions.html
            });
            // 5. Mettre à jour le statut en DB
            if (messageDbId) {
                await this.updateMessageStatus(messageDbId, emailResult.success);
            }
            return {
                success: emailResult.success,
                messageId: emailResult.messageId,
                error: emailResult.error,
                messageDbId,
                templateUsed
            };
        }
        catch (error) {
            console.error('❌ [MessageClient] Erreur envoi message:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    // Tester la configuration email
    async testerConfiguration() {
        const emailService = new EmailService();
        const result = await emailService.testerConfiguration();
        return result;
    }
    // ========== MÉTHODES SPÉCIALISÉES AVEC AUTO-SAVE ==========
    // Email de bienvenue avec template DB et sauvegarde
    async envoyerBienvenue(options) {
        console.log('📧 [MessageClient] Envoi bienvenue avec template DB');
        return this.envoyerMessage({
            templateTitle: 'Bienvenue',
            to: options.email,
            variables: {
                userName: `${options.prenom} ${options.nom}`,
                userId: options.userId,
                loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/connexion`
            },
            saveToDb: options.saveToDb,
            utilisateurId: options.utilisateurId
        });
    }
    // Email de validation avec template DB et sauvegarde
    async envoyerValidationEmail(options) {
        console.log('📧 [MessageClient] Envoi validation email avec template DB');
        const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/confirm-email?token=${options.confirmationToken}`;
        const passwordSetupUrl = options.passwordSetupToken
            ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/setup-password?token=${options.passwordSetupToken}`
            : 'À définir lors de la première connexion';
        return this.envoyerMessage({
            templateTitle: 'Validation email',
            to: options.email,
            variables: {
                prenom: options.prenom,
                email: options.email,
                userId: options.userId,
                confirmationUrl,
                passwordSetupUrl
            },
            saveToDb: options.saveToDb,
            utilisateurId: options.utilisateurId
        });
    }
    // Notification de cours avec template DB et sauvegarde
    async notifierCours(options) {
        console.log('📧 [MessageClient] Notification cours avec template DB');
        const actionTexts = {
            inscription: 'Inscription confirmée',
            annulation: 'Cours annulé',
            modification: 'Cours modifié'
        };
        return this.envoyerMessage({
            templateTitle: 'Notification cours',
            to: options.email,
            variables: {
                userName: `${options.prenom} ${options.nom}`,
                action: actionTexts[options.cours.action],
                courseType: options.cours.type,
                courseDate: options.cours.date,
                courseTime: options.cours.heure,
                instructor: options.cours.professeur || 'À définir'
            },
            saveToDb: options.saveToDb,
            utilisateurId: options.utilisateurId
        });
    }
    // Rappel de paiement avec template DB et sauvegarde
    async envoyerRappelPaiement(options) {
        console.log(`📧 [MessageClient] Rappel paiement niveau ${options.niveau}`);
        const templateNames = {
            1: 'Rappel 1 - Facture impayée',
            2: 'Rappel 2 - Facture toujours en attente',
            3: 'Dernier rappel - Suspension possible'
        };
        return this.envoyerMessage({
            templateTitle: templateNames[options.niveau],
            to: options.email,
            variables: {
                userName: `${options.prenom} ${options.nom}`,
                amount: options.montant || 'Non spécifié',
                dueDate: options.dateEcheance || 'Non spécifiée'
            },
            saveToDb: options.saveToDb,
            utilisateurId: options.utilisateurId
        });
    }
    // Confirmation de paiement avec template DB et sauvegarde
    async envoyerConfirmationPaiement(options) {
        console.log('📧 [MessageClient] Confirmation paiement');
        return this.envoyerMessage({
            templateTitle: 'Confirmation de paiement reçu',
            to: options.email,
            variables: {
                userName: `${options.prenom} ${options.nom}`,
                amount: options.montant,
                paymentDate: options.datePaiement
            },
            saveToDb: options.saveToDb,
            utilisateurId: options.utilisateurId
        });
    }
    // Récupération UserId avec template DB et sauvegarde
    async envoyerRecuperationUserId(options) {
        console.log('📧 [MessageClient] Récupération UserId');
        return this.envoyerMessage({
            templateTitle: 'Récupération UserId',
            to: options.email,
            variables: {
                prenom: options.prenom,
                userId: options.userId
            },
            saveToDb: options.saveToDb,
            utilisateurId: options.utilisateurId
        });
    }
    // ========== GESTION DES MESSAGES EN DB ==========
    // Sauvegarder un message en DB
    async saveMessageToDb(options) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO messages_personnalises (
          utilisateur_id, 
          contenu,
          created_at
        ) VALUES (?, ?, NOW())
      `;
            const fullContent = `
        Sujet: ${options.sujet}
        Template: ${options.typeMessage}
        Destinataires: ${options.recipients.join(', ')}
        
        Contenu:
        ${options.contenu}
      `;
            this.mysqlConnector.query(sql, [options.utilisateurId, fullContent], (error, results) => {
                if (error) {
                    console.error('❌ Erreur sauvegarde message DB:', error);
                    reject(error);
                }
                else {
                    console.log('✅ Message sauvegardé en DB avec ID:', results.insertId);
                    resolve(results.insertId);
                }
            });
        });
    }
    // NOUVELLE MÉTHODE : Mettre à jour le statut d'un message
    async updateMessageStatus(messageId, success, messageIdSendGrid, errorDetails) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE messages_personnalises 
        SET 
          status_envoi = ?, 
          sendgrid_message_id = ?, 
          error_details = ?,
          updated_at = NOW()
        WHERE id = ?
      `;
            const status = success ? 'sent' : 'failed';
            this.mysqlConnector.query(sql, [status, messageIdSendGrid || null, errorDetails || null, messageId], (error, results) => {
                if (error) {
                    console.error('❌ Erreur mise à jour statut message:', error);
                    reject(error);
                }
                else {
                    console.log(`✅ Statut message ${messageId} mis à jour: ${status}`);
                    resolve();
                }
            });
        });
    }
    // Récupérer l'historique des messages d'un utilisateur
    async getHistoriqueMessages(utilisateurId, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          id, 
          contenu, 
          status_envoi,
          sendgrid_message_id,
          error_details,
          created_at,
          updated_at
        FROM messages_personnalises
        WHERE utilisateur_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `;
            this.mysqlConnector.query(sql, [utilisateurId, limit], (error, results) => {
                if (error) {
                    console.error('❌ Erreur récupération historique messages:', error);
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    // ========== MÉTHODES DE VALIDATION ET TEMPLATES ==========
    // Méthodes déléguées pour la validation d'email
    async confirmUserEmail(token) {
        return emailValidationService.confirmUserEmail(token);
    }
    async sendValidationEmailWithTokens(utilisateurId) {
        return emailValidationService.sendValidationEmail(utilisateurId);
    }
    async sendUserIdRecovery(email) {
        return emailValidationService.sendUserIdRecovery(email);
    }
    // Méthodes déléguées pour les templates
    async getAllTemplates() {
        await this.ensureInitialized();
        return emailTemplateService.getAllTemplates();
    }
    async getTemplateById(id) {
        await this.ensureInitialized();
        return emailTemplateService.getTemplateById(id);
    }
    async processTemplate(content, variables) {
        return emailTemplateService.processTemplate(content, variables);
    }
    // ========== MÉTHODES UTILITAIRES ==========
    // Envoi d'email de test
    async envoyerTest(email) {
        console.log('🧪 [MessageClient] Envoi email de test');
        const now = new Date();
        const timestamp = now.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        return this.envoyerMessage({
            to: email,
            subject: `🚀 Test Club Manager - Serveur démarré à ${timestamp}`,
            message: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🚀 Club Manager</h1>
              <h2 style="color: #27ae60; margin: 10px 0 0 0; font-size: 22px;">Serveur démarré avec succès !</h2>
            </div>
            
            <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
              <h3 style="color: #2c3e50; margin: 0 0 15px 0;">✅ Test de configuration email réussi !</h3>
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                Ce message confirme que le système d'envoi d'emails de Club Manager fonctionne correctement.
              </p>
            </div>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #2c3e50; margin: 0 0 15px 0;">📊 Informations de démarrage :</h4>
              <ul style="color: #2c3e50; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li><strong>Timestamp :</strong> ${timestamp}</li>
                <li><strong>Environnement :</strong> ${process.env.NODE_ENV || 'development'}</li>
                <li><strong>Port :</strong> ${process.env.PORT || 3000}</li>
                <li><strong>Email expéditeur :</strong> ${process.env.SENDGRID_FROM_EMAIL || 'Non configuré'}</li>
                <li><strong>Base de données :</strong> ${process.env.DB_NAME || 'clubmanager'}</li>
              </ul>
            </div>

            <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1976d2; margin: 0 0 15px 0;">🔧 Services disponibles :</h4>
              <ul style="color: #1976d2; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>✅ Base de données MySQL connectée</li>
                <li>✅ Service d'envoi d'emails opérationnel</li>
                <li>✅ Templates d'emails synchronisés</li>
                <li>✅ API REST disponible</li>
                <li>✅ Authentification JWT active</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #27ae60; color: white; padding: 15px; border-radius: 8px; display: inline-block;">
                <h3 style="margin: 0; color: white;">🎉 Tout est opérationnel !</h3>
                <p style="margin: 10px 0 0 0; color: white;">Le serveur Club Manager est prêt à recevoir les connexions.</p>
              </div>
            </div>

            <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center;">
              <p style="margin: 0;">
                Cet email de test a été envoyé automatiquement au démarrage du serveur.
              </p>
              <p style="margin: 5px 0 0 0;">
                © ${now.getFullYear()} Club Manager - Système de gestion de club
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px;">
                <strong>URL API :</strong> http://localhost:${process.env.PORT || 3000}
              </p>
            </div>
          </div>
        </div>
      `,
            isHtml: true,
            saveToDb: false // Pas de sauvegarde pour les tests automatiques
        });
    }
    // Envoi groupé avec sauvegarde optionnelle
    async envoyerGroupeEmail(options) {
        const batchSize = options.batchSize || 50;
        const results = [];
        let reussites = 0;
        let echecs = 0;
        // Traitement par lots
        for (let i = 0; i < options.destinataires.length; i += batchSize) {
            const batch = options.destinataires.slice(i, i + batchSize);
            try {
                // Envoyer à chaque destinataire individuellement pour éviter l'exposition des emails
                const batchResults = await Promise.allSettled(batch.map(destinataire => this.envoyerMessage({
                    to: destinataire,
                    subject: options.sujet,
                    message: options.message,
                    isHtml: options.isHtml,
                    saveToDb: options.saveToDb,
                    utilisateurId: options.adminUserId
                })));
                // Traiter les résultats du batch
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                        if (result.value.success) {
                            reussites++;
                        }
                        else {
                            echecs++;
                        }
                    }
                    else {
                        echecs++;
                        results.push({
                            success: false,
                            error: result.reason?.message || 'Erreur inconnue',
                            details: { batch: i / batchSize + 1, recipient: batch[index] }
                        });
                    }
                });
                // Pause entre les lots
                if (i + batchSize < options.destinataires.length) {
                    await this.sleep(1000);
                }
            }
            catch (error) {
                echecs += batch.length;
                results.push({
                    success: false,
                    error: error.message,
                    details: { batch: i / batchSize + 1, recipients: batch.length }
                });
            }
        }
        return {
            total: options.destinataires.length,
            reussites,
            echecs,
            details: results
        };
    }
    // Utilitaire pour les pauses
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // Initialiser les templates et tables au démarrage (maintenant avec vérification de DB)
    async initialiser() {
        if (this.initialized) {
            console.log('✅ [MessageClient] Déjà initialisé');
            return;
        }
        try {
            console.log('🔄 [MessageClient] Initialisation...');
            // Vérifier que la base de données est disponible
            await this.waitForDatabase();
            // Initialiser les tables de validation
            await emailValidationService.initializeTables();
            // Synchroniser les templates par défaut
            await emailTemplateService.syncDefaultTemplates();
            this.initialized = true;
            console.log('✅ [MessageClient] Initialisation terminée');
        }
        catch (error) {
            console.error('❌ [MessageClient] Erreur initialisation:', error);
            // Ne pas marquer comme initialisé en cas d'erreur
            throw error;
        }
    }
    // Nouvelle méthode pour attendre que la base de données soit disponible
    async waitForDatabase(maxRetries = 5, delayMs = 1000) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                // Test simple de connexion
                await new Promise((resolve, reject) => {
                    this.mysqlConnector.query('SELECT 1 as test', [], (error, results) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve(results);
                        }
                    });
                });
                console.log('✅ [MessageClient] Base de données disponible');
                return;
            }
            catch (error) {
                console.log(`⏳ [MessageClient] Attente DB (tentative ${i + 1}/${maxRetries})...`);
                if (i === maxRetries - 1) {
                    throw new Error(`Base de données non disponible après ${maxRetries} tentatives`);
                }
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }
    // NOUVELLE MÉTHODE: Email de vérification avec token stocké en DB
    async envoyerEmailVerificationAvecToken(options) {
        console.log('📧 [MessageClient] Envoi email de vérification avec token DB');
        // Construire l'URL de validation avec token + userId
        const validationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/verify-email?token=${options.validationToken}&userId=${options.userId}`;
        return this.envoyerMessage({
            to: options.email,
            subject: '✉️ Vérifiez votre email - Club Manager',
            message: this.createEmailVerificationWithTokenTemplate({
                prenom: options.prenom,
                nom: options.nom,
                email: options.email,
                userId: options.userId,
                validationUrl,
                validationToken: options.validationToken
            }),
            isHtml: true,
            saveToDb: options.saveToDb,
            utilisateurId: options.utilisateurId
        });
    }
    // Template pour l'email de vérification avec token sécurisé - VERSION TEST
    createEmailVerificationWithTokenTemplate(variables) {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🥋 Club Manager</h1>
            <h2 style="color: #3498db; margin: 10px 0 0 0; font-size: 22px;">Vérification d'email - Mode Test</h2>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">🧪 MODE TEST ACTIF</h4>
            <p style="margin: 0; color: #856404; font-size: 14px;">
              Cet email de vérification est envoyé à <strong>houthoofd.benoit48@gmail.com</strong> pour les tests.<br>
              L'utilisateur réel a saisi l'email : <strong>${variables.email}</strong>
            </p>
          </div>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
              Bonjour <strong>Benoit</strong>,
            </p>
            <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
              Un nouvel utilisateur <strong>${variables.prenom} ${variables.nom}</strong> s'est inscrit avec l'email <strong>${variables.email}</strong>.<br>
              Pour continuer le test du processus de vérification, cliquez sur le bouton ci-dessous.
            </p>
          </div>

          <div style="background-color: #3498db; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: white;">📋 Informations de l'utilisateur inscrit</h3>
            <div style="background-color: rgba(255,255,255,0.2); padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p style="margin: 5px 0; color: white;"><strong>👤 Nom complet :</strong> ${variables.prenom} ${variables.nom}</p>
              <p style="margin: 5px 0; color: white;"><strong>📧 Email saisi :</strong> ${variables.email}</p>
              <p style="margin: 5px 0; color: white;"><strong>🆔 UserId généré :</strong></p>
              <p style="margin: 5px 0; font-size: 24px; font-family: monospace; color: #fff; background-color: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; display: inline-block;">${variables.userId}</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #ecf0f1;">
                Ce token sera utilisé pour la validation
              </p>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.validationUrl}" 
               style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 3px 6px rgba(0,0,0,0.2);">
              ✉️ Continuer le processus de vérification
            </a>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #2d5f2d;">🔄 Processus de test :</h4>
            <ol style="margin: 0; padding-left: 20px; color: #2d5f2d; font-size: 14px;">
              <li>Cliquez sur le bouton de vérification ci-dessus</li>
              <li>Le système validera automatiquement l'email de l'utilisateur <strong>${variables.prenom}</strong></li>
              <li>L'utilisateur pourra alors se connecter avec son userId <strong>${variables.userId}</strong></li>
              <li>En production, cet email sera envoyé à l'adresse réelle de l'utilisateur</li>
            </ol>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">🔐 Sécurité du token</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px;">
              <li>Ce lien de validation est <strong>unique</strong> et lié cryptographiquement à l'userId <strong>${variables.userId}</strong></li>
              <li>Le lien expire dans <strong>24 heures</strong> pour la sécurité</li>
              <li>Le token est <strong>hashé</strong> pour empêcher toute manipulation</li>
              <li>Une fois validé, le compte sera automatiquement activé</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 12px; text-align: center;">
            <p style="margin: 0; color: #95a5a6;">
              <strong>🔐 Mode Test Actif :</strong> Token hashé pour ${variables.userId}
            </p>
            <p style="margin: 5px 0 0 0; color: #95a5a6;">
              <strong>Token ID :</strong> ${variables.validationToken.substring(0, 8)}...
            </p>
            <p style="margin: 10px 0 0 0;"><strong>L'équipe Club Manager - Version Test</strong></p>
            <p style="margin: 15px 0 0 0; font-size: 11px;">
              Email automatiquement redirigé vers houthoofd.benoit48@gmail.com pour les tests
            </p>
          </div>
        </div>
      </div>
    `;
    }
}
// Instance singleton SANS initialisation automatique
export const messageClient = MessageClient.getInstance();
