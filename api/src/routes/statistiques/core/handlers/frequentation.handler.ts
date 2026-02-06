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
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
        error: "L'ID doit être un nombre positif",
      });
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
      return res.status(404).json({
        success: false,
        message: "Aucune statistique de fréquentation trouvée",
        error: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération des statistiques de fréquentation",
      error: errorMessage,
    });
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
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
        error: "L'ID doit être un nombre positif",
      });
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
      return res.status(404).json({
        success: false,
        message: "Aucune progression trouvée pour cet utilisateur",
        error: errorMessage,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de la progression",
      error: errorMessage,
    });
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
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
        error: "L'ID doit être un nombre positif",
      });
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

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des présences",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
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
      return res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
        error: "L'ID doit être un nombre positif",
      });
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

    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des présences brutes",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
