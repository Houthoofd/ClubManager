/**
 * Error Codes
 *
 * Centralized error codes for the entire application.
 * These codes are used for client-side error handling and i18n.
 */

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
  TWO_FACTOR_REQUIRED = 'AUTH_1011',
  TWO_FACTOR_INVALID = 'AUTH_1012',
  PASSWORD_RESET_TOKEN_INVALID = 'AUTH_1013',
  PASSWORD_RESET_TOKEN_EXPIRED = 'AUTH_1014',

  // Authorization Errors (2xxx)
  UNAUTHORIZED = 'AUTHZ_2001',
  FORBIDDEN = 'AUTHZ_2002',
  INSUFFICIENT_PERMISSIONS = 'AUTHZ_2003',
  RESOURCE_FORBIDDEN = 'AUTHZ_2004',
  ADMIN_REQUIRED = 'AUTHZ_2005',
  OWNER_REQUIRED = 'AUTHZ_2006',

  // Validation Errors (3xxx)
  VALIDATION_ERROR = 'VAL_3001',
  INVALID_EMAIL = 'VAL_3002',
  INVALID_PASSWORD = 'VAL_3003',
  PASSWORD_TOO_WEAK = 'VAL_3004',
  PASSWORD_MISMATCH = 'VAL_3005',
  INVALID_INPUT = 'VAL_3006',
  MISSING_REQUIRED_FIELD = 'VAL_3007',
  INVALID_FORMAT = 'VAL_3008',
  INVALID_DATE = 'VAL_3009',
  INVALID_PHONE = 'VAL_3010',

  // Resource Errors (4xxx)
  RESOURCE_NOT_FOUND = 'RES_4001',
  USER_NOT_FOUND = 'RES_4002',
  COURSE_NOT_FOUND = 'RES_4003',
  CLUB_NOT_FOUND = 'RES_4004',
  MEMBERSHIP_NOT_FOUND = 'RES_4005',
  RESOURCE_ALREADY_EXISTS = 'RES_4010',
  USER_ALREADY_EXISTS = 'RES_4011',
  EMAIL_ALREADY_EXISTS = 'RES_4012',
  DUPLICATE_ENTRY = 'RES_4013',

  // Rate Limiting Errors (5xxx)
  RATE_LIMIT_EXCEEDED = 'RATE_5001',
  TOO_MANY_LOGIN_ATTEMPTS = 'RATE_5002',
  TOO_MANY_PASSWORD_RESET_ATTEMPTS = 'RATE_5003',
  TOO_MANY_EMAIL_VERIFICATION_ATTEMPTS = 'RATE_5004',
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
  INSUFFICIENT_FUNDS = 'PAY_9003',
  PAYMENT_METHOD_INVALID = 'PAY_9004',

  // Business Logic Errors (10xxx)
  BUSINESS_RULE_VIOLATION = 'BIZ_10001',
  MEMBERSHIP_EXPIRED = 'BIZ_10002',
  MEMBERSHIP_NOT_ACTIVE = 'BIZ_10003',
  COURSE_FULL = 'BIZ_10004',
  COURSE_ALREADY_ENROLLED = 'BIZ_10005',
  COURSE_NOT_AVAILABLE = 'BIZ_10006',
  INVALID_DATE_RANGE = 'BIZ_10007',
  CONFLICT = 'BIZ_10008',

  // System Errors (11xxx)
  INTERNAL_SERVER_ERROR = 'SYS_11001',
  SERVICE_UNAVAILABLE = 'SYS_11002',
  MAINTENANCE_MODE = 'SYS_11003',
  EXTERNAL_SERVICE_ERROR = 'SYS_11004',

  // GDPR / Privacy Errors (12xxx)
  GDPR_CONSENT_REQUIRED = 'GDPR_12001',
  DATA_EXPORT_ERROR = 'GDPR_12002',
  DATA_DELETION_ERROR = 'GDPR_12003',
  PRIVACY_VIOLATION = 'GDPR_12004',
}

