/**
 * Validators pour les webhooks Stripe
 * Validation des données entrantes des webhooks
 */

import { z } from "zod";

/**
 * Validator pour la signature du webhook
 */
export const WebhookSignatureSchema = z.object({
  signature: z.string().min(1, "Signature webhook requise"),
  body: z.instanceof(Buffer, { message: "Body doit être un Buffer" }),
});

export type WebhookSignature = z.infer<typeof WebhookSignatureSchema>;

/**
 * Validator pour les métadonnées de paiement
 */
export const WebhookPaymentMetadataSchema = z.object({
  echeance_id: z.string().optional(),
  utilisateur_id: z.string().optional(),
  abonnement_id: z.string().optional(),
  commande_id: z.string().optional(),
});

export type WebhookPaymentMetadata = z.infer<
  typeof WebhookPaymentMetadataSchema
>;

/**
 * Validator pour PaymentIntent succeeded
 */
export const PaymentIntentSucceededSchema = z.object({
  id: z.string().startsWith("pi_", "Payment Intent ID invalide"),
  amount: z.number().int().positive("Montant doit être positif"),
  currency: z.string().length(3, "Code devise doit être de 3 caractères"),
  status: z.literal("succeeded"),
  metadata: WebhookPaymentMetadataSchema.optional(),
  description: z.string().optional(),
  receipt_email: z.string().email().optional(),
});

export type PaymentIntentSucceeded = z.infer<
  typeof PaymentIntentSucceededSchema
>;

/**
 * Validator pour PaymentIntent failed
 */
export const PaymentIntentFailedSchema = z.object({
  id: z.string().startsWith("pi_", "Payment Intent ID invalide"),
  amount: z.number().int().positive("Montant doit être positif"),
  currency: z.string().length(3, "Code devise doit être de 3 caractères"),
  status: z.enum(["requires_payment_method", "canceled"]),
  metadata: WebhookPaymentMetadataSchema.optional(),
  last_payment_error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
});

export type PaymentIntentFailed = z.infer<typeof PaymentIntentFailedSchema>;

/**
 * Validator pour Checkout Session completed
 */
export const CheckoutSessionCompletedSchema = z.object({
  id: z.string().startsWith("cs_", "Checkout Session ID invalide"),
  payment_intent: z.string().optional(),
  payment_status: z.enum(["paid", "unpaid", "no_payment_required"]),
  amount_total: z.number().int().nonnegative().optional(),
  amount_subtotal: z.number().int().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  customer: z.string().optional(),
  customer_email: z.string().email().optional(),
  metadata: WebhookPaymentMetadataSchema.optional(),
});

export type CheckoutSessionCompleted = z.infer<
  typeof CheckoutSessionCompletedSchema
>;

/**
 * Validator pour Invoice payment succeeded
 */
export const InvoicePaymentSucceededSchema = z.object({
  id: z.string().startsWith("in_", "Invoice ID invalide"),
  subscription: z.string().optional(),
  customer: z.string().min(1, "Customer ID requis"),
  amount_paid: z.number().int().nonnegative(),
  amount_due: z.number().int().nonnegative(),
  amount_remaining: z.number().int().nonnegative().optional(),
  currency: z.string().length(3),
  status: z.string(),
  period_start: z.number().int().positive().optional(),
  period_end: z.number().int().positive().optional(),
  hosted_invoice_url: z.string().url().optional(),
  invoice_pdf: z.string().url().optional(),
});

export type InvoicePaymentSucceeded = z.infer<
  typeof InvoicePaymentSucceededSchema
>;

/**
 * Validator pour Invoice payment failed
 */
export const InvoicePaymentFailedSchema = z.object({
  id: z.string().startsWith("in_", "Invoice ID invalide"),
  subscription: z.string().optional(),
  customer: z.string().min(1, "Customer ID requis"),
  amount_due: z.number().int().nonnegative(),
  attempt_count: z.number().int().nonnegative(),
  next_payment_attempt: z.number().int().positive().optional(),
  currency: z.string().length(3),
  status: z.enum(["open", "draft", "uncollectible", "void"]),
});

export type InvoicePaymentFailed = z.infer<typeof InvoicePaymentFailedSchema>;

/**
 * Validator pour Subscription (created/updated/deleted)
 */
