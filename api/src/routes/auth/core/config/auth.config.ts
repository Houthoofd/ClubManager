/**
 * Authentication Configuration
 *
 * Configuration centralisée pour l'authentification :
 * - JWT tokens (access & refresh)
 * - Rate limiting
 * - Sessions
 * - Password policy
 */

// ===== TOKEN CONFIGURATION =====
export const TOKEN_CONFIG = {
  // Access Token (JWT court terme)
  ACCESS_TOKEN: {
    SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
    EXPIRES_IN: "15m", // 15 minutes
    ALGORITHM: "HS256" as const,
    expiresInMs: 15 * 60 * 1000, // 15 minutes en millisecondes
  },

  // Refresh Token (JWT long terme)
  REFRESH_TOKEN: {
    SECRET:
      process.env.JWT_REFRESH_SECRET ||
      process.env.JWT_SECRET ||
      "your-refresh-secret-key",
    EXPIRES_IN: "7d", // 7 jours
    ALGORITHM: "HS256" as const,
    expiresInMs: 7 * 24 * 60 * 60 * 1000, // 7 jours en millisecondes
  },

  // Reset Password Token
  RESET_PASSWORD_TOKEN: {
    EXPIRES_IN: "1h", // 1 heure
    expiresInMs: 60 * 60 * 1000, // 1 heure en millisecondes
  },

  // Email Verification Token
  EMAIL_VERIFICATION_TOKEN: {
    EXPIRES_IN: "24h", // 24 heures
    expiresInMs: 24 * 60 * 60 * 1000, // 24 heures en millisecondes
  },
} as const;

// ===== RATE LIMITING CONFIGURATION =====
export const RATE_LIMIT_CONFIG = {
  // Login attempts
  LOGIN: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    BLOCK_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  },

  // Password reset requests
  PASSWORD_RESET: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 heure
    BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 heure
  },

  // Email verification
  EMAIL_VERIFICATION: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 60 * 60 * 1000, // 1 heure
    BLOCK_DURATION_MS: 30 * 60 * 1000, // 30 minutes
  },

  // API general
  API: {
    MAX_ATTEMPTS: 100,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },

  // Registration
  REGISTRATION: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 60 * 60 * 1000, // 1 heure
    BLOCK_DURATION_MS: 60 * 60 * 1000, // 1 heure
  },
} as const;

// ===== SESSION CONFIGURATION =====
export const SESSION_CONFIG = {
  // Session duration
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 heures

  // Session cleanup
  CLEANUP_INTERVAL_MS: 60 * 60 * 1000, // 1 heure

  // Max sessions per user
  MAX_SESSIONS_PER_USER: 5,

  // Session cookie name
  COOKIE_NAME: "sessionId",

  // Session storage
  STORE_TYPE: process.env.SESSION_STORE || "memory", // 'memory' | 'redis' | 'database'
} as const;

// ===== PASSWORD POLICY =====
export const PASSWORD_CONFIG = {
  // Longueur minimale
  MIN_LENGTH: 8,

  // Longueur maximale
  MAX_LENGTH: 128,

  // Exigences de complexité
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: false,

  // Caractères spéciaux autorisés
  SPECIAL_CHARS: "!@#$%^&*()_+-=[]{}|;:,.<>?",

  // Nombre de rounds pour bcrypt
  BCRYPT_ROUNDS: 10,

  // Historique des mots de passe (éviter la réutilisation)
  PASSWORD_HISTORY_COUNT: 5,
} as const;

// ===== STORAGE CONFIGURATION =====
export const STORAGE_CONFIG = {
  // Type de stockage pour rate limiting
  RATE_LIMIT_STORE: process.env.RATE_LIMIT_STORE || "memory", // 'memory' | 'redis'

  // Redis configuration (si utilisé)
  REDIS: {
    HOST: process.env.REDIS_HOST || "localhost",
    PORT: parseInt(process.env.REDIS_PORT || "6379"),
    PASSWORD: process.env.REDIS_PASSWORD,
    DB: parseInt(process.env.REDIS_DB || "0"),
    KEY_PREFIX: "clubmanager:auth:",
  },
} as const;

// ===== SECURITY CONFIGURATION =====
export const SECURITY_CONFIG = {
  // CORS
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
    CREDENTIALS: true,
  },

  // Cookies
  COOKIE: {
    HTTP_ONLY: true,
    SECURE: process.env.NODE_ENV === "production",
    SAME_SITE: "strict" as const,
    DOMAIN: process.env.COOKIE_DOMAIN,
  },

  // CSRF Protection
  CSRF: {
    ENABLED: process.env.CSRF_ENABLED === "true",
    TOKEN_LENGTH: 32,
  },

  // Account lockout après échecs répétés
  ACCOUNT_LOCKOUT: {
    ENABLED: true,
    MAX_FAILED_ATTEMPTS: 10,
    LOCKOUT_DURATION_MS: 30 * 60 * 1000, // 30 minutes
    RESET_AFTER_SUCCESS: true,
  },
} as const;

// ===== VALIDATION CONFIGURATION =====
export const VALIDATION_CONFIG = {
  EMAIL: {
    MAX_LENGTH: 255,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    REGEX: /^[a-zA-Z0-9_-]+$/,
  },

  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    REGEX: /^[a-zA-ZÀ-ÿ\s-']+$/,
  },
} as const;

// ===== FEATURE FLAGS =====
export const FEATURE_FLAGS = {
  // Activer la vérification d'email
  EMAIL_VERIFICATION_REQUIRED:
    process.env.EMAIL_VERIFICATION_REQUIRED === "true",

  // Activer l'authentification à deux facteurs
  TWO_FACTOR_AUTH_ENABLED: process.env.TWO_FACTOR_AUTH_ENABLED === "true",

  // Activer l'authentification sociale (OAuth)
  SOCIAL_AUTH_ENABLED: process.env.SOCIAL_AUTH_ENABLED === "true",

  // Activer la journalisation des tentatives de connexion
  LOGIN_ATTEMPT_LOGGING: true,

  // Activer la détection de devices suspects
  SUSPICIOUS_DEVICE_DETECTION: process.env.NODE_ENV === "production",
} as const;

// ===== AUDIT LOG CONFIGURATION =====
export const AUDIT_CONFIG = {
  // Événements à journaliser
  EVENTS: {
    LOGIN_SUCCESS: true,
    LOGIN_FAILURE: true,
    LOGOUT: true,
    PASSWORD_CHANGE: true,
    PASSWORD_RESET: true,
    EMAIL_VERIFICATION: true,
    ACCOUNT_LOCKED: true,
    ACCOUNT_UNLOCKED: true,
    TOKEN_REFRESH: false, // Peut être verbeux
    SESSION_CREATED: false,
    SESSION_DESTROYED: false,
  },

  // Rétention des logs
  RETENTION_DAYS: 90,

  // Inclure des détails sensibles (IP, user agent)
  INCLUDE_SENSITIVE_DATA: process.env.NODE_ENV === "production",
} as const;

// ===== EXPORT ALL =====
export const AUTH_CONFIG = {
  TOKEN: TOKEN_CONFIG,
  RATE_LIMIT: RATE_LIMIT_CONFIG,
  SESSION: SESSION_CONFIG,
  PASSWORD: PASSWORD_CONFIG,
  STORAGE: STORAGE_CONFIG,
  SECURITY: SECURITY_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  FEATURES: FEATURE_FLAGS,
  AUDIT: AUDIT_CONFIG,
} as const;

// Export default
export default AUTH_CONFIG;
