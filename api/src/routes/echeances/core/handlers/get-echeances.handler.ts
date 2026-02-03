import { Request, Response } from "express";
import { z } from "zod";
import { obtenirEcheancesUtilisateur as obtenirEcheancesUtilisateurService } from "../services/echeances.service.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour récupérer toutes les échéances d'un utilisateur
 * GET /api/echeances/:userId
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 */
export async function getEcheancesUtilisateur(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const userIdParam = req.params.userId;

    console.log(
      `🔍 [Handler Échéances] GET /:userId - Récupération échéances pour utilisateur ${userIdParam}`,
    );

    // Validation stricte: rejeter si contient des caractères non numériques
    if (!/^\d+$/.test(userIdParam)) {
      res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
        error: "L'ID doit être un nombre positif",
      });
      return;
    }

    const userId = parseInt(userIdParam, 10);

    if (isNaN(userId) || userId <= 0) {
      res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
        error: "L'ID doit être un nombre positif",
      });
      return;
    }

    // Récupérer les échéances via le service
    const echeances = await obtenirEcheancesUtilisateurService(
      userId,
      paiementsClient,
    );

    if (!echeances || echeances.length === 0) {
      console.log(
        `⚠️ [Handler Échéances] Aucune échéance pour utilisateur ${userId}`,
      );
      res.status(200).json({
        success: true,
        data: [],
        count: 0,
        utilisateur_id: userId,
        message: "Aucune échéance trouvée pour cet utilisateur",
      });
      return;
    }

    console.log(
      `✅ [Handler Échéances] ${echeances.length} échéances trouvées pour utilisateur ${userId}`,
    );

    res.status(200).json({
      success: true,
      data: echeances,
      count: echeances.length,
      utilisateur_id: userId,
    });
  } catch (error) {
    console.error(`❌ [Handler Échéances] Erreur GET /:userId:`, error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des échéances",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
