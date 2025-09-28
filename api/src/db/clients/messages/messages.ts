import { ConfirmationResult, VerifyResultWithData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Messages {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  async obtenirMessages(): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirMessages");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    return new Promise((resolve, reject) => {
      const query = `
        SELECT m.*, u.nom, u.prenom
        FROM messages m
        JOIN utilisateurs u ON m.utilisateur_id = u.id
        ORDER BY m.date_envoi DESC
      `;
  
      console.log("Exécution de la requête pour récupérer tous les messages");
  
      this.mysqlConnector.query(query, [], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la requête pour récupérer tous les messages : ' + error.message);
          reject(error);
        } else {
          console.log('Messages récupérés avec succès :', results);
  
          const confirmation: VerifyResultWithData = {
            isFind: true,
            message: "Messages récupérés avec succès",
            data: results
          };
  
          resolve(confirmation);
        }
      });
    });
  }

  async envoyerMessage(messageData: any): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour envoyerMessage");
      throw new Error("Service temporairement indisponible - Pool fermé");
    }

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO messages (utilisateur_id, contenu, date_envoi)
        VALUES (?, ?, NOW())
      `;
      const params = [messageData.utilisateur_id, messageData.contenu];
  
      console.log("Exécution de la requête pour insérer un message");
  
      this.mysqlConnector.query(query, params, (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de l’insertion du message : ' + error.message);
          reject(error);
        } else {
          console.log('Message inséré avec succès :', results);
  
          const confirmation: ConfirmationResult = {
            isConfirm: true,
            message: "Le message à bien été enregistrée"
          };
  
          resolve(confirmation);
        }
      });
    });
  }

  async marquerCommeLu(messageId: number, utilisateurId: number): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour marquerCommeLu");
      throw new Error("Service temporairement indisponible - Pool fermé");
    }

    return new Promise((resolve, reject) => {
      const query = `
        UPDATE messages
        SET lu = 1
        WHERE id = ? AND utilisateur_id = ?
      `;
      const params = [messageId, utilisateurId];
  
      console.log("Exécution de la requête pour marquer le message comme lu");
  
      this.mysqlConnector.query(query, params, (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la mise à jour du message : ' + error.message);
          reject(error);
        } else {
          console.log('Message marqué comme lu avec succès :', results);
  
          const confirmation: ConfirmationResult = {
            isConfirm: true,
            message: "Le message a bien été marqué comme lu"
          };
  
          resolve(confirmation);
        }
      });
    });
  }

  async obtenirMessagesPersonnalises(): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirMessagesPersonnalises");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    return new Promise((resolve, reject) => {
      const query = `
        SELECT mp.*, u.nom, u.prenom
        FROM messages_personnalises mp
        JOIN utilisateurs u ON mp.utilisateur_id = u.id
        ORDER BY mp.date_envoi DESC
      `;
  
      console.log("Exécution de la requête pour récupérer tous les messages personnalisés");
  
      this.mysqlConnector.query(query, [], (error: any, results: any) => {
        if (error) {
          console.error('Erreur lors de la requête pour récupérer tous les messages personnalisés : ' + error.message);
          reject(error);
        } else {
          console.log('Messages personnalisés récupérés avec succès :', results);
  
          const confirmation: VerifyResultWithData = {
            isFind: true,
            message: "Messages personnalisés récupérés avec succès",
            data: results
          };
  
          resolve(confirmation);
        }
      });
    });
  }
}

