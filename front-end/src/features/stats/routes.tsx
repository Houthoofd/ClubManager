/**
 * ====================================================================
 * STATS ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature Stats (Statistiques).
 * Gestion des statistiques et tableaux de bord analytiques.
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

const StatistiquesPage = lazy(() => import("@/features/stats/pages/StatistiquesPage"));

// ====================================================================
// ROUTES PROTÉGÉES (Statistiques)
// ====================================================================

/**
 * Routes pour les statistiques
 * Toutes les routes nécessitent une authentification
 */
export const statsRoutes: RouteObject[] = [
  {
    path: "pages/statistiques",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement des statistiques..." />}>
          <StatistiquesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default statsRoutes;
