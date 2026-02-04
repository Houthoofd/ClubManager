import { Request, Response } from "express";
import { z } from "zod";
import { verifierUniciteCommande } from "../services/index.js";
import { getCommandeByUniqueIdSchema } from "../validators/index.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

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

    if (result.exists) {
      console.log(`✅ [Handler Commandes] Commande ${uniqueId} trouvée`);
      res.status(200).json(result);
    } else {
      console.log(`⚠️ [Handler Commandes] Commande ${uniqueId} non trouvée`);
      res.status(404).json(result);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(
        "❌ [Handler Commandes] Erreur de validation:",
        error.errors,
      );
      res.status(400).json({
        message: "Erreur de validation des paramètres",
        errors: error.errors,
      });
      return;
    }

    console.error("❌ [Handler Commandes] Erreur vérification unicité:", error);
    res.status(500).json({
      message: "Erreur lors de la vérification de l'unicité",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
