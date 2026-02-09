/**
 * Configuration centralisée pour l'authentification
 *
 * Contient tous les paramètres liés à :
 * - Tokens (access, refresh, reset password, email verification)
 * - Cookies (httpOnly, secure, sameSite, etc.)
 * - Rate limiting
 * - Account lockout
 * - Session management
 */

// ============================================================================
// Environment Variables
// ============================================================================

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = NODE_ENV === 'development';

// ============================================================================
// Token Configuration
// ============================================================================

export const TOKEN_CONFIG = {
  /**
   * Access Token (JWT)
   * Court lifetime, stocké en mémoire côté client
   */
  access: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: '15m', // 15 minutes
    expiresInMs: 15 * 60 * 1000,
  },

  /**
   * Refresh Token
   * Long lifetime, stocké en cookie httpOnly
   */
  refresh: {
    secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret',
    expiresIn: '7d', // 7 jours
    expiresInMs: 7 * 24 * 60 * 60 * 1000,
  },

  /**
   * Reset Password Token
   * Courte durée, lien envoyé par email
   */
  resetPassword: {
    expiresIn: '1h', // 1 heure
    expiresInMs: 60 * 60 * 1000,
  },

  /**
   * Email Verification Token
   * Durée moyenne, lien envoyé par email
   */
  emailVerification: {
    expiresIn: '24h', // 24 heures
    expiresInMs: 24 * 60 * 60 * 1000,
  },

  /**
   * Token rotation (pour refresh tokens)
   */
  rotation: {
    enabled: true,
    // Fenêtre de grâce pour accepter l'ancien token après rotation
    gracePeriodMs: 5000, // 5 secondes
  },
} as const;

// ============================================================================
// Cookie Configuration
// ============================================================================

export const COOKIE_CONFIG = {
  /**
   * Refresh Token Cookie
   */
  refreshToken: {
    name: 'refreshToken',
    httpOnly: true,
    secure: IS_PRODUCTION, // HTTPS uniquement en production
    sameSite: IS_PRODUCTION ? 'strict' : 'lax', // Protection CSRF
    path: '/',
    maxAge: TOKEN_CONFIG.refresh.expiresInMs,
    domain: process.env.COOKIE_DOMAIN || undefined, // undefined = current domain
  },

  /**
   * Session Cookie (optionnel, pour session ID si utilisé)
   */
  session: {
    name: 'sessionId',
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'strict' : 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000, // 24 heures
  },

  /**
   * Cookie options par défaut
   */
  defaults: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax' as const,
    path: '/',
  },
} as const;

// ============================================================================
// Rate Limiting Configuration
// ============================================================================

export const RATE_LIMIT_CONFIG = {
  /**
   * Login attempts
   * Limite stricte pour prévenir les attaques par force brute
   */
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5, // 5 tentatives max
    blockDurationMs: 15 * 60 * 1000, // Blocage 15 minutes après dépassement
    message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
  },

  /**
   * Password reset requests
   * Limite pour éviter l'abus (spam d'emails)
   */
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxAttempts: 3, // 3 demandes max
    blockDurationMs: 60 * 60 * 1000, // Blocage 1 heure
    message: 'Trop de demandes de réinitialisation. Veuillez réessayer plus tard.',
  },

  /**
   * Email verification requests
   */
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxAttempts: 5, // 5 renvois max
    blockDurationMs: 60 * 60 * 1000, // Blocage 1 heure
    message: 'Trop de demandes de vérification. Veuillez réessayer plus tard.',
  },

  /**
   * Registration
   */
  registration: {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxAttempts: 3, // 3 inscriptions max (par IP)
    blockDurationMs: 60 * 60 * 1000,
    message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.',
  },

  /**
   * Refresh token
   */
  refreshToken: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 20, // Plus permissif car utilisé automatiquement
    blockDurationMs: 15 * 60 * 1000,
    message: 'Trop de demandes de rafraîchissement de token.',
  },

  /**
   * General API rate limit (par utilisateur authentifié)
   */
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100, // 100 requêtes max
    blockDurationMs: 15 * 60 * 1000,
    message: 'Trop de requêtes. Veuillez ralentir.',
  },
} as const;

// ============================================================================
// Account Lockout Configuration
// ============================================================================

export const LOCKOUT_CONFIG = {
  /**
   * Nombre de tentatives échouées avant verrouillage
   */
  maxFailedAttempts: 5,

  /**
   * Durée du verrouillage (en millisecondes)
   */
  lockoutDurationMs: 30 * 60 * 1000, // 30 minutes

  /**
   * Fenêtre de temps pour compter les tentatives échouées
   */
  attemptWindowMs: 15 * 60 * 1000, // 15 minutes

  /**
   * Réinitialiser le compteur après une connexion réussie
   */
  resetOnSuccess: true,

  /**
   * Verrouillage progressif (augmente la durée à chaque verrouillage)
   */
  progressive: {
    enabled: true,
    multiplier: 2, // Double la durée à chaque verrouillage
    maxDurationMs: 24 * 60 * 60 * 1000, // Maximum 24 heures
  },
} as const;

