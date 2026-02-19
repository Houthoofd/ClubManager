/**
 * Auth Feature Constants
 */

// Authentication Status
export const AUTH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error',
} as const;

export type AuthStatus = typeof AUTH_STATUS[keyof typeof AUTH_STATUS];

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  TEACHER: 'teacher',
  MEMBER: 'member',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Gender Options
export const GENDER = {
  MALE: 'M',
  FEMALE: 'F',
  OTHER: 'other',
} as const;

export type Gender = typeof GENDER[keyof typeof GENDER];

// Subscription Types
export const SUBSCRIPTION_TYPES = {
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
  TRIAL: 'trial',
} as const;

export type SubscriptionType = typeof SUBSCRIPTION_TYPES[keyof typeof SUBSCRIPTION_TYPES];

// Auth Routes
export const AUTH_ROUTES = {
  LOGIN: '/pages/connexion',
  REGISTER: '/pages/inscription',
  VERIFY_EMAIL: '/pages/verify-email',
  FORGOT_PASSWORD: '/pages/auth/forgot-password',
  RESET_PASSWORD: '/pages/auth/reset-password',
  PROFILE: '/pages/compte',
  SETTINGS: '/pages/settings',
} as const;

// Redirect Routes
export const REDIRECT_ROUTES = {
  AFTER_LOGIN: '/pages/cours/inscription',
  AFTER_LOGOUT: '/pages/connexion',
  AFTER_REGISTER: '/pages/verify-email',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'authToken',
  USER: 'userData',
  REFRESH_TOKEN: 'refreshToken',
  REMEMBER_ME: 'rememberMe',
} as const;

// Session Duration
export const SESSION_DURATION = {
  DEFAULT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  REMEMBER_ME: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  REFRESH_THRESHOLD: 5 * 60 * 1000, // Refresh 5 minutes before expiry
} as const;

// Messages
export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGIN_FAILED: 'Email ou mot de passe incorrect',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
  REGISTER_SUCCESS: 'Inscription réussie. Veuillez vérifier votre email.',
  REGISTER_FAILED: 'Erreur lors de l\'inscription',
  EMAIL_VERIFIED: 'Email vérifié avec succès',
  EMAIL_VERIFICATION_FAILED: 'Échec de la vérification de l\'email',
  PASSWORD_RESET_SENT: 'Email de réinitialisation envoyé',
  PASSWORD_RESET_SUCCESS: 'Mot de passe réinitialisé avec succès',
  PASSWORD_RESET_FAILED: 'Échec de la réinitialisation du mot de passe',
  PROFILE_UPDATE_SUCCESS: 'Profil mis à jour avec succès',
  PROFILE_UPDATE_FAILED: 'Échec de la mise à jour du profil',
  PASSWORD_CHANGE_SUCCESS: 'Mot de passe modifié avec succès',
  PASSWORD_CHANGE_FAILED: 'Échec de la modification du mot de passe',
  SESSION_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  UNAUTHORIZED: 'Accès non autorisé',
  EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé',
  WEAK_PASSWORD: 'Le mot de passe doit contenir au moins 8 caractères',
  PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas',
  INVALID_EMAIL: 'Adresse email invalide',
  REQUIRED_FIELD: 'Ce champ est requis',
} as const;

// Error Codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  PHONE_REGEX: /^(\+32|0)[1-9]\d{8}$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  AGE_MIN: 13,
  AGE_MAX: 120,
} as const;

// Password Strength Levels
export const PASSWORD_STRENGTH = {
  WEAK: 'weak',
  MEDIUM: 'medium',
  STRONG: 'strong',
  VERY_STRONG: 'very_strong',
} as const;

export type PasswordStrength = typeof PASSWORD_STRENGTH[keyof typeof PASSWORD_STRENGTH];

// Account Status
export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
} as const;

export type AccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];

// Default Values
export const DEFAULT_AVATAR = '/assets/default-avatar.png';
export const DEFAULT_COUNTDOWN_SECONDS = 5;
export const LOGIN_REDIRECT_DELAY = 1000; // milliseconds

// API Endpoints (if using REST)
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  VERIFY_EMAIL: '/api/auth/verify-email',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  REFRESH_TOKEN: '/api/auth/refresh',
  GET_USER: '/api/auth/me',
  UPDATE_PROFILE: '/api/auth/profile',
  CHANGE_PASSWORD: '/api/auth/change-password',
} as const;
