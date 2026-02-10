import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { InternalServerError } from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour obtenir le planning des cours (jours de cours)
 */
export async function getPlanning(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    const client = coursClient || new Cours();
    console.log("Appel pour obtenir les jours de cours");

    const result = await client.obtenirLesJoursDeCours();
    console.log("Résultat des jours de cours:", result);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ [Get Planning] Erreur:", error);

    throw new InternalServerError(
      "Erreur serveur lors de la récupération du planning",
      error instanceof Error ? error : undefined,
    );
  }
}
