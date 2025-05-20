import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { default as indexRouter } from './routes/index.js';
import { default as utilisateursRouter } from './routes/utilisateurs.js';
import { default as informationsRouter } from './routes/informations.js';
import { default as coursRouter } from './routes/cours.js';
import { default as compteRouter } from './routes/compte.js';
import { default as paiementRouter } from './routes/paiements.js';
import { default as statistiquesRouter } from './routes/statistiques.js';
import { default as magasinRouter } from './routes/magasin.js';
import { default as professeursRouter } from './routes/professeurs.js';
import { default as chatRouter } from './routes/chat.js';
import { default as messagesRouter } from './routes/messages.js';
import http from 'http';
import { Server } from 'socket.io';
import socketHandler from './sockets/chatSocket.js'; // Assure-toi que le handler est correctement importé
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, 'public');
console.log("Chemin du dossier public :", publicPath);
const app = express();
app.use(express.json());
// Configuration CORS
const corsOptions = {
    origin: 'http://localhost:8081', // Frontend
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};
app.use(cors(corsOptions));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// Routes principales
app.use('/', indexRouter);
app.use('/utilisateurs', utilisateursRouter);
app.use('/informations', informationsRouter);
app.use('/cours', coursRouter);
app.use('/compte', compteRouter);
app.use('/paiements', paiementRouter);
app.use('/magasin', magasinRouter);
app.use('/professeurs', professeursRouter);
app.use('/chat', chatRouter);
app.use('/messages', messagesRouter);
app.use('/public', express.static(path.join(__dirname, '../public')));
// Routes secondaires
app.use('/cours/statistiques', statistiquesRouter);
// Crée le serveur HTTP avec Express
const server = http.createServer(app);
// Instancie Socket.io avec le serveur
const io = new Server(server, {
    cors: {
        origin: "http://localhost:8081", // Frontend
        methods: ["GET", "POST"]
    }
});
// Lier le gestionnaire des événements Socket.io
socketHandler(io);
console.log(server);
// Démarrer le serveur Express et Socket.io
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
