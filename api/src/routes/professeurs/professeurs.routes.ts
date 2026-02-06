import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getProfesseurs,
  getProfesseurById,
  ajouterProfesseurHandler,
  modifierStatutProfesseurHandler,
  getPlanningProfesseur,
  healthCheck,
  getDiagnostic,
} from "./core/handlers/index.js";

const router = express.Router();

console.log(
  "🔧 [Professeurs Routes] Initialisation des routes professeurs refactorisées",
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
 * GET /api/professeurs
 * Obtenir la liste de tous les professeurs
 *
 * Retourne:
 * - Liste complète des professeurs avec leurs informations
 * - Nombre total de professeurs
 */
router.get("/", verifyToken, getProfesseurs);

/**
 * GET /api/professeurs/:id
 * Récupérer les informations d'un professeur spécifique
 *
 * Params:
 * - id: number - ID du professeur
 *
 * Retourne:
 * - Informations détaillées du professeur (nom, email, téléphone, etc.)
 */
router.get("/:id", verifyToken, getProfesseurById);

/**
 * POST /api/professeurs/ajouter
 * Ajouter/promouvoir un ou plusieurs utilisateurs comme professeurs
 *
 * Body:
 * {
 *   utilisateurs?: number[] | Array<{id: number}>, // IDs des utilisateurs à promouvoir
 *   id?: number,                                    // ID unique d'un utilisateur
 *   userId?: number,                                // Alias pour id
 *   user_id?: number,                               // Alias pour id
 *   users?: number[] | Array<{id: number}>          // Alias pour utilisateurs
 * }
 *
 * Note: Envoie automatiquement un email de promotion aux utilisateurs
 */
router.post("/ajouter", verifyToken, ajouterProfesseurHandler);

/**
 * POST /api/professeurs/modifier
 * Modifier le statut d'un professeur
 *
 * Body:
 * {
 *   id: number,        // ID du professeur
 *   status_id: number  // Nouveau statut (1-10)
 * }
 *
 * Note: Permet d'activer, désactiver ou modifier l'état d'un professeur
 */
router.post("/modifier", verifyToken, modifierStatutProfesseurHandler);

/**
 * GET /api/professeurs/:id/planning
 * Récupérer le planning des cours d'un professeur
 *
 * Params:
 * - id: number - ID du professeur
 *
 * Retourne:
 * - Liste des cours assignés au professeur
 * - Informations détaillées sur chaque cours (horaires, salle, niveau, etc.)
 * - Nombre d'inscrits par cours
 */
router.get("/:id/planning", verifyToken, getPlanningProfesseur);

/**
 * =============================================================================
 * ROUTES DE DIAGNOSTIC ET DEBUG
 * =============================================================================
 */

/**
 * GET /api/professeurs/diagnostic
 * Obtenir un diagnostic détaillé du module professeurs
 *
 * Informations sur:
 * - Structure des tables (utilisateurs, cours)
 * - Statistiques (nombre de professeurs, cours, etc.)
 * - État de la base de données
 * - Recommandations
 */
router.get("/diagnostic", verifyToken, getDiagnostic);

/**
 * =============================================================================
 * ROUTE PAR DÉFAUT - INFO MODULE
 * =============================================================================
 */

/**
 * Route de fallback pour informations générales
 * Note: Cette route est placée en dernier pour ne pas intercepter les autres
 */
router.use("/info", (req, res) => {
  res.status(200).json({
    status: "active",
    module: "professeurs",
    version: "2.0.0",
    architecture: "handlers/services/validators",
    features: {
      get_all_professeurs: true,
      get_professeur_by_id: true,
      ajouter_professeur: true,
      modifier_statut: true,
      get_planning: true,
      promotion_email: true,
      diagnostics: true,
    },
    routes: {
      public: ["GET /health"],
      protected: [
        "GET /",
        "GET /:id",
        "POST /ajouter",
        "POST /modifier",
        "GET /:id/planning",
        "GET /diagnostic",
      ],
    },
    documentation: "Voir les commentaires JSDoc sur chaque route",
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ [Professeurs Routes] Routes professeurs chargées");

export default router;
