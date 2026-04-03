/**
 * Routes de confirmation de paiement
 */

import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  confirmPayment,
  confirmPaymentCommande,
  debugTableStructure,
  health,
} from "./core/index.js";

const router = express.Router();

console.log("🔧 [Confirmation] Module confirmation initialisé");

// Route de santé (publique)
router.get("/health", health);

// Route de debug (publique pour le développement)
router.get("/debug/table-structure", debugTableStructure);

// Middleware pour vérifier l'authentification sur les routes de paiement
// Note: Les webhooks Stripe ne passent pas par ce middleware
router.use(verifyToken);

// Routes de confirmation de paiement
router.post("/confirm-payment", confirmPayment);
router.post("/confirm-payment-commande", confirmPaymentCommande);

// Route alternative pour compatibilité (stripe prefix)
router.post("/stripe/confirm-payment-commande", confirmPaymentCommande);

console.log("✅ [Confirmation] Routes confirmation chargées");

export default router;
