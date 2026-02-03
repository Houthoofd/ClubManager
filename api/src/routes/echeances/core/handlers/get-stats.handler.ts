import { Request, Response } from "express";
import { z } from "zod";
import {
  obtenirStatistiquesUtilisateur,
  diagnosticEcheance,
} from "../services/echeances.service.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour récupérer les statistiques des échéances d'un utilisateur
 * GET /api/echeances/statistiques/:userId
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 */
export async function getStatistiquesUtilisateur(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const userIdParam = req.params.userId;

    console.log(
      `📊 [Handler Échéances] GET /statistiques/:userId - Récupération statistiques pour utilisateur ${userIdParam}`,
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

    // Récupérer les statistiques via le service
    const { statistiques, echeances } = await obtenirStatistiquesUtilisateur(
      userId,
      paiementsClient,
    );

    console.log(
      `✅ [Handler Échéances] Statistiques récupérées pour utilisateur ${userId}:`,
      statistiques,
    );

    // Générer des suggestions de test
    const echeancesEnAttente = echeances
      .filter((e) => e.statut === "en attente")
      .slice(0, 3);

    const baseUrl =
      req.get && req.protocol
        ? `${req.protocol}://${req.get("host")}`
        : "http://localhost:3000";

    const suggestions = echeancesEnAttente.map((e) => ({
      id: e.id,
      montant: e.montant,
      date_echeance: e.date_echeance,
      url_test: `${baseUrl}/pages/paiement?echeance=${e.id}&userId=${userId}`,
    }));

    res.status(200).json({
      success: true,
      utilisateur_id: userId,
      echeances: echeances,
      statistiques: statistiques,
      suggestions_test: {
        echeance_la_plus_recente: echeances[0]?.id || null,
        echeances_en_attente: suggestions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `❌ [Handler Échéances] Erreur récupération statistiques:`,
      error,
    );

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour le diagnostic d'une échéance pour un utilisateur
 * GET /api/echeances/debug/echeance/:echeanceId/user/:userId
 *
 * Params:
 * - echeanceId: number - ID de l'échéance
 * - userId: number - ID de l'utilisateur
 */
export async function getDiagnosticEcheance(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const { echeanceId, userId } = req.params;

    console.log(
      `🔍 [Handler Échéances] GET /debug/echeance/${echeanceId}/user/${userId} - Diagnostic`,
    );

    // Validation des IDs
    if (!/^\d+$/.test(echeanceId) || !/^\d+$/.test(userId)) {
      res.status(400).json({
        success: false,
        message: "IDs invalides",
        error: "Les IDs doivent être des nombres positifs",
      });
      return;
    }

    const echeanceIdNum = parseInt(echeanceId, 10);
    const userIdNum = parseInt(userId, 10);

    if (
      isNaN(echeanceIdNum) ||
      echeanceIdNum <= 0 ||
      isNaN(userIdNum) ||
      userIdNum <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "IDs invalides",
        error: "Les IDs doivent être des nombres positifs",
      });
      return;
    }

    // Effectuer le diagnostic via le service
    const diagnostic = await diagnosticEcheance(
      echeanceIdNum,
      userIdNum,
      paiementsClient,
    );

    console.log(
      `✅ [Handler Échéances] Diagnostic effectué pour échéance ${echeanceIdNum}`,
    );

    res.status(200).json({
      success: true,
      diagnostic,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌ [Handler Échéances] Erreur diagnostic:`, error);

    res.status(500).json({
      success: false,
      message: "Erreur lors du diagnostic",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour obtenir toutes les échéances d'un utilisateur avec détails
 * GET /api/echeances/debug/user/:userId/echeances
 *
 * Params:
 * - userId: number - ID de l'utilisateur
 */
export async function getDebugEcheancesUtilisateur(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const userIdParam = req.params.userId;

    console.log(
      `🔍 [Handler Échéances] GET /debug/user/${userIdParam}/echeances - Liste complète`,
    );

    // Validation stricte
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

    // Utiliser le même service que pour les statistiques
    const { statistiques, echeances } = await obtenirStatistiquesUtilisateur(
      userId,
      paiementsClient,
    );

    console.log(
      `✅ [Handler Échéances] Debug - ${echeances.length} échéances trouvées pour utilisateur ${userId}`,
    );

    const baseUrl =
      req.get && req.protocol
        ? `${req.protocol}://${req.get("host")}`
        : "http://localhost:3000";

    res.status(200).json({
      success: true,
      utilisateur_id: userId,
      echeances: echeances,
      statistiques: statistiques,
      suggestions_test: {
        echeance_la_plus_recente: echeances[0]?.id || null,
        echeances_en_attente: echeances
          .filter((e) => e.statut === "en attente")
          .slice(0, 3)
          .map((e) => ({
            id: e.id,
            url: `${baseUrl}/pages/paiement?echeance=${e.id}&userId=${userId}`,
            montant: e.montant,
            date_echeance: e.date_echeance,
          })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `❌ [Handler Échéances] Erreur debug liste échéances:`,
      error,
    );

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des échéances utilisateur",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
