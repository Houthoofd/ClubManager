/**
 * Handler pour les statistiques globales
 *
 * Gère les endpoints:
 * - GET /api/statistiques/membres/count
 * - GET /api/statistiques/paiements/mois
 * - GET /api/statistiques/paiements/recents
 * - GET /api/statistiques/paiements/en-attente
 * - GET /api/statistiques/plans/actifs
 * - GET /api/statistiques/plans/taux-renouvellement
 * - GET /api/statistiques/paiements/par-mois
 * - GET /api/statistiques/membres/par-plan
 * - GET /api/statistiques/cours/semaine
 */

import { Request, Response } from "express";
import {
  getNombreMembres,
  getTotalPaiementsMois,
  getPaiementsRecents,
  getPaiementsEnAttente,
  getPlansActifs,
  getTauxRenouvellement,
  getPaiementsParMois,
  getMembresParPlan,
  getCoursSemaine,
} from "../services/index.js";
import { InternalServerError } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour obtenir le nombre total de membres
 * GET /api/statistiques/membres/count
 */
export async function getMembresCount(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/membres/count");

  try {
    const data = await getNombreMembres();

    console.log("✅ [Handler] Nombre de membres récupéré:", data);

    return res.status(200).json({
      success: true,
      data,
      message: "Nombre de membres récupéré avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération nombre membres:", error);

    throw new InternalServerError(
      "Erreur lors du comptage des membres",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir le total des paiements du mois
 * GET /api/statistiques/paiements/mois
 */
export async function getPaiementsMois(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/paiements/mois");

  try {
    const data = await getTotalPaiementsMois();

    console.log("✅ [Handler] Total paiements du mois récupéré:", data);

    return res.status(200).json({
      success: true,
      data,
      message: "Total des paiements du mois récupéré avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération total paiements mois:",
      error,
    );

    throw new InternalServerError(
      "Erreur lors du calcul du total du mois",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir le nombre de paiements récents (7 derniers jours)
 * GET /api/statistiques/paiements/recents
 */
export async function getPaiementsRecentsHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/paiements/recents");

  try {
    const data = await getPaiementsRecents();

    console.log("✅ [Handler] Paiements récents récupérés:", data);

    return res.status(200).json({
      success: true,
      data,
      message: "Nombre de paiements récents récupéré avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération paiements récents:", error);

    throw new InternalServerError(
      "Erreur lors du comptage des paiements récents",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir le nombre de paiements en attente
 * GET /api/statistiques/paiements/en-attente
 */
export async function getPaiementsEnAttenteHandler(
  req: Request,
  res: Response,
) {
  console.log("📊 [Handler] GET /api/statistiques/paiements/en-attente");

  try {
    const data = await getPaiementsEnAttente();

    console.log("✅ [Handler] Paiements en attente récupérés:", data);

    return res.status(200).json({
      success: true,
      data,
      message: "Nombre de paiements en attente récupéré avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération paiements en attente:",
      error,
    );

    throw new InternalServerError(
      "Erreur lors du comptage des paiements en attente",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir le nombre de plans actifs
 * GET /api/statistiques/plans/actifs
 */
export async function getPlansActifsHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/plans/actifs");

  try {
    const data = await getPlansActifs();

    console.log("✅ [Handler] Plans actifs récupérés:", data);

    return res.status(200).json({
      success: true,
      data,
      message: "Nombre de plans actifs récupéré avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération plans actifs:", error);

    throw new InternalServerError(
      "Erreur lors du comptage des plans actifs",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir le taux de renouvellement des abonnements
 * GET /api/statistiques/plans/taux-renouvellement
 */
export async function getTauxRenouvellementHandler(
  req: Request,
  res: Response,
) {
  console.log("📊 [Handler] GET /api/statistiques/plans/taux-renouvellement");

  try {
    const data = await getTauxRenouvellement();

    console.log("✅ [Handler] Taux de renouvellement récupéré:", data);

    return res.status(200).json({
      success: true,
      data,
      message: "Taux de renouvellement récupéré avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération taux renouvellement:",
      error,
    );

    throw new InternalServerError(
      "Erreur lors du calcul du taux de renouvellement",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir l'évolution des paiements par mois
 * GET /api/statistiques/paiements/par-mois
 */
export async function getPaiementsParMoisHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/paiements/par-mois");

  try {
    const data = await getPaiementsParMois();

    console.log(
      `✅ [Handler] Paiements par mois récupérés: ${data.length} mois`,
    );

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Évolution des paiements par mois récupérée avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération paiements par mois:",
      error,
    );

    throw new InternalServerError(
      "Erreur lors de la récupération des paiements par mois",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir la répartition des membres par plan
 * GET /api/statistiques/membres/par-plan
 */
export async function getMembresParPlanHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/membres/par-plan");

  try {
    const data = await getMembresParPlan();

    console.log(
      `✅ [Handler] Membres par plan récupérés: ${data.length} plans`,
    );

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Répartition des membres par plan récupérée avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération membres par plan:", error);

    throw new InternalServerError(
      "Erreur lors de la récupération des membres par plan",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour obtenir le nombre de cours de la semaine
 * GET /api/statistiques/cours/semaine
 */
export async function getCoursSemaineHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/cours/semaine");

  try {
    const count = await getCoursSemaine();

    console.log("✅ [Handler] Nombre de cours de la semaine récupéré:", count);

    return res.status(200).json({
      success: true,
      data: { count },
      message: "Nombre de cours de la semaine récupéré avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération cours de la semaine:",
      error,
    );

    throw new InternalServerError(
      "Erreur lors de la récupération des cours de la semaine",
      error instanceof Error ? error : undefined,
    );
  }
}
