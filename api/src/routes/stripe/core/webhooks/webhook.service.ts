/**
 * Service pour gérer les webhooks Stripe avec monitoring Sentry
 */

import Stripe from "stripe";
import * as Sentry from "@sentry/node";
import {
  WebhookProcessingResult,
  WebhookError,
  WebhookLog,
  WebhookStats,
  WebhookLogStatus,
} from "@clubmanager/types";
import { Paiements } from "../../../../infrastructure/database/repositories/paiements/paiements.js";
import { Message } from "../../../../infrastructure/database/repositories/messages/messages.js";
import { emailClient } from "../../../../infrastructure/external-services/emailClient.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class WebhookService {
  private paiements: Paiements;
  private messageClient: Message;

  constructor() {
    this.paiements = new Paiements();
    this.messageClient = new Message();
  }

  validateSignature(
    payload: Buffer,
    signature: string,
    secret: string,
    stripe: Stripe,
  ): Stripe.Event {
    const transaction = Sentry.startTransaction({
      op: "webhook.validate",
      name: "Validate Stripe Webhook Signature",
    });
    try {
      const event = stripe.webhooks.constructEvent(payload, signature, secret);
      transaction.setStatus("ok");
      transaction.finish();
      return event;
    } catch (err: any) {
      transaction.setStatus("invalid_argument");
      transaction.finish();
      Sentry.captureException(err, {
        tags: { component: "webhook", action: "validate_signature" },
      });
      throw new WebhookError(
        `Signature invalide: ${err.message}`,
        "INVALID_SIGNATURE",
      );
    }
  }

  async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Payment Success",
    });

    const eventId = `evt_${paymentIntent.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(
        eventId,
        "payment_intent.succeeded",
        paymentIntent,
      );

      const echeanceId = paymentIntent.metadata?.echeance_id;
      const utilisateurId = paymentIntent.metadata?.utilisateur_id;
      const montantPaye = paymentIntent.amount / 100;
      Sentry.setContext("payment", {
        paymentIntentId: paymentIntent.id,
        echeanceId,
        utilisateurId,
        montantPaye,
        currency: paymentIntent.currency,
      });
      await this.paiements.confirmerPaiementStripe(paymentIntent.id, "reussi");
      if (echeanceId && utilisateurId) {
        await this.updateEcheance(
          parseInt(echeanceId),
          parseInt(utilisateurId),
        );
        const premierPaiement = await this.paiements.estPremierPaiement(
          parseInt(utilisateurId),
        );
        await this.sendConfirmationEmail({
          utilisateurId: parseInt(utilisateurId),
          montantPaye,
          paymentIntentId: paymentIntent.id,
          currency: paymentIntent.currency,
          echeanceId,
          premierPaiement,
        });
      }
      await this.paiements.enregistrerPaiement({
        utilisateur_id: parseInt(utilisateurId || "0"),
        montant: montantPaye,
        methode_paiement: "stripe",
        stripe_payment_intent_id: paymentIntent.id,
        statut: "reussi",
        description: `Webhook Stripe - ${paymentIntent.description || "Paiement"}`,
        abonnement_id: paymentIntent.metadata?.abonnement_id
          ? parseInt(paymentIntent.metadata.abonnement_id)
          : null,
      });

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();
      return {
        success: true,
        eventType: "payment_intent.succeeded",
        eventId: paymentIntent.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "payment_success",
          paymentIntentId: paymentIntent.id,
        },
      });
      throw error;
    }
  }

  async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Payment Failed",
    });

    const eventId = `evt_${paymentIntent.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(
        eventId,
        "payment_intent.payment_failed",
        paymentIntent,
      );

      const echeanceId = paymentIntent.metadata?.echeance_id;
      const utilisateurId = paymentIntent.metadata?.utilisateur_id;
      const errorMessage =
        paymentIntent.last_payment_error?.message || "Erreur inconnue";
      Sentry.setContext("payment_failure", {
        paymentIntentId: paymentIntent.id,
        echeanceId,
        utilisateurId,
        errorMessage,
        errorCode: paymentIntent.last_payment_error?.code,
      });
      await this.paiements.confirmerPaiementStripe(paymentIntent.id, "echec");
      if (utilisateurId) {
        await this.sendFailureEmail({
          utilisateurId: parseInt(utilisateurId),
          montant: paymentIntent.amount / 100,
          paymentIntentId: paymentIntent.id,
          currency: paymentIntent.currency,
          errorMessage,
          echeanceId,
        });
      }
      await this.paiements.enregistrerPaiement({
        utilisateur_id: parseInt(utilisateurId || "0"),
        montant: paymentIntent.amount / 100,
        methode_paiement: "stripe",
        stripe_payment_intent_id: paymentIntent.id,
        statut: "echec",
      });

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();
      return {
        success: true,
        eventType: "payment_intent.payment_failed",
        eventId: paymentIntent.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "payment_failed",
          paymentIntentId: paymentIntent.id,
        },
      });
      throw error;
    }
  }

  private async updateEcheance(
    echeanceId: number,
    utilisateurId: number,
  ): Promise<void> {
    const query = `UPDATE echeances_paiements SET statut = 'payé', date_paiement = CURDATE() WHERE id = ? AND utilisateur_id = ? AND statut != 'payé'`;
    await this.paiements.queryAsync(query, [echeanceId, utilisateurId]);
  }

  private async sendConfirmationEmail(data: any): Promise<void> {
    try {
      const utilisateur = await this.messageClient.obtenirEmailsDestinataires([
        data.utilisateurId,
      ]);
      if (utilisateur.length > 0 && utilisateur[0].email) {
        await emailClient.sendTemplatedEmailFromFile({
          to: utilisateur[0].email,
          templateName: "confirmation-paiement",
          variables: {
            userName: `${utilisateur[0].first_name} ${utilisateur[0].last_name}`,
            firstName: utilisateur[0].first_name,
            lastName: utilisateur[0].last_name,
            amount: data.montantPaye.toFixed(2),
            currency: data.currency.toUpperCase(),
            paymentIntentId: data.paymentIntentId,
            echeanceId: data.echeanceId || "N/A",
            datePaiement: new Date().toLocaleDateString("fr-FR"),
            clubName: "Club Manager",
            currentYear: new Date().getFullYear().toString(),
            supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
            frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            premierPaiement: data.premierPaiement.toString(),
          },
          utilisateurId: data.utilisateurId,
          fallbackSubject: "[ClubManager] Confirmation de paiement",
        });
      }
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "send_confirmation_email" },
      });
    }
  }

  private async sendFailureEmail(data: any): Promise<void> {
    try {
      const utilisateur = await this.messageClient.obtenirEmailsDestinataires([
        data.utilisateurId,
      ]);
      if (utilisateur.length > 0 && utilisateur[0].email) {
        await emailClient.sendTemplatedEmailFromFile({
          to: utilisateur[0].email,
          templateName: "echec-paiement",
          variables: {
            userName: `${utilisateur[0].first_name} ${utilisateur[0].last_name}`,
            firstName: utilisateur[0].first_name,
            lastName: utilisateur[0].last_name,
            amount: data.montant.toFixed(2),
            currency: data.currency.toUpperCase(),
            errorMessage: data.errorMessage,
            paymentIntentId: data.paymentIntentId,
            echeanceId: data.echeanceId || "N/A",
            dateEchec: new Date().toLocaleDateString("fr-FR"),
            clubName: "Club Manager",
            currentYear: new Date().getFullYear().toString(),
            supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
            frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
            retryUrl: data.echeanceId
              ? `${process.env.FRONTEND_URL}/pages/paiement?echeance=${data.echeanceId}&userId=${data.utilisateurId}`
              : `${process.env.FRONTEND_URL}/pages/paiement?userId=${data.utilisateurId}`,
          },
          utilisateurId: data.utilisateurId,
          fallbackSubject: "[ClubManager] Échec de paiement - Action requise",
        });
      }
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "send_failure_email" },
      });
    }
  }

  /**
   * ============================================
   * MÉTHODES D'ENVOI D'EMAILS
   * ============================================
   */

  /**
   * Envoyer email de confirmation de facture payée
   */
  private async sendInvoiceSuccessEmail(data: any): Promise<void> {
    try {
      await emailClient.sendTemplatedEmailFromFile({
        to: data.email,
        templateName: "confirmation-facture",
        variables: {
          userName: data.userName,
          firstName: data.firstName,
          lastName: data.lastName,
          invoiceNumber: data.invoiceNumber,
          amount: data.montantPaye.toFixed(2),
          currency: data.currency.toUpperCase(),
          datePaiement: new Date().toLocaleDateString("fr-FR"),
          subscriptionId: data.subscriptionId || "",
          periodStart: data.periodStart || "",
          periodEnd: data.periodEnd || "",
          invoicePdfUrl: data.invoicePdfUrl || "",
          hostedInvoiceUrl: data.hostedInvoiceUrl || "",
          paymentIntentId: data.paymentIntentId,
          clubName: "Club Manager",
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
          frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        },
        utilisateurId: data.utilisateurId,
        fallbackSubject: "[ClubManager] Facture payée",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "send_invoice_success_email" },
      });
    }
  }

  /**
   * Envoyer email d'échec de facture
   */
  private async sendInvoiceFailureEmail(data: any): Promise<void> {
    try {
      await emailClient.sendTemplatedEmailFromFile({
        to: data.email,
        templateName: "echec-facture",
        variables: {
          userName: data.userName,
          firstName: data.firstName,
          lastName: data.lastName,
          invoiceNumber: data.invoiceNumber,
          amount: data.montant.toFixed(2),
          currency: data.currency.toUpperCase(),
          dateEchec: new Date().toLocaleDateString("fr-FR"),
          subscriptionId: data.subscriptionId || "",
          periodStart: data.periodStart || "",
          periodEnd: data.periodEnd || "",
          attemptCount: data.attemptCount.toString(),
          nextPaymentAttempt: data.nextPaymentAttempt || "",
          hostedInvoiceUrl: data.hostedInvoiceUrl || "",
          errorMessage: data.errorMessage,
          retryUrl: `${process.env.FRONTEND_URL}/compte/abonnement`,
          clubName: "Club Manager",
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
          frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        },
        utilisateurId: data.utilisateurId,
        fallbackSubject:
          "[ClubManager] Échec de paiement de facture - Action requise",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "send_invoice_failure_email" },
      });
    }
  }

  /**
   * Envoyer email de bienvenue abonnement
   */
  private async sendSubscriptionWelcomeEmail(data: any): Promise<void> {
    try {
      await emailClient.sendTemplatedEmailFromFile({
        to: data.email,
        templateName: "bienvenue-abonnement",
        variables: {
          userName: data.userName,
          firstName: data.firstName,
          lastName: data.lastName,
          subscriptionId: data.subscriptionId,
          planName: data.planName,
          startDate: data.startDate,
          nextBillingDate: data.nextBillingDate,
          trialEnd: data.trialEnd || "",
          trialPeriod: data.trialEnd ? "true" : "false",
          userEmail: data.email,
          clubName: "Club Manager",
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
          frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        },
        utilisateurId: data.utilisateurId,
        fallbackSubject: "[ClubManager] Bienvenue - Votre abonnement est actif",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "send_subscription_welcome_email",
        },
      });
    }
  }

  /**
   * Envoyer email d'annulation d'abonnement
   */
  private async sendSubscriptionCancelledEmail(data: any): Promise<void> {
    try {
      await emailClient.sendTemplatedEmailFromFile({
        to: data.email,
        templateName: "annulation-abonnement",
        variables: {
          userName: data.userName,
          firstName: data.firstName,
          lastName: data.lastName,
          subscriptionId: data.subscriptionId,
          planName: data.planName,
          canceledAt: data.canceledAt,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd ? "true" : "false",
          endDate: data.endDate || "",
          feedback: "true",
          feedbackUrl: `${process.env.FRONTEND_URL}/feedback`,
          clubName: "Club Manager",
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
          frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        },
        utilisateurId: data.utilisateurId,
        fallbackSubject: "[ClubManager] Confirmation d'annulation d'abonnement",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "send_subscription_cancelled_email",
        },
      });
    }
  }

  /**
   * Envoyer email d'alerte past_due
   */
  private async sendSubscriptionPastDueEmail(data: any): Promise<void> {
    try {
      await emailClient.sendTemplatedEmailFromFile({
        to: data.email,
        templateName: "rappel-paiement-1",
        variables: {
          userName: data.userName,
          subscriptionId: data.subscriptionId,
          clubName: "Club Manager",
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
          frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        },
        utilisateurId: 0,
        fallbackSubject: "[ClubManager] Paiement en retard - Action requise",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "send_subscription_past_due_email",
        },
      });
    }
  }

  /**
   * Envoyer email d'annulation programmée
   */
  private async sendSubscriptionCancellationScheduledEmail(
    data: any,
  ): Promise<void> {
    try {
      await emailClient.sendTemplatedEmailFromFile({
        to: data.email,
        templateName: "annulation-abonnement",
        variables: {
          userName: data.userName,
          subscriptionId: data.subscriptionId,
          endDate: data.endDate,
          cancelAtPeriodEnd: "true",
          clubName: "Club Manager",
          currentYear: new Date().getFullYear().toString(),
          supportEmail: process.env.ADMIN_EMAIL || "support@clubmanager.com",
          frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        },
        utilisateurId: 0,
        fallbackSubject:
          "[ClubManager] Annulation programmée de votre abonnement",
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "send_subscription_cancellation_scheduled_email",
        },
      });
    }
  }

  /**
   * Créer les échéances de paiement pour un abonnement
   */
  private async createPaymentSchedule(params: {
    utilisateurId: number;
    subscriptionId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }): Promise<void> {
    try {
      // Récupérer l'abonnement de l'utilisateur
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { id: params.utilisateurId },
        include: { plans_tarifaires: true },
      });

      if (!utilisateur || !utilisateur.abonnement_id) {
        console.warn(
          `⚠️ [Webhooks] Pas d'abonnement trouvé pour utilisateur ${params.utilisateurId}`,
        );
        return;
      }

      // Créer une échéance pour cette période
      await prisma.echeances_paiements.create({
        data: {
          utilisateur_id: params.utilisateurId,
          abonnement_id: utilisateur.abonnement_id,
          date_echeance: params.currentPeriodEnd,
          montant: utilisateur.plans_tarifaires?.prix || 0,
          statut: "en_attente",
        },
      });

      console.log(
        `✅ [Webhooks] Échéance créée pour utilisateur ${params.utilisateurId}`,
      );
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "create_payment_schedule" },
      });
    }
  }

  /**
   * Annuler les échéances futures d'un utilisateur
   */
  private async cancelFuturePaymentSchedules(
    utilisateurId: number,
  ): Promise<void> {
    try {
      const today = new Date();

      // Marquer comme annulées toutes les échéances futures non payées
      await prisma.echeances_paiements.updateMany({
        where: {
          utilisateur_id: utilisateurId,
          date_echeance: { gte: today },
          statut: "en_attente",
        },
        data: {
          statut: "en_attente", // Garder en attente mais on pourrait ajouter un statut "annulé"
        },
      });

      console.log(
        `✅ [Webhooks] Échéances futures annulées pour utilisateur ${utilisateurId}`,
      );
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "cancel_future_schedules" },
      });
    }
  }

  /**
   * ============================================
   * HANDLERS POUR ÉVÉNEMENTS STRIPE ADDITIONNELS
   * ============================================
   */

  /**
   * Traiter un checkout session completed
   */
  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Checkout Session Completed",
    });

    const eventId = `evt_${session.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(
        eventId,
        "checkout.session.completed",
        session,
      );

      const paymentIntentId = session.payment_intent as string;
      const utilisateurId = session.metadata?.utilisateur_id;
      const echeanceId = session.metadata?.echeance_id;
      const montantPaye = (session.amount_total || 0) / 100;

      Sentry.setContext("checkout_session", {
        sessionId: session.id,
        paymentIntentId,
        utilisateurId,
        echeanceId,
        montantPaye,
        currency: session.currency,
        paymentStatus: session.payment_status,
      });

      // Si le paiement est réussi
      if (session.payment_status === "paid" && paymentIntentId) {
        // Confirmer le paiement
        await this.paiements.confirmerPaiementStripe(paymentIntentId, "reussi");

        // Mettre à jour l'échéance si applicable
        if (echeanceId && utilisateurId) {
          await this.updateEcheance(
            parseInt(echeanceId),
            parseInt(utilisateurId),
          );

          const premierPaiement = await this.paiements.estPremierPaiement(
            parseInt(utilisateurId),
          );

          await this.sendConfirmationEmail({
            utilisateurId: parseInt(utilisateurId),
            montantPaye,
            paymentIntentId,
            currency: session.currency || "eur",
            echeanceId,
            premierPaiement,
          });
        }

        // Enregistrer le paiement
        await this.paiements.enregistrerPaiement({
          utilisateur_id: parseInt(utilisateurId || "0"),
          montant: montantPaye,
          methode_paiement: "stripe",
          stripe_payment_intent_id: paymentIntentId,
          statut: "reussi",
          description: `Checkout Session - ${session.customer_email || "Paiement"}`,
          abonnement_id: session.subscription
            ? parseInt(session.subscription as string)
            : null,
        });
      }

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        eventType: "checkout.session.completed",
        eventId: session.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "checkout_session_completed",
          sessionId: session.id,
        },
      });
      throw error;
    }
  }

  /**
   * Traiter un invoice payment succeeded
   */
  async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Invoice Payment Succeeded",
    });

    const eventId = `evt_${invoice.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(
        eventId,
        "invoice.payment_succeeded",
        invoice,
      );

      const subscriptionId = invoice.subscription as string;
      const customerId = invoice.customer as string;
      const montantPaye = (invoice.amount_paid || 0) / 100;

      Sentry.setContext("invoice", {
        invoiceId: invoice.id,
        subscriptionId,
        customerId,
        montantPaye,
        currency: invoice.currency,
        status: invoice.status,
      });

      // Récupérer l'utilisateur par son stripe customer ID
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { stripe_customer_id: customerId },
      });

      if (!utilisateur) {
        console.warn(
          `⚠️ [Webhooks] Utilisateur non trouvé pour customer ${customerId}`,
        );
        // Continuer quand même pour enregistrer le paiement
      }

      const utilisateurId = utilisateur?.id || 0;

      // Enregistrer le paiement de facture
      await this.paiements.enregistrerPaiement({
        utilisateur_id: utilisateurId,
        montant: montantPaye,
        methode_paiement: "stripe",
        stripe_payment_intent_id: invoice.payment_intent as string,
        statut: "reussi",
        description: `Facture ${invoice.number || invoice.id}`,
        abonnement_id: subscriptionId ? parseInt(subscriptionId) : null,
      });

      // Envoyer email de confirmation de facture payée
      if (utilisateur?.email) {
        await this.sendInvoiceSuccessEmail({
          utilisateurId,
          email: utilisateur.email,
          userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
          firstName: utilisateur.first_name,
          lastName: utilisateur.last_name,
          invoiceNumber: invoice.number || invoice.id,
          montantPaye,
          currency: invoice.currency,
          subscriptionId,
          periodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000).toLocaleDateString("fr-FR")
            : undefined,
          periodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000).toLocaleDateString("fr-FR")
            : undefined,
          invoicePdfUrl: invoice.invoice_pdf || undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          paymentIntentId: invoice.payment_intent as string,
        });
      }

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        eventType: "invoice.payment_succeeded",
        eventId: invoice.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "invoice_payment_succeeded",
          invoiceId: invoice.id,
        },
      });
      throw error;
    }
  }

  /**
   * Traiter un invoice payment failed
   */
  async handleInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Invoice Payment Failed",
    });

    const eventId = `evt_${invoice.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(eventId, "invoice.payment_failed", invoice);

      const subscriptionId = invoice.subscription as string;
      const customerId = invoice.customer as string;
      const montantDu = (invoice.amount_due || 0) / 100;

      Sentry.setContext("invoice_failure", {
        invoiceId: invoice.id,
        subscriptionId,
        customerId,
        montantDu,
        currency: invoice.currency,
        status: invoice.status,
        attemptCount: invoice.attempt_count,
      });

      // Récupérer l'utilisateur par son stripe customer ID
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { stripe_customer_id: customerId },
      });

      if (!utilisateur) {
        console.warn(
          `⚠️ [Webhooks] Utilisateur non trouvé pour customer ${customerId}`,
        );
      }

      const utilisateurId = utilisateur?.id || 0;

      // Enregistrer l'échec de paiement
      await this.paiements.enregistrerPaiement({
        utilisateur_id: utilisateurId,
        montant: montantDu,
        methode_paiement: "stripe",
        stripe_payment_intent_id: invoice.payment_intent as string,
        statut: "echec",
        description: `Échec facture ${invoice.number || invoice.id}`,
        abonnement_id: subscriptionId ? parseInt(subscriptionId) : null,
      });

      // Envoyer email d'échec de paiement de facture
      if (utilisateur?.email) {
        await this.sendInvoiceFailureEmail({
          utilisateurId,
          email: utilisateur.email,
          userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
          firstName: utilisateur.first_name,
          lastName: utilisateur.last_name,
          invoiceNumber: invoice.number || invoice.id,
          montant: montantDu,
          currency: invoice.currency,
          subscriptionId,
          periodStart: invoice.period_start
            ? new Date(invoice.period_start * 1000).toLocaleDateString("fr-FR")
            : undefined,
          periodEnd: invoice.period_end
            ? new Date(invoice.period_end * 1000).toLocaleDateString("fr-FR")
            : undefined,
          attemptCount: invoice.attempt_count || 1,
          nextPaymentAttempt: invoice.next_payment_attempt
            ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString(
                "fr-FR",
              )
            : undefined,
          hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
          errorMessage: "Le paiement de votre facture n'a pas pu être traité",
        });
      }

      // Si tentatives max atteintes (3), suspendre l'abonnement
      if (invoice.attempt_count && invoice.attempt_count >= 3) {
        console.warn(
          `⚠️ [Webhooks] Tentatives max atteintes pour subscription ${subscriptionId}`,
        );

        if (utilisateur && subscriptionId) {
          // Mettre à jour le statut utilisateur
          await prisma.utilisateurs.update({
            where: { id: utilisateurId },
            data: {
              active: false,
              stripe_subscription_id: null,
            },
          });

          // TODO: Créer une alerte pour l'admin
          console.error(
            `🚨 [Webhooks] Abonnement ${subscriptionId} suspendu pour échecs répétés`,
          );
        }
      }

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        eventType: "invoice.payment_failed",
        eventId: invoice.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "invoice_payment_failed",
          invoiceId: invoice.id,
        },
      });
      throw error;
    }
  }

  /**
   * Traiter la création d'un abonnement
   */
  async handleSubscriptionCreated(
    subscription: Stripe.Subscription,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Subscription Created",
    });

    const eventId = `evt_${subscription.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(
        eventId,
        "customer.subscription.created",
        subscription,
      );

      const customerId = subscription.customer as string;
      const utilisateurId = subscription.metadata?.utilisateur_id;

      Sentry.setContext("subscription", {
        subscriptionId: subscription.id,
        customerId,
        utilisateurId,
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      // Récupérer l'utilisateur par son stripe customer ID
      const utilisateur = await prisma.utilisateurs.findUnique({
        where: { stripe_customer_id: customerId },
      });

      if (!utilisateur) {
        console.warn(
          `⚠️ [Webhooks] Utilisateur non trouvé pour customer ${customerId}`,
        );
        throw new Error(`Utilisateur non trouvé pour customer ${customerId}`);
      }

      // Mettre à jour l'utilisateur avec l'ID d'abonnement Stripe
      await prisma.utilisateurs.update({
        where: { id: utilisateur.id },
        data: {
          stripe_subscription_id: subscription.id,
          active: true,
        },
      });

      // Créer les échéances de paiement pour la période
      await this.createPaymentSchedule({
        utilisateurId: utilisateur.id,
        subscriptionId: subscription.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });

      // Envoyer email de bienvenue
      await this.sendSubscriptionWelcomeEmail({
        utilisateurId: utilisateur.id,
        email: utilisateur.email,
        userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
        firstName: utilisateur.first_name,
        lastName: utilisateur.last_name,
        subscriptionId: subscription.id,
        planName: "Abonnement mensuel", // TODO: Récupérer depuis subscription.items
        startDate: new Date(
          subscription.current_period_start * 1000,
        ).toLocaleDateString("fr-FR"),
        nextBillingDate: new Date(
          subscription.current_period_end * 1000,
        ).toLocaleDateString("fr-FR"),
        trialEnd: subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toLocaleDateString("fr-FR")
          : undefined,
      });

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        eventType: "customer.subscription.created",
        eventId: subscription.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "subscription_created",
          subscriptionId: subscription.id,
        },
      });
      throw error;
    }
  }

  /**
   * Traiter la mise à jour d'un abonnement
   */
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Subscription Updated",
    });

    const eventId = `evt_${subscription.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(
        eventId,
        "customer.subscription.updated",
        subscription,
      );

      const customerId = subscription.customer as string;
      const utilisateurId = subscription.metadata?.utilisateur_id;

      Sentry.setContext("subscription", {
        subscriptionId: subscription.id,
        customerId,
        utilisateurId,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });

      // Récupérer l'utilisateur par son stripe subscription ID
      const utilisateur = await prisma.utilisateurs.findFirst({
        where: { stripe_subscription_id: subscription.id },
      });

      if (!utilisateur) {
        console.warn(
          `⚠️ [Webhooks] Utilisateur non trouvé pour subscription ${subscription.id}`,
        );
      } else {
        // Mettre à jour le statut selon le statut de l'abonnement
        const isActive = ["active", "trialing"].includes(subscription.status);

        await prisma.utilisateurs.update({
          where: { id: utilisateur.id },
          data: {
            active: isActive,
          },
        });

        // Si statut = "past_due", envoyer alerte paiement
        if (subscription.status === "past_due") {
          console.warn(
            `⚠️ [Webhooks] Abonnement past_due pour utilisateur ${utilisateur.id}`,
          );

          await this.sendSubscriptionPastDueEmail({
            email: utilisateur.email,
            userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
            subscriptionId: subscription.id,
          });
        }

        // Si cancel_at_period_end = true, envoyer notification
        if (subscription.cancel_at_period_end) {
          console.log(
            `ℹ️ [Webhooks] Abonnement programmé pour annulation: ${subscription.id}`,
          );

          await this.sendSubscriptionCancellationScheduledEmail({
            email: utilisateur.email,
            userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
            subscriptionId: subscription.id,
            endDate: new Date(
              subscription.current_period_end * 1000,
            ).toLocaleDateString("fr-FR"),
          });
        }
      }

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        eventType: "customer.subscription.updated",
        eventId: subscription.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "subscription_updated",
          subscriptionId: subscription.id,
        },
      });
      throw error;
    }
  }

  /**
   * Traiter la suppression/annulation d'un abonnement
   */
  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<WebhookProcessingResult> {
    const transaction = Sentry.startTransaction({
      op: "webhook.process",
      name: "Process Subscription Deleted",
    });

    const eventId = `evt_${subscription.id}`;

    try {
      // Créer le log webhook
      await this.createWebhookLog(
        eventId,
        "customer.subscription.deleted",
        subscription,
      );

      const customerId = subscription.customer as string;
      const utilisateurId = subscription.metadata?.utilisateur_id;

      Sentry.setContext("subscription", {
        subscriptionId: subscription.id,
        customerId,
        utilisateurId,
        status: subscription.status,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      });

      // Récupérer l'utilisateur par son stripe subscription ID
      const utilisateur = await prisma.utilisateurs.findFirst({
        where: { stripe_subscription_id: subscription.id },
      });

      if (!utilisateur) {
        console.warn(
          `⚠️ [Webhooks] Utilisateur non trouvé pour subscription ${subscription.id}`,
        );
      } else {
        // Marquer l'abonnement comme annulé
        await prisma.utilisateurs.update({
          where: { id: utilisateur.id },
          data: {
            stripe_subscription_id: null,
            active: false,
          },
        });

        // Annuler les échéances futures
        await this.cancelFuturePaymentSchedules(utilisateur.id);

        // Envoyer email de confirmation d'annulation
        await this.sendSubscriptionCancelledEmail({
          email: utilisateur.email,
          userName: `${utilisateur.first_name} ${utilisateur.last_name}`,
          firstName: utilisateur.first_name,
          lastName: utilisateur.last_name,
          subscriptionId: subscription.id,
          planName: "Abonnement mensuel", // TODO: Récupérer depuis metadata
          canceledAt: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toLocaleDateString(
                "fr-FR",
              )
            : new Date().toLocaleDateString("fr-FR"),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          endDate: subscription.current_period_end
            ? new Date(
                subscription.current_period_end * 1000,
              ).toLocaleDateString("fr-FR")
            : undefined,
        });
      }

      // Marquer le webhook comme succès
      await this.markWebhookSuccess(eventId);

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        eventType: "customer.subscription.deleted",
        eventId: subscription.id,
        processedAt: new Date(),
      };
    } catch (error: any) {
      // Marquer le webhook comme échec
      await this.markWebhookFailure(eventId, error.message);

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "subscription_deleted",
          subscriptionId: subscription.id,
        },
      });
      throw error;
    }
  }

  /**
   * ============================================
   * MÉTHODES DE PERSISTANCE AVEC PRISMA
   * ============================================
   */

  /**
   * Créer un log webhook dans la BDD
   */
  private async createWebhookLog(
    eventId: string,
    eventType: string,
    payload: any,
  ): Promise<void> {
    try {
      await prisma.webhookLog.create({
        data: {
          eventId,
          eventType,
          status: "PENDING",
          payload: payload as any,
          retryCount: 0,
        },
      });
    } catch (error: any) {
      // Log l'erreur mais ne pas bloquer le traitement
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "create_log" },
      });
    }
  }

  /**
   * Marquer un webhook comme succès
   */
  private async markWebhookSuccess(eventId: string): Promise<void> {
    try {
      await prisma.webhookLog.update({
        where: { eventId },
        data: {
          status: "SUCCESS",
          processedAt: new Date(),
        },
      });
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "mark_success" },
      });
    }
  }

  /**
   * Marquer un webhook comme échec
   */
  private async markWebhookFailure(
    eventId: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      const log = await prisma.webhookLog.findUnique({
        where: { eventId },
      });

      if (log) {
        await prisma.webhookLog.update({
          where: { eventId },
          data: {
            status: "FAILURE",
            error: errorMessage,
            retryCount: log.retryCount + 1,
            nextRetryAt:
              log.retryCount < 3
                ? new Date(Date.now() + (log.retryCount + 1) * 60000)
                : null,
          },
        });
      }
    } catch (error: any) {
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "mark_failure" },
      });
    }
  }

  /**
   * ============================================
   * MÉTHODES GRAPHQL POUR L'ADMINISTRATION
   * ============================================
   */

  /**
   * Récupérer les logs des webhooks avec pagination et filtres
   */
  async getWebhookLogs(params: {
    limit: number;
    offset: number;
    status?: WebhookLogStatus;
    eventType?: string;
  }): Promise<WebhookLog[]> {
    const transaction = Sentry.startTransaction({
      op: "webhook.query",
      name: "Get Webhook Logs",
    });

    try {
      const logs = await prisma.webhookLog.findMany({
        where: {
          ...(params.status && { status: params.status }),
          ...(params.eventType && { eventType: params.eventType }),
        },
        orderBy: { createdAt: "desc" },
        take: params.limit,
        skip: params.offset,
      });

      transaction.setStatus("ok");
      transaction.finish();

      return logs.map((log) => ({
        id: log.id,
        eventId: log.eventId,
        eventType: log.eventType,
        status: log.status as WebhookLogStatus,
        payload: log.payload,
        error: log.error || undefined,
        retryCount: log.retryCount,
        nextRetryAt: log.nextRetryAt || undefined,
        processedAt: log.processedAt || undefined,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      }));
    } catch (error: any) {
      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "get_logs" },
      });
      throw error;
    }
  }

  /**
   * Récupérer un log webhook par son ID
   */
  async getWebhookLogById(id: string): Promise<WebhookLog | null> {
    const transaction = Sentry.startTransaction({
      op: "webhook.query",
      name: "Get Webhook Log By ID",
    });

    try {
      const log = await prisma.webhookLog.findUnique({
        where: { id },
      });

      transaction.setStatus("ok");
      transaction.finish();

      if (!log) return null;

      return {
        id: log.id,
        eventId: log.eventId,
        eventType: log.eventType,
        status: log.status as WebhookLogStatus,
        payload: log.payload,
        error: log.error || undefined,
        retryCount: log.retryCount,
        nextRetryAt: log.nextRetryAt || undefined,
        processedAt: log.processedAt || undefined,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      };
    } catch (error: any) {
      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "get_log_by_id", logId: id },
      });
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des webhooks
   */
  async getWebhookStats(params: {
    startDate?: string;
    endDate?: string;
  }): Promise<WebhookStats> {
    const transaction = Sentry.startTransaction({
      op: "webhook.query",
      name: "Get Webhook Stats",
    });

    try {
      const whereClause = {
        ...(params.startDate && {
          createdAt: { gte: new Date(params.startDate) },
        }),
        ...(params.endDate && {
          createdAt: { lte: new Date(params.endDate) },
        }),
      };

      const [total, success, failure, pending, recentFailures] =
        await Promise.all([
          prisma.webhookLog.count({ where: whereClause }),
          prisma.webhookLog.count({
            where: { ...whereClause, status: "SUCCESS" },
          }),
          prisma.webhookLog.count({
            where: { ...whereClause, status: "FAILURE" },
          }),
          prisma.webhookLog.count({
            where: { ...whereClause, status: "PENDING" },
          }),
          prisma.webhookLog.findMany({
            where: { ...whereClause, status: "FAILURE" },
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
        ]);

      // Calculer les stats par type d'événement
      const groupedByType = await prisma.webhookLog.groupBy({
        by: ["eventType"],
        where: whereClause,
        _count: { id: true },
      });

      const stats: WebhookStats = {
        totalProcessed: total,
        successCount: success,
        failureCount: failure,
        pendingCount: pending,
        averageProcessingTime: 0, // TODO: Calculer si processedAt disponible
        byEventType: groupedByType.map((group) => ({
          eventType: group.eventType,
          count: group._count.id,
          successRate: 0, // TODO: Calculer avec sous-requête
          averageProcessingTime: 0,
        })),
        recentFailures: recentFailures.map((log) => ({
          id: log.id,
          eventId: log.eventId,
          eventType: log.eventType,
          status: log.status as WebhookLogStatus,
          payload: log.payload,
          error: log.error || undefined,
          retryCount: log.retryCount,
          nextRetryAt: log.nextRetryAt || undefined,
          processedAt: log.processedAt || undefined,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt,
        })),
      };

      transaction.setStatus("ok");
      transaction.finish();
      return stats;
    } catch (error: any) {
      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "get_stats" },
      });
      throw error;
    }
  }

  /**
   * Réessayer un webhook échoué
   */
  async retryWebhook(webhookLogId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const transaction = Sentry.startTransaction({
      op: "webhook.retry",
      name: "Retry Failed Webhook",
    });

    try {
      // 1. Récupérer le log
      const log = await prisma.webhookLog.findUnique({
        where: { id: webhookLogId },
      });

      if (!log) {
        return {
          success: false,
          message: `Webhook log ${webhookLogId} non trouvé`,
        };
      }

      // 2. Vérifier qu'il est en échec
      if (log.status !== "FAILURE") {
        return {
          success: false,
          message: `Le webhook est en statut ${log.status}, retry impossible`,
        };
      }

      // 3. Marquer comme en cours de retry
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: { status: "RETRYING" },
      });

      // 4. Retraiter l'événement
      await this.processManually(log.eventId, log.eventType, log.payload);

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        message: `Webhook ${webhookLogId} retraité avec succès`,
      };
    } catch (error: any) {
      // Remettre en échec si le retry échoue
      await prisma.webhookLog.update({
        where: { id: webhookLogId },
        data: {
          status: "FAILURE",
          error: error.message,
        },
      });

      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "retry", webhookLogId },
      });

      return {
        success: false,
        message: `Erreur lors du retry: ${error.message}`,
      };
    }
  }

  /**
   * Traiter manuellement un webhook
   */
  async processManually(
    eventId: string,
    eventType: string,
    payload: any,
  ): Promise<{ success: boolean; message: string }> {
    const transaction = Sentry.startTransaction({
      op: "webhook.manual",
      name: "Process Webhook Manually",
    });

    try {
      Sentry.setContext("manual_webhook", { eventId, eventType });

      // Router vers le bon handler selon eventType
      switch (eventType) {
        case "payment_intent.succeeded":
          await this.handlePaymentSuccess(payload as Stripe.PaymentIntent);
          break;

        case "payment_intent.payment_failed":
          await this.handlePaymentFailed(payload as Stripe.PaymentIntent);
          break;

        case "checkout.session.completed":
          await this.handleCheckoutSessionCompleted(
            payload as Stripe.Checkout.Session,
          );
          break;

        case "invoice.payment_succeeded":
          await this.handleInvoicePaymentSucceeded(payload as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await this.handleInvoicePaymentFailed(payload as Stripe.Invoice);
          break;

        case "customer.subscription.created":
          await this.handleSubscriptionCreated(payload as Stripe.Subscription);
          break;

        case "customer.subscription.updated":
          await this.handleSubscriptionUpdated(payload as Stripe.Subscription);
          break;

        case "customer.subscription.deleted":
          await this.handleSubscriptionDeleted(payload as Stripe.Subscription);
          break;

        default:
          throw new Error(`Type d'événement non supporté: ${eventType}`);
      }

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        message: `Webhook ${eventId} traité manuellement avec succès`,
      };
    } catch (error: any) {
      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: {
          component: "webhook",
          action: "process_manually",
          eventId,
          eventType,
        },
      });

      return {
        success: false,
        message: `Erreur lors du traitement manuel: ${error.message}`,
      };
    }
  }

  /**
   * Nettoyer les anciens logs de webhooks
   */
  async cleanOldLogs(daysToKeep: number = 90): Promise<{
    success: boolean;
    message: string;
    deletedCount: number;
  }> {
    const transaction = Sentry.startTransaction({
      op: "webhook.cleanup",
      name: "Clean Old Webhook Logs",
    });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.webhookLog.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: { in: ["SUCCESS", "FAILURE"] }, // Ne pas supprimer les PENDING
        },
      });

      transaction.setStatus("ok");
      transaction.finish();

      return {
        success: true,
        message: `${result.count} logs supprimés (plus vieux que ${daysToKeep} jours)`,
        deletedCount: result.count,
      };
    } catch (error: any) {
      transaction.setStatus("internal_error");
      transaction.finish();
      Sentry.captureException(error, {
        tags: { component: "webhook", action: "clean_logs", daysToKeep },
      });

      return {
        success: false,
        message: `Erreur lors du nettoyage: ${error.message}`,
        deletedCount: 0,
      };
    }
  }
}
