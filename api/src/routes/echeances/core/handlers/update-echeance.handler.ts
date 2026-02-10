import { Request, Response } from "express";
import { z } from "zod";
import { mettreAJourEcheance } from "../services/echeances.service.js";
import { updateEcheanceSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour mettre à jour une échéance existante
 * PUT /api/echeances/:id
 *
 * Params:
 * - id: number - ID de l'échéance
 *
 * Body:
 * {
 *   montant?: number,
 *   date_echeance?: string,
 *   description?: string,
 *   statut?: "en attente" | "payé" | "échu",
 *   date_paiement?: string,
 *   stripe_payment_intent_id?: string
 * }
 */
export async function updateEcheance(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const echeanceIdParam = req.params.id;

    console.log(
      `📝 [Handler Échéances] PUT /:id - Mise à jour échéance ${echeanceIdParam}`,
      req.body,
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

    // Validation des données de mise à jour avec Zod
    // Extraire echeanceId du schéma car il est déjà validé
    const validatedData = updateEcheanceSchema.parse({
      echeanceId,
      ...req.body,
    });

    console.log("✅ [Handler Échéances] Données validées:", validatedData);

    // Extraire les champs à mettre à jour (exclure echeanceId)
    const { echeanceId: _, ...updates } = validatedData as any;

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updates).length === 0) {
      throw new ValidationError("Aucun champ à mettre à jour", [
        {
          field: "body",
          message:
            "Au moins un champ doit être fourni parmi: montant, date_echeance, description, statut, date_paiement, stripe_payment_intent_id",
        },
      ]);
    }

    // Mettre à jour l'échéance via le service
    const echeanceMiseAJour = await mettreAJourEcheance(
      echeanceId,
      updates,
      paiementsClient,
    );

    if (!echeanceMiseAJour) {
      throw new NotFoundError(
        `L'échéance avec l'ID ${echeanceId} n'existe pas`,
      );
    }

    console.log(
      `✅ [Handler Échéances] Échéance ${echeanceId} mise à jour avec succès`,
    );

    res.status(200).json({
      success: true,
      message: "Échéance mise à jour avec succès",
      data: echeanceMiseAJour,
    });
  } catch (error) {
    console.error("❌ [Handler Échéances] Erreur mise à jour échéance:", error);

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
      "Erreur lors de la mise à jour de l'échéance",
      error instanceof Error ? error : undefined,
    );
  }
}
