/**
 * Auth Hooks - Barrel Export
 *
 * Re-exports authentication and account management hooks from features/auth.
 */

// Auth hooks from features
export {
  useLogin,
  useLogout,
  useAuthStatus,
  useProfile,
  useIsAuthenticated,
} from "@/features/auth/hooks/useAuth";

export { useAuthRedirect } from "@/features/auth/hooks/useAuthRedirect";

export {
  useCompteInfo,
  useUpdateCompte,
  useSubscriptions,
  useGrades,
  useStatuses,
  useGenders,
  useUserSubscription,
  useAbonnements,
  useGenres,
  useStatus,
} from "@/features/auth/hooks/useCompte";

export {
  useLoginForm,
  useRegisterForm,
} from "@/features/auth/hooks/useConnexion";

export {
  useCheckEmail,
  useCheckArticleByNomAndCategorie,
  useCheckArticleByNom,
  useCheckCoursPlanning,
} from "@/features/auth/hooks/useVerification";

// Legacy combined hooks
export { useCompteData } from "../useCompteData";

// Aliases for backward compatibility
export { useLogin as useAuth } from "@/features/auth/hooks/useAuth";
export { useCompteInfo as useCompte } from "@/features/auth/hooks/useCompte";
export { useLoginForm as useConnexion } from "@/features/auth/hooks/useConnexion";
export { useCheckEmail as useVerification } from "@/features/auth/hooks/useVerification";
