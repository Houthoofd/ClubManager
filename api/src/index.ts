import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import MysqlConnector from './db/connector/mysqlconnector.js';
import { default as indexRouter } from './routes/index.js';
import { default as utilisateursRouter } from './routes/utilisateurs.js';
import { default as informationsRouter } from './routes/informations.js';
import { default as coursRouter } from './routes/cours.js';
import { default as compteRouter } from './routes/compte.js';
import { default as paiementRouter } from './routes/paiements.js';
import { default as statistiquesRouter } from './routes/statistiques.js';
import { default as magasinRouter } from './routes/magasin.js';
import { default as professeursRouter } from './routes/professeurs.js';
import { default as messagesRouter } from './routes/messages.js';
import {default as uploadRouter } from './routes/upload.js';
import {default as inscriptionRouter } from './routes/inscription.js';
import {default as verificationRouter } from './routes/verification.js';
import { default as authRouter } from './routes/auth.js';

import dotenv from 'dotenv';

import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicPath = path.join(__dirname, 'public');
console.log("Chemin du dossier public :", publicPath);

const app = express();

// Initialisation du connector MySQL avec singleton - SANS appeler setupGracefulShutdown encore
const mysqlConnector = MysqlConnector.getInstance();

// Charger le .env (une seule fois !)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

app.use(express.json());

// Configuration CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_ALT,
  process.env.FRONTEND_URL_LOCAL,
  'http://localhost:5173', // Ajoute explicitement le front Vite en dev
  'http://127.0.0.1:5173', // Ajoute aussi 127.0.0.1 pour compatibilité
  'http://localhost:3000', // Pour tests éventuels
].filter(Boolean) as string[];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Autorise les requêtes sans origin (ex: curl, Postman) et celles venant des allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Sert les images et uploads (public) dans tous les cas
app.use('/public', express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes principales (API)
app.use('/auth', authRouter);
app.use('/', indexRouter);
app.use('/utilisateurs', utilisateursRouter);
app.use('/informations', informationsRouter);
app.use('/cours', coursRouter);
app.use('/compte', compteRouter);
app.use('/paiements', paiementRouter);
app.use('/magasin', magasinRouter);
app.use('/professeurs', professeursRouter);
app.use('/messages', messagesRouter);
app.use('/upload', uploadRouter);
app.use('/inscription', inscriptionRouter);
app.use('/verification', verificationRouter);
app.use('/statistiques', statistiquesRouter);

// Sert le build Vite (React) uniquement en production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  // Fallback pour React Router (production uniquement)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// Crée le serveur HTTP avec Express
const server = http.createServer(app);

// Instancie Socket.io avec le serveur
const io = new Server(server, {
  cors: {
    origin: "http://localhost:8081",  // Frontend
    methods: ["GET", "POST"]
  }
});

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

// Gestion de l'arrêt gracieux
let serverInstance: any;
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log('🔄 Arrêt déjà en cours...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`🔄 Signal ${signal} reçu. Arrêt gracieux en cours...`);
  
  // Arrêter d'accepter de nouvelles requêtes
  if (serverInstance) {
    serverInstance.close(async () => {
      console.log('✅ Serveur HTTP fermé');
      
      try {
        // Attendre un peu pour que les requêtes en cours se terminent
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fermer le pool MySQL
        const mysqlConnector = MysqlConnector.getInstance();
        await mysqlConnector.close();
        
        console.log('✅ Toutes les connexions fermées proprement');
        process.exit(0);
      } catch (error) {
        console.error('❌ Erreur lors de la fermeture:', error);
        process.exit(1);
      }
    });
    
    // Forcer l'arrêt après 10 secondes si pas terminé
    setTimeout(() => {
      console.log('⚠️  Arrêt forcé après timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Middleware pour rejeter les requêtes pendant l'arrêt
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({ message: 'Service en cours d\'arrêt' });
    return;
  }
  next();
});

// Démarrer le serveur Express et Socket.io
server.listen(3000, () => {
  console.log('🚀 Server is running on port 3000');
  console.log(`📊 Environnement : ${process.env.NODE_ENV || 'development'}`);
  
  // SEULEMENT MAINTENANT configurer le shutdown gracieux
  mysqlConnector.setupGracefulShutdown();
});