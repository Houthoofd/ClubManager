/**
 * Handler POST /api/stripe/debug/test-payment-intent
 * Crée un PaymentIntent de test pour vérifier la configuration Stripe
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";

/**
 * Handler pour créer un PaymentIntent de test
 * POST /api/stripe/debug/test-payment-intent
 *
 * @returns 200 - PaymentIntent de test créé avec succès
 * @returns 500 - Erreur serveur ou configuration Stripe invalide
 */
export async function testPaymentIntent(
  req: Request,
  res: Response,
  stripeService?: StripeService
): Promise<void> {
  try {
    console.log("🧪 [Handler Stripe] POST /debug/test-payment-intent - Test PaymentIntent");

    // Récupérer le service Stripe
    const stripe = stripeService || StripeService.getInstance();

    // Créer un PaymentIntent de test avec montant minimal (50 centimes)
    const result = await stripe.creerPaymentIntentEcheance({
      amount: 0.5,
      echeanceId: 0, // ID fictif pour test
      userId: 0, // ID fictif pour test
      description: "Test PaymentIntent - Debug",
    });

    console.log("✅ [Handler Stripe] PaymentIntent de test créé:", result.paymentIntentId);

    res.status(200).json({
      success: true,
      message: "PaymentIntent de test créé avec succès",
      data: {
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        note: "Ce PaymentIntent est uniquement à des fins de test. Il ne doit pas être utilisé pour de vrais paiements.",
      },
    });
  } catch (error) {
    console.error("❌ [Handler Stripe] Erreur création PaymentIntent de test:", error);

    res.status(500).json({
      success: false,
      message: "Erreur lors de la création du PaymentIntent de test. Vérifiez votre configuration Stripe.",
      error: error instanceof Error ? error.message : "Erreur inconnue",
      hint: "Assurez-vous que STRIPE_SECRET_KEY est correctement configuré dans vos variables d'environnement.",
    });
  }
}
