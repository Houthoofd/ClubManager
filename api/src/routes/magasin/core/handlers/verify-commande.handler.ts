import { Request, Response } from "express";
import { z } from "zod";
import { verifierUniciteCommande } from "../services/index.js";
import { getCommandeByUniqueIdSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
  formatZodErrors,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour vérifier l'unicité d'une commande
 * GET /api/magasin/commande/:uniqueId/verify
 */
export async function verifyCommandeUnicity(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("🔍 [Handler Commandes] Vérification unicité commande");

    // Validation des paramètres
    const { uniqueId } = getCommandeByUniqueIdSchema.parse(req.params);

    const result = await verifierUniciteCommande(uniqueId, paiementsClient);

    if (!result.exists) {
      console.log(`⚠️ [Handler Commandes] Commande ${uniqueId} non trouvée`);
      throw new NotFoundError(`Commande ${uniqueId} non trouvée`);
    }

    console.log(`✅ [Handler Commandes] Commande ${uniqueId} trouvée`);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Commandes] Erreur de validation:",
        error.errors,
      );
      throw new ValidationError(
        "Erreur de validation des paramètres",
        formatZodErrors(error.errors),
      );
    }

    console.error("❌ [Handler Commandes] Erreur vérification unicité:", error);
    throw new InternalServerError(
      "Erreur lors de la vérification de l'unicité",
    );
  }
}
