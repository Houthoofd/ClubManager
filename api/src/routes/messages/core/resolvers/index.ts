/**
 * Index du module GraphQL Messages
 * ✅ Export centralisé des resolvers et typedefs
 */

export { messagesResolvers } from "./messages.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { messagesTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./messages.resolvers.js";
