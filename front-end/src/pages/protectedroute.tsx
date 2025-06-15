// components/ProtectedRoute.tsx
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: Props) => {
  const storedData = localStorage.getItem('userData');

  if (!storedData) {
    return <Navigate to="/pages/connexion" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
