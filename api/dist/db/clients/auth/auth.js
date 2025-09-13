import MysqlConnector from '../../connector/mysqlconnector.js';
import bcrypt from 'bcrypt';
export class Auth {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    authentifierUtilisateur(email, password) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT id, first_name, last_name, email, password_hash, status_id
        FROM utilisateurs
        WHERE email = ? AND status_id = 1
      `;
            this.mysqlConnector.query(sql, [email], async (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'authentification :', error);
                    reject(error);
                }
                else if (results.length === 0) {
                    resolve({ success: false, message: 'Utilisateur non trouvé' });
                }
                else {
                    const user = results[0];
                    try {
                        const isValidPassword = await bcrypt.compare(password, user.password_hash);
                        if (isValidPassword) {
                            resolve({
                                success: true,
                                user: {
                                    id: user.id,
                                    first_name: user.first_name,
                                    last_name: user.last_name,
                                    email: user.email
                                }
                            });
                        }
                        else {
                            resolve({ success: false, message: 'Mot de passe incorrect' });
                        }
                    }
                    catch (bcryptError) {
                        reject(bcryptError);
                    }
                }
            });
        });
    }
    creerCompteUtilisateur(userData) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO utilisateurs (first_name, last_name, email, password_hash, status_id)
        VALUES (?, ?, ?, ?, 1)
      `;
            this.mysqlConnector.query(sql, [
                userData.first_name,
                userData.last_name,
                userData.email,
                userData.password_hash
            ], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la création du compte :', error);
                    reject(error);
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Compte créé avec succès'
                    });
                }
            });
        });
    }
    modifierMotDePasse(userId, newPasswordHash) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE utilisateurs 
        SET password_hash = ?
        WHERE id = ? AND status_id = 1
      `;
            this.mysqlConnector.query(sql, [newPasswordHash, userId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la modification du mot de passe :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Utilisateur non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Mot de passe modifié avec succès'
                    });
                }
            });
        });
    }
}
