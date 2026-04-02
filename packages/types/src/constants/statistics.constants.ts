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

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  DEFAULT_PAGE,
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} from "./common.constants.js";

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
  ATTENDANCE: "frequentation",
  REVENUE: "revenue",
  REGISTRATIONS: "inscriptions",
  PAYMENTS: "paiements",
  COURSES: "cours",
  USERS: "utilisateurs",
  RESERVATIONS: "reservations",
  STORE: "magasin",
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
  CLUB_NAME: "club_name",
  CLUB_ADDRESS: "club_address",
  CLUB_PHONE: "club_phone",
  CLUB_EMAIL: "club_email",
  CLUB_WEBSITE: "club_website",
  OPENING_HOURS: "opening_hours",
  SOCIAL_FACEBOOK: "social_facebook",
  SOCIAL_INSTAGRAM: "social_instagram",
  SOCIAL_TWITTER: "social_twitter",
  BANK_ACCOUNT: "bank_account",
  VAT_NUMBER: "vat_number",
  LEGAL_INFO: "legal_info",
} as const;

// ============================================================================
// PAGINATION DEFAULTS (re-exported from common for convenience)
// ============================================================================

/**
 * Default page size for paginated statistics queries
 * @see DEFAULT_PAGE_SIZE from common.constants
 */
export const STATISTICS_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/**
 * Maximum page size for paginated statistics queries
 * @see MAX_PAGE_SIZE from common.constants
 */
export const STATISTICS_MAX_PAGE_SIZE = MAX_PAGE_SIZE;

/**
 * Minimum page size for paginated statistics queries
 * @see MIN_PAGE_SIZE from common.constants
 */
export const STATISTICS_MIN_PAGE_SIZE = MIN_PAGE_SIZE;

/**
 * Default page number for paginated statistics queries
 * @see DEFAULT_PAGE from common.constants
 */
export const STATISTICS_DEFAULT_PAGE = DEFAULT_PAGE;

// ============================================================================
// DOMAIN-SPECIFIC CONSTRAINTS
// ============================================================================

/**
 * Maximum number of days for statistics date range queries
 */
export const MAX_STATISTICS_DATE_RANGE_DAYS = 365;

// ============================================================================
// SORTING (re-exported from common for convenience)
// ============================================================================

/**
 * Valid sort orders
 * @see VALID_SORT_ORDERS from common.constants
 */
export { VALID_SORT_ORDERS };

/**
 * Default sort order
 * @see DEFAULT_SORT_ORDER from common.constants
 */
export { DEFAULT_SORT_ORDER };
