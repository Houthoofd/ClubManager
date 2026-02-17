/**
 * Core Types Index
 * Re-exports core system types only (not business domain types)
 */

// ============================================================================
// COMMON TYPES (Pagination, Sorting, Filtering, etc.)
// ============================================================================
export * from "./common.js";

// ============================================================================
// ERROR TYPES
// ============================================================================
export {
  ErrorCode,
  ErrorSeverity,
  ErrorCategory,
  ERROR_CODE_MAP,
} from "./errors.js";

export type {
  AppError,
  ValidationErrorDetail,
  DatabaseErrorDetail,
  ExternalServiceError,
  ErrorResponse,
  GraphQLErrorResponse,
  ErrorMetadata,
  ErrorHandlerConfig,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  BadRequestError,
  ErrorCodeMapping,
} from "./errors.js";

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================
export type {
  AppConfig,
  SentryConfig,
  SentryBreadcrumb,
  SentryUser,
  DatabaseConfig,
  DatabaseSSLConfig,
  EmailConfig,
  StorageConfig,
  AuthConfig,
  OAuthProviderConfig,
  CacheConfig,
  WebhookConfig,
  WebhookEndpoint,
  QueueConfig,
  GraphQLConfig,
  FeatureFlagsConfig,
  SecurityConfig,
} from "./config.js";

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================
export type {
  AuthUser,
  AuditContext,
  AuditLogOptions,
  RateLimitEntry,
  RateLimitConfig,
  RateLimitInfo,
  RateLimitStore,
  ValidationOptions,
  ErrorHandlerOptions,
  LoggingOptions,
  LogEntry,
  PermissionOptions,
  PermissionCheck,
  CorsOptions,
  CacheOptions,
  CacheStore,
  CacheEntry,
  SecurityOptions,
  TracingOptions,
  SpanContext,
} from "./middleware.js";

// ============================================================================
// SERVICE TYPES - Only core services (Session, Audit)
// ============================================================================
// Export only core service types, not business domain types
export type {
  SessionData,
  CreateSessionOptions,
  SessionQueryOptions,
  AuditLogEntry,
  AuditQueryOptions,
} from "./services.js";

export { AuditEventType, AuditSeverity } from "./services.js";

// ============================================================================
// QUERY TYPES (API Response Types)
// ============================================================================
export type {
  InsertResult,
  UpdateResult,
  DeleteResult,
  ApiResponse,
  PaginatedResponse,
  ApiError,
} from "./query.js";
