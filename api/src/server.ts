import express from 'express';
import cors from 'cors';
import MysqlConnector from './db/connector/mysqlconnector.js';
import { emailClient } from './clients/emailClient.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialisation du connector MySQL avec singleton
const mysqlConnector = MysqlConnector.getInstance();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration du shutdown gracieux
mysqlConnector.setupGracefulShutdown();

// Route de santé pour vérifier le statut du pool
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

// ...existing routes...

const startServer = async () => {
  try {
    // Vérifier la connexion à la base de données
    console.log('🔧 Vérification de la connexion à la base de données...');
    // ... existing database connection code ...

    // Vérifier la connexion SendGrid
    console.log('📧 Vérification de la configuration SendGrid...');
    await emailClient.initializeAndVerify();

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📧 Service email: ${emailClient ? 'Disponible' : 'Non disponible'}`);
      console.log(`🔗 API accessible sur: http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();
