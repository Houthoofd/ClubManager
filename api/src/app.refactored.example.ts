/**
 * Exemple d'application Express avec le module User refactoré
 *
 * Ce fichier démontre comment intégrer la nouvelle architecture
 * dans l'application Express existante.
 *
 * Pour l'utiliser :
 * 1. Remplacer progressivement les anciennes routes par les nouvelles
 * 2. Tester chaque module refactoré individuellement
 * 3. Garder les anciennes routes en parallèle pendant la migration
 */

import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import MysqlConnector from './db/connector/mysqlconnector.js';

// Import du container et des composants refactorés
import { container } from './container.js';
import { createUserRoutes } from './presentation/http/routes/users.routes.js';
import {
  errorMiddleware,
  notFoundMiddleware,
  setupUncaughtErrorHandlers,
} from './presentation/http/middlewares/error.middleware.js';

// Charger les variables d'environnement
dotenv.config();

/**
 * Classe principale de l'application
 */
class App {
  public app: Application;
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.app = express();
    this.mysqlConnector = MysqlConnector.getInstance();

    this.setupGlobalErrorHandlers();
    this.initializeMiddlewares();
  }

  /**
   * Configure les gestionnaires d'erreurs globaux
   */
  private setupGlobalErrorHandlers(): void {
    setupUncaughtErrorHandlers();
  }

  /**
   * Initialise les middlewares de base
   */
  private initializeMiddlewares(): void {
    // CORS
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging simple
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Initialise toutes les routes de l'application
   */
  private initializeRoutes(): void {
    // ==================== ROUTES DE SANTÉ ====================
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      });
    });

    // Health check de la base de données
    this.app.get('/health/database', (req, res) => {
      try {
        const status = this.mysqlConnector.getPoolStatus();
        res.json({
          status: 'healthy',
          database: status,
        });
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: (error as Error).message,
        });
      }
    });

    // ==================== ROUTES REFACTORÉES ====================

    /**
     * Module User (nouvelle architecture)
     *
     * Avantages de cette approche :
     * - Logique métier testable sans DB
     * - Code découplé et maintenable
     * - Facile d'ajouter de nouvelles fonctionnalités
     */
    const userController = container.userController;
    const userRoutes = createUserRoutes(userController);
    this.app.use('/api/v2/users', userRoutes);

    // ==================== ANCIENNES ROUTES ====================
    // Garder les anciennes routes en parallèle pendant la migration
    // Une fois le module User entièrement migré et testé,
    // vous pouvez rediriger /api/users vers /api/v2/users

    // Import des anciennes routes (si elles existent)
    // import utilisateursRouter from './routes/utilisateurs.js';
    // this.app.use('/api/v1/utilisateurs', utilisateursRouter);

    // ==================== AUTRES MODULES À REFACTORISER ====================
    // TODO: Refactoriser progressivement les autres modules selon le même pattern

    // Cours
    // import coursRouter from './routes/cours.js';
    // this.app.use('/api/cours', coursRouter);

    // Paiements
    // import paiementRouter from './routes/paiements.js';
    // this.app.use('/api/paiements', paiementRouter);

    // Magasin
    // import magasinRouter from './routes/magasin.js';
    // this.app.use('/api/magasin', magasinRouter);

    // ==================== ROUTE PAR DÉFAUT ====================
    this.app.get('/', (req, res) => {
      res.json({
        message: 'API Club Manager - Architecture Refactorée',
        version: '2.0.0',
        documentation: '/api/docs',
        health: '/health',
        modules: {
          users: {
            status: 'refactoré',
            endpoints: '/api/v2/users',
          },
          cours: {
            status: 'à refactoriser',
            endpoints: '/api/cours',
          },
          paiements: {
            status: 'à refactoriser',
            endpoints: '/api/paiements',
          },
        },
      });
    });

    // ==================== GESTION DES ERREURS ====================
    // IMPORTANT : Ces middlewares doivent être après toutes les routes

    // 404 - Route non trouvée
    this.app.use(notFoundMiddleware);

    // Middleware de gestion centralisée des erreurs
    this.app.use(errorMiddleware);
  }

  /**
   * Initialise la connexion à la base de données
   */
  private async initializeDatabase(): Promise<void> {
    console.log('🔄 [App] Initialisation de la base de données...');

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query('SELECT 1 as db_ready', [], (error: any, results: any) => {
        if (error) {
          console.error('❌ [App] Erreur de connexion à la base de données:', error);
          reject(error);
        } else {
          console.log('✅ [App] Base de données prête');
          resolve(results);
        }
      });
    });
  }

  /**
   * Initialise les services externes (email, etc.)
   */
  private async initializeExternalServices(): Promise<void> {
    console.log('🔄 [App] Initialisation des services externes...');

    try {
      // Initialiser le service d'email si nécessaire
      // const { messageClient } = await import('./db/clients/messagerie/messageClient.js');
      // await messageClient.initialiser();

      console.log('✅ [App] Services externes initialisés');
    } catch (error) {
      console.error('⚠️ [App] Erreur lors de l\'initialisation des services externes:', error);
      // Ne pas bloquer le démarrage si les services externes échouent
    }
  }

  /**
   * Démarre l'application
   */
  public async start(): Promise<void> {
    try {
      console.log('🚀 [App] Démarrage de l\'application...');
      console.log(`🔧 [App] Environnement: ${process.env.NODE_ENV || 'development'}`);

      // 1. Initialiser la base de données
      await this.initializeDatabase();

      // 2. Initialiser les services externes
      await this.initializeExternalServices();

      // 3. Afficher l'état du container (debug)
      console.log('📦 [App] État du container:', container.getStatus());

      // 4. Initialiser les routes
      this.initializeRoutes();

      // 5. Démarrer le serveur
      const PORT = process.env.PORT || 3000;
      this.app.listen(PORT, () => {
        console.log('✅ [App] ═══════════════════════════════════════');
        console.log(`✅ [App] Serveur démarré avec succès !`);
        console.log(`✅ [App] Port: ${PORT}`);
        console.log(`✅ [App] URL: http://localhost:${PORT}`);
        console.log(`✅ [App] Health: http://localhost:${PORT}/health`);
        console.log(`✅ [App] API Users (v2): http://localhost:${PORT}/api/v2/users`);
        console.log('✅ [App] ═══════════════════════════════════════');
      });
    } catch (error) {
      console.error('❌ [App] Erreur lors du démarrage:', error);
      process.exit(1);
    }
  }

  /**
   * Arrêt gracieux de l'application
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 [App] Arrêt de l\'application...');

    try {
      // Fermer les connexions à la base de données
      // await this.mysqlConnector.close();

      console.log('✅ [App] Application arrêtée proprement');
      process.exit(0);
    } catch (error) {
      console.error('❌ [App] Erreur lors de l\'arrêt:', error);
      process.exit(1);
    }
  }
}

/**
 * Création et démarrage de l'application
 */
