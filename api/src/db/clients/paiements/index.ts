/**
 * Point d'entrée principal du module Paiements
 * Exporte tous les composants publics du module
 */

// Repository principal
export {
  PaiementsRepository,
  getPaiementsRepository,
} from "./paiements.repository.js";

// Types
export * from "./types.js";

// Queries (pour compatibilité)
export * as queries from "./queries.js";

// Client legacy (pour compatibilité avec l'ancien code)
export { Paiements } from "./paiements.js";

/**
 * Export par défaut: le repository principal
 */
export { getPaiementsRepository as default } from "./paiements.repository.js";
