import { Request, Response } from "express";
import { z } from "zod";
import { mettreAJourEcheance } from "../services/echeances.service.js";
import { updateEcheanceSchema } from "../validators/echeance.schema.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";

/**
 * Handler pour mettre à jour une échéance existante
 * PUT /api/echeances/:id
 *
 * Params:
 * - id: number - ID de l'échéance
 *
 * Body:
 * {
 *   montant?: number,
 *   date_echeance?: string,
 *   description?: string,
 *   statut?: "en attente" | "payé" | "échu",
 *   date_paiement?: string,
 *   stripe_payment_intent_id?: string
 * }
 */
export async function updateEcheance(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    const echeanceIdParam = req.params.id;

    console.log(
      `📝 [Handler Échéances] PUT /:id - Mise à jour échéance ${echeanceIdParam}`,
      req.body,
    );

    // Validation de l'ID échéance
    if (!echeanceIdParam || !/^\d+$/.test(echeanceIdParam)) {
      res.status(400).json({
        success: false,
        error: "ID échéance invalide",
      });
      return;
    }

    const echeanceId = parseInt(echeanceIdParam, 10);

    if (isNaN(echeanceId) || echeanceId <= 0) {
      res.status(400).json({
        success: false,
        error: "ID échéance invalide",
      });
      return;
    }

    // Validation des données de mise à jour avec Zod
    // Extraire echeanceId du schéma car il est déjà validé
    const validatedData = updateEcheanceSchema.parse({
      echeanceId,
      ...req.body,
    });

    console.log("✅ [Handler Échéances] Données validées:", validatedData);

    // Extraire les champs à mettre à jour (exclure echeanceId)
    const { echeanceId: _, ...updates } = validatedData as any;

    // Vérifier qu'il y a au moins un champ à mettre à jour
    if (Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        error: "Aucun champ à mettre à jour",
        allowedFields: [
          "montant",
          "date_echeance",
          "description",
          "statut",
          "date_paiement",
          "stripe_payment_intent_id",
        ],
      });
      return;
    }

    // Mettre à jour l'échéance via le service
    const echeanceMiseAJour = await mettreAJourEcheance(
      echeanceId,
      updates,
      paiementsClient,
    );

    if (!echeanceMiseAJour) {
      res.status(404).json({
        success: false,
        error: "Échéance non trouvée",
        echeanceId,
      });
      return;
    }

    console.log(
      `✅ [Handler Échéances] Échéance ${echeanceId} mise à jour avec succès`,
    );

    res.status(200).json({
      success: true,
      message: "Échéance mise à jour avec succès",
      data: echeanceMiseAJour,
    });
  } catch (error) {
    console.error("❌ [Handler Échéances] Erreur mise à jour échéance:", error);

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      res.status(400).json({
        success: false,
        message: "Données invalides",
        error: firstError.message,
        errors: error.errors,
      });
      return;
    }

    // Erreur serveur générique
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour de l'échéance",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
