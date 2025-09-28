import { VerifyResultWithData, ConfirmationResult } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Verifications {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  async verifierUtilisateur(email: string): Promise<VerifyResultWithData> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierUtilisateur");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    try {
      const sql = 'SELECT * FROM utilisateurs WHERE email = ?';
      const values = [email];

      return new Promise<VerifyResultWithData>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, async (error, results) => {
          if (error) {
            console.error("Erreur lors de la vérification de l'utilisateur : " + error.message);
            reject(error);
          } else {
            if (results.length > 0) {
              console.log('Utilisateur trouvé avec succès.');

              const utilisateur = results[0];

              resolve({
                isFind: true,
                message: "Utilisateur trouvé",
                data: utilisateur
              });
            } else {
              console.log('Aucun utilisateur trouvé.');
              resolve({
                isFind: false,
                message: "Aucun utilisateur trouvé",
                data: []
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierUtilisateur:', error);
      throw error;
    }
  }

  async verifierProfesseur(nom: string, prenom: string): Promise<VerifyResultWithData> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierProfesseur");
      return {
        isFind: false,
        message: "Service temporairement indisponible - Pool fermé",
        data: []
      };
    }

    try {
      const sql = 'SELECT * FROM professeurs WHERE nom = ? AND prenom = ?';
      const values = [nom, prenom];

      return new Promise<VerifyResultWithData>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, async (error, results) => {
          if (error) {
            console.error("Erreur lors de la vérification du professeur : " + error.message);
            reject(error);
          } else {
            if (results.length > 0) {
              console.log('Professeur trouvé avec succès.');

              const professeur = results[0];

              resolve({
                isFind: true,
                message: "Professeur trouvé",
                data: professeur
              });
            } else {
              console.log('Aucun professeur trouvé.');
              resolve({
                isFind: false,
                message: "Aucun professeur trouvé",
                data: []
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierProfesseur:', error);
      throw error;
    }
  }

  async verifierEmail(email: string): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierEmail");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    try {
      const sql = 'SELECT * FROM utilisateurs WHERE email = ?';
      const values = [email];

      return new Promise<ConfirmationResult>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error('Erreur lors de la vérification de l\'email :', error.message);
            reject({ isConfirm: false, message: error.message });
            return;
          }
          if (results.length > 0) {
            resolve({ isConfirm: false, message: "L'email est déjà utilisé." });
          } else {
            resolve({ isConfirm: true, message: "L'email est disponible." });
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierEmail:', error);
      throw error;
    }
  }

  async verifierNomUtilisateur(nomUtilisateur: string): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierNomUtilisateur");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    try {
      const sql = 'SELECT * FROM utilisateurs WHERE nom_utilisateur = ?';
      const values = [nomUtilisateur];

      return new Promise<ConfirmationResult>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error('Erreur lors de la vérification du nom d\'utilisateur :', error.message);
            reject({ isConfirm: false, message: error.message });
            return;
          }
          if (results.length > 0) {
            resolve({ isConfirm: false, message: "Le nom d'utilisateur est déjà pris." });
          } else {
            resolve({ isConfirm: true, message: "Le nom d'utilisateur est disponible." });
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierNomUtilisateur:', error);
      throw error;
    }
  }

  async verifierCoursPlanning(jour: string, heureDebut: string, heureFin: string, typeCours?: string, options?: any): Promise<boolean> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierCoursPlanning");
      return false; // Retourne false par défaut en cas d'indisponibilité
    }

    try {
      let sql = `
        SELECT COUNT(*) as count
        FROM cours_recurrent
        WHERE jour_semaine = ?
          AND (
            (heure_debut <= ? AND heure_fin > ?)
            OR (heure_debut < ? AND heure_fin >= ?)
            OR (heure_debut >= ? AND heure_fin <= ?)
          )
      `;
      let values = [jour, heureDebut, heureDebut, heureFin, heureFin, heureDebut, heureFin];

      if (typeCours) {
        sql += ` AND type_cours = ?`;
        values.push(typeCours);
      }

      return new Promise<boolean>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error('Erreur lors de la vérification du planning des cours :', error.message);
            reject(false);
            return;
          }
          const count = results[0]?.count || 0;
          resolve(count === 0);
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierCoursPlanning:', error);
      throw error;
    }
  }

  async verifierStock(articleId: number, tailleId: number, quantiteDemandee: number): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierStock");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    try {
      const sql = `
        SELECT s.quantite, a.prix
        FROM stocks s
        JOIN articles a ON s.article_id = a.id
        WHERE s.article_id = ? AND s.taille_id = ?
      `;
      const values = [articleId, tailleId];

      return new Promise<ConfirmationResult>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error('Erreur lors de la vérification du stock :', error.message);
            reject({ isConfirm: false, message: error.message });
            return;
          }
          if (results.length > 0) {
            const stock = results[0];
            if (stock.quantite >= quantiteDemandee) {
              resolve({ isConfirm: true, message: "Stock disponible" });
            } else {
              resolve({ isConfirm: false, message: "Stock insuffisant" });
            }
          } else {
            resolve({ isConfirm: false, message: "Article ou taille non trouvée" });
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierStock:', error);
      throw error;
    }
  }

  async verifierPaiement(utilisateurId: number, montant: number): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierPaiement");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    try {
      const sql = `
        SELECT montant, statut
        FROM paiements
        WHERE utilisateur_id = ?
        ORDER BY date_paiement DESC
        LIMIT 1
      `;
      const values = [utilisateurId];

      return new Promise<ConfirmationResult>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error('Erreur lors de la vérification du paiement :', error.message);
            reject({ isConfirm: false, message: error.message });
            return;
          }
          if (results.length > 0) {
            const paiement = results[0];
            if (paiement.statut === 'validé' && paiement.montant >= montant) {
              resolve({ isConfirm: true, message: "Paiement vérifié" });
            } else {
              resolve({ isConfirm: false, message: "Paiement non trouvé ou montant insuffisant" });
            }
          } else {
            resolve({ isConfirm: false, message: "Aucun paiement trouvé" });
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierPaiement:', error);
      throw error;
    }
  }

  async verifierDisponibiliteCours(coursId: number): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierDisponibiliteCours");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    try {
      const sql = `
        SELECT active
        FROM cours_recurrent
        WHERE id = ?
      `;
      const values = [coursId];

      return new Promise<ConfirmationResult>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error('Erreur lors de la vérification de la disponibilité du cours :', error.message);
            reject({ isConfirm: false, message: error.message });
            return;
          }
          if (results.length > 0) {
            const cours = results[0];
            if (cours.active) {
              resolve({ isConfirm: true, message: "Cours disponible" });
            } else {
              resolve({ isConfirm: false, message: "Cours non disponible" });
            }
          } else {
            resolve({ isConfirm: false, message: "Cours non trouvé" });
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierDisponibiliteCours:', error);
      throw error;
    }
  }

  async verifierInscriptionUtilisateur(utilisateurId: number, coursId: number): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour verifierInscriptionUtilisateur");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    try {
      const sql = `
        SELECT status_id
        FROM inscriptions
        WHERE utilisateur_id = ? AND cours_id = ?
      `;
      const values = [utilisateurId, coursId];

      return new Promise<ConfirmationResult>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error('Erreur lors de la vérification de l\'inscription de l\'utilisateur :', error.message);
            reject({ isConfirm: false, message: error.message });
            return;
          }
          if (results.length > 0) {
            const inscription = results[0];
            if (inscription.status_id === 1) {
              resolve({ isConfirm: true, message: "Utilisateur inscrit à ce cours" });
            } else {
              resolve({ isConfirm: false, message: "Inscription trouvée mais inactive" });
            }
          } else {
            resolve({ isConfirm: false, message: "Aucune inscription trouvée" });
          }
        });
      });
    } catch (error) {
      console.error('Erreur dans verifierInscriptionUtilisateur:', error);
      throw error;
    }
  }
}