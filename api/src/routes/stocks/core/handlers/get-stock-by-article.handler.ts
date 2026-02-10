/**
 * Handler GET /api/stocks/article/:articleId
 * Récupère les stocks d'un article spécifique
 */

import { Request, Response } from "express";
import { Stocks } from "../../../../db/clients/stocks/stocks.js";
import { obtenirStockParArticle } from "../services/stocks.service.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer les stocks d'un article
 * GET /api/stocks/article/:articleId
 *
 * @returns 200 - Stocks de l'article
 * @returns 400 - ID article invalide
 * @returns 404 - Aucun stock trouvé pour cet article
 * @returns 500 - Erreur serveur
 */
export async function getStockByArticle(
  req: Request,
  res: Response,
  stocksClient?: Stocks,
): Promise<void> {
  try {
    const articleIdParam = req.params.articleId;

    // Validation stricte : doit être un nombre entier (avec espaces autorisés)
    if (!/^\s*-?\d+\s*$/.test(articleIdParam)) {
      console.log("⚠️ [Handler Stocks] ID d'article invalide");
      throw new ValidationError("ID d'article invalide", [
        {
          field: "articleId",
          message: "L'ID de l'article doit être un nombre positif",
        },
      ]);
    }

    const articleId = parseInt(articleIdParam);

    if (isNaN(articleId) || articleId <= 0) {
      console.log("⚠️ [Handler Stocks] ID d'article invalide");
      throw new ValidationError("ID d'article invalide", [
        {
          field: "articleId",
          message: "L'ID de l'article doit être un nombre positif",
        },
      ]);
    }

    console.log(
      `📦 [Handler Stocks] GET /stocks/article/${articleId} - Récupération stock`,
    );

    // Récupérer le stock via le service
    const stocks = await obtenirStockParArticle(articleId, stocksClient);

    if (!stocks || stocks.length === 0) {
      console.log(
        `⚠️ [Handler Stocks] Aucun stock trouvé pour l'article ${articleId}`,
      );
      throw new NotFoundError(`Aucun stock trouvé pour l'article ${articleId}`);
    }

    console.log(
      `✅ [Handler Stocks] ${stocks.length} stock(s) récupéré(s) pour l'article ${articleId}`,
    );

    res.status(200).json({
      success: true,
      message: "Stock récupéré avec succès",
      data: stocks,
      count: stocks.length,
    });
  } catch (error) {
    console.error("❌ [Handler Stocks] Erreur récupération stock:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération du stock",
      error instanceof Error ? error : undefined,
    );
  }
}
