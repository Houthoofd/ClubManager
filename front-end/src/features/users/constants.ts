/**
 * Constants for the Users feature
 *
 * This file contains all constant values used across the users domain,
 * including user roles, statuses, validation rules, messages, etc.
 */

// ============================================================================
// User Roles
// ============================================================================

/**
 * Available user roles in the system
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  PROFESSEUR: 'professeur',
  UTILISATEUR: 'utilisateur',
} as const;

export const USER_ROLE_OPTIONS = Object.values(USER_ROLES);

/**
 * User role display labels
 */
export const USER_ROLE_LABELS: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'Administrateur',
  [USER_ROLES.PROFESSEUR]: 'Professeur',
  [USER_ROLES.UTILISATEUR]: 'Utilisateur',
};

/**
 * User role colors (for UI badges/chips)
 */
export const USER_ROLE_COLORS: Record<string, string> = {
  [USER_ROLES.ADMIN]: 'red',
  [USER_ROLES.PROFESSEUR]: 'blue',
  [USER_ROLES.UTILISATEUR]: 'green',
};

// ============================================================================
// User Status
// ============================================================================

/**
 * User account status values
 */
export const USER_STATUS = {
  ACTIF: 'actif',
  INACTIF: 'inactif',
  SUSPENDU: 'suspendu',
} as const;

export const USER_STATUS_OPTIONS = Object.values(USER_STATUS);

/**
 * User status display labels
 */
export const USER_STATUS_LABELS: Record<string, string> = {
  [USER_STATUS.ACTIF]: 'Actif',
  [USER_STATUS.INACTIF]: 'Inactif',
  [USER_STATUS.SUSPENDU]: 'Suspendu',
};

/**
 * User status colors (for UI badges/chips)
 */
export const USER_STATUS_COLORS: Record<string, string> = {
  [USER_STATUS.ACTIF]: 'green',
  [USER_STATUS.INACTIF]: 'grey',
  [USER_STATUS.SUSPENDU]: 'orange',
};

// ============================================================================
// Subscription Status
// ============================================================================

/**
 * Subscription status values
 */
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  PENDING: 'pending',
  CANCELLED: 'cancelled',
} as const;

/**
 * Subscription status display labels
 */
export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'Active',
  [SUBSCRIPTION_STATUS.EXPIRED]: 'Expirée',
  [SUBSCRIPTION_STATUS.PENDING]: 'En attente',
  [SUBSCRIPTION_STATUS.CANCELLED]: 'Annulée',
};

/**
 * Subscription status colors
 */
export const SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  [SUBSCRIPTION_STATUS.ACTIVE]: 'green',
  [SUBSCRIPTION_STATUS.EXPIRED]: 'red',
  [SUBSCRIPTION_STATUS.PENDING]: 'orange',
  [SUBSCRIPTION_STATUS.CANCELLED]: 'grey',
};

// ============================================================================
// Payment Status
// ============================================================================

/**
 * Payment status values
 */
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
} as const;

/**
 * Payment status display labels
 */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  [PAYMENT_STATUS.PAID]: 'Payé',
  [PAYMENT_STATUS.PENDING]: 'En attente',
  [PAYMENT_STATUS.OVERDUE]: 'En retard',
  [PAYMENT_STATUS.CANCELLED]: 'Annulé',
};

/**
 * Payment status colors
 */
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  [PAYMENT_STATUS.PAID]: 'green',
  [PAYMENT_STATUS.PENDING]: 'orange',
  [PAYMENT_STATUS.OVERDUE]: 'red',
  [PAYMENT_STATUS.CANCELLED]: 'grey',
};

// ============================================================================
// Belt Ranks (Ceintures)
// ============================================================================

/**
 * BJJ belt ranks
 */
export const BELT_RANKS = {
  BLANCHE: 'Blanche',
  BLEUE: 'Bleue',
  VIOLETTE: 'Violette',
  MARRON: 'Marron',
  NOIRE: 'Noire',
} as const;

export const BELT_RANK_OPTIONS = Object.values(BELT_RANKS);

/**
 * Belt colors (for UI display)
 */
export const BELT_COLORS: Record<string, string> = {
  [BELT_RANKS.BLANCHE]: '#FFFFFF',
  [BELT_RANKS.BLEUE]: '#0066CC',
  [BELT_RANKS.VIOLETTE]: '#6600CC',
  [BELT_RANKS.MARRON]: '#8B4513',
  [BELT_RANKS.NOIRE]: '#000000',
};

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Password minimum length
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Password maximum length
 */
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Minimum age for registration
 */
export const MIN_AGE = 4;

/**
 * Maximum age for registration
 */
export const MAX_AGE = 120;

/**
 * Email regex pattern
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone regex pattern (French format)
 */
export const PHONE_PATTERN = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

/**
 * Postal code regex pattern (French format)
 */
export const POSTAL_CODE_PATTERN = /^\d{5}$/;

// ============================================================================
// UI Constants
// ============================================================================

/**
 * Tab keys for user management page
 */
export const USER_TABS = {
  ADD_USER: 0,
  USER_LIST: 1,
  STATISTICS: 2,
} as const;

/**
 * Tab labels
 */
export const USER_TAB_LABELS = {
  [USER_TABS.ADD_USER]: 'Ajouter un utilisateur',
  [USER_TABS.USER_LIST]: 'Liste des utilisateurs',
  [USER_TABS.STATISTICS]: 'Statistiques',
};

