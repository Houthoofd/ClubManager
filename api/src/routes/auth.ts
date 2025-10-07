import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken, verifyToken } from '../middleware/auth.js';
import MysqlConnector from '../db/connector/mysqlconnector.js';
import { User } from '../types/user.js';

const router = express.Router();
const mysqlConnector = MysqlConnector.getInstance();

// Utilitaire pour utiliser le client avec Promise
function queryAsync(sql: string, values: any[]): Promise<any[]> {
  return new Promise((resolve, reject) => {
    mysqlConnector.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results || []);
    });
  });
}

// Login
router.post('/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'UserId et mot de passe requis'
      });
    }

    // Rechercher uniquement par userId
    const user = await queryAsync(
      `SELECT 
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
          u.userId = ?`,
      [email]
    );

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
          last_name: user[0].last_name,   // AJOUTÉ
          status_id: user[0].status_id,
          role: user[0].status,           // AJOUTÉ
          status: user[0].status          // AJOUTÉ
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
      } else {
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

  } catch (error) {
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
      sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
      domain: process.env.NODE_ENV === 'production' ? 'clubmanagment.com' : 'localhost',
      path: '/'
    };

    // Supprimer le cookie 'token' avec les attributs exacts
    res.clearCookie('token', cookieOptions);
    
    // NOUVEAU: Suppression exhaustive avec typage correct
    const cookieVariants = [
      // Variante 1: Attributs exacts comme à la création
      { httpOnly: true, secure: false, sameSite: 'lax' as const, domain: 'localhost', path: '/' },
      
      // Variante 2: Sans domaine
      { httpOnly: true, secure: false, sameSite: 'lax' as const, path: '/' },
      
      // Variante 3: Domaine undefined
      { httpOnly: true, secure: false, sameSite: 'lax' as const, domain: undefined, path: '/' },
      
      // Variante 4: Sans sameSite
      { httpOnly: true, secure: false, path: '/' },
      
      // Variante 5: Minimum d'attributs
      { path: '/' },
      
      // Variante 6: Avec différents sameSite
      { httpOnly: true, secure: false, sameSite: 'strict' as const, domain: 'localhost', path: '/' },
      { httpOnly: true, secure: false, sameSite: 'none' as const, domain: 'localhost', path: '/' },
      
      // Variante 7: Pour développement et production
      { httpOnly: true, secure: true, sameSite: 'strict' as const, domain: 'clubmanagment.com', path: '/' }
    ];

    // Appliquer toutes les variantes de suppression
    cookieVariants.forEach((variant, index) => {
      try {
        res.clearCookie('token', variant);
        console.log(`🗑️ Tentative suppression cookie variant ${index + 1}:`, variant);
      } catch (error: any) {
        console.log(`⚠️ Échec variant ${index + 1}:`, error.message);
      }
    });

    // NOUVEAU: Forcer la suppression avec headers Set-Cookie directs
    const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
    const cookieHeaders = [
      `token=; expires=${expiredDate}; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
      `token=; expires=${expiredDate}; path=/; HttpOnly; SameSite=Lax`,
      `token=; expires=${expiredDate}; path=/; domain=localhost`,
      `token=; expires=${expiredDate}; path=/`,
      `token=; max-age=0; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
      `token=; max-age=0; path=/; HttpOnly`,
      `token=; max-age=0; path=/`,
      `token=deleted; expires=${expiredDate}; path=/; domain=localhost; HttpOnly`,
      `token=deleted; expires=${expiredDate}; path=/`
    ];

    // Appliquer tous les headers de suppression
    cookieHeaders.forEach((header, index) => {
      try {
        res.setHeader('Set-Cookie', header);
        console.log(`🔨 Header suppression ${index + 1}: ${header}`);
      } catch (error) {
        console.log(`⚠️ Échec header ${index + 1}:`, error);
      }
    });

    // Supprimer les autres cookies potentiels
    const authCookieNames = [
      'authToken', 'userData', 'user', 'auth_token',
      'access_token', 'refresh_token', 'sessionId', 'session', 'jwt', 'JWT'
    ];

    authCookieNames.forEach(cookieName => {
      res.clearCookie(cookieName);
      res.clearCookie(cookieName, { path: '/', domain: 'localhost' });
      res.clearCookie(cookieName, { path: '/', httpOnly: true });
      console.log(`🗑️ Cookie "${cookieName}" supprimé`);
    });

    // Headers additionnels pour forcer la suppression
    res.setHeader('Clear-Site-Data', '"cookies", "storage"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log('✅ Déconnexion côté serveur terminée avec suppression exhaustive');

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie - Tous les cookies ont été supprimés'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    });
  }
});

