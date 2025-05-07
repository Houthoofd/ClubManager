var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import MysqlConnector from '../../connector/mysqlconnector.js';
export class Chat {
    // Enregistre un message dans la base de données
    enregistrerMessage(senderId, receiverId, contenu) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    // Récupère l'historique des 50 derniers messages
    recupererHistorique() {
        return __awaiter(this, void 0, void 0, function* () {
            const mysqlConnector = new MysqlConnector();
            const selectSql = `
      SELECT * FROM messages ORDER BY created_at DESC LIMIT 50
    `;
            return new Promise((resolve, reject) => {
                mysqlConnector.query(selectSql, [], (error, results) => {
                    mysqlConnector.close();
                    if (error)
                        return reject(error);
                    resolve(results);
                });
            });
        });
    }
    // Envoie un message à un destinataire spécifique ou à un groupe
    envoyerMessage(senderId, receiverId, groupeId, message) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
