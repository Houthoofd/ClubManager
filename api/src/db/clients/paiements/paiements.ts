import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, VerifyResultWithData, ConfirmationResult } from '@clubmanager/types';

export class Paiements {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  obtenirLesTousLesPaiements() {
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
  obtenirPaiementsParUtilisateur(utilisateurId: number) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT paiements.*, 
          utilisateurs.first_name, 
          utilisateurs.last_name, 
          plans_tarifaires.nom_plan
        FROM paiements
        INNER JOIN utilisateurs ON paiements.utilisateur_id = utilisateurs.id
        INNER JOIN plans_tarifaires ON paiements.abonnement_id = plans_tarifaires.id
        WHERE paiements.utilisateur_id = ?;
      `;

      console.log(`Exécution de la requête pour obtenir les paiements de l'utilisateur ID ${utilisateurId}`);

      this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la récupération des paiements pour l'utilisateur ${utilisateurId}: ${error.message}`);
          reject(error);
        } else {
          console.log(`Paiements récupérés avec succès pour l'utilisateur ${utilisateurId}:`, results);
          resolve(results);
        }
      });
    });
  }

  /**
   * Crée un nouveau paiement
   * @param paiementData - Les données du paiement à créer
   * @returns Une promesse qui résout avec les données du paiement créé
   */
  creerPaiement(paiementData: {
    utilisateur_id: number;
    montant: number;
    description: string;
    abonnement_id?: number;
  }) {
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
   * Récupère les échéances de paiement pour un utilisateur spécifique
   * @param utilisateurId - L'ID de l'utilisateur
   * @returns Une promesse qui résout avec la liste des échéances
   */
  obtenirEcheancesPourUtilisateur(utilisateurId: number) {
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
}