/**
 * Module Vérification (refactorisé)
 * Exporte les resolvers GraphQL pour le système de vérification
 * Version GraphQL uniquement (pas de REST)
 */

export {
  verificationResolvers,
  verificationTypeDefs,
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
} from "./verification/index.js";

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
} from "./verification/index.js";
