/**
 * Index du module GraphQL Shop
 * ✅ Export centralisé des resolvers et typedefs
 */

export { shopResolvers } from "./shop.resolvers.js";
export { paymentResolvers } from "./payment.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { shopTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./shop.resolvers.js";

// Merge all resolvers
import { shopResolvers } from "./shop.resolvers.js";
import { paymentResolvers } from "./payment.resolvers.js";

export const allResolvers = {
  Query: {
    ...shopResolvers.Query,
    ...paymentResolvers.Query,
  },
  Mutation: {
    ...shopResolvers.Mutation,
    ...paymentResolvers.Mutation,
  },
};
