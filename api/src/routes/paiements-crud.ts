import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { Paiements } from '../db/clients/paiements/paiements.js';
import { Magasin } from '../db/clients/magasin/magasin.js';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();

// Configuration Stripe pour ce module
let stripe: Stripe | null = null;
try {
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('4e')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }
} catch (error) {
  console.error('❌ [Paiements CRUD] Erreur initialisation Stripe:', error);
}

console.log('🔧 [Paiements CRUD] Module CRUD des paiements initialisé');

// GET - Obtenir tous les paiements
router.get('/', async (req, res) => {
  try {
    const paiements = new Paiements();
    const result = await paiements.obtenirLesTousLesPaiements();
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ [Paiements CRUD] Erreur GET /:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error });
  }
});

// POST - Créer un paiement pour une commande (route principale)
router.post('/', async (req, res) => {
  try {
    console.log('🛒 [Paiements CRUD] POST / - Création paiement commande:', req.body);
    
    const { amount, currency = 'eur', commande, utilisateur_id, description } = req.body;
    
    if (!stripe) {
      return res.status(503).json({ error: 'Service Stripe non disponible' });
    }

    const finalUserId = commande?.utilisateur_id || utilisateur_id;
    
    if (!finalUserId || !amount) {
      return res.status(400).json({ 
        error: 'utilisateur_id et amount requis',
        received: { utilisateur_id: finalUserId, amount }
      });
    }

    const montantEuros = parseFloat((amount / 100).toFixed(2));
    if (isNaN(montantEuros) || montantEuros <= 0) {
      return res.status(400).json({ 
        error: 'Montant invalide',
        debug: { amount, montantEuros }
      });
    }

    // Créer commande et PaymentIntent
    const paiements = new Paiements();
    const magasin = new Magasin();
    
    const total = commande?.total || montantEuros;
    const date = new Date().toISOString();
    
    // 1. Créer la commande
    const commandeResult = await magasin.creerCommande(
      finalUserId, 
      commande?.articles || [], 
      total, 
      date, 
      'en_attente'
    );
    
    if (!commandeResult.isConfirm) {
      throw new Error(`Erreur création commande: ${commandeResult.message}`);
    }
    
    // 2. Récupérer l'ID de commande
    let commandeId = (commandeResult as any).id || (commandeResult as any).insertId;
    if (!commandeId) {
      const commandeQuery = `
        SELECT id FROM commandes 
        WHERE utilisateur_id = ? 
          AND ABS(TIMESTAMPDIFF(SECOND, date_commande, ?)) <= 30
        ORDER BY date_commande DESC LIMIT 1
      `;
      const commandeResults = await paiements.queryAsync(commandeQuery, [finalUserId, date]);
      commandeId = commandeResults[0]?.id;
    }
    
    if (!commandeId) {
      throw new Error('Impossible de récupérer l\'ID de la commande créée');
    }

    // 3. Créer PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency,
      description: description || `Commande magasin #${commandeId}`,
      metadata: {
        utilisateur_id: finalUserId.toString(),
        commande_id: commandeId.toString(),
        type: 'commande_magasin',
        montant_euros: montantEuros.toString()
      },
      automatic_payment_methods: { enabled: true }
    });

    // 4. Enregistrer le paiement
    const paiementResult = await paiements.creerPaiement({
      commande_id: commandeId,
      utilisateur_id: finalUserId,
      montant: montantEuros,
      methode_paiement: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
      statut: 'en_attente',
      description: description || `Commande magasin #${commandeId}`
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      commandeId: commandeId,
      paiementId: paiementResult.id,
      metadata: {
        montant_euros: montantEuros,
        utilisateur_id: finalUserId,
        nb_articles: commande?.articles?.length || 0
      }
    });

  } catch (error: any) {
    console.error('❌ [Paiements CRUD] Erreur POST /:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du paiement',
      details: error.message
    });
  }
});

// POST - Créer un paiement générique
router.post('/create', async (req, res) => {
  try {
    const paiements = new Paiements();
    const result = await paiements.creerPaiement(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('❌ [Paiements CRUD] Erreur POST /create:', error);
    res.status(500).json({ message: 'Erreur lors de la création du paiement', error });
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
    console.error('❌ [Paiements CRUD] Erreur PUT /:id:', error);
    res.status(500).json({ message: 'Erreur lors de la modification du paiement', error });
  }
});

// PUT - Mettre à jour le statut d'un paiement avec retry anti-deadlock
router.put('/update-status', async (req, res) => {
  const { id, statut } = req.body;
  
  if (!id || !statut) {
    return res.status(400).json({ error: 'ID et statut requis' });
  }

  const maxRetries = 3;
  let retryCount = 0;

  try {
    const paiements = new Paiements();
    
    while (retryCount < maxRetries) {
      try {
        const result = await paiements.mettreAJourStatutPaiement(id, statut);
        console.log('✅ [Paiements CRUD] Statut mis à jour:', { id, statut });
        return res.status(200).json(result);
      } catch (error: any) {
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.random() * 1000 + (retryCount * 500);
          console.log(`⏳ [Paiements CRUD] Retry ${retryCount}/${maxRetries} dans ${delay.toFixed()}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
  } catch (error: any) {
    console.error('❌ [Paiements CRUD] Erreur update-status:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du paiement', 
      error: error.message,
      code: error.code 
    });
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
    console.error('❌ [Paiements CRUD] Erreur DELETE /:id:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du paiement', error });
  }
});

// POST - Simulation de paiement pour tests
router.post('/force-payment-success', async (req, res) => {
  try {
    const { paymentIntentId, echeanceId, commandeId, userId, amount, description } = req.body;

    console.log('🧪 [Paiements CRUD] Simulation paiement:', {
      paymentIntentId, echeanceId, commandeId, userId, amount,
      type: echeanceId ? 'échéance' : 'commande'
    });

    if (!paymentIntentId || !userId) {
      return res.status(400).json({ error: 'paymentIntentId et userId requis' });
    }

    if (!echeanceId && !commandeId) {
      return res.status(400).json({ error: 'echeanceId OU commandeId requis' });
    }

    const responseData = {
      success: true,
      message: `Paiement ${echeanceId ? 'échéance' : 'commande'} simulé avec succès`,
      data: {
        paymentIntentId,
        [echeanceId ? 'echeanceId' : 'commandeId']: echeanceId || commandeId,
        userId,
        amount,
        type: echeanceId ? 'echeance' : 'commande',
        status: 'succeeded'
      }
    };

    res.status(200).json(responseData);

  } catch (error: any) {
    console.error('❌ [Paiements CRUD] Erreur simulation:', error);
    res.status(500).json({
      error: 'Erreur lors de la simulation de paiement',
      details: error.message
    });
  }
});

console.log('✅ [Paiements CRUD] Routes CRUD chargées');

export default router;
