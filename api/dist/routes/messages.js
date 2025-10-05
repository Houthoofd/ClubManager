import { Router } from 'express';
import { messageClient } from '../clients/messageClient.js';
import { EmailUtils } from '../utils/emailUtils.js';
const router = Router();
// ========== GESTION DES TEMPLATES ==========
// Obtenir tous les templates
router.get('/templates', async (req, res) => {
    try {
        const templates = await messageClient.getAllTemplates();
        res.json({
            success: true,
            data: templates,
            count: templates.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Obtenir un template par ID
router.get('/templates/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const template = await messageClient.getTemplateById(id);
        if (!template) {
            return res.status(404).json({ success: false, error: 'Template non trouvé' });
        }
        res.json({ success: true, data: template });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Créer un nouveau template
router.post('/templates', async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Title et content sont requis'
            });
        }
        const { emailTemplateService } = await import('../services/emailTemplateService.js');
        const templateId = await emailTemplateService.createTemplate(title, content);
        res.status(201).json({
            success: true,
            data: { id: templateId },
            message: 'Template créé avec succès'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Mettre à jour un template
router.put('/templates/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { title, content } = req.body;
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                error: 'Title et content sont requis'
            });
        }
        const { emailTemplateService } = await import('../services/emailTemplateService.js');
        const success = await emailTemplateService.updateTemplate(id, title, content);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Template non trouvé ou pas de modification'
            });
        }
        res.json({
            success: true,
            message: 'Template mis à jour avec succès'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Supprimer un template
router.delete('/templates/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { emailTemplateService } = await import('../services/emailTemplateService.js');
        const success = await emailTemplateService.deleteTemplate(id);
        if (!success) {
            return res.status(404).json({
                success: false,
                error: 'Template non trouvé'
            });
        }
        res.json({
            success: true,
            message: 'Template supprimé avec succès'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Prévisualiser un template avec des variables
router.post('/templates/:id/preview', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { variables = {} } = req.body;
        const template = await messageClient.getTemplateById(id);
        if (!template) {
            return res.status(404).json({
                success: false,
                error: 'Template non trouvé'
            });
        }
        const processedTemplate = messageClient.processTemplate(template.content, variables);
        res.json({
            success: true,
            data: {
                original: template,
                processed: processedTemplate,
                variables: variables
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Envoyer un template avec synchronisation DB
router.post('/templates/:id/send', async (req, res) => {
    try {
        const templateId = parseInt(req.params.id);
        const { recipients, variables = {}, saveToDb = true, utilisateurId } = req.body;
        if (!recipients || (Array.isArray(recipients) ? recipients.length === 0 : !recipients)) {
            return res.status(400).json({
                success: false,
                error: 'Recipients requis'
            });
        }
        // Valider les emails
        const emailList = Array.isArray(recipients) ? recipients : [recipients];
        const { valid, invalid } = EmailUtils.validateEmailList(emailList);
        if (valid.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucun email valide',
                details: { invalid }
            });
        }
        const result = await messageClient.envoyerMessage({
            templateId,
            to: valid,
            variables,
            saveToDb,
            utilisateurId
        });
        if (invalid.length > 0) {
            result.details = { ...result.details, invalidEmails: invalid };
        }
        EmailUtils.logEmailActivity('template_send', valid, result.success, result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Synchroniser les templates par défaut
router.post('/templates/sync-defaults', async (req, res) => {
    try {
        const { emailTemplateService } = await import('../services/emailTemplateService.js');
        await emailTemplateService.syncDefaultTemplates();
        res.json({
            success: true,
            message: 'Templates par défaut synchronisés avec succès'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ========== ENVOIS SPÉCIALISÉS AVEC SAUVEGARDE ==========
// Envoyer un message avec template ou contenu direct
router.post('/send', async (req, res) => {
    try {
        const { recipients, templateId, templateTitle, variables = {}, subject, message, isHtml = false, saveToDb = true, utilisateurId } = req.body;
        if (!recipients || (Array.isArray(recipients) ? recipients.length === 0 : !recipients)) {
            return res.status(400).json({ success: false, error: 'Recipients requis' });
        }
        // Valider les emails
        const emailList = Array.isArray(recipients) ? recipients : [recipients];
        const { valid, invalid } = EmailUtils.validateEmailList(emailList);
        if (valid.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucun email valide',
                details: { invalid }
            });
        }
        const result = await messageClient.envoyerMessage({
            to: valid,
            templateId,
            templateTitle,
            variables,
            subject,
            message,
            isHtml,
            saveToDb,
            utilisateurId
        });
        if (invalid.length > 0) {
            result.details = { ...result.details, invalidEmails: invalid };
        }
        EmailUtils.logEmailActivity('unified_send', valid, result.success, result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Email de bienvenue avec sauvegarde
router.post('/send-welcome', async (req, res) => {
    try {
        const { email, prenom, nom, userId, utilisateurId, saveToDb = true } = req.body;
        if (!EmailUtils.isValidEmail(email)) {
            return res.status(400).json({ success: false, error: 'Email invalide' });
        }
        const result = await messageClient.envoyerBienvenue({
            email, prenom, nom, userId, utilisateurId, saveToDb
        });
        EmailUtils.logEmailActivity('welcome_email', email, result.success, result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Email de validation avec sauvegarde
router.post('/send-validation', async (req, res) => {
    try {
        const { utilisateurId } = req.body;
        if (!utilisateurId) {
            return res.status(400).json({ success: false, error: 'ID utilisateur requis' });
        }
        const result = await messageClient.sendValidationEmailWithTokens(utilisateurId);
        EmailUtils.logEmailActivity('validation_email', `utilisateur_${utilisateurId}`, result.success);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Notification de cours avec sauvegarde
router.post('/notify-course', async (req, res) => {
    try {
        const { email, prenom, nom, cours, utilisateurId, saveToDb = true } = req.body;
        if (!EmailUtils.isValidEmail(email)) {
            return res.status(400).json({ success: false, error: 'Email invalide' });
        }
        const result = await messageClient.notifierCours({
            email, prenom, nom, cours, utilisateurId, saveToDb
        });
        EmailUtils.logEmailActivity('course_notification', email, result.success, result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Rappel de paiement avec sauvegarde
router.post('/payment-reminder', async (req, res) => {
    try {
        const { email, prenom, nom, niveau, montant, dateEcheance, utilisateurId, saveToDb = true } = req.body;
        if (!EmailUtils.isValidEmail(email)) {
            return res.status(400).json({ success: false, error: 'Email invalide' });
        }
        if (!niveau || ![1, 2, 3].includes(niveau)) {
            return res.status(400).json({ success: false, error: 'Niveau de rappel invalide (1, 2 ou 3)' });
        }
        const result = await messageClient.envoyerRappelPaiement({
            email, prenom, nom, niveau, montant, dateEcheance, utilisateurId, saveToDb
        });
        EmailUtils.logEmailActivity('payment_reminder', email, result.success, result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Confirmation de paiement avec sauvegarde
router.post('/payment-confirmation', async (req, res) => {
    try {
        const { email, prenom, nom, montant, datePaiement, utilisateurId, saveToDb = true } = req.body;
        if (!EmailUtils.isValidEmail(email)) {
            return res.status(400).json({ success: false, error: 'Email invalide' });
        }
        const result = await messageClient.envoyerConfirmationPaiement({
            email, prenom, nom, montant, datePaiement, utilisateurId, saveToDb
        });
        EmailUtils.logEmailActivity('payment_confirmation', email, result.success, result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// ========== VALIDATION D'EMAIL ==========
// Confirmer un email
router.post('/confirm-email', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, error: 'Token requis' });
        }
        const result = await messageClient.confirmUserEmail(token);
        if (result.success) {
            res.json({ success: true, message: result.message, userId: result.userId });
        }
        else {
            res.status(400).json({ success: false, error: result.message });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Récupérer UserId
router.post('/recover-userid', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !EmailUtils.isValidEmail(email)) {
            return res.status(400).json({ success: false, error: 'Email valide requis' });
        }
        const result = await messageClient.sendUserIdRecovery(email);
        EmailUtils.logEmailActivity('userid_recovery', email, result.success);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Valider un token (pour vérification côté client)
router.get('/validate-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { type = 'email_confirmation' } = req.query;
        const { emailValidationService } = await import('../services/emailValidationService.js');
        const validationToken = await emailValidationService.validateToken(token, type);
        if (validationToken) {
            res.json({
                success: true,
                valid: true,
                expiresAt: validationToken.expires_at,
                type: validationToken.type
            });
        }
        else {
            res.json({
                success: true,
                valid: false,
                message: 'Token invalide, expiré ou déjà utilisé'
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// ========== UTILITAIRES ==========
// Test de configuration
router.get('/test-config', async (req, res) => {
    try {
        const result = await messageClient.testerConfiguration();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Test d'envoi
router.post('/test-send', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !EmailUtils.isValidEmail(email)) {
            return res.status(400).json({ success: false, error: 'Email invalide' });
        }
        const result = await messageClient.envoyerTest(email);
        EmailUtils.logEmailActivity('test_send', email, result.success, result);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Historique des messages d'un utilisateur
router.get('/history/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const limit = parseInt(req.query.limit) || 50;
        const messages = await messageClient.getHistoriqueMessages(userId, limit);
        res.json({
            success: true,
            data: messages,
            count: messages.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
// Envoi groupé avec sauvegarde
router.post('/send-bulk', async (req, res) => {
    try {
        const { emails, subject, message, isHtml = false, saveToDb = true, adminUserId } = req.body;
        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Liste d\'emails requise'
            });
        }
        const { valid, invalid } = EmailUtils.validateEmailList(emails);
        if (valid.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucun email valide trouvé',
                details: { invalid }
            });
        }
        const result = await messageClient.envoyerGroupeEmail({
            destinataires: valid,
            sujet: subject,
            message,
            isHtml,
            saveToDb,
            adminUserId
        });
        EmailUtils.logEmailActivity('bulk_send', valid, result.reussites > 0, {
            total: result.total,
            success: result.reussites,
            failed: result.echecs
        });
        res.json({
            ...result,
            invalidEmails: invalid
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// NOUVEAU: Test de l'email de vérification avec token et userId
router.post('/test-verification-token', async (req, res) => {
    try {
        const { email, prenom, nom, userId } = req.body;
        // Générer un token de test
        const testToken = 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const result = await messageClient.envoyerEmailVerificationAvecToken({
            email: email || 'houthoofd.benoit48@gmail.com',
            prenom: prenom || 'Benoit',
            nom: nom || 'Test',
            userId: userId || 'USR2025TEST',
            validationToken: testToken,
            saveToDb: false // Test sans sauvegarde
        });
        res.json({
            ...result,
            testInfo: {
                message: 'Ceci est un test avec un token factice',
                testToken: testToken,
                validationUrl: `${process.env.FRONTEND_URL}/pages/verify-email?token=${testToken}&userId=${userId || 'USR2025TEST'}`
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/test-validation', async (req, res) => {
    try {
        const { email, prenom, userId } = req.body;
        const result = await messageClient.envoyerValidationEmail({
            email,
            prenom: prenom || 'Test',
            userId: userId || 'TEST123',
            confirmationToken: 'test-token-confirmation',
            passwordSetupToken: 'test-token-password',
            saveToDb: false
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/test-cours', async (req, res) => {
    try {
        const { email, prenom, nom } = req.body;
        const result = await messageClient.notifierCours({
            email,
            prenom: prenom || 'Test',
            nom: nom || 'Utilisateur',
            cours: {
                type: 'Karaté Débutant',
                date: '2024-01-15',
                heure: '18:00',
                action: 'inscription',
                professeur: 'Sensei Test'
            },
            saveToDb: false
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/test-paiement', async (req, res) => {
    try {
        const { email, prenom, nom } = req.body;
        const result = await messageClient.envoyerRappelPaiement({
            email,
            prenom: prenom || 'Test',
            nom: nom || 'Utilisateur',
            niveau: 1,
            montant: '50€',
            dateEcheance: '2024-01-31',
            saveToDb: false
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/test-confirmation-paiement', async (req, res) => {
    try {
        const { email, prenom, nom } = req.body;
        const result = await messageClient.envoyerConfirmationPaiement({
            email,
            prenom: prenom || 'Test',
            nom: nom || 'Utilisateur',
            montant: '50€',
            datePaiement: new Date().toLocaleDateString('fr-FR'),
            saveToDb: false
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
router.post('/test-recuperation', async (req, res) => {
    try {
        const { email, prenom, userId } = req.body;
        const result = await messageClient.envoyerRecuperationUserId({
            email,
            prenom: prenom || 'Test',
            userId: userId || 'TEST123',
            saveToDb: false
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Test envoi avec template de la DB
router.post('/send-template', async (req, res) => {
    try {
        const { to, templateId, variables } = req.body;
        const result = await messageClient.envoyerMessage({
            to,
            templateId: parseInt(templateId),
            variables: variables || {},
            saveToDb: false
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Test envoi direct
router.post('/send-direct', async (req, res) => {
    try {
        const { to, subject, message, isHtml } = req.body;
        const result = await messageClient.envoyerMessage({
            to,
            subject,
            message,
            isHtml: isHtml !== false,
            saveToDb: false
        });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Test de configuration
router.post('/test-config', async (req, res) => {
    try {
        const result = await messageClient.testerConfiguration();
        res.json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// NOUVEAU: Endpoint pour vérifier l'état des tables de tokens
router.get('/debug-tokens', async (req, res) => {
    try {
        const { default: MysqlConnector } = await import('../db/connector/mysqlconnector.js');
        const mysqlConnector = MysqlConnector.getInstance();
        console.log('🔍 [Debug] Vérification des tables de tokens...');
        // Vérifier les deux tables
        const queries = [
            { name: 'validation_tokens', sql: 'SELECT COUNT(*) as count, MAX(created_at) as last_created FROM validation_tokens' },
            { name: 'email_validation_tokens', sql: 'SELECT COUNT(*) as count, MAX(created_at) as last_created FROM email_validation_tokens' },
            { name: 'validation_tokens_recent', sql: 'SELECT * FROM validation_tokens ORDER BY created_at DESC LIMIT 3' },
            { name: 'email_validation_tokens_recent', sql: 'SELECT * FROM email_validation_tokens ORDER BY created_at DESC LIMIT 3' }
        ];
        const results = {};
        for (const query of queries) {
            try {
                const result = await new Promise((resolve, reject) => {
                    mysqlConnector.query(query.sql, [], (error, queryResults) => {
                        if (error)
                            reject(error);
                        else
                            resolve(queryResults);
                    });
                });
                results[query.name] = result;
            }
            catch (error) {
                results[query.name] = { error: error.message };
            }
        }
        console.log('🔍 [Debug] Résultats des tables:', results);
        res.json({
            success: true,
            tables: results,
            recommendation: results.validation_tokens?.length > 0
                ? 'Utiliser validation_tokens (table active)'
                : 'Aucune table ne contient de données récentes'
        });
    }
    catch (error) {
        console.error('❌ [Debug] Erreur vérification tables:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
export default router;
