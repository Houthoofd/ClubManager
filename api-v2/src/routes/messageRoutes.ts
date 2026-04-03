import { Router } from 'express';
import { messageController } from '../controllers/messageController.js';

const router = Router();

// Routes existantes adaptées pour le nouveau messageClient

// Routes pour les emails
router.post('/welcome', messageController.envoyerEmailBienvenue);
router.post('/validation', messageController.envoyerEmailValidation);
router.post('/recover-userid', messageController.recupererUserId);

// Routes pour la validation
router.get('/confirm-email/:token', messageController.confirmerEmail);

// Routes pour l'historique
router.get('/history/:utilisateurId', messageController.getHistoriqueMessages);

// Route de test
router.get('/test-config', messageController.testerConfiguration);

// NOUVELLES ROUTES pour le client unifié

// Envoyer un email personnalisé avec template
router.post('/send-custom', async (req, res) => {
  try {
    const { to, subject, html, text, cc, bcc, saveToDb = true, utilisateurId, type_message = 'custom_email' } = req.body;

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        message: 'Paramètres manquants : to, subject et (html ou text) requis'
      });
    }

    const { messageClient } = await import('../db/clients/messages/messageClient.js');
    
    let dbMessageId: number | undefined;

    // Sauvegarder en base si demandé
    if (saveToDb && utilisateurId) {
      dbMessageId = await messageClient.saveMessageToDatabase({
        utilisateur_id: utilisateurId,
        type_message,
        contenu: html || text,
        status_envoi: 'pending',
        email_recipient: to
      });
    }

    // Envoyer l'email via le service
    const { EmailService } = await import('../services/emailService.js');
    const emailService = new EmailService();
    
    const emailResult = await emailService.envoyerEmailPersonnalise({
      to, subject, html: html || '', text: text || '', cc, bcc
    });

    // Mettre à jour le statut en base si sauvegardé
    if (saveToDb && dbMessageId) {
      await messageClient.updateMessageStatus(
        dbMessageId,
        emailResult.success ? 'sent' : 'failed',
        emailResult.messageId,
        emailResult.error
      );
    }

    res.status(emailResult.success ? 200 : 500).json({
      success: emailResult.success,
      messageId: emailResult.messageId,
      error: emailResult.error,
      details: emailResult.details,
      dbMessageId
    });

  } catch (error: any) {
    console.error('❌ [MessageRoutes] Erreur envoi email personnalisé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Tester l'envoi d'email
router.post('/send-test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    const { EmailService } = await import('../services/emailService.js');
    const emailService = new EmailService();
    
    const result = await emailService.envoyerEmailTest(email);
    
    res.json(result);

  } catch (error: any) {
    console.error('❌ [MessageRoutes] Erreur test email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtenir les templates disponibles
router.get('/templates', async (req, res) => {
  try {
    const { EmailTemplateService } = await import('../services/emailTemplateService.js');
    const templateService = new EmailTemplateService();
    
    const templates = await templateService.getAllTemplates();
    
    res.json({
      success: true,
      templates,
      count: templates.length
    });

  } catch (error: any) {
    console.error('❌ [MessageRoutes] Erreur récupération templates:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Envoyer un message avec template
router.post('/send-template', async (req, res) => {
  try {
    const { templateTitle, to, variables = {}, saveToDb = true, utilisateurId } = req.body;

    if (!templateTitle || !to) {
      return res.status(400).json({
        success: false,
        message: 'templateTitle et to requis'
      });
    }

    const { EmailTemplateService } = await import('../services/emailTemplateService.js');
    const templateService = new EmailTemplateService();
    
    const template = await templateService.getTemplateByTitle(templateTitle);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template non trouvé'
      });
    }

    const processedTemplate = templateService.processTemplate(template.content, variables);
    
    const { messageClient } = await import('../db/clients/messages/messageClient.js');
    
    let dbMessageId: number | undefined;

    // Sauvegarder en base si demandé
    if (saveToDb && utilisateurId) {
      dbMessageId = await messageClient.saveMessageToDatabase({
        utilisateur_id: utilisateurId,
        type_message: 'template_email',
        contenu: processedTemplate.html,
        status_envoi: 'pending',
        email_recipient: to
      });
    }

    // Envoyer l'email
    const { EmailService } = await import('../services/emailService.js');
    const emailService = new EmailService();
    
    const emailResult = await emailService.envoyerEmailPersonnalise({
      to,
      subject: processedTemplate.subject,
      html: processedTemplate.html,
      text: processedTemplate.text
    });

    // Mettre à jour le statut en base si sauvegardé
    if (saveToDb && dbMessageId) {
      await messageClient.updateMessageStatus(
        dbMessageId,
        emailResult.success ? 'sent' : 'failed',
        emailResult.messageId,
        emailResult.error
      );
    }

    res.status(emailResult.success ? 200 : 500).json({
      success: emailResult.success,
      messageId: emailResult.messageId,
      error: emailResult.error,
      details: emailResult.details,
      dbMessageId,
      template: {
        title: template.title,
        processed: processedTemplate
      }
    });

  } catch (error: any) {
    console.error('❌ [MessageRoutes] Erreur envoi template:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Nettoyer les tokens expirés
router.delete('/cleanup-expired-tokens', async (req, res) => {
  try {
    console.log('🧹 [MessageRoutes] Nettoyage des tokens expirés...');
    
    // SUPPRIMER CET ANCIEN CODE :
    // const { emailValidationService } = await import('../services/emailValidationService.js');
    // const deletedCount = await emailValidationService.cleanupExpiredTokens();
    
    // NOUVEAU CODE - Nettoyage direct en base :
    const MysqlConnector = (await import('../db/connector/mysqlconnector.js')).default;
    const mysqlConnector = MysqlConnector.getInstance();
    
    const deletedCount = await new Promise<number>((resolve, reject) => {
      const sql = `
        DELETE FROM email_validation_tokens 
        WHERE expires_at < NOW() OR used = TRUE
      `;
      
      mysqlConnector.query(sql, [], (error: any, results: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.affectedRows || 0);
        }
      });
    });
    
    console.log(`🗑️ [MessageRoutes] ${deletedCount} tokens supprimés`);
    
    res.json({
      success: true,
      message: `${deletedCount} tokens expirés supprimés`,
      deleted_count: deletedCount
    });
    
  } catch (error: any) {
    console.error('❌ [MessageRoutes] Erreur nettoyage tokens:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Statistiques des messages
router.get('/stats/:utilisateurId', async (req, res) => {
  try {
    const { utilisateurId } = req.params;
    const { messageClient } = await import('../db/clients/messages/messageClient.js');
    
    const messages = await messageClient.getMessageHistory(parseInt(utilisateurId), 1000);
    
    const stats = {
      total: messages.length,
      sent: messages.filter(m => m.status_envoi === 'sent').length,
      failed: messages.filter(m => m.status_envoi === 'failed').length,
      pending: messages.filter(m => m.status_envoi === 'pending').length,
      types: messages.reduce((acc: any, m: any) => {
        acc[m.type_message] = (acc[m.type_message] || 0) + 1;
        return acc;
      }, {}),
      lastWeek: messages.filter(m => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(m.date_creation) > weekAgo;
      }).length
    };
    
    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    console.error('❌ [MessageRoutes] Erreur statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
