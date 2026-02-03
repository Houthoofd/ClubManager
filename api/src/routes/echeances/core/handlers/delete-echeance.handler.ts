import { Request, Response } from "express";
import { z } from "zod";
import { supprimerEcheance } from "../services/echeances.service.js";
import { deleteEcheanceSchema } from "../validators/echeance.schema.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour supprimer une échéance
 * DELETE /api/echeances/:id
 *
 * Params:
 * - id: number - ID de l'échéance à supprimer
 */
export async function deleteEcheance(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const echeanceIdParam = req.params.id;

    console.log(
      `🗑️ [Handler Échéances] DELETE /:id - Suppression échéance ${echeanceIdParam}`,
    );

    // Validation de l'ID échéance
    if (!echeanceIdParam || !/^\d+$/.test(echeanceIdParam)) {
      res.status(400).json({
        success: false,
        error: "ID échéance invalide",
        message: "L'ID de l'échéance doit être un nombre positif",
      });
      return;
    }

    const echeanceId = parseInt(echeanceIdParam, 10);

    if (isNaN(echeanceId) || echeanceId <= 0) {
      res.status(400).json({
        success: false,
        error: "ID échéance invalide",
        message: "L'ID de l'échéance doit être un nombre positif",
      });
      return;
    }

    // Validation avec Zod
    const validatedData = deleteEcheanceSchema.parse({
      echeanceId: echeanceIdParam,
    });

    console.log("✅ [Handler Échéances] ID validé:", validatedData.echeanceId);

    // Supprimer l'échéance via le service
    const supprime = await supprimerEcheance(
      validatedData.echeanceId,
      paiementsClient,
    );

    if (!supprime) {
      res.status(404).json({
        success: false,
        error: "Échéance non trouvée",
        message: `L'échéance avec l'ID ${echeanceId} n'existe pas`,
        echeanceId,
      });
      return;
    }

    console.log(
      `✅ [Handler Échéances] Échéance ${echeanceId} supprimée avec succès`,
    );

    res.status(200).json({
      success: true,
      message: "Échéance supprimée avec succès",
      echeanceId,
    });
  } catch (error) {
    console.error("❌ [Handler Échéances] Erreur suppression échéance:", error);

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      res.status(400).json({
        success: false,
        message: "Données invalides",
        error: firstError.message,
        errors: error.errors,
      });
      return;
    }

    // Erreur serveur générique
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'échéance",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
