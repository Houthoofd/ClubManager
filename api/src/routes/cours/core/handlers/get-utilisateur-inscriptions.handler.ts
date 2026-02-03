import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";

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
      res.status(400).json({
        success: false,
        message: "L'ID de l'utilisateur est requis.",
      });
      return;
    }

    const client = coursClient || new Cours();
    const inscriptions = await client.obtenirInscriptionsUtilisateur(
      Number(userId),
    );

    if (!inscriptions || inscriptions.length === 0) {
      res.status(404).json({
        success: false,
        message: "Aucune inscription trouvée pour cet utilisateur.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: inscriptions,
    });
  } catch (error) {
    console.error("❌ [Get Utilisateur Inscriptions] Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des inscriptions.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
