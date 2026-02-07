import Stripe from "stripe";
import { toStripeAmount } from "../validators/stripe.schema.js";

/**
 * Service pour interagir avec l'API Stripe
 * Gère la création et récupération de PaymentIntents
 */

// Types pour les résultats
export interface PaymentIntentResult {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
  metadata: Record<string, any>;
}

export interface StripeConfig {
  publishableKey: string;
  environment: "test" | "live";
  isTestMode: boolean;
  isLiveMode: boolean;
  paymentMethods: {
    card: boolean;
    bancontact: boolean;
    sepa_debit: boolean;
    ideal: boolean;
  };
  secretKeyConfigured: boolean;
  webhookSecretConfigured: boolean;
}

/**
 * Service Stripe
 */
export class StripeServiceClass {
  private stripe: Stripe;

  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new Error(
        "❌ STRIPE_SECRET_KEY non définie dans les variables d'environnement",
      );
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2025-02-24.acacia",
    });

    console.log("✅ [Service Stripe] Client Stripe initialisé");
  }

  /**
   * Créer un PaymentIntent pour une échéance
   */
  async creerPaymentIntentEcheance(data: {
    amount: number;
    echeanceId: number;
    userId: number;
    description?: string;
  }): Promise<PaymentIntentResult> {
    console.log(
      `💳 [Service Stripe] Création PaymentIntent échéance ${data.echeanceId} pour utilisateur ${data.userId}`,
    );

    const amountInCents = toStripeAmount(data.amount);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        description:
          data.description || `Paiement échéance #${data.echeanceId}`,
        metadata: {
          echeance_id: data.echeanceId.toString(),
          utilisateur_id: data.userId.toString(),
          type: "echeance_payment",
          montant_euros: data.amount.toFixed(2),
          date_creation: new Date().toISOString(),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(
        `✅ [Service Stripe] PaymentIntent créé: ${paymentIntent.id}`,
      );

      return {
        client_secret: paymentIntent.client_secret!,
        payment_intent_id: paymentIntent.id,
        amount: data.amount,
        currency: "eur",
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error(
        `❌ [Service Stripe] Erreur création PaymentIntent:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Créer un PaymentIntent pour une commande
   */
  async creerPaymentIntentCommande(data: {
    amount: number;
    commandeId: number;
    userId: number;
    nbArticles: number;
    description?: string;
  }): Promise<PaymentIntentResult> {
    console.log(
      `💳 [Service Stripe] Création PaymentIntent commande ${data.commandeId} pour utilisateur ${data.userId}`,
    );

    const amountInCents = toStripeAmount(data.amount);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        metadata: {
          type: "commande_magasin",
          commande_id: data.commandeId.toString(),
          utilisateur_id: data.userId.toString(),
          montant_euros: data.amount.toFixed(2),
          articles_count: data.nbArticles.toString(),
          date_creation: new Date().toISOString(),
        },
        description:
          data.description || `Paiement commande #${data.commandeId}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log(
        `✅ [Service Stripe] PaymentIntent créé: ${paymentIntent.id}`,
      );

      return {
        client_secret: paymentIntent.client_secret!,
        payment_intent_id: paymentIntent.id,
        amount: data.amount,
        currency: "eur",
        metadata: paymentIntent.metadata,
      };
    } catch (error) {
      console.error(
        `❌ [Service Stripe] Erreur création PaymentIntent:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Récupérer un PaymentIntent existant
   */
  async recupererPaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    console.log(
      `🔍 [Service Stripe] Récupération PaymentIntent: ${paymentIntentId}`,
    );

    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      console.log(
        `✅ [Service Stripe] PaymentIntent récupéré, statut: ${paymentIntent.status}`,
      );

      return paymentIntent;
    } catch (error) {
      console.error(
        `❌ [Service Stripe] Erreur récupération PaymentIntent:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Tester la connectivité avec Stripe
   */
  async testerConnectivite(): Promise<{
    connected: boolean;
    error?: string;
  }> {
    console.log(`🔌 [Service Stripe] Test de connectivité Stripe`);

    try {
      await this.stripe.balance.retrieve();
      console.log(`✅ [Service Stripe] Connexion Stripe OK`);
      return { connected: true };
    } catch (error) {
      console.error(`❌ [Service Stripe] Erreur de connexion:`, error);
      return {
        connected: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      };
    }
  }

  /**
   * Obtenir la configuration Stripe pour le frontend
   */
  obtenirConfiguration(): StripeConfig {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";
    const isTestMode = publishableKey.startsWith("pk_test_");
    const isLiveMode = publishableKey.startsWith("pk_live_");

    return {
      publishableKey,
      environment: isTestMode ? "test" : "live",
      isTestMode,
      isLiveMode,
      paymentMethods: {
        card: true,
        bancontact: true,
        sepa_debit: true,
        ideal: true,
      },
      secretKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
      webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    };
  }

  /**
   * Obtenir des informations détaillées pour le debug
   */
  async obtenirConfigurationDebug(): Promise<{
    config: StripeConfig;
    connectivity: { connected: boolean; error?: string };
    paymentMethodsAvailable?: any[];
  }> {
    console.log(`🐛 [Service Stripe] Récupération configuration debug`);

    const config = this.obtenirConfiguration();
    const connectivity = await this.testerConnectivite();

    let paymentMethodsAvailable: any[] = [];

    if (connectivity.connected) {
      try {
        const paymentMethods = await this.stripe.paymentMethods.list({
          type: "card",
          limit: 5,
        });
        paymentMethodsAvailable = paymentMethods.data;
      } catch (error) {
        console.warn(
          `⚠️ [Service Stripe] Impossible de récupérer les méthodes de paiement`,
          error,
        );
      }
    }

    return {
      config,
      connectivity,
      paymentMethodsAvailable:
        paymentMethodsAvailable.length > 0
          ? paymentMethodsAvailable
          : undefined,
    };
  }

  /**
   * Créer un PaymentIntent de test (1€)
   */
  async creerPaymentIntentTest(): Promise<{
    success: boolean;
    payment_intent?: {
      id: string;
      client_secret: string;
      status: string;
      automatic_payment_methods: any;
      payment_method_types: string[];
    };
    message: string;
  }> {
    console.log(`🧪 [Service Stripe] Création PaymentIntent de test`);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: 100, // 1€
        currency: "eur",
        description: "Test PaymentIntent - Debug",
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          test: "true",
          debug: "true",
        },
      });

      console.log(
        `✅ [Service Stripe] PaymentIntent test créé: ${paymentIntent.id}`,
      );

      return {
        success: true,
        payment_intent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret!,
          status: paymentIntent.status,
          automatic_payment_methods: paymentIntent.automatic_payment_methods,
          payment_method_types: paymentIntent.payment_method_types,
        },
        message: "PaymentIntent de test créé avec succès",
      };
    } catch (error) {
      console.error(
        `❌ [Service Stripe] Erreur création PaymentIntent test:`,
        error,
      );

      return {
        success: false,
        message: "Échec de création du PaymentIntent de test",
      };
    }
  }

  /**
   * Obtenir le client Stripe brut (pour cas avancés)
   */
  getStripeClient(): Stripe {
    return this.stripe;
  }
}

// Export class et singleton
export { StripeServiceClass as StripeService };

let stripeServiceInstance: StripeServiceClass | null = null;

export function getStripeService(): StripeServiceClass {
  if (!stripeServiceInstance) {
    stripeServiceInstance = new StripeServiceClass();
  }
  return stripeServiceInstance;
}

// Méthode getInstance pour compatibilité
StripeServiceClass.getInstance = function (): StripeServiceClass {
  return getStripeService();
};

// Export par défaut pour faciliter l'import
export default getStripeService;
