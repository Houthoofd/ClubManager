/**
 * Handler GET /api/stocks/alertes
 * Récupère les alertes de stock (stocks bas)
 */

import { Request, Response } from "express";
import { Stocks } from "../../../../db/clients/stocks/stocks.js";
import { obtenirAlertesStock } from "../services/stocks.service.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer les alertes de stock
 * GET /api/stocks/alertes?seuil=5
 *
 * Query params:
 * - seuil (optionnel): Seuil d'alerte (défaut: 5)
 *
 * @returns 200 - Liste des alertes de stock
 * @returns 400 - Paramètres invalides
 * @returns 500 - Erreur serveur
 */
export async function getAlertes(
  req: Request,
  res: Response,
  stocksClient?: Stocks,
): Promise<void> {
  try {
    // Gérer le seuil avec une valeur par défaut correcte (accepter 0)
    const seuilQuery = req.query.seuil as string;
    const seuil = seuilQuery !== undefined ? parseInt(seuilQuery, 10) : 5;

    // Valider le seuil
    if (isNaN(seuil)) {
      console.log("⚠️ [Handler Stocks] Seuil invalide");
      throw new ValidationError("Le seuil doit être un nombre valide", [
        {
          field: "seuil",
          message: "Le seuil doit être un nombre valide",
        },
      ]);
    }

    if (seuil < 0) {
      console.log("⚠️ [Handler Stocks] Seuil négatif");
      throw new ValidationError("Le seuil ne peut pas être négatif", [
        {
          field: "seuil",
          message: "Le seuil ne peut pas être négatif",
        },
      ]);
    }

    console.log(
      `⚠️ [Handler Stocks] GET /stocks/alertes - Récupération alertes (seuil: ${seuil})`,
    );

    // Récupérer les alertes via le service
    const alertes = await obtenirAlertesStock(seuil, stocksClient);

    console.log(`✅ [Handler Stocks] ${alertes.length} alerte(s) récupérée(s)`);

    res.status(200).json({
      success: true,
      message: "Alertes de stock récupérées avec succès",
      data: alertes,
      count: alertes.length,
      seuil: seuil,
    });
  } catch (error) {
    console.error("❌ [Handler Stocks] Erreur récupération alertes:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des alertes",
      error instanceof Error ? error : undefined,
    );
  }
}
