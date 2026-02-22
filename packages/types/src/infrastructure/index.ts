/**
 * Infrastructure Types Index
 * Re-exports all infrastructure-related types
 */

// GraphQL types
export * from "./graphql.js";

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
  StripeWebhookConfig,
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
  StripeWebhookConfigSchema,
  WebhookProcessingOptionsSchema,
  WebhookEventLogSchema,
  WebhookLogSchema,
  getWebhookLogsSchema,
  getWebhookStatsSchema,
  retryWebhookSchema,
  processWebhookManuallySchema,
} from "./webhooks.js";

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

// Email GraphQL Types
export { emailGraphQLTypeDefs } from "./email.graphql.js";

// Logger types
export type {
  LogLevel,
  LogContext,
  LoggerEntry,
  LoggerConfig,
  Logger,
  PerformanceEntry,
  LogBreadcrumb,
} from "./logger.js";

export { LogLevelPriority } from "./logger.js";