export const SubscriptionSchema = z.object({
  id: z.string().startsWith("sub_", "Subscription ID invalide"),
  customer: z.string().min(1, "Customer ID requis"),
  status: z.enum([
    "active",
    "past_due",
    "unpaid",
    "canceled",
    "incomplete",
    "incomplete_expired",
    "trialing",
    "paused",
  ]),
  current_period_start: z.number().int().positive(),
  current_period_end: z.number().int().positive(),
  cancel_at: z.number().int().positive().optional(),
  canceled_at: z.number().int().positive().optional(),
  cancel_at_period_end: z.boolean(),
  trial_start: z.number().int().positive().optional(),
  trial_end: z.number().int().positive().optional(),
  metadata: WebhookPaymentMetadataSchema.optional(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

/**
 * Validator pour l'event Stripe complet
 */
export const StripeEventSchema = z.object({
  id: z.string().startsWith("evt_", "Event ID invalide"),
  type: z.string().min(1, "Type d'événement requis"),
  data: z.object({
    object: z.any(),
  }),
  created: z.number().int().positive(),
  livemode: z.boolean(),
  api_version: z.string().optional(),
  request: z
    .object({
      id: z.string().optional(),
      idempotency_key: z.string().optional(),
    })
    .optional(),
});

export type StripeEvent = z.infer<typeof StripeEventSchema>;

/**
 * Validator pour confirmer un paiement d'échéance
 */
export const ConfirmPaymentEcheanceSchema = z.object({
  paymentIntentId: z.string().startsWith("pi_", "Payment Intent ID invalide"),
  echeanceId: z.number().int().positive("ID échéance invalide"),
  utilisateurId: z.number().int().positive("ID utilisateur invalide"),
  montant: z.number().positive("Montant doit être positif"),
});

export type ConfirmPaymentEcheance = z.infer<
  typeof ConfirmPaymentEcheanceSchema
>;

/**
 * Validator pour confirmer un paiement de commande
 */
export const ConfirmPaymentCommandeSchema = z.object({
  paymentIntentId: z.string().startsWith("pi_", "Payment Intent ID invalide"),
  commandeId: z.number().int().positive("ID commande invalide"),
  utilisateurId: z.number().int().positive("ID utilisateur invalide"),
  montant: z.number().positive("Montant doit être positif"),
});

export type ConfirmPaymentCommande = z.infer<
  typeof ConfirmPaymentCommandeSchema
>;

/**
 * Validator pour les logs de webhook
 */
export const WebhookLogSchema = z.object({
  eventId: z.string().min(1, "Event ID requis"),
  eventType: z.string().min(1, "Type d'événement requis"),
  success: z.boolean(),
  error: z.string().optional(),
  metadata: z.any().optional(),
  retryCount: z.number().int().nonnegative().default(0),
  processedAt: z.date().default(() => new Date()),
});

export type WebhookLog = z.infer<typeof WebhookLogSchema>;

/**
 * Validator pour enregistrer un paiement webhook
 */
export const EnregistrerPaiementWebhookSchema = z.object({
  utilisateur_id: z.number().int().positive("ID utilisateur invalide"),
  montant: z.number().positive("Montant doit être positif"),
  methode_paiement: z.enum([
    "stripe",
    "paypal",
    "bitcoin",
    "virement",
    "autre",
  ]),
  stripe_payment_intent_id: z.string().min(1, "Payment Intent ID requis"),
  statut: z.enum(["reussi", "echec", "en_attente", "annule"]),
  description: z.string().optional(),
  abonnement_id: z.number().int().positive().optional(),
  echeance_id: z.number().int().positive().optional(),
  commande_id: z.number().int().positive().optional(),
});

export type EnregistrerPaiementWebhook = z.infer<
  typeof EnregistrerPaiementWebhookSchema
>;

/**
 * Validator pour mettre à jour une échéance
 */
export const UpdateEcheanceWebhookSchema = z.object({
  echeanceId: z.number().int().positive("ID échéance invalide"),
  utilisateurId: z.number().int().positive("ID utilisateur invalide"),
  statut: z.enum(["payé", "en attente", "échu"]),
  montantPaye: z.number().positive().optional(),
  datePaiement: z.date().optional(),
});

export type UpdateEcheanceWebhook = z.infer<typeof UpdateEcheanceWebhookSchema>;

/**
 * Validator pour les paramètres d'email de confirmation
 */
export const EmailConfirmationWebhookSchema = z.object({
  to: z.string().email("Email invalide"),
  userName: z.string().min(1, "Nom utilisateur requis"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  amount: z.string().min(1, "Montant requis"),
  currency: z.string().length(3, "Code devise invalide").toUpperCase(),
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
  echeanceId: z.string().optional(),
  commandeId: z.string().optional(),
  datePaiement: z.string().min(1, "Date paiement requise"),
  premierPaiement: z.boolean().optional().default(false),
  clubName: z.string().default("Club Manager"),
  supportEmail: z.string().email().default("support@clubmanager.com"),
  frontendUrl: z.string().url().default("http://localhost:5173"),
});

export type EmailConfirmationWebhook = z.infer<
  typeof EmailConfirmationWebhookSchema
>;

/**
 * Validator pour les paramètres d'email d'échec
 */
export const EmailFailureWebhookSchema = z.object({
  to: z.string().email("Email invalide"),
  userName: z.string().min(1, "Nom utilisateur requis"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  amount: z.string().min(1, "Montant requis"),
  currency: z.string().length(3, "Code devise invalide").toUpperCase(),
  errorMessage: z.string().min(1, "Message d'erreur requis"),
  errorCode: z.string().optional(),
  paymentIntentId: z.string().min(1, "Payment Intent ID requis"),
  echeanceId: z.string().optional(),
  commandeId: z.string().optional(),
  dateEchec: z.string().min(1, "Date échec requise"),
  retryUrl: z.string().url().optional(),
  clubName: z.string().default("Club Manager"),
  supportEmail: z.string().email().default("support@clubmanager.com"),
  frontendUrl: z.string().url().default("http://localhost:5173"),
});

export type EmailFailureWebhook = z.infer<typeof EmailFailureWebhookSchema>;

/**
 * Validator pour retry webhook
 */
export const RetryWebhookSchema = z.object({
  eventId: z.string().min(1, "Event ID requis"),
  maxRetries: z.number().int().positive().max(5).default(3),
});

export type RetryWebhook = z.infer<typeof RetryWebhookSchema>;

/**
 * Validator pour filtrer les logs de webhooks
 */
export const WebhookLogsFilterSchema = z.object({
  eventType: z.string().optional(),
  success: z.boolean().optional(),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  hasError: z.boolean().optional(),
  minRetryCount: z.number().int().nonnegative().optional(),
});

export type WebhookLogsFilter = z.infer<typeof WebhookLogsFilterSchema>;

/**
 * Validator pour la configuration du webhook
 */
export const WebhookConfigSchema = z.object({
  endpointSecret: z.string().min(1, "Endpoint secret requis"),
  enableLogging: z.boolean().default(true),
  retryOnFailure: z.boolean().default(true),
  maxRetries: z.number().int().positive().max(5).default(3),
  validateSignature: z.boolean().default(true),
  sendEmails: z.boolean().default(true),
  updateDatabase: z.boolean().default(true),
  notifyAdmin: z.boolean().default(false),
});

export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

/**
 * Validator pour récupérer les logs de webhooks (GraphQL Query)
 */
export const getWebhookLogsSchema = z.object({
  limit: z.number().int().positive().max(100).default(50).optional(),
  offset: z.number().int().nonnegative().default(0).optional(),
  status: z.enum(["pending", "success", "failure", "retrying"]).optional(),
  eventType: z.string().optional(),
});

export type GetWebhookLogsInput = z.infer<typeof getWebhookLogsSchema>;

/**
 * Validator pour récupérer les statistiques de webhooks (GraphQL Query)
 */
export const getWebhookStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type GetWebhookStatsInput = z.infer<typeof getWebhookStatsSchema>;

/**
 * Validator pour réessayer un webhook échoué (GraphQL Mutation)
 */
export const retryWebhookSchema = z.object({
  webhookLogId: z.string().min(1, "Webhook Log ID requis"),
});

export type RetryWebhookInput = z.infer<typeof retryWebhookSchema>;

/**
 * Validator pour traiter manuellement un webhook (GraphQL Mutation)
 */
export const processWebhookManuallySchema = z.object({
  eventId: z.string().min(1, "Event ID requis"),
  eventType: z.string().min(1, "Event Type requis"),
  payload: z.any(),
});

export type ProcessWebhookManuallyInput = z.infer<
  typeof processWebhookManuallySchema
>;
