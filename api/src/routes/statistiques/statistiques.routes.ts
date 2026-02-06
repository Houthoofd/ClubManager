import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import {
  getFrequentation,
  getProgression,
  getPresence,
  getPresenceRaw,
  getMembresCount,
  getPaiementsMois,
  getPaiementsRecentsHandler,
  getPaiementsEnAttenteHandler,
  getPlansActifsHandler,
  getTauxRenouvellementHandler,
  getPaiementsParMoisHandler,
  getMembresParPlanHandler,
  getCoursSemaineHandler,
  getDerniersPaiementsHandler,
  getPaiementsEchusHandler,
  getNouveauxMembresHandler,
  getTopMembresAssidusHandler,
  getMembresParGradeHandler,
  getMembresParGenreHandler,
  getProchainsAnniversairesHandler,
  getArticlesPlusVendusHandler,
  healthCheck,
  getDiagnostic,
} from "./core/handlers/index.js";

const router = express.Router();

console.log(
  "🔧 [Statistiques Routes] Initialisation des routes statistiques refactorisées",
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

// Appliquer l'authentification à toutes les routes suivantes
router.use(verifyToken);

/**
 * =============================================================================
 * STATISTIQUES DE FRÉQUENTATION ET PROGRESSION
 * =============================================================================
 */

/**
 * GET /api/statistiques/frequentation/:utilisateurId
 * Récupère les statistiques de fréquentation d'un utilisateur
 *
 * Params:
 * - utilisateurId: number - ID de l'utilisateur
 *
 * Retourne:
 * - Total de fréquentation
 * - Détails par mois (fréquentation, total cours, pourcentage validé)
 */
router.get("/frequentation/:utilisateurId", getFrequentation);

/**
 * GET /api/statistiques/progression/:userId
 * Récupère les statistiques de progression d'un utilisateur
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 *
 * Retourne:
 * - Informations de progression (grade, cours suivis, taux de présence)
 */
router.get("/progression/:userId", getProgression);

/**
 * GET /api/statistiques/presence/:userId
 * Récupère les présences par mois pour un utilisateur (formaté)
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 *
 * Retourne:
 * - Présences formatées par mois et type de cours
 */
router.get("/presence/:userId", getPresence);

/**
 * GET /api/statistiques/presence-raw/:userId
 * Récupère les présences brutes (non formatées) pour un utilisateur
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 *
 * Retourne:
 * - Données brutes de présence
 */
router.get("/presence-raw/:userId", getPresenceRaw);

/**
 * =============================================================================
 * STATISTIQUES GLOBALES - MEMBRES
 * =============================================================================
 */

/**
 * GET /api/statistiques/membres/count
 * Nombre total de membres
 *
 * Retourne:
 * - Nombre total de membres actifs
 */
router.get("/membres/count", getMembresCount);

/**
 * GET /api/statistiques/membres/nouveaux
 * Retourne les membres inscrits dans les 7 derniers jours
 *
 * Retourne:
 * - Liste des nouveaux membres avec détails
 */
router.get("/membres/nouveaux", getNouveauxMembresHandler);

/**
 * GET /api/statistiques/membres/assidus
 * Top 5 membres les plus assidus (présences validées)
 *
 * Retourne:
 * - Liste des membres avec le plus de présences
 */
router.get("/membres/assidus", getTopMembresAssidusHandler);

/**
 * GET /api/statistiques/membres/par-grade
 * Répartition des membres par grade
 *
 * Retourne:
 * - Distribution des membres selon leur grade (avec pourcentages)
 */
router.get("/membres/par-grade", getMembresParGradeHandler);

/**
 * GET /api/statistiques/membres/par-genre
 * Répartition des membres par genre
 *
 * Retourne:
 * - Distribution des membres par genre (avec pourcentages)
 */
router.get("/membres/par-genre", getMembresParGenreHandler);

/**
 * GET /api/statistiques/membres/anniversaires
 * Prochains anniversaires des membres (dans les 30 jours)
 *
 * Retourne:
 * - Liste des anniversaires à venir avec jours restants
 */
router.get("/membres/anniversaires", getProchainsAnniversairesHandler);

/**
 * GET /api/statistiques/membres/par-plan
 * Répartition des membres par plan d'abonnement
 *
 * Retourne:
 * - Distribution des membres par plan (pour graphique)
 */
router.get("/membres/par-plan", getMembresParPlanHandler);

/**
 * =============================================================================
 * STATISTIQUES GLOBALES - PAIEMENTS
 * =============================================================================
 */

/**
 * GET /api/statistiques/paiements/mois
 * Total encaissé ce mois-ci
 *
 * Retourne:
 * - Montant total des paiements du mois en cours
 */
router.get("/paiements/mois", getPaiementsMois);

/**
 * GET /api/statistiques/paiements/recents
 * Nombre de paiements sur les 7 derniers jours
 *
 * Retourne:
 * - Nombre de paiements récents
 */
router.get("/paiements/recents", getPaiementsRecentsHandler);

/**
 * GET /api/statistiques/paiements/en-attente
 * Nombre de membres avec paiements en attente
 *
 * Retourne:
 * - Nombre de paiements en attente de validation
 */
router.get("/paiements/en-attente", getPaiementsEnAttenteHandler);

/**
 * GET /api/statistiques/paiements/par-mois
 * Évolution des paiements par mois (pour le graphique)
 *
 * Retourne:
 * - Données mensuelles pour graphique d'évolution
 */
router.get("/paiements/par-mois", getPaiementsParMoisHandler);

/**
 * GET /api/statistiques/paiements/derniers
 * Retourne les 10 derniers paiements effectués
 *
 * Retourne:
 * - Liste des derniers paiements avec détails
 */
router.get("/paiements/derniers", getDerniersPaiementsHandler);

/**
 * GET /api/statistiques/paiements/echus
 * Retourne les paiements échus (fin de période < aujourd'hui)
 *
 * Retourne:
 * - Liste des paiements échus nécessitant action
 */
router.get("/paiements/echus", getPaiementsEchusHandler);

/**
 * =============================================================================
 * STATISTIQUES GLOBALES - PLANS D'ABONNEMENT
 * =============================================================================
 */

/**
 * GET /api/statistiques/plans/actifs
 * Nombre de plans d'abonnement actifs
 *
 * Retourne:
 * - Nombre total de plans actifs
 */
router.get("/plans/actifs", getPlansActifsHandler);

/**
 * GET /api/statistiques/plans/taux-renouvellement
 * Taux de renouvellement des abonnements
 *
 * Retourne:
 * - Pourcentage de renouvellement des abonnements
 */
router.get("/plans/taux-renouvellement", getTauxRenouvellementHandler);

/**
 * =============================================================================
 * STATISTIQUES GLOBALES - COURS
 * =============================================================================
 */

/**
 * GET /api/statistiques/cours/semaine
 * Nombre de cours à venir cette semaine
 *
 * Retourne:
 * - Nombre de cours planifiés pour la semaine en cours
 */
router.get("/cours/semaine", getCoursSemaineHandler);

/**
 * =============================================================================
 * STATISTIQUES GLOBALES - ARTICLES
 * =============================================================================
 */

/**
 * GET /api/statistiques/articles/plus-vendus
 * Articles les plus vendus
 *
 * Retourne:
 * - Liste des articles les plus vendus avec quantités et revenus
 */
router.get("/articles/plus-vendus", getArticlesPlusVendusHandler);

/**
 * =============================================================================
 * ROUTES DE DIAGNOSTIC ET DEBUG
 * =============================================================================
 */

/**
 * GET /api/statistiques/diagnostic
 * Obtenir un diagnostic détaillé du module statistiques
 *
 * Informations sur:
 * - Architecture du module
 * - Routes disponibles
 * - Features activées
 * - Configuration de la base de données
 * - Recommandations
 */
router.get("/diagnostic", getDiagnostic);

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
    module: "statistiques",
    version: "2.0.0",
    architecture: "handlers/services/validators",
    features: {
      frequentation_utilisateur: true,
      progression_utilisateur: true,
      presence_par_mois: true,
      statistiques_membres: true,
      statistiques_paiements: true,
      statistiques_plans: true,
      statistiques_cours: true,
      statistiques_articles: true,
      graphiques_evolution: true,
      top_membres_assidus: true,
      repartition_grades: true,
      repartition_genres: true,
      anniversaires: true,
      health_check: true,
      diagnostics: true,
    },
    routes: {
      public: ["GET /health"],
      protected: [
        "GET /frequentation/:utilisateurId",
        "GET /progression/:userId",
        "GET /presence/:userId",
        "GET /presence-raw/:userId",
        "GET /membres/count",
        "GET /membres/nouveaux",
        "GET /membres/assidus",
        "GET /membres/par-grade",
        "GET /membres/par-genre",
        "GET /membres/anniversaires",
        "GET /membres/par-plan",
        "GET /paiements/mois",
        "GET /paiements/recents",
        "GET /paiements/en-attente",
        "GET /paiements/par-mois",
        "GET /paiements/derniers",
        "GET /paiements/echus",
        "GET /plans/actifs",
        "GET /plans/taux-renouvellement",
        "GET /cours/semaine",
        "GET /articles/plus-vendus",
        "GET /diagnostic",
      ],
    },
    total_routes: 23,
    documentation: "Voir les commentaires JSDoc sur chaque route",
    timestamp: new Date().toISOString(),
  });
});

console.log("✅ [Statistiques Routes] Routes statistiques chargées");

export default router;
