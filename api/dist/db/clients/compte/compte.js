import MysqlConnector from '../../connector/mysqlconnector.js';
export class Compte {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    obtenirUnUtilisateurParSonNomEtPrenom(prenom, nom) {
        console.log(prenom, nom);
        try {
            const sql = 'SELECT * FROM utilisateurs WHERE first_name = ? AND last_name = ?';
            const values = [prenom, nom];
            return new Promise((resolve, reject) => {
                this.mysqlConnector.query(sql, values, async (error, results) => {
                    if (error) {
                        console.error("Erreur lors de la récupération de l'utilisateur : " + error.message);
                        reject(error);
                    }
                    else {
                        if (results.length > 0) {
                            console.log('Utilisateur trouvé avec succès.');
                            const utilisateur = results.map((result) => ({
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
                        }
                        else {
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
        }
        catch (error) {
            console.error('Erreur dans obtenirUnUtilisateurParSonNomEtPrenom:', error);
            throw error;
        }
    }
    obtenirInformationsUtilisateur = async (prenom, nom) => {
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
            return new Promise((resolve, reject) => {
                this.mysqlConnector.query(sql, values, (error, results) => {
                    if (error) {
                        console.error(`[obtenirInformationsUtilisateur] Erreur SQL:`, error);
                        reject(error); // Rejeter la promesse en cas d'erreur
                    }
                    else {
                        console.log(`[obtenirInformationsUtilisateur] Résultats SQL:`, results);
                        if (results.length > 0) {
                            const utilisateur = results[0]; // On prend le premier résultat si trouvé
                            console.log(`[obtenirInformationsUtilisateur] Utilisateur trouvé:`, utilisateur);
                            resolve({
                                isFind: true,
                                message: "Utilisateur trouvé",
                                data: utilisateur
                            });
                        }
                        else {
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
        }
        catch (error) {
            console.error(`[obtenirInformationsUtilisateur] Exception:`, error);
            throw error;
        }
    };
    // Ajoute ou modifie le mot de passe d'un utilisateur
    async mettreAJourMotDePasse(id, hash, isCreation) {
        if (!id || !hash) {
            return { isConfirm: false, message: "Id et mot de passe requis." };
        }
        // Si création, on ne modifie que si le mot de passe est vide
        let sql;
        let values;
        if (isCreation) {
            sql = 'UPDATE utilisateurs SET password = ? WHERE id = ? AND (password IS NULL OR password = "")';
            values = [hash, id];
        }
        else {
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
                }
                else {
                    resolve({ isConfirm: false, message: "Aucune modification effectuée." });
                }
            });
        });
    }
    obtenirInformationsCompte(userId) {
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
                }
                else if (results.length === 0) {
                    resolve(null);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    }
    modifierInformationsCompte(userId, userData) {
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
            ], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la modification du compte :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Compte non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Informations du compte modifiées avec succès'
                    });
                }
            });
        });
    }
    supprimerCompte(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE utilisateurs 
        SET status_id = 0
        WHERE id = ? AND status_id = 1
      `;
            this.mysqlConnector.query(sql, [userId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la suppression du compte :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Compte non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Compte supprimé avec succès'
                    });
                }
            });
        });
    }
}
