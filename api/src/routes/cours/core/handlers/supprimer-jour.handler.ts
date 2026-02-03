import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";

/**
 * Handler pour supprimer un jour de cours récurrent
 */
export async function supprimerJour(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const joursDeSemaine: { [key: string]: number } = {
      lundi: 1,
      mardi: 2,
      mercredi: 3,
      jeudi: 4,
      vendredi: 5,
      samedi: 6,
      dimanche: 7,
    };

    const jourRecu = req.body;
    console.log("Body reçu pour suppression jour:", req.body);

    const jourTexte = jourRecu.jourSemaine;
    const jourNum = joursDeSemaine[jourTexte?.toLowerCase().trim()];

    if (!jourNum) {
      res.status(400).json({
        success: false,
        message:
          "Jour invalide. Veuillez fournir un jour valide (ex: lundi, mardi...)",
      });
      return;
    }

    const client = coursClient || new Cours();

    const result = await client.supprimerJourDeCours(jourNum);

    res.status(200).json({
      success: true,
      message: result.message || `Cours du ${jourTexte} supprimé avec succès`,
    });
  } catch (error) {
    console.error("❌ [Supprimer Jour] Erreur:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
