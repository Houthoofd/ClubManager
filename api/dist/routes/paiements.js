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
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const router = express.Router();
console.log('🔧 [Paiements] Initialisation du module de paiements complet');
// Configuration Stripe
let stripe = null;
try {
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('4e')) {
        stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            apiVersion: '2025-02-24.acacia',
        });
        console.log('✅ [Paiements] Stripe initialisé');
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
// ===== ROUTES STRIPE =====
// POST - Créer un PaymentIntent pour échéance
router.post('/stripe/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'eur', echeanceId, userId, description } = req.body;
        if (!amount || !echeanceId || !userId) {
            return res.status(400).json({
                error: 'Montant, échéance ID et utilisateur ID requis'
            });
        }
        if (!stripe) {
            return res.status(503).json({ error: 'Service Stripe non disponible' });
        }
        const paiements = new Paiements();
        // Vérification de l'échéance
        const echeanceExiste = await paiements.queryAsync('SELECT id, utilisateur_id, montant, statut FROM echeances_paiements WHERE id = ?', [parseInt(echeanceId)]);
        if (echeanceExiste.length === 0) {
            return res.status(404).json({
                error: `Échéance ${echeanceId} non trouvée en base de données`
            });
        }
        const echeance = echeanceExiste[0];
        if (echeance.utilisateur_id !== parseInt(userId)) {
            return res.status(403).json({
                error: 'Cette échéance ne vous appartient pas'
            });
        }
        if (echeance.statut === 'payé') {
            return res.status(400).json({
                error: 'Cette échéance est déjà payée'
            });
        }
        // Créer le PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount),
            currency: currency,
            description: description || `Paiement échéance #${echeanceId}`,
            metadata: {
                echeance_id: echeanceId.toString(),
                utilisateur_id: userId.toString(),
                type: 'echeance_payment'
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res.status(200).json({
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            metadata: paymentIntent.metadata
        });
    }
    catch (error) {
        console.error('❌ [Stripe] Erreur création PaymentIntent:', error);
        res.status(500).json({
            error: 'Erreur lors de la création du PaymentIntent',
            details: error.message
        });
    }
});
// POST - Créer un PaymentIntent pour commande
router.post('/stripe/create-payment-intent-commande', async (req, res) => {
    try {
        const { amount, currency = 'eur', commande, description } = req.body;
        let utilisateur_id = req.user?.id;
        if (!utilisateur_id && commande?.utilisateur_id) {
            utilisateur_id = commande.utilisateur_id;
        }
        if (!utilisateur_id) {
            return res.status(401).json({
                error: 'Utilisateur non authentifié'
            });
        }
        if (!stripe) {
            return res.status(503).json({ error: 'Service Stripe non disponible' });
        }
        // Logique de création de commande (simplifiée)
        let commandeId;
        let montantCommande;
        if (typeof commande === 'object' && commande.articles) {
            // Créer nouvelle commande
            const magasin = new Magasin();
            const commandeResult = await magasin.creerCommande(utilisateur_id, commande.articles, commande.total, new Date().toISOString(), 'en_attente');
            if (!commandeResult.isConfirm) {
                return res.status(400).json({
                    error: 'Erreur lors de la création de la commande'
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
            montantCommande = rechercheResult[0].total;
        }
        else {
            return res.status(400).json({
                error: 'Format de commande non reconnu'
            });
        }
        const amountInCents = Math.round(montantCommande * 100);
        // Créer le PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency,
            metadata: {
                type: 'commande_magasin',
                commande_id: commandeId.toString(),
                utilisateur_id: utilisateur_id.toString()
            },
            description: description || `Paiement commande #${commandeId}`,
            automatic_payment_methods: {
                enabled: true,
            }
        });
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            commande_id: commandeId,
            amount: amountInCents,
            currency: currency
        });
    }
    catch (error) {
        console.error('❌ [Stripe] Erreur création PaymentIntent commande:', error);
        res.status(500).json({
            error: 'Erreur lors de la création du PaymentIntent pour commande',
            details: error.message
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
// ===== ROUTES WEBHOOKS =====
// POST - Webhook Stripe
router.post('/webhooks/stripe', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!stripe || !endpointSecret) {
        return res.status(503).json({ error: 'Service webhook non configuré' });
    }
    let event;
    try {
        // CORRIGÉ: Gérer les données brutes différemment
        let body;
        if (req.body && typeof req.body === 'string') {
            body = req.body;
        }
        else if (req.body && Buffer.isBuffer(req.body)) {
            body = req.body;
        }
        else {
            // Fallback: convertir en string
            body = JSON.stringify(req.body);
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    }
    catch (err) {
        console.error('❌ [Webhook] Signature invalide:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
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
                }
                break;
            case 'payment_intent.payment_failed':
                console.log('❌ [Webhook] Paiement échoué:', event.data.object);
                break;
            default:
                console.log('⚠️ [Webhook] Événement non géré:', event.type);
        }
        res.json({ received: true });
    }
    catch (error) {
        console.error('❌ [Webhook] Erreur traitement:', error);
        res.status(500).json({ error: 'Erreur traitement webhook' });
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
export default router;
