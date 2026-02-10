import { Request, Response } from "express";
import { modifierStatutProfesseur } from "../services/index.js";
import { modifierStatutProfesseurSchema } from "@clubmanager/types/validators";
import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";
import { z } from "zod";

/**
 * Handler pour modifier le statut d'un professeur
 * POST /api/professeurs/modifier
 */
export async function modifierStatutProfesseurHandler(
  req: Request,
  res: Response,
  professeursClient?: Professeurs,
) {
  console.log(
    "📝 [Handler] POST /api/professeurs/modifier - Modification statut professeur",
  );

  try {
    const { id, status_id } = req.body;

    console.log(
      `📋 [Handler] Données reçues: id=${id}, status_id=${status_id}`,
    );

    // Validation des données requises (accepte 0 comme valeur valide)
    if (
      id === undefined ||
      id === null ||
      status_id === undefined ||
      status_id === null
    ) {
      console.log("⚠️ [Handler] Données manquantes");
      throw new ValidationError("ID et status_id requis", [
        { field: "id", message: "Champ requis" },
        { field: "status_id", message: "Champ requis" },
      ]);
    }

    // Validation avec Zod
    try {
      modifierStatutProfesseurSchema.parse({ id, status_id });
    } catch (validationError: any) {
      console.log("⚠️ [Handler] Erreur de validation:", validationError.errors);
      if (validationError instanceof z.ZodError) {
        throw new ValidationError(
          "Données invalides",
          formatZodErrors(validationError.errors),
        );
      }
      throw validationError;
    }

    // Modifier le statut
    const result = await modifierStatutProfesseur(
      id,
      status_id,
      professeursClient,
    );

    console.log("📊 [Handler] Résultat modification:", result);

    if (!result.success) {
      console.log("⚠️ [Handler] Échec de la modification");
      throw new ValidationError(
        result.message || "Échec de la modification du statut",
        [
          {
            field: "status_id",
            message: result.error || "Échec de la modification du statut",
          },
        ],
      );
    }

    return res.status(200).json({
      success: true,
      message: result.message || "Statut du professeur modifié avec succès",
      data: result.data || { id, status_id },
    });
  } catch (error) {
    console.error(
      "❌ [Handler] Erreur lors de la modification du statut:",
      error,
    );

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la modification du statut",
      error instanceof Error ? error : undefined,
    );
  }
}
