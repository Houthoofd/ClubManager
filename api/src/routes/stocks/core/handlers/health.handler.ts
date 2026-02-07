/**
 * Handler GET /api/stocks/health
 * Health check du module stocks
 */

import { Request, Response } from "express";
import { Stocks } from "../../../../db/clients/stocks/stocks.js";
import { verifierSanteService } from "../services/stocks.service.js";

/**
 * Handler pour vérifier la santé du service
 * GET /api/stocks/health
 *
 * @returns 200 - Service en bonne santé
 * @returns 503 - Service dégradé ou non opérationnel
 */
export async function healthCheck(
  req: Request,
  res: Response,
  stocksClient?: Stocks
): Promise<void> {
  try {
    console.log("🏥 [Handler Stocks] GET /stocks/health - Health check");

    const health = await verifierSanteService(stocksClient);

    const statusCode = health.status === "healthy" ? 200 : 503;

    console.log(
      `${health.status === "healthy" ? "✅" : "⚠️"} [Handler Stocks] Health check: ${health.status}`
    );

    res.status(statusCode).json(health);
  } catch (error) {
    console.error("❌ [Handler Stocks] Erreur health check:", error);

    res.status(503).json({
      status: "unhealthy",
      checks: {
        stocks: false,
        alertes: false,
      },
      message: "Erreur lors de la vérification de santé",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
