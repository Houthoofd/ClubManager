/**
 * Handler pour les statistiques détaillées
 *
 * Gère les endpoints:
 * - GET /api/statistiques/paiements/derniers
 * - GET /api/statistiques/paiements/echus
 * - GET /api/statistiques/membres/nouveaux
 * - GET /api/statistiques/membres/assidus
 * - GET /api/statistiques/membres/par-grade
 * - GET /api/statistiques/membres/par-genre
 * - GET /api/statistiques/membres/anniversaires
 * - GET /api/statistiques/articles/plus-vendus
 */

import { Request, Response } from "express";
import {
  getDerniersPaiements,
  getPaiementsEchus,
  getNouveauxMembres,
  getTopMembresAssidus,
  getMembresParGrade,
  getMembresParGenre,
  getProchainsAnniversaires,
  getArticlesPlusVendus,
} from "../services/index.js";

/**
 * Handler pour obtenir les 10 derniers paiements
 * GET /api/statistiques/paiements/derniers
 */
export async function getDerniersPaiementsHandler(
  req: Request,
  res: Response,
) {
  console.log("📊 [Handler] GET /api/statistiques/paiements/derniers");

  try {
    const data = await getDerniersPaiements();

    console.log(`✅ [Handler] ${data.length} derniers paiements récupérés`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Derniers paiements récupérés avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération derniers paiements:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des derniers paiements",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir les paiements échus
 * GET /api/statistiques/paiements/echus
 */
export async function getPaiementsEchusHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/paiements/echus");

  try {
    const data = await getPaiementsEchus();

    console.log(`✅ [Handler] ${data.length} paiements échus récupérés`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Paiements échus récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération paiements échus:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des paiements échus",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir les nouveaux membres (7 derniers jours)
 * GET /api/statistiques/membres/nouveaux
 */
export async function getNouveauxMembresHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/membres/nouveaux");

  try {
    const data = await getNouveauxMembres();

    console.log(`✅ [Handler] ${data.length} nouveaux membres récupérés`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Nouveaux membres récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération nouveaux membres:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des nouveaux membres",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir le top 5 des membres les plus assidus
 * GET /api/statistiques/membres/assidus
 */
export async function getTopMembresAssidusHandler(
  req: Request,
  res: Response,
) {
  console.log("📊 [Handler] GET /api/statistiques/membres/assidus");

  try {
    const data = await getTopMembresAssidus();

    console.log(`✅ [Handler] ${data.length} membres assidus récupérés`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Membres les plus assidus récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération membres assidus:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des membres assidus",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir la répartition des membres par grade
 * GET /api/statistiques/membres/par-grade
 */
export async function getMembresParGradeHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/membres/par-grade");

  try {
    const data = await getMembresParGrade();

    console.log(`✅ [Handler] Répartition par grade: ${data.length} grades`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Répartition des membres par grade récupérée avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération membres par grade:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des membres par grade",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir la répartition des membres par genre
 * GET /api/statistiques/membres/par-genre
 */
export async function getMembresParGenreHandler(req: Request, res: Response) {
  console.log("📊 [Handler] GET /api/statistiques/membres/par-genre");

  try {
    const data = await getMembresParGenre();

    console.log(`✅ [Handler] Répartition par genre: ${data.length} genres`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Répartition des membres par genre récupérée avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération membres par genre:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des membres par genre",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir les prochains anniversaires (30 jours)
 * GET /api/statistiques/membres/anniversaires
 */
export async function getProchainsAnniversairesHandler(
  req: Request,
  res: Response,
) {
  console.log("📊 [Handler] GET /api/statistiques/membres/anniversaires");

  try {
    const data = await getProchainsAnniversaires();

    console.log(`✅ [Handler] ${data.length} anniversaires à venir récupérés`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Prochains anniversaires récupérés avec succès",
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur récupération anniversaires:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des anniversaires",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir les articles les plus vendus
 * GET /api/statistiques/articles/plus-vendus
 */
export async function getArticlesPlusVendusHandler(
  req: Request,
  res: Response,
) {
  console.log("📊 [Handler] GET /api/statistiques/articles/plus-vendus");

  try {
    const data = await getArticlesPlusVendus();

    console.log(`✅ [Handler] ${data.length} articles les plus vendus récupérés`);

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Articles les plus vendus récupérés avec succès",
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur récupération articles plus vendus:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des articles vendus",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