const application = new App();

// Gérer les signaux d'arrêt
process.on('SIGTERM', () => {
  console.log('⚠️ [App] Signal SIGTERM reçu');
  application.shutdown();
});

process.on('SIGINT', () => {
  console.log('⚠️ [App] Signal SIGINT reçu');
  application.shutdown();
});

// Démarrer l'application
application.start();

// Export pour les tests
export default application;

/**
 * ═══════════════════════════════════════════════════════════════
 * GUIDE DE MIGRATION PROGRESSIVE
 * ═══════════════════════════════════════════════════════════════
 *
 * ÉTAPE 1 : PARALLÉLISER (1-2 jours)
 * ────────────────────────────────────────────────────────────────
 * ✅ Garder les anciennes routes sur /api/v1/users
 * ✅ Ajouter les nouvelles routes sur /api/v2/users
 * ✅ Tester les deux versions en parallèle
 *
 * ÉTAPE 2 : REDIRIGER (1 jour)
 * ────────────────────────────────────────────────────────────────
 * ✅ Modifier le frontend pour utiliser /api/v2/users
 * ✅ Ajouter un middleware de redirection :
 *
 *    app.use('/api/users', (req, res, next) => {
 *      console.warn('⚠️ Redirection /api/users → /api/v2/users');
 *      req.url = `/api/v2/users${req.url}`;
 *      next();
 *    });
 *
 * ÉTAPE 3 : SUPPRIMER L'ANCIEN CODE (1 jour)
 * ────────────────────────────────────────────────────────────────
 * ✅ Une fois que tout fonctionne, supprimer /api/v1/users
 * ✅ Renommer /api/v2/users en /api/users
 * ✅ Supprimer les anciens fichiers de routes/services
 *
 * ÉTAPE 4 : RÉPÉTER POUR LES AUTRES MODULES
 * ────────────────────────────────────────────────────────────────
 * ✅ Cours
 * ✅ Paiements
 * ✅ Magasin
 * ✅ Messagerie
 * ✅ etc.
 *
 * ═══════════════════════════════════════════════════════════════
 * AVANTAGES DE CETTE APPROCHE
 * ═══════════════════════════════════════════════════════════════
 *
 * 1. ZÉRO DOWNTIME
 *    Aucune interruption de service pendant la migration
 *
 * 2. ROLLBACK FACILE
 *    Si problème, retour aux anciennes routes immédiat
 *
 * 3. TESTS EN PRODUCTION
 *    Possibilité de tester la nouvelle version avec vrais utilisateurs
 *
 * 4. MIGRATION PROGRESSIVE
 *    Pas besoin de tout refactoriser d'un coup
 *
 * 5. COMPARAISON FACILE
 *    Comparer les performances avant/après
 *
 * ═══════════════════════════════════════════════════════════════
 */
