/**
 * Centralized Error Types
 *
 * All error-related interfaces, enums, and types for ClubManager API.
 * This file consolidates error types from various error handling files across the API.
 */

// ============================================================================
// ERROR CODES ENUM
// ============================================================================

export enum ErrorCode {
  // Authentication Errors (1xxx)
  INVALID_CREDENTIALS = 'AUTH_1001',
  ACCOUNT_LOCKED = 'AUTH_1002',
  ACCOUNT_NOT_VERIFIED = 'AUTH_1003',
  EMAIL_NOT_VERIFIED = 'AUTH_1004',
  INVALID_TOKEN = 'AUTH_1005',
  TOKEN_EXPIRED = 'AUTH_1006',
  REFRESH_TOKEN_INVALID = 'AUTH_1007',
  REFRESH_TOKEN_EXPIRED = 'AUTH_1008',
  SESSION_INVALID = 'AUTH_1009',
  SESSION_EXPIRED = 'AUTH_1010',
  PASSWORD_RESET_TOKEN_INVALID = 'AUTH_1011',
  PASSWORD_RESET_TOKEN_EXPIRED = 'AUTH_1012',
  EMAIL_VERIFICATION_TOKEN_INVALID = 'AUTH_1013',
  EMAIL_VERIFICATION_TOKEN_EXPIRED = 'AUTH_1014',

  // Authorization Errors (2xxx)
  UNAUTHORIZED = 'AUTHZ_2001',
  FORBIDDEN = 'AUTHZ_2002',
  INSUFFICIENT_PERMISSIONS = 'AUTHZ_2003',
  ROLE_REQUIRED = 'AUTHZ_2004',
  ADMIN_REQUIRED = 'AUTHZ_2005',
  OWNER_REQUIRED = 'AUTHZ_2006',

  // Validation Errors (3xxx)
  VALIDATION_ERROR = 'VAL_3001',
  INVALID_EMAIL = 'VAL_3002',
  INVALID_PASSWORD = 'VAL_3003',
  PASSWORD_TOO_WEAK = 'VAL_3004',
  INVALID_DATE = 'VAL_3005',
  INVALID_FORMAT = 'VAL_3006',
  REQUIRED_FIELD_MISSING = 'VAL_3007',
  INVALID_INPUT = 'VAL_3008',
  INVALID_ID = 'VAL_3009',
  INVALID_PHONE = 'VAL_3010',

  // Resource Errors (4xxx)
  RESOURCE_NOT_FOUND = 'RES_4001',
  USER_NOT_FOUND = 'RES_4002',
  COURSE_NOT_FOUND = 'RES_4003',
  ORDER_NOT_FOUND = 'RES_4004',
  ARTICLE_NOT_FOUND = 'RES_4005',
  PAYMENT_NOT_FOUND = 'RES_4006',
  SUBSCRIPTION_NOT_FOUND = 'RES_4007',
  TEMPLATE_NOT_FOUND = 'RES_4008',
  RESOURCE_ALREADY_EXISTS = 'RES_4009',
  EMAIL_ALREADY_EXISTS = 'RES_4010',
  USERNAME_ALREADY_EXISTS = 'RES_4011',
  RESOURCE_DELETED = 'RES_4012',
  DUPLICATE_ENTRY = 'RES_4013',

  // Rate Limiting Errors (5xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_5001',
  TOO_MANY_LOGIN_ATTEMPTS = 'RATE_5002',
  TOO_MANY_PASSWORD_RESET_ATTEMPTS = 'RATE_5003',
  TOO_MANY_EMAIL_ATTEMPTS = 'RATE_5004',
  TOO_MANY_REQUESTS = 'RATE_5005',

  // Database Errors (6xxx)
  DATABASE_ERROR = 'DB_6001',
  DATABASE_CONNECTION_ERROR = 'DB_6002',
  DATABASE_QUERY_ERROR = 'DB_6003',
  DATABASE_CONSTRAINT_ERROR = 'DB_6004',
  DATABASE_TRANSACTION_ERROR = 'DB_6005',

