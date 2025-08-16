import MysqlConnector from '../../connector/mysqlconnector.js';
export class Chat {
    // Enregistre un message dans la base de données
    async enregistrerMessage(senderId, receiverId, contenu) {
        console.log({ id_envoie: senderId, id_dest: receiverId, message: contenu });
        const mysqlConnector = new MysqlConnector();
        const insertSql = `
      INSERT INTO messages (sender_id, receiver_id, contenu, created_at)
      VALUES (?, ?, ?, NOW())
    `;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(insertSql, [senderId, receiverId, contenu], (error, result) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve(result);
            });
        });
    }
    // Récupère l'historique des 50 derniers messages
    async recupererHistorique(userId, receiverId) {
        const mysqlConnector = new MysqlConnector();
        const selectSql = `
      SELECT * FROM messages 
      WHERE 
        (sender_id = ? AND receiver_id = ?) 
        OR 
        (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at DESC 
      LIMIT 50
    `;
        const params = [userId, receiverId, receiverId, userId];
        return new Promise((resolve, reject) => {
            mysqlConnector.query(selectSql, params, (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve(results);
            });
        });
    }
    // Envoie un message à un destinataire spécifique ou à un groupe
    async envoyerMessage(senderId, receiverId, groupeId, message) {
        const mysqlConnector = new MysqlConnector();
        const insertSql = `
      INSERT INTO messages (sender_id, receiver_id, groupe_id, contenu, date_envoi)
      VALUES (?, ?, ?, ?, NOW())
    `;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(insertSql, [senderId, receiverId, groupeId, message], (error, result) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve(result);
            });
        });
    }
}
