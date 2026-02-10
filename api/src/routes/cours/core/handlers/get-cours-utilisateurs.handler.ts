import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour obtenir les utilisateurs inscrits à un cours
 */
export async function getCoursUtilisateurs(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const { id } = req.params;
    const client = coursClient || new Cours();

    if (!id) {
      throw new ValidationError("L'ID du cours est requis", [
        { field: "id", message: "L'ID du cours est requis" },
      ]);
    }

    // Validation de l'ID
    const coursId = parseInt(id);
    if (isNaN(coursId) || coursId <= 0) {
      throw new ValidationError("L'ID du cours doit être un nombre positif", [
        { field: "id", message: "L'ID du cours doit être un nombre positif" },
      ]);
    }

    // Récupérer les utilisateurs associés à ce cours
    const utilisateursParCours =
      await client.obtenirUtilisateursParCours(coursId);

    res.status(200).json({
      success: true,
      data: {
        Cours: utilisateursParCours,
      },
      message: "Cours récupéré avec succès",
    });
  } catch (error) {
    console.error("❌ [Get Cours Utilisateurs] Erreur:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération du cours et des utilisateurs",
      error instanceof Error ? error : undefined,
    );
  }
}
