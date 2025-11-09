import express from 'express';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
// Charger le .env en premier
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
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
                    mysqlConnector.query('SELECT 1 as db_ready', [], (error, results) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            console.log('✅ [Server] Base de données prête');
                            resolve(results);
                        }
                    });
                });
                dbReady = true;
            }
            catch (error) {
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
        }
        catch (emailError) {
            console.warn('⚠️ [Server] Erreur lors de l\'initialisation EmailClient:', emailError);
            console.warn('⚠️ [Server] Le serveur continuera sans les services email optimaux');
        }
        // 3. Initialiser les services email après la DB
        console.log('🔄 [Server] Initialisation des services email...');
        try {
            // AJOUTÉ: Importer et initialiser EmailValidationService
            const { EmailValidationService } = await import('./services/emailValidationService.js');
            const emailValidationService = new EmailValidationService();
            await emailValidationService.initializeTables();
            console.log('✅ [Server] EmailValidationService initialisé');
            // AJOUTÉ: Importer EmailClient comme service secondaire
            const { emailClient } = await import('./clients/emailClient.js');
            await emailClient.initializeAndVerify();
            console.log('✅ [Server] EmailClient singleton initialisé');
            // Initialiser messageClient comme avant
            const { messageClient } = await import('./db/clients/messagerie/messageClient.js');
            await messageClient.initialiser();
            console.log('✅ [Server] MessageClient initialisé');
            console.log('✅ [Server] Services email initialisés (EmailValidationService + EmailClient + MessageClient)');
        }
        catch (emailError) {
            console.warn('⚠️ [Server] Services email non disponibles:', emailError);
            console.warn('⚠️ [Server] Le serveur continuera sans les services email');
        }
        // 3. Configuration de l'application Express
        app.use(express.json());
        // Configuration CORS
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            process.env.FRONTEND_URL_ALT,
            process.env.FRONTEND_URL_LOCAL,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
        ].filter(Boolean);
        const corsOptions = {
            origin: (origin, callback) => {
                if (!origin || allowedOrigins.includes(origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true,
        };
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
        const { default: paiementRouter } = await import('./routes/paiements.js');
        const { default: statistiquesRouter } = await import('./routes/statistiques.js');
        const { default: magasinRouter } = await import('./routes/magasin.js');
        const { default: professeursRouter } = await import('./routes/professeurs.js');
        const { default: messagesRouter } = await import('./routes/messages.js');
        const { default: uploadRouter } = await import('./routes/upload.js');
        const { default: inscriptionRouter } = await import('./routes/inscription.js');
        const { default: verificationRouter } = await import('./routes/verification.js');
        const { default: authRouter } = await import('./routes/auth.js');
        // SOLUTION: Import conditionnel pour les modules optionnels
        let webhooksRouter = null;
        let commandesRouter = null;
        let stocksRouter = null;
        try {
            const webhooksModule = await import('./routes/webhooks.js');
            webhooksRouter = webhooksModule.default;
            console.log('✅ [Server] Module webhooks chargé');
        }
        catch (error) {
            console.warn('⚠️ [Server] Module webhooks non disponible:', error);
        }
        try {
            const commandesModule = await import('./routes/commandes.js');
            commandesRouter = commandesModule.default;
            console.log('✅ [Server] Module commandes chargé');
        }
        catch (error) {
            console.warn('⚠️ [Server] Module commandes non disponible:', error);
        }
        try {
            const stocksModule = await import('./routes/stocks.js');
            stocksRouter = stocksModule.default;
            console.log('✅ [Server] Module stocks chargé');
        }
        catch (error) {
            console.warn('⚠️ [Server] Module stocks non disponible:', error);
        }
        // Routes principales (API)
        app.use('/auth', authRouter);
        app.use('/email', messagesRouter);
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
        // SOLUTION: Monter les routes optionnelles conditionnellement
        if (webhooksRouter) {
            app.use('/webhooks', webhooksRouter);
            console.log('✅ [Server] Route webhooks montée');
        }
        else {
            // Route de fallback pour webhooks
            app.use('/webhooks', (req, res) => {
                res.status(503).json({
                    error: 'Service webhooks temporairement indisponible',
                    message: 'Le module webhooks n\'est pas disponible'
                });
            });
            console.log('⚠️ [Server] Route webhooks en mode fallback');
        }
        if (commandesRouter) {
            app.use('/commandes', commandesRouter);
            console.log('✅ [Server] Route commandes montée');
        }
        else {
            // Route de fallback pour commandes
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
        }
        else {
            // Route de fallback pour stocks
            app.use('/stocks', (req, res) => {
                res.status(503).json({
                    error: 'Service stocks temporairement indisponible',
                    message: 'Le module stocks n\'est pas disponible'
                });
            });
            console.log('⚠️ [Server] Route stocks en mode fallback');
        }
        // Servir le build Vite (React) uniquement en production
        if (process.env.NODE_ENV === 'production') {
            app.use(express.static(path.join(__dirname, '../dist')));
            app.get('*', (req, res) => {
                res.sendFile(path.join(__dirname, '../dist', 'index.html'));
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
            }
            catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    error: error.message
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
                }
                catch (emailError) {
                    res.json({
                        status: 'partial',
                        email: {
                            configured: emailConfigured,
                            warning: 'Service email non initialisé mais configuration présente'
                        }
                    });
                }
            }
            catch (error) {
                res.status(500).json({
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });
        // 6. Démarrer le serveur
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
            console.log(`📊 [Server] Environnement : ${process.env.NODE_ENV || 'development'}`);
            console.log(`📧 [Server] SendGrid: ${process.env.SENDGRID_API_KEY ? 'Configuré' : 'Non configuré'}`);
            console.log(`📧 [Server] Emails: ${process.env.SENDGRID_FROM_EMAIL ? 'Configurés' : 'Non configurés'}`);
            console.log(`💾 [Server] Base de données: ${process.env.DB_NAME || 'clubmanager'}`);
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
    }
    catch (error) {
        console.error('❌ [Server] Erreur critique lors du démarrage:', error);
        process.exit(1);
    }
}
// Démarrer le serveur
startServer().catch((error) => {
    console.error('❌ [Server] Erreur fatale:', error);
    process.exit(1);
});
export default app;
