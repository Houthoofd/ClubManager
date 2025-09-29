import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, InsertResult, UserDataLogin, UserDataSession, VerifyResult, VerifyResultWithData, ConfirmationResult, UserDataAjout } from '@clubmanager/types';
import bcrypt from 'bcrypt';

export class Utilisateurs {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // Vérifie si un utilisateur existe par email
  async checkUtilisateurByEmail(email: string): Promise<VerifyResult> {
    const sql = `SELECT id FROM utilisateurs WHERE email = ? LIMIT 1`;
    return new Promise<VerifyResult>((resolve, reject) => {
      this.mysqlConnector.query(sql, [email], (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        if (results.length > 0) {
          resolve({ isFind: true, message: "Utilisateur déjà existant" });
        } else {
          resolve({ isFind: false, message: "Utilisateur non trouvé" });
        }
      });
    });
  }

  // Inscription d'un utilisateur (version simple, à adapter selon tes besoins)
  async inscriptionUtilisateurSimple(data: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    date: string;
    abonnement: string | number;
    genre: string | number;
  }): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO utilisateurs (first_name, last_name, email, password, date_of_birth, abonnement_id, genre_id, status_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `;

      this.mysqlConnector.query(sql, [
        data.prenom,
        data.nom,
        data.email,
        data.password,
        data.date,
        data.abonnement,
        data.genre
      ], (error, results) => {
        if (error) {
          console.error('Erreur lors de l\'inscription :', error);
          reject(error);
        } else {
          resolve({
            isConfirm: true,
            message: 'Utilisateur inscrit avec succès'
          });
        }
      });
    });
  }

  verifierUtilisateur(utilisateurData: UserData): Promise<VerifyResult> {
    return new Promise<VerifyResult>((resolve, reject) => {
      const sql = `
        SELECT * FROM utilisateurs
        WHERE email = ? OR nom_utilisateur = ?
      `;

      const values = [
        utilisateurData.email,
        utilisateurData.nom_utilisateur
      ];

      console.log("Exécution de la requête :", sql, values);

      this.mysqlConnector.query(sql, values, (error, results) => {
        // fermer connexion ici, une fois la requête finie

        if (error) {
          console.error('Erreur lors de l\'exécution de la requête :', error.message);
          reject(error);
          return;
        }

        if (results.length > 0) {
          console.log('Utilisateur trouvé :', results);
          resolve({ isFind: true, message: "Utilisateur trouvé" });
        } else {
          console.log('Aucun utilisateur trouvé.');
          resolve({ isFind: false, message: "Utilisateur non trouvé" });
        }
      });
    });
  }

  async inscrireUtilisateur(utilisateurData: UserData | UserDataAjout): Promise<InsertResult> {
    // Supporte UserData (back) ou UserDataAjout (front)
    const firstName =
      (utilisateurData as any).prenom ||
      (utilisateurData as any).first_name ||
      '';
    const lastName =
      (utilisateurData as any).nom ||
      (utilisateurData as any).last_name ||
      '';

    if (!firstName || !lastName) {
      throw new Error("Le prénom et le nom sont requis pour l'inscription.");
    }

    // Mot de passe par défaut si non fourni
    const password =
      (utilisateurData as any).password ||
      "password123";

    // Récupère les bons champs selon le type
    const nom_utilisateur = (utilisateurData as any).nom_utilisateur;
    const email = (utilisateurData as any).email;
    const genre_id = (utilisateurData as any).genre_id ?? (utilisateurData as any).genres;
    const date_of_birth = (utilisateurData as any).date_naissance ?? (utilisateurData as any).date_of_birth;
    const status_id = (utilisateurData as any).status_id ?? (utilisateurData as any).status;
    const grade_id = (utilisateurData as any).grade_id ?? (utilisateurData as any).grades;
    const abonnement_id = (utilisateurData as any).abonnement_id ?? (utilisateurData as any).abonnement;

    const sql = `
      INSERT INTO utilisateurs (first_name, last_name, nom_utilisateur, email, genre_id, date_of_birth, password, status_id, grade_id, abonnement_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      firstName,
      lastName,
      nom_utilisateur,
      email,
      genre_id,
      date_of_birth,
      password,
      status_id,
      grade_id,
      abonnement_id,
    ];

    console.log("Insertion utilisateur :", values);

    return new Promise<InsertResult>((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          console.error('Erreur lors de l\'insertion de l\'utilisateur :', error.message);
          reject(error);
          return;
        }

        if (results.affectedRows === 0) {
          console.log("Aucun utilisateur inséré, vérifier les données.");
        } else {
          console.log('Utilisateur inséré avec succès, ID:', results.insertId);
        }

        resolve({
          insertId: results.insertId,
          affectedRows: results.affectedRows,
        });
      });
    });
  }

  async validerConnexion(utilisateurData: UserDataLogin): Promise<UserDataSession> {
    const sql = `
      SELECT id, first_name, last_name, nom_utilisateur, email, date_of_birth, status_id, grade_id, abonnement_id, password
      FROM utilisateurs
      WHERE email = ?
    `;

    const values = [
      utilisateurData.email
    ];

    console.log("Validation connexion pour :", utilisateurData.email);

    return new Promise<UserDataSession>((resolve, reject) => {
      this.mysqlConnector.query(sql, values, async (error, results) => {
        if (error) {
          console.error("Erreur lors de la vérification de l'utilisateur :", error.message);
          reject(error);
          return;
        }

        if (results.length > 0) {
          const utilisateur = results[0];
          // Vérifie le mot de passe hashé
          const isMatch = await bcrypt.compare(utilisateurData.password, utilisateur.password);
          if (isMatch) {
            console.log('Utilisateur trouvé avec succès.');
            resolve({
              isFind: true,
              message: 'Utilisateur trouvé avec succès.',
              dataToStore: {
                id: utilisateur.id,
                prenom: utilisateur.first_name,
                nom: utilisateur.last_name,
                nom_utilisateur: utilisateur.nom_utilisateur,
                email: utilisateur.email,
                date_naissance: utilisateur.date_of_birth,
                status_id: utilisateur.status_id,
                grade_id: utilisateur.grade_id,
                abonnement_id: utilisateur.abonnement_id,
              },
            });
          } else {
            console.log('Mot de passe incorrect');
            resolve({
              isFind: false,
              message: 'Mot de passe incorrect.',
              dataToStore: {
                id: null,
                prenom: '',
                nom: '',
                nom_utilisateur: '',
                email: '',
                date_naissance: '',
                status_id: 0,
                grade_id: null,
                abonnement_id: null,
              },
            });
          }
        } else {
          console.log('Aucun utilisateur trouvé avec cet email');
          resolve({
            isFind: false,
            message: 'Aucun utilisateur trouvé avec cet email.',
            dataToStore: {
              id: null,
              prenom: '',
              nom: '',
              nom_utilisateur: '',
              email: '',
              date_naissance: '',
              status_id: 0,
              grade_id: null,
              abonnement_id: null,
            },
          });
        }
      });
    });
  }

  obtenirTousLesUtilisateurs(): Promise<VerifyResultWithData> {
    return new Promise<VerifyResultWithData>((resolve, reject) => {
      const sql = `SELECT * FROM utilisateurs`;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error("Erreur lors de la récupération des utilisateurs :", error.message);
          reject(error);
          return;
        }

        if (results.length > 0) {
          console.log('Utilisateurs trouvés avec succès.');

          const utilisateurs: UserData[] = results.map((result: any) => ({
            id: result.id,
            first_name: result.first_name,
            last_name: result.last_name,
            nom_utilisateur: result.nom_utilisateur,
            email: result.email,
            genre_id: result.genre_id,
            date_of_birth: result.date_of_birth,
            status_id: result.status_id,
            grade_id: result.grade_id,
            abonnement_id: result.abonnement_id,
            date_inscription: result.date_inscription
          }));

          resolve({
            isFind: true,
            message: "Utilisateurs trouvés",
            data: utilisateurs
          });
        } else {
          console.log('Aucun utilisateur trouvé.');
          resolve({
            isFind: false,
            message: "Aucun utilisateur trouvé",
            data: []
          });
        }
      });
    });
  }

  obtenirUnUtilisateur(id?: number): Promise<VerifyResultWithData> {
    console.log(`[obtenirUnUtilisateur] Appel avec id =`, id);
    return new Promise<VerifyResultWithData>((resolve, reject) => {
      if (!id) {
        console.error(`[obtenirUnUtilisateur] L'identifiant est requis pour récupérer un utilisateur.`);
        reject(new Error("L'identifiant est requis pour récupérer un utilisateur."));
        return;
      }

      const sql = 'SELECT * FROM utilisateurs WHERE id = ?';
      const values = [id];
      console.log(`[obtenirUnUtilisateur] Requête SQL :`, sql, 'Paramètres :', values);

      this.mysqlConnector.query(sql, values, (error, results) => {
        if (error) {
          console.error("[obtenirUnUtilisateur] Erreur lors de la récupération de l'utilisateur :", error.message);
          reject(error);
          return;
        }

        console.log(`[obtenirUnUtilisateur] Résultat brut :`, results);

        if (results.length > 0) {
          console.log('[obtenirUnUtilisateur] Utilisateur trouvé avec succès.');

          const utilisateur: UserData[] = results.map((result: any) => ({
            id: result.id,
            first_name: result.first_name,
            last_name: result.last_name,
            nom_utilisateur: result.nom_utilisateur,
            email: result.email,
            genre_id: result.genre_id,
            date_of_birth: result.date_of_birth,
            status_id: result.status_id,
            grade_id: result.grade_id,
            abonnement_id: result.abonnement_id
          }));

          console.log('[obtenirUnUtilisateur] Utilisateur formaté :', utilisateur);

          resolve({
            isFind: true,
            message: "Utilisateur trouvé",
            data: utilisateur
          });
        } else {
          console.log('[obtenirUnUtilisateur] Aucun utilisateur trouvé.');
          resolve({
            isFind: false,
            message: "Aucun utilisateur trouvé",
            data: []
          });
        }
      });
    });
  }

  supprimerUtilisateur(utilisateurId: number): Promise<ConfirmationResult> {
    const deleteSql = `DELETE FROM utilisateurs WHERE id = ?`;
    console.log(`[supprimerUtilisateur] Requête SQL :`, deleteSql, 'Paramètres :', utilisateurId);

    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(deleteSql, [utilisateurId], (error, result) => {
        console.log(`[supprimerUtilisateur] Résultat brut :`, result);
        if (error) {
          console.error('[supprimerUtilisateur] Erreur lors de la suppression de l\'utilisateur :', error.message);
          resolve({
            isConfirm: false,
            message: `Erreur lors de la suppression de l'utilisateur : ${error.message}`
          });
          return;
        }

        if (result.affectedRows > 0) {
          console.log(`[supprimerUtilisateur] Utilisateur avec ID ${utilisateurId} supprimé avec succès`);
          resolve({
            isConfirm: true,
            message: `Utilisateur avec ID ${utilisateurId} supprimé avec succès`
          });
        } else {
          console.log(`[supprimerUtilisateur] Aucun utilisateur supprimé pour l'ID ${utilisateurId}`);
          resolve({
            isConfirm: false,
            message: `Aucun utilisateur supprimé pour l'ID ${utilisateurId}`
          });
        }
      });
    });
  }

  mettreAjourUtilisateur(utilisateurData: UserData): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      const sqlSelect = `SELECT id FROM utilisateurs WHERE first_name = ? AND last_name = ? LIMIT 1`;
      const valuesSelect = [utilisateurData.prenom, utilisateurData.nom];

      this.mysqlConnector.query(sqlSelect, valuesSelect, (selectError, selectResults) => {
        if (selectError) {
          console.error('Erreur lors de la recherche de l\'utilisateur :', selectError.message);
          reject(selectError);
          return;
        }

        if (selectResults.length === 0) {
          resolve({ isConfirm: false, message: "Utilisateur non trouvé." });
          return;
        }

        const userId = selectResults[0].id;

        const sqlUpdate = `
          UPDATE utilisateurs SET 
            first_name = ?,
            last_name = ?,
            nom_utilisateur = ?,
            email = ?,
            genre_id = ?,
            date_of_birth = ?,
            password = ?,
            status_id = ?,
            grade_id = ?,
            abonnement_id = ?
          WHERE id = ?
        `;

        const valuesUpdate = [
          utilisateurData.prenom,
          utilisateurData.nom,
          utilisateurData.nom_utilisateur,
          utilisateurData.email,
          utilisateurData.genre_id,
          utilisateurData.date_naissance,
          utilisateurData.password,
          utilisateurData.status_id,
          utilisateurData.grade_id,
          utilisateurData.abonnement_id,
          userId
        ];

        console.log("Exécution de la requête de mise à jour :", sqlUpdate, valuesUpdate);

        this.mysqlConnector.query(sqlUpdate, valuesUpdate, (updateError, updateResults: any) => {
          if (updateError) {
            console.error('Erreur lors de la mise à jour de l\'utilisateur :', updateError.message);
            reject(updateError);
            return;
          }

          if (updateResults.affectedRows === 0) {
            console.log("Aucun utilisateur mis à jour, vérifiez les données.");
            resolve({ isConfirm: false, message: "Aucun utilisateur mis à jour." });
          } else {
            console.log('Utilisateur mis à jour avec succès, ID:', userId);
            resolve({ isConfirm: true, message: `Utilisateur avec ID ${userId} mis à jour avec succès.` });
          }
        });
      });
    });
  }


  // Modifie les informations d'un utilisateur selon les champs reçus
  async modifierInfosUtilisateur(data: {
    id: number,
    email?: string,
    date_naissance?: string,
    genres?: string,
    grades?: string,
    abonnement?: string,
    status?: string,
    password?: string
  }): Promise<ConfirmationResult> {
    console.log('[UTILISATEURS] Appel de modifierInfosUtilisateur avec:', data);
    if (!data.id) {
      console.log('[UTILISATEURS] Erreur: id manquant dans la requête de modification');
      throw new Error("L'identifiant de l'utilisateur est requis pour la modification.");
    }

    // Prépare la requête et les valeurs à mettre à jour
    const fields: string[] = [];
    const values: any[] = [];

    if (typeof data.email !== 'undefined') {
      fields.push('email = ?');
      values.push(data.email);
    }
    if (typeof data.date_naissance !== 'undefined') {
      fields.push('date_of_birth = ?');
      values.push(data.date_naissance);
    }
    if (typeof data.genres !== 'undefined') {
      fields.push('genre_id = (SELECT id FROM genres WHERE genre_name = ? LIMIT 1)');
      values.push(data.genres);
    }
    if (typeof data.grades !== 'undefined') {
      fields.push('grade_id = (SELECT id FROM grades WHERE grade_id = ? LIMIT 1)');
      values.push(data.grades);
    }
    if (typeof data.abonnement !== 'undefined') {
      fields.push('abonnement_id = (SELECT id FROM plans_tarifaires WHERE nom_plan = ? LIMIT 1)');
      values.push(data.abonnement);
    }
    if (typeof data.status !== 'undefined') {
      fields.push('status_id = (SELECT id FROM status WHERE nom_role = ? LIMIT 1)');
      values.push(data.status);
    }
    // Le mot de passe est déjà hashé côté route, pas besoin de le re-hasher
    if (typeof data.password !== 'undefined' && data.password.trim() !== '') {
      fields.push('password = ?');
      values.push(data.password);
      console.log('[UTILISATEURS] Mot de passe mis à jour (déjà hashé)');
    }

    if (fields.length === 0) {
      return { isConfirm: false, message: "Aucune donnée à modifier." };
    }

    const sql = `UPDATE utilisateurs SET ${fields.join(', ')} WHERE id = ?`;
    values.push(data.id);

    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(sql, values, (error, results: any) => {
        if (error) {
          console.error('Erreur lors de la modification de l\'utilisateur :', error.message);
          reject(error);
          return;
        }

        if (results.affectedRows === 0) {
          resolve({ isConfirm: false, message: "Aucun utilisateur modifié." });
        } else {
          resolve({ isConfirm: true, message: `Utilisateur avec ID ${data.id} modifié avec succès.` });
        }
      });
    });
  }

  verifierEmailExiste(email: string, id?: number): Promise<boolean> {
    let sql = 'SELECT id FROM utilisateurs WHERE email = ?';
    let params: any[] = [email];
    if (id) {
      sql += ' AND id != ?';
      params.push(id);
    }
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(sql, params, (error, results) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(results.length > 0);
      });
    });
  }

  obtenirInformationsUtilisateur = async (prenom: string, nom: string): Promise<VerifyResultWithData> => {
    try {
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
            reject(error);
          } else {
            if (results.length > 0) {
              const utilisateur = results[0];
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


  verifierProfesseurs(utilisateurs: { nom: string; prenom: string }[]): Promise<{ professeurs: any[] }> {
    return new Promise((resolve, reject) => {
      if (!utilisateurs || utilisateurs.length === 0) {
        return resolve({ professeurs: [] });
      }

      const placeholders = utilisateurs.map(() => '(?, ?)').join(', ');
      const params: any[] = [];
      
      utilisateurs.forEach(u => {
        params.push(u.nom, u.prenom);
      });

      const sql = `
        SELECT nom, prenom, 
               EXISTS(SELECT 1 FROM professeurs p WHERE p.nom = u.nom AND p.prenom = u.prenom AND p.status_id = 5) as isProf
        FROM (VALUES ${placeholders}) as u(nom, prenom)
      `;

      this.mysqlConnector.query(sql, params, (error, results) => {
        if (error) {
          console.error('Erreur lors de la vérification des professeurs :', error);
          reject(error);
        } else {
          resolve({ professeurs: results });
        }
      });
    });
  }

  creerUtilisateur(userData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO utilisateurs (first_name, last_name, email, password_hash, status_id)
        VALUES (?, ?, ?, ?, 1)
      `;

      this.mysqlConnector.query(sql, [
        userData.first_name,
        userData.last_name,
        userData.email,
        userData.password_hash
      ], (error, results) => {
        if (error) {
          console.error('Erreur lors de la création de l\'utilisateur :', error);
          reject(error);
        } else {
          resolve({
            isConfirm: true,
            message: 'Utilisateur créé avec succès'
          });
        }
      });
    });
  }

  obtenirUtilisateurParEmail(email: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, first_name, last_name, email, password_hash, status_id
        FROM utilisateurs
        WHERE email = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [email], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération de l\'utilisateur :', error);
          reject(error);
        } else if (results.length === 0) {
          resolve(null);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  modifierUtilisateur(id: number, userData: any): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE utilisateurs 
        SET first_name = ?, last_name = ?, email = ?
        WHERE id = ? AND status_id = 1
      `;

      this.mysqlConnector.query(sql, [
        userData.first_name,
        userData.last_name,
        userData.email,
        id
      ], (error, results: any) => {
        if (error) {
          console.error('Erreur lors de la modification de l\'utilisateur :', error);
          reject(error);
        } else if (results.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: "Aucune modification apportée, vérifiez les données."
          });
        } else {
          resolve({
            isConfirm: true,
            message: "Utilisateur modifié avec succès."
          });
        }
      });
    });
  }
}