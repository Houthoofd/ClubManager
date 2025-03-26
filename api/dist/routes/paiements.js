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
import Stripe from 'stripe'; // Correct importation de Stripe
const router = express.Router();
// Initialisation de Stripe avec votre clé secrète
const stripe = new Stripe('sk_test_51R6wB1AxYwLhmnM2JhR2XJ5lC9IdNinj649NWeSujB4GEgG1oAulYHAm1fMH8J7N8vLwttw4ytGFBUXxp2pWXL7r00qy1eP7zX', {
    apiVersion: '2025-02-24.acacia',
});
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
