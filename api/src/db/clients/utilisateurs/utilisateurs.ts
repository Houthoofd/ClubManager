import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, InsertResult, UserDataLogin, UserDataSession, VerifyResult, VerifyResultWithData, ConfirmationResult } from '@clubmanager/types';

export class Utilisateurs{

    verifierUtilisateur(utilisateurData: UserData): Promise<VerifyResult> {
        return new Promise <VerifyResult>((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            
                    // Requête SQL pour vérifier l'existence d'un utilisateur basé sur son email ou son nom d'utilisateur
            const sql = `
                SELECT * FROM utilisateurs
                WHERE email = ? OR nom_utilisateur = ?
            `;
            
            const values = [
                utilisateurData.email,
                utilisateurData.nom_utilisateur
            ];
    
            console.log("Éxécution de la requête :");
            console.log(sql, values);
    
            // Exécution de la requête
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + error.message);
                    reject(error);
                } else {
                    if (results.length > 0) {
                        console.log('Utilisateur trouvé :', results);
                        resolve({ isFind: true, message:"utilisateur trouvé" });  // Utilisateur trouvé
                    } else {
                        console.log('Aucun utilisateur trouvé.');
                        resolve({ isFind: false, message:"utilisateur non trouvé" });  // Aucun utilisateur trouvé
                    }
                }
            });
    
            // Fermez la connexion après avoir traité les résultats ou en cas d'erreur
            mysqlConnector.close();
        });
    }


    

    async inscrireUtilisateur(
      utilisateurData: any // Paramètre unique de type UtilisateurData
  ): Promise<InsertResult> {
      try {
          const mysqlConnector = new MysqlConnector();
  
          // Si password est vide, on le remplace par un mot de passe par défaut
          if (!utilisateurData.password || utilisateurData.password.trim() === "") {
              utilisateurData.password = "password123"; // mot de passe par défaut
          }
  
          const sql = `
              INSERT INTO utilisateurs (first_name, last_name, nom_utilisateur, email, genre_id, date_of_birth, password, status_id, grade_id, abonnement_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
          `;
  
          const values = [
              utilisateurData.first_name,
              utilisateurData.last_name,
              utilisateurData.nom_utilisateur,
              utilisateurData.email,
              utilisateurData.genre_id,
              utilisateurData.date_of_birth,
              utilisateurData.password,
              utilisateurData.status_id,
              utilisateurData.grade_id,
              utilisateurData.abonnement_id,
          ];
  
          console.log(utilisateurData);
  
          return new Promise<InsertResult>((resolve, reject) => {
              mysqlConnector.query(sql, values, (error, results) => {
                  if (error) {
                      console.error('Erreur lors de l\'insertion de l\'utilisateur : ' + error.message);
                      reject(error);
                  } else {
                      if (results.affectedRows === 0) {
                          console.log("Aucun utilisateur inséré, vérifier les correspondances des valeurs.");
                      } else {
                          console.log('Utilisateur inséré avec succès, ID:', results.insertId);
                      }
                      resolve({
                          insertId: results.insertId,
                          affectedRows: results.affectedRows,
                      });
                  }
              });
          });
      } catch (error) {
          console.error("Erreur dans l'inscription de l'utilisateur:", error);
          throw error;
      }
    }
  

    async validerConnexion(
        utilisateurData: UserDataLogin // Paramètre unique de type UtilisateurData
    ): Promise<UserDataSession> {
        try {
            const mysqlConnector = new MysqlConnector();
            
            const sql = `
                SELECT id, first_name, last_name, nom_utilisateur, email, date_of_birth, status_id, grade_id, abonnement_id
                FROM utilisateurs
                WHERE email = ? AND password = ?
            `;
            
            const values = [
                utilisateurData.email,
                utilisateurData.password
            ];
    
            console.log(utilisateurData);
            
            return new Promise<UserDataSession>((resolve, reject) => {
                mysqlConnector.query(sql, values, (error, results) => {
                    if (error) {
                        console.error("Erreur lors de la vérification de l'utilisateur : " + error.message);
                        reject(error);
                    } else {
                        if (results.length > 0) {
                            console.log('Utilisateur trouvé avec succès.');
                            const utilisateur = results[0];
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
                            console.log('Aucun utilisateur trouvé avec ces identifiants');
                            resolve({
                                isFind: false,
                                message: 'Aucun utilisateur trouvé avec ces identifiants.',
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
                    }
                });
            });
        } catch (error) {
            console.error("Erreur lors de la connexion de l'utilisateur:", error);
            throw error;
        }
    }

    obtenirTousLesUtilisateurs(): Promise<VerifyResultWithData> {
        try {
          const mysqlConnector = new MysqlConnector();
      
          const sql = `
            SELECT * FROM utilisateurs
          `;
      
          return new Promise<VerifyResultWithData>((resolve, reject) => {
            mysqlConnector.query(sql, [], (error, results) => {
              if (error) {
                console.error("Erreur lors de la récupération des utilisateurs : " + error.message);
                reject(error); // Rejeter la promesse en cas d'erreur
              } else {
                if (results.length > 0) {
                  console.log('Utilisateurs trouvés avec succès.');
      
                  // Mapper les résultats pour correspondre au type UserData
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
                    abonnement_id: result.abonnement_id
                  }));
      
                  resolve({
                    isFind: true,
                    message: "Utilisateurs trouvés",
                    data: utilisateurs // Utilisez le tableau mappé ici
                  });
                } else {
                  console.log('Aucun utilisateur trouvé.');
                  resolve({
                    isFind: false,
                    message: "Aucun utilisateur trouvé",
                    data: [] // Retourner un tableau vide si aucun utilisateur n'est trouvé
                  });
                }
              }
            });
          });
        } catch (error) {
          console.error("Erreur lors de la récupération des utilisateurs:", error);
          throw error; // Lever l'erreur pour que l'appelant puisse la gérer
        }
    }

    obtenirUnUtilisateur(id?: number): Promise<VerifyResultWithData> {
        try {
          const mysqlConnector = new MysqlConnector();
      
          // Construire la requête SQL en fonction des paramètres fournis
          let sql = 'SELECT * FROM utilisateurs WHERE id = ?';
          const values = [
            id
          ];
      

      
          return new Promise<VerifyResultWithData>((resolve, reject) => {
            mysqlConnector.query(sql, values, (error, results) => {
              if (error) {
                console.error("Erreur lors de la récupération de l'utilisateur : " + error.message);
                reject(error); // Rejeter la promesse en cas d'erreur
              } else {
                if (results.length > 0) {
                  console.log('Utilisateur trouvé avec succès.');

                  // Mapper les résultats pour correspondre au type UserData
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
      
                  resolve({
                    isFind: true,
                    message: "Utilisateur trouvé",
                    data: utilisateur // Utilisateur trouvé
                  });
                } else {
                  console.log('Aucun utilisateur trouvé.');
                  resolve({
                    isFind: false,
                    message: "Aucun utilisateur trouvé",
                    data: [] // Retourner un tableau vide si aucun utilisateur n'est trouvé
                  });
                }
              }
            });
          });
        } catch (error) {
          console.error("Erreur lors de la récupération de l'utilisateur:", error);
          throw error; // Lever l'erreur pour que l'appelant puisse la gérer
        }
    }
    
    supprimerUtilisateur(utilisateurId: number): Promise<ConfirmationResult> {
      return new Promise<ConfirmationResult>((resolve, reject) => {
          const mysqlConnector = new MysqlConnector();

          console.log()
  
          const deleteSql = `
              DELETE FROM utilisateurs WHERE id = ?
          `;
  
          mysqlConnector.query(deleteSql, [utilisateurId], (error, result) => {
              mysqlConnector.close();
              if (error) {
                  console.error('Erreur lors de la suppression de l\'utilisateur : ' + error.message);
                  reject(error);
              } else {
                  console.log(`Utilisateur avec ID ${utilisateurId} supprimé avec succès`);
                  resolve({ isConfirm: true, message: `Utilisateur avec ID ${utilisateurId} supprimé avec succès` });
              }
          });
      });
    }   
}


