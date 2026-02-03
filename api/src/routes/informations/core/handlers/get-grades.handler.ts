/**
 * Handler GET /api/informations/grades
 * Récupère la liste de tous les grades (ceintures)
 */

import { Request, Response } from "express";
import { Informations } from "../../../../db/clients/informations/informations.js";
import { obtenirGrades } from "../services/informations.service.js";

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
  informationsClient?: Informations
): Promise<void> {
  try {
    console.log("📚 [Handler Informations] GET /grades - Récupération des grades");

    // Récupérer les grades via le service
    const grades = await obtenirGrades(informationsClient);

    if (!grades || grades.length === 0) {
      console.log("⚠️ [Handler Informations] Aucun grade trouvé");
      res.status(404).json({
        success: false,
        message: "Aucun grade trouvé",
        data: [],
      });
      return;
    }

    console.log(`✅ [Handler Informations] ${grades.length} grades récupérés`);

    res.status(200).json({
      success: true,
      message: "Grades récupérés avec succès",
      data: grades,
      count: grades.length,
    });
  } catch (error) {
    console.error("❌ [Handler Informations] Erreur récupération grades:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des grades",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
