/**
 * Handler GET /api/stocks
 * Récupère la liste de tous les stocks
 */

import { Request, Response } from "express";
import { Stocks } from "../../../../db/clients/stocks/stocks.js";
import { obtenirStocks } from "../services/stocks.service.js";
import {
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer tous les stocks
 * GET /api/stocks
 *
 * @returns 200 - Liste des stocks
 * @returns 404 - Aucun stock trouvé
 * @returns 500 - Erreur serveur
 */
export async function getStocks(
  req: Request,
  res: Response,
  stocksClient?: Stocks,
): Promise<void> {
  try {
    console.log("📦 [Handler Stocks] GET /stocks - Récupération des stocks");

    // Récupérer les stocks via le service
    const stocks = await obtenirStocks(stocksClient);

    if (!stocks || stocks.length === 0) {
      console.log("⚠️ [Handler Stocks] Aucun stock trouvé");
      throw new NotFoundError("Aucun stock trouvé");
    }

    console.log(`✅ [Handler Stocks] ${stocks.length} stocks récupérés`);

    res.status(200).json({
      success: true,
      message: "Stocks récupérés avec succès",
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error("❌ [Handler Stocks] Erreur récupération stocks:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des stocks",
      error instanceof Error ? error : undefined,
    );
  }
}
