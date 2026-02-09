/**
 * Handler POST /api/utilisateurs/connexion-userid
 * Connexion d'un utilisateur par userId
 */

import { Request, Response } from "express";
import { Utilisateurs } from "../../../../db/clients/utilisateurs/utilisateurs.js";
import { connexionParUserId } from "../services/utilisateurs.service.js";
import { connexionUserIdSchema } from "@clubmanager/types/dist/validators.js";

/**
 * Handler pour la connexion par userId
 * POST /api/utilisateurs/connexion-userid
 *
 * Body:
 * {
 *   userId: string,
 *   password: string
 * }
 *
 * @returns 200 - Connexion réussie avec données utilisateur
 * @returns 404 - Utilisateur non trouvé ou mot de passe incorrect
 * @returns 400 - Données invalides
 * @returns 500 - Erreur serveur
 */
export async function connexionUserId(
  req: Request,
  res: Response,
  utilisateursClient?: Utilisateurs,
): Promise<void> {
  try {
    console.log(
      "🔐 [Handler Utilisateurs] POST /connexion-userid - Connexion par userId",
    );

    // Validation avec Zod
    const validationResult = connexionUserIdSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.log(
        "⚠️ [Handler Utilisateurs] Erreur de validation:",
        validationResult.error.issues,
      );
      res.status(400).json({
        success: false,
        message:
          validationResult.error.issues[0]?.message || "Données invalides",
        errors: validationResult.error.issues,
      });
      return;
    }

    const { userId, password } = validationResult.data;

    console.log(`🔐 [Handler Utilisateurs] Tentative de connexion: ${userId}`);

    // Appeler le service
    const result = await connexionParUserId(
      userId,
      password,
      utilisateursClient,
    );

    if (result.success) {
      console.log(
        `✅ [Handler Utilisateurs] Connexion réussie pour: ${userId}`,
      );
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
      });
    } else {
      console.log(
        `⚠️ [Handler Utilisateurs] Connexion échouée pour: ${userId}`,
      );
      res.status(404).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error: any) {
    console.error("❌ [Handler Utilisateurs] Erreur connexion userId:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la connexion",
      error: error.message || "Erreur inconnue",
    });
  }
}
