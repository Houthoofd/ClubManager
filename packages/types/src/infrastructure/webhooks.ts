/**
 * Types pour les webhooks Stripe
 * Gestion des événements webhook de paiement
 */

import type { Request } from "express";
import type Stripe from "stripe";
import { z } from "zod";

/**
 * Interface pour les requêtes webhook avec body brut
 */
export interface WebhookRequest extends Request {
  body: Buffer;
}

/**
 * Types d'événements Stripe supportés
 */
export enum StripeEventType {
  PAYMENT_INTENT_SUCCEEDED = "payment_intent.succeeded",
  PAYMENT_INTENT_FAILED = "payment_intent.payment_failed",
  CHECKOUT_SESSION_COMPLETED = "checkout.session.completed",
  INVOICE_PAYMENT_SUCCEEDED = "invoice.payment_succeeded",
  INVOICE_PAYMENT_FAILED = "invoice.payment_failed",
  SUBSCRIPTION_CREATED = "customer.subscription.created",
  SUBSCRIPTION_UPDATED = "customer.subscription.updated",
  SUBSCRIPTION_DELETED = "customer.subscription.deleted",
}

/**
 * Métadonnées de paiement dans Stripe
 */
export interface PaymentMetadata {
  echeance_id?: string;
  utilisateur_id?: string;
  abonnement_id?: string;
  commande_id?: string;
}

/**
 * Schéma de validation des métadonnées
 */
export const PaymentMetadataSchema = z.object({
  echeance_id: z.string().optional(),
  utilisateur_id: z.string().optional(),
  abonnement_id: z.string().optional(),
  commande_id: z.string().optional(),
});

/**
 * Résultat du traitement d'un webhook
 */
export interface WebhookProcessingResult {
  success: boolean;
  eventType: string;
  eventId: string;
  processedAt: Date;
  error?: string;
  details?: any;
}

/**
 * Données de paiement réussi
 */
export interface PaymentSuccessData {
  paymentIntentId: string;
  echeanceId?: number;
  utilisateurId?: number;
  commandeId?: number;
  montantPaye: number;
  currency: string;
  description?: string;
  metadata?: PaymentMetadata;
}

/**
 * Schéma de validation pour paiement réussi
 */
export const PaymentSuccessDataSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
  echeanceId: z.number().int().positive().optional(),
  utilisateurId: z.number().int().positive().optional(),
  commandeId: z.number().int().positive().optional(),
  montantPaye: z.number().positive("Montant doit être positif"),
  currency: z.string().length(3, "Code devise doit être de 3 caractères"),
  description: z.string().optional(),
  metadata: PaymentMetadataSchema.optional(),
});

/**
 * Données de paiement échoué
 */
export interface PaymentFailedData {
  paymentIntentId: string;
  echeanceId?: number;
  utilisateurId?: number;
  commandeId?: number;
  montant: number;
  currency: string;
  errorMessage: string;
  errorCode?: string;
  errorType?: string;
  metadata?: PaymentMetadata;
}

/**
 * Schéma de validation pour paiement échoué
 */
export const PaymentFailedDataSchema = z.object({
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
  echeanceId: z.number().int().positive().optional(),
  utilisateurId: z.number().int().positive().optional(),
  commandeId: z.number().int().positive().optional(),
  montant: z.number().positive("Montant doit être positif"),
  currency: z.string().length(3, "Code devise doit être de 3 caractères"),
  errorMessage: z.string().min(1, "Message d'erreur requis"),
  errorCode: z.string().optional(),
  errorType: z.string().optional(),
  metadata: PaymentMetadataSchema.optional(),
});

/**
 * Données de session checkout
 */
export interface CheckoutSessionData {
  sessionId: string;
  paymentIntentId?: string;
  echeanceId?: number;
  userId?: number;
  amountTotal?: number;
  amountSubtotal?: number;
  currency?: string;
  paymentStatus?: string;
  customerEmail?: string;
  metadata?: PaymentMetadata;
}

/**
 * Schéma de validation pour session checkout
 */
export const CheckoutSessionDataSchema = z.object({
  sessionId: z.string().min(1, "Session ID requis"),
  paymentIntentId: z.string().optional(),
  echeanceId: z.number().int().positive().optional(),
  userId: z.number().int().positive().optional(),
  amountTotal: z.number().nonnegative().optional(),
  amountSubtotal: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  paymentStatus: z.string().optional(),
  customerEmail: z.string().email().optional(),
  metadata: PaymentMetadataSchema.optional(),
});

