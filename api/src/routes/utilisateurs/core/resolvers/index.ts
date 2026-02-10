/**
 * Export centralisé des resolvers Utilisateurs
 * ✅ MODERNISÉ : Pattern standardisé avec combineMiddlewares + withSentry
 */

import { PrismaClient } from "@prisma/client";
import { utilisateursResolvers } from "./utilisateurs.resolvers.js";

export { utilisateursResolvers };

/**
 * Factory function pour créer les resolvers avec Prisma
 */
export const createUtilisateursResolvers = (prisma: PrismaClient) =>
  utilisateursResolvers(prisma);
