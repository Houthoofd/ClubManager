/**
 * ====================================================================
 * USERS ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature Users (Utilisateurs).
 * Gestion des utilisateurs, ajout, consultation et modification.
 *
 * 🚀 OPTIMISATION: Code splitting avec React.lazy
 * Les pages sont chargées à la demande pour réduire le bundle initial
 */

import { lazy, Suspense } from "react";
import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/pages/protectedroute";
import { FullPageSpinner } from "@/shared/components/ui";

// ====================================================================
// LAZY LOADED PAGES
// ====================================================================

const AddUserPage = lazy(() => import("@/features/users/pages/AddUserPage"));
const UserDetailPage = lazy(() => import("@/features/users/pages/UserDetailPage"));

// ====================================================================
// ROUTES PROTÉGÉES (Utilisateurs)
// ====================================================================

/**
 * Routes pour la gestion des utilisateurs
 * Toutes les routes nécessitent une authentification
 */
export const usersRoutes: RouteObject[] = [
  {
    path: "pages/utilisateurs/ajouter-utilisateur",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
          <AddUserPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/utilisateurs/consulter/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement du profil..." />}>
          <UserDetailPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default usersRoutes;
