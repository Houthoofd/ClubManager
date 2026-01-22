import { PrismaClient } from '@prisma/client';
import { stripe, getPriceId } from './stripe.client.js';
import type { CustomerInfo } from './types.js';

/**
 * Service de gestion des customers Stripe
 * Responsabilités:
 * - Créer et récupérer les customers Stripe
 * - Synchroniser les informations customer avec la BD
 * - Gérer les métadonnées customer
 */
export class CustomerService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Obtenir ou créer un customer Stripe pour un tenant
   */
  async getOrCreateCustomer(
    tenantId: string,
    email: string
  ): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }

    // Si le customer existe déjà
    if (tenant.stripeCustomerId) {
      return tenant.stripeCustomerId;
    }

    // Créer un nouveau customer Stripe
    const customer = await stripe.customers.create({
      email,
      name: tenant.name,
      metadata: {
        tenantId,
        tenantName: tenant.name,
        tenantSlug: tenant.slug,
      },
    });

    // Mettre à jour le tenant avec l'ID customer
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customer.id },
    });

    return customer.id;
  }

  /**
   * Récupérer les informations d'un customer
   */
  async getCustomerInfo(tenantId: string): Promise<CustomerInfo | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.stripeCustomerId) {
      return null;
    }

    const customer = await stripe.customers.retrieve(
      tenant.stripeCustomerId
    );

    if (customer.deleted) {
      return null;
    }

    return {
      id: customer.id,
      email: customer.email || '',
      name: customer.name || undefined,
      defaultPaymentMethod:
        typeof customer.invoice_settings?.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : undefined,
    };
  }

  /**
   * Mettre à jour les informations d'un customer
   */
  async updateCustomer(
    tenantId: string,
    data: { email?: string; name?: string }
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.stripeCustomerId) {
      throw new Error('Customer not found');
    }

    await stripe.customers.update(tenant.stripeCustomerId, {
      email: data.email,
      name: data.name,
    });
  }

  /**
   * Récupérer le customer ID pour un tenant
   */
  async getCustomerId(tenantId: string): Promise<string | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { stripeCustomerId: true },
    });

    return tenant?.stripeCustomerId || null;
  }

  /**
   * Supprimer un customer Stripe
   */
  async deleteCustomer(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.stripeCustomerId) {
      return;
    }

    await stripe.customers.del(tenant.stripeCustomerId);

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: null },
    });
  }
}

export const customerService = new CustomerService();