/**
 * Données de facture (invoice)
 */
export interface InvoiceData {
  invoiceId: string;
  subscriptionId?: string;
  customerId: string;
  stripeCustomerId?: string;
  amountPaid?: number;
  amountDue?: number;
  amountRemaining?: number;
  currency?: string;
  status?: string;
  periodStart?: Date;
  periodEnd?: Date;
  attemptCount?: number;
  nextPaymentAttempt?: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

/**
 * Schéma de validation pour facture
 */
export const InvoiceDataSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID requis"),
  subscriptionId: z.string().optional(),
  customerId: z.string().min(1, "Customer ID requis"),
  stripeCustomerId: z.string().optional(),
  amountPaid: z.number().nonnegative().optional(),
  amountDue: z.number().nonnegative().optional(),
  amountRemaining: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  status: z.string().optional(),
  periodStart: z.date().optional(),
  periodEnd: z.date().optional(),
  attemptCount: z.number().int().nonnegative().optional(),
  nextPaymentAttempt: z.date().optional(),
  hostedInvoiceUrl: z.string().url().optional(),
  invoicePdf: z.string().url().optional(),
});

/**
 * Données d'abonnement
 */
export interface SubscriptionData {
  subscriptionId: string;
  customerId: string;
  userId?: string;
  status: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAt?: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd?: boolean;
  trialStart?: Date;
  trialEnd?: Date;
  metadata?: PaymentMetadata;
}

/**
 * Statut d'abonnement Stripe
 */
export enum SubscriptionStatus {
  ACTIVE = "active",
  PAST_DUE = "past_due",
  UNPAID = "unpaid",
  CANCELED = "canceled",
  INCOMPLETE = "incomplete",
  INCOMPLETE_EXPIRED = "incomplete_expired",
  TRIALING = "trialing",
  PAUSED = "paused",
}

/**
 * Schéma de validation pour abonnement
 */
export const SubscriptionDataSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID requis"),
  customerId: z.string().min(1, "Customer ID requis"),
  userId: z.string().optional(),
  status: z.nativeEnum(SubscriptionStatus),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
  cancelAt: z.date().optional(),
  canceledAt: z.date().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  trialStart: z.date().optional(),
  trialEnd: z.date().optional(),
  metadata: PaymentMetadataSchema.optional(),
});

/**
 * Options pour l'envoi d'email de confirmation de paiement
 */
export interface EmailConfirmationOptions {
  to: string;
  userName: string;
  firstName: string;
  lastName: string;
  amount: string;
  currency: string;
  paymentIntentId: string;
  echeanceId?: string;
  commandeId?: string;
  datePaiement: string;
  premierPaiement?: boolean;
  clubName?: string;
  supportEmail?: string;
  frontendUrl?: string;
}

/**
 * Schéma de validation pour email de confirmation
 */
