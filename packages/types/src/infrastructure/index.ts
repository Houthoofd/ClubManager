/**
 * Infrastructure Types Index
 * Re-exports all infrastructure-related types
 */

// Email types
export type {
  EmailSendRequest,
  EmailSendResult,
  EmailValidationRequest,
  EmailValidationResult,
  EmailTemplate,
  EmailTemplateVariables,
  SendGridOptions,
  PromotionEmailOptions,
  WelcomeEmailVariables,
  OrderConfirmationVariables,
} from "./email.js";

// S3/Storage types
export * from "./s3.js";

// Webhook types
export type {
  WebhookRequest,
  PaymentMetadata,
  WebhookProcessingResult,
  PaymentSuccessData,
  PaymentFailedData,
  CheckoutSessionData,
  InvoiceData,
  SubscriptionData,
  EmailConfirmationOptions,
  EmailFailureOptions,
  WebhookConfig,
  SignatureValidationResult,
  WebhookHandler,
  WebhookHandlers,
  WebhookProcessingOptions,
  WebhookEventLog,
  WebhookLog,
  WebhookStats,
  EventTypeStats,
  GetWebhookLogsInput,
  GetWebhookStatsInput,
  RetryWebhookInput,
  ProcessWebhookManuallyInput,
} from "./webhooks.js";

export {
  StripeEventType,
  SubscriptionStatus,
  WebhookError,
  WebhookLogStatus,
  PaymentMetadataSchema,
  PaymentSuccessDataSchema,
  PaymentFailedDataSchema,
  CheckoutSessionDataSchema,
  InvoiceDataSchema,
  SubscriptionDataSchema,
  EmailConfirmationOptionsSchema,
  EmailFailureOptionsSchema,
  WebhookConfigSchema,
  WebhookProcessingOptionsSchema,
  WebhookEventLogSchema,
  WebhookLogSchema,
  getWebhookLogsSchema,
  getWebhookStatsSchema,
  retryWebhookSchema,
  processWebhookManuallySchema,
} from "./webhooks.js";

// Database types
export * from "./database/auth.types.js";
export * from "./database/utilisateurs.types.js";