/**
 * Error messages mapping
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.INVALID_CREDENTIALS]: 'Email ou mot de passe invalide',
  [ErrorCode.ACCOUNT_LOCKED]: 'Compte verrouillé suite à trop de tentatives échouées',
  [ErrorCode.ACCOUNT_NOT_VERIFIED]: 'Compte non vérifié',
  [ErrorCode.EMAIL_NOT_VERIFIED]: 'Email non vérifié',
  [ErrorCode.INVALID_TOKEN]: 'Token invalide',
  [ErrorCode.TOKEN_EXPIRED]: 'Token expiré',
  [ErrorCode.REFRESH_TOKEN_INVALID]: 'Refresh token invalide',
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 'Refresh token expiré',
  [ErrorCode.SESSION_INVALID]: 'Session invalide',
  [ErrorCode.SESSION_EXPIRED]: 'Session expirée',
  [ErrorCode.TWO_FACTOR_REQUIRED]: 'Authentification à deux facteurs requise',
  [ErrorCode.TWO_FACTOR_INVALID]: 'Code 2FA invalide',
  [ErrorCode.PASSWORD_RESET_TOKEN_INVALID]: 'Token de réinitialisation invalide',
  [ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED]: 'Token de réinitialisation expiré',

  // Authorization
  [ErrorCode.UNAUTHORIZED]: 'Non authentifié',
  [ErrorCode.FORBIDDEN]: 'Accès interdit',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Permissions insuffisantes',
  [ErrorCode.RESOURCE_FORBIDDEN]: 'Accès à cette ressource interdit',
  [ErrorCode.ADMIN_REQUIRED]: 'Droits administrateur requis',
  [ErrorCode.OWNER_REQUIRED]: 'Seul le propriétaire peut effectuer cette action',

  // Validation
  [ErrorCode.VALIDATION_ERROR]: 'Erreur de validation',
  [ErrorCode.INVALID_EMAIL]: 'Email invalide',
  [ErrorCode.INVALID_PASSWORD]: 'Mot de passe invalide',
  [ErrorCode.PASSWORD_TOO_WEAK]: 'Mot de passe trop faible',
  [ErrorCode.PASSWORD_MISMATCH]: 'Les mots de passe ne correspondent pas',
  [ErrorCode.INVALID_INPUT]: 'Données invalides',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Champ requis manquant',
  [ErrorCode.INVALID_FORMAT]: 'Format invalide',
  [ErrorCode.INVALID_DATE]: 'Date invalide',
  [ErrorCode.INVALID_PHONE]: 'Numéro de téléphone invalide',

  // Resources
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Ressource non trouvée',
  [ErrorCode.USER_NOT_FOUND]: 'Utilisateur non trouvé',
  [ErrorCode.COURSE_NOT_FOUND]: 'Cours non trouvé',
  [ErrorCode.CLUB_NOT_FOUND]: 'Club non trouvé',
  [ErrorCode.MEMBERSHIP_NOT_FOUND]: 'Adhésion non trouvée',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Ressource existe déjà',
  [ErrorCode.USER_ALREADY_EXISTS]: 'Utilisateur existe déjà',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email déjà utilisé',
  [ErrorCode.DUPLICATE_ENTRY]: 'Entrée dupliquée',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Limite de taux dépassée',
  [ErrorCode.TOO_MANY_LOGIN_ATTEMPTS]: 'Trop de tentatives de connexion',
  [ErrorCode.TOO_MANY_PASSWORD_RESET_ATTEMPTS]: 'Trop de demandes de réinitialisation',
  [ErrorCode.TOO_MANY_EMAIL_VERIFICATION_ATTEMPTS]: 'Trop de demandes de vérification',
  [ErrorCode.TOO_MANY_REQUESTS]: 'Trop de requêtes',

  // Database
  [ErrorCode.DATABASE_ERROR]: 'Erreur de base de données',
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 'Erreur de connexion à la base de données',
  [ErrorCode.DATABASE_QUERY_ERROR]: 'Erreur de requête',
  [ErrorCode.DATABASE_CONSTRAINT_ERROR]: 'Violation de contrainte',
  [ErrorCode.DATABASE_TRANSACTION_ERROR]: 'Erreur de transaction',

  // File Upload
  [ErrorCode.FILE_UPLOAD_ERROR]: 'Erreur de téléchargement',
  [ErrorCode.FILE_TOO_LARGE]: 'Fichier trop volumineux',
  [ErrorCode.INVALID_FILE_TYPE]: 'Type de fichier invalide',
  [ErrorCode.FILE_NOT_FOUND]: 'Fichier non trouvé',

  // Email
  [ErrorCode.EMAIL_SEND_ERROR]: 'Erreur d\'envoi d\'email',
  [ErrorCode.EMAIL_SERVICE_UNAVAILABLE]: 'Service email indisponible',
  [ErrorCode.INVALID_EMAIL_TEMPLATE]: 'Template email invalide',

  // Payment
  [ErrorCode.PAYMENT_ERROR]: 'Erreur de paiement',
  [ErrorCode.PAYMENT_FAILED]: 'Paiement échoué',
  [ErrorCode.INSUFFICIENT_FUNDS]: 'Fonds insuffisants',
  [ErrorCode.PAYMENT_METHOD_INVALID]: 'Moyen de paiement invalide',

  // Business Logic
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Violation de règle métier',
  [ErrorCode.MEMBERSHIP_EXPIRED]: 'Adhésion expirée',
  [ErrorCode.MEMBERSHIP_NOT_ACTIVE]: 'Adhésion non active',
  [ErrorCode.COURSE_FULL]: 'Cours complet',
  [ErrorCode.COURSE_ALREADY_ENROLLED]: 'Déjà inscrit à ce cours',
  [ErrorCode.COURSE_NOT_AVAILABLE]: 'Cours non disponible',
  [ErrorCode.INVALID_DATE_RANGE]: 'Plage de dates invalide',
  [ErrorCode.CONFLICT]: 'Conflit détecté',

  // System
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Erreur interne du serveur',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service indisponible',
  [ErrorCode.MAINTENANCE_MODE]: 'Maintenance en cours',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Erreur de service externe',

  // GDPR / Privacy
  [ErrorCode.GDPR_CONSENT_REQUIRED]: 'Consentement RGPD requis',
  [ErrorCode.DATA_EXPORT_ERROR]: 'Erreur d\'export de données',
  [ErrorCode.DATA_DELETION_ERROR]: 'Erreur de suppression de données',
  [ErrorCode.PRIVACY_VIOLATION]: 'Violation de confidentialité',
};

/**
 * Get error message by code
 */
