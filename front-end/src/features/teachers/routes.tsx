/**
 * ====================================================================
 * TEACHERS ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature Teachers (Professeurs).
 * Gestion des professeurs et de leur planning.
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

const TeachersManagePage = lazy(() => import("@/features/teachers/pages/TeachersManagePage.old"));
const TeacherPlanningPage = lazy(() => import("@/features/teachers/pages/TeacherPlanningPage"));

// ====================================================================
// ROUTES PROTÉGÉES (Professeurs)
// ====================================================================

/**
 * Routes pour la gestion des professeurs
 * Toutes les routes nécessitent une authentification
 */
export const teachersRoutes: RouteObject[] = [
  {
    path: "pages/cours/ajouter-professeur",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
          <TeachersManagePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/professeurs/planning",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement du planning..." />}>
          <TeacherPlanningPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default teachersRoutes;
