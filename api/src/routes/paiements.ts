import express, { Router } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router: Router = express.Router();

console.log('🔧 [Paiements] Initialisation du module de paiements modulaire');

// CORRIGÉ: Middleware d'authentification flexible - correction import JWT
const flexibleAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log('🔐 [Paiements Auth] Vérification authentification flexible...');
    
    // CORRIGÉ: Récupérer le token avec priorité sur cookies.token et userData.token
    let token = req.cookies?.token ||
                req.headers.authorization?.replace('Bearer ', '') ||
                req.headers.authtoken as string ||
                req.headers['x-auth-token'] as string ||
                req.cookies?.authToken;

    // AJOUTÉ: Essayer de récupérer depuis userData.token si pas trouvé
    if (!token && req.headers['user-data']) {
      try {
        const userData = JSON.parse(req.headers['user-data'] as string);
        if (userData && userData.token) {
          token = userData.token;
          console.log('🔑 [Paiements Auth] Token récupéré depuis user-data header');
        }
      } catch (parseError) {
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
      
      const decoded = verifyFunction(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      console.log('✅ [Paiements Auth] Token valide pour utilisateur:', {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || decoded.status,
        tokenSource: req.cookies?.token ? 'token cookie' :
                     req.headers.authorization ? 'authorization header' :
                     'autre source'
      });

      // Ajouter les infos utilisateur à la requête
      (req as any).user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role || decoded.status,
        status: decoded.status
      };

      next();
      
    } catch (jwtError: any) {
      console.error('❌ [Paiements Auth] Token invalide:', jwtError.message);
      console.error('❌ [Paiements Auth] Token source:', req.cookies?.token ? 'token cookie' : 'autre');
      return res.status(401).json({
        error: 'Token invalide ou expiré',
        message: 'Veuillez vous reconnecter',
        tokenSource: req.cookies?.token ? 'token cookie' :
                     req.headers.authorization ? 'authorization header' : 'autre source'
      });
    }

  } catch (error: any) {
    console.error('❌ [Paiements Auth] Erreur middleware auth:', error);
    return res.status(500).json({
      error: 'Erreur d\'authentification',
      details: error.message
    });
  }
};

// CORRIGÉ: Fonction pour charger les modules avec types appropriés
async function loadSubModule(modulePath: string, routePath: string, fallbackMessage: string): Promise<boolean> {
  try {
    const module = await import(modulePath);
    
    // CORRIGÉ: Vérification plus stricte du router
    const moduleRouter: Router | undefined = module.default;
    
    if (moduleRouter && typeof moduleRouter === 'function') {
      router.use(routePath, moduleRouter);
      console.log(`✅ [Paiements] Module ${routePath} chargé depuis ${modulePath}`);
      return true;
    } else {
      console.warn(`⚠️ [Paiements] Export par défaut invalide dans ${modulePath}`);
      console.warn(`⚠️ [Paiements] Type reçu:`, typeof moduleRouter);
      console.warn(`⚠️ [Paiements] Exports disponibles:`, Object.keys(module));
      return false;
    }
  } catch (error) {
    console.warn(`⚠️ [Paiements] Erreur chargement ${modulePath}:`, (error as Error).message);
    
    // Route de fallback avec types corrects
    router.use(routePath, (req: express.Request, res: express.Response) => {
      res.status(503).json({
        error: `Service ${routePath} temporairement indisponible`,
        message: fallbackMessage,
        timestamp: new Date().toISOString(),
        debug: {
          modulePath,
          error: (error as Error).message
        }
      });
    });
    return false;
  }
}