// ============================================================================
// Session Configuration
// ============================================================================

export const SESSION_CONFIG = {
  /**
   * Durée maximale d'une session
   */
  maxDurationMs: 30 * 24 * 60 * 60 * 1000, // 30 jours

  /**
   * Inactivité avant expiration
   */
  inactivityTimeoutMs: 7 * 24 * 60 * 60 * 1000, // 7 jours

  /**
   * Permettre plusieurs sessions simultanées
   */
  allowMultipleSessions: true,

  /**
   * Nombre maximum de sessions actives par utilisateur
   */
  maxConcurrentSessions: 5,

  /**
   * Renouveler automatiquement la session proche de l'expiration
   */
  autoRenew: true,
  autoRenewThresholdMs: 24 * 60 * 60 * 1000, // Renouveler si < 24h restantes
} as const;

// ============================================================================
// Security Configuration
// ============================================================================

export const SECURITY_CONFIG = {
  /**
   * Password requirements
   */
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  },

  /**
   * CORS configuration
   */
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173',
    ],
    credentials: true,
  },

  /**
   * IP tracking et logging
   */
  tracking: {
    enabled: true,
    logFailedAttempts: true,
    logSuccessfulLogins: true,
    storeIpAddress: true,
    storeUserAgent: true,
  },

  /**
   * Two-Factor Authentication (préparation future)
   */
  twoFactor: {
    enabled: false, // À activer plus tard
    methods: ['totp', 'sms', 'email'],
    gracePeriodMs: 30 * 24 * 60 * 60 * 1000, // 30 jours pour activer 2FA
  },
} as const;

// ============================================================================
// Storage Configuration (pour rate limiting et session)
// ============================================================================

export const STORAGE_CONFIG = {
  /**
   * Type de stockage pour rate limiting
   * 'memory' = en mémoire (simple, mais perdu au redémarrage)
   * 'redis' = Redis (recommandé en production)
   */
  rateLimitStore: (process.env.RATE_LIMIT_STORE as 'memory' | 'redis') || 'memory',

  /**
   * Configuration Redis (si utilisé)
   */
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    keyPrefix: 'clubmanager:',
  },

  /**
   * TTL par défaut pour les entrées en cache
   */
  defaultTTL: 24 * 60 * 60, // 24 heures (en secondes)
} as const;

// ============================================================================
// Email Configuration (pour reset password, verification, etc.)
// ============================================================================

export const EMAIL_CONFIG = {
  /**
   * URL de base pour les liens dans les emails
   */
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  /**
   * Chemins des pages
   */
  paths: {
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    login: '/auth/login',
  },

  /**
   * Expéditeur par défaut
   */
  from: {
    name: 'ClubManager',
    email: process.env.EMAIL_FROM || 'noreply@clubmanager.com',
  },
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURE_FLAGS = {
  /**
   * Activer/désactiver certaines fonctionnalités
   */
  emailVerificationRequired: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  tokenRotation: true,
  rateLimiting: true,
  accountLockout: true,
  sessionTracking: true,
  auditLogging: true,
  ipWhitelist: false, // Pour autoriser certaines IPs à bypasser rate limit
} as const;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Obtenir la configuration complète pour l'environnement actuel
 */
export const getAuthConfig = () => ({
  env: {
    nodeEnv: NODE_ENV,
    isProduction: IS_PRODUCTION,
    isDevelopment: IS_DEVELOPMENT,
  },
  tokens: TOKEN_CONFIG,
  cookies: COOKIE_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  lockout: LOCKOUT_CONFIG,
  session: SESSION_CONFIG,
  security: SECURITY_CONFIG,
  storage: STORAGE_CONFIG,
  email: EMAIL_CONFIG,
  features: FEATURE_FLAGS,
});

/**
 * Type pour la configuration complète
 */
export type AuthConfig = ReturnType<typeof getAuthConfig>;

// Export par défaut
export default {
  TOKEN_CONFIG,
  COOKIE_CONFIG,
  RATE_LIMIT_CONFIG,
  LOCKOUT_CONFIG,
  SESSION_CONFIG,
  SECURITY_CONFIG,
  STORAGE_CONFIG,
  EMAIL_CONFIG,
  FEATURE_FLAGS,
  getAuthConfig,
};
