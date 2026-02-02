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
    console.log(`[obtenirInformationsUtilisateur] Entrée - prenom: ${prenom}, nom: ${nom}`);
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
        LEFT JOIN genres g ON u.genre_id = g.id
        LEFT JOIN status s ON u.status_id = s.id
        LEFT JOIN grades gr ON u.grade_id = gr.id
        LEFT JOIN plans_tarifaires a ON u.abonnement_id = a.id
        WHERE
            u.first_name = ?
            AND u.last_name = ?;

      `;
      console.log(`[obtenirInformationsUtilisateur] SQL: ${sql}`);
      const values = [prenom, nom];
      console.log(`[obtenirInformationsUtilisateur] Values:`, values);

      return new Promise<VerifyResultWithData>((resolve, reject) => {
        this.mysqlConnector.query(sql, values, (error, results) => {
          if (error) {
            console.error(`[obtenirInformationsUtilisateur] Erreur SQL:`, error);
            reject(error); // Rejeter la promesse en cas d'erreur
          } else {
            console.log(`[obtenirInformationsUtilisateur] Résultats SQL:`, results);
            if (results.length > 0) {
              const utilisateur = results[0]; // On prend le premier résultat si trouvé
              console.log(`[obtenirInformationsUtilisateur] Utilisateur trouvé:`, utilisateur);
              resolve({
                isFind: true,
                message: "Utilisateur trouvé",
                data: utilisateur
              });
            } else {
              console.log(`[obtenirInformationsUtilisateur] Aucun utilisateur trouvé pour ${prenom} ${nom}`);
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
      console.error(`[obtenirInformationsUtilisateur] Exception:`, error);
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

  /**
 * Met à jour les informations d'un utilisateur
 */
async mettreAJourUtilisateur(utilisateurId: number, updateData: any): Promise<ConfirmationResult> {
  return new Promise((resolve) => {
    try {
      console.log('🔍 [Compte] mettreAJourUtilisateur - ID:', utilisateurId, 'Data:', updateData);
      
      // Construire la requête dynamiquement
      const updates: string[] = [];
      const values: any[] = [];
      
      if (updateData.email) {
        updates.push('email = ?');
        values.push(updateData.email);
      }
      
      if (updateData.date_naissance) {
        updates.push('date_of_birth = ?');
        values.push(updateData.date_naissance);
      }
      
      if (updateData.genres) {
        updates.push('genre_id = ?');
        values.push(updateData.genres);
      }
      
      if (updateData.grades) {
        updates.push('grade_id = ?');
        values.push(updateData.grades);
      }
      
      if (updateData.abonnement) {
        updates.push('abonnement_id = ?');
        values.push(updateData.abonnement);
      }
      
      if (updateData.status) {
        updates.push('status_id = ?');
        values.push(updateData.status);
      }
      
      if (updateData.password) {
        updates.push('password = ?'); // CORRIGÉ: 'password' au lieu de 'mot_de_passe'
        values.push(updateData.password);
      }
      
      if (updates.length === 0) {
        resolve({ isConfirm: false, message: 'Aucune donnée à mettre à jour' });
        return;
      }
      
      // Ajouter l'ID pour la clause WHERE
      values.push(utilisateurId);
      
      const query = `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`;
      console.log('🔍 [Compte] SQL:', query, 'Values:', values);
      
      this.mysqlConnector.query(query, values, (error: any, results: any) => {
        if (error) {
          console.error('❌ [Compte] Erreur SQL:', error);
          resolve({ isConfirm: false, message: `Erreur SQL: ${error.message}` });
        } else {
          console.log('✅ [Compte] Mise à jour réussie:', results);
          resolve({ isConfirm: true, message: 'Utilisateur mis à jour avec succès' });
        }
      });
      
    } catch (error: any) {
      console.error('❌ [Compte] Erreur dans mettreAJourUtilisateur:', error);
      resolve({ isConfirm: false, message: `Erreur: ${error.message}` });
    }
  });
}

/**
 * Met à jour les informations d'un utilisateur avec conversion automatique des noms en IDs
 */
async mettreAJourUtilisateurAvecConversion(utilisateurId: number, updateData: any): Promise<ConfirmationResult> {
  return new Promise(async (resolve) => {
    try {
      console.log('🔍 [Compte] mettreAJourUtilisateurAvecConversion - ID:', utilisateurId, 'Data:', updateData);
      
      // Convertir les noms en IDs si nécessaire
      const convertedData = { ...updateData };
      
      // Conversion genre
      if (updateData.genres && isNaN(Number(updateData.genres))) {
        try {
          const genreId = await this.obtenirIdGenreParNom(updateData.genres);
          convertedData.genres = genreId;
          console.log('🔄 [Compte] Genre converti:', updateData.genres, '->', genreId);
        } catch (error) {
          console.error('❌ [Compte] Erreur conversion genre:', error);
          resolve({ isConfirm: false, message: `Genre "${updateData.genres}" non trouvé` });
          return;
        }
      }
      
      // Conversion grade
      if (updateData.grades && isNaN(Number(updateData.grades))) {
        try {
          const gradeId = await this.obtenirIdGradeParNom(updateData.grades);
          convertedData.grades = gradeId;
          console.log('🔄 [Compte] Grade converti:', updateData.grades, '->', gradeId);
        } catch (error) {
          console.error('❌ [Compte] Erreur conversion grade:', error);
          resolve({ isConfirm: false, message: `Grade "${updateData.grades}" non trouvé` });
          return;
        }
      }
      
      // Conversion abonnement
      if (updateData.abonnement && isNaN(Number(updateData.abonnement))) {
        try {
          const abonnementId = await this.obtenirIdAbonnementParNom(updateData.abonnement);
          convertedData.abonnement = abonnementId;
          console.log('🔄 [Compte] Abonnement converti:', updateData.abonnement, '->', abonnementId);
        } catch (error) {
          console.error('❌ [Compte] Erreur conversion abonnement:', error);
          resolve({ isConfirm: false, message: `Abonnement "${updateData.abonnement}" non trouvé` });
          return;
        }
      }
      
      // Conversion status
      if (updateData.status && isNaN(Number(updateData.status))) {
        try {
          const statusId = await this.obtenirIdStatusParNom(updateData.status);
          convertedData.status = statusId;
          console.log('🔄 [Compte] Status converti:', updateData.status, '->', statusId);
        } catch (error) {
          console.error('❌ [Compte] Erreur conversion status:', error);
          resolve({ isConfirm: false, message: `Status "${updateData.status}" non trouvé` });
          return;
        }
      }
      
      console.log('🔍 [Compte] Données converties:', convertedData);
      
      // Utiliser la méthode existante avec les données converties
      const result = await this.mettreAJourUtilisateur(utilisateurId, convertedData);
      resolve(result);
      
    } catch (error: any) {
      console.error('❌ [Compte] Erreur dans mettreAJourUtilisateurAvecConversion:', error);
      resolve({ isConfirm: false, message: `Erreur: ${error.message}` });
    }
  });
}

/**
 * Obtient l'ID d'un genre par son nom
 */
private obtenirIdGenreParNom(genreName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM genres WHERE genre_name = ?';
    this.mysqlConnector.query(sql, [genreName], (error: any, results: any) => {
      if (error) {
        reject(error);
      } else if (results.length > 0) {
        resolve(results[0].id);
      } else {
        reject(new Error(`Genre "${genreName}" non trouvé`));
      }
    });
  });
}

/**
 * Obtient l'ID d'un grade par son nom
 */
private obtenirIdGradeParNom(gradeName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM grades WHERE grade_id = ?';
    this.mysqlConnector.query(sql, [gradeName], (error: any, results: any) => {
      if (error) {
        reject(error);
      } else if (results.length > 0) {
        resolve(results[0].id);
      } else {
        reject(new Error(`Grade "${gradeName}" non trouvé`));
      }
    });
  });
}

/**
 * Obtient l'ID d'un abonnement par son nom
 */
private obtenirIdAbonnementParNom(abonnementName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM plans_tarifaires WHERE nom_plan = ?';
    this.mysqlConnector.query(sql, [abonnementName], (error: any, results: any) => {
      if (error) {
        reject(error);
      } else if (results.length > 0) {
        resolve(results[0].id);
      } else {
        reject(new Error(`Abonnement "${abonnementName}" non trouvé`));
      }
    });
  });
}

/**
 * Obtient l'ID d'un status par son nom
 */
private obtenirIdStatusParNom(statusName: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM status WHERE nom_role = ?';
    this.mysqlConnector.query(sql, [statusName], (error: any, results: any) => {
      if (error) {
        reject(error);
      } else if (results.length > 0) {
        resolve(results[0].id);
      } else {
        reject(new Error(`Status "${statusName}" non trouvé`));
      }
    });
  });
}
}