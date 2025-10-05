import { Request, Response } from 'express';
import { messageClient } from '../db/clients/messages/messageClient.js';
import { emailValidationService } from '../services/emailValidationService.js';

export class MessageController {

  // Envoyer l'email de bienvenue
  async envoyerEmailBienvenue(req: Request, res: Response) {
    try {
      const { email, prenom, nom, userId, nomUtilisateur, motDePasse, abonnement, utilisateurId } = req.body;

      if (!email || !prenom || !nom || !userId || !utilisateurId) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes : email, prenom, nom, userId et utilisateurId requis'
        });
      }

      const result = await messageClient.envoyerEmailBienvenue({
        email,
        prenom,
        nom,
        userId,
        nomUtilisateur: nomUtilisateur || `${prenom}.${nom}`.toLowerCase(),
        motDePasse: motDePasse || 'MotDePasseTemporaire123!',
        abonnement,
        utilisateurId,
        saveToDb: true
      });

      res.status(result.success ? 200 : 500).json(result);

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur envoi email bienvenue:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Envoyer l'email de validation
  async envoyerEmailValidation(req: Request, res: Response) {
    try {
      const { utilisateurId } = req.body;

      if (!utilisateurId) {
        return res.status(400).json({
          success: false,
          message: 'utilisateurId requis'
        });
      }

      const result = await emailValidationService.sendValidationEmail(utilisateurId);
      
      res.status(result.success ? 200 : 500).json(result);

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur envoi email validation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Récupérer UserId par email
  async recupererUserId(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requis'
        });
      }

      const result = await emailValidationService.sendUserIdRecovery(email);
      
      res.status(result.success ? 200 : 404).json(result);

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur récupération UserId:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Confirmer l'email avec token
  async confirmerEmail(req: Request, res: Response) {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token requis'
        });
      }

      const result = await emailValidationService.confirmUserEmail(token);
      
      res.status(result.success ? 200 : 400).json(result);

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur confirmation email:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Récupérer l'historique des messages d'un utilisateur
  async getHistoriqueMessages(req: Request, res: Response) {
    try {
      const { utilisateurId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!utilisateurId) {
        return res.status(400).json({
          success: false,
          message: 'utilisateurId requis'
        });
      }

      const messages = await messageClient.getMessageHistory(parseInt(utilisateurId), limit);
      
      res.json({
        success: true,
        messages,
        count: messages.length
      });

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur récupération historique:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Tester la configuration email
  async testerConfiguration(req: Request, res: Response) {
    try {
      const result = await messageClient.testerConfiguration();
      
      res.json(result);

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur test configuration:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Obtenir les statistiques complètes des emails
  async obtenirStatistiquesEmails(req: Request, res: Response) {
    try {
      const { periode = '7d' } = req.query;
      
      // TODO: Implémenter les statistiques avancées
      const stats = {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        types: {},
        periode: periode
      };

      res.json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur statistiques emails:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Envoyer un email de notification de cours
  async envoyerNotificationCours(req: Request, res: Response) {
    try {
      const { 
        email, 
        prenom, 
        nom, 
        coursInfo, 
        typeNotification = 'inscription',
        utilisateurId,
        saveToDb = true 
      } = req.body;

      if (!email || !prenom || !coursInfo || !utilisateurId) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes : email, prenom, coursInfo et utilisateurId requis'
        });
      }

      // Créer le template de notification selon le type
      const templates = {
        inscription: {
          subject: `✅ Inscription confirmée - ${coursInfo.type_cours}`,
          message: `Bonjour ${prenom},\n\nVotre inscription au cours de ${coursInfo.type_cours} le ${coursInfo.date_cours} à ${coursInfo.heure_debut} a été confirmée.\n\nÀ bientôt au club !`
        },
        annulation: {
          subject: `❌ Cours annulé - ${coursInfo.type_cours}`,
          message: `Bonjour ${prenom},\n\nNous vous informons que le cours de ${coursInfo.type_cours} prévu le ${coursInfo.date_cours} à ${coursInfo.heure_debut} a été annulé.\n\nNous nous excusons pour la gêne occasionnée.`
        },
        rappel: {
          subject: `⏰ Rappel - ${coursInfo.type_cours}`,
          message: `Bonjour ${prenom},\n\nRappel : vous êtes inscrit(e) au cours de ${coursInfo.type_cours} le ${coursInfo.date_cours} à ${coursInfo.heure_debut}.\n\nÀ bientôt !`
        }
      };

      const template = templates[typeNotification as keyof typeof templates];
      
      if (!template) {
        return res.status(400).json({
          success: false,
          message: 'Type de notification invalide'
        });
      }

      // Utiliser le client unifié pour envoyer
      let dbMessageId: number | undefined;

      if (saveToDb) {
        dbMessageId = await messageClient.saveMessageToDatabase({
          utilisateur_id: utilisateurId,
          type_message: `course_${typeNotification}`,
          contenu: template.message,
          status_envoi: 'pending',
          email_recipient: email
        });
      }

      const { EmailService } = await import('../services/emailService.js');
      const emailService = new EmailService();
      
      const emailResult = await emailService.envoyerEmailPersonnalise({
        to: email,
        subject: template.subject,
        text: template.message,
        html: template.message.replace(/\n/g, '<br>')
      });

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
        dbMessageId,
        type: typeNotification
      });

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur notification cours:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Envoyer un email groupé
  async envoyerEmailGroupe(req: Request, res: Response) {
    try {
      const { 
        destinataires, 
        subject, 
        message, 
        isHtml = false,
        adminUserId,
        saveToDb = true 
      } = req.body;

      if (!Array.isArray(destinataires) || destinataires.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Liste de destinataires requise'
        });
      }

      if (!subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'Subject et message requis'
        });
      }

      const results = {
        total: destinataires.length,
        reussites: 0,
        echecs: 0,
        details: [] as any[]
      };

      const { EmailService } = await import('../services/emailService.js');
      const emailService = new EmailService();

      // Envoyer à chaque destinataire
      for (const destinataire of destinataires) {
        try {
          let dbMessageId: number | undefined;

          if (saveToDb && adminUserId) {
            dbMessageId = await messageClient.saveMessageToDatabase({
              utilisateur_id: adminUserId,
              type_message: 'bulk_email',
              contenu: message,
              status_envoi: 'pending',
              email_recipient: destinataire
            });
          }

          const emailResult = await emailService.envoyerEmailPersonnalise({
            to: destinataire,
            subject,
            text: isHtml ? '' : message,
            html: isHtml ? message : message.replace(/\n/g, '<br>')
          });

          if (saveToDb && dbMessageId) {
            await messageClient.updateMessageStatus(
              dbMessageId,
              emailResult.success ? 'sent' : 'failed',
              emailResult.messageId,
              emailResult.error
            );
          }

          if (emailResult.success) {
            results.reussites++;
          } else {
            results.echecs++;
          }

          results.details.push({
            email: destinataire,
            success: emailResult.success,
            messageId: emailResult.messageId,
            error: emailResult.error,
            dbMessageId
          });

        } catch (error: any) {
          results.echecs++;
          results.details.push({
            email: destinataire,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: results.reussites > 0,
        message: `${results.reussites}/${results.total} emails envoyés avec succès`,
        results
      });

    } catch (error: any) {
      console.error('❌ [MessageController] Erreur envoi groupé:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export const messageController = new MessageController();
