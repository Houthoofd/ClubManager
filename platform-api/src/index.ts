import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import { Router } from 'express';

// CORRIGÉ: Chargement du .env avec priorité sur NODE_ENV
const nodeEnv = process.env.NODE_ENV || 'development';
console.log(`🔧 [Server] Environnement détecté: ${nodeEnv}`);

// Charger le fichier .env approprié selon l'environnement
let envPath;
if (nodeEnv === 'production') {
  envPath = path.resolve(process.cwd(), '.env.production');
} else {
  envPath = path.resolve(process.cwd(), '.env.development');
}

// Fallback vers .env générique si le fichier spécifique n'existe pas
if (!fs.existsSync(envPath)) {
  envPath = path.resolve(process.cwd(), '.env');
  console.log(`⚠️ [Server] Fichier .env.${nodeEnv} non trouvé, utilisation de .env générique`);
}

console.log(`📁 [Server] Chargement fichier .env: ${envPath}`);
dotenv.config({ path: envPath });

// AJOUTÉ: Debug des variables d'environnement CORS
console.log('🌐 [Server] Configuration CORS - Variables d\'environnement:');
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || 'NON DÉFINIE');
console.log('  FRONTEND_URL_ALT:', process.env.FRONTEND_URL_ALT || 'NON DÉFINIE');
console.log('  FRONTEND_URL_LOCAL:', process.env.FRONTEND_URL_LOCAL || 'NON DÉFINIE');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'NON DÉFINIE');

console.log(process.env.STRIPE_SECRET_KEY)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, 'public');
console.log("Chemin du dossier public :", publicPath);

const app = express();

