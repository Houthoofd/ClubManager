import MysqlConnector from '../../connector/mysqlconnector.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
export class Auth {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    // AJOUTÉ: Méthode queryAsync pour compatibilité avec les routes de récupération
    queryAsync(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, params, (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
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
    // AJOUTÉ: Vérifier les tentatives de récupération récentes (protection anti-spam)
    verifierTentativesRecuperationRecentes(email, minutes = 15) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT COUNT(*) as count
        FROM password_reset_attempts
        WHERE email = ? AND attempted_at > ?
      `;
            const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
            this.mysqlConnector.query(sql, [email, timeAgo], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la vérification des tentatives de récupération :', error);
                    resolve(0); // En cas d'erreur, autoriser par défaut
                }
                else {
                    resolve(results[0].count);
                }
            });
        });
    }
    // CORRIGÉ: Rechercher un utilisateur par email avec les vrais noms de colonnes
    rechercherUtilisateurParEmail(email) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT id, email, last_name, first_name, status_id
        FROM utilisateurs
        WHERE email = ?
      `;
            this.mysqlConnector.query(sql, [email], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la recherche utilisateur :', error);
                    reject(error);
                }
                else {
                    resolve(results.length > 0 ? results[0] : null);
                }
            });
        });
    }
    // CORRIGÉ: Récupérer les informations de sécurité avec les vrais noms de colonnes
    obtenirInformationsSecurite(userId) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT 
          u.id, u.email, u.last_name, u.first_name, 
          u.date_of_birth, u.date_inscription,
          COUNT(DISTINCT p.id) as nb_paiements,
          COUNT(DISTINCT i.id) as nb_inscriptions,
          DATE(MAX(p.date_paiement)) as dernier_paiement
        FROM utilisateurs u
        LEFT JOIN paiements p ON u.id = p.utilisateur_id
        LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
        WHERE u.id = ?
        GROUP BY u.id
      `;
            this.mysqlConnector.query(sql, [userId], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des infos sécurité :', error);
                    reject(error);
                }
                else {
                    resolve(results.length > 0 ? results[0] : null);
                }
            });
        });
    }
    // CORRIGÉ: Créer un token de récupération avec user_id (comme dans votre schéma)
    creerTokenRecuperation(userId, token, expiresAt) {
        return new Promise((resolve, reject) => {
            // D'abord supprimer les anciens tokens - CORRIGÉ: user_id
            const deleteOldTokens = `
        DELETE FROM password_reset_tokens 
        WHERE user_id = ?
      `;
            this.mysqlConnector.query(deleteOldTokens, [userId], (deleteError) => {
                if (deleteError) {
                    console.error('Erreur lors de la suppression des anciens tokens :', deleteError);
                    reject(deleteError);
                    return;
                }
                // Créer le nouveau token - CORRIGÉ: user_id
                const insertToken = `
          INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
          VALUES (?, ?, ?, ?)
        `;
                this.mysqlConnector.query(insertToken, [userId, token, expiresAt, new Date()], (insertError) => {
                    if (insertError) {
                        console.error('Erreur lors de la création du token :', insertError);
                        reject(insertError);
                    }
                    else {
                        resolve({
                            isConfirm: true,
                            message: 'Token de récupération créé avec succès'
                        });
                    }
                });
            });
        });
    }
    // CORRIGÉ: Vérifier un token de récupération avec user_id
    verifierTokenRecuperation(token) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT prt.*, u.id as user_id, u.email, u.last_name, u.first_name
        FROM password_reset_tokens prt
        JOIN utilisateurs u ON prt.user_id = u.id
        WHERE prt.token = ? AND prt.expires_at > ?
      `;
            this.mysqlConnector.query(sql, [token, new Date()], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la vérification du token :', error);
                    reject(error);
                }
                else {
                    resolve(results.length > 0 ? results[0] : null);
                }
            });
        });
    }
    // CORRIGÉ: Marquer un token comme utilisé en le supprimant
    marquerTokenUtilise(token) {
        return new Promise((resolve, reject) => {
            const sql = `
        DELETE FROM password_reset_tokens 
        WHERE token = ?
      `;
            this.mysqlConnector.query(sql, [token], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la suppression du token :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Token non trouvé'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Token supprimé (marqué comme utilisé)'
                    });
                }
            });
        });
    }
    // CORRIGÉ: Réinitialiser le mot de passe avec user_id
    reinitialiserMotDePasseAvecToken(token, newPasswordHash) {
        return new Promise(async (resolve, reject) => {
            try {
                // Vérifier le token
                const tokenData = await this.verifierTokenRecuperation(token);
                if (!tokenData) {
                    resolve({
                        isConfirm: false,
                        message: 'Token invalide ou expiré'
                    });
                    return;
                }
                // Mettre à jour le mot de passe - CORRIGÉ: password au lieu de password_hash
                const updatePasswordSql = `
          UPDATE utilisateurs 
          SET password = ?
          WHERE id = ?
        `;
                this.mysqlConnector.query(updatePasswordSql, [newPasswordHash, tokenData.user_id], (updateError, updateResults) => {
                    if (updateError) {
                        console.error('Erreur lors de la mise à jour du mot de passe :', updateError);
                        reject(updateError);
                        return;
                    }
                    if (updateResults.affectedRows === 0) {
                        resolve({
                            isConfirm: false,
                            message: 'Utilisateur non trouvé'
                        });
                        return;
                    }
                    // Supprimer le token utilisé et tous les autres tokens pour cet utilisateur - CORRIGÉ: user_id
                    const deleteAllTokens = `
            DELETE FROM password_reset_tokens 
            WHERE user_id = ?
          `;
                    this.mysqlConnector.query(deleteAllTokens, [tokenData.user_id], (deleteError) => {
                        if (deleteError) {
                            console.warn('Erreur lors de la suppression des tokens :', deleteError);
                        }
                        resolve({
                            isConfirm: true,
                            message: 'Mot de passe réinitialisé avec succès'
                        });
                    });
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    // AJOUTÉ: Vérifier si un email existe
    emailExiste(email) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT COUNT(*) as count
        FROM utilisateurs
        WHERE email = ?
      `;
            this.mysqlConnector.query(sql, [email], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la vérification de l\'email :', error);
                    reject(error);
                }
                else {
                    resolve(results[0].count > 0);
                }
            });
        });
    }
    // AJOUTÉ: Nettoyer les tokens expirés
    nettoyerTokensExpires() {
        return new Promise((resolve, reject) => {
            const sql = `
        DELETE FROM password_reset_tokens 
        WHERE expires_at < ?
      `;
            const now = new Date();
            this.mysqlConnector.query(sql, [now], (error, results) => {
                if (error) {
                    console.error('Erreur lors du nettoyage des tokens :', error);
                    reject(error);
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: `${results.affectedRows} tokens expirés supprimés`
                    });
                }
            });
        });
    }
    // AJOUTÉ: Obtenir les tentatives de connexion récentes (pour protection contre brute force)
    obtenirTentativesConnexionRecentes(email, minutes = 15) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT COUNT(*) as count
        FROM auth_attempts
        WHERE email = ? AND attempted_at > ?
      `;
            const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
            this.mysqlConnector.query(sql, [email, timeAgo], (error, results) => {
                if (error) {
                    console.error('Erreur lors du comptage des tentatives :', error);
                    reject(error);
                }
                else {
                    resolve(results[0].count);
                }
            });
        });
    }
    // AJOUTÉ: Enregistrer une tentative de récupération pour audit (sans IP)
    enregistrerTentativeRecuperation(email, success) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO password_reset_attempts (email, success, attempted_at)
        VALUES (?, ?, ?)
      `;
            this.mysqlConnector.query(sql, [email, success, new Date()], (error) => {
                if (error) {
                    console.error('Erreur lors de l\'enregistrement de la tentative :', error);
                    // Ne pas faire échouer le processus principal
                }
                resolve();
            });
        });
    }
    // AJOUTÉ: Enregistrer une tentative de connexion (sans IP)
    enregistrerTentativeConnexion(email, success) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO auth_attempts (email, success, attempted_at)
        VALUES (?, ?, ?)
      `;
            this.mysqlConnector.query(sql, [email, success, new Date()], (error) => {
                if (error) {
                    console.error('Erreur lors de l\'enregistrement de la tentative :', error);
                    // Ne pas faire échouer l'authentification si l'enregistrement échoue
                    resolve();
                }
                else {
                    resolve();
                }
            });
        });
    }
    // AJOUTÉ: Créer une demande de récupération manuelle (sans données IP)
    creerDemandeRecuperationManuelle(userId, raison, informationsVerification) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO manual_recovery_requests (
          user_id, reason, verification_data, status, created_at, expires_at
        ) VALUES (?, ?, ?, 'pending', ?, ?)
      `;
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
            const verificationJson = JSON.stringify({
                ...informationsVerification,
                timestamp: new Date().toISOString()
            });
            this.mysqlConnector.query(sql, [
                userId, raison, verificationJson, new Date(), expiresAt
            ], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la création de la demande manuelle :', error);
                    reject(error);
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Demande de récupération manuelle créée avec succès'
                    });
                }
            });
        });
    }
    // AJOUTÉ: Générer un token sécurisé
    static genererTokenSecurise(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }
    // AJOUTÉ: Hasher un mot de passe
    static async hasherMotDePasse(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    // AJOUTÉ: Vérifier un mot de passe
    static async verifierMotDePasse(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    // AJOUTÉ: Valider un email
    static validerEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    // AJOUTÉ: Valider un mot de passe
    static validerMotDePasse(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Le mot de passe doit contenir au moins 8 caractères');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une majuscule');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins une minuscule');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Le mot de passe doit contenir au moins un chiffre');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
}
