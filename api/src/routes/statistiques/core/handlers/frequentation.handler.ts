/**
 * Handler pour les statistiques de fréquentation et progression
 *
 * Gère les endpoints:
 * - GET /api/statistiques/frequentation/:utilisateurId
 * - GET /api/statistiques/progression/:userId
 * - GET /api/statistiques/presence/:userId
 * - GET /api/statistiques/presence-raw/:userId
 */

import { Request, Response } from "express";
import {
  obtenirStatistiquesFrequentation,
  obtenirProgressionUtilisateur,
  obtenirPresenceParMois,
} from "../services/index.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour récupérer les statistiques de fréquentation
 * GET /api/statistiques/frequentation/:utilisateurId
 */
export async function getFrequentation(req: Request, res: Response) {
  const { utilisateurId } = req.params;

  console.log(
    `📊 [Handler] GET /api/statistiques/frequentation/${utilisateurId} - Récupération fréquentation`,
  );

  try {
    // Validation de l'ID
    const userId = parseInt(utilisateurId);
    if (isNaN(userId) || userId <= 0) {
      console.log(`⚠️ [Handler] ID utilisateur invalide: ${utilisateurId}`);
      throw new ValidationError("ID utilisateur invalide", [
        {
          field: "utilisateurId",
          message: "L'ID doit être un nombre positif",
        },
      ]);
    }

    const data = await obtenirStatistiquesFrequentation(userId);

    console.log(
      `✅ [Handler] Statistiques de fréquentation récupérées pour l'utilisateur ${userId}`,
    );

    return res.status(200).json({
      success: true,
      data,
      message: "Statistiques de fréquentation récupérées avec succès",
    });
  } catch (error) {
    console.error(
      `❌ [Handler] Erreur récupération fréquentation pour utilisateur ${utilisateurId}:`,
      error,
    );

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    if (errorMessage.includes("Aucune statistique")) {
      throw new NotFoundError("Aucune statistique de fréquentation trouvée");
    }

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des statistiques de fréquentation",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour récupérer la progression d'un utilisateur
 * GET /api/statistiques/progression/:userId
 */
export async function getProgression(req: Request, res: Response) {
  const { userId } = req.params;

  console.log(
    `📊 [Handler] GET /api/statistiques/progression/${userId} - Récupération progression`,
  );

  try {
    // Validation de l'ID
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId) || parsedUserId <= 0) {
      console.log(`⚠️ [Handler] ID utilisateur invalide: ${userId}`);
      throw new ValidationError("ID utilisateur invalide", [
        {
          field: "userId",
          message: "L'ID doit être un nombre positif",
        },
      ]);
    }

    const data = await obtenirProgressionUtilisateur(parsedUserId);

    console.log(
      `✅ [Handler] Progression récupérée pour l'utilisateur ${parsedUserId}`,
    );

    return res.status(200).json({
      success: true,
      data,
      message: "Progression de l'utilisateur récupérée avec succès",
    });
  } catch (error) {
    console.error(
      `❌ [Handler] Erreur récupération progression pour utilisateur ${userId}:`,
      error,
    );

    const errorMessage =
      error instanceof Error ? error.message : "Erreur inconnue";

    if (errorMessage.includes("Aucune progression")) {
      throw new NotFoundError(
        "Aucune progression trouvée pour cet utilisateur",
      );
    }

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération de la progression",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour récupérer les présences par mois (formaté)
 * GET /api/statistiques/presence/:userId
 */
export async function getPresence(req: Request, res: Response) {
  const { userId } = req.params;

  console.log(
    `📊 [Handler] GET /api/statistiques/presence/${userId} - Récupération présences`,
  );

  try {
    // Validation de l'ID
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId) || parsedUserId <= 0) {
      console.log(`⚠️ [Handler] ID utilisateur invalide: ${userId}`);
      throw new ValidationError("ID utilisateur invalide", [
        {
          field: "userId",
          message: "L'ID doit être un nombre positif",
        },
      ]);
    }

    const data = await obtenirPresenceParMois(parsedUserId);

    console.log(
      `✅ [Handler] Présences récupérées pour l'utilisateur ${parsedUserId}`,
    );

    return res.status(200).json({
      success: true,
      data,
      message: "Statistiques de présence récupérées avec succès",
    });
  } catch (error) {
    console.error(
      `❌ [Handler] Erreur récupération présences pour utilisateur ${userId}:`,
      error,
    );

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des présences",
      error instanceof Error ? error : undefined,
    );
  }
}

/**
 * Handler pour récupérer les présences brutes (non formatées)
 * GET /api/statistiques/presence-raw/:userId
 */
export async function getPresenceRaw(req: Request, res: Response) {
  const { userId } = req.params;

  console.log(
    `📊 [Handler] GET /api/statistiques/presence-raw/${userId} - Récupération présences brutes`,
  );

  try {
    // Validation de l'ID
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId) || parsedUserId <= 0) {
      console.log(`⚠️ [Handler] ID utilisateur invalide: ${userId}`);
      throw new ValidationError("ID utilisateur invalide", [
        {
          field: "userId",
          message: "L'ID doit être un nombre positif",
        },
      ]);
    }

    const data = await obtenirPresenceParMois(parsedUserId);

    console.log(
      `✅ [Handler] Présences brutes récupérées pour l'utilisateur ${parsedUserId}`,
    );

    return res.status(200).json({
      success: true,
      data,
      count: data.length,
      message: "Présences brutes récupérées avec succès",
    });
  } catch (error) {
    console.error(
      `❌ [Handler] Erreur récupération présences brutes pour utilisateur ${userId}:`,
      error,
    );

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur serveur lors de la récupération des présences brutes",
      error instanceof Error ? error : undefined,
    );
  }
}
