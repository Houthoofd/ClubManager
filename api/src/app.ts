import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import MysqlConnector from './db/connector/mysqlconnector.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();

// ========== MIDDLEWARE ==========
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ========== ROUTES ==========
// Les routes seront chargées dynamiquement dans index.ts

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: 'API Club Manager',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    method: req.method,
    path: req.originalUrl
  });
});

// Gestion globale des erreurs
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [App] Erreur globale:', error);
  
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

async function startServer() {
  try {
    console.log('🚀 [Server] Démarrage du serveur...');
    
    // 1. Initialiser la base de données en premier
    console.log('🔄 [Server] Initialisation de la base de données...');
    const mysqlConnector = MysqlConnector.getInstance();
    
    // Attendre que la DB soit prête
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
    
    // 2. Initialiser les services email après la DB
    console.log('🔄 [Server] Initialisation des services email...');
    const { messageClient } = await import('./clients/messageClient.js');
    await messageClient.initialiser();
    
    // 3. Démarrer le serveur Express
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`✅ [Server] Serveur démarré sur le port ${PORT}`);
      console.log(`🌐 [Server] API disponible sur http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ [Server] Erreur lors du démarrage:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();

export default app;