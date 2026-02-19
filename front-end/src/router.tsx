// router.tsx
import { createBrowserRouter, Navigate } from "react-router-dom";

import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/dashboard";
import LoginPage from "./pages/login";
import ProtectedRoute from "./pages/protectedroute";

import CoursesEnrollPage from "./pages/courses-enroll";
import CoursesManagePage from "./pages/courses-manage";
import CoursesParticipantsPage from "./pages/courses-participants";
import TeachersManagePage from "./pages/teachers-manage";
import TeacherPlanningPage from "./pages/teachers-planning";

import Magasin from "./pages/shop";
import AjouterArticle from "./pages/shop-add-product";
import OrdersManagementPage from "./pages/orders";

import UsersManagePage from "./pages/users-manage";
import UsersDetailPage from "./pages/users-detail";

import Compte from "./pages/compte";

import Settings from "./pages/settings";

import Paiements from "./pages/paiements";

import Messages from "./pages/messages";

import InscriptionPage from "./pages/register";
import VerifyEmail from "./pages/verify-email";

import StatistiquesPage from "./pages/statistiques";

import PaymentSuccessPage from "./pages/shop-success";
import PaiementPage from "./pages/paiement/paiement";
import ConnexionPage from "./pages/login";
import ForgotPasswordPage from "./pages/auth-forgot-password";
import ResetPasswordPage from "./pages/auth-reset-password";

const router = createBrowserRouter([
  // Routes publiques pour l'authentification (HORS de l'app)
  {
    path: "/pages/connexion",
    element: <LoginPage />,
  },
  {
    path: "/pages/inscription",
    element: <InscriptionPage />,
  },
  {
    path: "/pages/verify-email",
    element: <VerifyEmail />,
  },
  // CORRIGÉ: Routes de récupération de mot de passe avec les bonnes paths
  {
    path: "/pages/auth/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/pages/auth/reset-password",
    element: <ResetPasswordPage />,
  },

  // Route principale avec layout protégé
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // ✅ Redirection par défaut vers la page d'inscription
      {
        index: true,
        element: <Navigate to="pages/cours/inscription" replace />,
      },
      {
        path: "pages/dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/cours/inscription",
        element: (
          <ProtectedRoute>
            <CoursesEnrollPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/cours/:id/participants",
        element: (
          <ProtectedRoute>
            <CoursesParticipantsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/cours/ajouter-cours",
        element: (
          <ProtectedRoute>
            <CoursesManagePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/cours/ajouter-professeur",
        element: (
          <ProtectedRoute>
            <TeachersManagePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/professeurs/planning",
        element: (
          <ProtectedRoute>
            <TeacherPlanningPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/magasin/ajouter-article",
        element: (
          <ProtectedRoute>
            <AjouterArticle />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/magasin/magasin",
        element: (
          <ProtectedRoute>
            <Magasin />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/magasin/commandes",
        element: (
          <ProtectedRoute>
            <OrdersManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/utilisateurs/ajouter-utilisateur",
        element: (
          <ProtectedRoute>
            <UsersManagePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/utilisateurs/consulter/:id",
        element: (
          <ProtectedRoute>
            <UsersDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/compte",
        element: (
          <ProtectedRoute>
            <Compte />
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
        path: "pages/paiements",
        element: (
          <ProtectedRoute>
            <Paiements />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/messages",
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/notifications",
        element: (
          <ProtectedRoute>
            <Paiements />
          </ProtectedRoute>
        ),
      },
      {
        path: "pages/statistiques",
        element: (
          <ProtectedRoute>
            <StatistiquesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "/pages/magasin/success",
        element: <PaymentSuccessPage />,
      },
      {
        path: "pages/paiement",
        element: <PaiementPage />,
      },
      {
        path: "/connexion",
        element: <ConnexionPage />,
      },
      // SUPPRIMÉ: Routes de récupération déplacées vers les routes publiques
      // {
      //   path: '/forgot-password',
      //   element: <ForgotPasswordPage />,
      // },
      // {
      //   path: '/reset-password',
      //   element: <ResetPasswordPage />,
      // },
      // AJOUTÉ: Route catch-all pour gérer les 404 dans l'app
      {
        path: "*",
        element: <Navigate to="/pages/cours/inscription" replace />,
      },
    ],
  },
  // AJOUTÉ: Route catch-all globale pour rediriger vers connexion
  {
    path: "*",
    element: <Navigate to="/pages/connexion" replace />,
  },
]);

export default router;
