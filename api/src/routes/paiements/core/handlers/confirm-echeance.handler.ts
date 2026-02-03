import { Request, Response } from "express";
import { ConfirmationService } from "../services/confirmation.service.js";
import { confirmEcheancePaymentSchema } from "../validators/paiement.schema.js";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../../db/clients/messagerie/emailClient.js";
import { z } from "zod";

/**
 * Handler pour confirmer un paiement d'échéance
 * POST /api/paiements/confirm-echeance
 */
export async function confirmEcheancePayment(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
  emailClient?: EmailClient,
): Promise<void> {
  try {
    console.log("🔔 [Confirm Echeance] Début confirmation paiement échéance");
    console.log("📝 [Confirm Echeance] Données reçues:", {
      body: req.body,
      user: (req as any).user?.id,
    });

    // 1. Validation des données avec Zod
    const validatedData = confirmEcheancePaymentSchema.parse(req.body);

    console.log("✅ [Confirm Echeance] Données validées:", validatedData);

    // 2. Confirmer le paiement via le service
    const confirmationService = new ConfirmationService(
      paiementsClient,
      emailClient,
    );
    const result = await confirmationService.confirmEcheancePayment({
      paymentIntentId: validatedData.paymentIntentId,
      echeanceId: validatedData.echeanceId,
      userId: validatedData.userId,
      amount: validatedData.amount,
    });

    console.log("✅ [Confirm Echeance] Paiement confirmé:", {
      echeance_id: result.echeance_id,
      premier_paiement: result.premier_paiement,
      promotion_effectuee: result.promotion_effectuee,
    });

    // 3. Retourner la réponse
    res.status(200).json({
      success: true,
      message: result.message,
      paiement_id: result.paiement_id,
      echeance_id: result.echeance_id,
      premier_paiement: result.premier_paiement,
      statut_upgrade: result.statut_upgrade,
      promotion_effectuee: result.promotion_effectuee,
      email_envoye: result.email_envoye,
      user_info: result.user_info,
    });
  } catch (error) {
    console.error("❌ [Confirm Echeance] Erreur:", error);

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      res.status(400).json({
        success: false,
        message: firstError.message,
        errors: error.errors,
      });
      return;
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
      // Payment Intent invalide
      if (error.message.includes("succeeded")) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Échéance introuvable
      if (error.message.includes("introuvable")) {
        res.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Échéance déjà payée
      if (error.message.includes("déjà payée")) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    // Erreur serveur générique
    res.status(500).json({
      success: false,
      message: "Erreur lors de la confirmation du paiement",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
