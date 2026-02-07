/**
 * Handler GET /api/stripe/health
 * Vérifie la santé du module Stripe (configuration, connectivité)
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";

/**
 * Handler pour vérifier la santé du module Stripe
 * GET /api/stripe/health
 *
 * @returns 200 - Module Stripe en bonne santé
 * @returns 503 - Problème de configuration ou connectivité
 */
export async function health(
  req: Request,
  res: Response,
  stripeService?: StripeService
): Promise<void> {
  try {
    console.log("🏥 [Handler Stripe] GET /health - Vérification santé module");

    const stripe = stripeService || StripeService.getInstance();

    // Vérifier la configuration
    const secretKeyConfigured = !!process.env.STRIPE_SECRET_KEY;
    const publishableKeyConfigured = !!process.env.STRIPE_PUBLISHABLE_KEY;

    // Tester la connectivité Stripe
    const connectivityTest = await stripe.testerConnectivite();

    const isHealthy = secretKeyConfigured && publishableKeyConfigured && connectivityTest.connected;

    const healthData = {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks: {
        secretKeyConfigured,
        publishableKeyConfigured,
        stripeConnectivity: connectivityTest.connected,
        stripeError: connectivityTest.error || null,
      },
    };

    if (isHealthy) {
      console.log("✅ [Handler Stripe] Module en bonne santé");
      res.status(200).json({
        success: true,
        message: "Module Stripe opérationnel",
        data: healthData,
      });
    } else {
      console.warn("⚠️ [Handler Stripe] Problème de santé détecté:", healthData.checks);
      res.status(503).json({
        success: false,
        message: "Module Stripe non opérationnel",
        data: healthData,
      });
    }
  } catch (error) {
    console.error("❌ [Handler Stripe] Erreur vérification santé:", error);

    res.status(503).json({
      success: false,
      message: "Erreur lors de la vérification de santé",
      data: {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
    });
  }
}
