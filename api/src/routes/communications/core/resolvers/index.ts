/**
 * Index du module GraphQL Communications
 * ✅ Export centralisé des resolvers et typedefs
 */

export { communicationsResolvers } from "./communications.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { communicationsTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./communications.resolvers.js";
