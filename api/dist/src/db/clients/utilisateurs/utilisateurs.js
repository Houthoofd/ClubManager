var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import MysqlConnector from '../../connector/mysqlconnector.js';
export class Utilisateurs {
    VerificationUtilisateur(sql, values) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            console.log("éxécution du query");
            console.log(sql, values);
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Résultats de la requête :', results);
                    resolve(results);
                }
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }
    IsUserExist(nom, prenom, email, date_naissance) {
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
                }
                else {
                    if (results.length > 0) {
                        console.log('Utilisateur trouvé :', results);
                        resolve({ exists: true, user: results[0] }); // Utilisateur trouvé
                    }
                    else {
                        console.log('Aucun utilisateur trouvé.');
                        resolve({ exists: false }); // Aucun utilisateur trouvé
                    }
                }
            });
            // Fermez la connexion après avoir traité les résultats ou en cas d'erreur
            mysqlConnector.close();
        });
    }
    inscrireUtilisateur(prenom, nom, nom_utilisateur, email, genre_id, date_naissance, password, status_id, grade_id, planTarifaire_id // Correction ici, type correct avec 'number | null'
    ) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mysqlConnector = new MysqlConnector();
                const sql = `
                INSERT INTO utilisateurs (first_name, last_name, nom_utilisateur, email, genre_id, date_of_birth, password, status_id, grade_id, abonnement_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
                const values = [
                    prenom,
                    nom,
                    nom_utilisateur,
                    email,
                    genre_id,
                    date_naissance,
                    password,
                    status_id,
                    grade_id,
                    planTarifaire_id,
                ];
                console.log(prenom, nom, nom_utilisateur, email, genre_id, date_naissance, password, status_id, grade_id, planTarifaire_id);
                return new Promise((resolve, reject) => {
                    mysqlConnector.query(sql, values, (error, results) => {
                        if (error) {
                            console.error('Erreur lors de l\'insertion de l\'utilisateur : ' + error.message);
                            reject(error);
                        }
                        else {
                            if (results.affectedRows === 0) {
                                console.log("Aucun utilisateur inséré, vérifier les correspondances des valeurs.");
                            }
                            else {
                                console.log('Utilisateur inséré avec succès, ID:', results.insertId);
                            }
                            resolve(results);
                        }
                    });
                });
            }
            catch (error) {
                console.error("Erreur dans l'inscription de l'utilisateur:", error);
                throw error;
            }
        });
    }
    Insert(sql, values) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            console.log("éxécution du query Insert");
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Résultats de la requête :', results);
                    resolve(results);
                }
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }
    query(sql, values) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            console.log("éxécution du query");
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Résultats de la requête :', results);
                    resolve(results);
                }
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }
}
