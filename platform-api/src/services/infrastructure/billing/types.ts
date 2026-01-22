/**
 * Types pour les services de facturation Stripe
 */

export interface CreateSubscriptionParams {
  tenantId: string;
  planId: string;
  paymentMethodId: string;
  trialDays?: number;
  email?: string;
}

export interface ChangePlanParams {
  tenantId: string;
  newPlanId: string;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}

export interface CancelSubscriptionParams {
  tenantId: string;
  immediate?: boolean;
  reason?: string;
}

export interface UpdatePaymentMethodParams {
  tenantId: string;
  paymentMethodId: string;
}

export interface GetInvoicesParams {
  tenantId: string;
  limit?: number;
  startingAfter?: string;
}

export interface CreatePortalSessionParams {
  tenantId: string;
  returnUrl: string;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  planId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
}

export interface InvoiceInfo {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: Date;
  dueDate?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

export interface CustomerInfo {
  id: string;
  email: string;
  name?: string;
  defaultPaymentMethod?: string;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  PAUSED = 'paused',
}

export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum PaymentFailureReason {
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  CARD_DECLINED = 'card_declined',
  EXPIRED_CARD = 'expired_card',
  PROCESSING_ERROR = 'processing_error',
  AUTHENTICATION_REQUIRED = 'authentication_required',
}
