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
  TemplateVariablesMap,
  TemplateName,
  TemplateVariables,
  BulkEmailRecipient,
  BulkEmailRequest,
  BulkEmailResult,
  EmailBuilderOptions,
  DryRunResult,
  UserEmailData,
  EmailHook,
  EnrichedEmailRequest,
  EmailPartial,
  EmailStats,
  MetricsConfig,
  EmailMetricLabels,
  MetricsSnapshot,
  CorrelationIdConfig,
  CorrelationMetadata,
  CorrelationContext,
  AlertConfig,
  AlertChannel,
  AlertChannelType,
  AlertSeverity,
  AlertContext as EmailAlertContext,
  AlertRequest,
  AlertResult,
  SlackMessage,
  DiscordMessage,
  DiscordEmbed,
  AlertStats as EmailAlertStats,
  DashboardConfig,
  DashboardData,
  DashboardEvent,
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

// Alert types
export type {
  CreateAlertInput,
  AlerteType as AlertTypeInfo,
  AlerteUtilisateur,
  AlertContext,
  AlertStats,
  GetAlertsResult,
  AlertAction,
} from "./alerts.js";

export {
  AlertType,
  AlertPriority,
  AlertStatus,
  createAlertSchema,
  resolveAlertSchema,
  getAlertsSchema,
  createAlertActionSchema,
  isAlertType,
  isAlertPriority,
  isAlertStatus,
  getAlertTypeName,
  getAlertTypeDescription,
  getAlertPriorityColor,
  getAlertTypeIcon,
} from "./alerts.js";

// Email Phase 3 GraphQL Types
export { emailPhase3TypeDefs } from "./email-phase3.graphql.typedefs.js";
