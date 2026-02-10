import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { z } from "zod";
import { DataAnnulation, datannulationSchema } from "@clubmanager/types";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour annuler la présence d'un utilisateur à un cours
 */
export async function annulerPresence(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    console.log("Annulation de présence:", req.body);

    // Validation avec Zod - lance automatiquement ZodError si invalide
    const parsedData = datannulationSchema.parse(req.body);

    const validatedData: DataAnnulation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id,
    };

    console.log("Données validées :", validatedData);

    const client = coursClient || new Cours();
    const result = await client.annulerUtilisateurAuCours(validatedData);

    if (result && result.isConfirm) {
      res.status(200).json({
        success: true,
        message: "Présence annulée avec succès.",
      });
    } else {
      throw new NotFoundError("Présence non trouvée ou déjà annulée");
    }
  } catch (error) {
    console.error("❌ [Annuler Presence] Erreur:", error);

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
      "Erreur serveur lors de l'annulation de la présence",
      error instanceof Error ? error : undefined,
    );
  }
}
