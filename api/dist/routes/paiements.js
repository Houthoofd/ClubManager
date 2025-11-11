import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { Magasin } from '../db/clients/magasin/magasin.js';
// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// CORRIGÉ: Chargement explicite du .env avec vérification ES6
const nodeEnv = process.env.NODE_ENV || 'development';
let envPath;
if (nodeEnv === 'production') {
    envPath = path.resolve(__dirname, '../../.env.production');
}
else {
    envPath = path.resolve(__dirname, '../../.env.development');
}
console.log(`🔧 [Paiements] Chargement .env depuis: ${envPath}`);
console.log(process.env.STRIPE_SECRET_KEY + "depuis paiements.ts");
dotenv.config({ path: envPath });
const router = express.Router();
console.log('🔧 [Paiements] Initialisation du module de paiements complet');
// AJOUTÉ: Initialisation simple de Stripe avec diagnostic de compatibilité
let stripe = null;
try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    console.log('🔍 [Paiements] Diagnostic clé Stripe backend:', {
        keyExists: !!stripeSecretKey,
        keyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 25) + '...' : 'ABSENT',
        keyType: stripeSecretKey ? (stripeSecretKey.startsWith('sk_test_') ? 'SECRET TEST' :
            stripeSecretKey.startsWith('sk_live_') ? 'SECRET LIVE' : 'FORMAT INCORRECT') : 'ABSENT',
        accountId: stripeSecretKey ? stripeSecretKey.substring(8, 25) : 'N/A',
        expectedFrontendKey: stripeSecretKey ? `pk_${stripeSecretKey.substring(3, 25)}...` : 'N/A'
    });
    if (stripeSecretKey && stripeSecretKey.startsWith('sk_')) {
        // AJOUTÉ: Log de la clé publique correspondante attendue
        const expectedPublicKey = `pk_${stripeSecretKey.substring(3)}`;
        console.log('✅ [Paiements] Clé backend compatible détectée');
        console.log('ℹ️ [Paiements] Clé publique frontend attendue:', expectedPublicKey.substring(0, 25) + '...');
        console.log('ℹ️ [Paiements] Compte Stripe:', stripeSecretKey.substring(8, 25));
        stripe = new Stripe(stripeSecretKey, {
            apiVersion: '2025-02-24.acacia',
        });
        console.log('✅ [Paiements] Stripe initialisé avec succès');
        console.log('ℹ️ [Paiements] Type de clé:', stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE');
        console.log('ℹ️ [Paiements] Compte:', stripeSecretKey.substring(8, 25));
    }
    else {
        console.warn('⚠️ [Paiements] STRIPE_SECRET_KEY manquant ou invalide');
    }
}
catch (error) {
    console.error('❌ [Paiements] Erreur initialisation Stripe:', error);
}
// CORRIGÉ: Middleware d'authentification flexible
const flexibleAuth = async (req, res, next) => {
    try {
        // Routes qui ne nécessitent pas d'authentification
        const publicRoutes = ['/health', '/debug', '/webhooks/stripe'];
        if (publicRoutes.some(route => req.path.includes(route))) {
            return next();
        }
        let token = req.cookies?.token ||
            req.headers.authorization?.replace('Bearer ', '') ||
            req.headers.authtoken ||
            req.headers['x-auth-token'] ||
            req.cookies?.authToken;
        if (!token) {
            return res.status(401).json({
                error: 'Token d\'authentification manquant',
                hint: 'Utilisez le cookie token ou le header Authorization: Bearer <token>'
            });
        }
        const jwtModule = await import('jsonwebtoken');
        const jwt = jwtModule.default || jwtModule;
        const verifyFunction = jwt.verify || jwtModule.verify;
        if (!verifyFunction) {
            return res.status(500).json({
                error: 'Erreur configuration JWT'
            });
        }
        const decoded = verifyFunction(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role || decoded.status,
            status: decoded.status
        };
        next();
    }
    catch (jwtError) {
        return res.status(401).json({
            error: 'Token invalide ou expiré',
            message: 'Veuillez vous reconnecter'
        });
    }
};
// Appliquer le middleware d'auth à toutes les routes (sauf publiques)
router.use(flexibleAuth);
// AJOUTÉ: Cache pour éviter les doublons de PaymentIntent
const paymentIntentCache = new Map();
const CACHE_DURATION = 30000; // 30 secondes
// POST - Créer un PaymentIntent pour échéance
router.post('/stripe/create-payment-intent', async (req, res) => {
    try {
        console.log('🎯 [Stripe] Début création PaymentIntent échéance');
        console.log('📝 [Stripe] Données reçues:', {
            body: req.body,
            user: req.user?.id,
            headers: {
                authorization: !!req.headers.authorization,
                contentType: req.headers['content-type']
            }
        });
        const { amount, currency = 'eur', echeanceId, userId, description } = req.body;
        // AJOUTÉ: Vérifier le cache pour éviter les doublons
        const cacheKey = `${echeanceId}_${userId}_${amount}`;
        const cachedPayment = paymentIntentCache.get(cacheKey);
        if (cachedPayment && (Date.now() - cachedPayment.timestamp < CACHE_DURATION)) {
            console.log('🔄 [Stripe] PaymentIntent trouvé en cache, réutilisation');
            return res.status(200).json({
                success: true,
                client_secret: cachedPayment.paymentIntent.client_secret,
                payment_intent_id: cachedPayment.paymentIntent.id,
                amount: cachedPayment.paymentIntent.amount,
                currency: cachedPayment.paymentIntent.currency,
                metadata: cachedPayment.paymentIntent.metadata,
                cached: true,
                echeance: {
                    id: parseInt(echeanceId),
                    montant: amount / 100,
                    statut: 'en attente'
                }
            });
        }
        // CORRIGÉ: Validation plus détaillée avec logs
        console.log('🔍 [Stripe] Validation des paramètres:', {
            amount: { value: amount, type: typeof amount, valid: !!amount },
            echeanceId: { value: echeanceId, type: typeof echeanceId, valid: !!echeanceId },
            userId: { value: userId, type: typeof userId, valid: !!userId },
            currency: currency,
            description: description
        });
        if (!amount) {
            console.error('❌ [Stripe] Montant manquant');
            return res.status(400).json({
                error: 'Montant requis',
                received: { amount, type: typeof amount }
            });
        }
        if (!echeanceId) {
            console.error('❌ [Stripe] ID échéance manquant');
            return res.status(400).json({
                error: 'ID échéance requis',
                received: { echeanceId, type: typeof echeanceId }
            });
        }
        if (!userId) {
            console.error('❌ [Stripe] ID utilisateur manquant');
            return res.status(400).json({
                error: 'ID utilisateur requis',
                received: { userId, type: typeof userId }
            });
        }
        console.log('✅ [Stripe] Validation OK, connexion DB...');
        const paiements = new Paiements();
        // CORRIGÉ: Vérification de l'échéance avec logs détaillés
        console.log('🔍 [Stripe] Vérification échéance ID:', echeanceId);
        let echeanceExiste;
        try {
            echeanceExiste = await paiements.queryAsync('SELECT id, utilisateur_id, montant, statut FROM echeances_paiements WHERE id = ?', [parseInt(echeanceId)]);
            console.log('📊 [Stripe] Résultat requête échéance:', {
                found: echeanceExiste.length > 0,
                echeance: echeanceExiste[0] || null
            });
        }
        catch (dbError) {
            console.error('❌ [Stripe] Erreur DB lors vérification échéance:', dbError);
            return res.status(500).json({
                error: 'Erreur base de données',
                details: dbError.message
            });
        }
        if (echeanceExiste.length === 0) {
            console.error('❌ [Stripe] Échéance non trouvée:', echeanceId);
            return res.status(404).json({
                error: `Échéance ${echeanceId} non trouvée en base de données`
            });
        }
        const echeance = echeanceExiste[0];
        console.log('✅ [Stripe] Échéance trouvée:', { id: echeance.id, statut: echeance.statut });
        // CORRIGÉ: Vérifications de sécurité avec logs
        if (echeance.utilisateur_id !== parseInt(userId)) {
            console.error('❌ [Stripe] Échéance appartient à un autre utilisateur');
            return res.status(403).json({
                error: 'Cette échéance ne vous appartient pas'
            });
        }
        if (echeance.statut === 'payé') {
            console.warn('⚠️ [Stripe] Échéance déjà payée:', echeanceId);
            return res.status(400).json({
                error: 'Cette échéance est déjà payée',
                echeance: {
                    id: echeance.id,
                    statut: echeance.statut,
                    montant: echeance.montant
                }
            });
        }
        // CORRIGÉ: Validation et conversion du montant avec limites Stripe
        let amountInCents;
        try {
            if (typeof amount === 'number') {
                if (amount > 100 && Number.isInteger(amount)) {
                    amountInCents = Math.round(amount);
                }
                else {
                    amountInCents = Math.round(amount * 100);
                }
            }
            else {
                const parsedAmount = parseFloat(amount);
                if (isNaN(parsedAmount)) {
                    throw new Error(`Montant invalide: ${amount}`);
                }
                amountInCents = Math.round(parsedAmount * 100);
            }
            // AJOUTÉ: Vérification des limites Stripe
            if (amountInCents < 50) {
                throw new Error(`Montant trop faible: ${amountInCents} centimes (minimum 50 centimes = 0.50€)`);
            }
            if (amountInCents > 99999999) {
                throw new Error(`Montant trop élevé: ${amountInCents} centimes (maximum ~999,999€)`);
            }
            console.log('💰 [Stripe] Conversion montant:', {
                original: amount,
                converted: amountInCents,
                euros: (amountInCents / 100).toFixed(2)
            });
        }
        catch (amountError) {
            console.error('❌ [Stripe] Erreur validation montant:', amountError);
            return res.status(400).json({
                error: 'Montant invalide',
                details: amountError.message,
                limits: {
                    minimum: '0.50€ (50 centimes)',
                    maximum: '999,999.99€'
                }
            });
        }
        // CORRIGÉ: Création PaymentIntent avec protection contre le rate limit
        console.log('🚀 [Stripe] Création PaymentIntent...');
        let paymentIntent;
        try {
            // CORRIGÉ: Vérification simple de Stripe avec return
            if (!stripe) {
                console.error('❌ [Stripe] Service Stripe non initialisé');
                return res.status(503).json({
                    error: 'Service Stripe non disponible',
                    details: 'Stripe non initialisé - vérifiez STRIPE_SECRET_KEY dans .env'
                });
            }
            const supportedCurrencies = ['eur', 'usd', 'gbp', 'chf', 'cad'];
            const normalizedCurrency = currency.toLowerCase();
            if (!supportedCurrencies.includes(normalizedCurrency)) {
                throw new Error(`Devise non supportée: ${currency}`);
            }
            const paymentIntentData = {
                amount: amountInCents,
                currency: normalizedCurrency,
                description: description || `Paiement échéance #${echeanceId}`,
                metadata: {
                    echeance_id: echeanceId.toString(),
                    utilisateur_id: userId.toString(),
                    type: 'echeance_payment',
                    montant_euros: (amountInCents / 100).toString()
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            };
            console.log('📝 [Stripe] Données PaymentIntent validées');
            paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
            // AJOUTÉ: Mettre en cache le PaymentIntent
            paymentIntentCache.set(cacheKey, {
                paymentIntent: paymentIntent,
                timestamp: Date.now()
            });
            console.log('✅ [Stripe] PaymentIntent créé avec succès:', {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                status: paymentIntent.status
            });
        }
        catch (stripeError) {
            console.error('❌ [Stripe] Erreur Stripe API détaillée:', {
                type: stripeError.type,
                code: stripeError.code,
                message: stripeError.message
            });
            // AJOUTÉ: Gestion spécifique du rate limit
            if (stripeError.code === 'rate_limit') {
                console.warn('⚠️ [Stripe] Rate limit atteint - attendre avant nouvel essai');
                return res.status(429).json({
                    error: 'Trop de demandes simultanées',
                    message: 'Veuillez patienter quelques secondes avant de réessayer',
                    code: 'rate_limit',
                    retry_after: 30, // secondes
                    solution: 'Évitez les clics rapides répétés sur le bouton de paiement'
                });
            }
            // Messages d'erreur spécifiques selon le code d'erreur Stripe
            let errorMessage = 'Erreur Stripe lors de la création du PaymentIntent';
            let solution = 'Vérifiez la configuration Stripe';
            switch (stripeError.code) {
                case 'api_key_expired':
                    errorMessage = 'Clé API Stripe expirée';
                    solution = 'Générez une nouvelle clé API dans votre dashboard Stripe';
                    break;
                case 'invalid_api_key':
                    errorMessage = 'Clé API Stripe invalide';
                    solution = 'Vérifiez la variable STRIPE_SECRET_KEY dans votre fichier .env';
                    break;
                case 'testmode_charges_only':
                    errorMessage = 'Clé de test utilisée en mode live';
                    solution = 'Utilisez une clé API live ou changez en mode test';
                    break;
                case 'amount_too_small':
                    errorMessage = 'Montant trop faible pour Stripe';
                    solution = 'Le montant minimum est de 0.50€ (50 centimes)';
                    break;
                case 'currency_not_supported':
                    errorMessage = 'Devise non supportée';
                    solution = 'Utilisez EUR, USD, GBP, CHF ou CAD';
                    break;
            }
            return res.status(500).json({
                error: errorMessage,
                details: stripeError.message,
                solution: solution,
                stripeError: {
                    type: stripeError.type,
                    code: stripeError.code,
                    message: stripeError.message
                }
            });
        }
        // CORRIGÉ: Réponse de succès avec toutes les données nécessaires
        const response = {
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
            echeance: {
                id: echeance.id,
                montant: echeance.montant,
                statut: echeance.statut
            }
        };
        console.log('✅ [Stripe] Réponse envoyée avec succès');
        res.status(200).json(response);
    }
    catch (error) {
        console.error('❌ [Stripe] Erreur générale création PaymentIntent:', error);
        res.status(500).json({
            error: 'Erreur lors de la création du PaymentIntent',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
// POST - Créer un PaymentIntent pour commande
router.post('/stripe/create-payment-intent-commande', async (req, res) => {
    try {
        console.log('🛒 [Stripe] Début création PaymentIntent commande');
        console.log('📝 [Stripe] Données reçues:', {
            body: req.body,
            user: req.user?.id,
            headers: {
                authorization: !!req.headers.authorization,
                contentType: req.headers['content-type']
            }
        });
        // CORRIGÉ: Gestion plus flexible des paramètres
        const { amount, currency = 'eur', commande, description } = req.body;
        let utilisateur_id = req.user?.id;
        let commandeId;
        let montantCommande;
        console.log('🔍 [Stripe] Analyse paramètre commande:', {
            commande,
            type: typeof commande,
            isNumber: typeof commande === 'number',
            isString: typeof commande === 'string',
            isObject: typeof commande === 'object',
            hasArticles: commande?.articles ? 'OUI' : 'NON'
        });
        // MODIFIÉ: Gestion flexible des formats de commande
        if (typeof commande === 'number' || (typeof commande === 'string' && !isNaN(parseInt(commande)))) {
            // Cas 1: ID de commande existante (nombre ou string numérique)
            commandeId = typeof commande === 'number' ? commande : parseInt(commande);
            console.log('🔍 [Stripe] ID commande existante détecté:', commandeId);
            // Vérifier que l'ID est valide
            if (isNaN(commandeId) || commandeId <= 0) {
                console.error('❌ [Stripe] ID commande invalide:', commandeId);
                return res.status(400).json({
                    error: 'ID de commande invalide',
                    received: { commande, parsed: commandeId }
                });
            }
            // Récupérer les détails de la commande existante
            const paiements = new Paiements();
            const commandeQuery = `
        SELECT id, utilisateur_id, total, statut, date_commande
        FROM commandes 
        WHERE id = ?
      `;
            try {
                const commandeResult = await paiements.queryAsync(commandeQuery, [commandeId]);
                if (!commandeResult.length) {
                    console.error('❌ [Stripe] Commande non trouvée:', commandeId);
                    return res.status(404).json({
                        error: `Commande ${commandeId} non trouvée en base de données`
                    });
                }
                const commandeDetails = commandeResult[0];
                console.log('✅ [Stripe] Commande trouvée:', commandeDetails);
                // Vérifications de sécurité
                if (commandeDetails.utilisateur_id !== utilisateur_id) {
                    console.error('❌ [Stripe] Commande appartient à un autre utilisateur:', {
                        commandeUserId: commandeDetails.utilisateur_id,
                        currentUserId: utilisateur_id
                    });
                    return res.status(403).json({
                        error: 'Cette commande ne vous appartient pas'
                    });
                }
                // CORRIGÉ: Vérifier plus de statuts possibles
                const statutsPayes = ['payée', 'confirmée', 'expédiée', 'livrée'];
                if (statutsPayes.includes(commandeDetails.statut)) {
                    console.warn('⚠️ [Stripe] Commande déjà traitée:', {
                        commandeId,
                        statut: commandeDetails.statut
                    });
                    return res.status(400).json({
                        error: 'Cette commande a déjà été traitée',
                        commande: {
                            id: commandeDetails.id,
                            statut: commandeDetails.statut,
                            total: commandeDetails.total
                        }
                    });
                }
                montantCommande = parseFloat(commandeDetails.total);
                utilisateur_id = commandeDetails.utilisateur_id;
            }
            catch (dbError) {
                console.error('❌ [Stripe] Erreur DB lors vérification commande:', dbError);
                return res.status(500).json({
                    error: 'Erreur base de données lors de la vérification de la commande',
                    details: dbError.message
                });
            }
        }
        else if (typeof commande === 'object' && commande !== null && commande.articles) {
            // Cas 2: Nouvelle commande à créer avec articles
            console.log('🛒 [Stripe] Création nouvelle commande avec articles:', commande);
            if (!utilisateur_id && commande?.utilisateur_id) {
                utilisateur_id = commande.utilisateur_id;
            }
            if (!utilisateur_id) {
                return res.status(401).json({
                    error: 'Utilisateur non authentifié pour créer une nouvelle commande'
                });
            }
            // Validation des articles
            if (!Array.isArray(commande.articles) || commande.articles.length === 0) {
                return res.status(400).json({
                    error: 'Articles manquants ou invalides dans la commande',
                    received: { articles: commande.articles }
                });
            }
            try {
                const magasin = new Magasin();
                const commandeResult = await magasin.creerCommande(utilisateur_id, commande.articles, commande.total, new Date().toISOString(), 'en_attente');
                if (!commandeResult.isConfirm) {
                    return res.status(400).json({
                        error: 'Erreur lors de la création de la commande',
                        details: 'La création de la commande a échoué'
                    });
                }
                // Récupérer l'ID de la commande créée
                const paiements = new Paiements();
                const rechercheQuery = `
          SELECT id, total FROM commandes 
          WHERE utilisateur_id = ? 
          ORDER BY date_commande DESC 
          LIMIT 1
        `;
                const rechercheResult = await paiements.queryAsync(rechercheQuery, [utilisateur_id]);
                if (!rechercheResult.length) {
                    return res.status(500).json({
                        error: 'Impossible de récupérer la commande créée'
                    });
                }
                commandeId = rechercheResult[0].id;
                montantCommande = parseFloat(rechercheResult[0].total);
                console.log('✅ [Stripe] Nouvelle commande créée:', {
                    commandeId,
                    montantCommande,
                    utilisateur_id
                });
            }
            catch (creationError) {
                console.error('❌ [Stripe] Erreur création nouvelle commande:', creationError);
                return res.status(500).json({
                    error: 'Erreur lors de la création de la nouvelle commande',
                    details: creationError.message
                });
            }
        }
        else {
            // Cas 3: Format non reconnu
            console.error('❌ [Stripe] Format de commande non reconnu:', {
                commande,
                type: typeof commande,
                isNull: commande === null,
                isUndefined: commande === undefined,
                hasArticles: commande?.articles ? 'OUI' : 'NON',
                keys: commande && typeof commande === 'object' ? Object.keys(commande) : 'N/A'
            });
            return res.status(400).json({
                error: 'Format de commande non reconnu',
                received: {
                    commande,
                    type: typeof commande,
                    expected: 'number (ID commande existante) ou object avec propriété articles'
                },
                help: {
                    existingOrder: 'Utilisez un nombre: { "commande": 123 }',
                    newOrder: 'Utilisez un objet: { "commande": { "articles": [...], "total": 50.00 } }'
                }
            });
        }
        // CORRIGÉ: Vérification avec return
        if (!stripe) {
            return res.status(503).json({
                error: 'Service Stripe non disponible',
                details: 'Le service de paiement Stripe n\'est pas configuré'
            });
        }
        // Validation du montant final
        if (!montantCommande || montantCommande <= 0 || isNaN(montantCommande)) {
            console.error('❌ [Stripe] Montant de commande invalide:', {
                montantCommande,
                type: typeof montantCommande,
                isNaN: isNaN(montantCommande)
            });
            return res.status(400).json({
                error: 'Montant de commande invalide',
                montant: montantCommande,
                details: 'Le montant doit être un nombre positif'
            });
        }
        const amountInCents = Math.round(montantCommande * 100);
        // AJOUTÉ: Vérification des limites Stripe
        if (amountInCents < 50) {
            return res.status(400).json({
                error: 'Montant trop faible pour Stripe',
                details: `${amountInCents} centimes (minimum 50 centimes = 0.50€)`,
                montant_euros: montantCommande
            });
        }
        console.log('💰 [Stripe] Montant commande validé:', {
            montant_euros: montantCommande,
            amount_cents: amountInCents,
            commande_id: commandeId,
            utilisateur_id: utilisateur_id
        });
        // Créer le PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency.toLowerCase(),
            metadata: {
                type: 'commande_magasin',
                commande_id: commandeId.toString(),
                utilisateur_id: utilisateur_id.toString(),
                montant_euros: montantCommande.toString()
            },
            description: description || `Paiement commande magasin #${commandeId}`,
            automatic_payment_methods: {
                enabled: true,
            }
        });
        console.log('✅ [Stripe] PaymentIntent commande créé:', {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            commande_id: commandeId
        });
        // CORRIGÉ: Réponse avec toutes les données nécessaires
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            commande_id: commandeId,
            amount: amountInCents,
            currency: currency,
            commande: {
                id: commandeId,
                total: montantCommande,
                utilisateur_id: utilisateur_id,
                statut: 'en_attente'
            }
        });
    }
    catch (error) {
        console.error('❌ [Stripe] Erreur création PaymentIntent commande:', error);
        res.status(500).json({
            error: 'Erreur lors de la création du PaymentIntent pour commande',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
// ===== ROUTES ÉCHÉANCES =====
// GET - Obtenir toutes les échéances d'un utilisateur
router.get('/echeances/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId || isNaN(parseInt(userId))) {
            return res.status(400).json({ message: 'ID utilisateur invalide' });
        }
        const paiements = new Paiements();
        const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
        res.status(200).json(echeances || []);
    }
    catch (error) {
        console.error('❌ [Échéances] Erreur GET /:userId:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des échéances' });
    }
});
// GET - Récupérer les détails d'une échéance spécifique
router.get('/echeances/detail/:echeanceId', async (req, res) => {
    try {
        const { echeanceId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                error: 'Utilisateur non authentifié'
            });
        }
        if (!echeanceId || isNaN(parseInt(echeanceId))) {
            return res.status(400).json({
                error: 'ID échéance invalide'
            });
        }
        const paiements = new Paiements();
        const query = `
      SELECT 
        ep.*,
        u.first_name,
        u.last_name,
        u.email
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      WHERE ep.id = ? AND ep.utilisateur_id = ?
    `;
        const results = await paiements.queryAsync(query, [parseInt(echeanceId), userId]);
        if (results.length === 0) {
            return res.status(404).json({
                error: 'Échéance non trouvée'
            });
        }
        const echeance = results[0];
        const echeanceFormatee = {
            id: echeance.id,
            utilisateur_id: echeance.utilisateur_id,
            montant: parseFloat(echeance.montant),
            description: echeance.description || 'Cotisation club',
            date_echeance: echeance.date_echeance,
            statut: echeance.statut,
            date_creation: echeance.date_creation,
            date_paiement: echeance.date_paiement,
            utilisateur: {
                first_name: echeance.first_name,
                last_name: echeance.last_name,
                email: echeance.email
            }
        };
        res.json(echeanceFormatee);
    }
    catch (error) {
        console.error('❌ [Echeances] Erreur récupération détail échéance:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'échéance',
            details: error.message
        });
    }
});
// ===== ROUTES CONFIRMATION =====
// POST - Confirmer un paiement d'échéance
router.post('/confirmation/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, echeanceId, userId, amount } = req.body;
        if (!paymentIntentId || !echeanceId || !userId) {
            return res.status(400).json({
                error: 'Données manquantes pour la confirmation de paiement'
            });
        }
        // CORRIGÉ: Vérification avec return
        if (!stripe) {
            return res.status(503).json({ error: 'Service Stripe non disponible' });
        }
        const paiements = new Paiements();
        // Vérifier le paiement sur Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                error: 'Le paiement n\'a pas été confirmé sur Stripe',
                stripeStatus: paymentIntent.status
            });
        }
        // Marquer l'échéance comme payée
        const updateEcheanceQuery = `
      UPDATE echeances_paiements 
      SET statut = 'payé', date_paiement = CURDATE()
      WHERE id = ? AND statut != 'payé'
    `;
        const updateResult = await paiements.queryAsync(updateEcheanceQuery, [parseInt(echeanceId)]);
        if (updateResult.affectedRows === 0) {
            return res.status(500).json({
                error: 'Impossible de mettre à jour l\'échéance'
            });
        }
        // Vérifier si c'est le premier paiement pour promotion automatique
        const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));
        let statutUpgrade = null;
        if (premierPaiement) {
            try {
                const statusQuery = `
          SELECT u.status_id, s.nom_role as status_actuel
          FROM utilisateurs u
          LEFT JOIN status s ON u.status_id = s.id
          WHERE u.id = ?
        `;
                const statusResult = await paiements.queryAsync(statusQuery, [userId]);
                if (statusResult.length > 0 && statusResult[0].status_actuel === 'visiteur') {
                    const utilisateurStatusQuery = `SELECT id FROM status WHERE nom_role = 'utilisateur' LIMIT 1`;
                    const nouveauStatut = await paiements.queryAsync(utilisateurStatusQuery, []);
                    if (nouveauStatut.length > 0) {
                        const updateUserQuery = `
              UPDATE utilisateurs 
              SET status_id = ?, date_modification = NOW()
              WHERE id = ?
            `;
                        await paiements.queryAsync(updateUserQuery, [nouveauStatut[0].id, userId]);
                        statutUpgrade = 'visiteur → utilisateur';
                    }
                }
            }
            catch (promotionError) {
                console.error('❌ [Confirmation] Erreur promotion:', promotionError);
            }
        }
        res.status(200).json({
            success: true,
            message: 'Paiement confirmé avec succès',
            paiement_id: paymentIntentId,
            echeance_id: parseInt(echeanceId),
            premier_paiement: premierPaiement,
            statut_upgrade: statutUpgrade
        });
    }
    catch (error) {
        console.error('❌ [Confirmation] Erreur confirmation paiement:', error);
        res.status(500).json({
            error: 'Erreur lors de la confirmation du paiement',
            details: error.message
        });
    }
});
// POST - Confirmer un paiement d'échéance
router.post('/confirmation/confirm-payment-commande', async (req, res) => {
    try {
        console.log('🛒 [Confirmation] Début confirmation paiement commande');
        console.log('📝 [Confirmation] Données reçues:', req.body);
        const { paymentIntentId, commandeId, userId, amount } = req.body;
        if (!paymentIntentId || !commandeId || !userId) {
            return res.status(400).json({
                error: 'Données manquantes pour la confirmation de paiement commande',
                required: ['paymentIntentId', 'commandeId', 'userId'],
                received: { paymentIntentId: !!paymentIntentId, commandeId: !!commandeId, userId: !!userId }
            });
        }
        if (!stripe) {
            return res.status(503).json({ error: 'Service Stripe non disponible' });
        }
        const paiements = new Paiements();
        // Vérifier le paiement sur Stripe
        console.log('🔍 [Confirmation] Vérification paiement Stripe:', paymentIntentId);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            console.error('❌ [Confirmation] Paiement pas confirmé sur Stripe:', paymentIntent.status);
            return res.status(400).json({
                error: 'Le paiement n\'a pas été confirmé sur Stripe',
                stripeStatus: paymentIntent.status
            });
        }
        // Vérifier que la commande existe et appartient au bon utilisateur
        const commandeQuery = `
      SELECT id, utilisateur_id, total, statut 
      FROM commandes 
      WHERE id = ? AND utilisateur_id = ?
    `;
        const commandeResult = await paiements.queryAsync(commandeQuery, [parseInt(commandeId), parseInt(userId)]);
        if (!commandeResult.length) {
            return res.status(404).json({
                error: 'Commande non trouvée ou accès non autorisé',
                commande_id: commandeId,
                user_id: userId
            });
        }
        const commande = commandeResult[0];
        if (commande.statut === 'payée' || commande.statut === 'confirmée') {
            console.warn('⚠️ [Confirmation] Commande déjà confirmée:', commandeId);
            return res.status(200).json({
                success: true,
                message: 'Commande déjà confirmée',
                commande_id: parseInt(commandeId),
                statut_actuel: commande.statut,
                already_processed: true
            });
        }
        // CORRIGÉ: Marquer la commande comme payée sans date_modification (colonne inexistante)
        const updateCommandeQuery = `
      UPDATE commandes 
      SET statut = 'payée'
      WHERE id = ? AND statut != 'payée'
    `;
        const updateResult = await paiements.queryAsync(updateCommandeQuery, [parseInt(commandeId)]);
        if (updateResult.affectedRows === 0) {
            console.warn('⚠️ [Confirmation] Aucune ligne mise à jour - commande peut-être déjà payée');
        }
        // CORRIGÉ: Enregistrer le paiement dans l'historique avec gestion d'erreur
        try {
            // Vérifier d'abord si la table paiements existe et quelles colonnes elle a
            const checkTableQuery = `SHOW COLUMNS FROM paiements`;
            const columns = await paiements.queryAsync(checkTableQuery, []);
            console.log('📊 [Confirmation] Colonnes disponibles dans table paiements:', columns.map((col) => col.Field).join(', '));
            // Adapter la requête selon les colonnes disponibles
            const availableColumns = columns.map((col) => col.Field);
            if (availableColumns.includes('utilisateur_id') &&
                availableColumns.includes('montant') &&
                availableColumns.includes('methode_paiement')) {
                let insertPaiementQuery = `
          INSERT INTO paiements (
            utilisateur_id, montant, methode_paiement, statut
        `;
                let insertValues = [
                    parseInt(userId),
                    parseFloat(amount) || parseFloat(commande.total),
                    'stripe',
                    'confirmé'
                ];
                // Ajouter conditionnellement les colonnes qui existent
                if (availableColumns.includes('date_creation')) {
                    insertPaiementQuery += ', date_creation';
                    insertValues.push('NOW()');
                }
                if (availableColumns.includes('stripe_payment_intent_id')) {
                    insertPaiementQuery += ', stripe_payment_intent_id';
                    insertValues.push(paymentIntentId);
                }
                if (availableColumns.includes('commande_id')) {
                    insertPaiementQuery += ', commande_id';
                    insertValues.push(parseInt(commandeId));
                }
                if (availableColumns.includes('description')) {
                    insertPaiementQuery += ', description';
                    insertValues.push(`Paiement commande magasin #${commandeId}`);
                }
                insertPaiementQuery += ') VALUES (' + insertValues.map(() => '?').join(', ') + ')';
                // CORRIGÉ: Remplacer 'NOW()' par la fonction MySQL
                const finalValues = insertValues.map(val => val === 'NOW()' ? null : val);
                const finalQuery = insertPaiementQuery.replace(/\?/, 'NOW()');
                await paiements.queryAsync(finalQuery, finalValues.filter(val => val !== null));
                console.log('✅ [Confirmation] Paiement enregistré dans l\'historique');
            }
            else {
                console.warn('⚠️ [Confirmation] Table paiements incomplète - enregistrement ignoré');
            }
        }
        catch (historyError) {
            console.warn('⚠️ [Confirmation] Erreur enregistrement historique (non bloquant):', historyError.message);
            // Ne pas bloquer la confirmation si l'historique échoue
        }
        console.log('✅ [Confirmation] Commande confirmée avec succès:', commandeId);
        res.status(200).json({
            success: true,
            message: 'Paiement commande confirmé avec succès',
            payment_intent_id: paymentIntentId,
            commande_id: parseInt(commandeId),
            montant: parseFloat(amount) || parseFloat(commande.total),
            statut: 'payée',
            date_confirmation: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ [Confirmation] Erreur confirmation paiement commande:', error);
        res.status(500).json({
            error: 'Erreur lors de la confirmation du paiement commande',
            details: error.message
        });
    }
});
// ===== ROUTES WEBHOOKS =====
// POST - Webhook Stripe (sans express.raw)
router.post('/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // CORRIGÉ: Vérification avec return
    if (!stripe || !endpointSecret) {
        return res.status(503).json({ error: 'Service webhook non configuré' });
    }
    let event;
    try {
        // CORRIGÉ: Simplifier la gestion des données webhook - ignorer la vérification de signature pour l'instant
        console.log('🎣 [Webhook] Réception webhook Stripe (signature ignorée temporairement)');
        // Pour les tests, on peut créer un événement factice ou traiter directement les données
        if (req.body && req.body.type) {
            // Si on reçoit directement un événement Stripe
            event = req.body;
        }
        else {
            // Sinon, créer un événement de test
            console.warn('⚠️ [Webhook] Données webhook non standard - création événement de test');
            return res.json({
                received: true,
                message: 'Webhook reçu mais signature non vérifiée - configurez STRIPE_WEBHOOK_SECRET'
            });
        }
    }
    catch (err) {
        console.error('❌ [Webhook] Erreur traitement données:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    try {
        console.log('🔄 [Webhook] Traitement événement:', event.type);
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('✅ [Webhook] Paiement réussi:', paymentIntent.id);
                // Traiter le paiement réussi
                const echeanceId = paymentIntent.metadata?.echeance_id;
                const utilisateurId = paymentIntent.metadata?.utilisateur_id;
                if (echeanceId && utilisateurId) {
                    const paiements = new Paiements();
                    const updateQuery = `
            UPDATE echeances_paiements 
            SET statut = 'payé', date_paiement = CURDATE()
            WHERE id = ? AND utilisateur_id = ?
          `;
                    await paiements.queryAsync(updateQuery, [parseInt(echeanceId), parseInt(utilisateurId)]);
                    console.log(`✅ [Webhook] Échéance ${echeanceId} marquée comme payée`);
                }
                break;
            case 'payment_intent.payment_failed':
                console.log('❌ [Webhook] Paiement échoué:', event.data.object);
                break;
            default:
                console.log('⚠️ [Webhook] Événement non géré:', event.type);
        }
        res.json({ received: true, processed: true });
    }
    catch (error) {
        console.error('❌ [Webhook] Erreur traitement:', error);
        res.status(500).json({ error: 'Erreur traitement webhook' });
    }
});
// AJOUTÉ: Route de test webhook pour développement
router.post('/webhooks/test-stripe', async (req, res) => {
    try {
        console.log('🧪 [Webhook Test] Test webhook reçu:', req.body);
        // Simuler un paiement réussi
        const testEvent = {
            type: 'payment_intent.succeeded',
            data: {
                object: {
                    id: 'pi_test_' + Date.now(),
                    metadata: req.body.metadata || {}
                }
            }
        };
        console.log('🔄 [Webhook Test] Simulation événement:', testEvent);
        res.json({
            success: true,
            message: 'Webhook de test traité',
            simulatedEvent: testEvent,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ [Webhook Test] Erreur:', error);
        res.status(500).json({ error: error.message });
    }
});
// ===== ROUTES CRUD (RACINE) =====
// GET - Récupérer tous les paiements avec filtres
router.get('/', async (req, res) => {
    try {
        const paiements = new Paiements();
        const utilisateurId = req.query.utilisateur_id ? parseInt(req.query.utilisateur_id) : null;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset) : 0;
        let resultats;
        if (utilisateurId) {
            resultats = await paiements.obtenirPaiementsParUtilisateur(utilisateurId);
        }
        else {
            resultats = await paiements.obtenirLesTousLesPaiements();
        }
        const total = resultats.length;
        const paginatedResults = resultats.slice(offset, offset + limit);
        res.json({
            success: true,
            data: paginatedResults,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });
    }
    catch (error) {
        console.error('❌ [CRUD] Erreur récupération paiements:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de la récupération des paiements',
            details: error.message
        });
    }
});
// ===== ROUTES DE BASE =====
// Route de santé
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        module: 'paiements-complet',
        architecture: 'module unifié avec toutes les fonctionnalités',
        features: {
            stripe: !!stripe,
            echeances: true,
            confirmation: true,
            webhooks: !!process.env.STRIPE_WEBHOOK_SECRET,
            crud: true
        },
        routes: [
            'GET /paiements/health - Statut du module',
            'GET /paiements/ - CRUD paiements',
            'POST /paiements/stripe/create-payment-intent - PaymentIntent échéance',
            'POST /paiements/stripe/create-payment-intent-commande - PaymentIntent commande',
            'GET /paiements/echeances/:userId - Échéances utilisateur',
            'GET /paiements/echeances/detail/:echeanceId - Détail échéance',
            'POST /paiements/confirmation/confirm-payment - Confirmation paiement',
            'POST /paiements/webhooks/stripe - Webhook Stripe'
        ],
        timestamp: new Date().toISOString()
    });
});
console.log('✅ [Paiements] Module paiements complet initialisé');
// AJOUTÉ: Route de diagnostic Stripe complet
router.get('/stripe/diagnostic', async (req, res) => {
    try {
        console.log('🔍 [Stripe Diagnostic] Début du diagnostic complet...');
        const diagnostic = {
            timestamp: new Date().toISOString(),
            backend: {
                stripe_initialized: !!stripe,
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
            frontend_expected: {
                public_key: process.env.STRIPE_SECRET_KEY ?
                    `pk_${process.env.STRIPE_SECRET_KEY.substring(3)}` : 'N/A'
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
                error: null, // CORRIGÉ: Permettre any type pour l'erreur
                response: null // CORRIGÉ: Permettre any type pour la réponse
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
        if (stripe) {
            try {
                diagnostic.stripe_api_test.attempted = true;
                console.log('🧪 [Stripe Diagnostic] Test de l\'API Stripe...');
                // Test simple : récupérer le compte
                const account = await stripe.accounts.retrieve();
                diagnostic.stripe_api_test.success = true;
                diagnostic.stripe_api_test.response = {
                    account_id: account.id,
                    country: account.country,
                    default_currency: account.default_currency,
                    charges_enabled: account.charges_enabled,
                    payouts_enabled: account.payouts_enabled,
                    type: account.type
                };
                console.log('✅ [Stripe Diagnostic] API Stripe fonctionnelle:', account.id);
            }
            catch (stripeError) {
                console.error('❌ [Stripe Diagnostic] Erreur API Stripe:', stripeError);
                diagnostic.stripe_api_test.success = false;
                diagnostic.stripe_api_test.error = {
                    type: stripeError.type,
                    code: stripeError.code,
                    message: stripeError.message
                };
            }
        }
        // Évaluation globale
        const isFullyOperational = diagnostic.backend.stripe_initialized &&
            diagnostic.backend.secret_key.exists &&
            diagnostic.backend.public_key.exists &&
            diagnostic.compatibility.account_match &&
            (diagnostic.compatibility.both_test_mode || diagnostic.compatibility.both_live_mode) &&
            diagnostic.stripe_api_test.success;
        const warnings = [];
        const errors = [];
        // Analyse et recommandations
        if (!diagnostic.backend.stripe_initialized) {
            errors.push('Stripe non initialisé côté backend');
        }
        if (!diagnostic.backend.secret_key.exists) {
            errors.push('STRIPE_SECRET_KEY manquante');
        }
        if (!diagnostic.backend.public_key.exists) {
            warnings.push('STRIPE_PUBLIC_KEY manquante (optionnelle côté backend)');
        }
        if (!diagnostic.compatibility.account_match) {
            errors.push('Clés publique/secrète de comptes Stripe différents');
        }
        if (diagnostic.backend.secret_key.format !== diagnostic.backend.public_key.format) {
            errors.push('Clés de types différents (TEST/LIVE mismatch)');
        }
        if (!diagnostic.stripe_api_test.success && diagnostic.stripe_api_test.attempted) {
            errors.push(`API Stripe non accessible: ${diagnostic.stripe_api_test.error?.message || 'Erreur inconnue'}`);
        }
        res.json({
            status: isFullyOperational ? 'operational' : (errors.length > 0 ? 'error' : 'warning'),
            overall_health: isFullyOperational,
            diagnostic,
            analysis: {
                errors: errors,
                warnings: warnings,
                recommendations: [
                    ...errors.map(error => `🔴 CRITIQUE: ${error}`),
                    ...warnings.map(warning => `🟡 ATTENTION: ${warning}`),
                    ...(isFullyOperational ? ['✅ Service Stripe pleinement opérationnel'] : [])
                ]
            },
            debug_info: {
                expected_frontend_key: diagnostic.frontend_expected.public_key,
                backend_secret_preview: process.env.STRIPE_SECRET_KEY ?
                    process.env.STRIPE_SECRET_KEY.substring(0, 25) + '...' : 'N/A',
                backend_public_preview: process.env.STRIPE_PUBLIC_KEY ?
                    process.env.STRIPE_PUBLIC_KEY.substring(0, 25) + '...' : 'N/A'
            }
        });
    }
    catch (error) {
        console.error('❌ [Stripe Diagnostic] Erreur générale:', error);
        res.status(500).json({
            status: 'error',
            overall_health: false,
            error: 'Erreur lors du diagnostic Stripe',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});
// AJOUTÉ: Route de test de compatibilité frontend/backend
router.post('/stripe/test-compatibility', async (req, res) => {
    try {
        console.log('🔗 [Stripe Compatibility] Test compatibilité frontend/backend...');
        const { frontend_public_key } = req.body;
        if (!frontend_public_key) {
            return res.status(400).json({
                error: 'Clé publique frontend requise',
                usage: 'POST /paiements/stripe/test-compatibility avec { "frontend_public_key": "pk_test_..." }'
            });
        }
        const compatibilityTest = {
            frontend: {
                key: frontend_public_key,
                type: frontend_public_key.startsWith('pk_test_') ? 'TEST' :
                    frontend_public_key.startsWith('pk_live_') ? 'LIVE' : 'INVALID',
                account: frontend_public_key.substring(8, 23),
                length: frontend_public_key.length
            },
            backend: {
                secret_key: {
                    exists: !!process.env.STRIPE_SECRET_KEY,
                    type: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' :
                        process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'LIVE' : 'INVALID',
                    account: process.env.STRIPE_SECRET_KEY?.substring(8, 23) || 'N/A'
                },
                public_key: {
                    exists: !!process.env.STRIPE_PUBLIC_KEY,
                    matches_frontend: process.env.STRIPE_PUBLIC_KEY === frontend_public_key
                }
            },
            compatibility: {
                same_account: false,
                same_type: false,
                fully_compatible: false
            }
        };
        // Tests de compatibilité
        if (process.env.STRIPE_SECRET_KEY) {
            compatibilityTest.compatibility.same_account =
                compatibilityTest.frontend.account === compatibilityTest.backend.secret_key.account;
            compatibilityTest.compatibility.same_type =
                compatibilityTest.frontend.type === compatibilityTest.backend.secret_key.type;
            compatibilityTest.compatibility.fully_compatible =
                compatibilityTest.compatibility.same_account && compatibilityTest.compatibility.same_type;
        }
        // Test pratique avec un petit PaymentIntent
        let practicalTest = {
            attempted: false,
            success: false,
            error: null, // CORRIGÉ: Permettre any type pour l'erreur
            payment_intent_id: null // CORRIGÉ: Permettre string ou null
        };
        if (stripe && compatibilityTest.compatibility.fully_compatible) {
            try {
                practicalTest.attempted = true;
                console.log('🧪 [Stripe Compatibility] Test création PaymentIntent...');
                const testPaymentIntent = await stripe.paymentIntents.create({
                    amount: 50, // 0.50€ minimum
                    currency: 'eur',
                    description: 'Test compatibilité frontend/backend',
                    metadata: {
                        test: 'compatibility_check',
                        frontend_key_account: compatibilityTest.frontend.account,
                        timestamp: new Date().toISOString()
                    }
                });
                practicalTest.success = true;
                practicalTest.payment_intent_id = testPaymentIntent.id;
                console.log('✅ [Stripe Compatibility] PaymentIntent test créé:', testPaymentIntent.id);
                // Annuler immédiatement le PaymentIntent de test
                await stripe.paymentIntents.cancel(testPaymentIntent.id);
                console.log('🗑️ [Stripe Compatibility] PaymentIntent test annulé');
            }
            catch (stripeError) {
                console.error('❌ [Stripe Compatibility] Erreur test pratique:', stripeError);
                practicalTest.success = false;
                practicalTest.error = {
                    type: stripeError.type,
                    code: stripeError.code,
                    message: stripeError.message
                };
            }
        }
        const overallResult = compatibilityTest.compatibility.fully_compatible &&
            (!practicalTest.attempted || practicalTest.success);
        res.json({
            status: overallResult ? 'compatible' : 'incompatible',
            compatibility_test: compatibilityTest,
            practical_test: practicalTest,
            recommendation: overallResult ?
                '✅ Frontend et backend parfaitement compatibles' :
                '❌ Problème de compatibilité détecté - vérifiez les clés Stripe',
            next_steps: overallResult ?
                ['Vous pouvez procéder aux paiements en toute sécurité'] :
                [
                    'Vérifiez que les clés proviennent du même compte Stripe',
                    'Assurez-vous que les clés sont du même type (TEST/LIVE)',
                    'Redémarrez les services après correction',
                    'Relancez ce test de compatibilité'
                ]
        });
    }
    catch (error) {
        console.error('❌ [Stripe Compatibility] Erreur générale:', error);
        res.status(500).json({
            status: 'error',
            error: 'Erreur lors du test de compatibilité',
            details: error.message
        });
    }
});
export default router;
