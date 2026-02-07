/**
 * Handler GET /api/stripe/debug/stripe-config
 * Retourne les informations de debug sur la configuration Stripe (clé secrète masquée)
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";

/**
 * Handler pour récupérer les informations de debug Stripe
 * GET /api/stripe/debug/stripe-config
 *
 * @returns 200 - Informations de debug
 * @returns 500 - Erreur serveur
 */
export async function debugStripeConfig(
  req: Request,
  res: Response,
  stripeService?: StripeService
): Promise<void> {
  try {
    console.log("🔍 [Handler Stripe] GET /debug/stripe-config - Debug configuration Stripe");

    // Récupérer la configuration via le service
    const stripe = stripeService || StripeService.getInstance();
    const configuration = stripe.obtenirConfiguration();

    // Tester la connectivité Stripe
    const connectivityTest = await stripe.testerConnectivite();

    // Masquer partiellement les clés pour la sécurité
    const maskedSecretKey = process.env.STRIPE_SECRET_KEY
      ? `${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...${process.env.STRIPE_SECRET_KEY.slice(-4)}`
      : "Non configuré";

    const debugInfo = {
      publishableKey: configuration.publishableKey || "Non configuré",
      secretKey: maskedSecretKey,
      secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
      publishableKeyConfigured: !!process.env.STRIPE_PUBLISHABLE_KEY,
      paymentMethods: configuration.paymentMethods,
      connectivity: connectivityTest,
      environment: process.env.NODE_ENV || "development",
    };

    console.log("✅ [Handler Stripe] Debug info récupérée:", {
      secretKeyConfigured: debugInfo.secretKeyConfigured,
      publishableKeyConfigured: debugInfo.publishableKeyConfigured,
      connected: connectivityTest.connected,
    });

    res.status(200).json({
      success: true,
      message: "Informations de debug récupérées avec succès",
      data: debugInfo,
    });
  } catch (error) {
    console.error("❌ [Handler Stripe] Erreur récupération debug info:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des informations de debug",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
