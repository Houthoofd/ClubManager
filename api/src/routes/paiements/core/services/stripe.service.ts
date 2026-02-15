import Stripe from "stripe";

/**
 * Service Stripe - Singleton pour gérer les interactions avec l'API Stripe
 * Centralise toute la logique Stripe pour éviter la duplication
 */
export class StripeService {
  private static instance: StripeService;
  private stripe: Stripe | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeStripe();
  }

  /**
   * Récupère l'instance unique du service Stripe
   */
  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  /**
   * Initialise la connexion Stripe
   */
  private initializeStripe(): void {
    try {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

      console.log("🔍 [Stripe Service] Diagnostic clé Stripe:", {
        keyExists: !!stripeSecretKey,
        keyPrefix: stripeSecretKey
          ? stripeSecretKey.substring(0, 25) + "..."
          : "ABSENT",
        keyType: stripeSecretKey
          ? stripeSecretKey.startsWith("sk_test_")
            ? "SECRET TEST"
            : stripeSecretKey.startsWith("sk_live_")
              ? "SECRET LIVE"
              : "FORMAT INCORRECT"
          : "ABSENT",
        accountId: stripeSecretKey ? stripeSecretKey.substring(8, 25) : "N/A",
      });

      if (!stripeSecretKey || !stripeSecretKey.startsWith("sk_")) {
        console.error(
          "❌ [Stripe Service] STRIPE_SECRET_KEY manquant ou invalide",
        );
        this.isInitialized = false;
        return;
      }

      const expectedPublicKey = `pk_${stripeSecretKey.substring(3)}`;
      console.log("✅ [Stripe Service] Clé backend compatible détectée");
      console.log(
        "ℹ️ [Stripe Service] Clé publique frontend attendue:",
        expectedPublicKey.substring(0, 25) + "...",
      );
      console.log(
        "ℹ️ [Stripe Service] Compte Stripe:",
        stripeSecretKey.substring(8, 25),
      );

      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: "2026-01-28.clover",
      });

      this.isInitialized = true;
      console.log("✅ [Stripe Service] Stripe initialisé avec succès");
      console.log(
        "ℹ️ [Stripe Service] Type de clé:",
        stripeSecretKey.startsWith("sk_test_") ? "TEST" : "LIVE",
      );
    } catch (error) {
      console.error(
        "❌ [Stripe Service] Erreur lors de l'initialisation:",
        error,
      );
      this.isInitialized = false;
    }
  }

  /**
   * Récupère le client Stripe
   */
  public getClient(): Stripe {
    if (!this.isInitialized || !this.stripe) {
      throw new Error("Stripe n'est pas initialisé correctement");
    }
    return this.stripe;
  }

  /**
   * Vérifie si Stripe est initialisé
   */
  public isReady(): boolean {
    return this.isInitialized && this.stripe !== null;
  }

  /**
   * Crée un Payment Intent
   */
  public async createPaymentIntent(params: {
    amount: number;
    currency?: string;
    metadata: Record<string, any>;
    description?: string;
  }): Promise<Stripe.PaymentIntent> {
    if (!this.isReady()) {
      throw new Error("Stripe n'est pas initialisé");
    }

    console.log("💳 [Stripe Service] Création Payment Intent:", {
      amount: params.amount,
      currency: params.currency || "eur",
      metadata: params.metadata,
    });

    try {
      const paymentIntent = await this.stripe!.paymentIntents.create({
        amount: params.amount,
        currency: params.currency || "eur",
        metadata: params.metadata,
        description: params.description,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log("✅ [Stripe Service] Payment Intent créé:", paymentIntent.id);
      return paymentIntent;
    } catch (error) {
      console.error(
        "❌ [Stripe Service] Erreur création Payment Intent:",
        error,
      );
      throw error;
    }
  }

  /**
   * Récupère un Payment Intent
   */
  public async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    if (!this.isReady()) {
      throw new Error("Stripe n'est pas initialisé");
    }

    console.log(
      "🔍 [Stripe Service] Récupération Payment Intent:",
      paymentIntentId,
    );

    try {
      const paymentIntent =
        await this.stripe!.paymentIntents.retrieve(paymentIntentId);
      console.log("✅ [Stripe Service] Payment Intent récupéré:", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
      });
      return paymentIntent;
    } catch (error) {
      console.error(
        "❌ [Stripe Service] Erreur récupération Payment Intent:",
        error,
      );
      throw error;
    }
  }

  /**
   * Construit un événement webhook
   */
  public constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    webhookSecret: string,
  ): Stripe.Event {
    if (!this.isReady()) {
      throw new Error("Stripe n'est pas initialisé");
    }

    console.log("🔔 [Stripe Service] Construction événement webhook");

    try {
      const event = this.stripe!.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
      console.log(
        "✅ [Stripe Service] Événement webhook construit:",
        event.type,
      );
      return event;
    } catch (error) {
      console.error("❌ [Stripe Service] Erreur construction webhook:", error);
      throw error;
    }
  }

  /**
   * Récupère les informations du compte Stripe
   */
  public async getAccountInfo(): Promise<Stripe.Account> {
    if (!this.isReady()) {
      throw new Error("Stripe n'est pas initialisé");
    }

    console.log("🏢 [Stripe Service] Récupération informations compte");

    try {
      const account = await this.stripe!.accounts.retrieve();
      console.log("✅ [Stripe Service] Compte récupéré:", {
        id: account.id,
        country: account.country,
        type: account.type,
      });
      return account;
    } catch (error) {
      console.error("❌ [Stripe Service] Erreur récupération compte:", error);
      throw error;
    }
  }
}