// MODIFIÉ: Charger les sous-modules avec le middleware d'auth
async function initializeSubModules() {
  console.log('🔄 [Paiements] Chargement des modules depuis routes/ (sans sous-dossiers)...');
  
  // ÉTAPE 1: Charger TOUS les modules spécialisés SANS middleware d'auth
  console.log('🔄 [Paiements] Chargement modules spécialisés (sans middleware auth)...');
  
  const stripeLoaded = await loadSubModule(
    './stripe.js',
    '/stripe', 
    'Le service de paiement Stripe n\'est pas disponible'
  );
  
  const echeancesLoaded = await loadSubModule(
    './echeances.js',
    '/echeances',
    'Le service de gestion des échéances n\'est pas disponible'
  );
  
  const confirmationLoaded = await loadSubModule(
    './confirmation.js',
    '/confirmation',
    'Le service de confirmation de paiement n\'est pas disponible'
  );
  
  const webhooksLoaded = await loadSubModule(
    './webhooks.js',
    '/webhooks',
    'Le service de webhooks de paiement n\'est pas disponible'
  );
  
  console.log('✅ [Paiements] Modules spécialisés chargés:', {
    stripe: stripeLoaded,
    echeances: echeancesLoaded,
    confirmation: confirmationLoaded,
    webhooks: webhooksLoaded
  });
  
  // ÉTAPE 2: Ajouter le middleware d'auth SEULEMENT pour les routes CRUD
  console.log('🔐 [Paiements] Ajout middleware auth conditionnel...');
  
  router.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const isSpecializedRoute = req.path.startsWith('/stripe') || 
                              req.path.startsWith('/echeances') || 
                              req.path.startsWith('/confirmation') || 
                              req.path.startsWith('/webhooks') ||
                              req.path === '/health' || 
                              req.path === '/debug/routes' ||
                              req.path.startsWith('/test');
    
    console.log('🔍 [Paiements Auth Check]:', {
      path: req.path,
      method: req.method,
      isSpecializedRoute,
      skipAuth: isSpecializedRoute
    });
    
    if (isSpecializedRoute) {
      console.log('⏭️ [Paiements Auth] Route spécialisée - pas d\'auth requise');
      return next();
    }
    
    console.log('🔐 [Paiements Auth] Route CRUD - auth requise');
    flexibleAuth(req, res, next);
  });
  
  console.log('✅ [Paiements] Middleware d\'authentification conditionnel ajouté');
  
  // ÉTAPE 3: Charger le module CRUD à la racine APRÈS le middleware
  console.log('🔄 [Paiements] Chargement module CRUD principal à la racine (avec auth)...');
  
  const crudLoaded = await loadSubModule(
    './paiements-crud.js',
    '/',
    'Le service CRUD des paiements n\'est pas disponible'
  );
  
  if (!crudLoaded) {
    console.error('❌ [Paiements] CRITIQUE: Module CRUD principal non chargé');
    
    // Route de fallback pour le CRUD uniquement
    router.use('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Laisser passer les routes spécialisées
      if (req.path.startsWith('/stripe') || req.path.startsWith('/echeances') || 
          req.path.startsWith('/confirmation') || req.path.startsWith('/webhooks') ||
          req.path === '/health' || req.path === '/debug/routes' || req.path.startsWith('/test')) {
        return next();
      }
      
      console.error(`❌ [Paiements] Route CRUD non disponible: ${req.method} ${req.path}`);
      res.status(503).json({
        success: false,
        error: 'Service CRUD des paiements temporairement indisponible',
        message: 'Le module paiements-crud.ts n\'a pas pu être chargé',
        details: {
          method: req.method,
          path: req.path,
          expectedFile: 'routes/paiements-crud.ts',
          suggestion: 'Vérifiez que le fichier paiements-crud.ts existe dans routes/',
          availableModules: {
            stripe: stripeLoaded,
            echeances: echeancesLoaded,
            confirmation: confirmationLoaded,
            webhooks: webhooksLoaded
          }
        },
        timestamp: new Date().toISOString()
      });
    });
  } else {
    console.log('✅ [Paiements] Module CRUD principal chargé à la racine avec succès');
  }
  
  console.log('✅ [Paiements] Initialisation complète - architecture modulaire opérationnelle');
}

