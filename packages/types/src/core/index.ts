/**
 * Core Types Index
 * Re-exports core system types only (not business domain types)
 */

// ============================================================================
// COMMON TYPES (Pagination, Sorting, Filtering, etc.)
// ============================================================================
export * from "./common.js";

// ============================================================================
// I18N TYPES
// ============================================================================
export * from "./i18n.js";

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
  UserData,
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

// ============================================================================
// API TYPES (Front-end/Back-end Communication)
// ============================================================================
export type {
  AuthStatusResponse,
  LoginApiResponse,
  LogoutApiResponse,
  RegisterApiResponse,
  CourseData,
  CourseEnrollmentData,
  CourseEnrollmentResponse,
  ProfesseurListResponse,
  CourseInstanceWithDetails,
  ArticleWithCategory,
  CartArticle,
  ProductCategoriesResponse,
  OrderCreateResponse,
  PaymentIntentResponse,
  UserProfileResponse,
  UserListResponse,
  UserUpdateResponse,
  UnreadMessagesResponse,
  DashboardStats,
  ChartDataPoint,
  ChartData,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedApiResponse,
  MutationResponse,
  DeleteResponse,
  BatchMutationResponse,
  ValidationState,
  FormValidationError,
  FormValidationResponse,
  FileUploadResponse,
  MultiFileUploadResponse,
  // Re-exported base types
  Users,
  UsersInsert,
  UsersUpdate,
  UserProfiles,
  AuthTokens,
  LoginCredentials,
  LoginResponse,
  Sessions,
  SessionsInsert,
  Instructors,
  Products,
  ProductsInsert,
  ProductsUpdate,
  ProductCategories,
  Orders,
  OrdersInsert,
  OrderItems,
  PaymentMethod,
  StripePaymentIntent,
} from "./api.types.js";
