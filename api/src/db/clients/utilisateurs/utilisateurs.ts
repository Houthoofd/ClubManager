import MysqlConnector from '../../connector/mysqlconnector.js';
import { UserData, InsertResult, UserDataLogin, UserDataSession } from '@clubmanager/types';

export class Utilisateurs{

    VerificationUtilisateur(sql: string, values: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            console.log("éxécution du query");
            console.log(sql,values);
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + error.message);
                    reject(error);
                } else {
                    console.log('Résultats de la requête :', results);
                    resolve(results);
                }
    
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }

    IsUserExist(nom: string, prenom: string, email: string, date_naissance: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            
            // Requête SQL pour vérifier si l'utilisateur existe déjà
            const sql = `SELECT * FROM utilisateurs 
                         WHERE last_name = ? AND first_name = ? AND email = ? AND date_of_birth = ?`;
            const values = [nom, prenom, email, date_naissance];
    
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
                        resolve({ exists: true, user: results[0] });  // Utilisateur trouvé
                    } else {
                        console.log('Aucun utilisateur trouvé.');
                        resolve({ exists: false });  // Aucun utilisateur trouvé
                    }
                }
            });
    
            // Fermez la connexion après avoir traité les résultats ou en cas d'erreur
            mysqlConnector.close();
        });
    }


    

    async inscrireUtilisateur(
        utilisateurData: UserData // Paramètre unique de type UtilisateurData
    ): Promise<InsertResult> {
        try {
            const mysqlConnector = new MysqlConnector();
            
            const sql = `
                INSERT INTO utilisateurs (first_name, last_name, nom_utilisateur, email, genre_id, date_of_birth, password, status_id, grade_id, abonnement_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            
            const values = [
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
                SELECT first_name, last_name, nom_utilisateur, email, date_of_birth, status_id, grade_id, abonnement_id
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
    
    


    Insert(sql: string, values: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            console.log("éxécution du query Insert");
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + error.message);
                    reject(error);
                } else {
                    console.log('Résultats de la requête :', results);
                    resolve(results);
                }
    
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }

    query(sql: string, values?: any[]): Promise<any> {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            console.log("éxécution du query");
            mysqlConnector.query(sql, values as any, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + error.message);
                    reject(error);
                } else {
                    console.log('Résultats de la requête :', results);
                    resolve(results);
                }
    
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }

}


