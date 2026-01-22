import { prisma } from '../../../db/prisma.client.js';
import { stripe } from './stripe.client.js';
import { customerService } from './customer.service.js';
import type { GetInvoicesParams, InvoiceInfo } from './types.js';

/**
 * Service de gestion des factures Stripe
 * Responsabilités:
 * - Récupérer les factures
 * - Télécharger les PDFs
 * - Gérer les paiements de factures
 */
export class InvoiceService {


  /**
   * Récupérer les factures d'un tenant
   */
  async getInvoices(params: GetInvoicesParams): Promise<{
    data: InvoiceInfo[];
    hasMore: boolean;
  }> {
    const { tenantId, limit = 10, startingAfter } = params;

    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      return { data: [], hasMore: false };
    }

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
      starting_after: startingAfter,
    });

    return {
      data: invoices.data.map(inv => this.formatInvoice(inv)),
      hasMore: invoices.has_more,
    };
  }

  /**
   * Récupérer une facture spécifique
   */
  async getInvoice(
    tenantId: string,
    invoiceId: string
  ): Promise<InvoiceInfo | null> {
    const invoice = await stripe.invoices.retrieve(invoiceId);

    // Vérifier que la facture appartient bien au tenant
    const customerId = await customerService.getCustomerId(tenantId);

    if (invoice.customer !== customerId) {
      throw new Error('Invoice does not belong to this tenant');
    }

    return this.formatInvoice(invoice);
  }

  /**
   * Récupérer l'URL de téléchargement du PDF
   */
  async getInvoicePdf(
    tenantId: string,
    invoiceId: string
  ): Promise<string | null> {
    const invoice = await this.getInvoice(tenantId, invoiceId);
    return invoice?.invoicePdf || null;
  }

  /**
   * Payer une facture impayée
   */
  async payInvoice(tenantId: string, invoiceId: string): Promise<void> {
    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      throw new Error('Customer not found');
    }

    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (invoice.customer !== customerId) {
      throw new Error('Invoice does not belong to this tenant');
    }

    if (invoice.status === 'paid') {
      return; // Already paid
    }

    // Tenter de payer la facture
    await stripe.invoices.pay(invoiceId);
  }

  /**
   * Récupérer la prochaine facture (pour les upgrades)
   */
  async getUpcomingInvoice(tenantId: string): Promise<InvoiceInfo | null> {
    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      return null;
    }

    try {
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: customerId,
      });

      return this.formatInvoice(invoice);
    } catch (error: any) {
      if (error.code === 'invoice_upcoming_none') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Envoyer une facture par email
   */
  async sendInvoice(tenantId: string, invoiceId: string): Promise<void> {
    const customerId = await customerService.getCustomerId(tenantId);

    if (!customerId) {
      throw new Error('Customer not found');
    }

    const invoice = await stripe.invoices.retrieve(invoiceId);

    if (invoice.customer !== customerId) {
      throw new Error('Invoice does not belong to this tenant');
    }

    await stripe.invoices.sendInvoice(invoiceId);
  }

  /**
   * Formater une facture Stripe
   */
  private formatInvoice(invoice: any): InvoiceInfo {
    return {
      id: invoice.id,
      number: invoice.number || 'N/A',
      amount: invoice.total / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      paidAt: invoice.status_transitions?.paid_at
        ? new Date(invoice.status_transitions.paid_at * 1000)
        : undefined,
      dueDate: invoice.due_date
        ? new Date(invoice.due_date * 1000)
        : undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url || undefined,
      invoicePdf: invoice.invoice_pdf || undefined,
    };
  }

  /**
   * Récupérer le total des revenus pour un tenant
   */
  async getTotalRevenue(tenantId: string): Promise<number> {
    const invoices = await this.getInvoices({
      tenantId,
      limit: 100, // Get all paid invoices
    });

    return invoices.data
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }
}

export const invoiceService = new InvoiceService();
