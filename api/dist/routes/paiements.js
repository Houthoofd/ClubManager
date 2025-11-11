import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const router = express.Router();
console.log('🔧 [Paiements] Initialisation du module de paiements modulaire');
// CORRIGÉ: Middleware d'authentification flexible - correction import JWT
const flexibleAuth = async (req, res, next) => {
    try {
        console.log('🔐 [Paiements Auth] Vérification authentification flexible...');
        // CORRIGÉ: Récupérer le token avec priorité sur cookies.token et userData.token
        let token = req.cookies?.token ||
            req.headers.authorization?.replace('Bearer ', '') ||
            req.headers.authtoken ||
            req.headers['x-auth-token'] ||
            req.cookies?.authToken;
        // AJOUTÉ: Essayer de récupérer depuis userData.token si pas trouvé
        if (!token && req.headers['user-data']) {
            try {
                const userData = JSON.parse(req.headers['user-data']);
                if (userData && userData.token) {
                    token = userData.token;
                    console.log('🔑 [Paiements Auth] Token récupéré depuis user-data header');
                }
            }
            catch (parseError) {
                console.warn('⚠️ [Paiements Auth] Erreur parsing user-data header:', parseError);
            }
        }
        console.log('🔑 [Paiements Auth] Sources de token vérifiées (priorité cookies.token):', {
            cookieToken: !!req.cookies?.token,
            authorization: !!req.headers.authorization,
            authtoken: !!req.headers.authtoken,
            'x-auth-token': !!req.headers['x-auth-token'],
            cookieAuthToken: !!req.cookies?.authToken,
            userDataHeader: !!req.headers['user-data'],
            tokenFound: !!token,
            tokenSource: req.cookies?.token ? 'token cookie' :
                req.headers.authorization ? 'authorization header' :
                    req.headers.authtoken ? 'authtoken header' :
                        req.headers['x-auth-token'] ? 'x-auth-token header' :
                            req.cookies?.authToken ? 'authToken cookie' :
                                req.headers['user-data'] ? 'userData header' : 'AUCUNE'
        });
        if (!token) {
            console.error('❌ [Paiements Auth] Aucun token trouvé');
            return res.status(401).json({
                error: 'Token d\'authentification manquant',
                hint: 'Utilisez le cookie token ou le header Authorization: Bearer <token>',
                debug: {
                    cookieToken: !!req.cookies?.token,
                    authorization: !!req.headers.authorization,
                    authtoken: !!req.headers.authtoken,
                    userDataHeader: !!req.headers['user-data']
                }
            });
        }
        // CORRIGÉ: Décoder le token JWT avec import correct
        try {
            const jwtModule = await import('jsonwebtoken');
            const jwt = jwtModule.default || jwtModule; // Support des deux formats d'export
            console.log('🔍 [Paiements Auth] JWT module importé:', {
                hasDefault: !!jwtModule.default,
                hasVerify: !!(jwt.verify || jwtModule.verify),
                moduleKeys: Object.keys(jwtModule),
                jwtKeys: Object.keys(jwt)
            });
            // Essayer différentes méthodes d'accès à la fonction verify
            let verifyFunction = jwt.verify || jwtModule.verify;
            if (!verifyFunction) {
                console.error('❌ [Paiements Auth] Fonction verify non trouvée dans le module JWT');
                console.error('❌ [Paiements Auth] Module JWT disponible:', Object.keys(jwtModule));
                return res.status(500).json({
                    error: 'Erreur configuration JWT',
                    details: 'Fonction verify non disponible'
                });
            }
            const decoded = verifyFunction(token, process.env.JWT_SECRET || 'your-secret-key');
            console.log('✅ [Paiements Auth] Token valide pour utilisateur:', {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || decoded.status,
                tokenSource: req.cookies?.token ? 'token cookie' :
                    req.headers.authorization ? 'authorization header' :
                        'autre source'
            });
            // Ajouter les infos utilisateur à la requête
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role || decoded.status,
                status: decoded.status
            };
            next();
        }
        catch (jwtError) {
            console.error('❌ [Paiements Auth] Token invalide:', jwtError.message);
            console.error('❌ [Paiements Auth] Token source:', req.cookies?.token ? 'token cookie' : 'autre');
            return res.status(401).json({
                error: 'Token invalide ou expiré',
                message: 'Veuillez vous reconnecter',
                tokenSource: req.cookies?.token ? 'token cookie' :
                    req.headers.authorization ? 'authorization header' : 'autre source'
            });
        }
    }
    catch (error) {
        console.error('❌ [Paiements Auth] Erreur middleware auth:', error);
        return res.status(500).json({
            error: 'Erreur d\'authentification',
            details: error.message
        });
    }
};
// MODIFIÉ: Désactiver le chargement dynamique car les modules sont maintenant chargés dans index.ts
async function initializeSubModules() {
    console.log('🔄 [Paiements] Module paiements simplifié - modules chargés via index.ts');
    console.log('ℹ️ [Paiements] Les sous-modules (stripe, echeances, etc.) sont maintenant gérés au niveau serveur');
    console.log('ℹ️ [Paiements] Ce module ne charge plus de sous-modules dynamiquement');
    // AJOUTÉ: Ajouter seulement le middleware d'auth pour les routes de ce module
    router.use((req, res, next) => {
        const isHealthRoute = req.path === '/health' || req.path === '/debug/routes';
        if (isHealthRoute) {
            return next();
        }
        console.log('🔐 [Paiements] Application middleware auth pour route:', req.path);
        flexibleAuth(req, res, next);
    });
    console.log('✅ [Paiements] Module paiements principal initialisé (mode serveur-centralisé)');
}
// Routes de base pour le module paiements - CORRIGÉES
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        module: 'paiements-principal',
        architecture: 'serveur-centralisé (modules chargés dans index.ts)',
        note: 'Ce module ne charge plus de sous-modules - ils sont gérés au niveau serveur',
        expected_structure: {
            '/paiements/': 'Ce module principal (routes de base)',
            '/paiements/stripe/': 'Module Stripe (chargé via index.ts)',
            '/paiements/echeances/': 'Module échéances (chargé via index.ts)',
            '/paiements/confirmation/': 'Module confirmation (chargé via index.ts)',
            '/paiements/webhooks/': 'Module webhooks (chargé via index.ts)'
        },
        server_handles: [
            'Chargement conditionnel des modules',
            'Création de router composite si module principal indisponible',
            'Montage des routes au niveau serveur'
        ],
        routes_de_ce_module: [
            'GET /paiements/health - Statut du module principal',
            'GET /paiements/debug/routes - Debug des routes'
        ],
        timestamp: new Date().toISOString()
    });
});
// Route de debug simplifiée
router.get('/debug/routes', (req, res) => {
    res.json({
        module: 'paiements-principal',
        architecture: 'serveur-centralisé',
        message: 'Les sous-modules sont maintenant chargés dans index.ts',
        modules_attendus: {
            'routes/stripe.ts': 'Intégration Stripe',
            'routes/echeances.ts': 'Gestion échéances',
            'routes/confirmation.ts': 'Confirmation paiements',
            'routes/webhooks.ts': 'Webhooks Stripe',
            'routes/paiements-crud.ts': 'CRUD principal'
        },
        server_responsibility: 'Le serveur charge les modules individuellement et les assemble',
        fallback_strategy: 'Router composite si ce module principal échoue',
        timestamp: new Date().toISOString()
    });
});
// Initialiser (mode simplifié)
initializeSubModules().catch((error) => {
    console.error('❌ [Paiements] Erreur lors de l\'initialisation (mode simplifié):', error);
});
console.log('✅ [Paiements] Module paiements principal initialisé (serveur-centralisé)');
export default router;
