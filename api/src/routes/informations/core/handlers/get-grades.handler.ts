/**
 * Handler GET /api/informations/grades
 * Récupère la liste de tous les grades (ceintures)
 */

import { Request, Response } from "express";
import { Informations } from "../../../../db/clients/informations/informations.js";
import { obtenirGrades } from "../services/informations.service.js";
import {
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer tous les grades
 * GET /api/informations/grades
 *
 * @returns 200 - Liste des grades
 * @returns 404 - Aucun grade trouvé
 * @returns 500 - Erreur serveur
 */
export async function getGrades(
  req: Request,
  res: Response,
  informationsClient?: Informations,
): Promise<void> {
  try {
    console.log(
      "📚 [Handler Informations] GET /grades - Récupération des grades",
    );

    // Récupérer les grades via le service
    const grades = await obtenirGrades(informationsClient);

    if (!grades || grades.length === 0) {
      console.log("⚠️ [Handler Informations] Aucun grade trouvé");
      throw new NotFoundError("Aucun grade trouvé");
    }

    console.log(`✅ [Handler Informations] ${grades.length} grades récupérés`);

    res.status(200).json({
      success: true,
      message: "Grades récupérés avec succès",
      data: grades,
      count: grades.length,
    });
  } catch (error) {
    console.error(
      "❌ [Handler Informations] Erreur récupération grades:",
      error,
    );

    // Re-throw les erreurs GraphQL
    if (error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des grades",
      error instanceof Error ? error : undefined,
    );
  }
}
