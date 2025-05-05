import {ConfirmationResult, CoursData, UserData, Professeur, VerifyResultWithData} from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Chat {

  async enregistrerMessage(utilisateur:any, message:any) {
    const mysqlConnector = new MysqlConnector();
    const insertSql = `
      INSERT INTO messages (utilisateur, message, date_envoi)
      VALUES (?, ?, NOW())
    `;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(insertSql, [utilisateur, message], (error, result) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
  
  async recupererHistorique() {
    const mysqlConnector = new MysqlConnector();
    const selectSql = `
      SELECT * FROM messages ORDER BY date_envoi DESC LIMIT 50
    `;
    return new Promise((resolve, reject) => {
      mysqlConnector.query(selectSql, [], (error, results) => {
        mysqlConnector.close();
        if (error) return reject(error);
        resolve(results);
      });
    });
  }
}