/**
 * Index du module GraphQL Documents
 * ✅ Export centralisé des resolvers et typedefs
 */

export { documentsResolvers } from "./documents.resolvers.js";
export { uploadResolvers } from "./upload.resolvers.js";

// Import des TypeDefs depuis le package partagé @clubmanager/types
export { documentsTypeDefs } from "@clubmanager/types";

// Export par défaut pour faciliter l'importation
export { default as resolvers } from "./documents.resolvers.js";

// Merge all resolvers
import { documentsResolvers } from "./documents.resolvers.js";
import { uploadResolvers } from "./upload.resolvers.js";

export const allResolvers = {
  Query: {
    ...documentsResolvers.Query,
    ...uploadResolvers.Query,
  },
  Mutation: {
    ...documentsResolvers.Mutation,
    ...uploadResolvers.Mutation,
  },
};
