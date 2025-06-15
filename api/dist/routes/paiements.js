var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Paiements } from '../db/clients/paiements/paiements.js';
// Recréation de __dirname pour modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Charger le .env situé à la racine du projet
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
console.log(process.env.STRIPE_SECRET_KEY);
const router = express.Router();
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("La clé secrète Stripe est manquante dans le fichier .env");
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-02-24.acacia',
});
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Création d'une instance de Paiements
        let paiements = new Paiements();
        // Appel de la méthode pour obtenir les paiements
        let result = yield paiements.obtenirLesTousLesPaiements();
        // Envoi des résultats sous forme de JSON
        res.status(200).json(result); // Renvoie les paiements obtenus
    }
    catch (error) {
        console.error(error); // Affiche l'erreur dans la console
        res.status(500).json({ message: 'Erreur lors de la récupération des paiements', error }); // Envoie une réponse d'erreur
    }
}));
router.post('/paiements', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { amount, currency } = req.body;
    try {
        // Créer un Payment Intent
        const paymentIntent = yield stripe.paymentIntents.create({
            amount, // Le montant en centimes (par exemple, 10€ -> 1000)
            currency, // La devise, par exemple, "usd" ou "eur"
        });
        // Retourner les informations du Payment Intent
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
}));
// Utilisation de export default pour le routeur
export default router;
