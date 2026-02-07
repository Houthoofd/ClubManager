/**
 * Handler POST /api/stripe/create-payment-intent
 * Crée un PaymentIntent Stripe pour une échéance de paiement
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";
import { PaymentService } from "../services/payment.service.js";
import { createPaymentIntentEcheanceSchema } from "../validators/stripe.schema.js";

/**
 * Handler pour créer un PaymentIntent pour une échéance
 * POST /api/stripe/create-payment-intent
 *
 * @returns 200 - PaymentIntent créé avec succès
 * @returns 400 - Données invalides
 * @returns 403 - Échéance n'appartient pas à l'utilisateur
 * @returns 404 - Échéance non trouvée ou déjà payée
 * @returns 500 - Erreur serveur
 */
export async function createPaymentIntentEcheance(
  req: Request,
  res: Response,
  stripeService?: StripeService,
  paymentService?: PaymentService
): Promise<void> {
  try {
    console.log("💳 [Handler Stripe] POST /create-payment-intent - Création PaymentIntent échéance");

    // 1. Validation des données avec Zod
    const validation = createPaymentIntentEcheanceSchema.safeParse(req.body);

    if (!validation.success) {
      console.log("⚠️ [Handler Stripe] Validation échouée:", validation.error.errors);
      res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: validation.error.errors,
      });
      return;
    }

    const { amount, echeanceId, userId, description } = validation.data;

    // 2. Vérifier que l'échéance existe et appartient à l'utilisateur
    const stripe = stripeService || StripeService.getInstance();
    const payment = paymentService || PaymentService.getInstance();

    const verificationEcheance = await payment.verifierEcheance(echeanceId, userId);

    if (!verificationEcheance.valid) {
      const status = verificationEcheance.error?.includes("appartient pas") ? 403 : 404;
      console.log(`⚠️ [Handler Stripe] ${verificationEcheance.error}`);
      res.status(status).json({
        success: false,
        message: verificationEcheance.error,
      });
      return;
    }

    // 3. Créer le PaymentIntent via le service Stripe
    const result = await stripe.creerPaymentIntentEcheance({
      amount,
      echeanceId,
      userId,
      description,
    });

    console.log(`✅ [Handler Stripe] PaymentIntent créé: ${result.paymentIntentId}`);

    res.status(200).json({
      success: true,
      message: "PaymentIntent créé avec succès",
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
      },
    });
  } catch (error) {
    console.error("❌ [Handler Stripe] Erreur création PaymentIntent échéance:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du PaymentIntent",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
