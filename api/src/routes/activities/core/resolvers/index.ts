/**
 * Index du module GraphQL Activities
 * ✅ Export centralisé des resolvers et typedefs
 */

export { activitiesResolvers } from "./activities.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { activitiesTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./activities.resolvers.js";