  // File Upload Errors (7xxx)
  FILE_UPLOAD_ERROR = 'FILE_7001',
  FILE_TOO_LARGE = 'FILE_7002',
  INVALID_FILE_TYPE = 'FILE_7003',
  FILE_NOT_FOUND = 'FILE_7004',

  // Email Errors (8xxx)
  EMAIL_SEND_ERROR = 'EMAIL_8001',
  EMAIL_SERVICE_UNAVAILABLE = 'EMAIL_8002',
  INVALID_EMAIL_TEMPLATE = 'EMAIL_8003',

  // Payment Errors (9xxx)
  PAYMENT_ERROR = 'PAY_9001',
  PAYMENT_FAILED = 'PAY_9002',
  PAYMENT_CANCELLED = 'PAY_9003',
  PAYMENT_METHOD_INVALID = 'PAY_9004',

  // Business Logic Errors (10xxx)
  BUSINESS_RULE_VIOLATION = 'BIZ_10001',
  MEMBERSHIP_EXPIRED = 'BIZ_10002',
  COURSE_FULL = 'BIZ_10003',
  ALREADY_REGISTERED = 'BIZ_10004',
  INSUFFICIENT_STOCK = 'BIZ_10005',
  INVALID_STATUS_TRANSITION = 'BIZ_10006',
  OPERATION_NOT_ALLOWED = 'BIZ_10007',
  CONFLICT = 'BIZ_10008',

  // System Errors (11xxx)
  INTERNAL_SERVER_ERROR = 'SYS_11001',
  SERVICE_UNAVAILABLE = 'SYS_11002',
  CONFIGURATION_ERROR = 'SYS_11003',
  EXTERNAL_SERVICE_ERROR = 'SYS_11004',

  // GDPR / Privacy Errors (12xxx)
  GDPR_CONSENT_REQUIRED = 'GDPR_12001',
  DATA_EXPORT_ERROR = 'GDPR_12002',
  DATA_DELETION_ERROR = 'GDPR_12003',
}

// ============================================================================
// ERROR SEVERITY LEVELS
// ============================================================================

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// ============================================================================
// ERROR CATEGORIES
// ============================================================================

export enum ErrorCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  RESOURCE = 'RESOURCE',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  FILE = 'FILE',
  EMAIL = 'EMAIL',
  PAYMENT = 'PAYMENT',
  BUSINESS = 'BUSINESS',
  SYSTEM = 'SYSTEM',
  GDPR = 'GDPR',
}

// ============================================================================
// ERROR INTERFACES
// ============================================================================

export interface AppError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  details?: any;
  timestamp?: Date;
  path?: string;
  stack?: string;
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

export interface ValidationErrorResponse {
  code: ErrorCode;
  message: string;
  statusCode: number;
  errors: ValidationErrorDetail[];
}

export interface DatabaseErrorDetail {
  query?: string;
  table?: string;
  constraint?: string;
  originalError?: any;
}

export interface ExternalServiceError {
  service: string;
  operation: string;
  statusCode?: number;
  message: string;
  originalError?: any;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    statusCode?: number;
    category?: ErrorCategory;
    severity?: ErrorSeverity;
    details?: any;
    errors?: any[];
    timestamp: string;
    path?: string;
    requestId?: string;
  };
}

export interface GraphQLErrorResponse {
  errors: Array<{
    message: string;
    extensions?: {
      code: ErrorCode | string;
      statusCode?: number;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      details?: any;
      timestamp?: string;
      path?: string;
    };
    path?: (string | number)[];
    locations?: Array<{
      line: number;
      column: number;
    }>;
  }>;
}

// ============================================================================
// ERROR METADATA
// ============================================================================

export interface ErrorMetadata {
  userId?: number | string;
  ipAddress?: string;
  userAgent?: string;
  operationName?: string;
  query?: string;
  variables?: any;
  context?: Record<string, any>;
}

// ============================================================================
// ERROR HANDLER OPTIONS
// ============================================================================