/**
 * Default page size for pagination
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Page size options
 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Table columns configuration
 */
export const USER_TABLE_COLUMNS = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Téléphone', sortable: false },
  { key: 'role', label: 'Rôle', sortable: true },
  { key: 'status', label: 'Statut', sortable: true },
  { key: 'date_inscription', label: 'Date d\'inscription', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
] as const;

// ============================================================================
// Messages
// ============================================================================

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'L\'utilisateur a été créé avec succès !',
  USER_UPDATED: 'L\'utilisateur a été modifié avec succès !',
  USER_DELETED: 'L\'utilisateur a été supprimé avec succès !',
  PASSWORD_CHANGED: 'Le mot de passe a été modifié avec succès !',
  EMAIL_SENT: 'Email envoyé avec succès !',
  SUBSCRIPTION_RENEWED: 'Abonnement renouvelé avec succès !',
  PAYMENT_RECORDED: 'Paiement enregistré avec succès !',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'Utilisateur introuvable.',
  EMAIL_ALREADY_EXISTS: 'Cet email est déjà utilisé.',
  INVALID_EMAIL: 'Email invalide.',
  INVALID_PHONE: 'Numéro de téléphone invalide.',
  INVALID_POSTAL_CODE: 'Code postal invalide.',
  PASSWORD_TOO_SHORT: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`,
  PASSWORD_TOO_LONG: `Le mot de passe ne peut pas dépasser ${MAX_PASSWORD_LENGTH} caractères.`,
  INVALID_AGE: `L'âge doit être compris entre ${MIN_AGE} et ${MAX_AGE} ans.`,
  REQUIRED_FIELD: 'Ce champ est obligatoire.',
  LOADING_ERROR: 'Erreur lors du chargement des données.',
  SAVE_ERROR: 'Erreur lors de l\'enregistrement.',
  DELETE_ERROR: 'Erreur lors de la suppression.',
  PERMISSION_DENIED: 'Vous n\'avez pas les permissions nécessaires.',
};

/**
 * Warning messages
 */
export const WARNING_MESSAGES = {
  SUBSCRIPTION_EXPIRING_SOON: 'L\'abonnement expire bientôt.',
  PAYMENT_OVERDUE: 'Paiement en retard.',
  INACTIVE_ACCOUNT: 'Ce compte est inactif.',
  SUSPENDED_ACCOUNT: 'Ce compte est suspendu.',
  NO_SUBSCRIPTION: 'Aucun abonnement actif.',
};

/**
 * Confirmation messages
 */
export const CONFIRMATION_MESSAGES = {
  DELETE_USER: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ?',
  SUSPEND_USER: 'Êtes-vous sûr de vouloir suspendre cet utilisateur ?',
  REACTIVATE_USER: 'Êtes-vous sûr de vouloir réactiver cet utilisateur ?',
  CANCEL_SUBSCRIPTION: 'Êtes-vous sûr de vouloir annuler cet abonnement ?',
};

// ============================================================================
// API/GraphQL Constants
// ============================================================================

/**
 * Query keys for React Query cache
 */
export const QUERY_KEYS = {
  USERS: 'users',
  USER_DETAILS: 'user-details',
  USER_SUBSCRIPTIONS: 'user-subscriptions',
  USER_PAYMENTS: 'user-payments',
  USER_ACTIVITIES: 'user-activities',
  USER_STATS: 'user-stats',
} as const;

/**
 * Mutation keys
 */
export const MUTATION_KEYS = {
  CREATE_USER: 'create-user',
  UPDATE_USER: 'update-user',
  DELETE_USER: 'delete-user',
  CHANGE_PASSWORD: 'change-password',
  UPDATE_STATUS: 'update-status',
  RENEW_SUBSCRIPTION: 'renew-subscription',
  RECORD_PAYMENT: 'record-payment',
} as const;

/**
 * Cache invalidation delay (ms)
 */
export const CACHE_INVALIDATION_DELAY = 500;

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Feature flags for users module
 */
export const FEATURES = {
  ENABLE_USER_REGISTRATION: true,
  ENABLE_EMAIL_VERIFICATION: true,
  ENABLE_TWO_FACTOR_AUTH: false,
  ENABLE_AUTO_SUBSCRIPTION_RENEWAL: true,
  ENABLE_PAYMENT_REMINDERS: true,
  ENABLE_ACTIVITY_LOGS: true,
} as const;

// ============================================================================
// Export all constants as a single object (optional convenience export)
// ============================================================================

export const USERS_CONSTANTS = {
  USER_ROLES,
  USER_ROLE_OPTIONS,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,
  USER_STATUS,
  USER_STATUS_OPTIONS,
  USER_STATUS_LABELS,
  USER_STATUS_COLORS,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  BELT_RANKS,
  BELT_RANK_OPTIONS,
  BELT_COLORS,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_AGE,
  MAX_AGE,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  POSTAL_CODE_PATTERN,
  USER_TABS,
  USER_TAB_LABELS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  USER_TABLE_COLUMNS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  CONFIRMATION_MESSAGES,
  QUERY_KEYS,
  MUTATION_KEYS,
  CACHE_INVALIDATION_DELAY,
  FEATURES,
} as const;
