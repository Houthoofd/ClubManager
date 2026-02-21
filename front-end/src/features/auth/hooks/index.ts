/**
 * Auth Hooks - Barrel Export
 */

export * from "./useAuth";
export * from "./useAuthRedirect";
export * from "./useCompte";
export * from "./useCompteData";
export * from "./useConnexion";

// Explicitly export verification hooks to avoid naming conflicts
export {
  useCheckEmail,
  useCheckArticleByNomAndCategorie,
  useCheckArticleByNom,
  useCheckCoursPlanning,
} from "./useVerification";
