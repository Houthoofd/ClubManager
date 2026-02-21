/**
 * ====================================================================
 * ORDERS ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature Orders (Commandes).
 * Gestion des commandes clients.
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

const OrdersPage = lazy(() => import("@/features/orders/pages/OrdersPage"));

// ====================================================================
// ROUTES PROTÉGÉES (Commandes)
// ====================================================================

/**
 * Routes pour la gestion des commandes
 * Toutes les routes nécessitent une authentification
 */
export const ordersRoutes: RouteObject[] = [
  {
    path: "pages/magasin/commandes",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement des commandes..." />}>
          <OrdersPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default ordersRoutes;