export const EmailConfirmationOptionsSchema = z.object({
  to: z.string().email("Email invalide"),
  userName: z.string().min(1, "Nom utilisateur requis"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  amount: z.string().min(1, "Montant requis"),
  currency: z.string().length(3, "Code devise invalide"),
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
  echeanceId: z.string().optional(),
  commandeId: z.string().optional(),
  datePaiement: z.string().min(1, "Date paiement requise"),
  premierPaiement: z.boolean().optional(),
  clubName: z.string().optional(),
  supportEmail: z.string().email().optional(),
  frontendUrl: z.string().url().optional(),
});

/**
 * Options pour l'envoi d'email d'échec de paiement
 */
export interface EmailFailureOptions {
  to: string;
  userName: string;
  firstName: string;
  lastName: string;
  amount: string;
  currency: string;
  errorMessage: string;
  errorCode?: string;
  paymentIntentId: string;
  echeanceId?: string;
  commandeId?: string;
  dateEchec: string;
  retryUrl?: string;
  clubName?: string;
  supportEmail?: string;
  frontendUrl?: string;
}

/**
 * Schéma de validation pour email d'échec
 */
export const EmailFailureOptionsSchema = z.object({
  to: z.string().email("Email invalide"),
  userName: z.string().min(1, "Nom utilisateur requis"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  amount: z.string().min(1, "Montant requis"),
  currency: z.string().length(3, "Code devise invalide"),
  errorMessage: z.string().min(1, "Message d'erreur requis"),
  errorCode: z.string().optional(),
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
  echeanceId: z.string().optional(),
  commandeId: z.string().optional(),
  dateEchec: z.string().min(1, "Date échec requise"),
  retryUrl: z.string().url().optional(),
  clubName: z.string().optional(),
  supportEmail: z.string().email().optional(),
  frontendUrl: z.string().url().optional(),
});

/**
 * Configuration du webhook
 */
export interface StripeWebhookConfig {
  endpointSecret: string;
  stripe: Stripe;
  enableLogging?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

/**
 * Schéma de validation pour configuration webhook
 */
export const StripeWebhookConfigSchema = z.object({
  endpointSecret: z.string().min(1, "Endpoint secret requis"),
  enableLogging: z.boolean().optional().default(true),
  retryOnFailure: z.boolean().optional().default(true),
  maxRetries: z.number().int().nonnegative().optional().default(3),
});

/**
 * Résultat de validation de signature
 */
export interface SignatureValidationResult {
  valid: boolean;
  event?: Stripe.Event;
  error?: string;
  errorCode?: string;
}

/**
 * Type des handlers de webhook
 */
export type WebhookHandler<T = any> = (
  data: T,
  event: Stripe.Event,
) => Promise<WebhookProcessingResult>;

/**
 * Mapping des événements vers leurs handlers
 */
export interface WebhookHandlers {
  [StripeEventType.PAYMENT_INTENT_SUCCEEDED]?: WebhookHandler<Stripe.PaymentIntent>;
  [StripeEventType.PAYMENT_INTENT_FAILED]?: WebhookHandler<Stripe.PaymentIntent>;
  [StripeEventType.CHECKOUT_SESSION_COMPLETED]?: WebhookHandler<Stripe.Checkout.Session>;
  [StripeEventType.INVOICE_PAYMENT_SUCCEEDED]?: WebhookHandler<Stripe.Invoice>;
  [StripeEventType.INVOICE_PAYMENT_FAILED]?: WebhookHandler<Stripe.Invoice>;
  [StripeEventType.SUBSCRIPTION_CREATED]?: WebhookHandler<Stripe.Subscription>;
  [StripeEventType.SUBSCRIPTION_UPDATED]?: WebhookHandler<Stripe.Subscription>;
  [StripeEventType.SUBSCRIPTION_DELETED]?: WebhookHandler<Stripe.Subscription>;
}

/**
 * Options pour le traitement des webhooks
 */
export interface WebhookProcessingOptions {
  validateSignature?: boolean;
  logEvents?: boolean;
  sendEmails?: boolean;
  updateDatabase?: boolean;
  notifyAdmin?: boolean;
}

/**
 * Schéma de validation pour options de traitement
 */
export const WebhookProcessingOptionsSchema = z.object({
  validateSignature: z.boolean().optional().default(true),
  logEvents: z.boolean().optional().default(true),
  sendEmails: z.boolean().optional().default(true),
  updateDatabase: z.boolean().optional().default(true),
  notifyAdmin: z.boolean().optional().default(false),
});

/**
 * Erreur de webhook personnalisée
 */
export class WebhookError extends Error {
  code: string;
  eventType?: string;
  eventId?: string;

  constructor(
    message: string,
    code: string,
    eventType?: string,
    eventId?: string,
  ) {
    super(message);
    this.name = "WebhookError";
    this.code = code;
    this.eventType = eventType;
    this.eventId = eventId;
    Object.setPrototypeOf(this, WebhookError.prototype);
  }
}

/**
 * Log d'événement webhook
 */
export interface WebhookEventLog {
  id?: number;
  eventId: string;
  eventType: string;
  processedAt: Date;
  success: boolean;
  error?: string;
  metadata?: any;
  retryCount?: number;
  nextRetryAt?: Date;
}

/**
 * Schéma de validation pour log webhook
 */
export const WebhookEventLogSchema = z.object({
  id: z.number().int().positive().optional(),
  eventId: z.string().min(1, "Event ID requis"),
  eventType: z.string().min(1, "Event type requis"),
  processedAt: z.date(),
  success: z.boolean(),
  error: z.string().optional(),
  metadata: z.any().optional(),
  retryCount: z.number().int().nonnegative().optional().default(0),
  nextRetryAt: z.date().optional(),
});

/**
 * Statut d'un log webhook
 */
export enum WebhookLogStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILURE = "failure",
  RETRYING = "retrying",
}

/**
 * Log détaillé d'un webhook (pour GraphQL)
 */
export interface WebhookLog {
  id: string;
  eventId: string;
  eventType: string;
  status: WebhookLogStatus;
  payload: any;
  error?: string;
  retryCount: number;
  nextRetryAt?: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Statistiques des webhooks
 */
export interface WebhookStats {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  averageProcessingTime: number;
  byEventType: EventTypeStats[];
  recentFailures: WebhookLog[];
}

/**
 * Statistiques par type d'événement
 */
export interface EventTypeStats {
  eventType: string;
  count: number;
  successRate: number;
  averageProcessingTime: number;
}

/**
 * Schéma de validation pour WebhookLog
 */
export const WebhookLogSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  eventType: z.string(),
  status: z.nativeEnum(WebhookLogStatus),
  payload: z.any(),
  error: z.string().optional(),
  retryCount: z.number().int().nonnegative(),
  nextRetryAt: z.date().optional(),
  processedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schéma de validation pour récupérer les logs de webhooks
 */
export const getWebhookLogsSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .max(100, "La limite maximale est de 100")
    .optional()
    .default(20),
  offset: z.number().int().min(0).optional().default(0),
  eventType: z.string().optional(),
});

/**
 * Schéma de validation pour récupérer les statistiques des webhooks
 */
export const getWebhookStatsSchema = z.object({
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
});

/**
 * Schéma de validation pour réessayer un webhook échoué
 */
export const retryWebhookSchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
});

