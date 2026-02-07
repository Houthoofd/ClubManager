/**
 * Handler PUT /api/stocks/update
 * Met à jour un stock
 */

import { Request, Response } from "express";
import { Stocks } from "../../../../db/clients/stocks/stocks.js";
import { mettreAJourStock } from "../services/stocks.service.js";

/**
 * Handler pour mettre à jour un stock
 * PUT /api/stocks/update
 *
 * Body: { article_id, quantite, operation?: 'set' | 'add' | 'subtract' }
 *
 * @returns 200 - Stock mis à jour
 * @returns 400 - Données invalides
 * @returns 404 - Stock non trouvé
 * @returns 500 - Erreur serveur
 */
export async function updateStock(
  req: Request,
  res: Response,
  stocksClient?: Stocks,
): Promise<void> {
  try {
    const { article_id, quantite, operation = "set" } = req.body;

    // Validation
    if (!article_id || quantite === undefined) {
      console.log("⚠️ [Handler Stocks] Données manquantes");
      res.status(400).json({
        success: false,
        message: "article_id et quantite sont requis",
      });
      return;
    }

    // Valider que la quantité est un nombre valide
    if (typeof quantite !== "number" || isNaN(quantite)) {
      console.log("⚠️ [Handler Stocks] Quantité invalide");
      res.status(400).json({
        success: false,
        message: "La quantite doit être un nombre valide",
      });
      return;
    }

    // Valider que la quantité n'est pas négative
    if (quantite < 0) {
      console.log("⚠️ [Handler Stocks] Quantité négative");
      res.status(400).json({
        success: false,
        message: "La quantite ne peut pas être négative",
      });
      return;
    }

    if (!["set", "add", "subtract"].includes(operation)) {
      console.log(`⚠️ [Handler Stocks] Opération invalide: ${operation}`);
      res.status(400).json({
        success: false,
        message:
          "operation invalide. Opérations autorisées: set, add, subtract",
      });
      return;
    }

    console.log(
      `🔄 [Handler Stocks] PUT /stocks/update - Article ${article_id}: ${operation} ${quantite}`,
    );

    // Mettre à jour via le service
    const result = await mettreAJourStock(
      { article_id, quantite, operation },
      stocksClient,
    );

    if (!result.success) {
      console.log(`⚠️ [Handler Stocks] ${result.message}`);
      res.status(404).json({
        success: false,
        message: result.message,
      });
      return;
    }

    console.log(
      `✅ [Handler Stocks] Stock mis à jour pour l'article ${article_id}`,
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        article_id,
        quantite,
        operation,
      },
    });
  } catch (error) {
    console.error("❌ [Handler Stocks] Erreur mise à jour stock:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour du stock",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
