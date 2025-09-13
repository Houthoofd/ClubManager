import MysqlConnector from '../../connector/mysqlconnector.js';
export class Professeurs {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    // Récupérer les professeurs
    // Fonction pour obtenir les professeurs
    async obtenirLesProfesseurs() {
        const sql = `
      SELECT * FROM utilisateurs
      WHERE status_id = 5;
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
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
                    const professeurs = results.map((result) => ({
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
                        data: professeurs // Assertion de type ici
                    });
                }
                else {
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
    // Récupérer un professeur par son ID
    async obtenirProfesseurParId(id) {
        const sql = `
      SELECT * FROM utilisateurs
      WHERE id = ? AND status_id = 5;
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [id], (error, results) => {
                if (error) {
                    console.error(`Erreur lors de la récupération du professeur avec ID ${id} : ${error.message}`);
                    reject(error);
                    return;
                }
                if (results.length > 0) {
                    console.log('Professeur trouvé avec succès.');
                    // Convertir le résultat en objet Professeur
                    const professeur = {
                        id: results[0].id,
                        nom: results[0].first_name,
                        prenom: results[0].last_name,
                        nom_utilisateur: results[0].nom_utilisateur,
                        email: results[0].email,
                        genre_id: results[0].genre_id,
                        date_naissance: results[0].date_of_birth,
                        grade_id: results[0].grade_id,
                    };
                    resolve(professeur);
                }
                else {
                    console.log(`Aucun professeur trouvé avec l'ID ${id}.`);
                    resolve(null);
                }
            });
        });
    }
    async modifierStatutProfesseur(id, status_id) {
        return new Promise((resolve, reject) => {
            const updateSql = `UPDATE utilisateurs SET status_id = ? WHERE id = ?`;
            this.mysqlConnector.query(updateSql, [status_id, id], (error) => {
                if (error) {
                    console.error("Erreur lors de la modification du statut : " + error.message);
                    return reject({ isConfirm: false, message: "Erreur lors de la modification du statut." });
                }
                resolve({ isConfirm: true, message: "Statut modifié avec succès." });
            });
        });
    }
    async retirerPromotionProfesseur(id) {
        return new Promise((resolve, reject) => {
            const updateSql = `UPDATE utilisateurs SET status_id = 1 WHERE id = ?`;
            this.mysqlConnector.query(updateSql, [id], (error) => {
                if (error) {
                    console.error('Erreur lors du retrait de la promotion :', error);
                    reject(error);
                }
                else {
                    resolve({ isConfirm: true, message: "Promotion retirée avec succès." });
                }
            });
        });
    }
    async ajouterUnProfesseur(userData) {
        const users = Array.isArray(userData.utilisateurs) ? userData.utilisateurs : [userData];
        return new Promise((resolve, reject) => {
            let processed = 0;
            let errors = [];
            let successCount = 0;
            users.forEach((user) => {
                const selectSql = `SELECT * FROM utilisateurs WHERE id = ?`;
                this.mysqlConnector.query(selectSql, [user.id], (error, results) => {
                    if (error) {
                        errors.push(`Erreur vérification id ${user.id}: ${error.message}`);
                        checkDone();
                        return;
                    }
                    if (results.length > 0) {
                        const utilisateur = results[0];
                        if (utilisateur.status_id === 5) {
                            successCount++;
                            checkDone();
                        }
                        else {
                            const updateSql = `UPDATE utilisateurs SET status_id = 5 WHERE id = ?`;
                            this.mysqlConnector.query(updateSql, [utilisateur.id], (updateError) => {
                                if (updateError) {
                                    errors.push(`Erreur update id ${user.id}: ${updateError.message}`);
                                }
                                else {
                                    successCount++;
                                }
                                checkDone();
                            });
                        }
                    }
                    else {
                        errors.push(`Utilisateur id ${user.id} non trouvé, ajout impossible.`);
                        checkDone();
                    }
                });
            });
            function checkDone() {
                processed++;
                if (processed === users.length) {
                    if (errors.length === 0) {
                        resolve({ isConfirm: true, message: "Tous les utilisateurs ont été promus professeurs." });
                    }
                    else if (successCount > 0) {
                        resolve({ isConfirm: true, message: `Promotion partielle. Erreurs: ${errors.join('; ')}` });
                    }
                    else {
                        resolve({ isConfirm: false, message: `Aucune promotion. Erreurs: ${errors.join('; ')}` });
                    }
                }
            }
        });
    }
}
