import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, VerifyResultWithData, ConfirmationResult } from '@clubmanager/types';

export class Paiements {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  async obtenirPaiements(): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirPaiements");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    return new Promise((resolve, reject) => {
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

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des paiements : ' + error.message);
          reject(error);
        } else {
          console.log('cours récupérés avec succès :', results);
          resolve(results);
        }
      });
    });
  }

  /**
   * Récupère les paiements pour un utilisateur spécifique
   * @param utilisateurId - L'ID de l'utilisateur
   * @returns Une promesse qui résout avec la liste des paiements de l'utilisateur
   */
  async obtenirPaiementsParUtilisateur(utilisateur_id: number): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirPaiementsParUtilisateur");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM paiements WHERE utilisateur_id = ?`;
      console.log('Param utilisateur_id:', utilisateur_id);
      
      this.mysqlConnector.query(sql, [utilisateur_id], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des paiements par utilisateur:', error);
          reject(error);
        } else {
          resolve({
            isFind: true,
            message: "Paiements récupérés",
            data: results
          });
        }
      });
    });
  }

  /**
   * Crée un nouveau paiement
   * @param paiementData - Les données du paiement à créer
   * @returns Une promesse qui résout avec les données du paiement créé
   */
  async creerPaiement(paiementData: any): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour creerPaiement");
      throw new Error("Service temporairement indisponible - Pool fermé");
    }

    return new Promise((resolve, reject) => {
      // Générer la date actuelle pour le paiement
      const dateActuelle = new Date().toISOString().slice(0, 19).replace('T', ' ');
      
      const sql = `
        INSERT INTO paiements 
          (utilisateur_id, montant, description, date, statut, abonnement_id)
        VALUES 
          (?, ?, ?, ?, 'en attente', ?);
      `;

      const values = [
        paiementData.utilisateur_id,
        paiementData.montant,
        paiementData.description,
        dateActuelle,
        paiementData.abonnement_id || null
      ];

      console.log("Exécution de la requête pour créer un paiement");
      console.log(sql, values);

      this.mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          console.error('Erreur lors de la création du paiement : ' + error.message);
          reject(error);
        } else {
          console.log('Paiement créé avec succès, ID:', results.insertId);
          
          // Retourner les données du paiement créé
          const createdPaiement = {
            id: results.insertId,
            ...paiementData,
            date: dateActuelle,
            statut: 'en attente'
          };
          
          resolve(createdPaiement);
        }
      });
    });
  }

  /**
   * Modifie le statut d'un paiement
   * @param id - L'ID du paiement
   * @param statut - Le nouveau statut à appliquer
   * @returns Une promesse qui résout avec le résultat de l'opération
   */
  async modifierStatutPaiement(id: number, statut: string): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour modifierStatutPaiement");
      throw new Error("Service temporairement indisponible - Pool fermé");
    }

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE paiements 
        SET statut = ?
        WHERE id = ?;
      `;

      this.mysqlConnector.query(sql, [statut, id], (error, results) => {
        if (error) {
          console.error('Erreur lors de la modification du statut du paiement : ' + error.message);
          reject(error);
        } else {
          console.log('Statut du paiement modifié avec succès, ID:', id);
          resolve({ id, statut });
        }
      });
    });
  }

  /**
   * Récupère les échéances de paiement pour un utilisateur spécifique
   * @param utilisateurId - L'ID de l'utilisateur
   * @returns Une promesse qui résout avec la liste des échéances
   */
  async obtenirEcheancesPaiements(utilisateurId: number): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirEcheancesPaiements");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          id,
          abonnement_id,
          date_echeance,
          montant,
          statut
        FROM echeances_paiements
        WHERE utilisateur_id = ?
        ORDER BY date_echeance DESC;
      `;

      console.log('SQL pour échéances:', sql);
      console.log('Param utilisateur_id:', utilisateurId);

      this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
        if (error) {
          console.error('Erreur SQL échéances:', error);
          reject(error);
        } else {
          console.log('Résultats échéances:', results);
          resolve(results);
        }
      });
    });
  }

  enregistrerPaiement(paiementData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO paiements (utilisateur_id, montant, methode_paiement, date_paiement, status_id)
        VALUES (?, ?, ?, NOW(), 1)
      `;

      this.mysqlConnector.query(sql, [
        paiementData.utilisateur_id,
        paiementData.montant,
        paiementData.methode_paiement
      ], (error, results) => {
        if (error) {
          console.error('Erreur lors de l\'enregistrement du paiement :', error);
          reject(error);
        } else {
          resolve({
            isConfirm: true,
            message: 'Paiement enregistré avec succès'
          });
        }
      });
    });
  }

  annulerPaiement(paiementId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE paiements 
        SET status_id = 0
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [paiementId], (error, results: any) => {
        if (error) {
          console.error('Erreur lors de l\'annulation du paiement :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Paiement non trouvé ou déjà annulé'
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Paiement annulé avec succès'
          });
        }
      });
    });
  }

  // Ajouter les méthodes manquantes
  async obtenirLesTousLesPaiements(): Promise<any> {
    return this.obtenirPaiements();
  }

  async obtenirEcheancesPourUtilisateur(utilisateurId: number): Promise<any> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirEcheancesPourUtilisateur");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM echeances_paiements WHERE utilisateur_id = ?`;
      
      this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des échéances:', error);
          reject(error);
        } else {
          resolve({
            isFind: true,
            message: "Échéances récupérées",
            data: results
          });
        }
      });
    });
  }
}