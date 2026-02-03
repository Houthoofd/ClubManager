import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getEcheancesUtilisateur,
  getEcheanceDetail,
  getEcheanceCompat,
  createEcheance,
  updateEcheance,
  deleteEcheance,
  getStatistiquesUtilisateur,
  getDiagnosticEcheance,
  getDebugEcheancesUtilisateur,
  healthCheck,
  getDiagnostic,
  getTableConstraints,
} from "./core/handlers/index.js";

const router = express.Router();

console.log(
  "🔧 [Échéances Routes] Initialisation des routes échéances refactorisées",
);

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * Health check du module
 * Utile pour monitoring et diagnostics
 */
router.get("/health", healthCheck);

/**
 * =============================================================================
 * ROUTES PROTÉGÉES (authentification requise)
 * =============================================================================
 */

/**
 * GET /api/echeances/:userId
 * Obtenir toutes les échéances d'un utilisateur
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 */
router.get("/:userId", verifyToken, getEcheancesUtilisateur);

/**
 * GET /api/echeances/detail/:echeanceId
 * Récupérer les détails d'une échéance spécifique (sécurisé)
 *
 * Params:
 * - echeanceId: number - ID de l'échéance
 *
 * Note: L'authentification via verifyToken permet de vérifier que l'échéance
 * appartient bien à l'utilisateur connecté
 */
router.get("/detail/:echeanceId", verifyToken, getEcheanceDetail);

/**
 * GET /api/echeances/echeance/:echeanceId
 * Route de compatibilité pour récupérer une échéance
 *
 * Params:
 * - echeanceId: number - ID de l'échéance
 *
 * Query:
 * - userId?: number - ID de l'utilisateur (optionnel)
 *
 * Note: Cette route maintient la compatibilité avec l'ancien système
 */
router.get("/echeance/:echeanceId", getEcheanceCompat);

/**
 * GET /api/echeances/single/:echeanceId
 * Alias pour la route de compatibilité /echeance/:echeanceId
 *
 * Params:
 * - echeanceId: number - ID de l'échéance
 *
 * Query:
 * - userId?: number - ID de l'utilisateur (optionnel)
 */
router.get("/single/:echeanceId", getEcheanceCompat);

/**
 * POST /api/echeances
 * Créer une nouvelle échéance
 *
 * Body:
 * {
 *   utilisateur_id: number,        // ID de l'utilisateur
 *   abonnement_id?: number,        // ID de l'abonnement (optionnel)
 *   montant: number,               // Montant en euros
 *   date_echeance: string,         // Date d'échéance (format ISO)
 *   description?: string,          // Description (optionnel)
 *   statut?: string                // Statut: 'en attente', 'payé', 'échu' (défaut: 'en attente')
 * }
 */
router.post("/", verifyToken, createEcheance);

/**
 * PUT /api/echeances/:id
 * Mettre à jour une échéance existante
 *
 * Params:
 * - id: number - ID de l'échéance
 *
 * Body:
 * {
 *   montant?: number,                    // Montant en euros
 *   date_echeance?: string,              // Date d'échéance
 *   description?: string,                // Description
 *   statut?: string,                     // Statut: 'en attente', 'payé', 'échu'
 *   date_paiement?: string,              // Date de paiement
 *   stripe_payment_intent_id?: string    // ID du Payment Intent Stripe
 * }
 */
router.put("/:id", verifyToken, updateEcheance);

/**
 * DELETE /api/echeances/:id
 * Supprimer une échéance
 *
 * Params:
 * - id: number - ID de l'échéance à supprimer
 */
router.delete("/:id", verifyToken, deleteEcheance);

/**
 * GET /api/echeances/statistiques/:userId
 * Récupérer les statistiques des échéances d'un utilisateur
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 *
 * Retourne:
 * - Statistiques (total, en attente, payées, échues, montant total dû)
 * - Liste détaillée des échéances
 * - Suggestions de test
 */
router.get("/statistiques/:userId", verifyToken, getStatistiquesUtilisateur);

/**
 * =============================================================================
 * ROUTES DE DIAGNOSTIC ET DEBUG
 * =============================================================================
 */

/**
 * GET /api/echeances/diagnostic
 * Obtenir un diagnostic détaillé de la table echeances_paiements
 *
 * Informations sur:
 * - Structure de la table (colonnes, types)
 * - Contraintes et index
 * - Statistiques (nombre d'échéances par statut)
 * - Détection de problèmes éventuels
 */
router.get("/diagnostic", verifyToken, getDiagnostic);

/**
 * GET /api/echeances/debug/table-constraints
 * Vérifier les contraintes de la table echeances_paiements
 *
 * Alias pour /diagnostic pour compatibilité avec l'ancien système
 */
router.get("/debug/table-constraints", verifyToken, getTableConstraints);

/**
 * GET /api/echeances/debug/echeance/:echeanceId/user/:userId
 * Diagnostic détaillé d'une échéance pour un utilisateur
 *
 * Params:
 * - echeanceId: number - ID de l'échéance
 * - userId: number - ID de l'utilisateur
 *
 * Retourne:
 * - Existence de l'échéance
 * - Appartenance à l'utilisateur
 * - Liste de toutes les échéances de l'utilisateur
 */
router.get(
  "/debug/echeance/:echeanceId/user/:userId",
  verifyToken,
  getDiagnosticEcheance,
);

/**
 * GET /api/echeances/debug/user/:userId/echeances
 * Liste complète des échéances d'un utilisateur avec détails
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 *
 * Retourne:
 * - Liste détaillée des échéances avec jointures
 * - Statistiques
 * - Suggestions de test
 */
router.get(
  "/debug/user/:userId/echeances",
  verifyToken,
  getDebugEcheancesUtilisateur,
);

/**
 * =============================================================================
 * ROUTE PAR DÉFAUT - INFO MODULE
 * =============================================================================
 */

/**
 * GET /api/echeances
 * Informations générales sur le module échéances
 */
router.get("/", (req, res) => {
  res.status(200).json({
    status: "active",
    module: "echeances",
    version: "2.0.0",
    architecture: "handlers/services/validators",
    features: {
      crud_operations: true,
      statistics: true,
      diagnostics: true,
      user_security: true,
      compatibility_routes: true,
    },
    routes: {
      public: ["GET /health"],
      protected: [
        "GET /:userId",
        "GET /detail/:echeanceId",
        "GET /echeance/:echeanceId",
        "GET /single/:echeanceId",
        "POST /",
        "PUT /:id",
        "DELETE /:id",
        "GET /statistiques/:userId",
        "GET /diagnostic",
        "GET /debug/table-constraints",
        "GET /debug/echeance/:echeanceId/user/:userId",
        "GET /debug/user/:userId/echeances",
      ],
    },
    documentation: "Voir les commentaires JSDoc sur chaque route",
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ [Échéances Routes] Routes échéances chargées");

export default router;
