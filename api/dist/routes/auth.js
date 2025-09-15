import express from 'express';
import bcrypt from 'bcrypt';
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
                message: 'Email et mot de passe requis'
            });
        }
        const user = await queryAsync(`SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          u.password,
          u.status_id,
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
          u.email = ?`, [email]);
        if (!user.length) {
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
            secure: process.env.NODE_ENV === 'production', // Utiliser HTTPS uniquement en production
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Politique SameSite stricte en production
            domain: process.env.NODE_ENV === 'production' ? 'clubmanagment.com' : 'localhost', // Définir le domaine dynamiquement
            maxAge: 24 * 60 * 60 * 1000 // 1 jour
        });
        // Ajoutez les informations utilisateur nécessaires dans la réponse
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
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Déconnexion réussie'
    });
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
        status_id: req.user.status_id
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
// Status
router.get('/status', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await queryAsync(`SELECT 
          u.id,
          u.first_name,
          u.last_name,
          u.nom_utilisateur,
          u.email,
          g.genre_name AS genres,  
          s.nom_role AS status,  
          gr.grade_id AS grades,  
          a.nom_plan AS abonnement,  
          u.date_of_birth
        FROM 
          utilisateurs u
        JOIN 
          genres g ON u.genre_id = g.id  
        JOIN 
          status s ON u.status_id = s.id  
        JOIN 
          grades gr ON u.grade_id = gr.id  
        JOIN 
          plans_tarifaires a ON u.abonnement_id = a.id  
        WHERE 
          u.id = ?`, [userId]);
        if (!user) {
            return res.status(401).json({ authentifie: false, user: null });
        }
        res.json({
            authentifie: true,
            user
        });
    }
    catch (error) {
        res.status(500).json({ authentifie: false, user: null });
    }
});
export default router;
