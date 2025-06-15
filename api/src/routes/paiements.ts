import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { Paiements } from '../db/clients/paiements/paiements.js';

dotenv.config();

const router = express.Router();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("La clé secrète Stripe est manquante dans le fichier .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});


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
