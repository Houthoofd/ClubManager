/**
 * ====================================================================
 * AUTH ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature d'authentification.
 * Toutes les routes publiques (connexion, inscription, récupération de mot de passe).
 *
 * 🚀 OPTIMISATION: Code splitting avec React.lazy
 * Les pages sont chargées à la demande pour réduire le bundle initial
 */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import { FullPageSpinner } from "@/shared/components/ui";

// ====================================================================
// LAZY LOADED PAGES
// ====================================================================

const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage"));
const VerifyEmailPage = lazy(() => import("@/features/auth/pages/VerifyEmailPage"));
const ForgotPasswordPage = lazy(() => import("@/features/auth/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/features/auth/pages/ResetPasswordPage"));

// ====================================================================
// ROUTES PUBLIQUES (Authentification)
// ====================================================================

/**
 * Routes publiques - Accessibles sans authentification
 * Ces routes sont HORS du MainLayout
 */
export const authPublicRoutes: RouteObject[] = [
  {
    path: "/pages/connexion",
    element: (
      <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/connexion",
    element: (
      <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    path: "/pages/inscription",
    element: (
      <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
        <RegisterPage />
      </Suspense>
    ),
  },
  {
    path: "/pages/verify-email",
    element: (
      <Suspense fallback={<FullPageSpinner text="Vérification..." />}>
        <VerifyEmailPage />
      </Suspense>
    ),
  },
  {
    path: "/pages/auth/forgot-password",
    element: (
      <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
        <ForgotPasswordPage />
      </Suspense>
    ),
  },
  {
    path: "/pages/auth/reset-password",
    element: (
      <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
        <ResetPasswordPage />
      </Suspense>
    ),
  },
];

// ====================================================================
// ROUTES PROTÉGÉES (Compte utilisateur)
// ====================================================================

/**
 * Routes protégées pour le compte utilisateur
 * Ces routes sont DANS le MainLayout et nécessitent une authentification
 */
export const authProtectedRoutes: RouteObject[] = [
  // Les routes de compte sont gérées ailleurs (pages/compte)
  // Pas de routes protégées spécifiques à l'auth ici
];

// ====================================================================
// EXPORTS
// ====================================================================

export default authPublicRoutes;
