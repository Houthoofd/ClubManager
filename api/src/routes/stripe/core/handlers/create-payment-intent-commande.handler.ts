/**
 * Handler POST /api/stripe/create-payment-intent-commande
 * Crée un PaymentIntent Stripe pour une commande
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";
import { PaymentService } from "../services/payment.service.js";
import { createPaymentIntentCommandeSchema } from "@clubmanager/types/validators";

/**
 * Handler pour créer un PaymentIntent pour une commande
 * POST /api/stripe/create-payment-intent-commande
 *
 * @returns 200 - PaymentIntent créé avec succès
 * @returns 400 - Données invalides ou commande sans articles
 * @returns 403 - Commande n'appartient pas à l'utilisateur
 * @returns 404 - Commande non trouvée
 * @returns 500 - Erreur serveur
 */
export async function createPaymentIntentCommande(
  req: Request,
  res: Response,
  stripeService?: StripeService,
  paymentService?: PaymentService,
): Promise<void> {
  try {
    console.log(
      "💳 [Handler Stripe] POST /create-payment-intent-commande - Création PaymentIntent commande",
    );

    // 1. Validation des données avec Zod
    const validation = createPaymentIntentCommandeSchema.safeParse(req.body);

    if (!validation.success) {
      console.log(
        "⚠️ [Handler Stripe] Validation échouée:",
        validation.error.errors,
      );
      res.status(400).json({
        success: false,
        message: "Données invalides",
        errors: validation.error.errors,
      });
      return;
    }

    const { amount, commande, userId, description } = validation.data;

    // 2. Créer la commande si nécessaire ou vérifier qu'elle existe
    const stripe = stripeService || StripeService.getInstance();
    const payment = paymentService || PaymentService.getInstance();

    const commandeResult = await payment.creerCommandeSiNecessaire(
      commande,
      userId,
    );
    const commandeId = commandeResult.commandeId;

    // 3. Vérifier que la commande appartient à l'utilisateur et a des articles
    const verificationCommande = await payment.verifierCommande(
      commandeId,
      userId,
    );

    if (!verificationCommande.valid) {
      const status = verificationCommande.error?.includes("appartient pas")
        ? 403
        : 400;
      console.log(`⚠️ [Handler Stripe] ${verificationCommande.error}`);
      res.status(status).json({
        success: false,
        message: verificationCommande.error,
      });
      return;
    }

    // 4. Créer le PaymentIntent via le service Stripe
    const nbArticles = verificationCommande.commande?.articles?.length || 0;

    const result = await stripe.creerPaymentIntentCommande({
      amount,
      commandeId,
      userId,
      nbArticles,
      description,
    });

    console.log(
      `✅ [Handler Stripe] PaymentIntent créé pour commande: ${result.paymentIntentId}`,
    );

    res.status(200).json({
      success: true,
      message: "PaymentIntent créé avec succès",
      data: {
        clientSecret: result.clientSecret,
        paymentIntentId: result.paymentIntentId,
        commandeId: commandeResult.created ? commandeId : undefined,
      },
    });
  } catch (error) {
    console.error(
      "❌ [Handler Stripe] Erreur création PaymentIntent commande:",
      error,
    );

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la création du PaymentIntent",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
