import MysqlConnector from '../../connector/mysqlconnector.js';
export class MessagerieClient {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    // Utilitaire pour utiliser le client avec Promise - CORRIGÉ le typage
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
    // ========== GESTION DES TYPES DE MESSAGES ==========
    async getAllTypesMessages() {
        const results = await this.queryAsync('SELECT * FROM types_messages_personnalises ORDER BY title', []);
        return Array.isArray(results) ? results : [];
    }
    async getTypeMessageById(id) {
        const results = await this.queryAsync('SELECT * FROM types_messages_personnalises WHERE id = ?', [id]);
        return Array.isArray(results) && results.length > 0 ? results[0] : null;
    }
    async createTypeMessage(title, content) {
        const results = await this.queryAsync('INSERT INTO types_messages_personnalises (title, content) VALUES (?, ?)', [title, content]);
        return results.insertId;
    }
    async updateTypeMessage(id, title, content) {
        const results = await this.queryAsync('UPDATE types_messages_personnalises SET title = ?, content = ?, updated_at = NOW() WHERE id = ?', [title, content, id]);
        return results.affectedRows > 0;
    }
    async deleteTypeMessage(id) {
        const results = await this.queryAsync('DELETE FROM types_messages_personnalises WHERE id = ?', [id]);
        return results.affectedRows > 0;
    }
    // ========== GESTION DES UTILISATEURS ==========
    async getUserIdFromUserId(userId) {
        const results = await this.queryAsync('SELECT id FROM utilisateurs WHERE userId = ?', [userId]);
        return Array.isArray(results) && results.length > 0 ? results[0].id : null;
    }
    async getAllUsers() {
        const results = await this.queryAsync(`SELECT 
        id,
        userId,
        CONCAT(first_name, ' ', last_name) as full_name,
        first_name,
        last_name,
        email,
        s.nom_role as status
      FROM utilisateurs u
      LEFT JOIN status s ON u.status_id = s.id
      WHERE active = TRUE
      ORDER BY first_name, last_name`, []);
        return Array.isArray(results) ? results : [];
    }
    // ========== GESTION DES MESSAGES REÇUS ==========
    async getMessagesRecus(userId) {
        // Convertir userId en id numérique si nécessaire
        let userIdNum = userId;
        if (isNaN(Number(userId))) {
            const numericId = await this.getUserIdFromUserId(userId);
            if (!numericId) {
                throw new Error('Utilisateur non trouvé');
            }
            userIdNum = numericId.toString();
        }
        const results = await this.queryAsync(`SELECT 
        mp.id,
        mp.contenu as content,
        mp.created_at as date_reception,
        'Système' as expediteur_prenom,
        'Club Manager' as expediteur_nom,
        'Message personnalisé' as title,
        FALSE as lu
      FROM messages_personnalises mp
      WHERE mp.utilisateur_id = ?
      ORDER BY mp.created_at DESC`, [userIdNum]);
        return Array.isArray(results) ? results : [];
    }
    async marquerMessageLu(messageId, userId) {
        // Pour l'instant, retourner true car la table messages_personnalises n'a pas de champ 'lu'
        // TODO: Ajouter un champ 'lu' à la table ou créer une table de statuts
        return true;
    }
    async supprimerMessageRecu(messageId, userId) {
        const results = await this.queryAsync('DELETE FROM messages_personnalises WHERE id = ?', [messageId]);
        return results.affectedRows > 0;
    }
    // ========== ENVOI DE MESSAGES ==========
    async envoyerMessage(destinataires, typeMessageId, expediteurId) {
        // Récupérer le contenu du type de message
        const typeMessage = await this.getTypeMessageById(typeMessageId);
        if (!typeMessage) {
            throw new Error('Type de message non trouvé');
        }
        const contenu = typeMessage.content;
        let successCount = 0;
        // Insérer un message personnalisé pour chaque destinataire
        for (const destinataireId of destinataires) {
            try {
                await this.queryAsync('INSERT INTO messages_personnalises (utilisateur_id, contenu) VALUES (?, ?)', [destinataireId, contenu]);
                successCount++;
            }
            catch (error) {
                console.error(`Erreur envoi message à utilisateur ${destinataireId}:`, error);
            }
        }
        return {
            success: successCount > 0,
            count: successCount,
            message: `Message envoyé à ${successCount}/${destinataires.length} destinataire(s)`
        };
    }
    async envoyerMessagePersonnalise(destinataireId, contenu, expediteurId) {
        try {
            await this.queryAsync('INSERT INTO messages_personnalises (utilisateur_id, contenu) VALUES (?, ?)', [destinataireId, contenu]);
            return true;
        }
        catch (error) {
            console.error('Erreur envoi message personnalisé:', error);
            return false;
        }
    }
    // ========== STATISTIQUES ==========
    async getStatistiquesMessages(userId) {
        const stats = {};
        // Nombre total de types de messages
        const totalTypes = await this.queryAsync('SELECT COUNT(*) as count FROM types_messages_personnalises', []);
        stats.totalTypesMessages = Array.isArray(totalTypes) ? totalTypes[0]?.count : 0;
        // Nombre total de messages envoyés
        const totalMessages = await this.queryAsync('SELECT COUNT(*) as count FROM messages_personnalises', []);
        stats.totalMessagesEnvoyes = Array.isArray(totalMessages) ? totalMessages[0]?.count : 0;
        // Si userId spécifié, statistiques pour cet utilisateur
        if (userId) {
            const userMessages = await this.queryAsync('SELECT COUNT(*) as count FROM messages_personnalises WHERE utilisateur_id = ?', [userId]);
            stats.messagesUtilisateur = Array.isArray(userMessages) ? userMessages[0]?.count : 0;
        }
        // Messages par jour (derniers 7 jours)
        const messagesParJour = await this.queryAsync(`SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM messages_personnalises 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC`, []);
        stats.messagesParJour = Array.isArray(messagesParJour) ? messagesParJour : [];
        return stats;
    }
    // ========== NETTOYAGE ==========
    async nettoyerAnciennesMessages(joursAConserver = 30) {
        const results = await this.queryAsync('DELETE FROM messages_personnalises WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)', [joursAConserver]);
        return results.affectedRows || 0;
    }
}
// Instance singleton
let messagerieClientInstance = null;
export function getMessagerieClient() {
    if (!messagerieClientInstance) {
        messagerieClientInstance = new MessagerieClient();
    }
    return messagerieClientInstance;
}
export const messagerieClient = getMessagerieClient();