export interface ErrorHandlerConfig {
  exposeStackTrace: boolean;
  logErrors: boolean;
  sendToSentry: boolean;
  includeMetadata: boolean;
  customFormatter?: (error: any) => ErrorResponse;
}

// ============================================================================
// CUSTOM ERROR CLASSES (TYPE DEFINITIONS)
// ============================================================================

export interface AuthenticationError {
  name: 'AuthenticationError';
  code: ErrorCode;
  message: string;
  statusCode: 401;
}

export interface AuthorizationError {
  name: 'AuthorizationError';
  code: ErrorCode;
  message: string;
  statusCode: 403;
  requiredPermissions?: string[];
  userPermissions?: string[];
}

export interface ValidationError {
  name: 'ValidationError';
  code: ErrorCode;
  message: string;
  statusCode: 400;
  errors: ValidationErrorDetail[];
}

export interface NotFoundError {
  name: 'NotFoundError';
  code: ErrorCode;
  message: string;
  statusCode: 404;
  resource?: string;
  resourceId?: string | number;
}

export interface ConflictError {
  name: 'ConflictError';
  code: ErrorCode;
  message: string;
  statusCode: 409;
  conflictingField?: string;
  conflictingValue?: any;
}

export interface RateLimitError {
  name: 'RateLimitError';
  code: ErrorCode;
  message: string;
  statusCode: 429;
  retryAfter?: number;
  limit?: number;
  remaining?: number;
}

export interface InternalServerError {
  name: 'InternalServerError';
  code: ErrorCode;
  message: string;
  statusCode: 500;
  originalError?: any;
}

export interface ServiceUnavailableError {
  name: 'ServiceUnavailableError';
  code: ErrorCode;
  message: string;
  statusCode: 503;
  service?: string;
}

export interface BadRequestError {
  name: 'BadRequestError';
  code: ErrorCode;
  message: string;
  statusCode: 400;
  details?: any;
}

// ============================================================================
// ERROR MAPPING
// ============================================================================

export interface ErrorCodeMapping {
  code: ErrorCode;
  httpStatus: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  defaultMessage: string;
  userFriendlyMessage?: string;
}

