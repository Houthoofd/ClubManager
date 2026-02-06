import { Request, Response } from "express";
import { obtenirPlanningProfesseur } from "../services/index.js";
import { getPlanningProfesseurSchema } from "../validators/index.js";

/**
 * Handler pour récupérer le planning d'un professeur
 * GET /api/professeurs/:id/planning
 */
export async function getPlanningProfesseur(req: Request, res: Response) {
  const { id } = req.params;

  console.log(`📅 [Handler] GET /api/professeurs/${id}/planning - Récupération du planning`);

  try {
    // Validation de l'ID
    let validatedData;
    try {
      validatedData = getPlanningProfesseurSchema.parse({ id });
    } catch (validationError: any) {
      console.log(`⚠️ [Handler] Erreur de validation:`, validationError.errors);
      return res.status(400).json({
        success: false,
        isFind: false,
        message: "ID du professeur invalide",
        errors: validationError.errors,
        data: [],
      });
    }

    const professeurId = validatedData.id;

    console.log(`🔍 [Handler] Récupération planning pour professeur ID: ${professeurId}`);

    // Récupérer le planning
    const planningResult = await obtenirPlanningProfesseur(professeurId);

    console.log(
      `✅ [Handler] Planning récupéré:`,
      planningResult.isFind ? `${planningResult.data.length} cours` : "aucun cours"
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
    console.error(`❌ [Handler] Erreur récupération planning professeur ${id}:`, error);

    return res.status(500).json({
      success: false,
      isFind: false,
      message: "Erreur serveur lors de la récupération du planning",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      data: [],
    });
  }
}
