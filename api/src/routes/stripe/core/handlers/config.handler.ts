/**
 * Handler GET /api/stripe/config
 * Retourne la configuration publique Stripe (publishable key, méthodes de paiement)
 */

import { Request, Response } from "express";
import { StripeService } from "../services/stripe.service.js";

/**
 * Handler pour récupérer la configuration publique Stripe
 * GET /api/stripe/config
 *
 * @returns 200 - Configuration Stripe
 * @returns 500 - Erreur serveur
 */
export async function config(
  req: Request,
  res: Response,
  stripeService?: StripeService
): Promise<void> {
  try {
    console.log("⚙️ [Handler Stripe] GET /config - Récupération configuration Stripe");

    // Récupérer la configuration via le service
    const stripe = stripeService || StripeService.getInstance();
    const configuration = stripe.obtenirConfiguration();

    console.log("✅ [Handler Stripe] Configuration récupérée avec succès");

    res.status(200).json({
      success: true,
      message: "Configuration Stripe récupérée avec succès",
      data: configuration,
    });
  } catch (error) {
    console.error("❌ [Handler Stripe] Erreur récupération configuration:", error);

    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération de la configuration",
      error: error instanceof Error ? error.message : "Erreur inconnue",
    });
  }
}
