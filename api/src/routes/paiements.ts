import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

// Recréation de __dirname pour modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le .env situé à la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log(process.env.STRIPE_SECRET_KEY)

const router = express.Router();

// Toutes les routes de paiement nécessitent une authentification
router.use(verifyToken);


if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("La clé secrète Stripe est manquante dans le fichier .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

// GET - Obtenir tous les paiements
router.get('/', async (req, res) => {
  try {
    // Création d'une instance de Paiements
    let paiements = new Paiements();
    
    // Appel de la méthode pour obtenir les paiements
    let result = await paiements.obtenirLesTousLesPaiements();
    
    // Envoi des résultats sous forme de JSON
    res.status(200).json(result);  // Renvoie les paiements obtenus

  } catch (error) {
    console.error(error);  // Affiche l'erreur dans la console
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error });  // Envoie une réponse d'erreur
  }
});

// POST - Créer un paiement générique
router.post('/', async (req, res) => {
  try {
    const paiements = new Paiements();
    const result = await paiements.creerPaiement(req.body);
    res.status(201).json(result);
  } catch (error) {
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
      confirmation_method: 'automatic',
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pages/magasin/success`,
      metadata: {
        utilisateur_id: finalUserId.toString(),
        commande_data: JSON.stringify(commande)
      }
    });

    console.log('PaymentIntent créé:', paymentIntent.id);

    const paiements = new Paiements();
    
    // 1. Créer la commande en base de données
    const commandeId = await paiements.creerCommande(finalUserId, commande.articles);
    
    // 2. Enregistrer le paiement avec l'ID de commande réel
    const paiementResult = await paiements.creerPaiement({
      commande_id: commandeId,
      utilisateur_id: finalUserId,
      montant: amount / 100,
      methode_paiement: 'bancontact',
      stripe_payment_intent_id: paymentIntent.id,
      statut: 'en_attente'
    }) as { id: number; [key: string]: any };

    console.log('Commande et paiement créés:', { commandeId, paiementId: paiementResult.id });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      commandeId: commandeId
    });
  } catch (error) {
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
    
    // Enregistrer le paiement en base
    const paiements = new Paiements();
    await paiements.creerPaiement({
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
  } catch (error) {
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
    
    // Enregistrer le paiement en base
    const paiements = new Paiements();
    const result = await paiements.creerPaiement({
      commande_id: commande?.id,
      montant: amountBTC,
      methode_paiement: 'bitcoin',
      bitcoin_address: bitcoinAddress,
      statut: 'en_attente'
    }) as { id: number; [key: string]: any };

    res.status(200).json({
      bitcoinAddress,
      amount: amountBTC,
      qrCode: `bitcoin:${bitcoinAddress}?amount=${amountBTC}`,
      paiementId: result.id
    });
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du paiement', error });
  }
});

// Webhook Stripe pour confirmer les paiements
router.post('/webhook/stripe', 
  express.json({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = req.body;
      console.log('Webhook reçu:', event.type);
      
    } catch (err: any) {
      console.log(`Webhook parsing failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Gérer l'événement
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        try {
          const paiements = new Paiements();
          
          // 1. Confirmer le paiement en base
          await paiements.confirmerPaiementStripe(paymentIntent.id, 'reussi');
          
          // 2. Traiter la commande associée
          await paiements.traiterCommandeApresPayment(paymentIntent.id);
          
          console.log('Paiement confirmé et commande traitée:', paymentIntent.id);
        } catch (error) {
          console.error('Erreur lors de la confirmation du paiement:', error);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        
        try {
          const paiements = new Paiements();
          await paiements.confirmerPaiementStripe(failedPayment.id, 'echec');
          console.log('Paiement échoué:', failedPayment.id);
        } catch (error) {
          console.error('Erreur lors de la mise à jour du paiement échoué:', error);
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

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
  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement de test:', error);
    res.status(500).json({ error: error });
  }
});

// Utilisation de export default pour le routeur
export default router;
