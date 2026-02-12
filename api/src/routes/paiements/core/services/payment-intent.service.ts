/**
 * Service pour gérer les Payment Intents Stripe
 *
 * Centralise la logique de création, validation et gestion des payment intents.
 * Migré vers Prisma avec intégration Sentry pour le monitoring.
 *
 * @module payment-intent.service
 */

import { StripeService } from "./stripe.service.js";
import { prisma } from "../../../../infrastructure/database/prisma-client.js";
import {
  captureException,
  addSentryBreadcrumb,
} from "../../../../shared/config/sentry.config.js";
import Stripe from "stripe";

/**
 * Service pour gérer les Payment Intents Stripe
 */
export class PaymentIntentService {
  private stripeService: StripeService;
  private cache: Map<
    string,
    { paymentIntent: Stripe.PaymentIntent; timestamp: number }
  >;
  private readonly CACHE_DURATION = 30000; // 30 secondes

  constructor() {
    this.stripeService = StripeService.getInstance();
    this.cache = new Map();
  }

  /**
   * Valide et convertit un montant en euros vers centimes
   */
  private validateAndConvertAmount(euros: number): number {
    addSentryBreadcrumb(
      `Validation montant: ${euros}€`,
      "payment.validation",
      "info",
      { euros },
    );

    console.log("💰 [Payment Intent Service] Validation montant:", { euros });

    // Validation du montant
    if (typeof euros !== "number" || isNaN(euros)) {
      throw new Error("Le montant doit être un nombre valide");
    }

    if (euros <= 0) {
      throw new Error("Le montant doit être positif");
    }

    // Conversion en centimes
    const cents = Math.round(euros * 100);

    // Validation limites Stripe (0.50€ min, 999,999€ max)
    if (cents < 50) {
      throw new Error("Le montant minimum est de 0.50€");
    }

    if (cents > 99999900) {
      throw new Error("Le montant maximum est de 999,999€");
    }

    console.log("✅ [Payment Intent Service] Montant validé:", {
      original: euros,
      converted: cents,
      euros: cents / 100,
    });

    return cents;
  }

  /**
   * Vérifie si un payment intent existe en cache
   */
  private getCachedPaymentIntent(
    cacheKey: string,
  ): Stripe.PaymentIntent | null {
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log("🔄 [Payment Intent Service] Payment Intent trouvé en cache");
      return cached.paymentIntent;
    }

    // Nettoyer le cache expiré
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Met en cache un payment intent
   */
  private cachePaymentIntent(
    cacheKey: string,
    paymentIntent: Stripe.PaymentIntent,
  ): void {
    this.cache.set(cacheKey, {
      paymentIntent,
      timestamp: Date.now(),
    });

    console.log("💾 [Payment Intent Service] Payment Intent mis en cache");
  }

