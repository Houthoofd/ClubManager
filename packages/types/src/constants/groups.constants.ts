/**
 * @fileoverview Groups Domain Constants
 * @module @clubmanager/types/constants/groups
 *
 * Defines constants for the Groups domain based on DB schema.
 * Covers groups (user groups/roles) and group assignments.
 *
 * DB Schema Reference: SCHEMA_CONSOLIDATE.sql v4.1
 * Tables: groupes, groupes_utilisateurs
 */

import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
  DEFAULT_PAGE,
  VALID_SORT_ORDERS,
} from "./common.constants.js";

// ============================================================================
// GROUPS - User groups (admin, member, professor, etc.)
// ============================================================================

/**
 * Maximum length for group name
 * DB: groupes.nom VARCHAR(100)
 */
export const GROUP_NAME_MAX_LENGTH = 100;

/**
 * Minimum length for group name
 */
export const GROUP_NAME_MIN_LENGTH = 1;

/**
 * Maximum length for group description
 * DB: groupes.description TEXT
 */
export const GROUP_DESCRIPTION_MAX_LENGTH = 65535;

// ============================================================================
// GROUP USERS - Many-to-many association
// ============================================================================

/**
 * Maximum number of groups a user can belong to
 * Reasonable limit for UI/UX and performance
 */
export const MAX_GROUPS_PER_USER = 50;

/**
 * Maximum number of users per group for bulk assignment
 */
export const MAX_USERS_PER_BULK_ASSIGNMENT = 100;

// ============================================================================
// PAGINATION DEFAULTS (re-exported from common for convenience)
// ============================================================================

/**
 * Default page size for paginated groups queries
 * @see DEFAULT_PAGE_SIZE from common.constants
 */
export const GROUPS_DEFAULT_PAGE_SIZE = DEFAULT_PAGE_SIZE;

/**
 * Maximum page size for paginated groups queries
 * @see MAX_PAGE_SIZE from common.constants
 */
export const GROUPS_MAX_PAGE_SIZE = MAX_PAGE_SIZE;

/**
 * Minimum page size for paginated groups queries
 * @see MIN_PAGE_SIZE from common.constants
 */
export const GROUPS_MIN_PAGE_SIZE = MIN_PAGE_SIZE;

/**
 * Default page number for paginated groups queries
 * @see DEFAULT_PAGE from common.constants
 */
export const GROUPS_DEFAULT_PAGE = DEFAULT_PAGE;

// ============================================================================
// SORTING (re-exported from common for convenience)
// ============================================================================

/**
 * Valid sort orders
 * @see VALID_SORT_ORDERS from common.constants
 */
export { VALID_SORT_ORDERS };

/**
 * Default sort order for groups (alphabetical order makes more sense for groups)
 * Groups are typically displayed in alphabetical order rather than reverse chronological
 */
export const GROUPS_DEFAULT_SORT_ORDER: "asc" | "desc" = "asc";
