import MysqlConnector from '../../connector/mysqlconnector.js';
export class Verifiation {
    // Vérifie si un email existe
    async checkUtilisateurByEmail(email) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM utilisateurs WHERE email = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [email], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Email déjà utilisé." : "Email disponible."
                });
            });
        });
    }
    // Vérifie si un nom_utilisateur existe
    async checkUtilisateurByNomUtilisateur(nom_utilisateur) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM utilisateurs WHERE nom_utilisateur = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [nom_utilisateur], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Nom d'utilisateur déjà utilisé." : "Nom d'utilisateur disponible."
                });
            });
        });
    }
    // Vérifie si un prénom existe
    async checkUtilisateurByPrenom(prenom) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM utilisateurs WHERE first_name = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [prenom], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Prénom déjà utilisé." : "Prénom disponible."
                });
            });
        });
    }
    // Vérifie si un nom existe
    async checkUtilisateurByNom(nom) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM utilisateurs WHERE last_name = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [nom], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Nom déjà utilisé." : "Nom disponible."
                });
            });
        });
    }
    // Vérifie la combinaison prénom + nom
    async checkUtilisateurByPrenomNom(prenom, nom) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM utilisateurs WHERE first_name = ? AND last_name = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [prenom, nom], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Utilisateur déjà existant." : "Utilisateur disponible."
                });
            });
        });
    }
    // Vérifie si un utilisateur existe via email, prénom et nom
    async checkUtilisateurByEmailPrenomNom(email, prenom, nom) {
        const mysqlConnector = new MysqlConnector();
        const sql = `
      SELECT id FROM utilisateurs
      WHERE email = ? AND first_name = ? AND last_name = ? LIMIT 1
    `;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [email, prenom, nom], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Utilisateur déjà existant avec cet email, prénom et nom." : "Utilisateur disponible."
                });
            });
        });
    }
    // Vérifie si un cours existe déjà dans le planning (jour, heure, type)
    async checkCoursPlanning(jour, heure_debut, heure_fin, type_cours) {
        const mysqlConnector = new MysqlConnector();
        // Normalise le jour pour gérer les majuscules/accents
        const normalizeString = (str) => str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
        const joursDeSemaine = {
            lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7
        };
        const jourNum = joursDeSemaine[normalizeString(jour)];
        const sql = `
      SELECT id FROM cours_recurrent
      WHERE jour_semaine = ?
        AND heure_debut = ?
        AND heure_fin = ?
        AND type_cours = ?
      LIMIT 1
    `;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [jourNum, heure_debut, heure_fin, type_cours], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                if (results.length > 0) {
                    resolve({ exists: true, message: "Ce créneau de cours existe déjà dans le planning." });
                }
                else {
                    resolve({ exists: false, message: "Ce créneau est disponible." });
                }
            });
        });
    }
    // Vérifie si un article magasin existe déjà par son nom
    async checkArticleByNom(nom) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM articles WHERE nom = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [nom], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Article déjà existant." : "Article disponible."
                });
            });
        });
    }
    // Vérifie si un article magasin existe déjà par son nom ET sa catégorie
    async checkArticleByNomAndCategorie(nom, categorie_id) {
        const mysqlConnector = new MysqlConnector();
        const sql = `SELECT id FROM articles WHERE nom = ? AND categorie_id = ? LIMIT 1`;
        return new Promise((resolve, reject) => {
            mysqlConnector.query(sql, [nom, categorie_id], (error, results) => {
                mysqlConnector.close();
                if (error)
                    return reject(error);
                resolve({
                    isFind: results.length > 0,
                    message: results.length > 0 ? "Article déjà existant dans cette catégorie." : "Article disponible dans cette catégorie."
                });
            });
        });
    }
    // Vérifie si un ou plusieurs utilisateurs sont déjà professeurs
    async checkUtilisateursSontProfesseurs(utilisateurs) {
        const mysqlConnector = new MysqlConnector();
        // On construit une requête pour tous les couples nom/prenom
        const results = [];
        for (const utilisateur of utilisateurs) {
            const sql = `SELECT id FROM utilisateurs WHERE last_name = ? AND first_name = ? AND status_id = 5 LIMIT 1`;
            // status_id = 5 pour professeur
            // eslint-disable-next-line no-await-in-loop
            const isProf = await new Promise((resolve, reject) => {
                mysqlConnector.query(sql, [utilisateur.nom, utilisateur.prenom], (error, rows) => {
                    if (error)
                        return reject(error);
                    resolve(rows.length > 0);
                });
            });
            results.push({ nom: utilisateur.nom, prenom: utilisateur.prenom, isProf });
        }
        mysqlConnector.close();
        return {
            professeurs: results,
            message: 'Vérification des statuts professeurs effectuée.'
        };
    }
}
