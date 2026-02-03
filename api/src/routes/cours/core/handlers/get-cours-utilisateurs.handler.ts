import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";

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
      res.status(400).json({
        success: false,
        message: "L'ID du cours est requis.",
      });
      return;
    }

    // Validation de l'ID
    const coursId = parseInt(id);
    if (isNaN(coursId) || coursId <= 0) {
      res.status(400).json({
        success: false,
        message: "L'ID du cours doit être un nombre positif.",
      });
      return;
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
    res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération du cours et des utilisateurs.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
