import { prisma } from '../../../db/prisma.client.js';
import { stripe, getWebhookSecret } from './stripe.client.js';
import Stripe from 'stripe';

/**
 * Service de traitement des webhooks Stripe
 * Responsabilités:
 * - Vérifier les signatures des webhooks
 * - Traiter les événements Stripe
 * - Mettre à jour la base de données
 * - Gérer le Dunning (échecs de paiement)
 */
export class WebhookService {


  /**
   * Traiter un webhook Stripe
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = getWebhookSecret();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    console.log(`[Webhook] Received event: ${event.type}`);

    // Router vers le bon handler
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;

        default:
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }
    } catch (error: any) {
      console.error(`[Webhook] Error processing ${event.type}:`, error);
      throw error;
    }
  }

  /**
   * Handler: Abonnement créé
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      console.error('[Webhook] No tenantId in subscription metadata');
      return;
    }

    console.log(`[Webhook] Subscription created for tenant ${tenantId}`);

    // L'abonnement devrait déjà être créé par l'API
    // On met juste à jour le statut si nécessaire
    await this.updateTenantSubscriptionStatus(tenantId, subscription.id, subscription.status);
  }

  /**
   * Handler: Abonnement mis à jour
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      console.error('[Webhook] No tenantId in subscription metadata');
      return;
    }

    console.log(`[Webhook] Subscription updated for tenant ${tenantId}: ${subscription.status}`);

    // Mettre à jour le statut dans la BD
    await prisma.tenantSubscription.updateMany({
      where: {
        tenantId,
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: this.mapStripeStatus(subscription.status),
        endDate: new Date(subscription.current_period_end * 1000),
      },
    });

    // Mettre à jour le statut du tenant
    const tenantStatus = this.determineTenantStatus(subscription.status);
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: tenantStatus },
    });
  }

  /**
   * Handler: Abonnement supprimé
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      console.error('[Webhook] No tenantId in subscription metadata');
      return;
    }

    console.log(`[Webhook] Subscription deleted for tenant ${tenantId}`);

    await prisma.tenantSubscription.updateMany({
      where: {
        tenantId,
        stripeSubscriptionId: subscription.id,
      },
      data: {
        status: 'CANCELLED',
      },
    });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'INACTIVE' },
    });

    // TODO: Envoyer email de confirmation
  }

  /**
   * Handler: Paiement réussi
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!tenant) {
      console.error('[Webhook] No tenant found for customer:', customerId);
      return;
    }

    console.log(`[Webhook] Payment succeeded for tenant ${tenant.id}: ${invoice.amount_paid / 100} ${invoice.currency}`);

    // Réactiver le tenant si suspendu
    if (tenant.status === 'SUSPENDED') {
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'ACTIVE' },
      });

      console.log(`[Webhook] Tenant ${tenant.id} reactivated after successful payment`);
    }

    // TODO: Envoyer email de confirmation de paiement
  }

  /**
   * Handler: Échec de paiement (Dunning)
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    const tenant = await prisma.tenant.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!tenant) {
      console.error('[Webhook] No tenant found for customer:', customerId);
      return;
    }

    const attemptCount = invoice.attempt_count || 0;

    console.log(`[Webhook] Payment failed for tenant ${tenant.id}: Attempt ${attemptCount}`);

    // Stratégie de Dunning
    if (attemptCount >= 3) {
      // Après 3 échecs, suspendre le compte
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { status: 'SUSPENDED' },
      });

      console.log(`[Webhook] Tenant ${tenant.id} SUSPENDED after ${attemptCount} failed payment attempts`);

      // TODO: Envoyer email d'alerte critique
      // await emailService.sendPaymentFailedCriticalEmail(tenant);
    } else if (attemptCount === 1) {
      // Premier échec: rappel doux
      console.log(`[Webhook] First payment failure for tenant ${tenant.id}`);

      // TODO: Envoyer email de rappel
      // await emailService.sendPaymentFailedReminderEmail(tenant);
    } else if (attemptCount === 2) {
      // Deuxième échec: rappel urgent
      console.log(`[Webhook] Second payment failure for tenant ${tenant.id}`);

      // TODO: Envoyer email urgent
      // await emailService.sendPaymentFailedUrgentEmail(tenant);
    }

    // Log l'échec dans les audit logs
    await prisma.auditLog.create({
      data: {
        tenantId: tenant.id,
        action: 'PAYMENT_FAILED',
        resource: 'invoice',
        resourceId: invoice.id,
        changes: {
          attemptCount,
          amount: invoice.amount_due / 100,
          currency: invoice.currency,
        },
        ipAddress: '0.0.0.0',
        userAgent: 'Stripe Webhook',
      },
    });
  }

  /**
   * Handler: Fin de période d'essai imminente
   */
  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    const tenantId = subscription.metadata?.tenantId;

    if (!tenantId) {
      console.error('[Webhook] No tenantId in subscription metadata');
      return;
    }

    const daysUntilEnd = subscription.trial_end
      ? Math.ceil((subscription.trial_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    console.log(`[Webhook] Trial will end in ${daysUntilEnd} days for tenant ${tenantId}`);

    // TODO: Envoyer email de rappel
    // const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    // await emailService.sendTrialEndingEmail(tenant, daysUntilEnd);
  }

  /**
   * Handler: Moyen de paiement attaché
   */
  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    console.log(`[Webhook] Payment method attached: ${paymentMethod.id}`);
    // Aucune action nécessaire pour l'instant
  }

  /**
   * Mettre à jour le statut d'abonnement
   */
  private async updateTenantSubscriptionStatus(
    tenantId: string,
    subscriptionId: string,
    status: string
  ): Promise<void> {
    await prisma.tenantSubscription.updateMany({
      where: {
        tenantId,
        stripeSubscriptionId: subscriptionId,
      },
      data: {
        status: this.mapStripeStatus(status),
      },
    });
  }

  /**
   * Mapper les statuts Stripe vers nos statuts
   */
  private mapStripeStatus(stripeStatus: string): 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL' | 'PENDING' {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'trialing':
        return 'TRIAL';
      case 'canceled':
      case 'cancelled':
        return 'CANCELLED';
      case 'past_due':
      case 'unpaid':
        return 'EXPIRED';
      case 'incomplete':
      case 'incomplete_expired':
        return 'PENDING';
      default:
        return 'PENDING';
    }
  }

  /**
   * Déterminer le statut du tenant basé sur le statut Stripe
   */
  private determineTenantStatus(stripeStatus: string): 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'TRIAL' {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'trialing':
        return 'TRIAL';
      case 'past_due':
        return 'SUSPENDED';
      case 'canceled':
      case 'unpaid':
      case 'incomplete_expired':
        return 'INACTIVE';
      default:
        return 'ACTIVE';
    }
  }
}

export const webhookService = new WebhookService();
