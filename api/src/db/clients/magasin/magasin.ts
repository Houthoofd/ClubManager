import { } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Magasin {

  // Récupérer les articles
  obtenirLesArticles(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM articles`;
  
      console.log("Exécution de la requête pour obtenir les articles");
  
      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des articles : ' + error.message);
          reject(error);
        } else {
          console.log('Articles récupérés avec succès :', results);
          resolve(results);
        }
  
        mysqlConnector.close();
      });
    });
  }
  
}

