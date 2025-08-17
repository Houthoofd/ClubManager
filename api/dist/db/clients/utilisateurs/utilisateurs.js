import MysqlConnector from '../../connector/mysqlconnector.js';
export class Utilisateurs {
    // Vérifie si un utilisateur existe par email
    async checkUtilisateurByEmail(email) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM utilisateurs WHERE email = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [email], (error, results) => {
                mysqlConnector.close();
                if (error) {
                    reject(error);
                    return;
                }
                if (results.length > 0) {
                    resolve({ isFind: true, message: "Utilisateur déjà existant" });
                }
                else {
                    resolve({ isFind: false, message: "Utilisateur non trouvé" });
                }
            });
        });
    }
    // Inscription d'un utilisateur (version simple, à adapter selon tes besoins)
    async inscriptionUtilisateurSimple(data) {
        const mysqlConnector = new MysqlConnector();
        const sql = `
      INSERT INTO utilisateurs (nom_utilisateur, email, password, date_of_birth, abonnement_id)
      VALUES (?, ?, ?, ?, ?)
    `;
        // Remarque : abonnement doit être l'id, ici on suppose que tu passes le bon id
        const values = [
            data.username,
            data.email,
            data.password,
            data.date,
            data.abonnement
        ];
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, values, (error, results) => {
                mysqlConnector.close();
                if (error) {
                    reject(error);
                    return;
                }
                resolve({
                    insertId: results.insertId,
                    affectedRows: results.affectedRows,
                });
            });
        });
    }
    verifierUtilisateur(utilisateurData) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
        SELECT * FROM utilisateurs
        WHERE email = ? OR nom_utilisateur = ?
      `;
            const values = [
                utilisateurData.email,
                utilisateurData.nom_utilisateur
            ];
            console.log("Exécution de la requête :", sql, values);
            mysqlConnector.query(sql, values, (error, results) => {
                mysqlConnector.close(); // fermer connexion ici, une fois la requête finie
                if (error) {
                    console.error('Erreur lors de l\'exécution de la requête :', error.message);
                    reject(error);
                    return;
                }
                if (results.length > 0) {
                    console.log('Utilisateur trouvé :', results);
                    resolve({ isFind: true, message: "Utilisateur trouvé" });
                }
                else {
                    console.log('Aucun utilisateur trouvé.');
                    resolve({ isFind: false, message: "Utilisateur non trouvé" });
                }
            });
        });
    }
    async inscrireUtilisateur(utilisateurData) {
        const mysqlConnector = new MysqlConnector();
        if (!utilisateurData.password || utilisateurData.password.trim() === "") {
            utilisateurData.password = "password123";
        }
        const sql = `
      INSERT INTO utilisateurs (first_name, last_name, nom_utilisateur, email, genre_id, date_of_birth, password, status_id, grade_id, abonnement_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        console.log("Insertion utilisateur :", utilisateurData);
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, values, (error, results) => {
                mysqlConnector.close();
                if (error) {
                    console.error('Erreur lors de l\'insertion de l\'utilisateur :', error.message);
                    reject(error);
                    return;
                }
                if (results.affectedRows === 0) {
                    console.log("Aucun utilisateur inséré, vérifier les données.");
                }
                else {
                    console.log('Utilisateur inséré avec succès, ID:', results.insertId);
                }
                resolve({
                    insertId: results.insertId,
                    affectedRows: results.affectedRows,
                });
            });
        });
    }
    async validerConnexion(utilisateurData) {
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
        console.log("Validation connexion pour :", utilisateurData.email);
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, values, (error, results) => {
                mysqlConnector.close();
                if (error) {
                    console.error("Erreur lors de la vérification de l'utilisateur :", error.message);
                    reject(error);
                    return;
                }
                if (results.length > 0) {
                    const utilisateur = results[0];
                    console.log('Utilisateur trouvé avec succès.');
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
                }
                else {
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
            });
        });
    }
    obtenirTousLesUtilisateurs() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `SELECT * FROM utilisateurs`;
            mysqlConnector.query(sql, [], (error, results) => {
                mysqlConnector.close();
                if (error) {
                    console.error("Erreur lors de la récupération des utilisateurs :", error.message);
                    reject(error);
                    return;
                }
                if (results.length > 0) {
                    console.log('Utilisateurs trouvés avec succès.');
                    const utilisateurs = results.map((result) => ({
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
                        data: utilisateurs
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
            });
        });
    }
    obtenirUnUtilisateur(id) {
        return new Promise((resolve, reject) => {
            if (!id) {
                reject(new Error("L'identifiant est requis pour récupérer un utilisateur."));
                return;
            }
            const mysqlConnector = new MysqlConnector();
            const sql = 'SELECT * FROM utilisateurs WHERE id = ?';
            const values = [id];
            mysqlConnector.query(sql, values, (error, results) => {
                mysqlConnector.close();
                if (error) {
                    console.error("Erreur lors de la récupération de l'utilisateur :", error.message);
                    reject(error);
                    return;
                }
                if (results.length > 0) {
                    console.log('Utilisateur trouvé avec succès.');
                    const utilisateur = results.map((result) => ({
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
            });
        });
    }
    supprimerUtilisateur(utilisateurId) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const deleteSql = `DELETE FROM utilisateurs WHERE id = ?`;
            mysqlConnector.query(deleteSql, [utilisateurId], (error, result) => {
                mysqlConnector.close();
                if (error) {
                    console.error('Erreur lors de la suppression de l\'utilisateur :', error.message);
                    reject(error);
                    return;
                }
                console.log(`Utilisateur avec ID ${utilisateurId} supprimé avec succès`);
                resolve({ isConfirm: true, message: `Utilisateur avec ID ${utilisateurId} supprimé avec succès` });
            });
        });
    }
    mettreAjourUtilisateur(utilisateurData) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            if (!utilisateurData.prenom || !utilisateurData.nom) {
                reject(new Error("Le prénom et le nom de l'utilisateur sont requis pour la mise à jour."));
                return;
            }
            // 1) Récupérer l'id utilisateur à partir du prénom et nom
            const sqlSelect = `SELECT id FROM utilisateurs WHERE first_name = ? AND last_name = ? LIMIT 1`;
            const valuesSelect = [utilisateurData.prenom, utilisateurData.nom];
            mysqlConnector.query(sqlSelect, valuesSelect, (selectError, selectResults) => {
                if (selectError) {
                    mysqlConnector.close();
                    console.error("Erreur lors de la recherche de l'utilisateur :", selectError.message);
                    reject(selectError);
                    return;
                }
                if (selectResults.length === 0) {
                    mysqlConnector.close();
                    console.log("Utilisateur introuvable avec ce prénom et nom.");
                    resolve({ isConfirm: false, message: "Utilisateur introuvable avec ce prénom et nom." });
                    return;
                }
                const userId = selectResults[0].id;
                // 2) Mettre à jour l'utilisateur avec l'id trouvé
                const sqlUpdate = `
          UPDATE utilisateurs SET 
            first_name = ?,
            last_name = ?,
            nom_utilisateur = ?,
            email = ?,
            genre_id = ?,
            date_of_birth = ?,
            password = ?,
            status_id = ?,
            grade_id = ?,
            abonnement_id = ?
          WHERE id = ?
        `;
                const valuesUpdate = [
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
                    userId
                ];
                console.log("Exécution de la requête de mise à jour :", sqlUpdate, valuesUpdate);
                mysqlConnector.query(sqlUpdate, valuesUpdate, (updateError, updateResults) => {
                    mysqlConnector.close();
                    if (updateError) {
                        console.error('Erreur lors de la mise à jour de l\'utilisateur :', updateError.message);
                        reject(updateError);
                        return;
                    }
                    if (updateResults.affectedRows === 0) {
                        console.log("Aucun utilisateur mis à jour, vérifiez les données.");
                        resolve({ isConfirm: false, message: "Aucun utilisateur mis à jour." });
                    }
                    else {
                        console.log('Utilisateur mis à jour avec succès, ID:', userId);
                        resolve({ isConfirm: true, message: `Utilisateur avec ID ${userId} mis à jour avec succès.` });
                    }
                });
            });
        });
    }
}
