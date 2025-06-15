// router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';

import MainLayout from './components/mainLayout';
import DashboardPage from './pages/dashboard';
import LoginPage from './pages/connexion';
import ProtectedRoute from './pages/protectedroute';

import Inscription from './pages/cours/inscription';
import AjouterCours from './pages/cours/ajouterCours';
import AjouterProfesseur from './pages/cours/ajouterProf';
import Participants from './pages/cours/consulterParticipants';

import Magasin from './pages/magasin/magasin';
import AjouterArticle from './pages/magasin/ajouterArticle';

import Utilisateur from './pages/utilisateurs/ajouterUtilisateur';
import ConsulterUtilisateur from './pages/utilisateurs/consulterUtilisateur';

import Compte from './pages/compte';

import Settings from './pages/settings';

import Paiements from './pages/paiements';

import Messages from './pages/messages';

const router = createBrowserRouter([
  // Route publique pour la page de connexion
  {
    path: '/pages/connexion',
    element: <LoginPage />,
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
    ],
  },
]);

export default router;
