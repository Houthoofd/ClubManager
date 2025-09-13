import { ConfirmationResult, UserData, VerifyResultWithData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Compte {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  obtenirUnUtilisateurParSonNomEtPrenom(prenom: string, nom: string): Promise<VerifyResultWithData> {
    console.log(prenom, nom);
    try {
      const sql = 'SELECT * FROM utilisateurs WHERE first_name = ? AND last_name = ?';
      const values = [prenom, nom];

      return new Promise<VerifyResultWithData>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, async (error, results) => {
          if (error) {
            console.error("Erreur lors de la récupération de l'utilisateur : " + error.message);
            reject(error);
          } else {
            if (results.length > 0) {
              console.log('Utilisateur trouvé avec succès.');

              const utilisateur: UserData[] = results.map((result: any) => ({
                id: result.id,
                prenom: result.first_name,
                nom: result.last_name,
                nom_utilisateur: result.nom_utilisateur,
                email: result.email,
                password: result.password,
                genre_id: result.genre_id,
                date_of_birth: result.date_of_birth,
                status_id: result.status_id,
                grade_id: result.grade_id,
                abonnement_id: result.abonnement_id
              }));

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
      console.error('Erreur dans obtenirUnUtilisateurParSonNomEtPrenom:', error);
      throw error;
    }
  }
  

  obtenirInformationsUtilisateur = async (prenom: string, nom: string): Promise<VerifyResultWithData> => {
    try {
      // Requête SQL pour récupérer les informations en fonction des IDs liés
      const sql = `
        SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          u.password,
          g.genre_name AS genres,  
          s.nom_role AS status,  
          gr.grade_id AS grades,  
          a.nom_plan AS abonnement,  
          u.date_of_birth
        FROM 
          utilisateurs u
        JOIN 
          genres g ON u.genre_id = g.id  
        JOIN 
          status s ON u.status_id = s.id  
        JOIN 
          grades gr ON u.grade_id = gr.id  
        JOIN 
          plans_tarifaires a ON u.abonnement_id = a.id  
        WHERE 
          u.first_name = ? AND u.last_name = ?
      `;

      const values = [prenom, nom];
      
      return new Promise<VerifyResultWithData>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur ${prenom} ${nom} : ${error.message}`);
            reject(error); // Rejeter la promesse en cas d'erreur
          } else {
            if (results.length > 0) {
              const utilisateur = results[0]; // On prend le premier résultat si trouvé
              console.log(utilisateur);
              resolve({
                isFind: true,
                message: "Utilisateur trouvé",
                data: utilisateur
              });
            } else {
              console.log(`Aucun utilisateur trouvé pour ${prenom} ${nom}`);
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
      console.error(`Erreur lors de la récupération des informations de l'utilisateur ${prenom} ${nom} :`, error);
      throw error;
    }
  };

  // Ajoute ou modifie le mot de passe d'un utilisateur
  async mettreAJourMotDePasse(id: number, hash: string, isCreation: boolean): Promise<{ isConfirm: boolean; message: string }> {
    if (!id || !hash) {
      return { isConfirm: false, message: "Id et mot de passe requis." };
    }
    // Si création, on ne modifie que si le mot de passe est vide
    let sql: string;
    let values: any[];
    if (isCreation) {
      sql = 'UPDATE utilisateurs SET password = ? WHERE id = ? AND (password IS NULL OR password = "")';
      values = [hash, id];
    } else {
      sql = 'UPDATE utilisateurs SET password = ? WHERE id = ?';
      values = [hash, id];
    }
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (error, result) => {
        if (error) {
          console.error('Erreur lors de la mise à jour du mot de passe :', error.message);
          reject({ isConfirm: false, message: error.message });
          return;
        }
        if (result.affectedRows > 0) {
          resolve({ isConfirm: true, message: "Mot de passe mis à jour." });
        } else {
          resolve({ isConfirm: false, message: "Aucune modification effectuée." });
        }
      });
    });
  }

  obtenirInformationsCompte(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, first_name, last_name, email, date_of_birth, phone
        FROM utilisateurs
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [userId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des informations du compte :', error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  modifierInformationsCompte(userId: number, userData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE utilisateurs 
        SET first_name = ?, last_name = ?, email = ?, date_of_birth = ?, phone = ?
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [
        userData.first_name,
        userData.last_name,
        userData.email,
        userData.date_of_birth,
        userData.phone,
        userId
      ], (error, results: any) => {
        if (error) {
          console.error('Erreur lors de la modification du compte :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Compte non trouvé'
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Informations du compte modifiées avec succès'
          });
        }
      });
    });
  }

  supprimerCompte(userId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE utilisateurs 
        SET status_id = 0
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [userId], (error, results: any) => {
        if (error) {
          console.error('Erreur lors de la suppression du compte :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: 'Compte non trouvé'
          });
        } else {
          resolve({
            isConfirm: true,
            message: 'Compte supprimé avec succès'
          });
        }
      });
    });
  }
}