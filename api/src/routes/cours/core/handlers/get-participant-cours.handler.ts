import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";

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
      res.status(400).json({
        success: false,
        message: "Nom et prénom requis.",
      });
      return;
    }

    // Récupérer l'ID du participant
    const participantId = await client.obtenirIdParticipantParNomPrenom(
      nom,
      prenom,
    );

    // Récupérer les cours du participant
    const cours = await client.obtenirLesCoursPourParticipant(participantId);

    if (!cours || cours.length === 0) {
      res.status(404).json({
        success: false,
        message: "Aucun cours trouvé pour ce participant.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: cours,
    });
  } catch (error) {
    console.error("❌ [Get Participant Cours] Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des cours.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
