/**
 * ====================================================================
 * ROUTES INDEX - CLUBMANAGER
 * ====================================================================
 *
 * Point d'entrée centralisé pour toutes les routes de l'application.
 * Importe et combine les routes de toutes les features.
 *
 * Architecture:
 * - Routes publiques (auth) en dehors du MainLayout
 * - Routes protégées (features) dans le MainLayout
 * - Redirections et gestion des 404
 */

import { createBrowserRouter, Navigate, RouteObject } from "react-router-dom";
import MainLayout from "@/shared/components/layout/MainLayout";

// ====================================================================
// IMPORT DES ROUTES PAR FEATURE
// ====================================================================

// Routes publiques (authentification)
import { authPublicRoutes } from "@/features/auth/routes";

// Routes protégées par feature
import { appRoutes } from "./app.routes";
import { coursesRoutes } from "@/features/courses/routes";
import { teachersRoutes } from "@/features/teachers/routes";
import { shopRoutes } from "@/features/shop/routes";
import { ordersRoutes } from "@/features/orders/routes";
import { usersRoutes } from "@/features/users/routes";
import { messagesRoutes } from "@/features/messages/routes";
import { statsRoutes } from "@/features/stats/routes";

// ====================================================================
// CONFIGURATION DU ROUTER
// ====================================================================

/**
 * Configuration principale du router de l'application
 *
 * Structure:
 * 1. Routes publiques (auth) - HORS MainLayout
 * 2. Routes protégées - DANS MainLayout
 *    - Dashboard, compte, settings
 *    - Features: courses, teachers, shop, orders, users, messages, stats
 * 3. Redirections et catch-all
 */
const routerConfig: RouteObject[] = [
  // ================================================================
  // ROUTES PUBLIQUES (Authentification)
  // ================================================================
  ...authPublicRoutes,

  // ================================================================
  // ROUTES PROTÉGÉES (Application principale)
  // ================================================================
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // Redirection par défaut vers la page d'inscription aux cours
      {
        index: true,
        element: <Navigate to="pages/cours/inscription" replace />,
      },

      // Routes générales de l'application
      ...appRoutes,

      // Routes par feature
      ...coursesRoutes,
      ...teachersRoutes,
      ...shopRoutes,
      ...ordersRoutes,
      ...usersRoutes,
      ...messagesRoutes,
      ...statsRoutes,

      // Catch-all pour les routes inconnues dans l'app
      {
        path: "*",
        element: <Navigate to="/pages/cours/inscription" replace />,
      },
    ],
  },

  // ================================================================
  // CATCH-ALL GLOBAL
  // ================================================================
  // Redirection vers la page de connexion pour toute route inconnue
  {
    path: "*",
    element: <Navigate to="/pages/connexion" replace />,
  },
];

// ====================================================================
// CRÉATION DU ROUTER
// ====================================================================

export const router = createBrowserRouter(routerConfig);

// ====================================================================
// EXPORTS
// ====================================================================

export default router;

// Export des routes individuelles pour faciliter les tests
export {
  authPublicRoutes,
  appRoutes,
  coursesRoutes,
  teachersRoutes,
  shopRoutes,
  ordersRoutes,
  usersRoutes,
  messagesRoutes,
  statsRoutes,
};
