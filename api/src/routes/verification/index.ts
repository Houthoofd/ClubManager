/**
 * Index du module Vérification
 * Exporte les resolvers GraphQL et les services
 * Version GraphQL uniquement (pas de REST)
 */

// Exports principaux pour GraphQL
export {
  verificationResolvers,
  verificationTypeDefs,
} from "./core/resolvers/index.js";

// Export des services pour utilisation directe si nécessaire
export {
  verifierEmailUtilisateur,
  verifierNomUtilisateur,
  verifierPrenomUtilisateur,
  verifierNomUtilisateurComplet,
  verifierPrenomNomUtilisateur,
  verifierEmailPrenomNomUtilisateur,
  verifierCoursPlanning,
  verifierArticleParNom,
  verifierArticleParNomEtCategorie,
  verifierUtilisateursSontProfesseurs,
  verifierSanteService,
} from "./core/services/verification.service.js";

// Export des types TypeScript pour utilisation externe
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
} from "./core/resolvers/index.js";
