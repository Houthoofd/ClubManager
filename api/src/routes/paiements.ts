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


router.post('/stripe', async (req, res) => {
  const { amount, currency } = req.body;
  
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentMethods: paymentIntent.payment_method_types,
    });
  } catch (error) {
    res.status(500).json({ error: error || error });
  }
});


/**
 * GET /paiements/echeances/:utilisateurId
 * Retourne les échéances de paiement pour un utilisateur donné
 */
router.get('/echeances/:utilisateurId', async (req: any, res: any) => {
  const utilisateurId = Number(req.params.utilisateurId);
  if (isNaN(utilisateurId)) {
    return res.status(400).json({ error: 'ID utilisateur invalide' });
  }
  try {
    const paiements = new Paiements();
    const result = await paiements.obtenirEcheancesPourUtilisateur(utilisateurId);
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des échéances', error });
  }
});

// Utilisation de export default pour le routeur
export default router;
