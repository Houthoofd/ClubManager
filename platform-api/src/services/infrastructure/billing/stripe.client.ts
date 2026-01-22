import Stripe from "stripe";

/**
 * Singleton Stripe client
 * Configured with API key from environment variables
 */
class StripeClient {
  private static instance: Stripe | null = null;

  /**
   * Get or create Stripe instance
   */
  static getInstance(): Stripe {
    if (!StripeClient.instance) {
      const apiKey = process.env.STRIPE_SECRET_KEY;

      if (!apiKey) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required");
      }

      StripeClient.instance = new Stripe(apiKey, {
        apiVersion: "2025-02-24.acacia",
        typescript: true,
      });
    }

    return StripeClient.instance;
  }

  /**
   * Get webhook secret
   */
  static getWebhookSecret(): string {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
    }

    return secret;
  }

  /**
   * Get price IDs for different plans
   */
  static getPriceId(plan: string): string | null {
    const priceMapping: Record<string, string | undefined> = {
      FREE: undefined, // No payment for free plan
      STARTER: process.env.STRIPE_PRICE_STARTER,
      PRO: process.env.STRIPE_PRICE_PRO,
      ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
    };

    return priceMapping[plan] || null;
  }
}

export const stripe = StripeClient.getInstance();
export const getWebhookSecret = StripeClient.getWebhookSecret;
export const getPriceId = StripeClient.getPriceId;