// CORRIGÉ: Routes de base SANS middleware d'auth (pour health et debug)
router.get('/health', (req: express.Request, res: express.Response) => {
  res.json({
    status: 'healthy',
    module: 'paiements',
    architecture: 'modulaire (routes/ directement)',
    submodules: {
      root: 'CRUD principal des paiements (GET, POST, PUT, DELETE) - à la racine',
      stripe: 'Intégration Stripe (PaymentIntents, méthodes alternatives)', 
      echeances: 'Gestion complète des échéances',
      confirmation: 'Confirmation paiements avec promotion automatique',
      webhooks: 'Webhooks Stripe pour événements'
    },
    routes: [
      'GET /paiements/health - Statut du module',
      'GET /paiements/ - Tous les paiements avec filtres (CRUD)',
      'POST /paiements/ - Créer un nouveau paiement (CRUD)',
      'GET /paiements/:id - Paiement spécifique (CRUD)',
      'PUT /paiements/:id - Modifier un paiement (CRUD)',
      'DELETE /paiements/:id - Supprimer un paiement (CRUD)',
      'GET /paiements/utilisateur/:userId - Paiements par utilisateur (CRUD)',
      'POST /paiements/stripe/create-payment-intent - PaymentIntent échéance',
      'POST /paiements/stripe/create-payment-intent-commande - PaymentIntent commande',
      'POST /paiements/stripe/confirm-payment - Confirmation paiement',
      'POST /paiements/stripe/bancontact - Paiement Bancontact',
      'GET /paiements/echeances/:userId - Échéances utilisateur',
      'GET /paiements/echeances/detail/:echeanceId - Détail échéance sécurisé',
      'POST /paiements/confirmation/confirm-payment - Confirmation échéance',
      'POST /paiements/confirmation/confirm-payment-commande - Confirmation commande',
      'POST /paiements/webhooks/stripe - Webhook principal'
    ],
    source_files: [
      'routes/paiements-crud.ts - CRUD principal (racine)',
      'routes/stripe.ts - Intégration Stripe', 
      'routes/echeances.ts - Gestion échéances',
      'routes/confirmation.ts - Confirmation paiements',
      'routes/webhooks.ts - Webhooks Stripe'
    ],
    note: 'Architecture plate - modules spécialisés chargés AVANT middleware auth, CRUD à la racine APRÈS',
    middleware_order: [
      '1. Routes spécialisées (stripe, echeances, confirmation, webhooks)',
      '2. Middleware auth conditionnel (seulement pour CRUD)',
      '3. Routes CRUD à la racine'
    ],
    timestamp: new Date().toISOString()
  });
});

// Route de debug avec types corrects
router.get('/debug/routes', (req: express.Request, res: express.Response) => {
  const routes: any[] = [];
  
  function extractRoutes(stack: any[], prefix = '') {
    stack.forEach((layer) => {
      if (layer.route) {
        const path = prefix + layer.route.path;
        const methods = Object.keys(layer.route.methods);
        routes.push({ path, methods, type: 'direct' });
      } else if (layer.name === 'router' && layer.regexp) {
        const match = layer.regexp.source.match(/\^\\(.*?)\\\//);
        const subPrefix = match ? match[1].replace(/\\\//g, '/') : '';
        if (layer.handle && layer.handle.stack) {
          extractRoutes(layer.handle.stack, prefix + subPrefix);
        }
      }
    });
  }
  
  extractRoutes(router.stack, '/paiements');
  
  res.json({
    totalRoutes: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
    modules: {
      crud: 'CRUD principal depuis routes/paiements-crud.ts',
      stripe: 'Intégration Stripe depuis routes/stripe.ts',
      echeances: 'Gestion échéances depuis routes/echeances.ts', 
      confirmation: 'Confirmation paiements depuis routes/confirmation.ts',
      webhooks: 'Webhooks Stripe depuis routes/webhooks.ts'
    },
    architecture: 'modulaire sans sous-dossiers (routes/ directement)',
    expected_files: [
      'routes/paiements-crud.ts',
      'routes/stripe.ts',
      'routes/echeances.ts', 
      'routes/confirmation.ts',
      'routes/webhooks.ts'
    ],
    timestamp: new Date().toISOString()
  });
});

// Initialiser les modules
initializeSubModules().catch((error) => {
  console.error('❌ [Paiements] Erreur lors de l\'initialisation des modules:', error);
});

console.log('✅ [Paiements] Module paiements principal initialisé (architecture plate)');

export default router;