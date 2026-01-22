/**
 * Billing Services Index
 * Centralized exports for all billing-related services
 */

// Core services
export * from './customer.service.js';
export * from './subscription.service.js';
export * from './payment.service.js';
export * from './invoice.service.js';
export * from './webhook.service.js';
export * from './portal.service.js';

// Client and types
export * from './stripe.client.js';
export * from './types.js';

// Convenience imports
import { customerService } from './customer.service.js';
import { subscriptionService } from './subscription.service.js';
import { paymentService } from './payment.service.js';
import { invoiceService } from './invoice.service.js';
import { webhookService } from './webhook.service.js';
import { portalService } from './portal.service.js';

/**
 * Unified billing service facade
 * Provides easy access to all billing operations
 */
export const billingService = {
  // Customer operations
  customer: customerService,

  // Subscription operations
  subscription: subscriptionService,

  // Payment operations
  payment: paymentService,

  // Invoice operations
  invoice: invoiceService,

  // Webhook handling
  webhook: webhookService,

  // Portal management
  portal: portalService,
};

/**
 * Usage examples:
 *
 * // Create a subscription
 * await billingService.subscription.createSubscription({
 *   tenantId: 'tenant_123',
 *   planId: 'PRO',
 *   paymentMethodId: 'pm_123',
 *   trialDays: 14,
 * });
 *
 * // Get invoices
 * const invoices = await billingService.invoice.getInvoices({
 *   tenantId: 'tenant_123',
 *   limit: 10,
 * });
 *
 * // Handle webhook
 * await billingService.webhook.handleWebhook(rawBody, signature);
 *
 * // Create portal session
 * const portalUrl = await billingService.portal.createPortalSession({
 *   tenantId: 'tenant_123',
 *   returnUrl: 'https://app.clubmanager.com/settings',
 * });
 */
