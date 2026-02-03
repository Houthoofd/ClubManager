import express from 'express';
import { verifyToken } from '../../middleware/auth.js';
import {
  createPaymentEcheance,
  createPaymentCommande,
  confirmEcheancePayment,
  confirmCommandePayment,
  handleStripeWebhook,
  getHistoriquePaiements,
  getEcheancesUtilisateur,
  getEcheanceDetails,
  healthCheck,
  getDiagnostic,
  testStripeKeys,
} from './core/handlers/index.js';

const router = express.Router();

console.log('🔧 [Paiements Routes] Initialisation des routes de paiements refactorisées');

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * Webhook Stripe
 * Doit rester public pour que Stripe puisse envoyer les événements
 * La sécurité est assurée par la vérification de la signature
 */
router.post('/webhook', handleStripeWebhook);

/**
 * Health check du module
 * Utile pour monitoring et diagnostics
 */
router.get('/health', healthCheck);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES (authentification requise)
 * =============================================================================
 */

/**
 * POST /api/paiements/stripe/create-payment-intent
 * Créer un Payment Intent Stripe pour une échéance
 *
 * Body:
 * {
 *   amount: number,        // Montant en euros (ex: 25.50)
 *   echeanceId: number,    // ID de l'échéance
 *   userId: number,        // ID de l'utilisateur
 *   currency?: string,     // Devise (défaut: 'eur')
 *   description?: string   // Description du paiement
 * }
 */
router.post(
  '/stripe/create-payment-intent',
  verifyToken,
  (req, res) => createPaymentEcheance(req, res)
);

/**
 * POST /api/paiements/stripe/create-payment-intent-commande
 * Créer un Payment Intent Stripe pour une commande
 *
 * Body:
 * {
 *   amount: number,                    // Montant en euros
 *   commande: number | object,         // ID de la commande ou objet complet
 *   userId?: number,                   // ID de l'utilisateur (optionnel)
 *   currency?: string,                 // Devise (défaut: 'eur')
 *   description?: string               // Description du paiement
 * }
 */
router.post(
  '/stripe/create-payment-intent-commande',
  verifyToken,
  (req, res) => createPaymentCommande(req, res)
);

/**
 * POST /api/paiements/stripe/confirm-echeance
 * Confirmer un paiement d'échéance après validation Stripe
 *
 * Body:
 * {
 *   paymentIntentId: string,  // ID du Payment Intent Stripe (pi_...)
 *   echeanceId: number,       // ID de l'échéance
 *   userId: number,           // ID de l'utilisateur
 *   amount: number            // Montant en centimes
 * }
 */
router.post(
  '/stripe/confirm-echeance',
  verifyToken,
  (req, res) => confirmEcheancePayment(req, res)
);

/**
 * POST /api/paiements/stripe/confirm-commande
 * Confirmer un paiement de commande après validation Stripe
 *
 * Body:
 * {
 *   paymentIntentId: string,  // ID du Payment Intent Stripe (pi_...)
 *   commandeId: number,       // ID de la commande
 *   userId: number,           // ID de l'utilisateur
 *   amount: number            // Montant en centimes
 * }
 */
router.post(
  '/stripe/confirm-commande',
  verifyToken,
  (req, res) => confirmCommandePayment(req, res)
);

/**
 * GET /api/paiements/historique
 * Récupérer l'historique des paiements
 *
 * Query params:
 * - utilisateur_id?: number  // Filtrer par utilisateur
 * - limit?: number           // Nombre de résultats (défaut: 50)
 * - offset?: number          // Décalage pour pagination (défaut: 0)
 * - statut?: string          // Filtrer par statut (pending, completed, failed, refunded)
 * - type?: string            // Filtrer par type (echeance, commande)
 */
router.get(
  '/historique',
  verifyToken,
  (req, res) => getHistoriquePaiements(req, res)
);

/**
 * GET /api/paiements/echeances/:userId
 * Récupérer les échéances d'un utilisateur
 *
 * Params:
 * - userId: number  // ID de l'utilisateur
 */
router.get(
  '/echeances/:userId',
  verifyToken,
  (req, res) => getEcheancesUtilisateur(req, res)
);

/**
 * GET /api/paiements/echeance/:echeanceId
 * Récupérer les détails d'une échéance spécifique
 *
 * Params:
 * - echeanceId: number  // ID de l'échéance
 */
router.get(
  '/echeance/:echeanceId',
  verifyToken,
  (req, res) => getEcheanceDetails(req, res)
);

/**
 * =============================================================================
 * ROUTES DE DIAGNOSTIC ET ADMINISTRATION
 * =============================================================================
 */

/**
 * GET /api/paiements/diagnostic
 * Obtenir un diagnostic détaillé du système de paiement
 * Informations sur la configuration Stripe, les clés, les features, etc.
 */
router.get(
  '/diagnostic',
  verifyToken,
  (req, res) => getDiagnostic(req, res)
);

/**
 * POST /api/paiements/test-keys
 * Tester la compatibilité entre les clés Stripe frontend et backend
 *
 * Body:
 * {
 *   frontend_public_key: string  // Clé publique Stripe du frontend
 * }
 */
router.post(
  '/test-keys',
  verifyToken,
  (req, res) => testStripeKeys(req, res)
);

/**
 * =============================================================================
 * ROUTE PAR DÉFAUT - INFO MODULE
 * =============================================================================
 */

/**
 * GET /api/paiements
 * Informations générales sur le module paiements
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    module: 'paiements',
    version: '2.0.0',
    architecture: 'handlers/services/validators',
    features: {
      stripe: true,
      payment_intents: true,
      echeances: true,
      commandes: true,
      webhooks: true,
      email_notifications: true,
    },
    routes: {
      public: [
        'POST /webhook',
        'GET /health',
      ],
      protected: [
        'POST /stripe/create-payment-intent',
        'POST /stripe/create-payment-intent-commande',
        'POST /stripe/confirm-echeance',
        'POST /stripe/confirm-commande',
        'GET /historique',
        'GET /echeances/:userId',
        'GET /echeance/:echeanceId',
        'GET /diagnostic',
        'POST /test-keys',
      ],
    },
    documentation: 'Voir les commentaires JSDoc sur chaque route',
    timestamp: new Date().toISOString(),
  });
});

export default router;