async function startServer() {
  try {
    console.log('🚀 [Server] Démarrage du serveur Club Manager...');
    
    // 1. Initialiser la base de données en premier
    console.log('🔄 [Server] Initialisation de la base de données...');
    const { default: MysqlConnector } = await import('./db/connector/mysqlconnector.js');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // Attendre que la DB soit prête avec retry
    let dbReady = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    while (!dbReady && attempts < maxAttempts) {
      try {
        await new Promise((resolve, reject) => {
          mysqlConnector.query('SELECT 1 as db_ready', [], (error: any, results: any) => {
            if (error) {
              reject(error);
            } else {
              console.log('✅ [Server] Base de données prête');
              resolve(results);
            }
          });
        });
        dbReady = true;
      } catch (error) {
        attempts++;
        console.log(`⏳ [Server] Tentative DB ${attempts}/${maxAttempts}...`);
        if (attempts >= maxAttempts) {
          throw new Error(`Base de données non disponible après ${maxAttempts} tentatives`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 2. Initialiser et vérifier SendGrid
    console.log('🔄 [Server] Vérification de la configuration SendGrid...');
    try {
      const { EmailClient } = await import('./clients/emailClient.js');
      const emailClient = new EmailClient();
      console.log('✅ [Server] EmailClient prêt');
    } catch (emailError) {
      console.warn('⚠️ [Server] Erreur lors de l\'initialisation EmailClient:', emailError);
      console.warn('⚠️ [Server] Le serveur continuera sans les services email optimaux');
    }
    
    // 3. Initialiser les services email après la DB
    console.log('🔄 [Server] Initialisation des services email...');
    try {
      // AJOUTÉ: Importer et initialiser EmailValidationService
      console.log('📧 [Server] EmailValidationService remplacé par EmailClient - pas d\'initialisation requise');
      
      // AJOUTÉ: Importer EmailClient comme service secondaire
      const { emailClient } = await import('./clients/emailClient.js');
      await emailClient.initializeAndVerify();
      console.log('✅ [Server] EmailClient singleton initialisé');
      
      // Initialiser messageClient comme avant
      const { messageClient } = await import('./db/clients/messagerie/messageClient.js');
      await messageClient.initialiser();
      console.log('✅ [Server] MessageClient initialisé');
      
      console.log('✅ [Server] Services email initialisés (EmailValidationService + EmailClient + MessageClient)');
      
    } catch (emailError) {
      console.warn('⚠️ [Server] Services email non disponibles:', emailError);
      console.warn('⚠️ [Server] Le serveur continuera sans les services email');
    }
    
    // AJOUTÉ: 4. Diagnostic Stripe après l'initialisation des services
    console.log('🔄 [Server] Diagnostic Stripe au démarrage...');
    try {
      // Import dynamique du module paiements pour accéder au diagnostic
      const paiementModule = await import('./routes/paiements.js');
      
      // Fonction de diagnostic Stripe interne
      const diagnosticStripe = async () => {
        const diagnostic = {
          timestamp: new Date().toISOString(),
          backend: {
            stripe_initialized: false,
            secret_key: {
              exists: !!process.env.STRIPE_SECRET_KEY,
              format: process.env.STRIPE_SECRET_KEY ? 
                (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' :
                 process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'INVALID') : 'MISSING',
              account_id: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(8, 23) : 'N/A',
              length: process.env.STRIPE_SECRET_KEY?.length || 0
            },
            public_key: {
              exists: !!process.env.STRIPE_PUBLIC_KEY,
              value: process.env.STRIPE_PUBLIC_KEY || 'MISSING',
              format: process.env.STRIPE_PUBLIC_KEY ? 
                (process.env.STRIPE_PUBLIC_KEY.startsWith('pk_test_') ? 'TEST' :
                 process.env.STRIPE_PUBLIC_KEY.startsWith('pk_live_') ? 'LIVE' : 'INVALID') : 'MISSING',
              account_id: process.env.STRIPE_PUBLIC_KEY ? process.env.STRIPE_PUBLIC_KEY.substring(8, 23) : 'N/A'
            }
          },
          compatibility: {
            keys_from_same_account: false,
            both_test_mode: false,
            both_live_mode: false,
            account_match: false
          },
          stripe_api_test: {
            attempted: false,
            success: false,
            error: null as any // CORRIGÉ: Permettre any type pour l'erreur
          }
        };

        // Vérification de compatibilité des clés
        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLIC_KEY) {
          const secretAccount = process.env.STRIPE_SECRET_KEY.substring(8, 23);
          const publicAccount = process.env.STRIPE_PUBLIC_KEY.substring(8, 23);
          
          diagnostic.compatibility.account_match = secretAccount === publicAccount;
          diagnostic.compatibility.keys_from_same_account = secretAccount === publicAccount;
          diagnostic.compatibility.both_test_mode = 
            process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && 
            process.env.STRIPE_PUBLIC_KEY.startsWith('pk_test_');
          diagnostic.compatibility.both_live_mode = 
            process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') && 
            process.env.STRIPE_PUBLIC_KEY.startsWith('pk_live_');
        }

        // Test de l'API Stripe si possible
        if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
          try {
            const Stripe = (await import('stripe')).default;
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
              apiVersion: '2025-02-24.acacia',
            });
            
            diagnostic.stripe_api_test.attempted = true;
            diagnostic.backend.stripe_initialized = true;
            
            // Test simple : récupérer le compte
            const account = await stripe.accounts.retrieve();
            
            diagnostic.stripe_api_test.success = true;
            console.log('✅ [Server] API Stripe accessible:', account.id);
            
          } catch (stripeError: any) {
            console.error('❌ [Server] Erreur API Stripe:', stripeError.message);
            diagnostic.stripe_api_test.success = false;
            diagnostic.stripe_api_test.error = {
              type: stripeError.type,
              code: stripeError.code,
              message: stripeError.message
            };
          }
        }

        return diagnostic;
      };

      const stripeDiagnostic = await diagnosticStripe();
      
      // Analyse et affichage des résultats
      const isFullyOperational = 
        stripeDiagnostic.backend.stripe_initialized &&
        stripeDiagnostic.backend.secret_key.exists &&
        stripeDiagnostic.compatibility.account_match &&
        (stripeDiagnostic.compatibility.both_test_mode || stripeDiagnostic.compatibility.both_live_mode) &&
        stripeDiagnostic.stripe_api_test.success;

      console.log('💳 [Server] === DIAGNOSTIC STRIPE DÉMARRAGE ===');
      console.log(`💳 [Server] Status global: ${isFullyOperational ? '✅ OPÉRATIONNEL' : '❌ PROBLÈME DÉTECTÉ'}`);
      console.log(`💳 [Server] Clé secrète: ${stripeDiagnostic.backend.secret_key.exists ? '✅' : '❌'} ${stripeDiagnostic.backend.secret_key.format} (${stripeDiagnostic.backend.secret_key.account_id})`);
      console.log(`💳 [Server] Clé publique: ${stripeDiagnostic.backend.public_key.exists ? '✅' : '❌'} ${stripeDiagnostic.backend.public_key.format} (${stripeDiagnostic.backend.public_key.account_id})`);
      console.log(`💳 [Server] Compatibilité: ${stripeDiagnostic.compatibility.account_match ? '✅ Comptes identiques' : '❌ Comptes différents'}`);
      console.log(`💳 [Server] API Stripe: ${stripeDiagnostic.stripe_api_test.success ? '✅ Accessible' : '❌ Inaccessible'}`);
      
      if (stripeDiagnostic.backend.public_key.exists) {
        const expectedFrontendKey = process.env.STRIPE_SECRET_KEY ? 
          `pk_${process.env.STRIPE_SECRET_KEY.substring(3)}` : 'N/A';
        console.log(`💳 [Server] Clé frontend attendue: ${expectedFrontendKey.substring(0, 25)}...`);
        console.log(`💳 [Server] Clé backend publique: ${stripeDiagnostic.backend.public_key.value.substring(0, 25)}...`);
        console.log(`💳 [Server] Correspondance: ${stripeDiagnostic.backend.public_key.value === expectedFrontendKey ? '✅ OUI' : '❌ NON'}`);
      }

      if (!isFullyOperational) {
        console.log('💳 [Server] ⚠️ RECOMMANDATIONS:');
        if (!stripeDiagnostic.backend.stripe_initialized) {
          console.log('💳 [Server]   - Vérifiez la variable STRIPE_SECRET_KEY dans .env');
        }
        if (!stripeDiagnostic.backend.secret_key.exists) {
          console.log('💳 [Server]   - Ajoutez STRIPE_SECRET_KEY dans votre fichier .env');
        }
        if (!stripeDiagnostic.compatibility.account_match) {
          console.log('💳 [Server]   - Assurez-vous que les clés publique/secrète proviennent du même compte Stripe');
        }
        if (!stripeDiagnostic.stripe_api_test.success && stripeDiagnostic.stripe_api_test.attempted) {
          console.log(`💳 [Server]   - Problème API Stripe: ${stripeDiagnostic.stripe_api_test.error}`);
        }
      }
      
      console.log('💳 [Server] === FIN DIAGNOSTIC STRIPE ===');

      // CRITIQUE: Arrêter le serveur si Stripe n'est pas opérationnel en production
      if (!isFullyOperational && process.env.NODE_ENV === 'production') {
        console.error('❌ [Server] ERREUR CRITIQUE: Stripe non opérationnel en production !');
        console.error('❌ [Server] Le serveur ne peut pas démarrer sans une configuration Stripe valide.');
        console.error('❌ [Server] Veuillez corriger la configuration et redémarrer.');
        process.exit(1);
      } else if (!isFullyOperational) {
        console.warn('⚠️ [Server] Stripe non opérationnel en développement - le serveur continue mais les paiements ne fonctionneront pas.');
      }

    } catch (diagnosticError) {
      console.error('❌ [Server] Erreur lors du diagnostic Stripe:', diagnosticError);
      console.warn('⚠️ [Server] Le serveur continue sans validation Stripe');
    }
    
    // 5. Configuration de l'application Express
    app.use(express.json());

    // SUPPRIMÉ: Middleware spécial pour les webhooks Stripe - causait l'erreur express.raw is not a function
    // app.use('/paiements/webhooks/stripe', express.raw({type: 'application/json'}));

    // Configuration CORS
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_ALT,
      process.env.FRONTEND_URL_LOCAL,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      // AJOUTÉ: Domaines de production supplémentaires
      'https://clubmanagment.com',
      'https://www.clubmanagment.com',
      'http://clubmanagment.com',
      'http://www.clubmanagment.com',
      // AJOUTÉ: Domaines avec différentes variantes
      'https://clubmanagement.com',
      'https://www.clubmanagement.com',
      'http://clubmanagement.com',
      'http://www.clubmanagement.com'
    ].filter(Boolean) as string[];

    console.log('🌐 [Server] Origins autorisées CORS:', allowedOrigins);

    const corsOptions = {
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // MODIFIÉ: Permettre les requêtes sans origin (Postman, apps mobiles, etc.)
        if (!origin) {
          console.log('🔓 [CORS] Requête sans origin autorisée (Postman, mobile, etc.)');
          return callback(null, true);
        }
        
        // Vérifier si l'origin est dans la liste autorisée
        if (allowedOrigins.includes(origin)) {
          console.log('✅ [CORS] Origin autorisée:', origin);
          callback(null, true);
        } else {
          console.error('❌ [CORS] Origin non autorisée:', origin);
          console.error('❌ [CORS] Origins autorisées:', allowedOrigins);
          
          // TEMPORAIRE: En développement, autoriser tous les origins pour debug
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [CORS] Mode développement - autorisation temporaire de:', origin);
            callback(null, true);
          } else {
            // En production, appliquer strictement les règles CORS
            callback(new Error('Not allowed by CORS'), false);
          }
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Auth-Token',
        'AuthToken'
      ],
      credentials: true,
      optionsSuccessStatus: 200, // Pour les navigateurs legacy
      preflightContinue: false
    };

    // AJOUTÉ: Middleware de debug CORS
    app.use((req, res, next) => {
      if (req.method === 'OPTIONS') {
        console.log('🔍 [CORS DEBUG] Preflight request:', {
          origin: req.headers.origin,
          method: req.headers['access-control-request-method'],
          headers: req.headers['access-control-request-headers'],
          path: req.path
        });
      }
      next();
    });

    app.use(cors(corsOptions));
    app.use(logger('dev'));
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    // Servir les fichiers statiques
    app.use('/public', express.static(path.join(__dirname, '../public')));
    app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

    // 4. Charger les routes après l'initialisation DB avec imports conditionnels
    const { default: indexRouter } = await import('./routes/index.js');
    const { default: utilisateursRouter } = await import('./routes/utilisateurs.js');
    const { default: informationsRouter } = await import('./routes/informations.js');
    const { default: coursRouter } = await import('./routes/cours.js');
    const { default: compteRouter } = await import('./routes/compte.js');
    
    // SIMPLIFIÉ: Charger seulement le module paiements principal sans modules individuels
    console.log('🔄 [Server] Chargement du module paiements principal...');
    let paiementRouter: Router | null = null;
    try {
      const paiementModule = await import('./routes/paiements.js');
      paiementRouter = paiementModule.default;
      if (!paiementRouter) {
        throw new Error('Aucun export par défaut dans le module paiements');
      }
      console.log('✅ [Server] Module paiements principal chargé avec succès');
    } catch (error) {
      console.error('❌ [Server] Erreur critique lors du chargement du module paiements:', error);
      
      // FALLBACK: Créer une route de fallback basique
      paiementRouter = express.Router();
      paiementRouter.get('/health', (req, res) => {
        res.status(503).json({
          status: 'unhealthy',
          module: 'paiements-fallback',
          error: 'Module paiements principal non disponible',
          details: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      });
      
      paiementRouter.use('*', (req, res) => {
        res.status(503).json({
          error: 'Service paiements temporairement indisponible',
          message: 'Le module paiements n\'a pas pu être chargé',
          details: (error as Error).message,
          timestamp: new Date().toISOString()
        });
      });
    }
    
    const { default: statistiquesRouter } = await import('./routes/statistiques.js');
    const { default: magasinRouter } = await import('./routes/magasin.js');
    const { default: professeursRouter } = await import('./routes/professeurs.js');
    const { default: messagesRouter } = await import('./routes/messages.js');
    const { default: uploadRouter } = await import('./routes/upload.js');
    const { default: inscriptionRouter } = await import('./routes/inscription.js');
    const { default: verificationRouter } = await import('./routes/verification.js');
    const { default: authRouter } = await import('./routes/auth.js');
    
    // CORRIGÉ: Import conditionnel pour les autres modules
    let commandesRouter = null;
    let stocksRouter = null;
    // SUPPRIMÉ: Variables echeancesRouter et webhooksRouter car intégrés dans le module paiements
    
    try {
      const commandesModule = await import('./routes/commandes.js');
      commandesRouter = commandesModule.default;
      console.log('✅ [Server] Module commandes chargé');
    } catch (error) {
      console.warn('⚠️ [Server] Module commandes non disponible:', error);
    }
    
    try {
      const stocksModule = await import('./routes/stocks.js');
      stocksRouter = stocksModule.default;
      console.log('✅ [Server] Module stocks chargé');
    } catch (error) {
      console.warn('⚠️ [Server] Module stocks non disponible:', error);
    }

    // SUPPRIMÉ: Import des modules echeances et webhooks standalone car intégrés dans paiements
    console.log('ℹ️ [Server] Modules échéances et webhooks intégrés dans le module paiements unifié');

    // Routes principales (API) - CRITIQUE: Module paiements en priorité
    app.use('/auth', authRouter);
    app.use('/email', messagesRouter);
    app.use('/', indexRouter);
    app.use('/utilisateurs', utilisateursRouter);
    app.use('/informations', informationsRouter);
    app.use('/cours', coursRouter);
    app.use('/compte', compteRouter);
    
    // CRITIQUE: Monter le module paiements AVEC validation correcte
    if (paiementRouter !== null) {
      console.log('🔧 [Server] Montage du module paiements...');
      app.use('/paiements', paiementRouter);
      console.log('✅ [Server] Module paiements monté → /paiements/');
      console.log('  → /paiements/ (CRUD principal - racine)');
      console.log('  → /paiements/stripe/ (Intégration Stripe)'); 
      console.log('  → /paiements/echeances/ (Gestion échéances)');
      console.log('  → /paiements/confirmation/ (Confirmation paiements)');
      console.log('  → /paiements/webhooks/ (Webhooks Stripe)');
    } else {
      console.error('❌ [Server] CRITIQUE: Module paiements non disponible - création fallback');
      
      // Route de fallback pour les paiements
      app.use('/paiements', (req, res) => {
        res.status(503).json({
          error: 'Service paiements temporairement indisponible',
          message: 'Le module paiements n\'a pas pu être chargé',
          timestamp: new Date().toISOString()
        });
      });
    }
    
    app.use('/magasin', magasinRouter);
    app.use('/professeurs', professeursRouter);
    app.use('/messages', messagesRouter);
    app.use('/upload', uploadRouter);
    app.use('/inscription', inscriptionRouter);
    app.use('/verification', verificationRouter);
    app.use('/statistiques', statistiquesRouter);
    
    // MODIFIÉ: Simplifier car échéances et webhooks sont maintenant intégrés dans le module paiements
    console.log('ℹ️ [Server] Échéances gérées via /paiements/echeances/');
    console.log('ℹ️ [Server] Webhooks gérés via /paiements/webhooks/');
    
    if (commandesRouter) {
      app.use('/commandes', commandesRouter);
      console.log('✅ [Server] Route commandes montée');
    } else {
      app.use('/commandes', (req, res) => {
        res.status(503).json({
          error: 'Service commandes temporairement indisponible',
          message: 'Le module commandes n\'est pas disponible'
        });
      });
      console.log('⚠️ [Server] Route commandes en mode fallback');
    }
    
    if (stocksRouter) {
      app.use('/stocks', stocksRouter);
      console.log('✅ [Server] Route stocks montée');
    } else {
      app.use('/stocks', (req, res) => {
        res.status(503).json({
          error: 'Service stocks temporairement indisponible',
          message: 'Le module stocks n\'est pas disponible'
        });
      });
      console.log('⚠️ [Server] Route stocks en mode fallback');
    }

    // MODIFIÉ: Servir le build React en production ET développement si les fichiers existent
    const frontendPath = path.join(__dirname, '../../../front-end/dist');
    const nginxFrontendPath = '/usr/share/nginx/html/clubmanager';
    
    // Vérifier quel chemin utiliser
    let staticPath = null;
    if (fs.existsSync(frontendPath)) {
      staticPath = frontendPath;
      console.log('📂 [Server] Frontend servi depuis:', frontendPath);
    } else if (fs.existsSync(nginxFrontendPath)) {
      staticPath = nginxFrontendPath;
      console.log('📂 [Server] Frontend servi depuis nginx:', nginxFrontendPath);
    }

    if (staticPath) {
      // Servir les fichiers statiques du build React
      app.use(express.static(staticPath));
      
      // SPA fallback - rediriger toutes les routes vers index.html
      app.get('*', (req, res) => {
        // CORRIGÉ: Liste complète des routes API à exclure du SPA routing
        const apiRoutes = [
          '/api/', '/auth/', '/health/', '/public/', '/uploads/',
          '/paiements/', '/utilisateurs/', '/cours/', '/magasin/',
          '/messages/', '/compte/', '/professeurs/', '/statistiques/',
          '/inscription/', '/verification/', '/informations/', '/upload/',
          '/webhooks/', '/commandes/', '/stocks/', '/echeances/', '/test-'
        ];

        if (apiRoutes.some(route => req.path.startsWith(route))) {
          return res.status(404).json({ 
            error: 'Route API non trouvée',
            path: req.path,
            method: req.method,
            availableRoutes: [
              '/auth/status',
              '/auth/login', 
              '/auth/logout',
              '/paiements/health',
              '/paiements/echeances/:userId',
              '/paiements/stripe/create-payment-intent',
              '/paiements/stripe/confirm-payment',
              '/paiements/confirmation/confirm-payment',
              '/paiements/webhooks/stripe',
              '/utilisateurs/:id',
              '/cours',
              '/magasin/articles',
              '/health/database',
              '/health/email'
            ],
            debug: {
              paymentsModuleStructure: {
                '/paiements/': 'Module principal (CRUD)',
                '/paiements/stripe/': 'Intégration Stripe',
                '/paiements/echeances/': 'Gestion échéances',
                '/paiements/confirmation/': 'Confirmation paiements',
                '/paiements/webhooks/': 'Webhooks Stripe'
              }
            }
          });
        }
        
        res.sendFile(path.join(staticPath, 'index.html'));
      });
      
      console.log('✅ [Server] Frontend React configuré avec SPA routing et paiements modulaires');
    } else {
      console.warn('⚠️ [Server] Aucun build frontend trouvé - API seulement');
      
      // CORRIGÉ: Même logique pour mode API seulement
      app.get('*', (req, res) => {
        const apiRoutes = [
          '/api/', '/auth/', '/health/', '/paiements/',
          '/utilisateurs/', '/cours/', '/magasin/', '/messages/',
          '/compte/', '/professeurs/', '/statistiques/', '/inscription/',
          '/verification/', '/informations/', '/upload/', '/webhooks/',
          '/commandes/', '/stocks/', '/echeances/', '/test-'
        ];

        if (apiRoutes.some(route => req.path.startsWith(route))) {
          return res.status(404).json({ 
            error: 'Route API non trouvée',
            path: req.path,
            method: req.method,
            debug: {
              expectedRoute: req.path,
              method: req.method,
              isPaymentsRoute: req.path.startsWith('/paiements/'),
              paymentsSubmodule: req.path.startsWith('/paiements/stripe/') ? 'stripe' :
                                req.path.startsWith('/paiements/echeances/') ? 'echeances' :
                                req.path.startsWith('/paiements/confirmation/') ? 'confirmation' :
                                req.path.startsWith('/paiements/webhooks/') ? 'webhooks' : 'main',
              timestamp: new Date().toISOString()
            },
            availableRoutes: [
              '/auth/status',
              '/paiements/health',
              '/paiements/echeances/:userId',
              '/paiements/stripe/create-payment-intent',
              '/paiements/stripe/confirm-payment',
              '/paiements/confirmation/confirm-payment',
              '/utilisateurs/:id',
              '/health/database'
            ]
          });
        }
        
        res.status(404).json({
          error: 'Frontend non disponible',
          message: 'Ce serveur fonctionne en mode API seulement',
          requestedPath: req.path,
          paymentsModuleInfo: {
            structure: 'Modulaire avec sous-modules',
            mainRoute: '/paiements/',
            submodules: ['stripe', 'echeances', 'confirmation', 'webhooks'],
            healthCheck: '/paiements/health'
          },
          suggestion: 'Utilisez les routes API directement ou vérifiez que le frontend est déployé'
        });
      });
    }

    // 5. Routes de santé
    app.get('/health/database', (req, res) => {
      try {
        const status = mysqlConnector.getPoolStatus();
        res.json({
          status: 'healthy',
          database: status
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: (error as Error).message
        });
      }
    });

    app.get('/health/email', async (req, res) => {
      try {
        const emailConfigured = !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
        
        if (!emailConfigured) {
          return res.status(500).json({
            status: 'unhealthy',
            email: {
              configured: false,
              error: 'Variables SENDGRID_API_KEY et/ou SENDGRID_FROM_EMAIL manquantes'
            }
          });
        }

        // Test de configuration email (non bloquant)
        try {
          const { EmailService } = await import('./services/emailService.js');
          const emailService = new EmailService();
          const testResult = await emailService.testerConfiguration();
          
          res.json({
            status: testResult.success ? 'healthy' : 'unhealthy',
            email: {
              configured: emailConfigured,
              testResult: testResult.success ? 'Configuration valide' : testResult.details
            }
          });
        } catch (emailError) {
          res.json({
            status: 'partial',
            email: {
              configured: emailConfigured,
              warning: 'Service email non initialisé mais configuration présente'
            }
          });
        }
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: (error as Error).message
        });
      }
    });

    // 6. Démarrer le serveur avec résumé final
    const server = http.createServer(app);
    
    // Socket.io
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
      }
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`✅ [Server] Serveur démarré sur le port ${PORT}`);
      console.log(`🌐 [Server] API disponible sur http://localhost:${PORT}`);
      
      // AJOUTÉ: Résumé final Stripe
      console.log('💳 [Server] === RÉSUMÉ STRIPE ===');
      if (process.env.STRIPE_SECRET_KEY) {
        const stripeType = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
        const stripeAccount = process.env.STRIPE_SECRET_KEY.substring(8, 23);
        console.log(`💳 [Server] Mode Stripe: ${stripeType}`);
        console.log(`💳 [Server] Compte: ${stripeAccount}`);
        console.log(`💳 [Server] Diagnostic: http://localhost:${PORT}/paiements/stripe/diagnostic`);
        console.log(`💳 [Server] Test compatibilité: POST http://localhost:${PORT}/paiements/stripe/test-compatibility`);
      } else {
        console.log(`💳 [Server] ❌ Stripe non configuré`);
      }
      
      // AMÉLIORÉ: Logging conditionnel pour les paiements
      if (paiementRouter !== null) {
        console.log(`💳 [Server] Module paiements: http://localhost:${PORT}/paiements/`);
        console.log('🏗️ [Server] Structure module paiements:');
        console.log('  📂 /paiements/ → CRUD principal (racine)');
        console.log('  📂 /paiements/stripe/ → Intégration Stripe');
        console.log('  📂 /paiements/echeances/ → Gestion échéances');
        console.log('  📂 /paiements/confirmation/ → Confirmation paiements');
        console.log('  📂 /paiements/webhooks/ → Webhooks Stripe');
        console.log('  🔍 /paiements/health → Statut du module');
      } else {
        console.log('❌ [Server] Module paiements: INDISPONIBLE');
      }
      
      console.log(`📊 [Server] Environnement : ${process.env.NODE_ENV || 'development'}`);
      console.log(`📧 [Server] SendGrid: ${process.env.SENDGRID_API_KEY ? 'Configuré' : 'Non configuré'}`);
      console.log(`💾 [Server] Base de données: ${process.env.DB_NAME || 'clubmanager'}`);
      
      // AJOUTÉ: Log de la structure des paiements
      console.log('🏗️ [Server] Structure module paiements:');
      console.log('  📂 /paiements/ → CRUD principal (racine)');
      console.log('  📂 /paiements/stripe/ → Intégration Stripe');
      console.log('  📂 /paiements/echeances/ → Gestion échéances');
      console.log('  📂 /paiements/confirmation/ → Confirmation paiements');
      console.log('  📂 /paiements/webhooks/ → Webhooks Stripe');
      console.log('  🔍 /paiements/health → Statut du module');
      
      // Setup graceful shutdown SEULEMENT après le démarrage réussi
      mysqlConnector.setupGracefulShutdown();
    });

    // Gestion propre de l'arrêt du serveur
    process.on('SIGTERM', () => {
      console.log('🛑 [Server] SIGTERM reçu, arrêt du serveur...');
      server.close(() => {
        console.log('✅ [Server] Serveur arrêté proprement');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('🛑 [Server] SIGINT reçu, arrêt du serveur...');
      server.close(() => {
        console.log('✅ [Server] Serveur arrêté proprement');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ [Server] Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer().catch((error) => {
  console.error('❌ [Server] Erreur fatale:', error);
  process.exit(1);
});

export default app;