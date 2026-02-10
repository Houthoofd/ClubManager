import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { z } from "zod";
import { DataValidation, datavalidationSchema } from "@clubmanager/types";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour valider la présence d'un utilisateur à un cours
 */
export async function validerPresence(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    console.log("Validation de présence:", req.body);

    // Validation avec Zod - lance automatiquement ZodError si invalide
    const parsedData = datavalidationSchema.parse(req.body);

    const validatedData: DataValidation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id,
    };

    console.log("Données validées :", validatedData);

    const client = coursClient || new Cours();
    const result = await client.validerUtilisateurAuCours(validatedData);

    if (result && result.isConfirm) {
      res.status(200).json({
        success: true,
        message: "Présence validée avec succès.",
      });
    } else {
      throw new NotFoundError("Présence non trouvée ou déjà validée");
    }
  } catch (error) {
    console.error("❌ [Valider Présence] Erreur:", error);

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

    throw new InternalServerError(
      "Erreur serveur lors de la validation de la présence",
      error instanceof Error ? error : undefined,
    );
  }
}