export const ERROR_CODE_MAP: Record<ErrorCode, Omit<ErrorCodeMapping, 'code'>> = {
  // Authentication Errors
  [ErrorCode.INVALID_CREDENTIALS]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid email or password',
    userFriendlyMessage: 'Les identifiants fournis sont incorrects',
  },
  [ErrorCode.ACCOUNT_LOCKED]: {
    httpStatus: 423,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'Account is locked due to multiple failed login attempts',
    userFriendlyMessage: 'Votre compte est verrouillé',
  },
  [ErrorCode.ACCOUNT_NOT_VERIFIED]: {
    httpStatus: 403,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Account email is not verified',
    userFriendlyMessage: 'Veuillez vérifier votre email',
  },
  [ErrorCode.EMAIL_NOT_VERIFIED]: {
    httpStatus: 403,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Email address is not verified',
    userFriendlyMessage: 'Email non vérifié',
  },
  [ErrorCode.INVALID_TOKEN]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Invalid authentication token',
    userFriendlyMessage: 'Token invalide',
  },
  [ErrorCode.TOKEN_EXPIRED]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Authentication token has expired',
    userFriendlyMessage: 'Session expirée',
  },
  [ErrorCode.REFRESH_TOKEN_INVALID]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Invalid refresh token',
    userFriendlyMessage: 'Token de rafraîchissement invalide',
  },
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Refresh token has expired',
    userFriendlyMessage: 'Token de rafraîchissement expiré',
  },
  [ErrorCode.SESSION_INVALID]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Invalid session',
    userFriendlyMessage: 'Session invalide',
  },
  [ErrorCode.SESSION_EXPIRED]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Session has expired',
    userFriendlyMessage: 'Session expirée',
  },
  [ErrorCode.PASSWORD_RESET_TOKEN_INVALID]: {
    httpStatus: 400,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Invalid password reset token',
    userFriendlyMessage: 'Lien de réinitialisation invalide',
  },
  [ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED]: {
    httpStatus: 400,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Password reset token has expired',
    userFriendlyMessage: 'Lien de réinitialisation expiré',
  },
  [ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID]: {
    httpStatus: 400,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Invalid email verification token',
    userFriendlyMessage: 'Lien de vérification invalide',
  },
  [ErrorCode.EMAIL_VERIFICATION_TOKEN_EXPIRED]: {
    httpStatus: 400,
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Email verification token has expired',
    userFriendlyMessage: 'Lien de vérification expiré',
  },

  // Authorization Errors
  [ErrorCode.UNAUTHORIZED]: {
    httpStatus: 401,
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Authentication required',
    userFriendlyMessage: 'Authentification requise',
  },
  [ErrorCode.FORBIDDEN]: {
    httpStatus: 403,
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Access denied',
    userFriendlyMessage: 'Accès refusé',
  },
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: {
    httpStatus: 403,
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Insufficient permissions',
    userFriendlyMessage: 'Permissions insuffisantes',
  },
  [ErrorCode.ROLE_REQUIRED]: {
    httpStatus: 403,
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Required role not assigned',
    userFriendlyMessage: 'Rôle requis non attribué',
  },
  [ErrorCode.ADMIN_REQUIRED]: {
    httpStatus: 403,
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Admin privileges required',
    userFriendlyMessage: 'Privilèges administrateur requis',
  },
  [ErrorCode.OWNER_REQUIRED]: {
    httpStatus: 403,
    category: ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Resource owner access required',
    userFriendlyMessage: 'Accès propriétaire requis',
  },

  // Validation Errors
  [ErrorCode.VALIDATION_ERROR]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Validation error',
    userFriendlyMessage: 'Erreur de validation',
  },
  [ErrorCode.INVALID_EMAIL]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid email format',
    userFriendlyMessage: 'Format d\'email invalide',
  },
  [ErrorCode.INVALID_PASSWORD]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid password',
    userFriendlyMessage: 'Mot de passe invalide',
  },
  [ErrorCode.PASSWORD_TOO_WEAK]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Password does not meet strength requirements',
    userFriendlyMessage: 'Mot de passe trop faible',
  },
  [ErrorCode.INVALID_DATE]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid date format',
    userFriendlyMessage: 'Format de date invalide',
  },
  [ErrorCode.INVALID_FORMAT]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid format',
    userFriendlyMessage: 'Format invalide',
  },
  [ErrorCode.REQUIRED_FIELD_MISSING]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Required field is missing',
    userFriendlyMessage: 'Champ requis manquant',
  },
  [ErrorCode.INVALID_INPUT]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid input provided',
    userFriendlyMessage: 'Entrée invalide',
  },
  [ErrorCode.INVALID_ID]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid ID format',
    userFriendlyMessage: 'Format d\'ID invalide',
  },
  [ErrorCode.INVALID_PHONE]: {
    httpStatus: 400,
    category: ErrorCategory.VALIDATION,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid phone number',
    userFriendlyMessage: 'Numéro de téléphone invalide',
  },

  // Resource Errors
  [ErrorCode.RESOURCE_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Resource not found',
    userFriendlyMessage: 'Ressource non trouvée',
  },
  [ErrorCode.USER_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'User not found',
    userFriendlyMessage: 'Utilisateur non trouvé',
  },
  [ErrorCode.COURSE_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Course not found',
    userFriendlyMessage: 'Cours non trouvé',
  },
  [ErrorCode.ORDER_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Order not found',
    userFriendlyMessage: 'Commande non trouvée',
  },
  [ErrorCode.ARTICLE_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Article not found',
    userFriendlyMessage: 'Article non trouvé',
  },
  [ErrorCode.PAYMENT_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Payment not found',
    userFriendlyMessage: 'Paiement non trouvé',
  },
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Subscription not found',
    userFriendlyMessage: 'Abonnement non trouvé',
  },
  [ErrorCode.TEMPLATE_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Template not found',
    userFriendlyMessage: 'Modèle non trouvé',
  },
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: {
    httpStatus: 409,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Resource already exists',
    userFriendlyMessage: 'Ressource existe déjà',
  },
  [ErrorCode.EMAIL_ALREADY_EXISTS]: {
    httpStatus: 409,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Email address already in use',
    userFriendlyMessage: 'Email déjà utilisé',
  },
  [ErrorCode.USERNAME_ALREADY_EXISTS]: {
    httpStatus: 409,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Username already taken',
    userFriendlyMessage: 'Nom d\'utilisateur déjà pris',
  },
  [ErrorCode.RESOURCE_DELETED]: {
    httpStatus: 410,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Resource has been deleted',
    userFriendlyMessage: 'Ressource supprimée',
  },
  [ErrorCode.DUPLICATE_ENTRY]: {
    httpStatus: 409,
    category: ErrorCategory.RESOURCE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Duplicate entry',
    userFriendlyMessage: 'Entrée en double',
  },

  // Rate Limiting Errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: {
    httpStatus: 429,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Rate limit exceeded',
    userFriendlyMessage: 'Trop de requêtes',
  },
  [ErrorCode.TOO_MANY_LOGIN_ATTEMPTS]: {
    httpStatus: 429,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'Too many login attempts',
    userFriendlyMessage: 'Trop de tentatives de connexion',
  },
  [ErrorCode.TOO_MANY_PASSWORD_RESET_ATTEMPTS]: {
    httpStatus: 429,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Too many password reset attempts',
    userFriendlyMessage: 'Trop de tentatives de réinitialisation',
  },
  [ErrorCode.TOO_MANY_EMAIL_ATTEMPTS]: {
    httpStatus: 429,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Too many email attempts',
    userFriendlyMessage: 'Trop d\'emails envoyés',
  },
  [ErrorCode.TOO_MANY_REQUESTS]: {
    httpStatus: 429,
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Too many requests',
    userFriendlyMessage: 'Trop de requêtes',
  },

  // Database Errors
  [ErrorCode.DATABASE_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    defaultMessage: 'Database error',
    userFriendlyMessage: 'Erreur de base de données',
  },
  [ErrorCode.DATABASE_CONNECTION_ERROR]: {
    httpStatus: 503,
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    defaultMessage: 'Database connection error',
    userFriendlyMessage: 'Erreur de connexion à la base de données',
  },
  [ErrorCode.DATABASE_QUERY_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'Database query error',
    userFriendlyMessage: 'Erreur de requête',
  },
  [ErrorCode.DATABASE_CONSTRAINT_ERROR]: {
    httpStatus: 409,
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Database constraint violation',
    userFriendlyMessage: 'Violation de contrainte',
  },
  [ErrorCode.DATABASE_TRANSACTION_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'Database transaction error',
    userFriendlyMessage: 'Erreur de transaction',
  },

  // File Errors
  [ErrorCode.FILE_UPLOAD_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.FILE,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'File upload error',
    userFriendlyMessage: 'Erreur de téléchargement',
  },
  [ErrorCode.FILE_TOO_LARGE]: {
    httpStatus: 413,
    category: ErrorCategory.FILE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'File size exceeds limit',
    userFriendlyMessage: 'Fichier trop volumineux',
  },
  [ErrorCode.INVALID_FILE_TYPE]: {
    httpStatus: 400,
    category: ErrorCategory.FILE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid file type',
    userFriendlyMessage: 'Type de fichier invalide',
  },
  [ErrorCode.FILE_NOT_FOUND]: {
    httpStatus: 404,
    category: ErrorCategory.FILE,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'File not found',
    userFriendlyMessage: 'Fichier non trouvé',
  },

  // Email Errors
  [ErrorCode.EMAIL_SEND_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.EMAIL,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Failed to send email',
    userFriendlyMessage: 'Erreur d\'envoi d\'email',
  },
  [ErrorCode.EMAIL_SERVICE_UNAVAILABLE]: {
    httpStatus: 503,
    category: ErrorCategory.EMAIL,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'Email service unavailable',
    userFriendlyMessage: 'Service d\'email indisponible',
  },
  [ErrorCode.INVALID_EMAIL_TEMPLATE]: {
    httpStatus: 500,
    category: ErrorCategory.EMAIL,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Invalid email template',
    userFriendlyMessage: 'Modèle d\'email invalide',
  },

  // Payment Errors
  [ErrorCode.PAYMENT_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.PAYMENT,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'Payment processing error',
    userFriendlyMessage: 'Erreur de paiement',
  },
  [ErrorCode.PAYMENT_FAILED]: {
    httpStatus: 402,
    category: ErrorCategory.PAYMENT,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Payment failed',
    userFriendlyMessage: 'Paiement échoué',
  },
  [ErrorCode.PAYMENT_CANCELLED]: {
    httpStatus: 400,
    category: ErrorCategory.PAYMENT,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Payment cancelled',
    userFriendlyMessage: 'Paiement annulé',
  },
  [ErrorCode.PAYMENT_METHOD_INVALID]: {
    httpStatus: 400,
    category: ErrorCategory.PAYMENT,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Invalid payment method',
    userFriendlyMessage: 'Méthode de paiement invalide',
  },

  // Business Logic Errors
  [ErrorCode.BUSINESS_RULE_VIOLATION]: {
    httpStatus: 422,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Business rule violation',
    userFriendlyMessage: 'Règle métier violée',
  },
  [ErrorCode.MEMBERSHIP_EXPIRED]: {
    httpStatus: 403,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Membership has expired',
    userFriendlyMessage: 'Abonnement expiré',
  },
  [ErrorCode.COURSE_FULL]: {
    httpStatus: 409,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Course is full',
    userFriendlyMessage: 'Cours complet',
  },
  [ErrorCode.ALREADY_REGISTERED]: {
    httpStatus: 409,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Already registered',
    userFriendlyMessage: 'Déjà inscrit',
  },
  [ErrorCode.INSUFFICIENT_STOCK]: {
    httpStatus: 409,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.LOW,
    defaultMessage: 'Insufficient stock',
    userFriendlyMessage: 'Stock insuffisant',
  },
  [ErrorCode.INVALID_STATUS_TRANSITION]: {
    httpStatus: 422,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Invalid status transition',
    userFriendlyMessage: 'Transition de statut invalide',
  },
  [ErrorCode.OPERATION_NOT_ALLOWED]: {
    httpStatus: 403,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Operation not allowed',
    userFriendlyMessage: 'Opération non autorisée',
  },
  [ErrorCode.CONFLICT]: {
    httpStatus: 409,
    category: ErrorCategory.BUSINESS,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Conflict detected',
    userFriendlyMessage: 'Conflit détecté',
  },

  // System Errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    defaultMessage: 'Internal server error',
    userFriendlyMessage: 'Erreur interne du serveur',
  },
  [ErrorCode.SERVICE_UNAVAILABLE]: {
    httpStatus: 503,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    defaultMessage: 'Service temporarily unavailable',
    userFriendlyMessage: 'Service temporairement indisponible',
  },
  [ErrorCode.CONFIGURATION_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.CRITICAL,
    defaultMessage: 'Configuration error',
    userFriendlyMessage: 'Erreur de configuration',
  },
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: {
    httpStatus: 502,
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'External service error',
    userFriendlyMessage: 'Erreur de service externe',
  },

  // GDPR Errors
  [ErrorCode.GDPR_CONSENT_REQUIRED]: {
    httpStatus: 451,
    category: ErrorCategory.GDPR,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'GDPR consent required',
    userFriendlyMessage: 'Consentement RGPD requis',
  },
  [ErrorCode.DATA_EXPORT_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.GDPR,
    severity: ErrorSeverity.MEDIUM,
    defaultMessage: 'Data export error',
    userFriendlyMessage: 'Erreur d\'export de données',
  },
  [ErrorCode.DATA_DELETION_ERROR]: {
    httpStatus: 500,
    category: ErrorCategory.GDPR,
    severity: ErrorSeverity.HIGH,
    defaultMessage: 'Data deletion error',
    userFriendlyMessage: 'Erreur de suppression de données',
  },
};
