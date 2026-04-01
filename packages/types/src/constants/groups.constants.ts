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
// PAGINATION DEFAULTS
// ============================================================================

/**
 * Default page size for paginated groups queries
 */
export const GROUPS_DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size for paginated groups queries
 */
export const GROUPS_MAX_PAGE_SIZE = 100;

/**
 * Minimum page size for paginated groups queries
 */
export const GROUPS_MIN_PAGE_SIZE = 1;

/**
 * Default page number for paginated groups queries
 */
export const GROUPS_DEFAULT_PAGE = 1;

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
export const DEFAULT_SORT_ORDER = 'asc';
