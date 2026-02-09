/**
 * Handler GET /api/utilisateurs/:id
 * Récupère un utilisateur par son ID
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { obtenirUtilisateurParId } from "../services/utilisateurs.service.js";
import { utilisateurIdParamSchema } from "@clubmanager/types/dist/validators.js";

/**
 * Handler pour récupérer un utilisateur par ID
 * GET /api/utilisateurs/:id
 *
 * Params:
 * - id: ID de l'utilisateur
 *
 * @returns 200 - Utilisateur trouvé
 * @returns 404 - Utilisateur non trouvé
 * @returns 400 - ID invalide
 * @returns 500 - Erreur serveur
 */
export async function getUtilisateurById(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs,
): Promise<void> {
  try {
    console.log(
      `👤 [Handler Utilisateurs] GET /utilisateurs/:id - ID: ${req.params.id}`,
    );

    // Validation de l'ID
    const validationResult = utilisateurIdParamSchema.safeParse({
      id: req.params.id,
    });

    if (!validationResult.success) {
      console.log(
        "⚠️ [Handler Utilisateurs] ID invalide:",
        validationResult.error.issues,
      );
      res.status(400).json({
        message:
          validationResult.error.issues[0]?.message ||
          "L'ID de l'utilisateur doit être un nombre entier positif",
      });
      return;
    }

    const utilisateurId = validationResult.data.id;

    // Récupérer l'utilisateur via le service
    const utilisateur = await obtenirUtilisateurParId(
      utilisateurId,
      utilisateursClient,
    );

    if (!utilisateur) {
      console.log(
        `⚠️ [Handler Utilisateurs] Utilisateur ${utilisateurId} non trouvé`,
      );
      res.status(404).json({
        message: "Utilisateur non trouvé",
        data: null,
      });
      return;
    }

    console.log(
      `✅ [Handler Utilisateurs] Utilisateur ${utilisateurId} récupéré`,
    );

    // Supprimer le mot de passe de la réponse
    if (utilisateur.password) {
      delete utilisateur.password;
    }

    res.status(200).json({
      message: "Utilisateur récupéré avec succès",
      data: utilisateur,
    });
  } catch (error: any) {
    console.error(
      "❌ [Handler Utilisateurs] Erreur récupération utilisateur:",
      error,
    );

    res.status(500).json({
      message: "Erreur serveur lors de la récupération de l'utilisateur",
      error: error.message || "Erreur inconnue",
    });
  }
}
