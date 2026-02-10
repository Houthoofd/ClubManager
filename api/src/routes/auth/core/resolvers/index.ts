/**
 * Index des resolvers et typeDefs GraphQL pour le module Auth
 * Factory pattern pour injection de Prisma
 */

import { PrismaClient } from "@prisma/client";
import { createAuthResolvers } from "./auth.resolvers.js";

/**
 * Factory pour créer les resolvers auth avec Prisma
 */
export const createAuthResolversWithPrisma = (prisma: PrismaClient) => {
  return createAuthResolvers(prisma);
};

/**
 * Export par défaut pour compatibilité
 */
export { createAuthResolvers } from "./auth.resolvers.js";
export { authResolvers } from "./auth.resolvers.js";

/**
 * Export des TypeDefs depuis packages/types (centralisé)
 */
export { authTypeDefs } from "@clubmanager/types/dist/graphql/index.js";
