import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour obtenir tous les cours
 */
export async function getAllCours(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const client = coursClient || new Cours();
    const cours = await client.obtenirTousLesCours();

    if (!cours || cours.length === 0) {
      throw new NotFoundError("Aucun cours à venir trouvé");
    }

    res.status(200).json({
      success: true,
      data: cours,
    });
  } catch (error) {
    console.error("❌ [Get All Cours] Erreur:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des cours",
      error instanceof Error ? error : undefined,
    );
  }
}
