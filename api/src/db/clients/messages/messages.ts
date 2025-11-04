import { ConfirmationResult, VerifyResultWithData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';
import { emailClient } from '../../../clients/emailClient.js';

export class Message {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // Utilitaire pour les requêtes avec Promise et bon typage
  private queryAsync(sql: string, values: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }

  async envoyerMessage(utilisateur_id: number, contenu: string): Promise<ConfirmationResult> {
    try {
      const query = `
        INSERT INTO messages_personnalises (utilisateur_id, contenu)
        VALUES (?, ?)
      `;
      const results = await this.queryAsync(query, [utilisateur_id, contenu]);
      
      console.log('Message personnalisé envoyé avec succès :', results);
      return {
        isConfirm: true,
        message: "Le message a bien été envoyé"
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message personnalisé : ' + error.message);
      throw error;
    }
  }
  
  async creerTypeMessage(title: string, content: string): Promise<ConfirmationResult> {
    try {
      const query = `
        INSERT INTO types_messages_personnalises (title, content)
        VALUES (?, ?)
      `;
      const results = await this.queryAsync(query, [title, content]);
      
      console.log('Type de message personnalisé inséré avec succès :', results);
      return {
        isConfirm: true,
        message: "Le type de message personnalisé a bien été enregistré"
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'insertion du type de message personnalisé : ' + error.message);
      throw error;
    }
  }

  async obtenirTousLesTypesDeMessages(): Promise<VerifyResultWithData> {
    try {
      const query = `
        SELECT * FROM types_messages_personnalises
        ORDER BY created_at DESC
      `;
      
      console.log("Exécution de la requête pour récupérer tous les types de message");
      const results = await this.queryAsync(query, []);
      
      console.log('Types de message personnalisés récupérés avec succès :', results);
      return {
        isFind: true,
        message: "Types de messages récupérés avec succès",
        data: results
      };
    } catch (error: any) {
      console.error('Erreur lors de la requête pour récupérer tous les types de message : ' + error.message);
      throw error;
    }
  }

  // Récupérer les messages reçus par un utilisateur - SIMPLIFIÉ (les colonnes existent déjà)
  async obtenirMessagesRecusParUtilisateur(userId: number): Promise<VerifyResultWithData> {
    try {
      const query = `
        SELECT 
          mp.id,
          'Message personnalisé' as title,
          mp.contenu as content,
          'Système' as sender,
          mp.created_at as date_envoi,
          COALESCE(mp.lu, 0) as lu,
          mp.date_lecture,
          COALESCE(mp.is_active, 1) as is_active
        FROM messages_personnalises mp
        WHERE mp.utilisateur_id = ? 
          AND mp.deleted_at IS NULL
          AND COALESCE(mp.is_active, 1) = 1
        ORDER BY mp.created_at DESC
      `;
      
      const results = await this.queryAsync(query, [userId]);
      
      return {
        isFind: true,
        message: "Messages reçus récupérés avec succès",
        data: results
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des messages reçus:', error.message);
      throw error;
    }
  }

  // Marquer un message comme lu - SIMPLIFIÉ
  async marquerMessageCommeLu(messageId: number): Promise<ConfirmationResult> {
    try {
      const query = `
        UPDATE messages_personnalises 
        SET lu = TRUE, date_lecture = NOW() 
        WHERE id = ?
      `;
      
      const results = await this.queryAsync(query, [messageId]);
      
      return {
        isConfirm: true,
        message: "Message marqué comme lu avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut du message:', error.message);
      throw error;
    }
  }

  // Soft delete d'un message reçu - REMPLACE la suppression définitive
  async supprimerMessageRecu(messageId: number, deletedBy?: number): Promise<ConfirmationResult> {
    try {
      const query = `
        UPDATE messages_personnalises 
        SET deleted_at = NOW(), deleted_by = ?
        WHERE id = ? AND deleted_at IS NULL
      `;
      
      const results = await this.queryAsync(query, [deletedBy || null, messageId]);
      
      console.log(`🗑️ [Messages] Message ${messageId} marqué comme supprimé par utilisateur ${deletedBy || 'système'}`);
      
      return {
        isConfirm: true,
        message: "Message supprimé avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de la suppression (soft delete) du message :', error.message);
      throw error;
    }
  }

  // Obtenir un type de message par ID
  async obtenirTypeMessageParId(id: number): Promise<any> {
    try {
      const query = `SELECT * FROM types_messages_personnalises WHERE id = ?`;
      const results = await this.queryAsync(query, [id]);
      return results[0] || null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération du type de message : ' + error.message);
      throw error;
    }
  }

  // Modifier un type de message
  async modifierTypeMessage(id: number, title: string, content: string): Promise<ConfirmationResult> {
    try {
      const query = `
        UPDATE types_messages_personnalises 
        SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      const results = await this.queryAsync(query, [title, content, id]);
      
      return {
        isConfirm: true,
        message: "Type de message modifié avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de la modification du type de message : ' + error.message);
      throw error;
    }
  }

  // Supprimer un type de message
  async supprimerTypeMessage(id: number): Promise<ConfirmationResult> {
    try {
      const query = `DELETE FROM types_messages_personnalises WHERE id = ?`;
      const results = await this.queryAsync(query, [id]);
      
      return {
        isConfirm: true,
        message: "Type de message supprimé avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de la suppression du type de message : ' + error.message);
      throw error;
    }
  }

  // Envoyer un message personnalisé - SIMPLIFIÉ (toutes les colonnes existent)
  async envoyerMessagePersonnalise(senderId: number, receiverId: number, title: string, content: string): Promise<ConfirmationResult> {
    try {
      const query = `
        INSERT INTO messages_personnalises (utilisateur_id, contenu, lu, date_lecture, is_active, created_at) 
        VALUES (?, ?, 0, NULL, 1, NOW())
      `;
      const messageContent = `${title}

${content}`;
      
      const results = await this.queryAsync(query, [receiverId, messageContent]);
      
      console.log(`📬 [Messages] Message "${title}" envoyé à l'utilisateur ${receiverId}`);
      
      return {
        isConfirm: true,
        message: "Message envoyé avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'insertion du message : ' + error.message);
      return {
        isConfirm: false,
        message: "Erreur lors de l'envoi du message : " + error.message
      };
    }
  }

  // Compter les messages non lus d'un utilisateur - SIMPLIFIÉ (les colonnes existent)
  async compterMessagesNonLus(userId: number): Promise<number> {
    try {
      const query = `
        SELECT COUNT(*) as count
        FROM messages_personnalises 
        WHERE utilisateur_id = ? 
          AND COALESCE(lu, 0) = 0
          AND deleted_at IS NULL
          AND COALESCE(is_active, 1) = 1
      `;
      
      const results = await this.queryAsync(query, [userId]);
      const count = results[0]?.count || 0;
      console.log(`📊 [Messages] Utilisateur ${userId} a ${count} messages non lus (actifs et non supprimés)`);
      return count;
    } catch (error: any) {
      console.error('Erreur lors du comptage des messages non lus:', error.message);
      throw error;
    }
  }

  // NOUVEAU: Désactiver un message (sans le supprimer)
  async desactiverMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      const query = `
        UPDATE messages_personnalises 
        SET is_active = FALSE
        WHERE id = ?
      `;
      
      const results = await this.queryAsync(query, [messageId]);
      
      if (results.affectedRows === 0) {
        return {
          isConfirm: false,
          message: "Message non trouvé"
        };
      }
      
      console.log(`🔒 [Messages] Message ${messageId} désactivé`);
      
      return {
        isConfirm: true,
        message: "Message désactivé avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de la désactivation du message :', error.message);
      throw error;
    }
  }

  // NOUVEAU: Réactiver un message
  async reactiverMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      const query = `
        UPDATE messages_personnalises 
        SET is_active = TRUE
        WHERE id = ?
      `;
      
      const results = await this.queryAsync(query, [messageId]);
      
      if (results.affectedRows === 0) {
        return {
          isConfirm: false,
          message: "Message non trouvé"
        };
      }
      
      console.log(`🔓 [Messages] Message ${messageId} réactivé`);
      
      return {
        isConfirm: true,
        message: "Message réactivé avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de la réactivation du message :', error.message);
      throw error;
    }
  }

  // NOUVEAU: Récupérer les messages inactifs (pour l'admin)
  async obtenirMessagesInactifs(userId?: number, limit: number = 100): Promise<VerifyResultWithData> {
    try {
      let query = `
        SELECT 
          mp.id,
          'Message personnalisé' as title,
          mp.contenu as content,
          'Système' as sender,
          mp.created_at as date_envoi,
          COALESCE(mp.lu, FALSE) as lu,
          mp.date_lecture,
          mp.is_active
        FROM messages_personnalises mp
        WHERE mp.deleted_at IS NULL
          AND COALESCE(mp.is_active, TRUE) = FALSE
      `;
      
      const params = [];
      
      if (userId) {
        query += ` AND mp.utilisateur_id = ?`;
        params.push(userId);
      }
      
      query += ` ORDER BY mp.created_at DESC LIMIT ?`;
      params.push(limit);
      
      const results = await this.queryAsync(query, params);
      
      return {
        isFind: true,
        message: "Messages inactifs récupérés avec succès",
        data: results
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des messages inactifs:', error.message);
      throw error;
    }
  }

  // MODIFIÉ: Récupérer les messages supprimés - inclure le statut actif
  async obtenirMessagesSupprimes(userId?: number, limit: number = 100): Promise<VerifyResultWithData> {
    try {
      let query = `
        SELECT 
          mp.id,
          'Message personnalisé' as title,
          mp.contenu as content,
          'Système' as sender,
          mp.created_at as date_envoi,
          COALESCE(mp.lu, FALSE) as lu,
          mp.date_lecture,
          mp.deleted_at,
          mp.deleted_by,
          COALESCE(mp.is_active, TRUE) as is_active,
          u.first_name as deleted_by_name
        FROM messages_personnalises mp
        LEFT JOIN utilisateurs u ON mp.deleted_by = u.id
        WHERE mp.deleted_at IS NOT NULL
      `;
      
      const params = [];
      
      if (userId) {
        query += ` AND mp.utilisateur_id = ?`;
        params.push(userId);
      }
      
      query += ` ORDER BY mp.deleted_at DESC LIMIT ?`;
      params.push(limit);
      
      const results = await this.queryAsync(query, params);
      
      return {
        isFind: true,
        message: "Messages supprimés récupérés avec succès",
        data: results
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des messages supprimés:', error.message);
      throw error;
    }
  }

  // NOUVEAU: Statistiques complètes des messages
  async obtenirStatistiquesMessages(periode: 'jour' | 'semaine' | 'mois' = 'mois'): Promise<VerifyResultWithData> {
    try {
      let dateCondition = '';
      switch(periode) {
        case 'jour':
          dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
          break;
        case 'semaine':
          dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'mois':
          dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
          break;
      }

      const query = `
        SELECT 
          COUNT(*) as total_messages,
          SUM(CASE WHEN COALESCE(is_active, TRUE) = TRUE THEN 1 ELSE 0 END) as messages_actifs,
          SUM(CASE WHEN COALESCE(is_active, TRUE) = FALSE THEN 1 ELSE 0 END) as messages_inactifs,
          SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as messages_supprimes,
          SUM(CASE WHEN COALESCE(lu, FALSE) = TRUE THEN 1 ELSE 0 END) as messages_lus,
          SUM(CASE WHEN COALESCE(lu, FALSE) = FALSE AND deleted_at IS NULL AND COALESCE(is_active, TRUE) = TRUE THEN 1 ELSE 0 END) as messages_non_lus,
          DATE(created_at) as date_creation
        FROM messages_personnalises 
        WHERE 1=1 ${dateCondition}
        GROUP BY DATE(created_at)
        ORDER BY date_creation DESC
      `;
      
      const results = await this.queryAsync(query, []);
      
      return {
        isFind: true,
        message: "Statistiques des messages récupérées",
        data: results
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error.message);
      throw error;
    }
  }

  // NOUVEAU: Récupérer les emails des destinataires - CORRIGÉ le nom de table
  async obtenirEmailsDestinataires(userIds: number[]): Promise<{id: number, email: string, first_name: string, last_name: string}[]> {
    try {
      if (userIds.length === 0) return [];
      
      const placeholders = userIds.map(() => '?').join(',');
      const query = `
        SELECT id, email, first_name, last_name
        FROM utilisateurs 
        WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''
      `;
      
      const results = await this.queryAsync(query, userIds);
      console.log(`📧 [Messages] Récupération des emails pour ${userIds.length} utilisateurs: ${results.length} trouvés`);
      
      return results;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des emails des destinataires:', error.message);
      throw error;
    }
  }

  // MODIFIÉ: Envoyer un message avec VRAI envoi d'emails via EmailClient
  async envoyerMessageAvecEmails(
    destinataires: number[], 
    typeMessageId: number, 
    envoyerEmail: boolean = true
  ): Promise<{
    messagesInternes: ConfirmationResult;
    emailsEnvoyes?: Array<{
      id: number;
      email: string;
      success: boolean;
      messageId?: string;
      error?: string;
      nom?: string;
    }>;
    typeMessage?: any;
  }> {
    try {
      // 1. Récupérer le type de message
      const typeMessage = await this.obtenirTypeMessageParId(typeMessageId);
      if (!typeMessage) {
        throw new Error('Type de message introuvable');
      }

      // 2. Envoyer les messages internes
      const messagesInternes: ConfirmationResult[] = [];
      for (const destinataireId of destinataires) {
        const result = await this.envoyerMessagePersonnalise(
          1, // senderId par défaut (système)
          destinataireId,
          typeMessage.title,
          typeMessage.content
        );
        messagesInternes.push(result);
      }

      // 3. Si envoi email demandé, utiliser EmailClient
      let emailsEnvoyes: Array<{
        id: number;
        email: string;
        success: boolean;
        messageId?: string;
        error?: string;
        nom?: string;
      }> = [];
      
      if (envoyerEmail) {
        const utilisateursAvecEmail = await this.obtenirEmailsDestinataires(destinataires);
        console.log(`📧 [Messages] Envoi RÉEL d'emails à ${utilisateursAvecEmail.length} utilisateurs via EmailClient`);
        
        if (utilisateursAvecEmail.length > 0) {
          // Utiliser EmailClient au lieu d'emailService
          for (const user of utilisateursAvecEmail) {
            try {
              console.log(`📧 [Messages] Envoi email à ${user.email} (${user.first_name} ${user.last_name})`);
              
              // Utiliser EmailClient avec template personnalisé
              const resultatEmail = await emailClient.sendTemplatedEmailFromFile({
                to: user.email,
                templateName: 'message-personnalise',
                variables: {
                  userName: `${user.first_name} ${user.last_name}`,
                  firstName: user.first_name,
                  lastName: user.last_name,
                  title: typeMessage.title,
                  content: typeMessage.content,
                  messageTitle: typeMessage.title,
                  clubName: 'Club Manager',
                  currentYear: new Date().getFullYear().toString(),
                  supportEmail: process.env.ADMIN_EMAIL || 'support@clubmanager.com',
                  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
                },
                utilisateurId: user.id,
                fallbackSubject: `[ClubManager] ${typeMessage.title}`
              });

              emailsEnvoyes.push({
                id: user.id,
                email: user.email,
                nom: `${user.first_name} ${user.last_name}`,
                success: resultatEmail.success,
                messageId: resultatEmail.messageId,
                error: resultatEmail.error
              });

              if (resultatEmail.success) {
                console.log(`✅ [Messages] Email envoyé avec succès à ${user.email} - ID: ${resultatEmail.messageId}`);
              } else {
                console.error(`❌ [Messages] Échec envoi email à ${user.email}: ${resultatEmail.error}`);
              }

              // Pause entre les envois
              await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error: any) {
              console.error(`❌ [Messages] Erreur envoi email à ${user.email}:`, error);
              emailsEnvoyes.push({
                id: user.id,
                email: user.email,
                nom: `${user.first_name} ${user.last_name}`,
                success: false,
                error: error.message || 'Erreur inconnue'
              });
            }
          }

          // Log des résultats finaux
          const reussis = emailsEnvoyes.filter(e => e.success).length;
          const echecs = emailsEnvoyes.filter(e => !e.success).length;
          
          console.log(`📊 [Messages] Résultats emails: ${reussis}/${emailsEnvoyes.length} envoyés avec succès via EmailClient`);
          
          if (echecs > 0) {
            const erreursEmails = emailsEnvoyes.filter(e => !e.success);
            console.error(`❌ [Messages] Échecs d'envoi:`, erreursEmails.map(e => `${e.email}: ${e.error}`));
          }
        }
      }

      return {
        messagesInternes: {
          isConfirm: true,
          message: `Messages internes envoyés avec succès à ${destinataires.length} destinataire(s)`
        },
        emailsEnvoyes: envoyerEmail ? emailsEnvoyes : undefined,
        typeMessage
      };

    } catch (error: any) {
      console.error('Erreur lors de l\'envoi des messages:', error.message);
      throw error;
    }
  }

  // MODIFIÉ: Envoyer un rappel de paiement avec EmailClient
  async envoyerRappelPaiementAvecEmail(
    echeanceIds: number[], 
    messagePersonnalise = ''
  ): Promise<{
    messageInterne: boolean;
    emailEnvoye?: {
      success: boolean;
      messageId?: string;
      error?: string;
      email?: string;
    };
  }> {
    try {
      console.log(`📧 [Messages] Début envoi rappel pour échéances:`, echeanceIds);

      // CORRIGÉ: Récupérer l'utilisateur depuis la première échéance
      const receiverId = await this.obtenirUtilisateurDepuisEcheance(echeanceIds[0]);
      
      if (!receiverId) {
        throw new Error(`Impossible de trouver l'utilisateur pour l'échéance ${echeanceIds[0]}`);
      }

      console.log(`👤 [Messages] Utilisateur trouvé: ${receiverId} pour échéance ${echeanceIds[0]}`);

      // 1. Récupérer les informations de l'utilisateur pour l'email
      const utilisateur = await this.obtenirEmailsDestinataires([receiverId]);
      console.log(`👤 [Messages] Utilisateurs avec email:`, utilisateur);
      
      let emailEnvoye = undefined;
      
      if (utilisateur.length > 0 && utilisateur[0].email) {
        const user = utilisateur[0];
        
        try {
          console.log(`📧 [Messages] Tentative envoi email rappel à ${user.email} (${user.first_name} ${user.last_name})`);
          
          // Calculer le montant total des échéances
          const montantTotal = await this.calculerMontantEcheances(echeanceIds);
          
          // Générer le lien de paiement
          const lienPaiement = this.genererLienPaiement(receiverId, echeanceIds[0]);
          console.log(`🔗 [Messages] Lien de paiement généré: ${lienPaiement}`);
          
          // Utiliser EmailClient avec le template de rappel de paiement
          const resultatEmail = await emailClient.sendTemplatedEmailFromFile({
            to: user.email,
            templateName: 'rappel-paiement-1',
            variables: {
              userName: `${user.first_name} ${user.last_name}`,
              firstName: user.first_name,
              lastName: user.last_name,
              amount: montantTotal.toFixed(2),
              dueDate: new Date().toLocaleDateString('fr-FR'),
              paymentLink: lienPaiement, // Ceci devrait être le bon lien vers /pages/paiement?echeance=304&userId=73
              clubName: 'Club Manager',
              currentYear: new Date().getFullYear().toString(),
              supportEmail: process.env.ADMIN_EMAIL || 'support@clubmanager.com',
              frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
            },
            utilisateurId: user.id,
            fallbackSubject: '[ClubManager] Rappel de paiement - Action requise'
          });
          
          console.log('📊 [Messages] Résultat envoi email:', resultatEmail);

          emailEnvoye = {
            success: resultatEmail.success,
            messageId: resultatEmail.messageId,
            error: resultatEmail.error,
            email: user.email
          };

          if (resultatEmail.success) {
            console.log(`✅ [Messages] Email de rappel envoyé avec succès à ${user.email} - ID: ${resultatEmail.messageId}`);
          } else {
            console.error(`❌ [Messages] Échec envoi email rappel à ${user.email}: ${resultatEmail.error}`);
          }

        } catch (error: any) {
          console.error(`❌ [Messages] Erreur envoi email rappel:`, error);
          emailEnvoye = {
            success: false,
            error: error.message,
            email: user.email
          };
        }
      } else {
        console.warn(`⚠️ [Messages] Aucun email trouvé pour l'utilisateur ${receiverId}`);
        console.warn(`⚠️ [Messages] Détails utilisateur récupéré:`, utilisateur);
        emailEnvoye = {
          success: false,
          error: 'Aucun email configuré pour cet utilisateur',
          email: 'Non disponible'
        };
      }

      return {
        messageInterne: true,
        emailEnvoye
      };

    } catch (error: any) {
      console.error('❌ [Messages] Erreur lors de l\'envoi du rappel:', error);
      throw error;
    }
  }

  // CORRIGÉ: Récupérer l'utilisateur depuis une échéance avec le bon nom de table
  private async obtenirUtilisateurDepuisEcheance(echeanceId: number): Promise<number | null> {
    try {
      console.log(`🔍 [Messages] Recherche utilisateur pour échéance ID: ${echeanceId}`);
      
      // CORRIGÉ: Utiliser le vrai nom de table 'echeances_paiements'
      const query = `
        SELECT utilisateur_id 
        FROM echeances_paiements 
        WHERE id = ?
      `;
      
      const results = await this.queryAsync(query, [echeanceId]);
      console.log(`🔍 [Messages] Résultat requête échéance:`, results);
      
      if (results.length > 0) {
        const userId = results[0].utilisateur_id;
        console.log(`✅ [Messages] Utilisateur trouvé: ${userId} pour échéance ${echeanceId}`);
        return userId;
      }
      
      console.warn(`⚠️ [Messages] Aucun utilisateur trouvé pour l'échéance ${echeanceId}`);
      return null;
    } catch (error: any) {
      console.error('Erreur lors de la récupération de l\'utilisateur depuis l\'échéance:', error.message);
      return null;
    }
  }

  // CORRIGÉ: Calculer le montant total des échéances avec le bon nom de table
  private async calculerMontantEcheances(echeanceIds: number[]): Promise<number> {
    try {
      if (echeanceIds.length === 0) return 0;
      
      const placeholders = echeanceIds.map(() => '?').join(',');
      // CORRIGÉ: Utiliser le vrai nom de table 'echeances_paiements'
      const query = `
        SELECT SUM(montant) as total
        FROM echeances_paiements 
        WHERE id IN (${placeholders})
      `;
      
      const results = await this.queryAsync(query, echeanceIds);
      console.log(`💰 [Messages] Montant calculé pour échéances ${echeanceIds}:`, results[0]?.total);
      
      return results[0]?.total || 0;
    } catch (error: any) {
      console.error('Erreur lors du calcul du montant des échéances:', error.message);
      return 0;
    }
  }

  // VÉRIFIER: Générer un lien de paiement sécurisé avec debug
  private genererLienPaiement(userId: number, echeanceId?: number): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    if (echeanceId) {
      // Format demandé: /pages/paiement?echeance=304&userId=73
      const lienGenere = `${baseUrl}/pages/paiement?echeance=${echeanceId}&userId=${userId}`;
      console.log(`🔗 [Messages] Lien généré: ${lienGenere}`);
      return lienGenere;
    } else {
      // Pour les paiements généraux sans échéance spécifique
      const lienGenere = `${baseUrl}/pages/paiement?userId=${userId}`;
      console.log(`🔗 [Messages] Lien général généré: ${lienGenere}`);
      return lienGenere;
    }
  }

  // NOUVEAU: Restaurer un message supprimé
  async restaurerMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      const query = `
        UPDATE messages_personnalises 
        SET deleted_at = NULL, deleted_by = NULL
        WHERE id = ? AND deleted_at IS NOT NULL
      `;
      
      const results = await this.queryAsync(query, [messageId]);
      
      if (results.affectedRows === 0) {
        return {
          isConfirm: false,
          message: "Message non trouvé ou déjà restauré"
        };
      }
      
      console.log(`♻️ [Messages] Message ${messageId} restauré avec succès`);
      
      return {
        isConfirm: true,
        message: "Message restauré avec succès"
      };
    } catch (error: any) {
      console.error('Erreur lors de la restauration du message :', error.message);
      throw error;
    }
  }

  // NOUVEAU: Suppression définitive (hard delete) - pour l'admin uniquement
  async supprimerDefinitivementMessage(messageId: number): Promise<ConfirmationResult> {
    try {
      const query = `DELETE FROM messages_personnalises WHERE id = ?`;
      const results = await this.queryAsync(query, [messageId]);
      
      console.log(`💀 [Messages] Message ${messageId} supprimé définitivement`);
      
      return {
        isConfirm: true,
        message: "Message supprimé définitivement"
      };
    } catch (error: any) {
      console.error('Erreur lors de la suppression définitive du message :', error.message);
      throw error;
    }
  }

  // NOUVEAU: Statistiques des messages supprimés
  async obtenirStatistiquesSuppressions(periode: 'jour' | 'semaine' | 'mois' = 'mois'): Promise<VerifyResultWithData> {
    try {
      let dateCondition = '';
      switch(periode) {
        case 'jour':
          dateCondition = 'AND deleted_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)';
          break;
        case 'semaine':
          dateCondition = 'AND deleted_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
          break;
        case 'mois':
          dateCondition = 'AND deleted_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
          break;
      }

      const query = `
        SELECT 
          COUNT(*) as total_supprime,
          COUNT(DISTINCT utilisateur_id) as utilisateurs_concernes,
          DATE(deleted_at) as date_suppression,
          COUNT(*) as suppressions_par_jour
        FROM messages_personnalises 
        WHERE deleted_at IS NOT NULL 
          ${dateCondition}
        GROUP BY DATE(deleted_at)
        ORDER BY date_suppression DESC
      `;
      
      const results = await this.queryAsync(query, []);
      
      return {
        isFind: true,
        message: "Statistiques de suppression récupérées",
        data: results
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques de suppression:', error.message);
      throw error;
    }
  }
}



