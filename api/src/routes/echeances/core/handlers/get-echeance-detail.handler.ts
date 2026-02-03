import { Request, Response } from "express";
import { z } from "zod";
import { obtenirDetailEcheance } from "../services/echeances.service.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour récupérer les détails d'une échéance spécifique
 * GET /api/echeances/detail/:echeanceId
 *
 * Params:
 * - echeanceId: number - ID de l'échéance
 *
 * Query:
 * - userId?: number - ID de l'utilisateur (optionnel, pour vérification de sécurité)
 */
export async function getEcheanceDetail(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const { echeanceId } = req.params;
    const userId = (req as any).user?.id;

    console.log("🔍 [Handler Échéances] Récupération détail échéance:", {
      echeanceId,
      userId,
      userFromToken: !!userId,
      timestamp: new Date().toISOString(),
    });

    // Validation de l'ID échéance
    if (!echeanceId || !/^\d+$/.test(echeanceId)) {
      res.status(400).json({
        success: false,
        error: "ID échéance invalide",
        received: echeanceId,
      });
      return;
    }

    const echeanceIdNum = parseInt(echeanceId, 10);

    // Si userId est fourni dans le token, on vérifie l'appartenance
    const echeance = await obtenirDetailEcheance(
      echeanceIdNum,
      userId,
      paiementsClient,
    );

    if (!echeance) {
      console.warn(
        "⚠️ [Handler Échéances] Échéance non trouvée ou accès non autorisé:",
        {
          echeanceId: echeanceIdNum,
          userId,
        },
      );

      res.status(404).json({
        success: false,
        error: "Échéance non trouvée",
        message: userId
          ? "Cette échéance n'existe pas ou ne vous appartient pas"
          : "Échéance non trouvée",
        echeanceId: echeanceIdNum,
      });
      return;
    }

    console.log("✅ [Handler Échéances] Détail échéance récupéré:", {
      id: echeance.id,
      montant: echeance.montant,
      statut: echeance.statut,
      utilisateur: echeance.utilisateur_id,
    });

    res.status(200).json({
      success: true,
      data: echeance,
    });
  } catch (error) {
    console.error(
      "❌ [Handler Échéances] Erreur récupération détail échéance:",
      error,
    );

    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'échéance",
      details: error instanceof Error ? error.message : "Erreur inconnue",
      echeanceId: req.params.echeanceId,
    });
  }
}

/**
 * Handler pour la route de compatibilité /echeance/:echeanceId
 * GET /api/echeances/echeance/:echeanceId
 *
 * Cette route maintient la compatibilité avec l'ancien système
 */
export async function getEcheanceCompat(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const { echeanceId } = req.params;
    const userId = req.query.userId as string | undefined;

    console.log(
      `🔄 [Handler Échéances] Route de compatibilité /echeance/${echeanceId} appelée avec userId=${userId}`,
    );

    // Validation de l'ID échéance
    if (!echeanceId || !/^\d+$/.test(echeanceId)) {
      res.status(400).json({
        success: false,
        error: "ID échéance invalide",
        echeanceId: echeanceId,
      });
      return;
    }

    const echeanceIdNum = parseInt(echeanceId, 10);
    const userIdNum = userId ? parseInt(userId, 10) : undefined;

    // Récupérer l'échéance avec ou sans vérification utilisateur
    const echeance = await obtenirDetailEcheance(
      echeanceIdNum,
      userIdNum,
      paiementsClient,
    );

    if (!echeance) {
      res.status(404).json({
        success: false,
        error: "Échéance non trouvée",
        message: userIdNum
          ? "Cette échéance n'existe pas ou ne vous appartient pas"
          : "Échéance non trouvée",
      });
      return;
    }

    // Vérifier si l'échéance est déjà payée
    if (echeance.statut?.toLowerCase() === "payé") {
      res.status(400).json({
        success: false,
        error: "Cette échéance est déjà payée",
        data: echeance,
      });
      return;
    }

    // Enrichir la réponse avec des informations supplémentaires
    const echeanceEnrichie = {
      ...echeance,
      utilisateur_autorise: !!userIdNum,
      verification_passed: !!userIdNum,
      payment_ready: true,
      currency: "EUR",
    };

    res.status(200).json({
      success: true,
      data: echeanceEnrichie,
      security: {
        access_verified: !!userIdNum,
        user_id: userIdNum,
        warning: userIdNum ? undefined : "Accès sans vérification utilisateur",
      },
    });
  } catch (error) {
    console.error(
      "❌ [Handler Échéances] Erreur route de compatibilité /echeance/:echeanceId:",
      error,
    );

    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération de l'échéance",
      details: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
