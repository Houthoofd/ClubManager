/**
 * Index des resolvers du module Vérification
 * Exporte les resolvers et types GraphQL pour faciliter les imports
 */

export { verificationResolvers } from "./verification.resolvers.js";
export { verificationTypeDefs } from "./verification.typeDefs.js";

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
