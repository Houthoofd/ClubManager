/**
 * ====================================================================
 * API CONSTANTS
 * ====================================================================
 *
 * Centralized API configuration, endpoints, and related constants.
 * Use these constants for all API calls to ensure consistency.
 *
 * Usage:
 * ```tsx
 * import { API, API_ENDPOINTS } from '@/core/constants';
 *
 * fetch(`${API.BASE_URL}${API_ENDPOINTS.USERS.LIST}`);
 * ```
 */

// ====================================================================
// API BASE CONFIGURATION
// ====================================================================

export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:4000",
  GRAPHQL_URL: import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql",
  WS_URL: import.meta.env.VITE_WS_URL || "ws://localhost:4000/graphql",

  // Timeout configuration (in milliseconds)
  TIMEOUT: {
    DEFAULT: 30000, // 30 seconds
    UPLOAD: 120000, // 2 minutes
    DOWNLOAD: 60000, // 1 minute
    LONG_RUNNING: 300000, // 5 minutes
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000, // 1 second
    MAX_DELAY: 10000, // 10 seconds
    BACKOFF_MULTIPLIER: 2,
  },

  // Cache configuration (in milliseconds)
  CACHE: {
    SHORT: 60000, // 1 minute
    MEDIUM: 300000, // 5 minutes
    LONG: 900000, // 15 minutes
    VERY_LONG: 3600000, // 1 hour
  },
} as const;

// ====================================================================
// REST API ENDPOINTS
// ====================================================================

export const API_ENDPOINTS = {
  // ==================================================================
  // AUTH ENDPOINTS
  // ==================================================================
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    REFRESH_TOKEN: "/api/auth/refresh",
    VERIFY_EMAIL: "/api/auth/verify-email",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    CHANGE_PASSWORD: "/api/auth/change-password",
    ME: "/api/auth/me",
  },

  // ==================================================================
  // USER ENDPOINTS
  // ==================================================================
  USERS: {
    LIST: "/api/users",
    DETAIL: (id: string | number) => `/api/users/${id}`,
    CREATE: "/api/users",
    UPDATE: (id: string | number) => `/api/users/${id}`,
    DELETE: (id: string | number) => `/api/users/${id}`,
    AVATAR: (id: string | number) => `/api/users/${id}/avatar`,
    STATISTICS: (id: string | number) => `/api/users/${id}/statistics`,
    PAYMENTS: (id: string | number) => `/api/users/${id}/payments`,
    COURSES: (id: string | number) => `/api/users/${id}/courses`,
  },

  // ==================================================================
  // COURSE ENDPOINTS
  // ==================================================================
  COURSES: {
    LIST: "/api/courses",
    DETAIL: (id: string | number) => `/api/courses/${id}`,
    CREATE: "/api/courses",
    UPDATE: (id: string | number) => `/api/courses/${id}`,
    DELETE: (id: string | number) => `/api/courses/${id}`,
    PARTICIPANTS: (id: string | number) => `/api/courses/${id}/participants`,
    PROFESSORS: (id: string | number) => `/api/courses/${id}/professors`,
    INSCRIPTIONS: "/api/courses/inscriptions",
    VALIDATE_INSCRIPTION: "/api/courses/validate-inscription",
    CANCEL_INSCRIPTION: (id: string | number) => `/api/courses/inscriptions/${id}/cancel`,
  },

  // ==================================================================
  // SHOP ENDPOINTS
  // ==================================================================
  SHOP: {
    ARTICLES: "/api/shop/articles",
    ARTICLE_DETAIL: (id: string | number) => `/api/shop/articles/${id}`,
    CREATE_ARTICLE: "/api/shop/articles",
    UPDATE_ARTICLE: (id: string | number) => `/api/shop/articles/${id}`,
    DELETE_ARTICLE: (id: string | number) => `/api/shop/articles/${id}`,
    CATEGORIES: "/api/shop/categories",
    CART: "/api/shop/cart",
    CART_ADD: "/api/shop/cart/add",
    CART_REMOVE: "/api/shop/cart/remove",
    CART_UPDATE: "/api/shop/cart/update",
    CART_CLEAR: "/api/shop/cart/clear",
  },

  // ==================================================================
  // ORDER ENDPOINTS
  // ==================================================================
  ORDERS: {
    LIST: "/api/orders",
    DETAIL: (id: string | number) => `/api/orders/${id}`,
    CREATE: "/api/orders",
    UPDATE_STATUS: (id: string | number) => `/api/orders/${id}/status`,
    CANCEL: (id: string | number) => `/api/orders/${id}/cancel`,
    STATISTICS: "/api/orders/statistics",
  },

  // ==================================================================
  // PAYMENT ENDPOINTS
  // ==================================================================
  PAYMENTS: {
    CREATE_INTENT: "/api/payments/create-intent",
    CONFIRM: "/api/payments/confirm",
    WEBHOOK: "/api/payments/webhook",
    STRIPE_CONFIG: "/api/payments/stripe/config",
    REFUND: (id: string | number) => `/api/payments/${id}/refund`,
  },

  // ==================================================================
  // MESSAGE ENDPOINTS
  // ==================================================================
  MESSAGES: {
    LIST: "/api/messages",
    DETAIL: (id: string | number) => `/api/messages/${id}`,
    SEND: "/api/messages/send",
    MARK_READ: (id: string | number) => `/api/messages/${id}/mark-read`,
    DELETE: (id: string | number) => `/api/messages/${id}`,
    TYPES: "/api/messages/types",
    CREATE_TYPE: "/api/messages/types",
  },

  // ==================================================================
  // TEACHER ENDPOINTS
  // ==================================================================
  TEACHERS: {
    LIST: "/api/teachers",
    DETAIL: (id: string | number) => `/api/teachers/${id}`,
    PLANNING: (id: string | number) => `/api/teachers/${id}/planning`,
    STATISTICS: (id: string | number) => `/api/teachers/${id}/statistics`,
  },

  // ==================================================================
  // STATISTICS ENDPOINTS
  // ==================================================================
  STATS: {
    DASHBOARD: "/api/statistics/dashboard",
    COURSES: "/api/statistics/courses",
    USERS: "/api/statistics/users",
    REVENUE: "/api/statistics/revenue",
    SHOP: "/api/statistics/shop",
  },

  // ==================================================================
  // FILE UPLOAD ENDPOINTS
  // ==================================================================
  UPLOADS: {
    IMAGE: "/api/uploads/image",
    DOCUMENT: "/api/uploads/document",
    AVATAR: "/api/uploads/avatar",
    BULK: "/api/uploads/bulk",
  },

  // ==================================================================
  // SETTINGS ENDPOINTS
  // ==================================================================
  SETTINGS: {
    GET: "/api/settings",
    UPDATE: "/api/settings",
    NOTIFICATIONS: "/api/settings/notifications",
    PREFERENCES: "/api/settings/preferences",
  },
} as const;

