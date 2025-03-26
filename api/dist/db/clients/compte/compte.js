import MysqlConnector from '../../connector/mysqlconnector.js';
export class Compte {
    obtenirUnUtilisateurParSonNomEtPrenom(prenom, nom) {
        console.log(prenom, nom);
        try {
            const mysqlConnector = new MysqlConnector();
            // Construire la requête SQL
            const sql = 'SELECT * FROM utilisateurs WHERE first_name = ? AND last_name = ?';
            const values = [prenom, nom];
            // Retourner une promesse
            return new Promise((resolve, reject) => {
                mysqlConnector.query(sql, values, (error, results) => {
                    if (error) {
                        console.error("Erreur lors de la récupération de l'utilisateur : " + error.message);
                        reject(error); // Rejeter la promesse en cas d'erreur
                    }
                    else {
                        if (results.length > 0) {
                            console.log('Utilisateur trouvé avec succès.');
                            // Mapper les résultats pour correspondre au type UserData
                            const utilisateur = results.map((result) => ({
                                id: result.id,
                                first_name: result.first_name,
                                last_name: result.last_name,
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
                                data: utilisateur // Utilisateur trouvé
                            });
                        }
                        else {
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
        }
        catch (error) {
            console.error("Erreur lors de la récupération de l'utilisateur:", error);
            throw error; // Lever l'erreur pour que l'appelant puisse la gérer
        }
    }
}
