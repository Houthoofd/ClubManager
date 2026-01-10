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
 *   import { SELECT_COURS_BY_ID } from './queries/read.queries.js';
 *   import { INSERT_COURS } from './queries/write.queries.js';
 *   import { CHECK_INSCRIPTION_EXISTS } from './queries/validation.queries.js';
 *   import { GET_STATS_PRESENCE_COURS } from './queries/statistics.queries.js';
 */
