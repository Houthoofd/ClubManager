/**
 * Routes du module Informations
 * Gestion des données de référence (grades, genres, status, abonnements)
 */

import express from "express";
import {
  getGrades,
  getGenres,
  getStatus,
  getAbonnements,
  healthCheck,
  getAllReferences,
} from "./core/handlers/index.js";

const router = express.Router();

console.log(
  "🔧 [Informations Routes] Initialisation des routes informations refactorisées"
);

/**
 * =============================================================================
 * ROUTES PUBLIQUES (sans authentification)
 * =============================================================================
 */

/**
 * GET /api/informations/health
 * Health check du module
 * Utile pour monitoring et diagnostics
 */
router.get("/health", healthCheck);

/**
 * GET /api/informations/all
 * Récupérer toutes les données de référence en une seule requête
 * Optimisé pour l'initialisation des formulaires
 */
router.get("/all", getAllReferences);

/**
 * GET /api/informations/grades
 * Récupérer tous les grades (ceintures de judo)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Grades récupérés avec succès",
 *   data: [{ id: 1, nom: "Ceinture blanche" }, ...],
 *   count: 10
 * }
 */
router.get("/grades", getGrades);

/**
 * GET /api/informations/genres
 * Récupérer tous les genres (homme/femme/autre)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Genres récupérés avec succès",
 *   data: [{ id: 1, nom: "Homme" }, { id: 2, nom: "Femme" }],
 *   count: 2
 * }
 */
router.get("/genres", getGenres);

/**
 * GET /api/informations/status
 * Récupérer tous les statuts (actif/inactif/suspendu)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Statuts récupérés avec succès",
 *   data: [{ id: 1, nom: "Actif" }, { id: 2, nom: "Inactif" }],
 *   count: 3
 * }
 */
router.get("/status", getStatus);

/**
 * GET /api/informations/abonnements
 * Récupérer tous les plans tarifaires (abonnements)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Plans tarifaires récupérés avec succès",
 *   data: [
 *     {
 *       id: 1,
 *       nom_plan: "Mensuel",
 *       prix: 50.00,
 *       duree_mois: 1,
 *       description: "Abonnement mensuel"
 *     },
 *     ...
 *   ],
 *   count: 4
 * }
 */
router.get("/abonnements", getAbonnements);

console.log("✅ [Informations Routes] Routes informations initialisées avec succès");

export default router;
