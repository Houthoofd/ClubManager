import MysqlConnector from '../../connector/mysqlconnector.js';
export class Cours {
    // Récupérer les grades
    obtenirLesCours() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `SELECT * FROM cours LIMIT 12`;
            console.log("Exécution de la requête pour obtenir les cours");
            mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des cours : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('cours récupérés avec succès :', results);
                    resolve(results);
                }
                mysqlConnector.close();
            });
        });
    }
    verifierInscriptionUtilisateur(data) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
        SELECT
          u.id AS userId, i.id AS inscriptionId
        FROM
          utilisateurs u
        LEFT JOIN
          inscriptions i
        ON
          u.id = i.utilisateur_id AND i.cours_id = ?
        WHERE
          u.last_name = ? AND u.first_name = ?;
      `;
            const values = [
                data.cours_id, // ID du cours
                data.utilisateur_nom,
                data.utilisateur_prenom,
            ];
            console.log("Exécution de la requête pour récupérer l'utilisateur et vérifier l'inscription au cours");
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de la vérification de l\'inscription : ' + error.message);
                    reject(error);
                }
                else {
                    const isFind = results.length > 0;
                    console.log(results);
                    if (isFind) {
                        const userId = results[0].userId;
                        const inscriptionId = results[0].inscriptionId;
                        if (inscriptionId) {
                            const message = `L'utilisateur est déjà inscrit à ce cours.`;
                            console.log(message);
                            resolve({
                                isBooked: true,
                                isFind: true,
                                message,
                                data: { userId, inscriptionId },
                            });
                        }
                        else {
                            const message = `L'utilisateur n'est pas encore inscrit au cours.`;
                            console.log(message);
                            resolve({
                                isBooked: false,
                                isFind: true,
                                message,
                                data: { userId, inscriptionId: null },
                            });
                        }
                    }
                    else {
                        const message = `L'utilisateur n'a pas été trouvé.`;
                        console.log(message);
                        resolve({
                            isBooked: false,
                            isFind: false,
                            message,
                            data: null,
                        });
                    }
                }
                mysqlConnector.close();
            });
        });
    }
    inscrireUtilisateurAuCours(data) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            // Requête d'insertion dans la table 'inscriptions'
            const sql = `
            INSERT INTO inscriptions (cours_id, utilisateur_id, status_id)
            VALUES (?, ?, ?);
        `;
            const values = [
                data.cours_id,
                data.utilisateur_id,
                data.status_id
            ];
            console.log("Exécution de la requête pour inscrire l'utilisateur au cours");
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'inscription de l\'utilisateur au cours : ' + error.message);
                    mysqlConnector.close(); // Assurer la fermeture de la connexion même en cas d'erreur
                    reject({ message: 'Erreur lors de l\'inscription de l\'utilisateur au cours.', error: error.message });
                }
                else {
                    const message = `L'utilisateur avec l'ID ${data.utilisateur_id} a été inscrit au cours ${data.cours_id} avec succès.`;
                    console.log(message);
                    mysqlConnector.close(); // Fermeture de la connexion après réussite
                    resolve({ isConfirm: true, message });
                }
            });
        });
    }
}
