// components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthentifie } from '../hooks/useAuth';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, isLoading } = useAuthentifie();
  const location = useLocation();

  if (isLoading) {
    // Affiche un loader ou rien pendant la vérification
    return <div>Chargement...</div>;
  }

  if (!data?.authentifie) {
    // Redirige vers la page de connexion si non authentifié
    return <Navigate to="/pages/connexion" state={{ from: location }} replace />;
  }

  // Si authentifié, affiche les enfants (la page protégée)
  return <>{children}</>;
};

export default ProtectedRoute;
