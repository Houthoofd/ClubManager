import {ConfirmationResult, CoursData, UserData, Professeur, VerifyResultWithData} from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Professeurs {

  // Récupérer les professeurs
  // Fonction pour obtenir les professeurs
  async obtenirLesProfesseurs(): Promise<VerifyResultWithData> {
    const mysqlConnector = new MysqlConnector();
  
    const sql = `
      SELECT * FROM utilisateurs
      WHERE status_id = 5;
    `;
  
    return new Promise<VerifyResultWithData>((resolve, reject) => {
      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error("Erreur lors de la récupération des professeurs : " + error.message);
          return reject({
            isFind: false,
            message: error.message,
            data: [] // Retourner un tableau vide en cas d'erreur
          });
        }
  
        if (results.length > 0) {
          console.log('Professeurs trouvés avec succès.');
  
          // Mapper les résultats pour correspondre au type Professeur
          const professeurs: Professeur[] = results.map((result: any) => ({
            id: result.id,
            first_name: result.first_name,
            last_name: result.last_name,
            nom_utilisateur: result.nom_utilisateur,
            email: result.email,
            genre_id: result.genre_id,
            date_of_birth: result.date_of_birth,
            grade_id: result.grade_id,
          }));
  
          // Utilisation d'une assertion pour faire en sorte que `data` soit de type `Professeur[]`
          resolve({
            isFind: true,
            message: "Professeurs trouvés",
            data: professeurs  // Assertion de type ici
          });
        } else {
          console.log('Aucun professeur trouvé.');
          resolve({
            isFind: true,
            message: "Aucun professeur trouvé",
            data: [] // Retourner un tableau vide si aucun professeur n'est trouvé
          });
        }
      });
    });
  }

  async ajouterUnProfesseur(userData: any): Promise<ConfirmationResult> {
    const mysqlConnector = new MysqlConnector();

    console.log(userData.first_name)
  
    // 1. Vérifier si l'utilisateur existe déjà
    const selectSql = `SELECT * FROM utilisateurs WHERE email = ?`;
    return new Promise<ConfirmationResult>((resolve, reject) => {
      mysqlConnector.query(selectSql, [userData.email], (error, results) => {
        if (error) {
          console.error("Erreur lors de la vérification : " + error.message);
          return reject({ success: false, message: "Erreur lors de la vérification." });
        }
  
        if (results.length > 0) {
          const utilisateur = results[0];
  
          // 2. Il existe déjà
          if (utilisateur.status_id === 5) {
            console.log('Utilisateur est déjà professeur.');
            return resolve({ isConfirm: true, message: "Utilisateur déjà professeur." });
          } else {
            // 3. Mettre à jour le status
            const updateSql = `UPDATE utilisateurs SET status_id = 5 WHERE id = ?`;
            mysqlConnector.query(updateSql, [utilisateur.id], (updateError) => {
              if (updateError) {
                console.error("Erreur lors de la mise à jour : " + updateError.message);
                return reject({ success: false, message: "Erreur lors de la mise à jour." });
              }
  
              console.log('Utilisateur mis à jour en professeur.');
              return resolve({ isConfirm: true, message: "Utilisateur mis à jour en professeur." });
            });
          }
  
        } else {
          // 4. Il n'existe pas, donc on l'ajoute
          const insertSql = `
            INSERT INTO utilisateurs (first_name, last_name, nom_utilisateur, email, genre_id, date_of_birth, status_id, grade_id, abonnement_id)
            VALUES (?, ?, ?, ?, ?, ?, 5, ?, ?)
          `;
  
          mysqlConnector.query(insertSql, [
            userData.first_name,
            userData.last_name,
            userData.nom_utilisateur,
            userData.email,
            userData.genre_id,
            userData.date_of_birth,
            userData.grade_id,
            userData.abonnement_id
          ], (insertError) => {
            if (insertError) {
              console.error("Erreur lors de l'ajout : " + insertError.message);
              return reject({ isConfirm: false, message: "Erreur lors de l'ajout." });
            }
  
            console.log('Nouvel utilisateur ajouté en tant que professeur.');
            return resolve({ isConfirm: true, message: "Professeur ajouté avec succès." });
          });
        }
      });
    });
  }  
}

