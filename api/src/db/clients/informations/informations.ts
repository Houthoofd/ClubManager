import MysqlConnector from '../../connector/mysqlconnector.js';

export class Informations {
  // Récupérer les statuts
  obtenirLeStatus(): Promise<Array<{ id: number; nom: string }>> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM status`;

      console.log("Exécution de la requête pour obtenir les statuts");

      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des statuts : ' + error.message);
          reject(error);
        } else {
          console.log('Statuts récupérés avec succès :', results);
          resolve(results); // retourne les statuts obtenus
        }

        // Fermer la connexion après avoir traité les résultats
        mysqlConnector.close();
      });
    });
  }

  // Récupérer les plans tarifaires
  obtenirLesPlansTarifaires(): Promise<Array<{ id: number; nom: string }>> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM plans_tarifaires`;

      console.log("Exécution de la requête pour obtenir les plans tarifaires");

      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des plans tarifaires : ' + error.message);
          reject(error);
        } else {
          console.log('Plans tarifaires récupérés avec succès :', results);
          resolve(results); // retourne les plans tarifaires obtenus
        }

        // Fermer la connexion après avoir traité les résultats
        mysqlConnector.close();
      });
    });
  }

  // Récupérer les genres
  obtenirLesGenres(): Promise<Array<{ id: number; nom: string }>> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM genres`;

      console.log("Exécution de la requête pour obtenir les genres");

      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des genres : ' + error.message);
          reject(error);
        } else {
          console.log('Genres récupérés avec succès :', results);
          resolve(results); // retourne les genres obtenus
        }

        // Fermer la connexion après avoir traité les résultats
        mysqlConnector.close();
      });
    });
  }

  // Récupérer les grades
  obtenirLesGrades(): Promise<Array<{ id: number; nom: string }>> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM grades`;
  
      console.log("Exécution de la requête pour obtenir les grades");
  
      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des grades : ' + error.message);
          reject(error);
        } else {
          console.log('Grades récupérés avec succès :', results);
          resolve(results);
        }
  
        mysqlConnector.close();
      });
    });
  }  
}
