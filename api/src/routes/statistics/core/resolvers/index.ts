/**
 * Index du module GraphQL Statistics
 * ✅ Export centralisé des resolvers et typedefs
 */

export { statisticsResolvers } from "./statistics.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { statisticsTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./statistics.resolvers.js";
