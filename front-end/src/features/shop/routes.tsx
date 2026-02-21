/**
 * ====================================================================
 * SHOP ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature Shop (Magasin).
 * Gestion du magasin, articles, commandes et paiements.
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

const MagasinPage = lazy(() => import("@/features/shop/pages/magasin"));
const AjouterArticlePage = lazy(() => import("@/features/shop/pages/ajouterArticle"));
const SuccessPage = lazy(() => import("@/features/shop/pages/success"));

// ====================================================================
// ROUTES PROTÉGÉES (Magasin)
// ====================================================================

/**
 * Routes pour la gestion du magasin
 * La plupart des routes nécessitent une authentification
 */
export const shopRoutes: RouteObject[] = [
  {
    path: "pages/magasin/magasin",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement du magasin..." />}>
          <MagasinPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/magasin/ajouter-article",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
          <AjouterArticlePage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/pages/magasin/success",
    element: (
      <Suspense fallback={<FullPageSpinner text="Chargement..." />}>
        <SuccessPage />
      </Suspense>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default shopRoutes;
