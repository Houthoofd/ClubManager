import MysqlConnector from '../../connector/mysqlconnector.js';
export class Professeurs {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    // Récupérer les professeurs
    // Fonction pour obtenir les professeurs
    async obtenirLesProfesseurs() {
        // Vérifier si le pool est disponible
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour obtenirLesProfesseurs");
            return {
                isFind: false,
                message: "Service temporairement indisponible - Pool fermé",
                data: []
            };
        }
        const sql = `
      SELECT * FROM utilisateurs
      WHERE status_id = 5;
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error("Erreur lors de la récupération des professeurs : " + error.message);
                    return resolve({
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
                    // Le trigger se charge automatiquement de :
                    // 1. Supprimer les associations cours_recurrent_professeur
                    // 2. Supprimer l'entrée dans la table professeurs
                    resolve({
                        isConfirm: true,
                        message: "Promotion retirée avec succès. Le professeur a été retiré de tous ses cours."
                    });
                }
            });
        });
    }
    async ajouterUnProfesseur(userData) {
        console.log('[ajouterUnProfesseur] userData reçu:', userData);
        let users = [];
        if (Array.isArray(userData.utilisateurs)) {
            // Si ce sont des objets, on garde tel quel
            if (typeof userData.utilisateurs[0] === 'object') {
                users = userData.utilisateurs;
            }
            else {
                // Si ce sont des ids, on les convertit en objets { id: ... }
                users = userData.utilisateurs.map((id) => ({ id: Number(id) }));
            }
        }
        else {
            users = [userData];
        }
        console.log('[ajouterUnProfesseur] users à traiter:', users);
        return new Promise((resolve, reject) => {
            let processed = 0;
            let errors = [];
            let successCount = 0;
            users.forEach((user, idx) => {
                console.log(`[ajouterUnProfesseur] Traitement user ${idx}:`, user);
                const selectSql = `SELECT * FROM utilisateurs WHERE id = ?`;
                this.mysqlConnector.query(selectSql, [user.id], (error, results) => {
                    if (error) {
                        console.log(`[ajouterUnProfesseur] Erreur SELECT id ${user.id}:`, error);
                        errors.push(`Erreur vérification id ${user.id}: ${error.message}`);
                        checkDone();
                        return;
                    }
                    console.log(`[ajouterUnProfesseur] Résultat SELECT id ${user.id}:`, results);
                    if (results.length > 0) {
                        const utilisateur = results[0];
                        console.log(`[ajouterUnProfesseur] Utilisateur trouvé id ${user.id}:`, utilisateur);
                        if (utilisateur.status_id === 5) {
                            console.log(`[ajouterUnProfesseur] Utilisateur déjà professeur id ${user.id}`);
                            successCount++;
                            checkDone();
                        }
                        else {
                            const updateSql = `UPDATE utilisateurs SET status_id = 5 WHERE id = ?`;
                            this.mysqlConnector.query(updateSql, [utilisateur.id], (updateError) => {
                                if (updateError) {
                                    console.log(`[ajouterUnProfesseur] Erreur UPDATE id ${user.id}:`, updateError);
                                    errors.push(`Erreur update id ${user.id}: ${updateError.message}`);
                                }
                                else {
                                    console.log(`[ajouterUnProfesseur] Promotion réussie id ${user.id}`);
                                    successCount++;
                                }
                                checkDone();
                            });
                        }
                    }
                    else {
                        console.log(`[ajouterUnProfesseur] Utilisateur NON trouvé id ${user.id}`);
                        errors.push(`Utilisateur id ${user.id} non trouvé, ajout impossible.`);
                        checkDone();
                    }
                });
            });
            function checkDone() {
                processed++;
                console.log(`[ajouterUnProfesseur] processed: ${processed}/${users.length}`);
                if (processed === users.length) {
                    if (errors.length === 0) {
                        console.log('[ajouterUnProfesseur] Tous promus');
                        resolve({ isConfirm: true, message: "Tous les utilisateurs ont été promus professeurs." });
                    }
                    else if (successCount > 0) {
                        console.log('[ajouterUnProfesseur] Promotion partielle, erreurs:', errors);
                        resolve({ isConfirm: true, message: `Promotion partielle. Erreurs: ${errors.join('; ')}` });
                    }
                    else {
                        console.log('[ajouterUnProfesseur] Aucune promotion, erreurs:', errors);
                        resolve({ isConfirm: false, message: `Aucune promotion. Erreurs: ${errors.join('; ')}` });
                    }
                }
            }
        });
    }
}
