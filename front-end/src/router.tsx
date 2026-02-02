// router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';

import MainLayout from './components/mainLayout';
import DashboardPage from './pages/dashboard';
import LoginPage from './pages/connexion';
import ProtectedRoute from './pages/protectedroute';

import Inscription from './pages/cours/inscription';
import AjouterCours from './pages/cours/ajouterCours';
import AjouterProfesseur from './pages/professeurs/ajouterProf';
import PlanningCours from './pages/professeurs/PlanningCours';
import Participants from './pages/cours/consulterParticipants';

import Magasin from './pages/magasin/magasin';
import AjouterArticle from './pages/magasin/ajouterArticle';
import Commandes from './pages/commandes/commandes';

import Utilisateur from './pages/utilisateurs/ajouterUtilisateur';
import ConsulterUtilisateur from './pages/utilisateurs/consulterUtilisateur';

import Compte from './pages/compte';

import Settings from './pages/settings';

import Paiements from './pages/paiements';

import Messages from './pages/messages';

import InscriptionPage from './pages/inscription';
import VerifyEmail from './pages/verifyemail';

import StatistiquesPage from './pages/statistiques';

import PaymentSuccessPage from './pages/magasin/success';
import PaiementPage from './pages/paiement/paiement';
import ConnexionPage from './pages/connexion';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';

const router = createBrowserRouter([
  // Routes publiques pour l'authentification (HORS de l'app)
  {
    path: '/pages/connexion',
    element: <LoginPage />,
  },
  {
    path: '/pages/inscription',
    element: <InscriptionPage />,
  },
  {
    path: '/pages/verify-email',
    element: <VerifyEmail />,
  },
  // CORRIGÉ: Routes de récupération de mot de passe avec les bonnes paths
  {
    path: '/pages/auth/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/pages/auth/reset-password',
    element: <ResetPasswordPage />,
  },
  
  // Route principale avec layout protégé
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // ✅ Redirection par défaut vers la page d'inscription
      {
        index: true,
        element: <Navigate to="pages/cours/inscription" replace />,
      },
      {
        path: 'pages/dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/cours/inscription',
        element: (
          <ProtectedRoute>
            <Inscription />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/cours/:id/participants',
        element: (
          <ProtectedRoute>
            <Participants />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/cours/ajouter-cours',
        element: (
          <ProtectedRoute>
            <AjouterCours />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/cours/ajouter-professeur',
        element: (
          <ProtectedRoute>
            <AjouterProfesseur />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/professeurs/planning',
        element: (
          <ProtectedRoute>
            <PlanningCours />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/magasin/ajouter-article',
        element: (
          <ProtectedRoute>
            <AjouterArticle />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/magasin/magasin',
        element: (
          <ProtectedRoute>
            <Magasin />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/magasin/commandes',
        element: (
          <ProtectedRoute>
            <Commandes />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/utilisateurs/ajouter-utilisateur',
        element: (
          <ProtectedRoute>
            <Utilisateur />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/utilisateurs/consulter/:id',
        element: (
          <ProtectedRoute>
            <ConsulterUtilisateur />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/compte',
        element: (
          <ProtectedRoute>
            <Compte />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/paiements',
        element: (
          <ProtectedRoute>
            <Paiements />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/messages',
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/notifications',
        element: (
          <ProtectedRoute>
            <Paiements />
          </ProtectedRoute>
        ),
      },
      {
        path: 'pages/statistiques',
        element: (
          <ProtectedRoute>
            <StatistiquesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/pages/magasin/success',
        element: <PaymentSuccessPage />,
      },
      {
        path: 'pages/paiement',
        element: <PaiementPage />,
      },
      {
        path: '/connexion',
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
        path: '*',
        element: <Navigate to="/pages/cours/inscription" replace />
      }
    ],
  },
  // AJOUTÉ: Route catch-all globale pour rediriger vers connexion
  {
    path: '*',
    element: <Navigate to="/pages/connexion" replace />
  }
]);

export default router;
