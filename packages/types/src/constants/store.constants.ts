/**
 * @file Store Domain Constants
 * @description Constants for store domain validation (field lengths, limits, etc.)
 */

/**
 * Category field length constraints
 */
export const CATEGORY_CONSTRAINTS = {
  NOM_MIN_LENGTH: 1,
  NOM_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 65535, // TEXT field
} as const;

/**
 * Size (Taille) field length constraints
 */
export const SIZE_CONSTRAINTS = {
  NOM_MIN_LENGTH: 1,
  NOM_MAX_LENGTH: 10,
} as const;

/**
 * Article field length constraints
 */
export const ARTICLE_CONSTRAINTS = {
  NOM_MIN_LENGTH: 1,
  NOM_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 65535, // TEXT field
  IMAGE_URL_MAX_LENGTH: 255,
  PRIX_MIN: 0,
  PRIX_MAX: 99999999.99, // DECIMAL(10,2)
} as const;

/**
 * Image field length constraints
 */
export const IMAGE_CONSTRAINTS = {
  URL_MIN_LENGTH: 1,
  URL_MAX_LENGTH: 255,
  ORDRE_MIN: 0,
} as const;

/**
 * Stock field constraints
 */
export const STOCK_CONSTRAINTS = {
  QUANTITE_MIN: 0,
  QUANTITE_MINIMUM_MIN: 0,
  QUANTITE_MINIMUM_DEFAULT: 5,
} as const;

/**
 * Order (Commande) field length constraints
 */
export const ORDER_CONSTRAINTS = {
  UNIQUE_ID_MAX_LENGTH: 255,
  NUMERO_COMMANDE_MAX_LENGTH: 100,
  TOTAL_MIN: 0,
  TOTAL_MAX: 99999999.99, // DECIMAL(10,2)
  IP_ADDRESS_MAX_LENGTH: 45, // IPv6 support
  USER_AGENT_MAX_LENGTH: 65535, // TEXT field
} as const;

/**
 * Order item (Commande Article) field constraints
 */
export const ORDER_ITEM_CONSTRAINTS = {
  QUANTITE_MIN: 1,
  PRIX_MIN: 0,
  PRIX_MAX: 99999999.99, // DECIMAL(10,2)
} as const;

/**
 * Stock movement field constraints
 */
export const STOCK_MOVEMENT_CONSTRAINTS = {
  TAILLE_MIN_LENGTH: 1,
  TAILLE_MAX_LENGTH: 10,
  COMMANDE_ID_MAX_LENGTH: 255,
  MOTIF_MAX_LENGTH: 65535, // TEXT field
} as const;

/**
 * Default pagination limit for store lists
 */
export const STORE_DEFAULT_LIMIT = 50;

/**
 * Maximum pagination limit for store lists
 */
export const STORE_MAX_LIMIT = 100;
