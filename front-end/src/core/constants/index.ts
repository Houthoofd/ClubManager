/**
 * ====================================================================
 * CORE CONSTANTS - BARREL EXPORT
 * ====================================================================
 *
 * Central export point for all application constants.
 * Import constants from this file to ensure consistency across the app.
 *
 * Usage:
 * ```tsx
 * import { ROUTES, VALIDATION, API, BUSINESS } from '@/core/constants';
 *
 * // Use in components
 * navigate(ROUTES.COURSES.LIST);
 * if (isValidEmail(email)) { ... }
 * fetch(`${API.BASE_URL}${API_ENDPOINTS.USERS.LIST}`);
 * ```
 */

// ====================================================================
// ROUTES
// ====================================================================

export {
  ROUTES,
  PUBLIC_ROUTES,
  PROTECTED_ROUTES,
  ROUTE_GROUPS,
  isPublicRoute,
  isProtectedRoute,
  getBreadcrumbsForRoute,
  type RouteKeys,
  type RouteValues,
} from "./routes";

// ====================================================================
// VALIDATION
// ====================================================================

export {
  VALIDATION,
  VALIDATION_MESSAGES,
  isValidEmail,
  isValidPassword,
  isValidBelgianPhone,
  isValidPhone,
  isValidFileSize,
  isValidFileType,
  isValidBelgianPostalCode,
  isValidPrice,
  isDateInFuture,
  isDateWithinBookingRange,
  isMinimumAge,
  type ValidationRule,
  type ValidationMessageKey,
} from "./validation";

// ====================================================================
// API
// ====================================================================

export {
  API,
  API_ENDPOINTS,
  HTTP_METHODS,
  HTTP_STATUS,
  API_ERROR_CODES,
  API_HEADERS,
  CONTENT_TYPES,
  isSuccessStatus,
  isClientError,
  isServerError,
  shouldRetryRequest,
  getAuthHeader,
  buildQueryString,
  calculateBackoffDelay,
  type HttpMethod,
  type HttpStatus,
  type ApiErrorCode,
  type ContentType,
} from "./api";

// ====================================================================
// BUSINESS RULES
// ====================================================================

export {
  BUSINESS,
  canEnrollInCourse,
  hasMinimumParticipants,
  isTeacherWorkloadValid,
  calculateTotalWithFees,
  isStockLow,
  isOutOfStock,
  isMinor,
  isPaymentOverdue,
  calculateLateFee,
  formatPrice,
  isValidDiscount,
  type CourseStatus,
  type CourseType,
  type CourseLevel,
  type UserRole,
  type UserStatus,
  type MembershipType,
  type OrderStatus,
  type PaymentStatus,
  type PaymentMethod,
  type MessagePriority,
  type MessageType,
  type NotificationChannel,
  type NotificationType,
  type StatisticsPeriod,
} from "./business";

// ====================================================================
// QUICK ACCESS EXPORTS (Most commonly used)
// ====================================================================

/**
 * Commonly used constants exported directly for convenience.
 * You can also import them from their specific modules above.
 *
 * Note: These are re-exported from their respective modules.
 * Import from specific modules (routes, validation, api, business) directly
 * if you need more control or want to avoid namespace collisions.
 */
