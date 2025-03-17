import MysqlConnector from '../../connector/mysqlconnector.js';

export class Utlisateurs{

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
        prenom: string,
        nom: string,
        nom_utilisateur: string,
        email: string,
        genre_id: number,
        date_naissance: string,
        password: string,
        status_id: number,
        grade_id: number,
        planTarifaire_id: number
    ): Promise<any> {
        
        try {
            const mysqlConnector = new MysqlConnector();
        
            // Requête SQL pour insérer l'utilisateur avec la jointure pour récupérer les ids
            

            const sql = `
                INSERT INTO utilisateurs (first_name, last_name, nom_utilisateur, email, genre_id, date_of_birth, password, status_id, grade_id, abonnement_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            `;
            // Liste des valeurs à passer à la requête SQL en respectant l'ordre des paramètres dans la requête
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

            console.log(prenom,
                nom,
                nom_utilisateur,
                email,
                genre_id,
                date_naissance,
                password,
                status_id,
                grade_id,
                planTarifaire_id
            )
            
            
        
            return new Promise((resolve, reject) => {
                mysqlConnector.query(sql, values, (error, results) => {
                    if (error) {
                        console.error('Erreur lors de l\'insertion de l\'utilisateur : ' + error.message);
                        reject(error);  // Rejeter la promesse en cas d'erreur
                    } else {
                        if (results.affectedRows === 0) {
                            console.log("Aucun utilisateur inséré, vérifier les correspondances des valeurs.");
                        } else {
                            console.log('Utilisateur inséré avec succès, ID:', results.insertId);
                        }
                        resolve(results);  // Résoudre la promesse avec les résultats de l'insertion
                    }
                });
            });
        } catch (error) {
            console.error("Erreur dans l'inscription de l'utilisateur:", error);
            throw error;  // Propager l'erreur si une exception est lancée
        }
    }

    
    
    
    
    
    
    
    
    
    

    obtenirLeStatus(): Promise<any> {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `SELECT * FROM status`;

            console.log(sql)
    
            console.log("Exécution de la requête pour obtenir les rôles");
    
            mysqlConnector.query(sql, [],(error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des rôles : ' + error.message);
                    reject(error);
                } else {
                    console.log('Status récupérés avec succès :', results);
                    resolve(results);  // retourne les rôles obtenus
                }
    
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }
    

    obtenirLesPlansTarifaires(){
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
                SELECT * FROM plans_tarifaires`;
    
            console.log("Exécution de la requête pour obtenir les rôles");
    
            mysqlConnector.query(sql, [],(error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des rôles : ' + error.message);
                    reject(error);
                } else {
                    console.log('Rôles récupérés avec succès :', results);
                    resolve(results);  // retourne les rôles obtenus
                }
    
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
    }

    obtenirLesGenres(){
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
                SELECT * FROM genres`;
    
            console.log("Exécution de la requête pour obtenir les genres");
    
            mysqlConnector.query(sql, [],(error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des rôles : ' + error.message);
                    reject(error);
                } else {
                    console.log('Rôles récupérés avec succès :', results);
                    resolve(results);  // retourne les rôles obtenus
                }
    
                // Fermez la connexion ici après avoir traité les résultats
                mysqlConnector.close();
            });
        });
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