// ====================================================================
// HTTP METHODS
// ====================================================================

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

// ====================================================================
// HTTP STATUS CODES
// ====================================================================

export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  REQUEST_TIMEOUT: 408,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ====================================================================
// API ERROR CODES
// ====================================================================

export const API_ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",

  // Validation errors
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Resource errors
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Business logic errors
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",

  // System errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",

  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
} as const;

// ====================================================================
// REQUEST HEADERS
// ====================================================================

export const API_HEADERS = {
  CONTENT_TYPE: "Content-Type",
  AUTHORIZATION: "Authorization",
  ACCEPT: "Accept",
  ACCEPT_LANGUAGE: "Accept-Language",
  X_REQUESTED_WITH: "X-Requested-With",
  X_CSRF_TOKEN: "X-CSRF-Token",
} as const;

// ====================================================================
// CONTENT TYPES
// ====================================================================

export const CONTENT_TYPES = {
  JSON: "application/json",
  FORM_DATA: "multipart/form-data",
  URL_ENCODED: "application/x-www-form-urlencoded",
  TEXT: "text/plain",
  HTML: "text/html",
  XML: "application/xml",
  PDF: "application/pdf",
} as const;

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

/**
 * Check if HTTP status is successful (2xx)
 */
export const isSuccessStatus = (status: number): boolean => {
  return status >= 200 && status < 300;
};

/**
 * Check if HTTP status is a client error (4xx)
 */
export const isClientError = (status: number): boolean => {
  return status >= 400 && status < 500;
};

/**
 * Check if HTTP status is a server error (5xx)
 */
export const isServerError = (status: number): boolean => {
  return status >= 500 && status < 600;
};

/**
 * Check if error should trigger a retry
 */
export const shouldRetryRequest = (status: number): boolean => {
  return (
    status === HTTP_STATUS.REQUEST_TIMEOUT ||
    status === HTTP_STATUS.TOO_MANY_REQUESTS ||
    status === HTTP_STATUS.INTERNAL_SERVER_ERROR ||
    status === HTTP_STATUS.BAD_GATEWAY ||
    status === HTTP_STATUS.SERVICE_UNAVAILABLE ||
    status === HTTP_STATUS.GATEWAY_TIMEOUT
  );
};

/**
 * Get authorization header value
 */
export const getAuthHeader = (token: string): string => {
  return `Bearer ${token}`;
};

/**
 * Build query string from params object
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((item) => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

/**
 * Calculate exponential backoff delay
 */
export const calculateBackoffDelay = (attempt: number): number => {
  const delay = API.RETRY.INITIAL_DELAY * Math.pow(API.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
  return Math.min(delay, API.RETRY.MAX_DELAY);
};

// ====================================================================
// TYPE EXPORTS
// ====================================================================

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
export type ContentType = (typeof CONTENT_TYPES)[keyof typeof CONTENT_TYPES];
