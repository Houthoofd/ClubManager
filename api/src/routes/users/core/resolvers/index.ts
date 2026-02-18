/**
 * Index du module GraphQL Users
 * ✅ Export centralisé des resolvers et typedefs
 */

export { usersResolvers } from "./users.resolvers.js";
export { authResolvers } from "./auth.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { usersTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./users.resolvers.js";

// Merge all resolvers
import { usersResolvers } from "./users.resolvers.js";
import { authResolvers } from "./auth.resolvers.js";

export const allResolvers = {
  Query: {
    ...usersResolvers.Query,
    ...authResolvers.Query,
  },
  Mutation: {
    ...usersResolvers.Mutation,
    ...authResolvers.Mutation,
  },
};
