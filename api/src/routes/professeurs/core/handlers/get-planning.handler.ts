import { Request, Response } from "express";
import { obtenirPlanningProfesseur } from "../services/index.js";
import { getPlanningProfesseurSchema } from "@clubmanager/types/validators";
import { Professeurs } from "../../../../db/clients/professeurs/professeurs.js";
import {
  ValidationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";
import { formatZodErrors } from "../../../../shared/errors/GraphQLErrors.js";
import { z } from "zod";

/**
 * Handler pour récupérer le planning d'un professeur
 * GET /api/professeurs/:id/planning
 */
export async function getPlanningProfesseur(
  req: Request,
  res: Response,
  professeursClient?: Professeurs,
) {
  const { id } = req.params;

  console.log(
    `📅 [Handler] GET /api/professeurs/${id}/planning - Récupération du planning`,
  );

  try {
    // Validation de l'ID
    let validatedData;
    try {
      validatedData = getPlanningProfesseurSchema.parse({ id });
    } catch (validationError: any) {
      console.log(`⚠️ [Handler] Erreur de validation:`, validationError.errors);
      if (validationError instanceof z.ZodError) {
        throw new ValidationError(
          "ID du professeur invalide",
          formatZodErrors(validationError.errors),
        );
      }
      throw validationError;
    }

    const professeurId = validatedData.id;

    console.log(
      `🔍 [Handler] Récupération planning pour professeur ID: ${professeurId}`,
    );

    // Récupérer le planning
    const planningResult = await obtenirPlanningProfesseur(
      professeurId,
      professeursClient,
    );

    console.log(
      `✅ [Handler] Planning récupéré:`,
      planningResult.isFind
        ? `${planningResult.data.length} cours`
        : "aucun cours",
    );

    return res.status(200).json({
      success: planningResult.isFind,
      isFind: planningResult.isFind,
      message: planningResult.message,
      data: planningResult.data,
      count: planningResult.data.length,
      professeur_id: professeurId,
    });
  } catch (error) {
    console.error(
      `❌ [Handler] Erreur récupération planning professeur ${id}:`,
      error,
    );

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération du planning",
      error instanceof Error ? error : undefined,
    );
  }
}
