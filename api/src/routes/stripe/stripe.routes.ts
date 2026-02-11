/**
 * Routes du module Stripe
 * Gestion des paiements Stripe et méthodes alternatives
 */

import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  createPaymentIntentEcheance,
  createPaymentIntentCommande,
  confirmPaymentEcheance,
  confirmPaymentCommande,
  bancontact,
  paypal,
  bitcoin,
  config,
  debugStripeConfig,
  testPaymentIntent,
  health,
} from "./core/handlers/index.js";
import { webhooksRouter } from "./core/webhooks/index.js";

const router = express.Router();

console.log(
  "🔧 [Stripe Routes] Initialisation des routes Stripe refactorisées",
);

/**
 * =============================================================================
 * WEBHOOKS (body brut requis, AVANT les middlewares JSON)
 * =============================================================================
 */

/**
 * Monter les routes webhooks
 * IMPORTANT: Les webhooks doivent être montés avec express.raw() dans index.ts
 * car ils ont besoin du body brut pour valider la signature Stripe
 */
router.use("/webhooks", webhooksRouter);

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * GET /api/stripe/health
 * Health check du module Stripe
 * Vérifie la configuration et la connectivité Stripe
 *
 * Response:
 * {
 *   success: true,
 *   message: "Module Stripe opérationnel",
 *   data: {
 *     status: "healthy",
 *     timestamp: "2025-01-15T10:30:00.000Z",
 *     checks: {
 *       secretKeyConfigured: true,
 *       publishableKeyConfigured: true,
 *       stripeConnectivity: true
 *     }
 *   }
 * }
 */
router.get("/health", health);

/**
 * GET /api/stripe/config
 * Récupérer la configuration publique Stripe
 * Retourne la publishable key et les méthodes de paiement disponibles
 *
 * Response:
 * {
 *   success: true,
 *   message: "Configuration Stripe récupérée avec succès",
 *   data: {
 *     publishableKey: "pk_test_...",
 *     paymentMethods: ["card", "bancontact", "paypal", "bitcoin"]
 *   }
 * }
 */
router.get("/config", config);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES - PAIEMENTS (avec authentification)
 * =============================================================================
 */

/**
 * POST /api/stripe/create-payment-intent
 * Créer un PaymentIntent pour une échéance de paiement
 *
 * Body:
 * {
 *   amount: number,          // Montant en EUR (ex: 50.00)
 *   echeanceId: number,      // ID de l'échéance
 *   userId: number,          // ID de l'utilisateur
 *   description?: string     // Description optionnelle
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "PaymentIntent créé avec succès",
 *   data: {
 *     clientSecret: "pi_xxx_secret_xxx",
 *     paymentIntentId: "pi_xxx"
 *   }
 * }
 */
router.post("/create-payment-intent", verifyToken, createPaymentIntentEcheance);

/**
 * POST /api/stripe/create-payment-intent-commande
 * Créer un PaymentIntent pour une commande
 *
 * Body:
 * {
 *   amount: number,          // Montant en EUR
 *   commande: {              // Objet commande
 *     id?: number,           // ID si commande existante
 *     articles: [...],       // Articles de la commande
 *     ...
 *   },
 *   userId: number,
 *   description?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "PaymentIntent créé avec succès",
 *   data: {
 *     clientSecret: "pi_xxx_secret_xxx",
 *     paymentIntentId: "pi_xxx",
 *     commandeId?: number    // ID de la commande créée (si nouvelle)
 *   }
 * }
 */
router.post(
  "/create-payment-intent-commande",
  verifyToken,
  createPaymentIntentCommande,
);

/**
 * POST /api/stripe/confirm-payment
 * Confirmer un paiement d'échéance
 * Enregistre le paiement, marque l'échéance comme payée, upgrade le statut utilisateur si premier paiement
 *
 * Body:
 * {
 *   paymentIntentId: string, // ID du PaymentIntent Stripe (format: pi_xxx)
 *   echeanceId: number,      // ID de l'échéance
 *   userId: number,          // ID de l'utilisateur
 *   amount: number           // Montant payé
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Paiement confirmé avec succès",
 *   data: {
 *     paiementId: number,
 *     premierPaiement: boolean,
 *     statusUpgrade?: {
 *       upgraded: boolean,
 *       ancienStatut: string,
 *       nouveauStatut: string
 *     }
 *   }
 * }
 */
router.post("/confirm-payment", verifyToken, confirmPaymentEcheance);

/**
 * POST /api/stripe/confirm-payment-commande
 * Confirmer un paiement de commande
 * Enregistre le paiement, marque la commande comme payée, upgrade le statut utilisateur si premier paiement
 *
 * Body:
 * {
 *   paymentIntentId: string,
 *   commandeId: number,
 *   userId: number,
 *   amount: number
 * }
 *
 * Response: Identique à confirm-payment
 */
router.post("/confirm-payment-commande", verifyToken, confirmPaymentCommande);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES - MÉTHODES ALTERNATIVES (avec authentification)
 * =============================================================================
 */

/**
 * POST /api/stripe/bancontact
 * Créer un paiement via Bancontact
 *
 * Body:
 * {
 *   amount: number,
 *   commande: { ... },
 *   userId: number
 * }
 *
 * Response:
 * {
 *   success: true,
 *   message: "Paiement Bancontact créé avec succès",
 *   data: {
 *     paiementId: number,
 *     commandeId: number,
 *     methodePaiement: "bancontact"
 *   }
 * }
 */
router.post("/bancontact", verifyToken, bancontact);

/**
 * POST /api/stripe/paypal
 * Créer un paiement via PayPal
 *
 * Body: Identique à /bancontact
 * Response: Identique à /bancontact (avec methodePaiement: "paypal")
 */
router.post("/paypal", verifyToken, paypal);

/**
 * POST /api/stripe/bitcoin
 * Créer un paiement via Bitcoin
 *
 * Body: Identique à /bancontact
 * Response: Identique à /bancontact (avec methodePaiement: "bitcoin")
 */
router.post("/bitcoin", verifyToken, bitcoin);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES - DEBUG (avec authentification)
 * =============================================================================
 */

/**
 * GET /api/stripe/debug/stripe-config
 * Récupérer les informations de debug sur la configuration Stripe
 * Affiche les clés masquées et teste la connectivité
 *
 * Response:
 * {
 *   success: true,
 *   message: "Informations de debug récupérées avec succès",
 *   data: {
 *     publishableKey: "pk_test_...",
 *     secretKey: "sk_test...****",
 *     secretKeyConfigured: true,
 *     publishableKeyConfigured: true,
 *     paymentMethods: [...],
 *     connectivity: { connected: true },
 *     environment: "development"
 *   }
 * }
 */
router.get("/debug/stripe-config", verifyToken, debugStripeConfig);

/**
 * POST /api/stripe/debug/test-payment-intent
 * Créer un PaymentIntent de test pour vérifier la configuration
 * Crée un PaymentIntent avec montant minimal (50 centimes)
 *
 * Response:
 * {
 *   success: true,
 *   message: "PaymentIntent de test créé avec succès",
 *   data: {
 *     paymentIntentId: "pi_xxx",
 *     clientSecret: "pi_xxx_secret_xxx",
 *     note: "Ce PaymentIntent est uniquement à des fins de test..."
 *   }
 * }
 */
router.post("/debug/test-payment-intent", verifyToken, testPaymentIntent);

console.log("✅ [Stripe Routes] Routes Stripe initialisées avec succès");

export default router;
