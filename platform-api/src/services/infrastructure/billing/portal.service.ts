import { PrismaClient } from '@prisma/client';
import { stripe } from './stripe.client.js';
import { customerService } from './customer.service.js';
import type { CreatePortalSessionParams } from './types.js';

/**
 * Service de gestion du portail client Stripe
 * Responsabilités:
 * - Créer des sessions de portail client
 * - Permettre aux tenants de gérer leurs abonnements
 * - Gérer les factures et moyens de paiement
 */
export class PortalService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Créer une session de portail client
   * Permet au tenant de gérer son abonnement, factures et moyens de paiement
   */
  async createPortalSession(params: CreatePortalSessionParams): Promise<string> {
    const { tenantId, returnUrl } = params;

    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      throw new Error('No customer found for this tenant');
    }

    // Créer la session du portail
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    // Logger l'accès au portail
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        action: 'PORTAL_ACCESS',
        resource: 'billing_portal',
        resourceId: session.id,
        ipAddress: '0.0.0.0', // Should be passed from request
        userAgent: 'Portal Service',
      },
    });

    return session.url;
  }

  /**
   * Créer une session de checkout pour un nouvel abonnement
   */
  async createCheckoutSession(
    tenantId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const customerId = tenant.stripeCustomerId ||
      await customerService.getOrCreateCustomer(tenantId, `admin@${tenant.slug}.com`);

    const priceId = this.getPriceIdForPlan(planId);

    if (!priceId) {
      throw new Error(`No Stripe price configured for plan: ${planId}`);
    }

    // Créer la session de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        tenantId,
        planId,
      },
      subscription_data: {
        metadata: {
          tenantId,
          planId,
        },
      },
    });

    return session.url!;
  }

  /**
   * Obtenir la configuration du portail
   */
  async getPortalConfiguration(): Promise<any> {
    const configurations = await stripe.billingPortal.configurations.list({
      limit: 1,
    });

    if (configurations.data.length === 0) {
      return this.createDefaultPortalConfiguration();
    }

    return configurations.data[0];
  }

  /**
   * Créer une configuration par défaut du portail
   */
  private async createDefaultPortalConfiguration(): Promise<any> {
    return stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your ClubManager subscription',
      },
      features: {
        customer_update: {
          allowed_updates: ['email', 'address'],
          enabled: true,
        },
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'customer_service',
              'too_complex',
              'low_quality',
              'other',
            ],
          },
        },
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity'],
          proration_behavior: 'always_invoice',
        },
      },
    });
  }

  /**
   * Obtenir le Price ID Stripe pour un plan
   */
  private getPriceIdForPlan(planId: string): string | null {
    const priceMapping: Record<string, string | undefined> = {
      FREE: undefined,
      STARTER: process.env.STRIPE_PRICE_STARTER,
      PRO: process.env.STRIPE_PRICE_PRO,
      ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
    };

    return priceMapping[planId] || null;
  }
}

export const portalService = new PortalService();
