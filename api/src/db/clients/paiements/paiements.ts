import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, VerifyResultWithData } from '@clubmanager/types';

export class Paiements{
    obtenirLesTousLesPaiements() {
      return new Promise((resolve, reject) => {
        const mysqlConnector = new MysqlConnector();
        const sql = `
          SELECT paiements.*, 
            utilisateurs.first_name, 
             utilisateurs.last_name, 
          plans_tarifaires.nom_plan
        FROM paiements
        INNER JOIN utilisateurs ON paiements.utilisateur_id = utilisateurs.id
        INNER JOIN plans_tarifaires ON paiements.abonnement_id = plans_tarifaires.id;

        `;
    
        console.log("Exécution de la requête pour obtenir les paiements");
    
        mysqlConnector.query(sql, [], (error, results) => {
          if (error) {
            console.error('Erreur lors de la récupération des paiements : ' + error.message);
            reject(error);
          } else {
            console.log('cours récupérés avec succès :', results);
            resolve(results);
          }
    
          mysqlConnector.close();
        });
      });
    }
}