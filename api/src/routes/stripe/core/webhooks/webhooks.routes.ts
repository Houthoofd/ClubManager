/**
 * Routes pour les webhooks Stripe
 * Gestion des événements webhook de paiement avec Sentry
 */

import { Router, Response } from "express";
import Stripe from "stripe";
import * as Sentry from "@sentry/node";
import { WebhookRequest } from "@clubmanager/types";
import { WebhookService } from "./webhook.service.js";

const router = Router();

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const webhookService = new WebhookService();

console.log("🔧 [Webhooks Routes] Initialisation des routes webhooks Stripe");

/**
 * POST /api/stripe/webhooks/stripe
 * Route principale pour recevoir les événements webhook de Stripe
 * IMPORTANT: Cette route doit recevoir le body brut (Buffer)
 */
router.post("/stripe", async (req: WebhookRequest, res: Response) => {
  const sig = req.headers["stripe-signature"] as string;

  // Démarrer une transaction Sentry pour le webhook complet
  const transaction = Sentry.startTransaction({
    op: "webhook.handle",
    name: "Handle Stripe Webhook",
  });

  try {
    // Validation de la configuration
    if (!endpointSecret) {
      console.error("❌ [Webhooks] STRIPE_WEBHOOK_SECRET non configuré");
      transaction.setStatus("failed_precondition");
      transaction.finish();
      return res.status(500).json({
        error: "Configuration webhook manquante",
      });
    }

    if (!sig) {
      console.error("❌ [Webhooks] Signature manquante dans les headers");
      transaction.setStatus("invalid_argument");
      transaction.finish();
      return res.status(400).json({
        error: "Signature webhook manquante",
      });
    }

    // Valider la signature et récupérer l'événement
    const event = webhookService.validateSignature(
      req.body,
      sig,
      endpointSecret,
      stripe,
    );

    console.log("🎣 [Webhooks] Événement Stripe validé:", event.type);

    // Ajouter le contexte Sentry
    Sentry.setContext("webhook", {
      eventId: event.id,
      eventType: event.type,
      livemode: event.livemode,
    });

    // Traiter les différents types d'événements
    let result;

    switch (event.type) {
      case "payment_intent.succeeded":
        console.log("✅ [Webhooks] Traitement paiement réussi");
        result = await webhookService.handlePaymentSuccess(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "payment_intent.payment_failed":
        console.log("❌ [Webhooks] Traitement paiement échoué");
        result = await webhookService.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent,
        );
        break;

      case "checkout.session.completed":
        console.log("🛒 [Webhooks] Checkout session complétée");
        result = await webhookService.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case "invoice.payment_succeeded":
        console.log("📄 [Webhooks] Facture payée");
        result = await webhookService.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        break;

      case "invoice.payment_failed":
        console.log("❌ [Webhooks] Échec paiement facture");
        result = await webhookService.handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;

      case "customer.subscription.created":
        console.log("🔔 [Webhooks] Abonnement créé");
        result = await webhookService.handleSubscriptionCreated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.updated":
        console.log("🔔 [Webhooks] Abonnement mis à jour");
        result = await webhookService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case "customer.subscription.deleted":
        console.log("🔔 [Webhooks] Abonnement supprimé");
        result = await webhookService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      default:
        console.log("⚠️ [Webhooks] Événement non géré:", event.type);
        result = {
          success: true,
          eventType: event.type,
          eventId: event.id,
          processedAt: new Date(),
        };
    }

    // Marquer la transaction comme réussie
    transaction.setStatus("ok");
    transaction.finish();

    // Répondre à Stripe
    res.json({
      received: true,
      eventId: event.id,
      eventType: event.type,
      processed: result.success,
    });

    console.log(`✅ [Webhooks] Événement ${event.type} traité avec succès`);
  } catch (error: any) {
    console.error("❌ [Webhooks] Erreur traitement webhook:", error);

    // Capturer l'erreur dans Sentry
    Sentry.captureException(error, {
      tags: {
        component: "webhook",
        action: "process_event",
      },
      level: "error",
    });

    transaction.setStatus("internal_error");
    transaction.finish();

    // Répondre avec erreur
    res.status(400).json({
      error: "Erreur traitement webhook",
      message: error.message,
    });
  }
});

/**
 * POST /api/stripe/webhooks/test
 * Route de test pour développement (sans validation de signature)
 * À utiliser uniquement en développement !
 */
router.post("/test", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      error: "Route de test non disponible en production",
    });
  }

  try {
    const event = req.body;
    console.log("🔔 [Webhooks Test] Webhook de test reçu:", event);

    // Répondre avec succès immédiat
    return res.status(200).json({
      received: true,
      message: "Webhook de test reçu",
      event: event,
    });
  } catch (error: any) {
    console.error(
      "❌ [Webhooks Test] Erreur traitement webhook de test:",
      error,
    );
    return res.status(400).json({
      error: "Erreur traitement webhook de test",
      message: error.message,
    });
  }
});

/**
 * GET /api/stripe/webhooks/health
 * Health check du système de webhooks
 */
router.get("/health", (req, res) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    config: {
      secretConfigured: !!endpointSecret,
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
      environment: process.env.NODE_ENV || "development",
    },
  };

  res.json(health);
});

console.log(
  "✅ [Webhooks Routes] Routes webhooks Stripe initialisées avec succès",
);

export default router;
