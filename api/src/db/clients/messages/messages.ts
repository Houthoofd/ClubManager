import { ConfirmationResult, VerifyResultWithData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Message {

  async envoyerMessage(utilisateur_id: number, contenu: string): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const query = `
        INSERT INTO messages_personnalises (utilisateur_id, contenu)
        VALUES (?, ?)
      `;
      const params = [utilisateur_id, contenu];
  
      console.log("Exécution de la requête pour insérer un message");
  
      mysqlConnector.query(query, params, (error: any, results: any) => {
        // Fermer la connexion d'abord, avant toute réponse
        mysqlConnector.close();
  
        if (error) {
          console.error('Erreur lors de l’insertion du message : ' + error.message);
          reject(error);
        } else {
          console.log('Message inséré avec succès :', results);
  
          // Ici on peut préparer un "ConfirmationResult" propre
          const confirmation: ConfirmationResult = {
            isConfirm: true,
            message: "Le message à bien été enregistrée"
          };
  
          resolve(confirmation);
        }
      });
    });
  }
  
  async creerTypeMessage(title: string, content: string): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const query = `
        INSERT INTO types_messages_personnalises (title, content)
        VALUES (?, ?)
      `;
      const params = [title, content];

      console.log("Exécution de la requête pour insérer un type de message personnalisé");

      mysqlConnector.query(query, params, (error: any, results: any) => {
        mysqlConnector.close();

        if (error) {
          console.error('Erreur lors de l’insertion du type de message personnalisé : ' + error.message);
          reject(error);
        } else {
          console.log('Type de message personnalisé inséré avec succès :', results);

          const confirmation: ConfirmationResult = {
            isConfirm: true,
            message: "Le type de message personnalisé a bien été enregistré"
          };

          resolve(confirmation);
        }
      });
    });
  }

  async obtenirTousLesTypesDeMessages(): Promise<VerifyResultWithData> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const query = `
        SELECT * FROM types_messages_personnalises
      `;
  
      console.log("Exécution de la requête pour récupèrer tous les types de message");
  
      mysqlConnector.query(query, [], (error: any, results: any) => {
        mysqlConnector.close();
  
        if (error) {
          console.error('Erreur lors de la requête pour récupèrer tous les types de message : ' + error.message);
          reject(error);
        } else {
          console.log('Types de message personnalisés récupérés avec succès :', results);
  
          // Ici on renvoie les résultats dans le champ data
          const confirmation: VerifyResultWithData = {
            isFind: true,
            message: "Types de messages récupérés avec succès",
            data: results  // ✅ On envoie les résultats ici
          };
  
          resolve(confirmation);
        }
      });
    });
  }
  
  
}
