/**
 * Export centralisé des resolvers Vérification
 * ✅ MODERNISÉ : Pattern standardisé avec combineMiddlewares + withSentry
 */

import { PrismaClient } from "@prisma/client";
import { verificationResolvers } from "./verification.resolvers.js";

export { verificationResolvers };

/**
 * Factory function pour créer les resolvers avec Prisma
 */
export const createVerificationResolvers = (prisma: PrismaClient) =>
  verificationResolvers(prisma);

/**
 * Export des types TypeScript pour utilisation dans d'autres modules
 */
export type {
  VerifierPrenomNomInput,
  VerifierEmailPrenomNomInput,
  VerifierPlanningInput,
  VerifierArticleCategorieInput,
  UtilisateurInput,
  VerifierProfesseursInput,
  VerificationResult,
  HealthCheckResult,
  ProfesseurResult,
  VerifierProfesseursResult,
} from "./verification.resolvers.js";
