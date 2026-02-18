/**
 * Index du module GraphQL Settings
 * ✅ Export centralisé des resolvers et typedefs
 */

export { settingsResolvers } from "./settings.resolvers.js";
export { monitoringResolvers } from "./monitoring.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { settingsTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./settings.resolvers.js";

// Merge all resolvers
import { settingsResolvers } from "./settings.resolvers.js";
import { monitoringResolvers } from "./monitoring.resolvers.js";

export const allResolvers = {
  Query: {
    ...settingsResolvers.Query,
    ...monitoringResolvers.Query,
  },
  Mutation: {
    ...settingsResolvers.Mutation,
    ...monitoringResolvers.Mutation,
  },
};
