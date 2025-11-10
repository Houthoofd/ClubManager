import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../middleware/auth.js';
import MysqlConnector from '../db/connector/mysqlconnector.js';
const router = express.Router();
const mysqlConnector = MysqlConnector.getInstance();
// Utilitaire pour utiliser le client avec Promise
function queryAsync(sql, values) {
    return new Promise((resolve, reject) => {
        mysqlConnector.query(sql, values, (err, results) => {
            if (err)
                reject(err);
            else
                resolve(results || []);
        });
    });
}
// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'UserId et mot de passe requis'
            });
        }
        // Rechercher uniquement par userId
        const user = await queryAsync(`SELECT 
          u.id,
          u.userId,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          u.password,
          u.status_id,
          u.email_verified,
          g.genre_name AS genres,
          s.nom_role AS status,
          gr.grade_id AS grades,
          a.nom_plan AS abonnement,
          u.date_of_birth
        FROM 
          utilisateurs u
        LEFT JOIN 
          genres g ON u.genre_id = g.id
        LEFT JOIN 
          status s ON u.status_id = s.id
        LEFT JOIN 
          grades gr ON u.grade_id = gr.id
        LEFT JOIN 
          plans_tarifaires a ON u.abonnement_id = a.id
        WHERE 
          u.userId = ?`, [email]);
        if (!user.length) {
            return res.status(401).json({
                success: false,
                message: 'UserId ou mot de passe incorrect'
            });
        }
        // Vérifier si l'email est confirmé
        if (user[0].email_verified !== 1) {
            return res.status(401).json({
                success: false,
                message: 'Veuillez confirmer votre email avant de vous connecter'
            });
        }
        // Si le mot de passe en base est "password123" (mot de passe par défaut non hashé)
        if (user[0].password === 'password123') {
            if (password === 'password123') {
                // Connexion acceptée pour le mot de passe par défaut
                const token = generateToken({
                    id: user[0].id,
                    email: user[0].email,
                    first_name: user[0].first_name, // AJOUTÉ
                    last_name: user[0].last_name, // AJOUTÉ
                    status_id: user[0].status_id,
                    role: user[0].status, // AJOUTÉ
                    status: user[0].status // AJOUTÉ
                });
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                    domain: process.env.NODE_ENV === 'production' ? 'clubmanagment.com' : 'localhost',
                    maxAge: 24 * 60 * 60 * 1000
                });
                return res.json({
                    success: true,
                    message: 'Connexion réussie (mot de passe par défaut)',
                    data: {
                        user: {
                            id: user[0].id,
                            first_name: user[0].first_name,
                            last_name: user[0].last_name,
                            nom_utilisateur: user[0].nom_utilisateur || '',
                            email: user[0].email,
                            status: user[0].status,
                            genres: user[0].genres,
                            grades: user[0].grades,
                            abonnement: user[0].abonnement,
                            date_of_birth: user[0].date_of_birth
                        },
                        token
                    }
                });
            }
            else {
                return res.status(401).json({
                    success: false,
                    message: 'Email ou mot de passe incorrect'
                });
            }
        }
        // Sinon, vérifie le hash bcrypt
        if (!user[0].password || typeof user[0].password !== 'string' || user[0].password.trim() === '') {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }
        const isValidPassword = await bcrypt.compare(password, user[0].password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Email ou mot de passe incorrect'
            });
        }
        const token = generateToken({
            id: user[0].id,
            email: user[0].email,
            status_id: user[0].status_id
        });
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            domain: process.env.NODE_ENV === 'production' ? 'clubmanagment.com' : 'localhost',
            maxAge: 24 * 60 * 60 * 1000
        });
        res.json({
            success: true,
            message: 'Connexion réussie',
            data: {
                user: {
                    id: user[0].id,
                    first_name: user[0].first_name,
                    last_name: user[0].last_name,
                    nom_utilisateur: user[0].nom_utilisateur || '',
                    email: user[0].email,
                    status: user[0].status,
                    genres: user[0].genres,
                    grades: user[0].grades,
                    abonnement: user[0].abonnement,
                    date_of_birth: user[0].date_of_birth
                },
                token
            }
        });
    }
    catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
