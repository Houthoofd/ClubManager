/**
 * Index des requêtes SQL pour le module Inscription
 * Centralise toutes les queries pour faciliter l'import
 */

// Export des queries de lecture
export * from './read.queries.js';

// Export des queries d'écriture
export * from './write.queries.js';

// Export des queries de validation
export * from './validation.queries.js';

// Export des queries de recherche
export * from './search.queries.js';

/**
 * USAGE:
 *
 * Import groupé (recommandé):
 *   import * as queries from './queries/index.js';
 *   queries.SELECT_COURS_BY_ID
 *   queries.INSERT_INSCRIPTION
 *
 * Imports spécifiques:
 *   import { SELECT_COURS_BY_ID } from './queries/read.queries.js';
 *   import { INSERT_INSCRIPTION } from './queries/write.queries.js';
 *   import { CHECK_COURS_EXISTS } from './queries/validation.queries.js';
 *   import { SEARCH_COURS_BY_DATE } from './queries/search.queries.js';
 */
