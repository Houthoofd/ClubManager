/**
 * Fichier de compatibilité pour les anciennes imports
 * Redirige vers les nouveaux fichiers modulaires dans queries/
 *
 * @deprecated Importer directement depuis queries/index.js à la place
 */

// Export tout depuis les nouveaux fichiers modulaires
export * from "./queries/index.js";

/**
 * MIGRATION NOTE:
 *
 * Ce fichier existe pour assurer la compatibilité avec l'ancien code.
 *
 * Ancien import (toujours supporté):
 *   import * as queries from './queries.js';
 *
 * Nouvel import (recommandé):
 *   import * as queries from './queries/index.js';
 *
 * Ou imports spécifiques:
 *   import { SELECT_USER_BY_ID } from './queries/read.queries.js';
 *   import { UPDATE_PASSWORD } from './queries/write.queries.js';
 *   import { SELECT_ALL_GENRES } from './queries/relations.queries.js';
 *   import { SEARCH_USERS_BY_NAME_PATTERN } from './queries/search.queries.js';
 *   import { CHECK_USER_EXISTS } from './queries/validation.queries.js';
 */
