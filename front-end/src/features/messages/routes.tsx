/**
 * ====================================================================
 * MESSAGES ROUTES - CLUBMANAGER
 * ====================================================================
 *
 * Configuration des routes pour la feature Messages.
 * Gestion de la messagerie interne.
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

const MessagesPage = lazy(() => import("@/features/messages/pages/MessagesPage"));

// ====================================================================
// ROUTES PROTÉGÉES (Messages)
// ====================================================================

/**
 * Routes pour la gestion des messages
 * Toutes les routes nécessitent une authentification
 */
export const messagesRoutes: RouteObject[] = [
  {
    path: "pages/messages",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<FullPageSpinner text="Chargement des messages..." />}>
          <MessagesPage />
        </Suspense>
      </ProtectedRoute>
    ),
  },
];

// ====================================================================
// EXPORTS
// ====================================================================

export default messagesRoutes;
