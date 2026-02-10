import { Request, Response } from "express";
import { PaymentIntentService } from "../services/payment-intent.service.js";
import { createPaymentIntentEcheanceSchema } from "@clubmanager/types/validators";
import { Paiements } from "../../../../db/clients/paiements/paiements.js";
import { z } from "zod";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from "../../../../shared/errors/GraphQLErrors.js";

/**
 * Handler pour créer un Payment Intent Stripe pour une échéance
 * POST /api/paiements/stripe/create-payment-intent
 */
export async function createPaymentEcheance(
  req: Request,
  res: Response,
  paiementsClient?: Paiements,
): Promise<void> {
  try {
    console.log("🎯 [Create Payment Echeance] Début création Payment Intent");
    console.log("📝 [Create Payment Echeance] Données reçues:", {
      body: req.body,
      user: (req as any).user?.id,
    });

    // 1. Validation des données avec Zod
    const validatedData = createPaymentIntentEcheanceSchema.parse(req.body);

    console.log(
      "✅ [Create Payment Echeance] Données validées:",
      validatedData,
    );

    // 2. Créer le payment intent via le service
    const paymentIntentService = new PaymentIntentService(paiementsClient);
    const result = await paymentIntentService.createForEcheance({
      amount: validatedData.amount,
      echeanceId: validatedData.echeanceId,
      userId: validatedData.userId,
      currency: validatedData.currency,
      description: validatedData.description,
    });

    console.log(
      "✅ [Create Payment Echeance] Payment Intent créé:",
      result.payment_intent_id,
    );

    // 3. Retourner la réponse
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ [Create Payment Echeance] Erreur:", error);

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
      if (error.message.includes("déjà été payée")) {
        throw new ConflictError(error.message);
      }

      // Échéance introuvable
      if (error.message.includes("introuvable")) {
        throw new NotFoundError(error.message);
      }

      // Montant invalide
      if (error.message.includes("montant")) {
        throw new ValidationError(error.message);
      }
    }

    // Erreur serveur générique
    throw new InternalServerError(
      "Erreur lors de la création du Payment Intent",
      error instanceof Error ? error : undefined,
    );
  }
}
