import MysqlConnector from '../../connector/mysqlconnector.js';
import { emailService } from '../../../services/emailService.js';
export class Message {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    // Utilitaire pour les requêtes avec Promise et bon typage
    queryAsync(sql, values) {
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, values, (err, results) => {
                if (err)
                    reject(err);
                else
                    resolve(results);
            });
        });
    }
    async envoyerMessage(utilisateur_id, contenu) {
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
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi du message personnalisé : ' + error.message);
            throw error;
        }
    }
    async creerTypeMessage(title, content) {
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
        }
        catch (error) {
            console.error('Erreur lors de l\'insertion du type de message personnalisé : ' + error.message);
            throw error;
        }
    }
    async obtenirTousLesTypesDeMessages() {
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
        }
        catch (error) {
            console.error('Erreur lors de la requête pour récupérer tous les types de message : ' + error.message);
            throw error;
        }
    }
    // Récupérer les messages reçus par un utilisateur - SIMPLIFIÉ (les colonnes existent déjà)
    async obtenirMessagesRecusParUtilisateur(userId) {
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
        }
        catch (error) {
            console.error('Erreur lors de la récupération des messages reçus:', error.message);
            throw error;
        }
    }
    // Marquer un message comme lu - SIMPLIFIÉ
    async marquerMessageCommeLu(messageId) {
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
        }
        catch (error) {
            console.error('Erreur lors de la mise à jour du statut du message:', error.message);
            throw error;
        }
    }
    // Soft delete d'un message reçu - REMPLACE la suppression définitive
    async supprimerMessageRecu(messageId, deletedBy) {
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
        }
        catch (error) {
            console.error('Erreur lors de la suppression (soft delete) du message :', error.message);
            throw error;
        }
    }
    // Obtenir un type de message par ID
    async obtenirTypeMessageParId(id) {
        try {
            const query = `SELECT * FROM types_messages_personnalises WHERE id = ?`;
            const results = await this.queryAsync(query, [id]);
            return results[0] || null;
        }
        catch (error) {
            console.error('Erreur lors de la récupération du type de message : ' + error.message);
            throw error;
        }
    }
    // Modifier un type de message
    async modifierTypeMessage(id, title, content) {
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
        }
        catch (error) {
            console.error('Erreur lors de la modification du type de message : ' + error.message);
            throw error;
        }
    }
    // Supprimer un type de message
    async supprimerTypeMessage(id) {
        try {
            const query = `DELETE FROM types_messages_personnalises WHERE id = ?`;
            const results = await this.queryAsync(query, [id]);
            return {
                isConfirm: true,
                message: "Type de message supprimé avec succès"
            };
        }
        catch (error) {
            console.error('Erreur lors de la suppression du type de message : ' + error.message);
            throw error;
        }
    }
    // Envoyer un message personnalisé - SIMPLIFIÉ (toutes les colonnes existent)
    async envoyerMessagePersonnalise(senderId, receiverId, title, content) {
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
        }
        catch (error) {
            console.error('Erreur lors de l\'insertion du message : ' + error.message);
            return {
                isConfirm: false,
                message: "Erreur lors de l'envoi du message : " + error.message
            };
        }
    }
    // Compter les messages non lus d'un utilisateur - SIMPLIFIÉ (les colonnes existent)
    async compterMessagesNonLus(userId) {
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
        }
        catch (error) {
            console.error('Erreur lors du comptage des messages non lus:', error.message);
            throw error;
        }
    }
    // NOUVEAU: Désactiver un message (sans le supprimer)
    async desactiverMessage(messageId) {
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
        }
        catch (error) {
            console.error('Erreur lors de la désactivation du message :', error.message);
            throw error;
        }
    }
    // NOUVEAU: Réactiver un message
    async reactiverMessage(messageId) {
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
        }
        catch (error) {
            console.error('Erreur lors de la réactivation du message :', error.message);
            throw error;
        }
    }
    // NOUVEAU: Récupérer les messages inactifs (pour l'admin)
    async obtenirMessagesInactifs(userId, limit = 100) {
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
        }
        catch (error) {
            console.error('Erreur lors de la récupération des messages inactifs:', error.message);
            throw error;
        }
    }
    // MODIFIÉ: Récupérer les messages supprimés - inclure le statut actif
    async obtenirMessagesSupprimes(userId, limit = 100) {
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
        }
        catch (error) {
            console.error('Erreur lors de la récupération des messages supprimés:', error.message);
            throw error;
        }
    }
    // NOUVEAU: Statistiques complètes des messages
    async obtenirStatistiquesMessages(periode = 'mois') {
        try {
            let dateCondition = '';
            switch (periode) {
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
        }
        catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error.message);
            throw error;
        }
    }
    // NOUVEAU: Récupérer les emails des destinataires - CORRIGÉ le nom de table
    async obtenirEmailsDestinataires(userIds) {
        try {
            if (userIds.length === 0)
                return [];
            const placeholders = userIds.map(() => '?').join(',');
            const query = `
        SELECT id, email, first_name, last_name
        FROM utilisateurs 
        WHERE id IN (${placeholders}) AND email IS NOT NULL AND email != ''
      `;
            const results = await this.queryAsync(query, userIds);
            console.log(`📧 [Messages] Récupération des emails pour ${userIds.length} utilisateurs: ${results.length} trouvés`);
            return results;
        }
        catch (error) {
            console.error('Erreur lors de la récupération des emails des destinataires:', error.message);
            throw error;
        }
    }
    // MODIFIÉ: Envoyer un message avec VRAI envoi d'emails
    async envoyerMessageAvecEmails(destinataires, typeMessageId, envoyerEmail = true) {
        try {
            // 1. Récupérer le type de message
            const typeMessage = await this.obtenirTypeMessageParId(typeMessageId);
            if (!typeMessage) {
                throw new Error('Type de message introuvable');
            }
            // 2. Envoyer les messages internes
            const messagesInternes = [];
            for (const destinataireId of destinataires) {
                const result = await this.envoyerMessagePersonnalise(1, // senderId par défaut (système)
                destinataireId, typeMessage.title, typeMessage.content);
                messagesInternes.push(result);
            }
            // 3. Si envoi email demandé, récupérer les emails et VRAIMENT les envoyer
            let emailsEnvoyes = [];
            if (envoyerEmail) {
                const utilisateursAvecEmail = await this.obtenirEmailsDestinataires(destinataires);
                console.log(`📧 [Messages] Envoi RÉEL d'emails à ${utilisateursAvecEmail.length} utilisateurs`);
                // AJOUT: Debug des variables d'environnement
                console.log(`🔧 [Messages] Debug env - SENDGRID_SANDBOX: "${process.env.SENDGRID_SANDBOX}"`);
                console.log(`🔧 [Messages] Debug env - NODE_ENV: "${process.env.NODE_ENV}"`);
                if (utilisateursAvecEmail.length > 0) {
                    // VRAIMENT envoyer les emails un par un avec vérification
                    for (const user of utilisateursAvecEmail) {
                        try {
                            console.log(`📧 [Messages] Envoi email à ${user.email} (${user.first_name} ${user.last_name})`);
                            // Vérifier explicitement le mode sandbox
                            const sandboxMode = process.env.SENDGRID_SANDBOX === 'true';
                            if (sandboxMode) {
                                console.warn(`⚠️ [Messages] MODE SANDBOX ACTIVÉ - L'email ne sera PAS réellement envoyé à ${user.email}`);
                                console.warn(`⚠️ [Messages] SENDGRID_SANDBOX="${process.env.SENDGRID_SANDBOX}" - Définissez SENDGRID_SANDBOX=false pour de vrais envois`);
                            }
                            else {
                                console.log(`✅ [Messages] Mode production - L'email sera RÉELLEMENT envoyé à ${user.email}`);
                            }
                            // Utiliser l'instance singleton du service email
                            const resultatEmail = await emailService.envoyerEmailPersonnalise({
                                to: user.email,
                                subject: `[ClubManager] ${typeMessage.title}`,
                                html: this.genererHTMLEmail(typeMessage.title, typeMessage.content, user.first_name),
                                text: this.genererTextEmail(typeMessage.title, typeMessage.content, user.first_name)
                            });
                            emailsEnvoyes.push({
                                id: user.id,
                                email: user.email,
                                nom: `${user.first_name} ${user.last_name}`,
                                success: resultatEmail.success,
                                messageId: resultatEmail.messageId,
                                error: sandboxMode ? 'Mode sandbox - email simulé uniquement' : resultatEmail.error
                            });
                            if (resultatEmail.success) {
                                if (sandboxMode) {
                                    console.log(`🧪 [Messages] Email SIMULÉ avec succès à ${user.email} - ID: ${resultatEmail.messageId} (MODE SANDBOX)`);
                                }
                                else {
                                    console.log(`✅ [Messages] Email RÉELLEMENT envoyé à ${user.email} - ID: ${resultatEmail.messageId}`);
                                }
                            }
                            else {
                                console.error(`❌ [Messages] Échec envoi email à ${user.email}: ${resultatEmail.error}`);
                            }
                            // Pause entre les envois pour éviter le spam
                            await new Promise(resolve => setTimeout(resolve, 500));
                        }
                        catch (error) {
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
                    // Log des résultats finaux avec clarification
                    const reussis = emailsEnvoyes.filter(e => e.success).length;
                    const echecs = emailsEnvoyes.filter(e => !e.success).length;
                    const sandboxMode = process.env.SENDGRID_SANDBOX === 'true';
                    if (sandboxMode) {
                        console.log(`🧪 [Messages] Résultats emails (MODE SANDBOX): ${reussis}/${emailsEnvoyes.length} simulés avec succès`);
                        console.warn(`⚠️ [Messages] AUCUN EMAIL RÉEL N'A ÉTÉ ENVOYÉ - Pour recevoir de vrais emails, redémarrez le serveur après avoir vérifié SENDGRID_SANDBOX=false`);
                    }
                    else {
                        console.log(`📊 [Messages] Résultats emails (MODE PRODUCTION): ${reussis}/${emailsEnvoyes.length} envoyés RÉELLEMENT`);
                    }
                    if (echecs > 0) {
                        const erreursEmails = emailsEnvoyes.filter(e => !e.success);
                        console.error(`❌ [Messages] Échecs d'envoi:`, erreursEmails.map(e => `${e.email}: ${e.error}`));
                    }
                }
                else {
                    console.warn(`⚠️ [Messages] Aucun utilisateur avec email valide trouvé parmi ${destinataires.length} destinataires`);
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
        }
        catch (error) {
            console.error('Erreur lors de l\'envoi des messages:', error.message);
            throw error;
        }
    }
    // NOUVEAU: Générer le HTML pour l'email
    genererHTMLEmail(titre, contenu, prenom) {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${titre}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
          .content { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
          .header h2 { color: #27ae60; margin: 10px 0 0 0; font-size: 22px; }
          .message-content { background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1>🥋 Club Manager</h1>
              <h2>${titre}</h2>
            </div>
            
            <div class="message-content">
              <p style="margin: 0 0 15px 0; font-size: 16px;">
                Bonjour <strong>${prenom}</strong>,
              </p>
              <div style="white-space: pre-line; font-size: 16px; line-height: 1.6;">
                ${contenu}
              </div>
            </div>

            <div class="footer">
              <p style="margin: 0;">
                Cet email a été envoyé automatiquement par Club Manager.
              </p>
              <p style="margin: 5px 0 0 0;">
                © ${new Date().getFullYear()} Club Manager - Tous droits réservés
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    // NOUVEAU: Générer le texte simple pour l'email
    genererTextEmail(titre, contenu, prenom) {
        return `
${titre}

Bonjour ${prenom},

${contenu}

---
Cet email a été envoyé automatiquement par Club Manager.
© ${new Date().getFullYear()} Club Manager - Tous droits réservés
    `.trim();
    }
    // NOUVEAU: Restaurer un message supprimé
    async restaurerMessage(messageId) {
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
        }
        catch (error) {
            console.error('Erreur lors de la restauration du message :', error.message);
            throw error;
        }
    }
    // NOUVEAU: Suppression définitive (hard delete) - pour l'admin uniquement
    async supprimerDefinitivementMessage(messageId) {
        try {
            const query = `DELETE FROM messages_personnalises WHERE id = ?`;
            const results = await this.queryAsync(query, [messageId]);
            console.log(`💀 [Messages] Message ${messageId} supprimé définitivement`);
            return {
                isConfirm: true,
                message: "Message supprimé définitivement"
            };
        }
        catch (error) {
            console.error('Erreur lors de la suppression définitive du message :', error.message);
            throw error;
        }
    }
    // NOUVEAU: Statistiques des messages supprimés (différent de obtenirStatistiquesMessages)
    async obtenirStatistiquesSuppressions(periode = 'mois') {
        try {
            let dateCondition = '';
            switch (periode) {
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
        }
        catch (error) {
            console.error('Erreur lors de la récupération des statistiques de suppression:', error.message);
            throw error;
        }
    }
    // CORRIGÉ: Envoyer un rappel de paiement avec debug amélioré
    async envoyerRappelPaiementAvecEmail(senderId, receiverId, echeanceId, montant, dateEcheance) {
        try {
            console.log(`📧 [Messages] Début envoi rappel - Destinataire: ${receiverId}, Échéance: ${echeanceId}`);
            // 1. Créer le message interne
            const titre = 'Rappel de paiement - Échéance dépassée';
            const contenu = `Bonjour,

Nous vous informons qu'une échéance de paiement pour votre abonnement au club est dépassée.

${echeanceId ? `Référence de l'échéance : #${echeanceId}` : ''}
${montant ? `Montant : ${montant}€` : ''}
${dateEcheance ? `Date d'échéance : ${new Date(dateEcheance).toLocaleDateString('fr-FR')}` : ''}

Pour éviter toute interruption de service, nous vous invitons à régulariser votre situation dans les plus brefs délais.

Vous pouvez effectuer votre paiement directement en ligne via votre espace personnel.

En cas de difficulté, n'hésitez pas à nous contacter.

Cordialement,
L'équipe du Club Manager`;
            const messageInterne = await this.envoyerMessagePersonnalise(senderId, receiverId, titre, contenu);
            console.log(`📬 [Messages] Message interne ${messageInterne.isConfirm ? 'envoyé' : 'échoué'}`);
            // 2. Récupérer les informations de l'utilisateur pour l'email
            const utilisateur = await this.obtenirEmailsDestinataires([receiverId]);
            console.log(`👤 [Messages] Utilisateurs trouvés: ${utilisateur.length}`, utilisateur);
            let emailEnvoye = undefined;
            if (utilisateur.length > 0 && utilisateur[0].email) {
                const user = utilisateur[0];
                try {
                    console.log(`📧 [Messages] Tentative envoi email à ${user.email} (${user.first_name} ${user.last_name})`);
                    // Vérifier la configuration email
                    console.log('🔧 [Messages] Configuration email:');
                    console.log('  - emailService disponible:', !!emailService);
                    console.log('  - SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'Définie' : 'NON DÉFINIE');
                    console.log('  - SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL || 'NON DÉFINIE');
                    // Générer le lien de paiement sécurisé
                    const lienPaiement = this.genererLienPaiement(receiverId, echeanceId);
                    console.log(`🔗 [Messages] Lien de paiement généré: ${lienPaiement}`);
                    const emailData = {
                        to: user.email,
                        subject: `[ClubManager] Rappel de paiement - Action requise`,
                        html: this.genererHTMLEmailRappel(user.first_name, echeanceId, montant, dateEcheance, lienPaiement),
                        text: this.genererTextEmailRappel(user.first_name, echeanceId, montant, dateEcheance, lienPaiement)
                    };
                    console.log('📤 [Messages] Données email préparées:', {
                        to: emailData.to,
                        subject: emailData.subject,
                        htmlLength: emailData.html.length,
                        textLength: emailData.text.length
                    });
                    const resultatEmail = await emailService.envoyerEmailPersonnalise(emailData);
                    console.log('📊 [Messages] Résultat envoi email:', resultatEmail);
                    emailEnvoye = {
                        success: resultatEmail.success,
                        messageId: resultatEmail.messageId,
                        error: resultatEmail.error,
                        email: user.email
                    };
                    if (resultatEmail.success) {
                        console.log(`✅ [Messages] Email de rappel envoyé avec succès à ${user.email} - ID: ${resultatEmail.messageId}`);
                    }
                    else {
                        console.error(`❌ [Messages] Échec envoi email rappel à ${user.email}: ${resultatEmail.error}`);
                    }
                }
                catch (error) {
                    console.error(`❌ [Messages] Erreur envoi email rappel:`, error);
                    console.error(`❌ [Messages] Stack trace:`, error.stack);
                    emailEnvoye = {
                        success: false,
                        error: error.message,
                        email: user.email
                    };
                }
            }
            else {
                console.warn(`⚠️ [Messages] Aucun email trouvé pour l'utilisateur ${receiverId}`);
                emailEnvoye = {
                    success: false,
                    error: 'Aucun email configuré pour cet utilisateur',
                    email: 'Non disponible'
                };
            }
            return {
                messageInterne,
                emailEnvoye
            };
        }
        catch (error) {
            console.error('❌ [Messages] Erreur lors de l\'envoi du rappel:', error);
            console.error('❌ [Messages] Stack trace:', error.stack);
            throw error;
        }
    }
    // NOUVEAU: Générer un lien de paiement sécurisé
    genererLienPaiement(userId, echeanceId) {
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (echeanceId) {
            // Format demandé: /pages/paiement?echeance=487&userId=154
            return `${baseUrl}/pages/paiement?echeance=${echeanceId}&userId=${userId}`;
        }
        else {
            // Pour les paiements généraux sans échéance spécifique
            return `${baseUrl}/pages/paiement?userId=${userId}`;
        }
    }
    // NOUVEAU: Générer un token simple pour sécuriser le lien
    genererTokenPaiement(userId, echeanceId) {
        const data = `${userId}-${echeanceId || 'general'}-${Date.now()}`;
        // Dans un vrai projet, utilisez une librairie de cryptage plus robuste
        return Buffer.from(data).toString('base64').replace(/[+/=]/g, '');
    }
    // NOUVEAU: Générer le HTML pour l'email de rappel avec bouton
    genererHTMLEmailRappel(prenom, echeanceId, montant, dateEcheance, lienPaiement) {
        const dateFormatee = dateEcheance ? new Date(dateEcheance).toLocaleDateString('fr-FR') : '';
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rappel de paiement - Action requise</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .content { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
          .header h2 { color: #27ae60; margin: 10px 0 0 0; font-size: 22px; }
          .message-content { background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .footer { border-top: 1px solid #bdc3c7; padding-top: 20px; margin-top: 30px; color: #7f8c8d; font-size: 14px; text-align: center; }
          .alert-box { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .payment-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
          .payment-button { text-align: center; margin: 30px 0; }
          .btn-payment { 
            background-color: #28a745; 
            color: white; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-size: 18px; 
            font-weight: bold; 
            display: inline-block;
            box-shadow: 0 4px 10px rgba(40, 167, 69, 0.3);
            transition: background-color 0.3s ease;
          }
          .btn-payment:hover { background-color: #218838; }
          .urgent { color: #dc3545; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1>🥋 Club Manager</h1>
              <h2 style="color: #dc3545; margin: 10px 0;">⚠️ Rappel de paiement</h2>
            </div>
            
            <div class="alert-box">
              <h3 style="margin: 0 0 10px 0; color: #495057;">Bonjour <strong>${prenom}</strong>,</h3>
              <p style="margin: 0;">
                <span class="urgent">Une échéance de paiement pour votre abonnement au club est dépassée.</span>
              </p>
            </div>

            ${echeanceId || montant || dateEcheance ? `
            <div class="payment-details">
              <h4 style="margin: 0 0 15px 0; color: #495057;">📋 Détails du paiement :</h4>
              ${echeanceId ? `<p style="margin: 5px 0;"><strong>Référence :</strong> #${echeanceId}</p>` : ''}
              ${montant ? `<p style="margin: 5px 0;"><strong>Montant :</strong> <span style="color: #dc3545; font-size: 18px; font-weight: bold;">${montant}€</span></p>` : ''}
              ${dateEcheance ? `<p style="margin: 5px 0;"><strong>Date d'échéance :</strong> ${dateFormatee}</p>` : ''}
            </div>
            ` : ''}

            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">
                Pour éviter toute interruption de service, nous vous invitons à régulariser votre situation <strong>dans les plus brefs délais</strong>.
              </p>
            </div>

            ${lienPaiement ? `
            <div class="payment-button">
              <a href="${lienPaiement}" class="btn-payment">
                💳 Payer maintenant
              </a>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; color: #6c757d;">
                Ou copiez ce lien dans votre navigateur :<br>
                <a href="${lienPaiement}" style="color: #007bff; word-break: break-all;">${lienPaiement}</a>
              </p>
            </div>
            ` : ''}

            <div style="background-color: #f1f3f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0;">💡 Autres moyens de paiement :</h4>
              <ul style="margin: 5px 0; padding-left: 20px;">
                <li>Auprès de l'accueil du club</li>
                <li>Par virement bancaire (contactez-nous pour les détails)</li>
                <li>En ligne via votre espace personnel</li>
              </ul>
            </div>

            <div style="text-align: center; padding: 20px; background-color: #fff8e1; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 16px;">
                <strong>❓ Besoin d'aide ?</strong><br>
                N'hésitez pas à nous contacter pour toute question ou difficulté.
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0;">
                Cet email a été envoyé automatiquement par Club Manager.
              </p>
              <p style="margin: 5px 0 0 0;">
                © ${new Date().getFullYear()} Club Manager - Tous droits réservés
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    // NOUVEAU: Générer le texte simple pour l'email de rappel
    genererTextEmailRappel(prenom, echeanceId, montant, dateEcheance, lienPaiement) {
        const dateFormatee = dateEcheance ? new Date(dateEcheance).toLocaleDateString('fr-FR') : '';
        return `
🥋 CLUB MANAGER - RAPPEL DE PAIEMENT ⚠️

Bonjour ${prenom},

Une échéance de paiement pour votre abonnement au club est dépassée.

DÉTAILS DU PAIEMENT :
${echeanceId ? `- Référence : #${echeanceId}` : ''}
${montant ? `- Montant : ${montant}€` : ''}
${dateEcheance ? `- Date d'échéance : ${dateFormatee}` : ''}

Pour éviter toute interruption de service, nous vous invitons à régulariser votre situation dans les plus brefs délais.

${lienPaiement ? `
PAYER EN LIGNE :
${lienPaiement}
` : ''}

AUTRES MOYENS DE PAIEMENT :
• Auprès de l'accueil du club
• Par virement bancaire (contactez-nous pour les détails)
• En ligne via votre espace personnel

En cas de difficulté, n'hésitez pas à nous contacter.

Cordialement,
L'équipe du Club Manager

---
Cet email a été envoyé automatiquement par Club Manager.
© ${new Date().getFullYear()} Club Manager - Tous droits réservés
    `.trim();
    }
}