// CORRECTION: Route de nettoyage d'urgence avec typage correct
router.post('/cleanup-cookies', async (req, res) => {
  try {
    console.log('🧹 Nettoyage d\'urgence des cookies demandé');
    
    // NOUVEAU: Suppression spécifique et exhaustive du cookie 'token'
    const expiredDate = 'Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Toutes les combinaisons possibles pour supprimer le cookie 'token'
    const tokenDeletionHeaders = [
      `token=; expires=${expiredDate}; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
      `token=; expires=${expiredDate}; path=/; domain=localhost; HttpOnly; SameSite=Strict`,
      `token=; expires=${expiredDate}; path=/; domain=localhost; HttpOnly`,
      `token=; expires=${expiredDate}; path=/; HttpOnly; SameSite=Lax`,
      `token=; expires=${expiredDate}; path=/; HttpOnly`,
      `token=; expires=${expiredDate}; path=/; domain=localhost`,
      `token=; expires=${expiredDate}; path=/`,
      `token=; max-age=0; path=/; domain=localhost; HttpOnly; SameSite=Lax`,
      `token=; max-age=0; path=/; HttpOnly; SameSite=Lax`,
      `token=; max-age=0; path=/; domain=localhost`,
      `token=; max-age=0; path=/`,
      `token=deleted; expires=${expiredDate}; path=/; domain=localhost; HttpOnly`,
      `token=deleted; expires=${expiredDate}; path=/`
    ];

    // Appliquer chaque header individuellement
    tokenDeletionHeaders.forEach((header, index) => {
      res.setHeader(`Set-Cookie-${index}`, header);
      console.log(`🔥 Suppression forcée ${index + 1}: ${header}`);
    });

    // Méthodes clearCookie avec typage correct
    const cookieVariants = [
      { httpOnly: true, secure: false, sameSite: 'lax' as const, domain: 'localhost', path: '/' },
      { httpOnly: true, secure: false, sameSite: 'lax' as const, path: '/' },
      { httpOnly: true, path: '/' },
      { path: '/', domain: 'localhost' },
      { path: '/' }
    ];

    cookieVariants.forEach((variant, index) => {
      res.clearCookie('token', variant);
      console.log(`🧹 clearCookie variant ${index + 1}:`, variant);
    });

    // Autres cookies d'authentification
    const authCookieNames = [
      'authToken', 'userData', 'user', 'auth_token', 
      'access_token', 'refresh_token', 'sessionId', 'session', 'jwt', 'JWT'
    ];

    authCookieNames.forEach(cookieName => {
      res.clearCookie(cookieName);
      res.clearCookie(cookieName, { path: '/', domain: 'localhost' });
      res.clearCookie(cookieName, { path: '/', httpOnly: true });
    });

    // Headers de nettoyage global
    res.setHeader('Clear-Site-Data', '"cookies", "storage"');
    
    res.status(200).json({
      success: true,
      message: 'Nettoyage d\'urgence effectué avec suppression exhaustive du cookie token'
    });

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage d\'urgence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des cookies'
    });
  }
});

// Vérifier le token
router.get('/verify', verifyToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { user: req.user }
  });
});

// Refresh token
router.post('/refresh', verifyToken, (req: Request, res: Response) => {
  const newToken = generateToken({
    id: req.user!.id,
    email: req.user!.email,
    status_id: req.user!.role
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
router.get('/status', verifyToken, async (req: any, res: any) => {
  console.log('[AUTH] /status route called, user:', req.user);
  if (!req.user || !req.user.id) {
    console.log('[AUTH] /status - utilisateur non authentifié ou token absent');
    return res.status(401).json({ authentifie: false, user: null });
  }
  try {
    const userId = req.user.id;
    console.log('[AUTH] /status - userId:', userId, 'token:', req.cookies?.token);

    // Ajoute un log pour vérifier la requête SQL et le paramètre
    console.log('[AUTH] /status - requête SQL utilisateur id:', userId);

    const users: User[] = await queryAsync(
      `SELECT 
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
        LEFT JOIN 
          genres g ON u.genre_id = g.id  
        LEFT JOIN 
          status s ON u.status_id = s.id  
        LEFT JOIN 
          grades gr ON u.grade_id = gr.id  
        LEFT JOIN 
          plans_tarifaires a ON u.abonnement_id = a.id  
        WHERE 
          u.id = ?`,
      [userId]
    );
    console.log('[AUTH] /status - résultat SQL:', users);

    const user = users && users.length > 0 ? users[0] : null;
    if (!user) {
      console.log('[AUTH] /status - utilisateur non trouvé, retour 401');
      return res.status(401).json({ authentifie: false, user: null });
    }
    res.json({
      authentifie: true,
      user
    });
  } catch (error) {
    console.log('[AUTH] /status - erreur serveur', error);
    res.status(500).json({ authentifie: false, user: null });
  }
});

// Route pour confirmer l'email
router.get('/confirm-email', async (req: Request, res: Response) => {
  try {
    const { userId, token } = req.query;
    
    if (!userId || !token) {
      return res.status(400).json({ 
        success: false, 
        message: 'UserId et token requis' 
      });
    }

    // Vérifier si l'utilisateur existe
    const users = await queryAsync(
      'SELECT id, userId, email, email_verified, email_verified_at FROM utilisateurs WHERE userId = ?',
      [userId as string]
    );

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
    const tokenRecords = await queryAsync(
      `SELECT id, expires_at, used, used_at 
       FROM validation_tokens 
       WHERE user_id_string = ? 
         AND token = ? 
         AND type = 'email_confirmation' 
         AND used = 0 
         AND expires_at > NOW()`,
      [userId as string, token as string]
    );

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
      await queryAsync(
        'UPDATE utilisateurs SET email_verified = 1, email_verified_at = NOW() WHERE userId = ?',
        [userId as string]
      );

      // Marquer le token comme utilisé
      await queryAsync(
        'UPDATE validation_tokens SET used = 1, used_at = NOW() WHERE id = ?',
        [tokenRecord.id]
      );

      await queryAsync('COMMIT', []);

      res.json({ 
        success: true, 
        message: 'Email confirmé avec succès' 
      });

    } catch (transactionError) {
      await queryAsync('ROLLBACK', []);
      throw transactionError;
    }

  } catch (error) {
    console.error('Erreur confirmation email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur' 
    });
  }
});

export default router;