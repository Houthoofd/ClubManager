import { Request, Response } from "express";
import { obtenirDetailEcheance } from "../services/echeances.service.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import {
  ValidationError,
  NotFoundError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

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
      throw new ValidationError("ID échéance invalide", [
        {
          field: "echeanceId",
          message: "L'ID de l'échéance doit être un nombre positif",
        },
      ]);
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

      throw new NotFoundError(
        userId
          ? "Cette échéance n'existe pas ou ne vous appartient pas"
          : "Échéance non trouvée",
      );
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

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur lors de la récupération de l'échéance",
      error instanceof Error ? error : undefined,
    );
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
      throw new ValidationError("ID échéance invalide", [
        {
          field: "echeanceId",
          message: "L'ID de l'échéance doit être un nombre positif",
        },
      ]);
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
      throw new NotFoundError(
        userIdNum
          ? "Cette échéance n'existe pas ou ne vous appartient pas"
          : "Échéance non trouvée",
      );
    }

    // Vérifier si l'échéance est déjà payée
    if (echeance.statut?.toLowerCase() === "payé") {
      throw new ValidationError("Cette échéance est déjà payée", [
        {
          field: "statut",
          message: "L'échéance a déjà été payée",
        },
      ]);
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

    // Re-throw les erreurs GraphQL
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }

    throw new InternalServerError(
      "Erreur lors de la récupération de l'échéance",
      error instanceof Error ? error : undefined,
    );
  }
}
