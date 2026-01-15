/**
 * Point d'entrée principal du module Messages
 * Exporte tous les composants publics du module
 */

// Repository principal
export {
  MessagesRepository,
  getMessagesRepository,
} from "./messages.repository.js";

// Types
export * from "./types.js";

// Queries (pour compatibilité)
export * as queries from "./queries.js";

// Clients legacy (pour compatibilité avec l'ancien code)
export { MessageClient, messageClient } from "./messageClient.js";
export { Message } from "./messages.js";

/**
 * Export par défaut: le repository principal
 */
export { getMessagesRepository as default } from "./messages.repository.js";
