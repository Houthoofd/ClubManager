import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour obtenir les cours auxquels un utilisateur est inscrit
 */
export async function getUtilisateurInscriptions(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const { userId } = req.params;

    if (!userId) {
      throw new ValidationError("L'ID de l'utilisateur est requis", [
        { field: "userId", message: "L'ID de l'utilisateur est requis" },
      ]);
    }

    const client = coursClient || new Cours();
    const inscriptions = await client.obtenirInscriptionsUtilisateur(
      Number(userId),
    );

    if (!inscriptions || inscriptions.length === 0) {
      throw new NotFoundError(
        "Aucune inscription trouvée pour cet utilisateur",
      );
    }

    res.status(200).json({
      success: true,
      data: inscriptions,
    });
  } catch (error) {
    console.error("❌ [Get Utilisateur Inscriptions] Erreur:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des inscriptions",
      error instanceof Error ? error : undefined,
    );
  }
}
