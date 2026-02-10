/**
 * Export centralisé des resolvers Upload
 * ✅ MODERNISÉ : Pattern standardisé avec combineMiddlewares + withSentry
 */

import { PrismaClient } from "@prisma/client";
import { uploadResolvers } from "./upload.resolvers.js";

export { uploadResolvers };

/**
 * Factory function pour créer les resolvers avec Prisma
 */
export const createUploadResolvers = (prisma: PrismaClient) =>
  uploadResolvers(prisma);
