import { Request, Response } from "express";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { z } from "zod";

/**
 * Schema de validation pour les paramètres de pagination
 */
const historiqueQuerySchema = z.object({
  utilisateur_id: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: "ID utilisateur doit être un nombre positif",
    })
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  limit: z
    .string()
    .optional()
    .default("50")
    .refine((val) => /^-?\d+$/.test(val), {
      message: "Limit doit être un nombre",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Limit doit être entre 1 et 100",
    }),
  offset: z
    .string()
    .optional()
    .default("0")
    .refine((val) => /^-?\d+$/.test(val), {
      message: "Offset doit être un nombre",
    })
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 0, {
      message: "Offset doit être positif ou zéro",
    }),
  statut: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
  type: z.enum(["echeance", "commande"]).optional(),
});

/**
 * Handler pour récupérer l'historique des paiements
 * GET /api/paiements/historique
 *
 * Query params:
 * - utilisateur_id?: number - Filtrer par utilisateur
 * - limit?: number - Nombre de résultats (défaut: 50)
 * - offset?: number - Décalage pour pagination (défaut: 0)
 * - statut?: string - Filtrer par statut
 * - type?: string - Filtrer par type (echeance/commande)
 */
export async function getHistoriquePaiements(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("📜 [Historique] Récupération historique paiements");
    console.log("📝 [Historique] Query params:", req.query);

    // 1. Validation des query params
    const validatedQuery = historiqueQuerySchema.parse(req.query);

    console.log("✅ [Historique] Paramètres validés:", validatedQuery);

    const client = paiementsClient || new Paiements();

    // 2. Récupérer l'historique selon les filtres
    let historique: any[];
    let total: number;

    if (validatedQuery.utilisateur_id) {
      // Historique pour un utilisateur spécifique
      const results = await client.obtenirHistoriquePaiementsUtilisateur(
        validatedQuery.utilisateur_id,
        {
          limit: validatedQuery.limit,
          offset: validatedQuery.offset,
          statut: validatedQuery.statut,
          type: validatedQuery.type,
        },
      );

      historique = results.paiements;
      total = results.total;

      console.log("✅ [Historique] Paiements utilisateur récupérés:", {
        count: historique.length,
        total,
      });
    } else {
      // Historique global (admin)
      const results = await client.obtenirTousPaiements({
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        statut: validatedQuery.statut,
        type: validatedQuery.type,
      });

      historique = results.paiements;
      total = results.total;

      console.log("✅ [Historique] Tous paiements récupérés:", {
        count: historique.length,
        total,
      });
    }

    // 3. Formater la réponse avec pagination
    const hasMore = validatedQuery.offset + validatedQuery.limit < total;

    res.status(200).json({
      success: true,
      data: historique,
      pagination: {
        total,
        limit: validatedQuery.limit,
        offset: validatedQuery.offset,
        hasMore,
        count: historique.length,
      },
      filters: {
        utilisateur_id: validatedQuery.utilisateur_id,
        statut: validatedQuery.statut,
        type: validatedQuery.type,
      },
    });
  } catch (error) {
    console.error("❌ [Historique] Erreur:", error);

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      res.status(400).json({
        success: false,
        message: "Paramètres invalides",
        error: firstError.message,
        errors: error.errors,
      });
      return;
    }

    // Erreur serveur générique
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'historique des paiements",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour récupérer l'historique des échéances d'un utilisateur
 * GET /api/paiements/echeances/:userId
 */
export async function getEcheancesUtilisateur(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const userIdParam = req.params.userId;

    // Validation stricte: rejeter si contient des caractères non numériques
    if (!/^\d+$/.test(userIdParam)) {
      res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
      return;
    }

    const userId = parseInt(userIdParam, 10);

    if (isNaN(userId) || userId <= 0) {
      res.status(400).json({
        success: false,
        message: "ID utilisateur invalide",
      });
      return;
    }

    console.log("📅 [Échéances] Récupération échéances utilisateur:", userId);

    const client = paiementsClient || new Paiements();

    // Récupérer les échéances
    const echeances = await client.obtenirEcheancesUtilisateur(userId);

    console.log("✅ [Échéances] Échéances récupérées:", echeances.length);

    res.status(200).json({
      success: true,
      data: echeances,
      count: echeances.length,
      utilisateur_id: userId,
    });
  } catch (error) {
    console.error("❌ [Échéances] Erreur:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des échéances",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}

/**
 * Handler pour récupérer une échéance spécifique avec ses détails
 * GET /api/paiements/echeance/:echeanceId
 */
export async function getEcheanceDetails(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const echeanceIdParam = req.params.echeanceId;

    // Validation stricte: rejeter si contient des caractères non numériques
    if (!/^\d+$/.test(echeanceIdParam)) {
      res.status(400).json({
        success: false,
        message: "ID échéance invalide",
      });
      return;
    }

    const echeanceId = parseInt(echeanceIdParam, 10);

    if (isNaN(echeanceId) || echeanceId <= 0) {
      res.status(400).json({
        success: false,
        message: "ID échéance invalide",
      });
      return;
    }

    console.log("🔍 [Échéance] Récupération détails échéance:", echeanceId);

    const client = paiementsClient || new Paiements();

    // Récupérer l'échéance avec détails utilisateur
    const echeance = await client.obtenirEcheanceAvecUtilisateur(echeanceId);

    if (!echeance) {
      res.status(404).json({
        success: false,
        message: `Échéance ${echeanceId} introuvable`,
      });
      return;
    }

    console.log("✅ [Échéance] Échéance récupérée:", {
      id: echeance.id,
      montant: echeance.montant,
      statut: echeance.statut,
    });

    res.status(200).json({
      success: true,
      data: echeance,
    });
  } catch (error) {
    console.error("❌ [Échéance] Erreur:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de l'échéance",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
