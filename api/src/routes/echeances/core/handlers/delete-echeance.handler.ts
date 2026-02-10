import { Request, Response } from "express";
import { supprimerEcheance } from "../services/echeances.service.js";
import { deleteEcheanceSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";
import { z } from "zod";

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
      throw new ValidationError("ID échéance invalide", [
        {
          field: "id",
          message: "L'ID de l'échéance doit être un nombre positif",
        },
      ]);
    }

    const echeanceId = parseInt(echeanceIdParam, 10);

    if (isNaN(echeanceId) || echeanceId <= 0) {
      throw new ValidationError("ID échéance invalide", [
        {
          field: "id",
          message: "L'ID de l'échéance doit être un nombre positif",
        },
      ]);
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
      throw new NotFoundError(
        `L'échéance avec l'ID ${echeanceId} n'existe pas`,
      );
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
      throw new ValidationError(
        "Données invalides",
        formatZodErrors(error.errors),
      );
    }

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    // Erreur serveur générique
    throw new InternalServerError(
      "Erreur lors de la suppression de l'échéance",
      error instanceof Error ? error : undefined,
    );
  }
}
