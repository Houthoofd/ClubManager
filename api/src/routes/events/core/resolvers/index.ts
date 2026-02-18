/**
 * Index du module GraphQL Events
 * ✅ Export centralisé des resolvers et typedefs
 */

export { eventsResolvers } from "./events.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { eventsTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./events.resolvers.js";
