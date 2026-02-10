import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

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
      throw new ValidationError(
        "Jour invalide. Veuillez fournir un jour valide (ex: lundi, mardi...)",
        [
          {
            field: "jourSemaine",
            message:
              "Jour invalide. Veuillez fournir un jour valide (ex: lundi, mardi...)",
          },
        ],
      );
    }

    const client = coursClient || new Cours();

    const result = await client.supprimerJourDeCours(jourNum);

    res.status(200).json({
      success: true,
      message: result.message || `Cours du ${jourTexte} supprimé avec succès`,
    });
  } catch (error) {
    console.error("❌ [Supprimer Jour] Erreur:", error);

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la suppression",
      error instanceof Error ? error : undefined,
    );
  }
}