// Logout
router.post('/logout', verifyToken, async (req, res) => {
    try {
        console.log('🚪 Déconnexion demandée pour utilisateur:', req.user?.id);
        // CORRECTION: Typage correct des attributs de cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax'),
            domain: process.env.NODE_ENV === 'production' ? 'clubmanagment.com' : 'localhost',
            path: '/'
        };
        // NOUVEAU: Supprimer le cookie 'token' avec TOUS les attributs possibles
        const cookieVariants = [
            // Variante exacte de production
            { httpOnly: true, secure: true, sameSite: 'strict', domain: 'clubmanagment.com', path: '/' },
            // Variantes de développement
            { httpOnly: true, secure: false, sameSite: 'lax', domain: 'localhost', path: '/' },
            { httpOnly: true, secure: false, sameSite: 'lax', path: '/' },
            // Variantes sans domaine
            { httpOnly: true, secure: false, path: '/' },
            { httpOnly: true, path: '/' },
            { path: '/' },
            // Variantes avec différents sameSite
            { httpOnly: true, secure: false, sameSite: 'strict', path: '/' },
            { httpOnly: true, secure: false, sameSite: 'none', path: '/' },
            // Variante minimale
            {}
        ];
        // Appliquer toutes les variantes de suppression pour le cookie 'token'
        cookieVariants.forEach((variant, index) => {
            try {
                res.clearCookie('token', variant);
                console.log(`🗑️ [Logout] Suppression cookie 'token' variant ${index + 1}:`, variant);
            }
            catch (error) {
                console.log(`⚠️ [Logout] Échec variant ${index + 1}:`, error.message);
            }
        });
        // NOUVEAU: Forcer la suppression avec headers Set-Cookie directs pour 'token'
        const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
        const tokenCookieHeaders = [
            `token=; expires=${expiredDate}; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
            `token=; expires=${expiredDate}; path=/; HttpOnly; SameSite=Lax`,
            `token=; expires=${expiredDate}; path=/; domain=localhost`,
            `token=; expires=${expiredDate}; path=/`,
            `token=; max-age=0; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
            `token=; max-age=0; path=/; HttpOnly`,
            `token=; max-age=0; path=/`,
            `token=deleted; expires=${expiredDate}; path=/; domain=localhost; HttpOnly`,
            `token=deleted; expires=${expiredDate}; path=/`,
            // AJOUTÉ: Headers pour production
            `token=; expires=${expiredDate}; path=/; domain=clubmanagment.com; HttpOnly; SameSite=Strict; Secure`,
            `token=; max-age=0; path=/; domain=clubmanagment.com; HttpOnly; SameSite=Strict; Secure`
        ];
        // Appliquer tous les headers de suppression pour 'token'
        const allHeaders = [];
        tokenCookieHeaders.forEach((header, index) => {
            try {
                allHeaders.push(header);
                console.log(`🔨 [Logout] Header suppression token ${index + 1}: ${header}`);
            }
            catch (error) {
                console.log(`⚠️ [Logout] Échec header token ${index + 1}:`, error);
            }
        });
        // CORRIGÉ: Définir tous les headers Set-Cookie d'un coup
        if (allHeaders.length > 0) {
            res.setHeader('Set-Cookie', allHeaders);
            console.log(`🔨 [Logout] ${allHeaders.length} headers Set-Cookie définis pour suppression token`);
        }
        // Supprimer les autres cookies potentiels (comme avant)
        const authCookieNames = [
            'authToken', 'userData', 'user', 'auth_token',
            'access_token', 'refresh_token', 'sessionId', 'session', 'jwt', 'JWT'
        ];
        authCookieNames.forEach(cookieName => {
            // Appliquer les mêmes variantes pour chaque cookie
            cookieVariants.forEach(variant => {
                try {
                    res.clearCookie(cookieName, variant);
                }
                catch (error) {
                    // Ignorer les erreurs pour les cookies secondaires
                }
            });
            console.log(`🗑️ [Logout] Cookie "${cookieName}" supprimé avec toutes les variantes`);
        });
        // Headers additionnels pour forcer la suppression
        res.setHeader('Clear-Site-Data', '"cookies", "storage"');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        console.log('✅ [Logout] Déconnexion côté serveur terminée avec suppression exhaustive des cookies');
        res.status(200).json({
            success: true,
            message: 'Déconnexion réussie - Tous les cookies ont été supprimés',
            cookiesCleared: ['token', ...authCookieNames],
            headersSet: allHeaders.length
        });
    }
    catch (error) {
        console.error('❌ [Logout] Erreur lors de la déconnexion:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la déconnexion'
        });
    }
});
// POST - Demande de réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email requis' });
        }
        console.log('🔄 [Auth] Demande réinitialisation mot de passe pour:', email);
        // Vérifier si l'utilisateur existe
        const userQuery = `SELECT id, email, first_name, last_name FROM utilisateurs WHERE email = ?`;
        const userResults = await queryAsync(userQuery, [email]);
        if (userResults.length === 0) {
            // Ne pas révéler que l'email n'existe pas pour des raisons de sécurité
            return res.json({
                message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.'
            });
        }
        const user = userResults[0];
        // Générer un token de réinitialisation
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure
        // CORRIGÉ: Utiliser la table password_reset_tokens au lieu de modifier utilisateurs
        try {
            // Supprimer les anciens tokens de cet utilisateur
            const deleteOldTokensQuery = `
        DELETE FROM password_reset_tokens 
        WHERE utilisateur_id = ? OR expires_at < NOW()
      `;
            await queryAsync(deleteOldTokensQuery, [user.id]);
            // Insérer le nouveau token dans password_reset_tokens
            const insertTokenQuery = `
        INSERT INTO password_reset_tokens (utilisateur_id, token, expires_at)
        VALUES (?, ?, ?)
      `;
            await queryAsync(insertTokenQuery, [user.id, resetToken, resetTokenExpiry]);
            console.log('✅ [Auth] Token de réinitialisation créé dans password_reset_tokens');
        }
        catch (tokenError) {
            console.error('❌ [Auth] Erreur création token:', tokenError);
            throw new Error('Erreur lors de la création du token de réinitialisation');
        }
        // Envoyer l'email de réinitialisation
        try {
            const { EmailClient } = await import('../clients/emailClient.js');
            const emailClient = new EmailClient();
            const resetUrl = `${process.env.FRONTEND_URL}/pages/auth/reset-password?token=${resetToken}`;
            await emailClient.sendPasswordResetEmail(user.email, {
                userName: `${user.first_name} ${user.last_name}`,
                resetUrl: resetUrl,
                expiresIn: '1 heure'
            }, user.id);
            console.log('✅ [Auth] Email de réinitialisation envoyé à:', email);
        }
        catch (emailError) {
            console.error('❌ [Auth] Erreur envoi email:', emailError);
            // Continuer même si l'email échoue
        }
        res.json({
            message: 'Si cette adresse email est associée à un compte, vous recevrez un lien de récupération.'
        });
    }
    catch (error) {
        console.error('❌ [Auth] Erreur forgot-password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// GET - Vérifier un token de réinitialisation
router.get('/verify-token/:token', async (req, res) => {
    try {
        const { token } = req.params;
        console.log('🔍 [Auth] Vérification token:', token.substring(0, 10) + '...');
        // CORRIGÉ: Utiliser password_reset_tokens au lieu de utilisateurs
        const query = `
      SELECT 
        prt.utilisateur_id,
        prt.expires_at,
        u.email, 
        u.first_name, 
        u.last_name
      FROM password_reset_tokens prt
      JOIN utilisateurs u ON prt.utilisateur_id = u.id
      WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used_at IS NULL
    `;
        const results = await queryAsync(query, [token]);
        if (results.length === 0) {
            return res.status(400).json({
                valid: false,
                error: 'Token invalide ou expiré'
            });
        }
        const tokenData = results[0];
        res.json({
            valid: true,
            email: tokenData.email,
            userName: `${tokenData.first_name} ${tokenData.last_name}`
        });
    }
    catch (error) {
        console.error('❌ [Auth] Erreur verify-token:', error);
        res.status(500).json({
            valid: false,
            error: 'Erreur serveur'
        });
    }
});
// POST - Réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token et nouveau mot de passe requis' });
        }
        console.log('🔄 [Auth] Réinitialisation mot de passe avec token:', token.substring(0, 10) + '...');
        // CORRIGÉ: Vérifier le token dans password_reset_tokens
        const verifyQuery = `
      SELECT 
        prt.utilisateur_id,
        u.email, 
        u.first_name, 
        u.last_name
      FROM password_reset_tokens prt
      JOIN utilisateurs u ON prt.utilisateur_id = u.id
      WHERE prt.token = ? AND prt.expires_at > NOW() AND prt.used_at IS NULL
    `;
        const tokenResults = await queryAsync(verifyQuery, [token]);
        if (tokenResults.length === 0) {
            return res.status(400).json({ error: 'Token invalide ou expiré' });
        }
        const tokenData = tokenResults[0];
        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Transaction pour mettre à jour le mot de passe et marquer le token comme utilisé
        try {
            // Mettre à jour le mot de passe
            const updatePasswordQuery = `
        UPDATE utilisateurs 
        SET password = ? 
        WHERE id = ?
      `;
            await queryAsync(updatePasswordQuery, [hashedPassword, tokenData.utilisateur_id]);
            // Marquer le token comme utilisé
            const markTokenUsedQuery = `
        UPDATE password_reset_tokens 
        SET used_at = NOW() 
        WHERE token = ?
      `;
            await queryAsync(markTokenUsedQuery, [token]);
            console.log('✅ [Auth] Mot de passe réinitialisé pour:', tokenData.email);
            res.json({ message: 'Mot de passe réinitialisé avec succès' });
        }
        catch (updateError) {
            console.error('❌ [Auth] Erreur mise à jour mot de passe:', updateError);
            throw new Error('Erreur lors de la mise à jour du mot de passe');
        }
    }
    catch (error) {
        console.error('❌ [Auth] Erreur reset-password:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Vérifier le token
router.get('/verify', verifyToken, (req, res) => {
    res.json({
        success: true,
        data: { user: req.user }
    });
});
// Refresh token
router.post('/refresh', verifyToken, (req, res) => {
    const newToken = generateToken({
        id: req.user.id,
        email: req.user.email,
        status_id: req.user.role
    });
    res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    });
    res.json({
        success: true,
        data: { token: newToken }
    });
});
// Route de test publique
router.get('/test', (req, res) => {
    res.json({ ok: true });
});
// CORRIGÉ: Route /auth/status pour vérifier l'authentification
router.get('/status', async (req, res) => {
    try {
        console.log('🔍 [Auth] Vérification du statut d\'authentification...');
        console.log('🔍 [Auth] Headers reçus:', {
            authorization: req.headers.authorization ? 'Present' : 'Missing',
            cookie: req.headers.cookie ? 'Present' : 'Missing',
            userAgent: req.headers['user-agent']
        });
        // MÉTHODE 1: Vérifier le token Bearer
        const authHeader = req.headers.authorization;
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('🔑 [Auth] Token Bearer détecté');
        }
        // MÉTHODE 2: Vérifier les cookies de session
        const sessionToken = req.cookies?.authToken || req.cookies?.sessionId || req.cookies?.token;
        if (!token && sessionToken) {
            token = sessionToken;
            console.log('🍪 [Auth] Token de session détecté');
        }
        if (!token) {
            console.log('❌ [Auth] Aucun token trouvé');
            return res.status(401).json({
                authentifie: false,
                error: 'Token d\'authentification manquant'
            });
        }
        // Vérifier et décoder le token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre-secret-jwt');
            console.log('✅ [Auth] Token valide, utilisateur:', decoded.id);
        }
        catch (tokenError) {
            console.log('❌ [Auth] Token invalide:', tokenError.message);
            return res.status(401).json({
                authentifie: false,
                error: 'Token invalide ou expiré'
            });
        }
        // CORRIGÉ: Récupérer les informations utilisateur directement depuis la base
        try {
            const userQuery = `
        SELECT 
          u.id,
          u.userId,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          u.status_id,
          g.genre_name AS genres,
          s.nom_role AS status,
          gr.grade_id AS grades,
          a.nom_plan AS abonnement,
          u.date_of_birth
        FROM utilisateurs u
        LEFT JOIN genres g ON u.genre_id = g.id
        LEFT JOIN status s ON u.status_id = s.id
        LEFT JOIN grades gr ON u.grade_id = gr.id
        LEFT JOIN plans_tarifaires a ON u.abonnement_id = a.id
        WHERE u.id = ?
      `;
            const userResults = await queryAsync(userQuery, [decoded.id]);
            if (userResults.length === 0) {
                console.log('❌ [Auth] Utilisateur non trouvé:', decoded.id);
                return res.status(401).json({
                    authentifie: false,
                    error: 'Utilisateur non trouvé'
                });
            }
            const utilisateur = userResults[0];
            console.log('✅ [Auth] Utilisateur authentifié:', {
                id: utilisateur.id,
                email: utilisateur.email,
                status: utilisateur.status
            });
            // Retourner les données dans le format attendu par AuthGuard
            res.status(200).json({
                authentifie: true,
                user: {
                    id: utilisateur.id,
                    email: utilisateur.email,
                    first_name: utilisateur.first_name,
                    last_name: utilisateur.last_name,
                    nom_utilisateur: utilisateur.nom_utilisateur,
                    status: utilisateur.status,
                    genres: utilisateur.genres,
                    grades: utilisateur.grades,
                    abonnement: utilisateur.abonnement,
                    date_of_birth: utilisateur.date_of_birth
                },
                token: token,
                timestamp: new Date().toISOString()
            });
        }
        catch (dbError) {
            console.error('❌ [Auth] Erreur base de données:', dbError);
            return res.status(500).json({
                authentifie: false,
                error: 'Erreur lors de la vérification de l\'utilisateur'
            });
        }
    }
    catch (error) {
        console.error('❌ [Auth] Erreur vérification statut:', error);
        res.status(500).json({
            authentifie: false,
            error: 'Erreur interne du serveur'
        });
    }
});
// Route pour confirmer l'email
router.get('/confirm-email', async (req, res) => {
    try {
        const { userId, token } = req.query;
        if (!userId || !token) {
            return res.status(400).json({
                success: false,
                message: 'UserId et token requis'
            });
        }
        // Vérifier si l'utilisateur existe
        const users = await queryAsync('SELECT id, userId, email, email_verified, email_verified_at FROM utilisateurs WHERE userId = ?', [userId]);
        if (!users.length) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        const user = users[0];
        // Vérifier si le compte est déjà confirmé
        if (user.email_verified === 1) {
            return res.status(400).json({
                success: false,
                message: 'Email déjà confirmé'
            });
        }
        // Vérifier le token dans la table validation_tokens
        const tokenRecords = await queryAsync(`SELECT id, expires_at, used, used_at 
       FROM validation_tokens 
       WHERE user_id_string = ? 
         AND token = ? 
         AND type = 'email_confirmation' 
         AND used = 0 
         AND expires_at > NOW()`, [userId, token]);
        if (!tokenRecords.length) {
            return res.status(400).json({
                success: false,
                message: 'Token invalide, expiré ou déjà utilisé'
            });
        }
        const tokenRecord = tokenRecords[0];
        // Transaction pour activer le compte et marquer le token comme utilisé
        try {
            await queryAsync('START TRANSACTION', []);
            // Activer le compte
            await queryAsync('UPDATE utilisateurs SET email_verified = 1, email_verified_at = NOW() WHERE userId = ?', [userId]);
            // Marquer le token comme utilisé
            await queryAsync('UPDATE validation_tokens SET used = 1, used_at = NOW() WHERE id = ?', [tokenRecord.id]);
            await queryAsync('COMMIT', []);
            res.json({
                success: true,
                message: 'Email confirmé avec succès'
            });
        }
        catch (transactionError) {
            await queryAsync('ROLLBACK', []);
            throw transactionError;
        }
    }
    catch (error) {
        console.error('Erreur confirmation email:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});
export default router;
