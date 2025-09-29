import MysqlConnector from '../../connector/mysqlconnector.js';
export class Message {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    async envoyerMessage(utilisateur_id, contenu) {
        return new Promise((resolve, reject) => {
            const query = `
        INSERT INTO messages_personnalises (utilisateur_id, contenu)
        VALUES (?, ?)
      `;
            const params = [utilisateur_id, contenu];
            this.mysqlConnector.query(query, params, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'envoi du message personnalisé : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Message personnalisé envoyé avec succès :', results);
                    const confirmation = {
                        isConfirm: true,
                        message: "Le message a bien été envoyé"
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    async creerTypeMessage(title, content) {
        return new Promise((resolve, reject) => {
            const query = `
        INSERT INTO types_messages_personnalises (title, content)
        VALUES (?, ?)
      `;
            const params = [title, content];
            this.mysqlConnector.query(query, params, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'insertion du type de message personnalisé : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Type de message personnalisé inséré avec succès :', results);
                    const confirmation = {
                        isConfirm: true,
                        message: "Le type de message personnalisé a bien été enregistré"
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    async obtenirTousLesTypesDeMessages() {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT * FROM types_messages_personnalises
        ORDER BY created_at DESC
      `;
            console.log("Exécution de la requête pour récupérer tous les types de message");
            this.mysqlConnector.query(query, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la requête pour récupérer tous les types de message : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Types de message personnalisés récupérés avec succès :', results);
                    const confirmation = {
                        isFind: true,
                        message: "Types de messages récupérés avec succès",
                        data: results
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    // Récupérer les messages reçus par un utilisateur
    async obtenirMessagesRecusParUtilisateur(userId) {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT 
          m.id,
          tmp.title,
          m.contenu as content,
          CONCAT(u.first_name, ' ', u.last_name) as sender,
          m.created_at as date_envoi,
          CASE WHEN ms.status = 'vu' THEN true ELSE false END as lu
        FROM messages m
        LEFT JOIN utilisateurs u ON m.sender_id = u.id
        LEFT JOIN types_messages_personnalises tmp ON m.contenu LIKE CONCAT('%', tmp.content, '%')
        LEFT JOIN message_status ms ON m.id = ms.message_id AND ms.utilisateur_id = ?
        WHERE m.receiver_id = ?
        ORDER BY m.created_at DESC
      `;
            this.mysqlConnector.query(query, [userId, userId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des messages reçus : ' + error.message);
                    reject(error);
                }
                else {
                    const confirmation = {
                        isFind: true,
                        message: "Messages reçus récupérés avec succès",
                        data: results
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    // Marquer un message comme lu
    async marquerMessageCommeLu(messageId) {
        return new Promise((resolve, reject) => {
            const query = `
        INSERT INTO message_status (message_id, utilisateur_id, status)
        SELECT ?, receiver_id, 'vu'
        FROM messages 
        WHERE id = ?
        ON DUPLICATE KEY UPDATE 
          status = 'vu', 
          updated_at = CURRENT_TIMESTAMP
      `;
            this.mysqlConnector.query(query, [messageId, messageId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la mise à jour du statut du message : ' + error.message);
                    reject(error);
                }
                else {
                    const confirmation = {
                        isConfirm: true,
                        message: "Message marqué comme lu avec succès"
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    // Supprimer un message reçu
    async supprimerMessageRecu(messageId) {
        return new Promise((resolve, reject) => {
            // Supprimer d'abord les statuts de message associés
            const deleteStatusQuery = `DELETE FROM message_status WHERE message_id = ?`;
            this.mysqlConnector.query(deleteStatusQuery, [messageId], (error) => {
                if (error) {
                    console.error('Erreur lors de la suppression du statut du message : ' + error.message);
                    reject(error);
                    return;
                }
                // Ensuite supprimer le message principal
                const deleteMessageQuery = `DELETE FROM messages WHERE id = ?`;
                this.mysqlConnector.query(deleteMessageQuery, [messageId], (error, results) => {
                    if (error) {
                        console.error('Erreur lors de la suppression du message : ' + error.message);
                        reject(error);
                    }
                    else {
                        const confirmation = {
                            isConfirm: true,
                            message: "Message supprimé avec succès"
                        };
                        resolve(confirmation);
                    }
                });
            });
        });
    }
    // Obtenir un type de message par ID
    async obtenirTypeMessageParId(id) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM types_messages_personnalises WHERE id = ?`;
            this.mysqlConnector.query(query, [id], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération du type de message : ' + error.message);
                    reject(error);
                }
                else {
                    resolve(results[0] || null);
                }
            });
        });
    }
    // Modifier un type de message
    async modifierTypeMessage(id, title, content) {
        return new Promise((resolve, reject) => {
            const query = `
        UPDATE types_messages_personnalises 
        SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
            this.mysqlConnector.query(query, [title, content, id], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la modification du type de message : ' + error.message);
                    reject(error);
                }
                else {
                    const confirmation = {
                        isConfirm: true,
                        message: "Type de message modifié avec succès"
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    // Supprimer un type de message
    async supprimerTypeMessage(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM types_messages_personnalises WHERE id = ?`;
            this.mysqlConnector.query(query, [id], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la suppression du type de message : ' + error.message);
                    reject(error);
                }
                else {
                    const confirmation = {
                        isConfirm: true,
                        message: "Type de message supprimé avec succès"
                    };
                    resolve(confirmation);
                }
            });
        });
    }
    // Envoyer un message personnalisé avec expéditeur
    async envoyerMessagePersonnalise(senderId, receiverId, title, content) {
        return new Promise((resolve, reject) => {
            // Insérer le message principal dans la table messages
            const messageQuery = `
        INSERT INTO messages (sender_id, receiver_id, contenu, created_at) 
        VALUES (?, ?, ?, NOW())
      `;
            const messageContent = `${title}: ${content}`;
            this.mysqlConnector.query(messageQuery, [senderId, receiverId, messageContent], (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'insertion du message : ' + error.message);
                    reject(error);
                }
                else {
                    const messageId = results.insertId;
                    // Marquer comme non lu par défaut
                    const statusQuery = `
            INSERT INTO message_status (message_id, utilisateur_id, status) 
            VALUES (?, ?, 'non vu')
          `;
                    this.mysqlConnector.query(statusQuery, [messageId, receiverId], (statusError) => {
                        if (statusError) {
                            console.error('Erreur lors de l\'insertion du statut : ' + statusError.message);
                            // Ne pas rejeter ici, le message principal est créé
                        }
                        const confirmation = {
                            isConfirm: true,
                            message: "Message envoyé avec succès"
                        };
                        resolve(confirmation);
                    });
                }
            });
        });
    }
    // Compter les messages non lus d'un utilisateur
    async compterMessagesNonLus(userId) {
        return new Promise((resolve, reject) => {
            const query = `
        SELECT COUNT(*) as count
        FROM messages m
        LEFT JOIN message_status ms ON m.id = ms.message_id AND ms.utilisateur_id = ?
        WHERE m.receiver_id = ? 
        AND (ms.status IS NULL OR ms.status = 'non vu')
      `;
            this.mysqlConnector.query(query, [userId, userId], (error, results) => {
                if (error) {
                    console.error('Erreur lors du comptage des messages non lus : ' + error.message);
                    reject(error);
                }
                else {
                    const count = results[0]?.count || 0;
                    resolve(count);
                }
            });
        });
    }
}
