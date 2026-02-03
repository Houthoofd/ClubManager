/**
 * Handler GET /api/informations/health
 * Vérifie la santé du service Informations
 */

import { Request, Response } from "express";
import { Informations } from "../../../../db/clients/informations/informations.js";
import { verifierSanteService } from "../services/informations.service.js";

/**
 * Handler pour vérifier la santé du service
 * GET /api/informations/health
 *
 * @returns 200 - Service en bonne santé
 * @returns 503 - Service dégradé ou non disponible
 */
export async function healthCheck(
  req: Request,
  res: Response,
  informationsClient?: Informations
): Promise<void> {
  try {
    console.log("🏥 [Handler Informations] GET /health - Vérification de santé");

    // Vérifier la santé du service
    const healthStatus = await verifierSanteService(informationsClient);

    const statusCode = healthStatus.status === "healthy" ? 200 : 503;

    console.log(
      `${healthStatus.status === "healthy" ? "✅" : "⚠️"} [Handler Informations] Santé du service: ${healthStatus.status}`
    );

    res.status(statusCode).json({
      success: healthStatus.status === "healthy",
      status: healthStatus.status,
      message: healthStatus.message,
      checks: healthStatus.checks,
      timestamp: new Date().toISOString(),
      module: "informations",
    });
  } catch (error) {
    console.error(
      "❌ [Handler Informations] Erreur vérification santé:",
      error
    );

    res.status(503).json({
      success: false,
      status: "unhealthy",
      message: "Erreur lors de la vérification de santé",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      timestamp: new Date().toISOString(),
      module: "informations",
    });
  }
}

/**
 * Handler pour récupérer toutes les références en une fois
 * GET /api/informations/all
 *
 * @returns 200 - Toutes les références
 * @returns 500 - Erreur serveur
 */
export async function getAllReferences(
  req: Request,
  res: Response,
  informationsClient?: Informations
): Promise<void> {
  try {
    console.log(
      "🔄 [Handler Informations] GET /all - Récupération de toutes les références"
    );

    const { obtenirToutesLesReferences } = await import(
      "../services/informations.service.js"
    );
    const references = await obtenirToutesLesReferences(informationsClient);

    console.log("✅ [Handler Informations] Toutes les références récupérées");

    res.status(200).json({
      success: true,
      message: "Toutes les références récupérées avec succès",
      data: references,
      counts: {
        grades: references.grades.length,
        genres: references.genres.length,
        status: references.status.length,
        abonnements: references.abonnements.length,
      },
    });
  } catch (error) {
    console.error(
      "❌ [Handler Informations] Erreur récupération références:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des références",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