export function getErrorMessage(code: ErrorCode): string {
  return ErrorMessages[code] || 'Une erreur est survenue';
}

/**
 * HTTP status codes mapping
 */
export const ErrorHttpStatus: Record<ErrorCode, number> = {
  // Authentication - 401
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.ACCOUNT_LOCKED]: 423,
  [ErrorCode.ACCOUNT_NOT_VERIFIED]: 403,
  [ErrorCode.EMAIL_NOT_VERIFIED]: 403,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.REFRESH_TOKEN_INVALID]: 401,
  [ErrorCode.REFRESH_TOKEN_EXPIRED]: 401,
  [ErrorCode.SESSION_INVALID]: 401,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.TWO_FACTOR_REQUIRED]: 403,
  [ErrorCode.TWO_FACTOR_INVALID]: 401,
  [ErrorCode.PASSWORD_RESET_TOKEN_INVALID]: 400,
  [ErrorCode.PASSWORD_RESET_TOKEN_EXPIRED]: 400,

  // Authorization - 403
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.RESOURCE_FORBIDDEN]: 403,
  [ErrorCode.ADMIN_REQUIRED]: 403,
  [ErrorCode.OWNER_REQUIRED]: 403,

  // Validation - 400
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_EMAIL]: 400,
  [ErrorCode.INVALID_PASSWORD]: 400,
  [ErrorCode.PASSWORD_TOO_WEAK]: 400,
  [ErrorCode.PASSWORD_MISMATCH]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCode.INVALID_FORMAT]: 400,
  [ErrorCode.INVALID_DATE]: 400,
  [ErrorCode.INVALID_PHONE]: 400,

  // Resources
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.COURSE_NOT_FOUND]: 404,
  [ErrorCode.CLUB_NOT_FOUND]: 404,
  [ErrorCode.MEMBERSHIP_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.DUPLICATE_ENTRY]: 409,

  // Rate Limiting - 429
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorCode.TOO_MANY_LOGIN_ATTEMPTS]: 429,
  [ErrorCode.TOO_MANY_PASSWORD_RESET_ATTEMPTS]: 429,
  [ErrorCode.TOO_MANY_EMAIL_VERIFICATION_ATTEMPTS]: 429,
  [ErrorCode.TOO_MANY_REQUESTS]: 429,

  // Database - 500
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.DATABASE_CONNECTION_ERROR]: 500,
  [ErrorCode.DATABASE_QUERY_ERROR]: 500,
  [ErrorCode.DATABASE_CONSTRAINT_ERROR]: 500,
  [ErrorCode.DATABASE_TRANSACTION_ERROR]: 500,

  // File Upload - 400/413
  [ErrorCode.FILE_UPLOAD_ERROR]: 500,
  [ErrorCode.FILE_TOO_LARGE]: 413,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.FILE_NOT_FOUND]: 404,

  // Email - 500
  [ErrorCode.EMAIL_SEND_ERROR]: 500,
  [ErrorCode.EMAIL_SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.INVALID_EMAIL_TEMPLATE]: 500,

  // Payment - 402
  [ErrorCode.PAYMENT_ERROR]: 402,
  [ErrorCode.PAYMENT_FAILED]: 402,
  [ErrorCode.INSUFFICIENT_FUNDS]: 402,
  [ErrorCode.PAYMENT_METHOD_INVALID]: 400,

  // Business Logic - 400/409
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 400,
  [ErrorCode.MEMBERSHIP_EXPIRED]: 403,
  [ErrorCode.MEMBERSHIP_NOT_ACTIVE]: 403,
  [ErrorCode.COURSE_FULL]: 409,
  [ErrorCode.COURSE_ALREADY_ENROLLED]: 409,
  [ErrorCode.COURSE_NOT_AVAILABLE]: 403,
  [ErrorCode.INVALID_DATE_RANGE]: 400,
  [ErrorCode.CONFLICT]: 409,

  // System - 500
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.SERVICE_UNAVAILABLE]: 503,
  [ErrorCode.MAINTENANCE_MODE]: 503,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,

  // GDPR / Privacy
  [ErrorCode.GDPR_CONSENT_REQUIRED]: 403,
  [ErrorCode.DATA_EXPORT_ERROR]: 500,
  [ErrorCode.DATA_DELETION_ERROR]: 500,
  [ErrorCode.PRIVACY_VIOLATION]: 403,
};

/**
 * Get HTTP status code for error code
 */
export function getHttpStatus(code: ErrorCode): number {
  return ErrorHttpStatus[code] || 500;
}
