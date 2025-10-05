import nodemailer from 'nodemailer';
import { promises as fs } from 'fs';
import path from 'path';
import sgMail from '@sendgrid/mail';
export class EmailService {
    transporter;
    templatePath;
    constructor() {
        this.templatePath = path.join(process.cwd(), 'src', 'templates', 'emails');
        this.initializeTransporter();
        // NOUVEAU: Configuration SendGrid
        if (process.env.SENDGRID_API_KEY) {
            sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            console.log('📧 [EmailService] SendGrid configuré avec API Key');
        }
        else {
            console.warn('⚠️ [EmailService] SENDGRID_API_KEY manquante');
        }
    }
    initializeTransporter() {
        // Vérifier que les variables d'environnement sont chargées
        console.log('🔍 Variables d\'environnement email:');
        console.log('  EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NON DÉFINI');
        console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || 'NON DÉFINI');
        console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || 'NON DÉFINI');
        console.log('  EMAIL_USER:', process.env.EMAIL_USER || 'NON DÉFINI');
        console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? `[DÉFINI - ${process.env.EMAIL_PASS.length} caractères]` : 'NON DÉFINI');
        console.log('  EMAIL_SECURE:', process.env.EMAIL_SECURE || 'NON DÉFINI');
        // Vérification préliminaire des credentials
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Credentials email manquants - service désactivé');
            console.log('💡 Ajoutez EMAIL_USER et EMAIL_PASS dans votre fichier .env');
            return;
        }
        // Configuration optimisée selon le service
        let emailConfig;
        if (process.env.EMAIL_SERVICE === 'sendgrid') {
            // Configuration SendGrid optimisée
            emailConfig = {
                host: 'smtp.sendgrid.net',
                port: 587,
                secure: false, // STARTTLS
                auth: {
                    user: 'apikey', // Toujours 'apikey' pour SendGrid
                    pass: process.env.EMAIL_PASS.trim(), // Votre clé API SendGrid
                },
                tls: {
                    rejectUnauthorized: false
                }
            };
            console.log('🚀 Configuration SendGrid détectée');
        }
        else {
            // Configuration Gmail/SMTP classique (fallback)
            const cleanPassword = process.env.EMAIL_PASS.replace(/\s+/g, '');
            emailConfig = {
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT || '587'),
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER.trim(),
                    pass: cleanPassword,
                },
                tls: {
                    rejectUnauthorized: process.env.NODE_ENV === 'production',
                },
            };
            console.log('📧 Configuration SMTP classique');
        }
        console.log('🔧 Configuration transporter:', {
            service: process.env.EMAIL_SERVICE || 'smtp',
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
                user: emailConfig.auth.user,
                pass: `[${emailConfig.auth.pass.length} caractères]`
            }
        });
        this.transporter = nodemailer.createTransport(emailConfig);
        // Vérifier la configuration au démarrage
        this.verifyConnection();
    }
    async verifyConnection() {
        // Ne vérifier que si le transporter existe
        if (!this.transporter) {
            console.warn('⚠️ Transporter email non initialisé - configuration incomplète');
            return;
        }
        try {
            await this.transporter.verify();
            console.log('✅ Service email configuré avec succès (SendGrid)');
        }
        catch (error) {
            console.error('❌ Erreur configuration email:', error.message);
            // Messages d'aide spécifiques selon l'erreur et le service
            if (error.code === 'EAUTH') {
                if (process.env.EMAIL_SERVICE === 'sendgrid') {
                    console.log('💡 Erreur d\'authentification SendGrid - Vérifiez:');
                    console.log('   1. Que votre clé API SendGrid est correcte');
                    console.log('   2. Que EMAIL_USER est bien défini à "apikey"');
                    console.log('   3. Que votre compte SendGrid est actif');
                    console.log('   4. Régénérez une nouvelle clé API si nécessaire');
                }
                else {
                    console.log('💡 Erreur d\'authentification - Vérifiez:');
                    console.log('   1. Que EMAIL_USER et EMAIL_PASS sont corrects');
                    console.log('   2. Pour Gmail: utilisez un "mot de passe d\'application"');
                    console.log('   3. Activez l\'authentification à 2 facteurs sur Gmail');
                }
            }
            else if (error.code === 'ENOTFOUND') {
                console.log('💡 Serveur SMTP introuvable - Vérifiez EMAIL_HOST');
            }
            else if (error.code === 'ECONNREFUSED') {
                console.log('💡 Connexion refusée - Vérifiez EMAIL_PORT et EMAIL_SECURE');
            }
            console.warn('⚠️ Service email non disponible - vérifiez les variables d\'environnement');
        }
    }
    // Méthode principale d'envoi d'email - CORRIGER LA FONCTION MANQUANTE
    async sendEmail(options) {
        try {
            // Vérifier que le transporter est disponible
            if (!this.transporter) {
                throw new Error('Service email non configuré - vérifiez les variables EMAIL_USER et EMAIL_PASS');
            }
            if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
                throw new Error('Configuration email manquante - vérifiez EMAIL_USER et EMAIL_PASS');
            }
            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'Club Manager',
                    address: process.env.EMAIL_FROM || process.env.EMAIL_USER
                },
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
                bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments
            };
            console.log(`📧 Envoi email vers: ${mailOptions.to}`);
            console.log(`📋 Sujet: ${mailOptions.subject}`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email envoyé avec succès - ID: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        }
        catch (error) {
            console.error('❌ Erreur envoi email:', error);
            return { success: false, error: error.message };
        }
    }
    // Charger un template email depuis un fichier - CORRIGER LA FONCTION
    async loadTemplate(templateName, variables) {
        try {
            const templateFile = path.join(this.templatePath, `${templateName}.html`);
            let htmlContent = await fs.readFile(templateFile, 'utf-8');
            // Remplacer les variables dans le template
            Object.keys(variables).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                htmlContent = htmlContent.replace(regex, variables[key]);
            });
            // Générer une version texte basique depuis le HTML
            const textContent = htmlContent
                .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
                .replace(/\s+/g, ' ') // Normaliser les espaces
                .trim();
            // Extraire le sujet depuis le template (balise <title> ou première ligne)
            const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
            const subject = titleMatch ? titleMatch[1] : `Message de ${process.env.EMAIL_FROM_NAME || 'Club Manager'}`;
            return {
                subject,
                text: textContent,
                html: htmlContent
            };
        }
        catch (error) {
            console.error(`❌ Erreur chargement template ${templateName}:`, error);
            // Template par défaut en cas d'erreur
            return {
                subject: variables.subject || 'Message de Club Manager',
                text: variables.message || 'Message depuis Club Manager',
                html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">${variables.subject || 'Club Manager'}</h2>
              <p>${variables.message || 'Message depuis votre club'}</p>
              <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #666;">
                Ce message a été envoyé automatiquement par Club Manager
              </p>
            </body>
          </html>
        `
            };
        }
    }
    // Méthodes spécialisées pour différents types d'emails
    // Email de bienvenue
    async sendWelcomeEmail(userEmail, userName, userId, tempPassword) {
        const template = await this.loadTemplate('welcome', {
            userName,
            userId,
            tempPassword: tempPassword || 'password123',
            loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/connexion`,
            subject: `Bienvenue au Club Manager, ${userName} !`
        });
        return this.sendEmail({
            to: userEmail,
            subject: template.subject,
            text: template.text,
            html: template.html
        });
    }
    // Email de réinitialisation de mot de passe
    async sendPasswordResetEmail(userEmail, userName, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/reset-password?token=${resetToken}`;
        const template = await this.loadTemplate('password-reset', {
            userName,
            resetUrl,
            expiryHours: '24',
            subject: 'Réinitialisation de votre mot de passe - Club Manager'
        });
        return this.sendEmail({
            to: userEmail,
            subject: template.subject,
            text: template.text,
            html: template.html
        });
    }
    // Email de notification de cours
    async sendCourseNotification(userEmail, userName, courseInfo) {
        const actionText = {
            inscription: 'Inscription confirmée',
            annulation: 'Cours annulé',
            modification: 'Cours modifié'
        };
        const template = await this.loadTemplate('course-notification', {
            userName,
            action: actionText[courseInfo.action],
            courseType: courseInfo.type,
            courseDate: courseInfo.date,
            courseTime: courseInfo.time,
            instructor: courseInfo.instructor || 'À définir',
            subject: `${actionText[courseInfo.action]} - ${courseInfo.type}`
        });
        return this.sendEmail({
            to: userEmail,
            subject: template.subject,
            text: template.text,
            html: template.html
        });
    }
    // Email de rappel de cours
    async sendCourseReminder(userEmail, userName, courseInfo) {
        const template = await this.loadTemplate('course-reminder', {
            userName,
            courseType: courseInfo.type,
            courseDate: courseInfo.date,
            courseTime: courseInfo.time,
            location: courseInfo.location || 'Salle habituelle',
            subject: `Rappel - Cours de ${courseInfo.type} demain`
        });
        return this.sendEmail({
            to: userEmail,
            subject: template.subject,
            text: template.text,
            html: template.html
        });
    }
    // Email de contact/support
    async sendContactEmail(fromEmail, fromName, subject, message) {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        if (!adminEmail) {
            return { success: false, error: 'Email administrateur non configuré' };
        }
        return this.sendEmail({
            to: adminEmail,
            subject: `[Contact Club] ${subject}`,
            text: `Message de: ${fromName} (${fromEmail})\n\n${message}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h3 style="color: #333;">Nouveau message de contact</h3>
          <p><strong>De:</strong> ${fromName}</p>
          <p><strong>Email:</strong> ${fromEmail}</p>
          <p><strong>Sujet:</strong> ${subject}</p>
          <hr style="margin: 20px 0;">
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
        </div>
      `
        });
    }
    // Test de configuration email
    async testEmailConfiguration() {
        try {
            await this.transporter.verify();
            // Envoyer un email de test à l'administrateur
            const testResult = await this.sendEmail({
                to: process.env.EMAIL_USER,
                subject: '✅ Test configuration email - Club Manager',
                text: 'Configuration email fonctionnelle !',
                html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
            <h2 style="color: #28a745;">✅ Configuration Email Réussie</h2>
            <p>Le service d'envoi d'email de Club Manager fonctionne correctement.</p>
            <p><small>Test effectué le ${new Date().toLocaleString('fr-FR')}</small></p>
          </div>
        `
            });
            return testResult; // Retourne directement le résultat de sendEmail qui inclut messageId
        }
        catch (error) {
            console.error('❌ Erreur test configuration email:', error);
            return { success: false, error: error.message };
        }
    }
    async envoyerEmailBienvenue(email, prenom, nom, userId) {
        try {
            console.log('📧 [EmailService] Début envoi email de bienvenue');
            console.log('📧 [EmailService] Destinataire:', email);
            console.log('📧 [EmailService] Nom complet:', `${prenom} ${nom}`);
            console.log('📧 [EmailService] UserId:', userId || 'Non fourni');
            // Convertir userId en string pour traitement uniforme
            const userIdStr = userId ? String(userId) : undefined;
            const isTestEmail = userIdStr?.startsWith('TEST_') || false;
            // Vérification de la configuration SendGrid
            if (!process.env.SENDGRID_API_KEY) {
                const error = 'SENDGRID_API_KEY manquante dans les variables d\'environnement';
                console.error('❌ [EmailService]', error);
                return {
                    success: false,
                    error,
                    details: { step: 'config_check', missing: 'SENDGRID_API_KEY' }
                };
            }
            if (!process.env.SENDGRID_FROM_EMAIL) {
                const error = 'SENDGRID_FROM_EMAIL manquante dans les variables d\'environnement';
                console.error('❌ [EmailService]', error);
                return {
                    success: false,
                    error,
                    details: { step: 'config_check', missing: 'SENDGRID_FROM_EMAIL' }
                };
            }
            // Vérification du format de l'API key
            if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
                const error = 'SENDGRID_API_KEY doit commencer par "SG."';
                console.error('❌ [EmailService]', error);
                return {
                    success: false,
                    error,
                    details: { step: 'config_check', issue: 'invalid_api_key_format' }
                };
            }
            // NOUVEAU: Vérification de la longueur de la clé API
            if (process.env.SENDGRID_API_KEY.length < 69) { // Les clés SendGrid font ~69 caractères
                const error = 'SENDGRID_API_KEY semble trop courte ou invalide';
                console.error('❌ [EmailService]', error);
                console.error('❌ [EmailService] Longueur actuelle:', process.env.SENDGRID_API_KEY.length);
                return {
                    success: false,
                    error,
                    details: {
                        step: 'config_check',
                        issue: 'api_key_too_short',
                        currentLength: process.env.SENDGRID_API_KEY.length,
                        expectedLength: '~69 caractères'
                    }
                };
            }
            console.log('🔧 [EmailService] Configuration validée - API Key:', process.env.SENDGRID_API_KEY.substring(0, 15) + '...' + process.env.SENDGRID_API_KEY.slice(-5));
            // Construction du message avec template amélioré
            const messageHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">🥋 Club Manager</h1>
              <h2 style="color: #27ae60; margin: 10px 0 0 0; font-size: 22px;">Bienvenue ${prenom} !</h2>
            </div>
            
            <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                Bonjour <strong>${prenom} ${nom}</strong>,
              </p>
              <p style="margin: 15px 0; font-size: 16px; line-height: 1.6; color: #2c3e50;">
                ${isTestEmail
                ? 'Ceci est un email de test pour vérifier la configuration SendGrid.'
                : 'Félicitations ! Votre inscription à notre club a été confirmée avec succès. Nous sommes ravis de vous accueillir dans notre communauté.'}
              </p>
            </div>

            ${!isTestEmail ? `
            <div style="margin: 25px 0;">
              <h3 style="color: #2c3e50; margin-bottom: 15px;">📋 Prochaines étapes :</h3>
              <ul style="color: #2c3e50; line-height: 1.8; padding-left: 20px;">
                <li>Connectez-vous à votre espace personnel avec vos identifiants</li>
                <li>Consultez les horaires des cours</li>
                <li>Réservez vos créneaux préférés</li>
                <li>Suivez votre progression</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/connexion" 
                 style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Se connecter maintenant
              </a>
            </div>
            ` : `
            <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #e8f4fd; border-radius: 8px;">
              <p style="margin: 0; color: #2980b9; font-weight: bold;">✅ Test de configuration SendGrid réussi !</p>
              <p style="margin: 10px 0 0 0; color: #34495e;">Votre service d'envoi d'emails fonctionne correctement.</p>
            </div>
            `}

            <div style="border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center;">
              <p style="margin: 0;">
                ${isTestEmail
                ? 'Cet email de test a été envoyé automatiquement pour vérifier la configuration.'
                : 'Cet email a été envoyé automatiquement. Si vous avez des questions, contactez-nous.'}
              </p>
              <p style="margin: 5px 0 0 0;">
                © ${new Date().getFullYear()} Club Manager - Tous droits réservés
              </p>
            </div>
          </div>
        </div>
      `;
            const messageText = `
        ${isTestEmail ? 'Test SendGrid - ' : ''}Bienvenue ${prenom} ${nom} !
        
        ${isTestEmail
                ? 'Ceci est un email de test pour vérifier la configuration SendGrid.'
                : 'Félicitations ! Votre inscription à notre club a été confirmée avec succès.'}
        
        ${!isTestEmail ? `
        Prochaines étapes :
        - Connectez-vous à votre espace personnel avec vos identifiants
        - Consultez les horaires des cours
        - Réservez vos créneaux préférés
        
        Lien de connexion : ${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/connexion
        ` : 'Configuration SendGrid validée avec succès!'}
        
        © ${new Date().getFullYear()} Club Manager
      `;
            const msg = {
                to: email,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL,
                    name: process.env.EMAIL_FROM_NAME || 'Club Manager'
                },
                subject: isTestEmail
                    ? `🧪 Test SendGrid - ${prenom}`
                    : `🥋 Bienvenue au Club Manager, ${prenom} !`,
                text: messageText,
                html: messageHtml,
                trackingSettings: {
                    clickTracking: { enable: !isTestEmail },
                    openTracking: { enable: !isTestEmail }
                },
                mailSettings: {
                    sandboxMode: {
                        enable: process.env.NODE_ENV === 'development' && process.env.SENDGRID_SANDBOX === 'true'
                    }
                }
            };
            console.log('📧 [EmailService] Configuration du message terminée');
            console.log('📧 [EmailService] Sandbox mode:', msg.mailSettings?.sandboxMode?.enable ? 'ACTIVÉ' : 'DÉSACTIVÉ');
            console.log('📧 [EmailService] From:', msg.from);
            console.log('📧 [EmailService] Subject:', msg.subject);
            // Envoi via SendGrid avec timeout et retry
            const sendPromise = sgMail.send(msg);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Email non envoyé dans les 15 secondes')), 15000);
            });
            console.log('📧 [EmailService] Envoi en cours...');
            const [response] = await Promise.race([sendPromise, timeoutPromise]);
            console.log('✅ [EmailService] Email envoyé avec succès !');
            console.log('✅ [EmailService] Message ID:', response?.messageId || 'Non disponible');
            console.log('✅ [EmailService] Status Code:', response?.statusCode || 'Non disponible');
            return {
                success: true,
                messageId: response?.messageId || `msg_${Date.now()}`,
                details: {
                    statusCode: response?.statusCode,
                    timestamp: new Date().toISOString(),
                    recipient: email,
                    subject: msg.subject,
                    sandboxMode: msg.mailSettings?.sandboxMode?.enable,
                    isTest: isTestEmail
                }
            };
        }
        catch (error) {
            console.error('❌ [EmailService] Erreur lors de l\'envoi de l\'email:', error);
            // Analyse détaillée de l'erreur SendGrid
            let errorDetails = {
                step: 'send_email',
                originalError: error.message,
                timestamp: new Date().toISOString()
            };
            if (error.response) {
                console.error('❌ [EmailService] Réponse d\'erreur SendGrid:', error.response.body);
                errorDetails.sendgridError = error.response.body;
                errorDetails.statusCode = error.response.statusCode || error.code;
                // Solutions spécifiques selon le code d'erreur
                if (error.code === 401 || error.response.statusCode === 401) {
                    errorDetails.solution = 'Clé API SendGrid invalide ou expirée. Générez une nouvelle clé API depuis votre dashboard SendGrid';
                }
                else if (error.code === 403) {
                    errorDetails.solution = 'Permissions insuffisantes. Vérifiez que votre clé API a les permissions d\'envoi d\'emails.';
                }
                else if (error.code === 429) {
                    errorDetails.solution = 'Limite de taux dépassée. Attendez quelques minutes avant de réessayer.';
                }
            }
            return {
                success: false,
                error: error.message || 'Erreur inconnue lors de l\'envoi de l\'email',
                details: errorDetails
            };
        }
    }
    // NOUVELLE MÉTHODE : Test de configuration amélioré
    async testerConfiguration() {
        try {
            console.log('🔧 [EmailService] Test de configuration SendGrid...');
            const checks = {
                apiKey: !!process.env.SENDGRID_API_KEY,
                fromEmail: !!process.env.SENDGRID_FROM_EMAIL,
                apiKeyFormat: process.env.SENDGRID_API_KEY?.startsWith('SG.') || false,
                apiKeyLength: process.env.SENDGRID_API_KEY?.length || 0,
                envMode: process.env.NODE_ENV,
                sandboxMode: process.env.SENDGRID_SANDBOX === 'true',
                fromName: !!process.env.EMAIL_FROM_NAME,
                frontendUrl: !!process.env.FRONTEND_URL
            };
            console.log('🔧 [EmailService] Résultats des vérifications:', checks);
            // Validation de la longueur de la clé API (SendGrid fait ~69 caractères)
            const apiKeyValid = checks.apiKey && checks.apiKeyFormat && checks.apiKeyLength >= 60;
            const allGood = apiKeyValid && checks.fromEmail;
            const recommendations = [];
            if (!checks.apiKey) {
                recommendations.push('Ajouter SENDGRID_API_KEY dans .env');
            }
            else if (!checks.apiKeyFormat) {
                recommendations.push('Vérifier le format de SENDGRID_API_KEY (doit commencer par SG.)');
            }
            else if (checks.apiKeyLength < 60) {
                recommendations.push(`Clé API trop courte (${checks.apiKeyLength} caractères). Générer une nouvelle clé SendGrid.`);
            }
            else {
                recommendations.push('✅ Clé API semble valide');
            }
            if (!checks.fromEmail) {
                recommendations.push('Ajouter SENDGRID_FROM_EMAIL dans .env');
            }
            else {
                recommendations.push('✅ Email expéditeur configuré');
            }
            if (checks.sandboxMode) {
                recommendations.push('ℹ️ Mode sandbox activé - emails ne seront pas réellement envoyés');
            }
            if (!checks.fromName)
                recommendations.push('Optionnel: Ajouter EMAIL_FROM_NAME dans .env');
            if (!checks.frontendUrl)
                recommendations.push('Optionnel: Ajouter FRONTEND_URL dans .env');
            // Test de connexion avec SendGrid si la configuration semble correcte
            if (allGood && process.env.SENDGRID_API_KEY) {
                try {
                    console.log('🔧 [EmailService] Test de connexion SendGrid...');
                    // Test simple avec un message vide (ne sera pas envoyé)
                    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
                    // Validation de la clé via un appel API simple
                    const testMsg = {
                        to: 'test@example.com',
                        from: process.env.SENDGRID_FROM_EMAIL,
                        subject: 'Test',
                        text: 'Test',
                        mailSettings: {
                            sandboxMode: { enable: true } // Force sandbox pour le test
                        }
                    };
                    await sgMail.send(testMsg);
                    recommendations.push('✅ Connexion SendGrid validée');
                }
                catch (connectionError) {
                    console.error('❌ [EmailService] Échec test connexion:', connectionError);
                    if (connectionError.code === 401) {
                        recommendations.push('❌ Clé API invalide ou expirée. Générez une nouvelle clé SendGrid.');
                    }
                    else if (connectionError.code === 403) {
                        recommendations.push('❌ Permissions insuffisantes. Vérifiez les permissions de votre clé API.');
                    }
                    else {
                        recommendations.push(`❌ Erreur de connexion: ${connectionError.message}`);
                    }
                }
            }
            return {
                success: allGood,
                details: {
                    ...checks,
                    recommendations,
                    needsNewApiKey: !apiKeyValid
                }
            };
        }
        catch (error) {
            console.error('❌ [EmailService] Erreur lors du test de configuration:', error);
            return {
                success: false,
                details: {
                    error: error.message,
                    recommendations: ['Erreur critique lors du test de configuration']
                }
            };
        }
    }
    // NOUVELLE MÉTHODE : Envoi d'email de test
    async envoyerEmailTest(emailTest) {
        console.log('🧪 [EmailService] Envoi d\'email de test vers:', emailTest);
        return this.envoyerEmailBienvenue(emailTest, 'Test', 'Utilisateur', 'TEST_' + Date.now());
    }
    // NOUVELLE MÉTHODE : Envoyer un email personnalisé (pour le messageClient)
    async envoyerEmailPersonnalise(options) {
        try {
            console.log('📧 [EmailService] Envoi email personnalisé pour:', options.to);
            // 1. Vérification de la configuration
            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SENDGRID_API_KEY non configurée');
            }
            if (!process.env.SENDGRID_FROM_EMAIL) {
                throw new Error('SENDGRID_FROM_EMAIL non configurée');
            }
            // 2. Validation des adresses email
            const validateEmail = (email) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            };
            // Vérification du destinataire principal
            const toEmails = Array.isArray(options.to) ? options.to : [options.to];
            for (const email of toEmails) {
                if (!validateEmail(email)) {
                    throw new Error(`Adresse email invalide: ${email}`);
                }
            }
            // Vérification des CC
            if (options.cc) {
                const ccEmails = Array.isArray(options.cc) ? options.cc : [options.cc];
                for (const email of ccEmails) {
                    if (!validateEmail(email)) {
                        throw new Error(`Adresse email CC invalide: ${email}`);
                    }
                }
            }
            // Vérification des BCC
            if (options.bcc) {
                const bccEmails = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
                for (const email of bccEmails) {
                    if (!validateEmail(email)) {
                        throw new Error(`Adresse email BCC invalide: ${email}`);
                    }
                }
            }
            // 3. Préparation du message
            const msg = {
                to: toEmails,
                from: {
                    email: process.env.SENDGRID_FROM_EMAIL,
                    name: process.env.EMAIL_FROM_NAME || 'Club Manager'
                },
                subject: options.subject,
                text: options.text || 'Contenu textuel non fourni',
                html: options.html,
                trackingSettings: {
                    clickTracking: { enable: true },
                    openTracking: { enable: true },
                    subscriptionTracking: { enable: true }
                },
                mailSettings: {
                    sandboxMode: {
                        enable: process.env.NODE_ENV === 'development' || process.env.SENDGRID_SANDBOX === 'true'
                    }
                }
            };
            // Ajout des CC si présents
            if (options.cc) {
                msg.cc = Array.isArray(options.cc) ? options.cc : [options.cc];
            }
            // Ajout des BCC si présents
            if (options.bcc) {
                msg.bcc = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
            }
            // Ajout des pièces jointes si présentes (correction complète du typage)
            if (options.attachments && options.attachments.length > 0) {
                const validAttachments = options.attachments
                    .filter(attachment => attachment.content != null)
                    .map(attachment => {
                    // Conversion du contenu en string comme attendu par SendGrid
                    let contentString;
                    if (Buffer.isBuffer(attachment.content)) {
                        // Convertir Buffer en base64 string
                        contentString = attachment.content.toString('base64');
                    }
                    else {
                        contentString = attachment.content;
                    }
                    return {
                        filename: attachment.filename,
                        content: contentString,
                        type: attachment.contentType || 'application/octet-stream',
                        disposition: 'attachment'
                    };
                });
                if (validAttachments.length > 0) {
                    msg.attachments = validAttachments;
                }
            }
            console.log('📧 [EmailService] Configuration du message terminée');
            console.log('📧 [EmailService] Sandbox mode:', msg.mailSettings?.sandboxMode?.enable ? 'ACTIVÉ' : 'DÉSACTIVÉ');
            console.log('📧 [EmailService] From:', msg.from);
            console.log('📧 [EmailService] Subject:', msg.subject);
            console.log('📧 [EmailService] Destinataires:', msg.to);
            console.log('📧 [EmailService] Attachements:', msg.attachments?.length || 0);
            // 4. Envoi avec timeout et gestion des erreurs
            const sendPromise = sgMail.send(msg);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout: Email non envoyé dans les 15 secondes')), 15000);
            });
            console.log('📧 [EmailService] Envoi en cours...');
            const response = await Promise.race([sendPromise, timeoutPromise]);
            console.log('✅ [EmailService] Email envoyé avec succès !');
            console.log('✅ [EmailService] Response headers:', response[0]?.headers);
            // Extraire le messageId depuis les headers de la réponse SendGrid
            const messageId = response[0]?.headers?.['x-message-id'] || `msg_${Date.now()}`;
            console.log('✅ [EmailService] Message ID:', messageId);
            return {
                success: true,
                messageId: messageId,
                details: {
                    statusCode: response[0]?.statusCode,
                    timestamp: new Date().toISOString(),
                    recipients: msg.to,
                    subject: msg.subject,
                    sandboxMode: msg.mailSettings?.sandboxMode?.enable,
                    trackingEnabled: true,
                    attachments: msg.attachments?.length || 0
                }
            };
        }
        catch (error) {
            console.error('❌ [EmailService] Erreur lors de l\'envoi de l\'email:', error);
            // Analyse détaillée de l'erreur
            let errorDetails = {
                step: 'send_email',
                originalError: error.message,
                timestamp: new Date().toISOString()
            };
            // Gestion spécifique des erreurs SendGrid
            if (error.response) {
                errorDetails.sendgridError = error.response.body;
                errorDetails.statusCode = error.response.statusCode;
                // Solutions spécifiques selon le code d'erreur
                switch (error.response.statusCode) {
                    case 400:
                        errorDetails.solution = 'Requête mal formée. Vérifiez le format de votre email.';
                        break;
                    case 401:
                        errorDetails.solution = 'Clé API invalide. Vérifiez votre SENDGRID_API_KEY.';
                        break;
                    case 403:
                        errorDetails.solution = 'Permissions insuffisantes. Vérifiez les permissions de votre clé API.';
                        break;
                    case 413:
                        errorDetails.solution = 'Email trop volumineux. Réduisez la taille des pièces jointes.';
                        break;
                    case 429:
                        errorDetails.solution = 'Limite de taux dépassée. Attendez avant de réessayer.';
                        break;
                    case 500:
                        errorDetails.solution = 'Erreur serveur. Réessayez plus tard.';
                        break;
                    default:
                        errorDetails.solution = 'Erreur inconnue. Contactez le support.';
                }
            }
            else if (error.code) {
                // Gestion des erreurs réseau
                switch (error.code) {
                    case 'ETIMEDOUT':
                        errorDetails.solution = 'Timeout de connexion. Vérifiez votre connexion internet.';
                        break;
                    case 'ENOTFOUND':
                        errorDetails.solution = 'Serveur introuvable. Vérifiez la configuration DNS.';
                        break;
                    default:
                        errorDetails.solution = 'Erreur réseau. Vérifiez votre connexion.';
                }
            }
            else if (error.message.includes('invalide')) {
                // Erreurs de validation
                errorDetails.validationErrors = [error.message];
                errorDetails.solution = 'Corrigez les adresses email invalides.';
            }
            else if (error.message.includes('Timeout')) {
                errorDetails.solution = 'L\'envoi a pris trop de temps. Réessayez plus tard.';
            }
            return {
                success: false,
                error: error.message || 'Erreur inconnue lors de l\'envoi de l\'email',
                details: errorDetails
            };
        }
    }
}
// Export de l'instance singleton
export const emailService = new EmailService();
