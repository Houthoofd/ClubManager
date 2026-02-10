import { Request, Response } from "express";
import { ConfirmationService } from "../services/confirmation.service.js";
import { confirmEcheancePaymentSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { EmailClient } from "../../../../db/clients/messagerie/emailClient.js";
import { z } from "zod";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  AuthorizationError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

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

    // Re-throw si c'est déjà une erreur applicative
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof AuthorizationError
    ) {
      throw error;
    }

    // Gestion des erreurs de validation Zod
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        error.errors[0]?.message || "Données invalides",
        error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      );
    }

    // Gestion des erreurs métier
    if (error instanceof Error) {
      // Échéance déjà payée
      if (
        error.message.includes("déjà payée") ||
        error.message.includes("déjà été payée")
      ) {
        throw new ConflictError(error.message);
      }

      // Échéance ou paiement introuvable
      if (
        error.message.includes("introuvable") ||
        error.message.includes("non trouvé")
      ) {
        throw new NotFoundError(error.message);
      }

      // Payment Intent invalide
      if (
        error.message.includes("succeeded") ||
        error.message.includes("statut")
      ) {
        throw new ValidationError(error.message);
      }

      // Problème d'autorisation
      if (
        error.message.includes("n'appartient pas") ||
        error.message.includes("pas autorisé")
      ) {
        throw new AuthorizationError(error.message);
      }

      // Montant invalide
      if (error.message.includes("montant")) {
        throw new ValidationError(error.message);
      }
    }

    // Erreur serveur générique
    throw new InternalServerError(
      "Erreur lors de la confirmation du paiement",
      error instanceof Error ? error : undefined,
    );
  }
}
