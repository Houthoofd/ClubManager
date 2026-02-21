/**
 * ====================================================================
 * APP ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes générales de l'application.
 * Dashboard, compte utilisateur, settings, paiements, notifications.
 */

import { RouteObject } from "react-router-dom";
import ProtectedRoute from "@/pages/protectedroute";
import DashboardPage from "@/features/stats/pages/DashboardPage";
import AccountPage from "@/features/auth/pages/AccountPage";
import Settings from "@/pages/settings";
import NotificationsPage from "@/features/messages/pages/NotificationsPage";
import PaymentPage from "@/features/orders/pages/PaymentPage";

// ====================================================================
// ROUTES PROTÉGÉES (Application générale)
// ====================================================================

/**
 * Routes générales de l'application
 * Toutes les routes nécessitent une authentification
 */
export const appRoutes: RouteObject[] = [
  {
    path: "pages/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/compte",
    element: (
      <ProtectedRoute>
        <AccountPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/settings",
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "pages/paiement",
    element: <PaymentPage />,
  },
  {
    path: "pages/notifications",
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default appRoutes;
