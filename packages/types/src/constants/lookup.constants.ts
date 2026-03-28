/**
 * @fileoverview Lookup Tables Constants
 * @module @clubmanager/types/constants/lookup
 *
 * Defines constants for lookup tables (reference data).
 * Covers genres, grades (belts), and status.
 *
 * DB Schema Reference: SCHEMA_CONSOLIDATE.sql v4.1
 * Tables: genres, grades, status
 */

// ============================================================================
// GENRES - Gender/Genre types
// ============================================================================

/**
 * Maximum length for genre name
 * DB: genres.nom VARCHAR(50)
 */
export const GENRE_NAME_MAX_LENGTH = 50;

/**
 * Minimum length for genre name
 */
export const GENRE_NAME_MIN_LENGTH = 1;

/**
 * Common genre values
 */
export const COMMON_GENRES = {
  HOMME: 'Homme',
  FEMME: 'Femme',
  AUTRE: 'Autre',
  NON_SPECIFIE: 'Non spécifié',
} as const;

// ============================================================================
// GRADES - Jiu-Jitsu belt ranks
// ============================================================================

/**
 * Maximum length for grade name
 * DB: grades.nom VARCHAR(50)
 */
export const GRADE_NAME_MAX_LENGTH = 50;

/**
 * Minimum length for grade name
 */
export const GRADE_NAME_MIN_LENGTH = 1;

/**
 * Maximum length for grade color
 * DB: grades.couleur VARCHAR(20)
 */
export const GRADE_COLOR_MAX_LENGTH = 20;

/**
 * Minimum order value for grades
 */
export const GRADE_MIN_ORDER = 0;

/**
 * Maximum order value for grades (reasonable limit)
 */
export const GRADE_MAX_ORDER = 100;

/**
 * Common Jiu-Jitsu belt grades (Brazilian Jiu-Jitsu)
 */
export const BJJ_GRADES = {
  WHITE: { nom: 'Blanche', ordre: 0, couleur: '#FFFFFF' },
  BLUE: { nom: 'Bleue', ordre: 1, couleur: '#0000FF' },
  PURPLE: { nom: 'Violette', ordre: 2, couleur: '#800080' },
  BROWN: { nom: 'Marron', ordre: 3, couleur: '#8B4513' },
  BLACK: { nom: 'Noire', ordre: 4, couleur: '#000000' },
  RED_BLACK: { nom: 'Rouge et Noire', ordre: 5, couleur: '#FF0000' },
  RED: { nom: 'Rouge', ordre: 6, couleur: '#FF0000' },
} as const;

// ============================================================================
// STATUS - General status values
// ============================================================================

/**
 * Maximum length for status name
 * DB: status.nom VARCHAR(50)
 */
export const STATUS_NAME_MAX_LENGTH = 50;

/**
 * Minimum length for status name
 */
export const STATUS_NAME_MIN_LENGTH = 1;

/**
 * Maximum length for status description
 * DB: status.description TEXT
 */
export const STATUS_DESCRIPTION_MAX_LENGTH = 65535;

/**
 * Common status values
 */
export const COMMON_STATUS = {
  ACTIF: 'Actif',
  INACTIF: 'Inactif',
  SUSPENDU: 'Suspendu',
  EN_ATTENTE: 'En attente',
  ARCHIVE: 'Archivé',
} as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

/**
 * Default page size for paginated lookup queries
 */
export const LOOKUP_DEFAULT_PAGE_SIZE = 20;

/**
 * Maximum page size for paginated lookup queries
 */
export const LOOKUP_MAX_PAGE_SIZE = 100;

/**
 * Minimum page size for paginated lookup queries
 */
export const LOOKUP_MIN_PAGE_SIZE = 1;

/**
 * Default page number for paginated lookup queries
 */
export const LOOKUP_DEFAULT_PAGE = 1;

// ============================================================================
// COMMON VALIDATION
// ============================================================================

/**
 * Valid sort orders
 */
export const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

/**
 * Default sort order for lookup tables
 */
export const DEFAULT_SORT_ORDER = 'asc';
