/**
 * @file Common Constants
 * @description Shared constants used across all domains to avoid duplication
 *
 * This file centralizes constants that were previously duplicated in:
 * - store.constants.ts
 * - messaging.constants.ts
 * - groups.constants.ts
 * - statistics.constants.ts
 * - lookup.constants.ts
 */

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

/**
 * Default page number for paginated queries
 * Used when no page parameter is provided
 */
export const DEFAULT_PAGE = 1;

/**
 * Default page size for paginated queries
 * Used when no limit parameter is provided
 */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size for paginated queries
 * Prevents excessive data fetching
 */
export const MAX_PAGE_SIZE = 100;

/**
 * Minimum page size for paginated queries
 */
export const MIN_PAGE_SIZE = 1;

// ============================================================================
// SORTING
// ============================================================================

/**
 * Valid sort orders for queries
 * Used for ORDER BY clauses in SQL queries
 */
export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Default sort order when not specified
 * Most recent items first by default
 */
export const DEFAULT_SORT_ORDER: 'asc' | 'desc' = 'desc';

/**
 * Type for sort order (inferred from VALID_SORT_ORDERS)
 */
export type SortOrder = typeof VALID_SORT_ORDERS[number];

// ============================================================================
// COMMON LIMITS
// ============================================================================

/**
 * Maximum items that can be processed in bulk operations
 * Prevents database overload
 */
export const MAX_BULK_OPERATION_SIZE = 1000;

/**
 * Default batch size for bulk operations
 */
export const DEFAULT_BULK_BATCH_SIZE = 100;

// ============================================================================
// DATE & TIME
// ============================================================================

/**
 * ISO date format regex (YYYY-MM-DD)
 */
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * ISO datetime format regex (YYYY-MM-DD HH:MM:SS)
 */
export const ISO_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

/**
 * ISO 8601 full datetime format regex (YYYY-MM-DDTHH:MM:SS.sssZ)
 */
export const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;

// ============================================================================
// COMMON TEXT FIELD CONSTRAINTS
// ============================================================================

/**
 * Standard constraints for TEXT fields in database
 * TEXT fields typically support up to 65,535 bytes
 */
export const TEXT_FIELD_MAX_LENGTH = 65535;

/**
 * Standard minimum length for text content fields
 */
export const TEXT_CONTENT_MIN_LENGTH = 1;

/**
 * Standard maximum length for VARCHAR(255) fields
 */
export const VARCHAR_255_MAX_LENGTH = 255;

/**
 * Standard maximum length for VARCHAR(100) fields
 */
export const VARCHAR_100_MAX_LENGTH = 100;

/**
 * Standard maximum length for VARCHAR(50) fields
 */
export const VARCHAR_50_MAX_LENGTH = 50;

// ============================================================================
// NUMERIC CONSTRAINTS
// ============================================================================

/**
 * Minimum value for positive integer IDs
 */
export const POSITIVE_INTEGER_MIN = 1;

/**
 * Minimum value for non-negative integers (including 0)
 */
export const NON_NEGATIVE_INTEGER_MIN = 0;

/**
 * Maximum value for DECIMAL(10,2) fields (prices, amounts)
 */
export const DECIMAL_10_2_MAX = 99999999.99;

/**
 * Minimum value for prices and monetary amounts
 */
export const PRICE_MIN = 0;

// ============================================================================
// BOOLEAN REPRESENTATIONS
// ============================================================================

/**
 * Valid boolean values for database queries
 */
export const VALID_BOOLEAN_VALUES = [0, 1, true, false] as const;

/**
 * String representations of boolean values
 */
export const BOOLEAN_STRING_VALUES = ['true', 'false', '1', '0'] as const;

// ============================================================================
// EXPORT GROUPING
// ============================================================================

/**
 * All pagination-related constants grouped together
 */
export const PAGINATION = {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} as const;

/**
 * All sorting-related constants grouped together
 */
export const SORTING = {
  VALID_SORT_ORDERS,
  DEFAULT_SORT_ORDER,
} as const;

/**
 * All date/time format constants grouped together
 */
export const DATE_FORMATS = {
  ISO_DATE_REGEX,
  ISO_DATETIME_REGEX,
  ISO_8601_REGEX,
} as const;

/**
 * All text field length constraints grouped together
 */
export const TEXT_CONSTRAINTS = {
  TEXT_FIELD_MAX_LENGTH,
  TEXT_CONTENT_MIN_LENGTH,
  VARCHAR_255_MAX_LENGTH,
  VARCHAR_100_MAX_LENGTH,
  VARCHAR_50_MAX_LENGTH,
} as const;

/**
 * All numeric constraints grouped together
 */
export const NUMERIC_CONSTRAINTS = {
  POSITIVE_INTEGER_MIN,
  NON_NEGATIVE_INTEGER_MIN,
  DECIMAL_10_2_MAX,
  PRICE_MIN,
} as const;

/**
 * All bulk operation limits grouped together
 */
export const BULK_OPERATIONS = {
  MAX_BULK_OPERATION_SIZE,
  DEFAULT_BULK_BATCH_SIZE,
} as const;
