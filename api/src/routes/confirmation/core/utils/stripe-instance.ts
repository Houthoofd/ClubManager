/**
 * Module d'initialisation Stripe
 * Permet de mocker facilement l'instance Stripe dans les tests
 */

import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

/**
 * Initialise l'instance Stripe si elle n'existe pas déjà
 */
export function initializeStripe(): Stripe | null {
  if (stripeInstance) {
    return stripeInstance;
  }

  try {
    if (
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("4e")
    ) {
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-01-28.clover",
      });
      console.log("✅ [Stripe] Instance Stripe initialisée");
    } else {
      console.warn(
        "⚠️ [Stripe] STRIPE_SECRET_KEY manquante ou invalide (contient '4e')",
      );
    }
  } catch (error) {
    console.error("❌ [Stripe] Erreur initialisation Stripe:", error);
  }

  return stripeInstance;
}

/**
 * Récupère l'instance Stripe (l'initialise si nécessaire)
 */
export function getStripeInstance(): Stripe | null {
  if (!stripeInstance) {
    return initializeStripe();
  }
  return stripeInstance;
}

/**
 * Définit manuellement l'instance Stripe (utile pour les tests)
 */
export function setStripeInstance(instance: Stripe | null): void {
  stripeInstance = instance;
}

/**
 * Réinitialise l'instance Stripe
 */
export function resetStripeInstance(): void {
  stripeInstance = null;
}

/**
 * Vérifie si Stripe est initialisé
 */
export function isStripeInitialized(): boolean {
  return stripeInstance !== null;
}

// Initialisation automatique au chargement du module
initializeStripe();
