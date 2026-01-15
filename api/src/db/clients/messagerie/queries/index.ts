/**
 * Index centralisant toutes les requêtes SQL du module Messagerie
 * Permet d'importer toutes les queries depuis un seul point d'entrée
 */

// Requêtes de lecture
export * from './read.queries.js';

// Requêtes d'écriture
export * from './write.queries.js';

// Requêtes de validation
export * from './validation.queries.js';

/**
 * USAGE:
 *
 * Import de toutes les queries:
 *   import * as queries from './queries/index.js';
 *
 * Import sélectif:
 *   import {
 *     SELECT_ALL_TYPES_MESSAGES,
 *     INSERT_MESSAGE_PERSONNALISE,
 *     CHECK_USER_EXISTS
 *   } from './queries/index.js';
 */