/**
 * Schéma de validation pour traiter manuellement un webhook
 */
export const processWebhookManuallySchema = z.object({
  eventId: z.string().min(1, "L'ID de l'événement est requis"),
  forceProcess: z.boolean().optional().default(false),
});

/**
 * Types TypeScript dérivés des schemas de validation
 */
export type GetWebhookLogsInput = z.infer<typeof getWebhookLogsSchema>;
export type GetWebhookStatsInput = z.infer<typeof getWebhookStatsSchema>;
export type RetryWebhookInput = z.infer<typeof retryWebhookSchema>;
export type ProcessWebhookManuallyInput = z.infer<
  typeof processWebhookManuallySchema
>;

/**
 * TypeDefs GraphQL pour les webhooks Stripe
 */
export const webhooksTypeDefs = `#graphql
  """
  Types d'événements webhook Stripe
  """
  enum StripeEventType {
    PAYMENT_INTENT_SUCCEEDED
    PAYMENT_INTENT_FAILED
    CHECKOUT_SESSION_COMPLETED
    INVOICE_PAYMENT_SUCCEEDED
    INVOICE_PAYMENT_FAILED
    SUBSCRIPTION_CREATED
    SUBSCRIPTION_UPDATED
    SUBSCRIPTION_DELETED
  }

  """
  Statut d'abonnement Stripe
  """
  enum SubscriptionStatus {
    ACTIVE
    PAST_DUE
    UNPAID
    CANCELED
    INCOMPLETE
    INCOMPLETE_EXPIRED
    TRIALING
    PAUSED
  }

  """
  Log d'événement webhook
  """
  type WebhookLog {
    id: ID!
    eventId: String!
    eventType: String!
    status: String!
    payload: String
    error: String
    retryCount: Int!
    nextRetryAt: String
    processedAt: String
    createdAt: String!
    updatedAt: String!
  }

  """
  Statistiques des webhooks
  """
  type WebhookStats {
    totalProcessed: Int!
    successCount: Int!
    failureCount: Int!
    pendingCount: Int!
    averageProcessingTime: Float!
  }

  """
  Queries
  """
  type Query {
    """
    Récupère les logs de webhooks
    """
    getWebhookLogs(limit: Int, offset: Int, eventType: String): [WebhookLog!]!

    """
    Récupère les statistiques des webhooks
    """
    getWebhookStats: WebhookStats!
  }

  """
  Mutations
  """
  type Mutation {
    """
    Réessayer un événement webhook échoué
    """
    retryWebhookEvent(eventId: String!): WebhookLog
  }
`;
