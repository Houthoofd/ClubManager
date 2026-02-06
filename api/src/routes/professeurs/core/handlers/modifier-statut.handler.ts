import { Request, Response } from "express";
import { modifierStatutProfesseur } from "../services/index.js";
import { modifierStatutProfesseurSchema } from "../validators/index.js";

/**
 * Handler pour modifier le statut d'un professeur
 * POST /api/professeurs/modifier
 */
export async function modifierStatutProfesseurHandler(req: Request, res: Response) {
  console.log("📝 [Handler] POST /api/professeurs/modifier - Modification statut professeur");

  try {
    const { id, status_id } = req.body;

    console.log(`📋 [Handler] Données reçues: id=${id}, status_id=${status_id}`);

    // Validation des données requises
    if (!id || !status_id) {
      console.log("⚠️ [Handler] Données manquantes");
      return res.status(400).json({
        success: false,
        message: "ID et status_id requis",
        error: "Les champs id et status_id sont obligatoires",
      });
    }

    // Validation avec Zod
    try {
      modifierStatutProfesseurSchema.parse({ id, status_id });
    } catch (validationError: any) {
      console.log("⚠️ [Handler] Erreur de validation:", validationError.errors);
      return res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: validationError.errors,
      });
    }

    // Modifier le statut
    const result = await modifierStatutProfesseur(id, status_id);

    console.log("📊 [Handler] Résultat modification:", result);

    if (!result.success) {
      console.log("⚠️ [Handler] Échec de la modification");
      return res.status(400).json({
        success: false,
        message: result.message || "Échec de la modification du statut",
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message || "Statut du professeur modifié avec succès",
      data: result.data || { id, status_id },
    });
  } catch (error) {
    console.error("❌ [Handler] Erreur lors de la modification du statut:", error);

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la modification du statut",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
