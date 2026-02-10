/**
 * Handler PUT /api/stocks/update
 * Met à jour un stock
 */

import { Request, Response } from "express";
import { Stocks } from "../../../../db/clients/stocks/stocks.js";
import { mettreAJourStock } from "../services/stocks.service.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

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
      throw new ValidationError("Données manquantes", [
        { field: "article_id", message: "Champ requis" },
        { field: "quantite", message: "Champ requis" },
      ]);
    }

    // Valider que la quantité est un nombre valide
    if (typeof quantite !== "number" || isNaN(quantite)) {
      console.log("⚠️ [Handler Stocks] Quantité invalide");
      throw new ValidationError("La quantite doit être un nombre valide", [
        {
          field: "quantite",
          message: "La quantite doit être un nombre valide",
        },
      ]);
    }

    // Valider que la quantité n'est pas négative
    if (quantite < 0) {
      console.log("⚠️ [Handler Stocks] Quantité négative");
      throw new ValidationError("La quantite ne peut pas être négative", [
        {
          field: "quantite",
          message: "La quantite ne peut pas être négative",
        },
      ]);
    }

    if (!["set", "add", "subtract"].includes(operation)) {
      console.log(`⚠️ [Handler Stocks] Opération invalide: ${operation}`);
      throw new ValidationError("Opération invalide", [
        {
          field: "operation",
          message: "Opérations autorisées: set, add, subtract",
        },
      ]);
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
      throw new NotFoundError(result.message);
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

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la mise à jour du stock",
      error instanceof Error ? error : undefined,
    );
  }
}
