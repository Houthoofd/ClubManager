/**
 * @fileoverview Statistics Domain Constants
 * @module @clubmanager/types/constants/statistics
 *
 * Defines constants for the Statistics domain based on DB schema.
 * Covers statistics tracking and general club information.
 *
 * DB Schema Reference: SCHEMA_CONSOLIDATE.sql v4.1
 * Tables: statistiques, informations
 */

// ============================================================================
// STATISTICS - Club statistics tracking
// ============================================================================

/**
 * Maximum length for statistic type
 * DB: statistiques.type VARCHAR(50)
 */
export const STATISTIC_TYPE_MAX_LENGTH = 50;

/**
 * Minimum length for statistic type
 */
export const STATISTIC_TYPE_MIN_LENGTH = 1;

/**
 * Maximum length for statistic key
 * DB: statistiques.cle VARCHAR(100)
 */
export const STATISTIC_KEY_MAX_LENGTH = 100;

/**
 * Minimum length for statistic key
 */
export const STATISTIC_KEY_MIN_LENGTH = 1;

/**
 * Maximum length for statistic value
 * DB: statistiques.valeur TEXT (JSON or simple value)
 */
export const STATISTIC_VALUE_MAX_LENGTH = 65535;

/**
 * Minimum length for statistic value
 */
export const STATISTIC_VALUE_MIN_LENGTH = 1;

/**
 * Common statistic types
 */
export const STATISTIC_TYPES = {
  ATTENDANCE: 'frequentation',
  REVENUE: 'revenue',
  REGISTRATIONS: 'inscriptions',
  PAYMENTS: 'paiements',
  COURSES: 'cours',
  USERS: 'utilisateurs',
  RESERVATIONS: 'reservations',
  STORE: 'magasin',
} as const;

// ============================================================================
// INFORMATIONS - General club information
// ============================================================================

/**
 * Maximum length for information key
 * DB: informations.cle VARCHAR(100)
 */
export const INFORMATION_KEY_MAX_LENGTH = 100;

/**
 * Minimum length for information key
 */
export const INFORMATION_KEY_MIN_LENGTH = 1;

/**
 * Maximum length for information value
 * DB: informations.valeur TEXT
 */
export const INFORMATION_VALUE_MAX_LENGTH = 65535;

/**
 * Minimum length for information value
 */
export const INFORMATION_VALUE_MIN_LENGTH = 1;

/**
 * Maximum length for information description
 * DB: informations.description TEXT
 */
export const INFORMATION_DESCRIPTION_MAX_LENGTH = 65535;

/**
 * Common information keys
 */
export const INFORMATION_KEYS = {
  CLUB_NAME: 'club_name',
  CLUB_ADDRESS: 'club_address',
  CLUB_PHONE: 'club_phone',
  CLUB_EMAIL: 'club_email',
  CLUB_WEBSITE: 'club_website',
  OPENING_HOURS: 'opening_hours',
  SOCIAL_FACEBOOK: 'social_facebook',
  SOCIAL_INSTAGRAM: 'social_instagram',
  SOCIAL_TWITTER: 'social_twitter',
  BANK_ACCOUNT: 'bank_account',
  VAT_NUMBER: 'vat_number',
  LEGAL_INFO: 'legal_info',
} as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

/**
 * Default page size for paginated statistics queries
 */
export const STATISTICS_DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size for paginated statistics queries
 */
export const STATISTICS_MAX_PAGE_SIZE = 100;

/**
 * Minimum page size for paginated statistics queries
 */
export const STATISTICS_MIN_PAGE_SIZE = 1;

/**
 * Default page number for paginated statistics queries
 */
export const STATISTICS_DEFAULT_PAGE = 1;

// ============================================================================
// COMMON VALIDATION
// ============================================================================

/**
 * Valid sort orders
 */
export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Default sort order
 */
export const DEFAULT_SORT_ORDER = 'desc';

/**
 * Maximum number of days for statistics date range queries
 */
export const MAX_STATISTICS_DATE_RANGE_DAYS = 365;
