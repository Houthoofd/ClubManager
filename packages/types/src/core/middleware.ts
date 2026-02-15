/**
 * Centralized Middleware Types
 *
 * All middleware-related interfaces and types for ClubManager API.
 * This file consolidates types from various middleware files across the API.
 */

import type { ZodSchema } from 'zod';
import type { AuditEventType, AuditSeverity } from './services.js';

// ============================================================================
// AUTHENTICATION MIDDLEWARE TYPES
// ============================================================================

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number | null;
  userId: string;
  nom_utilisateur: string;
}

// ============================================================================
// AUDIT LOG MIDDLEWARE TYPES
// ============================================================================

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  operationName?: string;
}

export interface AuditLogOptions {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  resource?: string;
  skipOnError?: boolean;
  metadata?: Record<string, any>;
}

// ============================================================================
// RATE LIMIT MIDDLEWARE TYPES
// ============================================================================

export interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  max: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom error message
   */
  message?: string;

  /**
   * Function to generate unique key for rate limiting
   */
  keyGenerator?: (context: any) => string;

  /**
   * Skip rate limiting for certain conditions
   */
  skip?: (context: any) => boolean;

  /**
   * Handler called when rate limit is exceeded
   */
  onRateLimitExceeded?: (context: any, info: RateLimitInfo) => void;

  /**
   * Store implementation (in-memory or Redis)
   */
  store?: RateLimitStore;
}

export interface RateLimitInfo {
  current: number;
  limit: number;
  remaining: number;
  resetTime: Date;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  increment(key: string): Promise<number>;
  reset(key: string): Promise<void>;
}

// ============================================================================
// VALIDATION MIDDLEWARE TYPES
// ============================================================================

export interface ValidationOptions {
  schema: ZodSchema;
  stripUnknown?: boolean;
  abortEarly?: boolean;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE TYPES
// ============================================================================

export interface ErrorHandlerOptions {
  /**
   * Whether to expose stack traces in responses
   */
  exposeStackTrace?: boolean;

  /**
   * Custom error formatter
   */
  formatter?: (error: any) => ErrorResponse;

  /**
   * Logger function
   */
  logger?: (error: any, context: any) => void;

  /**
   * Sentry integration enabled
   */
  sentryEnabled?: boolean;
}

export interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  statusCode?: number;
  errors?: any[];
  stack?: string;
  timestamp?: string;
}

// ============================================================================
// LOGGING MIDDLEWARE TYPES
// ============================================================================

export interface LoggingOptions {
  /**
   * Log level
   */
  level?: 'debug' | 'info' | 'warn' | 'error';

  /**
   * Include request body in logs
   */
  includeBody?: boolean;

  /**
   * Include response body in logs
   */
  includeResponse?: boolean;

  /**
   * Fields to redact from logs
   */
  redactFields?: string[];

  /**
   * Skip logging for certain operations
   */
  skip?: (context: any) => boolean;
}

export interface LogEntry {
  timestamp: Date;
  level: string;
  operation?: string;
  duration?: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  request?: {
    query?: string;
    variables?: any;
    headers?: Record<string, string>;
  };
  response?: {
    success: boolean;
    errors?: any[];
  };
  metadata?: Record<string, any>;
}

// ============================================================================
// PERMISSION MIDDLEWARE TYPES
// ============================================================================

export interface PermissionOptions {
  /**
   * Required permissions (any of these)
   */
  permissions?: string[];

  /**
   * Required roles (any of these)
   */
  roles?: string[];

  /**
   * Require all permissions instead of any
   */
  requireAll?: boolean;

  /**
   * Resource-based permission check
   */
  resource?: {
    type: string;
    getId: (args: any) => string | number;
  };

  /**
   * Custom authorization function
   */
  authorize?: (user: any, context: any) => boolean | Promise<boolean>;
}

export interface PermissionCheck {
  granted: boolean;
  reason?: string;
  requiredPermissions?: string[];
  userPermissions?: string[];
}

// ============================================================================
// CORS MIDDLEWARE TYPES
// ============================================================================

export interface CorsOptions {
  origin?: string | string[] | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

// ============================================================================
// CACHE MIDDLEWARE TYPES
// ============================================================================

export interface CacheOptions {
  /**
   * Cache TTL in seconds
   */
  ttl?: number;

  /**
   * Cache key generator
   */
  keyGenerator?: (context: any) => string;

  /**
   * Skip caching for certain conditions
   */
  skip?: (context: any) => boolean;

  /**
   * Cache store implementation
   */
  store?: CacheStore;

  /**
   * Invalidation patterns
   */
  invalidateOn?: string[];
}

export interface CacheStore {
  get<T = any>(key: string): Promise<T | null>;
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// ============================================================================
// SECURITY MIDDLEWARE TYPES
// ============================================================================

export interface SecurityOptions {
  /**
   * Enable XSS protection
   */
  xssProtection?: boolean;

  /**
   * Enable CSRF protection
   */
  csrfProtection?: boolean;

  /**
   * Enable helmet security headers
   */
  helmet?: boolean;

  /**
   * Content Security Policy
   */
  csp?: {
    directives?: Record<string, string[]>;
  };

  /**
   * IP whitelist/blacklist
   */
  ipFilter?: {
    whitelist?: string[];
    blacklist?: string[];
  };

  /**
   * Request size limits
   */
  limits?: {
    maxBodySize?: number;
    maxFileSize?: number;
    maxFields?: number;
  };
}

// ============================================================================
// TRACING MIDDLEWARE TYPES
// ============================================================================

export interface TracingOptions {
  /**
   * Enable distributed tracing
   */
  enabled?: boolean;

  /**
   * Sample rate (0-1)
   */
  sampleRate?: number;

  /**
   * Custom span name generator
   */
  spanNameGenerator?: (context: any) => string;

  /**
   * Additional tags to add to spans
   */
  tags?: Record<string, string | number | boolean>;
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  sampled: boolean;
  attributes?: Record<string, any>;
}
