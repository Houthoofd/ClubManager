/**
 * Handler PUT /api/utilisateurs/:id
 * Met à jour un utilisateur existant
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { mettreAJourUtilisateur } from "../services/utilisateurs.service.js";
import {
  miseAJourUtilisateurSchema,
  utilisateurIdParamSchema,
} from "@clubmanager/types/dist/validators.js";

/**
 * Handler pour mettre à jour un utilisateur
 * PUT /api/utilisateurs/:id
 *
 * Params:
 * - id: ID de l'utilisateur
 *
 * Body (tous optionnels):
 * {
 *   email?: string,
 *   date_naissance?: string (YYYY-MM-DD),
 *   genres?: number,
 *   grades?: number,
 *   abonnement?: number,
 *   status?: number,
 *   password?: string
 * }
 *
 * @returns 200 - Utilisateur mis à jour avec succès
 * @returns 400 - Données invalides
 * @returns 404 - Utilisateur non trouvé
 * @returns 500 - Erreur serveur
 */
export async function updateUtilisateur(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs,
): Promise<void> {
  try {
    console.log(
      `🔄 [Handler Utilisateurs] PUT /utilisateurs/:id - Mise à jour utilisateur ID: ${req.params.id}`,
    );

    // Validation de l'ID
    const idValidation = utilisateurIdParamSchema.safeParse({
      id: req.params.id,
    });

    if (!idValidation.success) {
      console.log(
        "⚠️ [Handler Utilisateurs] ID invalide:",
        idValidation.error.issues,
      );
      res.status(400).json({
        message:
          idValidation.error.issues[0]?.message ||
          "L'ID de l'utilisateur doit être un nombre entier positif",
      });
      return;
    }

    const utilisateurId = idValidation.data.id;

    // Validation des données de mise à jour
    const validationResult = miseAJourUtilisateurSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.log(
        "⚠️ [Handler Utilisateurs] Erreur de validation:",
        validationResult.error.issues,
      );
      res.status(400).json({
        message:
          validationResult.error.issues[0]?.message || "Données invalides",
        errors: validationResult.error.issues,
      });
      return;
    }

    const dataToUpdate = validationResult.data;

    console.log(
      `[Handler Utilisateurs] Données à mettre à jour:`,
      dataToUpdate,
    );

    // Appeler le service de mise à jour
    const result = await mettreAJourUtilisateur(
      utilisateurId,
      dataToUpdate,
      utilisateursClient,
    );

    if (result.success) {
      console.log(
        `✅ [Handler Utilisateurs] Utilisateur ${utilisateurId} mis à jour avec succès`,
      );
      res.status(200).json({
        message: result.message,
        data: result.data,
      });
    } else {
      console.log(
        `⚠️ [Handler Utilisateurs] Échec mise à jour utilisateur ${utilisateurId}`,
      );
      res.status(404).json({
        message: result.message || "Utilisateur non trouvé",
      });
    }
  } catch (error: any) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur mise à jour utilisateur:",
      error,
    );

    res.status(500).json({
      message: "Erreur serveur lors de la mise à jour de l'utilisateur",
      error: error.message || "Erreur inconnue",
    });
  }
}
