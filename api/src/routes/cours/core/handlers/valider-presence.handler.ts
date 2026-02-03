import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { z } from "zod";
import { DataValidation, datavalidationSchema } from "@clubmanager/types";

/**
 * Handler pour valider la présence d'un utilisateur à un cours
 */
export async function validerPresence(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    console.log("Validation de présence:", req.body);

    // Validation avec Zod - lance automatiquement ZodError si invalide
    const parsedData = datavalidationSchema.parse(req.body);

    const validatedData: DataValidation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id,
    };

    console.log("Données validées :", validatedData);

    const client = coursClient || new Cours();
    const result = await client.validerUtilisateurAuCours(validatedData);

    if (result && result.isConfirm) {
      res.status(200).json({
        success: true,
        message: "Présence validée avec succès.",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Présence non trouvée ou déjà validée.",
      });
    }
  } catch (error) {
    // Vérifier si c'est une erreur Zod (via instanceof ou nom de classe)
    const isZodError =
      error instanceof z.ZodError ||
      (error && typeof error === "object" && "issues" in error) ||
      (error &&
        typeof error === "object" &&
        error.constructor?.name === "ZodError");

    if (isZodError && error && typeof error === "object" && "errors" in error) {
      console.error("❌ [Valider Présence] Erreur de validation:", error);

      // Extraire le premier message d'erreur pour plus de clarté
      const errors = (error as any).errors || (error as any).issues || [];
      const firstError = errors[0];
      const message = firstError?.message || "Données invalides";

      res.status(400).json({
        success: false,
        message: message,
        errors: errors,
      });
    } else {
      console.error("❌ [Valider Présence] Erreur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la validation de la présence.",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}
