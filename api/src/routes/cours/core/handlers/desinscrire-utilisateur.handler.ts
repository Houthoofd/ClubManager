import { Request, Response } from "express";
import { Cours } from "../../../../db/clients/cours/cours.js";
import { z } from "zod";
import { DataAnnulation, datannulationSchema } from "@clubmanager/types";

/**
 * Handler pour désinscrire un utilisateur d'un cours
 */
export async function desinscrireUtilisateur(
  req: Request,
  res: Response,
  coursClient?: Cours,
): Promise<void> {
  try {
    console.log("Désinscription utilisateur:", req.body);

    // Validation avec Zod - lance automatiquement ZodError si invalide
    const parsedData = datannulationSchema.parse(req.body);

    const validatedData: DataAnnulation = {
      utilisateur_nom: parsedData.utilisateur_nom,
      utilisateur_prenom: parsedData.utilisateur_prenom,
      cours_id: parsedData.cours_id,
    };

    console.log("Données validées :", validatedData);

    const client = coursClient || new Cours();
    const result = await client.desinscrireUtilisateurDuCours(validatedData);

    if (result && result.isConfirm) {
      res.status(200).json({
        success: true,
        message: "Utilisateur désinscrit avec succès.",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Inscription non trouvée.",
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
      console.error(
        "❌ [Désinscrire Utilisateur] Erreur de validation:",
        error,
      );

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
      console.error("❌ [Désinscrire Utilisateur] Erreur:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la désinscription de l'utilisateur.",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
    }
  }
}
