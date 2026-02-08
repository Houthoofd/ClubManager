/**
 * Handler GET /api/utilisateurs/health
 * Health check du module Utilisateurs
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { verifierSanteService } from "../services/utilisateurs.service.js";

/**
 * Handler pour le health check
 * GET /api/utilisateurs/health
 *
 * @returns 200 - Service healthy
 * @returns 503 - Service degraded ou unhealthy
 */
export async function healthCheck(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs
): Promise<void> {
  try {
    console.log(
      "🏥 [Handler Utilisateurs] GET /health - Vérification de santé"
    );

    // Vérifier la santé du service
    const healthStatus = await verifierSanteService(utilisateursClient);

    const statusCode = healthStatus.status === "healthy" ? 200 : 503;

    console.log(
      `${healthStatus.status === "healthy" ? "✅" : "⚠️"} [Handler Utilisateurs] Status: ${healthStatus.status}`
    );

    res.status(statusCode).json({
      status: healthStatus.status,
      checks: healthStatus.checks,
      message: healthStatus.message,
      data: healthStatus.data,
    });
  } catch (error: any) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur health check:",
      error
    );

    res.status(503).json({
      status: "unhealthy",
      checks: {
        database: false,
        utilisateurs: false,
        email: false,
      },
      message: "Erreur lors de la vérification de santé",
      error: error.message || "Erreur inconnue",
    });
  }
}
