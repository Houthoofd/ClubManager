import { PrismaClient } from '@prisma/client';
import { stripe, getPriceId } from './stripe.client.js';
import { customerService } from './customer.service.js';
import type {
  CreateSubscriptionParams,
  ChangePlanParams,
  CancelSubscriptionParams,
  SubscriptionInfo
} from './types.js';

/**
 * Service de gestion des abonnements Stripe
 * Responsabilités:
 * - Créer des abonnements
 * - Modifier les plans
 * - Annuler/Réactiver les abonnements
 * - Synchroniser avec la base de données
 */
export class SubscriptionService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Créer un nouvel abonnement pour un tenant
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionInfo> {
    const { tenantId, planId, paymentMethodId, trialDays = 0, email } = params;

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Obtenir ou créer le customer Stripe
    const customerEmail = email || `admin@${tenant.slug}.com`;
    const customerId = await customerService.getOrCreateCustomer(tenantId, customerEmail);

    // Attacher le moyen de paiement
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Définir comme moyen de paiement par défaut
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Récupérer le price ID Stripe
    const priceId = getPriceId(planId);

    if (!priceId) {
      throw new Error(`No Stripe price configured for plan: ${planId}`);
    }

    // Créer l'abonnement Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays > 0 ? trialDays : undefined,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription'
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenantId,
        planId,
      },
    });

    // Créer l'enregistrement dans la BD
    const plan = await this.prisma.planTarifaire.findFirst({
      where: { nom: planId },
    });

    if (plan) {
      await this.prisma.tenantSubscription.create({
        data: {
          tenantId,
          planId: plan.id,
          stripeSubscriptionId: subscription.id,
          status: subscription.status as any,
          startDate: new Date(subscription.current_period_start * 1000),
          endDate: new Date(subscription.current_period_end * 1000),
          price: plan.prix,
          currency: 'EUR',
        },
      });
    }

    // Mettre à jour le tenant
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: planId,
        status: trialDays > 0 ? 'TRIAL' : 'ACTIVE',
      },
    });

    return this.formatSubscriptionInfo(subscription);
  }

  /**
   * Changer le plan d'un abonnement existant
   */
  async changePlan(params: ChangePlanParams): Promise<SubscriptionInfo> {
    const { tenantId, newPlanId, prorationBehavior = 'always_invoice' } = params;

    const subscription = await this.getActiveSubscription(tenantId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const newPriceId = getPriceId(newPlanId);

    if (!newPriceId) {
      throw new Error(`No Stripe price configured for plan: ${newPlanId}`);
    }

    // Récupérer l'abonnement Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId!
    );

    // Mettre à jour l'abonnement
    const updatedSubscription = await stripe.subscriptions.update(
      stripeSubscription.id,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: prorationBehavior,
        metadata: {
          ...stripeSubscription.metadata,
          planId: newPlanId,
        },
      }
    );

    // Mettre à jour dans la BD
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: newPlanId },
    });

    return this.formatSubscriptionInfo(updatedSubscription);
  }

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    const { tenantId, immediate = false, reason } = params;

    const subscription = await this.getActiveSubscription(tenantId);

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const subscriptionId = subscription.stripeSubscriptionId!;

    if (immediate) {
      // Annulation immédiate
      await stripe.subscriptions.cancel(subscriptionId, {
        cancellation_details: {
          comment: reason,
        },
      });

      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'INACTIVE' },
      });

      await this.prisma.tenantSubscription.updateMany({
        where: {
          tenantId,
          stripeSubscriptionId: subscriptionId,
        },
        data: {
          status: 'CANCELLED',
        },
      });
    } else {
      // Annulation à la fin de la période
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: {
          comment: reason,
        },
      });
    }
  }

  /**
   * Réactiver un abonnement annulé
   */
  async reactivateSubscription(tenantId: string): Promise<SubscriptionInfo> {
    const subscription = await this.getLatestSubscription(tenantId);

    if (!subscription) {
      throw new Error('No subscription found');
    }

    const subscriptionId = subscription.stripeSubscriptionId!;

    // Annuler la demande d'annulation
    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: false,
      }
    );

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'ACTIVE' },
    });

    await this.prisma.tenantSubscription.updateMany({
      where: {
        tenantId,
        stripeSubscriptionId: subscriptionId,
      },
      data: {
        status: 'ACTIVE',
      },
    });

    return this.formatSubscriptionInfo(updatedSubscription);
  }

  /**
   * Récupérer l'abonnement actif d'un tenant
   */
  async getActiveSubscription(tenantId: string) {
    return this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Récupérer le dernier abonnement d'un tenant
   */
  async getLatestSubscription(tenantId: string) {
    return this.prisma.tenantSubscription.findFirst({
      where: { tenantId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Récupérer les informations d'abonnement depuis Stripe
   */
  async getSubscriptionInfo(tenantId: string): Promise<SubscriptionInfo | null> {
    const subscription = await this.getActiveSubscription(tenantId);

    if (!subscription || !subscription.stripeSubscriptionId) {
      return null;
    }

    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    return this.formatSubscriptionInfo(stripeSubscription);
  }

  /**
   * Formater les informations d'abonnement
   */
  private formatSubscriptionInfo(subscription: any): SubscriptionInfo {
    return {
      id: subscription.id,
      status: subscription.status,
      planId: subscription.metadata?.planId || 'UNKNOWN',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : undefined,
    };
  }
}

export const subscriptionService = new SubscriptionService();
