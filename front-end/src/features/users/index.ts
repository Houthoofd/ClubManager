/**
 * Users Feature - Main Barrel Export
 *
 * This file serves as the main entry point for the users feature,
 * exporting all public APIs, components, hooks, types, and constants.
 *
 * Usage:
 *   import { AddUserPage, useUsers, USER_ROLES } from '@/features/users';
 */

// ============================================================================
// Pages
// ============================================================================

export { default as AddUserPage } from './pages/AddUserPage';
export { default as UserDetailPage } from './pages/UserDetailPage';

// ============================================================================
// Components
// ============================================================================

export { default as EcheancesPaiement } from './components/EcheancesPaiement';
export { default as FormulaireUtilisateur } from './components/FormulaireUtilisateur';
export { default as FormulaireUtilisateurAjout } from './components/FormulaireUtilisateurAjout';
export { default as OngletAjoutUtilisateur } from './components/OngletAjoutUtilisateur';
export { default as OngletTableauUtilisateurs } from './components/OngletTableauUtilisateurs';
export { default as StatistiquesUtilisateur } from './components/StatistiquesUtilisateur';

// ============================================================================
// Hooks
// ============================================================================

export * from './hooks/index';

// Named exports for commonly used hooks
export {
  useUsers,
  useUserById,
  useAllUsers,
} from './hooks/index';

// ============================================================================
// Types
// ============================================================================

export type {
  // User types
  UserRole,
  UserStatus,
  SubscriptionStatus,
  PaymentStatus,
  User,
  UserDetail,
  UserFormData,

  // Subscription & Payment
  UserSubscription,
  UserPayment,

  // Statistics
  UserStats,

  // Extended types
  UserWithSubscription,
  UserWithPayments,

  // Filtering & Sorting
  UserFilters,
  UserSortBy,
  SortDirection,
  UserSortOptions,

  // Pagination
  PaginationOptions,

  // Table data
  UserTableRow,

  // Activity
  UserActivity,

  // Preferences
  UserNotificationPreferences,

  // Validation
  UserValidationErrors,
} from './types';

// ============================================================================
// Constants
// ============================================================================

export {
  // User roles
  USER_ROLES,
  USER_ROLE_OPTIONS,
  USER_ROLE_LABELS,
  USER_ROLE_COLORS,

  // User status
  USER_STATUS,
  USER_STATUS_OPTIONS,
  USER_STATUS_LABELS,
  USER_STATUS_COLORS,

  // Subscription status
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_COLORS,

  // Payment status
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,

  // Belt ranks
  BELT_RANKS,
  BELT_RANK_OPTIONS,
  BELT_COLORS,

  // Validation rules
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_AGE,
  MAX_AGE,
  EMAIL_PATTERN,
  PHONE_PATTERN,
  POSTAL_CODE_PATTERN,

  // UI constants
  USER_TABS,
  USER_TAB_LABELS,
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  USER_TABLE_COLUMNS,

  // Messages
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  CONFIRMATION_MESSAGES,

  // API/GraphQL
  QUERY_KEYS,
  MUTATION_KEYS,
  CACHE_INVALIDATION_DELAY,

  // Feature flags
  FEATURES,

  // All constants grouped
  USERS_CONSTANTS,
} from './constants';
