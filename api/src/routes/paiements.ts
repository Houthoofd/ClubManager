import express from 'express';
import Stripe from 'stripe';  // Correct importation de Stripe
import { Informations } from '../db/clients/informations/informations.js';

const router = express.Router();

// Initialisation de Stripe avec votre clé secrète
const stripe = new Stripe('sk_test_51R6wB1AxYwLhmnM2JhR2XJ5lC9IdNinj649NWeSujB4GEgG1oAulYHAm1fMH8J7N8vLwttw4ytGFBUXxp2pWXL7r00qy1eP7zX', {
  apiVersion: '2025-02-24.acacia',
});

router.post('/paiements', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    // Créer un Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // Le montant en centimes (par exemple, 10€ -> 1000)
      currency, // La devise, par exemple, "usd" ou "eur"
    });

    // Retourner les informations du Payment Intent
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// Utilisation de export default pour le routeur
export default router;
