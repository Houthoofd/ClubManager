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
}
