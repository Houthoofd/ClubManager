/**
 * Handler pour la vérification de santé du module confirmation
 */

import { Request, Response } from "express";
import Stripe from "stripe";
import { InternalServerError } from "../../../../shared/errors/GraphQLErrors.js";

// Initialisation Stripe
let stripe: Stripe | null = null;
try {
  if (
    process.env.STRIPE_SECRET_KEY &&
    !process.env.STRIPE_SECRET_KEY.includes("4e")
  ) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia",
    });
  }
} catch (error) {
  console.error("❌ [Health] Erreur initialisation Stripe:", error);
}

/**
 * Vérifie la santé du module confirmation
 */
export async function health(req: Request, res: Response): Promise<void> {
  try {
    res.json({
      status: "healthy",
      module: "confirmation",
      routes: [
        "POST /confirmation/confirm-payment - Confirmation échéance",
        "POST /confirmation/confirm-payment-commande - Confirmation commande",
        "GET /confirmation/debug/table-structure - Structure table commandes",
        "GET /confirmation/health - Statut du module",
      ],
      stripe: {
        configured: !!stripe,
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    throw new InternalServerError(
      "Erreur lors du health check du module Confirmation",
      error,
    );
  }
}
