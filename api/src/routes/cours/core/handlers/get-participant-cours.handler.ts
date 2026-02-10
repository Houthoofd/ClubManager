import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour obtenir les cours d'un participant
 */
export async function getParticipantCours(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const client = coursClient || new Cours();
    const { nom, prenom } = req.body;

    if (!nom || !prenom) {
      throw new ValidationError("Données manquantes", [
        { field: "nom", message: "Champ requis" },
        { field: "prenom", message: "Champ requis" },
      ]);
    }

    // Récupérer l'ID du participant
    const participantId = await client.obtenirIdParticipantParNomPrenom(
      nom,
      prenom,
    );

    // Récupérer les cours du participant
    const cours = await client.obtenirLesCoursPourParticipant(participantId);

    if (!cours || cours.length === 0) {
      throw new NotFoundError("Aucun cours trouvé pour ce participant");
    }

    res.status(200).json({
      success: true,
      data: cours,
    });
  } catch (error) {
    console.error("❌ [Get Participant Cours] Erreur:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des cours",
      error instanceof Error ? error : undefined,
    );
  }
}
