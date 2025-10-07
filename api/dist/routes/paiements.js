import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { verifyToken } from '../middleware/auth.js';
// Recréation de __dirname pour modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Charger le .env situé à la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
console.log(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
// Toutes les routes de paiement nécessitent une authentification
router.use(verifyToken);
// Vérification améliorée de la configuration Stripe au démarrage
console.log('🔧 [Paiements] Configuration Stripe:');
console.log('  - STRIPE_SECRET_KEY présente:', !!process.env.STRIPE_SECRET_KEY);
console.log('  - STRIPE_SECRET_KEY préfixe:', process.env.STRIPE_SECRET_KEY?.substring(0, 12) + '...');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'development');
if (!process.env.STRIPE_SECRET_KEY) {
    console.error("❌ La clé secrète Stripe est manquante dans le fichier .env");
    throw new Error("La clé secrète Stripe est manquante dans le fichier .env");
}
// Vérifier que la clé n'est pas expirée avant d'initialiser Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (stripeSecretKey.includes('4e') && stripeSecretKey.includes('p7dc')) {
    console.error("❌ Clé Stripe expirée détectée! Veuillez mettre à jour STRIPE_SECRET_KEY dans .env");
    throw new Error("Clé Stripe expirée - Veuillez mettre à jour la configuration");
}
const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-02-24.acacia',
});
// Test de connectivité Stripe au démarrage
stripe.balance.retrieve()
    .then(() => {
    console.log('✅ [Paiements] Connexion Stripe validée avec succès');
})
    .catch((error) => {
    console.error('❌ [Paiements] Erreur de connexion Stripe:', error.message);
    console.error('❌ [Paiements] Type d\'erreur:', error.type);
});
// GET - Obtenir tous les paiements
router.get('/', async (req, res) => {
    try {
        // Création d'une instance de Paiements
        let paiements = new Paiements();
        // Appel de la méthode pour obtenir les paiements
        let result = await paiements.obtenirLesTousLesPaiements();
        // Envoi des résultats sous forme de JSON
        res.status(200).json(result); // Renvoie les paiements obtenus
    }
    catch (error) {
        console.error(error); // Affiche l'erreur dans la console
        res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error }); // Envoie une réponse d'erreur
    }
});
// POST - Créer un paiement générique
router.post('/', async (req, res) => {
    try {
        const paiements = new Paiements();
        const result = await paiements.creerPaiement(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la création du paiement', error });
    }
});
// POST - Paiement Bancontact via Stripe
router.post('/bancontact', async (req, res) => {
    const { amount, currency = 'eur', commande, utilisateur_id } = req.body;
    console.log('Données reçues pour paiement Bancontact:', req.body);
    // Extraire l'utilisateur_id en priorité depuis la commande, puis depuis les données directes
    const finalUserId = commande?.utilisateur_id || utilisateur_id;
    console.log('utilisateur_id extrait:', finalUserId);
    if (!finalUserId) {
        return res.status(400).json({
            error: 'utilisateur_id manquant. Veuillez vous reconnecter.'
        });
    }
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['bancontact'],
            // Supprimer return_url et confirmation_method pour créer d'abord le PaymentIntent
            metadata: {
                utilisateur_id: finalUserId.toString(),
                commande_data: JSON.stringify(commande)
            }
        });
        console.log('PaymentIntent créé:', paymentIntent.id);
        const paiements = new Paiements();
        // 1. Créer la commande en base de données
        const commandeId = await paiements.creerCommande(finalUserId, commande.articles);
        // 2. Enregistrer le paiement avec l'ID de commande réel - CORRIGÉ
        const paiementResult = await paiements.creerPaiement({
            commande_id: commandeId,
            utilisateur_id: finalUserId,
            montant: amount / 100,
            methode_paiement: 'bancontact',
            stripe_payment_intent_id: paymentIntent.id,
            statut: 'en_attente'
        });
        console.log('Commande et paiement créés:', {
            commandeId,
            paiementId: paiementResult.data?.id
        });
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            commandeId: commandeId
        });
    }
    catch (error) {
        console.error('Erreur Bancontact:', error);
        res.status(500).json({ error: error || 'Erreur lors du paiement Bancontact' });
    }
});
// POST - Paiement PayPal
router.post('/paypal', async (req, res) => {
    const { totalAmount, userId, commande } = req.body;
    try {
        // Ici vous intégreriez l'API PayPal
        // Pour l'exemple, on simule une URL de redirection
        const paypalOrderId = `PAYPAL_${Date.now()}`;
        // Enregistrer le paiement en base - CORRIGÉ
        const paiements = new Paiements();
        const result = await paiements.creerPaiement({
            commande_id: commande?.id,
            utilisateur_id: userId,
            montant: totalAmount / 100,
            methode_paiement: 'paypal',
            paypal_order_id: paypalOrderId,
            statut: 'en_attente'
        });
        res.status(200).json({
            url: `https://www.sandbox.paypal.com/checkoutnow?token=${paypalOrderId}`,
            orderId: paypalOrderId
        });
    }
    catch (error) {
        console.error('Erreur PayPal:', error);
        res.status(500).json({ error: 'Erreur lors du paiement PayPal' });
    }
});
// POST - Paiement Bitcoin
router.post('/bitcoin', async (req, res) => {
    const { sats, commande } = req.body;
    try {
        // Ici vous intégreriez une API Bitcoin (Lightning Network, etc.)
        const bitcoinAddress = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'; // Exemple
        const amountBTC = sats * 100000000; // Conversion sats vers BTC
        // Enregistrer le paiement en base - CORRIGÉ
        const paiements = new Paiements();
        const result = await paiements.creerPaiement({
            commande_id: commande?.id,
            montant: amountBTC,
            methode_paiement: 'bitcoin',
            bitcoin_address: bitcoinAddress,
            statut: 'en_attente'
        });
        res.status(200).json({
            bitcoinAddress,
            amount: amountBTC,
            qrCode: `bitcoin:${bitcoinAddress}?amount=${amountBTC}`,
            paiementId: result.data?.id
        });
    }
    catch (error) {
        console.error('Erreur Bitcoin:', error);
        res.status(500).json({ error: 'Erreur lors du paiement Bitcoin' });
    }
});
// PUT - Modifier un paiement
router.put('/:id', async (req, res) => {
    const paiementId = Number(req.params.id);
    if (isNaN(paiementId)) {
        return res.status(400).json({ error: 'ID paiement invalide' });
    }
    try {
        const paiements = new Paiements();
        const result = await paiements.modifierPaiement(paiementId, req.body);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la modification du paiement', error });
    }
});
// PUT - Mettre à jour le statut d'un paiement
router.put('/update', async (req, res) => {
    const { id, statut } = req.body;
    if (!id || !statut) {
        return res.status(400).json({ error: 'ID et statut requis' });
    }
    try {
        const paiements = new Paiements();
        const result = await paiements.mettreAJourStatutPaiement(id, statut);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du paiement', error });
    }
});
// DELETE - Supprimer un paiement
router.delete('/:id', async (req, res) => {
    const paiementId = Number(req.params.id);
    if (isNaN(paiementId)) {
        return res.status(400).json({ error: 'ID paiement invalide' });
    }
    try {
        const paiements = new Paiements();
        const result = await paiements.supprimerPaiement(paiementId);
        res.status(200).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression du paiement', error });
    }
});
// CORRIGÉ: Route pour confirmer un paiement avec debug complet de l'échéance
router.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId, echeanceId, userId, amount } = req.body;
        console.log('🎉 [Paiements] Confirmation paiement échéance:', {
            paymentIntentId,
            echeanceId,
            userId,
            amount
        });
        if (!paymentIntentId || !echeanceId || !userId) {
            return res.status(400).json({
                error: 'PaymentIntent ID, échéance ID et utilisateur ID requis'
            });
        }
        const paiements = new Paiements();
        // 1. Vérifier le paiement sur Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                error: 'Le paiement n\'a pas été confirmé sur Stripe'
            });
        }
        // 2. Vérifier si c'est le premier paiement AVANT de confirmer
        const premierPaiement = await paiements.estPremierPaiement(parseInt(userId));
        console.log(`🔍 [Paiements] Premier paiement pour utilisateur ${userId}: ${premierPaiement}`);
        // 3. Mettre à jour le statut du paiement en base
        await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');
        // 4. FORCER la mise à jour de l'échéance avec l'ID reçu du frontend ET debug complet
        console.log(`🎯 [Paiements] === DÉBUT MISE À JOUR ÉCHÉANCE ===`);
        console.log(`🎯 [Paiements] Échéance ID: ${echeanceId} (type: ${typeof echeanceId})`);
        console.log(`🎯 [Paiements] Utilisateur ID: ${userId} (type: ${typeof userId})`);
        // Vérifier d'abord que l'échéance existe avant de la mettre à jour
        const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
        console.log(`🔍 [Paiements] Toutes les échéances de l'utilisateur ${userId}:`, echeances.map(e => ({ id: e.id, statut: e.statut, montant: e.montant })));
        const echeanceCible = echeances.find(e => e.id === parseInt(echeanceId));
        console.log(`🎯 [Paiements] Échéance cible trouvée:`, echeanceCible);
        if (!echeanceCible) {
            console.error(`❌ [Paiements] ÉCHÉANCE ${echeanceId} NON TROUVÉE dans la liste des échéances de l'utilisateur ${userId}`);
            return res.status(404).json({
                error: `Échéance ${echeanceId} non trouvée pour cet utilisateur`,
                debug: {
                    echeanceId,
                    userId,
                    echeancesDisponibles: echeances.map(e => e.id)
                }
            });
        }
        console.log(`🎯 [Paiements] Mise à jour FORCÉE de l'échéance ${echeanceId} pour l'utilisateur ${userId}`);
        const echeanceResult = await paiements.marquerEcheancePayee(parseInt(echeanceId), parseInt(userId));
        console.log(`🎯 [Paiements] Résultat mise à jour échéance:`, echeanceResult);
        if (echeanceResult.isConfirm) {
            console.log(`✅ [Paiements] Échéance ${echeanceId} marquée comme payée avec succès`);
        }
        else {
            console.error(`❌ [Paiements] Échéance ${echeanceId} NON mise à jour: ${echeanceResult.message}`);
        }
        // 5. Vérifier après coup que la mise à jour a fonctionné
        const echeancesApres = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
        const echeanceApres = echeancesApres.find(e => e.id === parseInt(echeanceId));
        console.log(`🔍 [Paiements] État de l'échéance APRÈS mise à jour:`, echeanceApres);
        console.log(`🎯 [Paiements] === FIN MISE À JOUR ÉCHÉANCE ===`);
        // 6. Créer un enregistrement de paiement d'échéance
        const enregistrementResult = await paiements.enregistrerPaiementEcheance({
            echeance_id: parseInt(echeanceId),
            utilisateur_id: parseInt(userId),
            montant: amount,
            stripe_payment_intent_id: paymentIntentId,
            date_paiement: new Date(),
            statut: 'confirme'
        });
        console.log('✅ [Paiements] Processus de confirmation terminé pour échéance:', echeanceId);
        // 7. Message de succès adapté selon le statut
        let successMessage = 'Paiement confirmé et échéance mise à jour';
        if (premierPaiement) {
            successMessage += '. 🎉 Félicitations pour votre premier paiement ! Votre statut a été automatiquement mis à jour de "visiteur" vers "utilisateur".';
        }
        res.status(200).json({
            success: true,
            message: successMessage,
            echeance_id: echeanceId,
            payment_intent_id: paymentIntentId,
            enregistrement_id: enregistrementResult.data?.id,
            premier_paiement: premierPaiement,
            statut_upgrade: premierPaiement ? 'visiteur → utilisateur' : null,
            echeance_mise_a_jour: echeanceResult.isConfirm,
            debug: {
                echeanceAvant: echeanceCible,
                echeanceApres: echeanceApres,
                updateResult: echeanceResult
            }
        });
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur confirmation paiement:', error);
        res.status(500).json({
            error: 'Erreur lors de la confirmation du paiement',
            details: error.message
        });
    }
});
// Webhook Stripe pour confirmer les paiements - AMÉLIORÉ avec récupération des metadata
router.post('/webhook/stripe', express.json({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = req.body;
        console.log('🔔 [Webhook] Stripe - Événement reçu:', event.type);
        console.log('🔔 [Webhook] PaymentIntent ID:', event.data?.object?.id);
    }
    catch (err) {
        console.log(`❌ [Webhook] Parsing failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Gérer l'événement
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('🎉 [Webhook] PaymentIntent réussi:', {
                id: paymentIntent.id,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                metadata: paymentIntent.metadata
            });
            try {
                const paiements = new Paiements();
                // 1. Récupérer l'échéance depuis les metadata Stripe
                const echeanceId = paymentIntent.metadata?.echeance_id;
                const userId = paymentIntent.metadata?.utilisateur_id;
                console.log('🔍 [Webhook] Metadata extraites:', { echeanceId, userId });
                // 2. Confirmer le paiement en base (cela déclenchera toutes les mises à jour)
                const confirmationResult = await paiements.confirmerPaiementStripe(paymentIntent.id, 'reussi');
                if (confirmationResult.isConfirm) {
                    console.log('✅ [Webhook] Paiement confirmé:', paymentIntent.id);
                    // 3. Si on a l'échéance et l'utilisateur dans les metadata, forcer la mise à jour
                    if (echeanceId && userId) {
                        console.log(`🎯 [Webhook] Mise à jour FORCÉE de l'échéance ${echeanceId} pour l'utilisateur ${userId}`);
                        try {
                            const echeanceResult = await paiements.marquerEcheancePayee(parseInt(echeanceId), parseInt(userId));
                            if (echeanceResult.isConfirm) {
                                console.log(`✅ [Webhook] Échéance ${echeanceId} marquée comme payée via webhook`);
                            }
                            else {
                                console.error(`❌ [Webhook] Échéance ${echeanceId} NON mise à jour: ${echeanceResult.message}`);
                            }
                        }
                        catch (echeanceError) {
                            console.error(`❌ [Webhook] Erreur mise à jour échéance ${echeanceId}:`, echeanceError.message);
                        }
                    }
                    else {
                        console.warn('⚠️ [Webhook] Pas d\'échéance dans les metadata - mise à jour automatique seulement');
                    }
                    // 4. Traiter la commande associée si elle existe
                    try {
                        await paiements.traiterCommandeApresPayment(paymentIntent.id);
                        console.log('📦 [Webhook] Commande traitée si applicable');
                    }
                    catch (commandeError) {
                        console.warn('⚠️ [Webhook] Pas de commande à traiter ou erreur:', commandeError.message);
                    }
                }
                else {
                    console.warn('⚠️ [Webhook] Confirmation du paiement échouée:', confirmationResult.message);
                }
            }
            catch (error) {
                console.error('❌ [Webhook] Erreur lors de la confirmation du paiement:', error);
            }
            break;
        case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log('❌ [Webhook] PaymentIntent échoué:', {
                id: failedPayment.id,
                last_payment_error: failedPayment.last_payment_error
            });
            try {
                const paiements = new Paiements();
                await paiements.confirmerPaiementStripe(failedPayment.id, 'echec');
                console.log('📝 [Webhook] Paiement marqué comme échoué:', failedPayment.id);
            }
            catch (error) {
                console.error('❌ [Webhook] Erreur lors de la mise à jour du paiement échoué:', error);
            }
            break;
        case 'payment_intent.requires_action':
            const actionRequired = event.data.object;
            console.log('⏳ [Webhook] Action requise pour PaymentIntent:', {
                id: actionRequired.id,
                next_action: actionRequired.next_action?.type
            });
            break;
        case 'payment_intent.processing':
            const processing = event.data.object;
            console.log('🔄 [Webhook] PaymentIntent en cours de traitement:', processing.id);
            break;
        default:
            console.log(`❓ [Webhook] Événement non géré: ${event.type}`);
    }
    res.json({ received: true });
});
// Route pour simuler le succès d'un paiement de test
router.post('/test/confirm-payment', async (req, res) => {
    const { paymentIntentId } = req.body;
    try {
        const paiements = new Paiements();
        // Confirmer le paiement de test
        await paiements.confirmerPaiementStripe(paymentIntentId, 'reussi');
        // Traiter la commande
        await paiements.traiterCommandeApresPayment(paymentIntentId);
        res.status(200).json({
            success: true,
            message: 'Paiement de test confirmé et commande traitée'
        });
    }
    catch (error) {
        console.error('Erreur lors de la confirmation du paiement de test:', error);
        res.status(500).json({ error: error });
    }
});
// Endpoint pour récupérer les échéances de paiement d'un utilisateur
router.get('/echeances/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`🔍 [Route] GET /echeances/${userId} - Début traitement`);
        if (!userId || isNaN(parseInt(userId))) {
            console.error(`❌ [Route] ID utilisateur invalide: ${userId}`);
            return res.status(400).json({ message: 'ID utilisateur invalide' });
        }
        const client = new Paiements();
        console.log(`🔍 [Route] Appel de obtenirEcheancesUtilisateur(${userId})`);
        const echeances = await client.obtenirEcheancesUtilisateur(parseInt(userId));
        console.log(`🔍 [Route] Résultat de obtenirEcheancesUtilisateur:`, echeances);
        console.log(`🔍 [Route] Type:`, typeof echeances, 'Array?', Array.isArray(echeances));
        console.log(`🔍 [Route] Longueur:`, echeances?.length);
        if (!echeances || echeances.length === 0) {
            console.log(`⚠️ [Route] Aucune échéance trouvée pour l'utilisateur ${userId}, retour tableau vide`);
            return res.status(200).json([]); // Retourner un tableau vide plutôt qu'une 404
        }
        console.log(`✅ [Route] Retour de ${echeances.length} échéances pour l'utilisateur ${userId}`);
        res.status(200).json(echeances);
    }
    catch (error) {
        console.error('❌ [Route] Erreur lors de la récupération des échéances:', error);
        console.error('❌ [Route] Stack trace:', error.stack);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des échéances' });
    }
});
// NOUVEAU: Route pour récupérer une échéance spécifique par ID avec gestion améliorée
router.get('/echeance/:echeanceId', async (req, res) => {
    try {
        const { echeanceId } = req.params;
        const userId = req.query.userId;
        console.log(`🔍 [Paiements] Récupération échéance ${echeanceId} pour utilisateur ${userId}`);
        if (!echeanceId || isNaN(parseInt(echeanceId))) {
            return res.status(400).json({
                error: 'ID échéance invalide',
                echeanceId: echeanceId
            });
        }
        const paiements = new Paiements();
        // Si userId fourni, vérifier que l'échéance appartient à cet utilisateur
        if (userId && !isNaN(parseInt(userId))) {
            const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
            const echeance = echeances.find((e) => e.id === parseInt(echeanceId));
            console.log(`🔍 [Paiements] Échéances trouvées pour utilisateur ${userId}: ${echeances.length}`);
            console.log(`🔍 [Paiements] Échéance cible:`, echeance);
            if (!echeance) {
                return res.status(404).json({
                    error: 'Échéance non trouvée',
                    debug: {
                        echeanceId: parseInt(echeanceId),
                        userId: parseInt(userId),
                        echeancesDisponibles: echeances.map((e) => ({ id: e.id, montant: e.montant, statut: e.statut }))
                    }
                });
            }
            return res.status(200).json({
                success: true,
                data: echeance
            });
        }
        else {
            // Si pas d'userId, chercher l'échéance directement
            try {
                const query = `SELECT * FROM echeances_paiements WHERE id = ?`;
                const results = await paiements.queryAsync(query, [parseInt(echeanceId)]);
                if (results.length === 0) {
                    return res.status(404).json({
                        error: 'Échéance non trouvée',
                        debug: {
                            echeanceId: parseInt(echeanceId),
                            userId: null,
                            message: 'Aucune échéance trouvée avec cet ID'
                        }
                    });
                }
                const echeance = results[0];
                console.log(`🔍 [Paiements] Échéance trouvée directement:`, echeance);
                return res.status(200).json({
                    success: true,
                    data: {
                        ...echeance,
                        description: `Cotisation mensuelle - ${new Date(echeance.date_echeance).toLocaleDateString('fr-FR')}`
                    }
                });
            }
            catch (dbError) {
                console.error(`❌ [Paiements] Erreur DB lors de la recherche directe:`, dbError);
                return res.status(500).json({
                    error: 'Erreur lors de la recherche de l\'échéance',
                    details: dbError.message
                });
            }
        }
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur récupération échéance:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération de l\'échéance',
            details: error.message
        });
    }
});
// NOUVEAU: Route pour récupérer toutes les échéances (admin)
router.get('/echeances', async (req, res) => {
    try {
        const { limit = 50, offset = 0, statut, utilisateur_id } = req.query;
        console.log(`🔍 [Paiements] Récupération toutes les échéances - Limit: ${limit}, Offset: ${offset}`);
        const paiements = new Paiements();
        let query = `
      SELECT 
        ep.*,
        u.first_name,
        u.last_name,
        u.email,
        pt.nom_plan
      FROM echeances_paiements ep
      LEFT JOIN utilisateurs u ON ep.utilisateur_id = u.id
      LEFT JOIN plans_tarifaires pt ON ep.abonnement_id = pt.id
      WHERE 1=1
    `;
        const params = [];
        if (statut) {
            query += ` AND ep.statut = ?`;
            params.push(statut);
        }
        if (utilisateur_id) {
            query += ` AND ep.utilisateur_id = ?`;
            params.push(parseInt(utilisateur_id));
        }
        query += ` ORDER BY ep.date_echeance DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));
        const results = await paiements.queryAsync(query, params);
        // Compter le total pour la pagination
        let countQuery = `
      SELECT COUNT(*) as total
      FROM echeances_paiements ep
      WHERE 1=1
    `;
        const countParams = [];
        if (statut) {
            countQuery += ` AND ep.statut = ?`;
            countParams.push(statut);
        }
        if (utilisateur_id) {
            countQuery += ` AND ep.utilisateur_id = ?`;
            countParams.push(parseInt(utilisateur_id));
        }
        const countResult = await paiements.queryAsync(countQuery, countParams);
        const total = countResult[0]?.total || 0;
        console.log(`✅ [Paiements] ${results.length} échéances récupérées sur ${total} total`);
        res.status(200).json({
            success: true,
            data: results,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: (parseInt(offset) + parseInt(limit)) < total
            }
        });
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur récupération toutes les échéances:', error);
        res.status(500).json({
            error: 'Erreur lors de la récupération des échéances',
            details: error.message
        });
    }
});
// NOUVEAU: Route pour créer une nouvelle échéance
router.post('/echeances', async (req, res) => {
    try {
        const { utilisateur_id, abonnement_id, montant, date_echeance, statut = 'en attente' } = req.body;
        console.log(`📝 [Paiements] Création nouvelle échéance:`, req.body);
        if (!utilisateur_id || !montant || !date_echeance) {
            return res.status(400).json({
                error: 'Données manquantes',
                required: ['utilisateur_id', 'montant', 'date_echeance']
            });
        }
        const paiements = new Paiements();
        const query = `
      INSERT INTO echeances_paiements 
      (utilisateur_id, abonnement_id, montant, date_echeance, statut)
      VALUES (?, ?, ?, ?, ?)
    `;
        const results = await paiements.queryAsync(query, [
            utilisateur_id,
            abonnement_id || null,
            montant,
            date_echeance,
            statut
        ]);
        console.log(`✅ [Paiements] Échéance créée avec ID: ${results.insertId}`);
        // Récupérer l'échéance créée
        const echeanceCreee = await paiements.queryAsync(`SELECT * FROM echeances_paiements WHERE id = ?`, [results.insertId]);
        res.status(201).json({
            success: true,
            message: 'Échéance créée avec succès',
            data: echeanceCreee[0]
        });
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur création échéance:', error);
        res.status(500).json({
            error: 'Erreur lors de la création de l\'échéance',
            details: error.message
        });
    }
});
// NOUVEAU: Route pour mettre à jour une échéance
router.put('/echeance/:echeanceId', async (req, res) => {
    try {
        const { echeanceId } = req.params;
        const updates = req.body;
        console.log(`📝 [Paiements] Mise à jour échéance ${echeanceId}:`, updates);
        if (!echeanceId || isNaN(parseInt(echeanceId))) {
            return res.status(400).json({
                error: 'ID échéance invalide'
            });
        }
        const paiements = new Paiements();
        // Vérifier que l'échéance existe
        const existingEcheance = await paiements.queryAsync(`SELECT * FROM echeances_paiements WHERE id = ?`, [parseInt(echeanceId)]);
        if (existingEcheance.length === 0) {
            return res.status(404).json({
                error: 'Échéance non trouvée'
            });
        }
        // Construire la requête de mise à jour dynamiquement
        const allowedFields = ['montant', 'date_echeance', 'statut', 'date_paiement'];
        const updateFields = [];
        const updateValues = [];
        Object.keys(updates).forEach(field => {
            if (allowedFields.includes(field) && updates[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                updateValues.push(updates[field]);
            }
        });
        if (updateFields.length === 0) {
            return res.status(400).json({
                error: 'Aucun champ valide à mettre à jour',
                allowedFields
            });
        }
        updateValues.push(parseInt(echeanceId));
        const updateQuery = `
      UPDATE echeances_paiements 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
        const results = await paiements.queryAsync(updateQuery, updateValues);
        if (results.affectedRows === 0) {
            return res.status(404).json({
                error: 'Échéance non trouvée ou non modifiée'
            });
        }
        // Récupérer l'échéance mise à jour
        const echeanceMiseAJour = await paiements.queryAsync(`SELECT * FROM echeances_paiements WHERE id = ?`, [parseInt(echeanceId)]);
        console.log(`✅ [Paiements] Échéance ${echeanceId} mise à jour avec succès`);
        res.status(200).json({
            success: true,
            message: 'Échéance mise à jour avec succès',
            data: echeanceMiseAJour[0]
        });
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur mise à jour échéance:', error);
        res.status(500).json({
            error: 'Erreur lors de la mise à jour de l\'échéance',
            details: error.message
        });
    }
});
// NOUVEAU: Route pour supprimer une échéance
router.delete('/echeance/:echeanceId', async (req, res) => {
    try {
        const { echeanceId } = req.params;
        console.log(`🗑️ [Paiements] Suppression échéance ${echeanceId}`);
        if (!echeanceId || isNaN(parseInt(echeanceId))) {
            return res.status(400).json({
                error: 'ID échéance invalide'
            });
        }
        const paiements = new Paiements();
        // Vérifier que l'échéance existe et n'est pas déjà payée
        const existingEcheance = await paiements.queryAsync(`SELECT * FROM echeances_paiements WHERE id = ?`, [parseInt(echeanceId)]);
        if (existingEcheance.length === 0) {
            return res.status(404).json({
                error: 'Échéance non trouvée'
            });
        }
        if (existingEcheance[0].statut === 'payé') {
            return res.status(400).json({
                error: 'Impossible de supprimer une échéance déjà payée'
            });
        }
        const results = await paiements.queryAsync(`DELETE FROM echeances_paiements WHERE id = ?`, [parseInt(echeanceId)]);
        console.log(`✅ [Paiements] Échéance ${echeanceId} supprimée avec succès`);
        res.status(200).json({
            success: true,
            message: 'Échéance supprimée avec succès'
        });
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur suppression échéance:', error);
        res.status(500).json({
            error: 'Erreur lors de la suppression de l\'échéance',
            details: error.message
        });
    }
});
// CORRIGÉ: Configuration Stripe PaymentIntent avec gestion d'erreur DB améliorée
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency = 'eur', echeanceId, userId, description } = req.body;
        console.log('🏦 [Paiements] Création PaymentIntent pour échéance:', {
            amount,
            currency,
            echeanceId,
            userId,
            description
        });
        if (!amount || !echeanceId || !userId) {
            return res.status(400).json({
                error: 'Montant, échéance ID et utilisateur ID requis'
            });
        }
        // Vérifier que l'échéance existe et appartient bien à l'utilisateur
        const paiements = new Paiements();
        const echeances = await paiements.obtenirEcheancesUtilisateur(parseInt(userId));
        const echeance = echeances.find((e) => e.id === parseInt(echeanceId));
        if (!echeance) {
            return res.status(404).json({
                error: 'Échéance non trouvée ou non autorisée'
            });
        }
        if (echeance.statut === 'payé') {
            return res.status(400).json({
                error: 'Cette échéance est déjà payée'
            });
        }
        try {
            console.log('🔧 [Paiements] Création PaymentIntent avec configuration corrigée...');
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount), // Montant en centimes
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
            console.log('✅ [Paiements] PaymentIntent créé avec succès:', paymentIntent.id);
            // Enregistrer le paiement avec gestion d'erreur gracieuse
            try {
                const paiementResult = await paiements.creerPaiement({
                    utilisateur_id: parseInt(userId),
                    montant: amount / 100, // Conversion centimes vers euros
                    methode_paiement: 'stripe',
                    stripe_payment_intent_id: paymentIntent.id,
                    statut: 'en_attente',
                    echeance_id: parseInt(echeanceId),
                    description: description || `Paiement échéance #${echeanceId}`
                });
                console.log('💾 [Paiements] Paiement enregistré en base:', paiementResult.data?.id);
                res.status(200).json({
                    client_secret: paymentIntent.client_secret,
                    payment_intent_id: paymentIntent.id,
                    paiement_id: paiementResult.data?.id
                });
            }
            catch (dbError) {
                console.error('❌ [Paiements] Erreur DB lors de l\'enregistrement:', dbError.message);
                // Même si l'enregistrement en DB échoue, on retourne le PaymentIntent créé
                console.warn('⚠️ [Paiements] PaymentIntent créé mais non enregistré en DB - paiement possible');
                res.status(200).json({
                    client_secret: paymentIntent.client_secret,
                    payment_intent_id: paymentIntent.id,
                    paiement_id: null,
                    warning: 'PaymentIntent créé mais erreur d\'enregistrement en base'
                });
            }
        }
        catch (stripeError) {
            // Gestion spécifique des erreurs Stripe avec logs détaillés
            console.error('❌ [Paiements] Erreur Stripe détaillée:', {
                type: stripeError.type,
                code: stripeError.code,
                message: stripeError.message,
                statusCode: stripeError.statusCode,
                requestId: stripeError.requestId
            });
            if (stripeError.type === 'StripeInvalidRequestError') {
                console.error('❌ [Paiements] Erreur de configuration Stripe - Paramètres invalides');
                return res.status(400).json({
                    error: 'Configuration de paiement invalide',
                    details: stripeError.message,
                    stripe_error: stripeError.code || 'invalid_request',
                    suggestion: 'Vérifiez la configuration des méthodes de paiement'
                });
            }
            else if (stripeError.type === 'StripeAuthenticationError') {
                console.error('❌ [Paiements] Problème d\'authentification Stripe - vérifiez la clé API');
                return res.status(503).json({
                    error: 'Service de paiement temporairement indisponible - Problème d\'authentification',
                    details: 'Clé API Stripe invalide ou expirée',
                    stripe_error: stripeError.code,
                    fallback_available: true
                });
            }
            else if (stripeError.type === 'StripeConnectionError') {
                console.error('❌ [Paiements] Problème de connexion réseau avec Stripe');
                return res.status(503).json({
                    error: 'Service de paiement temporairement indisponible - Problème de connexion',
                    details: 'Impossible de joindre les serveurs Stripe',
                    stripe_error: stripeError.code,
                    fallback_available: true
                });
            }
            else {
                console.error('❌ [Paiements] Autre erreur Stripe:', stripeError);
                return res.status(500).json({
                    error: 'Erreur du service de paiement Stripe',
                    details: stripeError.message,
                    stripe_error: stripeError.code || 'unknown',
                    stripe_type: stripeError.type || 'unknown'
                });
            }
        }
    }
    catch (error) {
        console.error('❌ [Paiements] Erreur générale création PaymentIntent:', error);
        console.error('❌ [Paiements] Stack trace:', error.stack);
        res.status(500).json({
            error: 'Erreur lors de la création du PaymentIntent',
            details: error.message
        });
    }
});
// Utilisation de export default pour le routeur
export default router;
