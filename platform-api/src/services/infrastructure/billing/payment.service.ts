import { PrismaClient } from '@prisma/client';
import { stripe } from './stripe.client.js';
import { customerService } from './customer.service.js';
import type { UpdatePaymentMethodParams } from './types.js';

/**
 * Service de gestion des moyens de paiement
 * Responsabilités:
 * - Ajouter/Mettre à jour les moyens de paiement
 * - Récupérer les moyens de paiement
 * - Supprimer les moyens de paiement
 */
export class PaymentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Mettre à jour le moyen de paiement par défaut
   */
  async updatePaymentMethod(params: UpdatePaymentMethodParams): Promise<void> {
    const { tenantId, paymentMethodId } = params;

    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      throw new Error('Customer not found for tenant');
    }

    // Attacher le nouveau moyen de paiement
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Définir comme moyen de paiement par défaut
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
  }

  /**
   * Récupérer le moyen de paiement par défaut
   */
  async getDefaultPaymentMethod(tenantId: string) {
    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      return null;
    }

    const customer = await stripe.customers.retrieve(customerId);

    if (customer.deleted) {
      return null;
    }

    const defaultPaymentMethodId =
      typeof customer.invoice_settings?.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings?.default_payment_method?.id;

    if (!defaultPaymentMethodId) {
      return null;
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(
      defaultPaymentMethodId
    );

    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      } : undefined,
    };
  }

  /**
   * Récupérer tous les moyens de paiement
   */
  async listPaymentMethods(tenantId: string) {
    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      return [];
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data.map(pm => ({
      id: pm.id,
      type: pm.type,
      card: pm.card ? {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      } : undefined,
      isDefault: false, // To be checked against customer default
    }));
  }

  /**
   * Supprimer un moyen de paiement
   */
  async deletePaymentMethod(
    tenantId: string,
    paymentMethodId: string
  ): Promise<void> {
    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      throw new Error('Customer not found');
    }

    // Détacher le moyen de paiement
    await stripe.paymentMethods.detach(paymentMethodId);
  }

  /**
   * Créer un Setup Intent pour ajouter une carte
   */
  async createSetupIntent(tenantId: string): Promise<string> {
    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      throw new Error('Customer not found');
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    return setupIntent.client_secret!;
  }
}

export const paymentService = new PaymentService();
