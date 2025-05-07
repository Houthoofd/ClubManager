import {ConfirmationResult, CoursData, UserData, Professeur, VerifyResultWithData} from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Chat {

  // Enregistre un message dans la base de données
  async enregistrerMessage(senderId: number | null, receiverId: number | null, contenu: string) {
    console.log({ id_envoie: senderId, id_dest: receiverId, message: contenu})
    const mysqlConnector = new MysqlConnector();
    const insertSql = `
      INSERT INTO messages (sender_id, receiver_id, contenu, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(insertSql, [senderId, receiverId, contenu], (error, result) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
  

  // Récupère l'historique des 50 derniers messages
  async recupererHistorique() {
    const mysqlConnector = new MysqlConnector();
    const selectSql = `
      SELECT * FROM messages ORDER BY created_at DESC LIMIT 50
    `;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(selectSql, [], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve(results);
      });
    });
  }

  // Envoie un message à un destinataire spécifique ou à un groupe
  async envoyerMessage(senderId: number, receiverId: number | null, groupeId: number | null, message: string) {
    const mysqlConnector = new MysqlConnector();
    const insertSql = `
      INSERT INTO messages (sender_id, receiver_id, groupe_id, contenu, date_envoi)
      VALUES (?, ?, ?, ?, NOW())
    `;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(insertSql, [senderId, receiverId, groupeId, message], (error, result) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
