/**
 * ====================================================================
 * COURSES ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature Courses (Cours).
 * Gestion des inscriptions, participants, et ajout de cours.
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

const InscriptionPage = lazy(() => import("@/features/courses/pages/InscriptionPage"));
const AddCoursePage = lazy(() => import("@/features/courses/pages/AddCoursePage"));
const ParticipantsPage = lazy(() => import("@/features/courses/pages/ParticipantsPage"));

// ====================================================================
// ROUTES PROTÉGÉES (Cours)
// ====================================================================

/**
 * Routes pour la gestion des cours
 * Toutes les routes nécessitent une authentification
 */
export const coursesRoutes: RouteObject[] = [
  {
    path: "pages/cours/inscription",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement des inscriptions..." />}>
          <InscriptionPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/cours/:id/participants",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement des participants..." />}>
          <ParticipantsPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/cours/ajouter-cours",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
          <AddCoursePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default coursesRoutes;