  /**
   * Crée un payment intent pour une échéance
   */
  public async createForEcheance(data: {
    amount: number;
    echeanceId: number;
    userId: number;
    currency?: string;
    description?: string;
  }): Promise<{
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    currency: string;
    metadata: Record<string, any>;
    echeance: {
      id: number;
      montant: number;
      statut: string;
    };
    cached?: boolean;
  }> {
    try {
      addSentryBreadcrumb(
        `Création Payment Intent pour échéance: ${data.echeanceId}`,
        "payment.intent",
        "info",
        {
          echeanceId: data.echeanceId,
          userId: data.userId,
          amount: data.amount,
        },
      );

      console.log(
        "🎯 [Payment Intent Service] Création Payment Intent pour échéance:",
        data,
      );

      // Vérifier le cache
      const cacheKey = `echeance_${data.echeanceId}_${data.userId}_${data.amount}`;
      const cachedPI = this.getCachedPaymentIntent(cacheKey);

      if (cachedPI) {
        return {
          client_secret: cachedPI.client_secret!,
          payment_intent_id: cachedPI.id,
          amount: cachedPI.amount,
          currency: cachedPI.currency,
          metadata: cachedPI.metadata,
          cached: true,
          echeance: {
            id: data.echeanceId,
            montant: data.amount,
            statut: "en_attente",
          },
        };
      }

      // Récupérer les détails de l'échéance via Prisma
      const echeance = await prisma.echeances.findUnique({
        where: { id: data.echeanceId },
        include: {
          utilisateurs: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      });

      if (!echeance) {
        throw new Error(`Échéance ${data.echeanceId} introuvable`);
      }

      // Vérifier que l'échéance appartient bien à l'utilisateur
      if (echeance.utilisateur_id !== data.userId) {
        throw new Error("Cette échéance n'appartient pas à cet utilisateur");
      }

      // Vérifier que l'échéance n'est pas déjà payée
      if (echeance.statut === "payé" || echeance.statut === "paye") {
        throw new Error("Cette échéance a déjà été payée");
      }

      // Valider et convertir le montant
      const amountInCents = this.validateAndConvertAmount(data.amount);

      // Créer le payment intent via Stripe
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: amountInCents,
        currency: data.currency || "eur",
        metadata: {
          echeance_id: data.echeanceId.toString(),
          utilisateur_id: data.userId.toString(),
          type: "echeance",
          montant_euros: data.amount.toString(),
        },
        description:
          data.description || `Paiement échéance #${data.echeanceId}`,
      });

      // Mettre en cache
      this.cachePaymentIntent(cacheKey, paymentIntent);

      console.log(
        "✅ [Payment Intent Service] Payment Intent créé:",
        paymentIntent.id,
      );

      return {
        client_secret: paymentIntent.client_secret!,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
        echeance: {
          id: echeance.id,
          montant: Number(echeance.montant),
          statut: echeance.statut || "en_attente",
        },
      };
    } catch (error: any) {
      console.error(
        "❌ [Payment Intent Service] Erreur createForEcheance:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "payment-intent",
          operation: "createForEcheance",
        },
        extra: {
          echeanceId: data.echeanceId,
          userId: data.userId,
          amount: data.amount,
        },
      });

      throw error;
    }
  }

  /**
   * Crée un payment intent pour une commande
   */
  public async createForCommande(data: {
    amount: number;
    commande: number | { id: number };
    userId?: number;
    currency?: string;
    description?: string;
  }): Promise<{
    client_secret: string;
    payment_intent_id: string;
    amount: number;
    currency: string;
  }> {
    try {
      // Extraire l'ID de la commande
      let commandeId: number;
      let userId: number | undefined = data.userId;

      if (typeof data.commande === "number") {
        commandeId = data.commande;
      } else if (typeof data.commande === "object" && data.commande.id) {
        commandeId = data.commande.id;
      } else {
        throw new Error("Format de commande invalide");
      }

      addSentryBreadcrumb(
        `Création Payment Intent pour commande: ${commandeId}`,
        "payment.intent",
        "info",
        {
          commandeId,
          userId,
          amount: data.amount,
        },
      );

      console.log(
        "🎯 [Payment Intent Service] Création Payment Intent pour commande:",
        data,
      );

      // Si userId n'est pas fourni, le récupérer via la commande
      if (!userId) {
        const commande = await prisma.commandes.findUnique({
          where: { id: commandeId },
        });

        if (!commande) {
          throw new Error(`Commande ${commandeId} introuvable`);
        }

        userId = commande.utilisateur_id;

        // Vérifier que la commande n'est pas déjà payée
        const statutsPayes = ["payé", "paye", "completed", "paid"];
        if (statutsPayes.includes(commande.statut?.toLowerCase() || "")) {
          throw new Error("Cette commande a déjà été payée");
        }
      }

      // Valider et convertir le montant
      const amountInCents = this.validateAndConvertAmount(data.amount);

      // Créer le payment intent via Stripe
      const paymentIntent = await this.stripeService.createPaymentIntent({
        amount: amountInCents,
        currency: data.currency || "eur",
        metadata: {
          type: "commande",
          commande_id: commandeId.toString(),
          utilisateur_id: userId.toString(),
          montant_euros: data.amount.toString(),
        },
        description: data.description || `Paiement commande #${commandeId}`,
      });

      console.log(
        "✅ [Payment Intent Service] Payment Intent créé:",
        paymentIntent.id,
      );

      return {
        client_secret: paymentIntent.client_secret!,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      };
    } catch (error: any) {
      console.error(
        "❌ [Payment Intent Service] Erreur createForCommande:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "payment-intent",
          operation: "createForCommande",
        },
        extra: {
          commande: data.commande,
          userId: data.userId,
          amount: data.amount,
        },
      });

      throw error;
    }
  }

  /**
   * Récupère un payment intent par son ID
   */
  public async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<Stripe.PaymentIntent> {
    try {
      addSentryBreadcrumb(
        `Récupération Payment Intent: ${paymentIntentId}`,
        "payment.intent",
        "info",
        { paymentIntentId },
      );

      console.log(
        "🔍 [Payment Intent Service] Récupération Payment Intent:",
        paymentIntentId,
      );

      if (!paymentIntentId || !paymentIntentId.startsWith("pi_")) {
        throw new Error("ID de Payment Intent invalide");
      }

      return await this.stripeService.retrievePaymentIntent(paymentIntentId);
    } catch (error: any) {
      console.error(
        "❌ [Payment Intent Service] Erreur retrievePaymentIntent:",
        error,
      );

      captureException(error, {
        level: "error",
        tags: {
          service: "payment-intent",
          operation: "retrievePaymentIntent",
        },
        extra: { paymentIntentId },
      });

      throw error;
    }
  }

  /**
   * Nettoie le cache
   */
  public clearCache(): void {
    this.cache.clear();
    console.log("🧹 [Payment Intent Service] Cache nettoyé");
  }
}
