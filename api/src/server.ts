import express from 'express';
import cors from 'cors';
import MysqlConnector from './db/connector/mysqlconnector.js';
// ...existing imports...

const app = express();
const PORT = process.env.PORT || 3001;

// Initialisation du connector MySQL avec singleton
const mysqlConnector = MysqlConnector.getInstance();

// ...existing middleware...

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

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 Environnement : ${process.env.NODE_ENV || 'development'}`);
});
