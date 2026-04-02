/**
 * Main App Component
 *
 * Root component of the application that composes all providers and routing.
 *
 * @module app
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { useAuth } from '@features/auth';

// Lazy load pages
const LoginPage = React.lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage = React.lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = React.lazy(() => import('@pages/auth/ResetPasswordPage'));
const DashboardPage = React.lazy(() => import('@pages/dashboard/DashboardPage'));

// ============================================================================
// Loading Component
// ============================================================================

const LoadingFallback: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontSize: '1.2rem',
      color: '#667eea',
    }}
  >
    <div>Chargement...</div>
  </div>
);

// ============================================================================
// Protected Route Component
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return (
      <Navigate
        to="/auth/login"
        state={{
          from: window.location.pathname,
          message: 'Vous devez être connecté pour accéder à cette page.'
        }}
        replace
      />
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ message: 'Vous n\'avez pas les permissions nécessaires.' }}
        replace
      />
    );
  }

  return <>{children}</>;
};

// ============================================================================
// Public Route Component
// ============================================================================

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ============================================================================
// 404 Page
// ============================================================================

const NotFoundPage: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem',
    }}
  >
    <h1 style={{ fontSize: '6rem', margin: 0, color: '#667eea' }}>404</h1>
    <h2 style={{ fontSize: '2rem', marginTop: '1rem' }}>Page non trouvée</h2>
    <p style={{ color: '#6c757d', marginTop: '1rem' }}>
      La page que vous recherchez n'existe pas.
    </p>
    <a
      href="/"
      style={{
        marginTop: '2rem',
        padding: '0.75rem 2rem',
        background: '#667eea',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 500,
      }}
    >
      Retour à l'accueil
    </a>
  </div>
);

// ============================================================================
// Unauthorized Page
// ============================================================================

const UnauthorizedPage: React.FC = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      padding: '2rem',
    }}
  >
    <h1 style={{ fontSize: '6rem', margin: 0, color: '#dc3545' }}>403</h1>
    <h2 style={{ fontSize: '2rem', marginTop: '1rem' }}>Accès refusé</h2>
    <p style={{ color: '#6c757d', marginTop: '1rem' }}>
      Vous n'avez pas les permissions nécessaires pour accéder à cette page.
    </p>
    <a
      href="/dashboard"
      style={{
        marginTop: '2rem',
        padding: '0.75rem 2rem',
        background: '#667eea',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 500,
      }}
    >
      Retour au tableau de bord
    </a>
  </div>
);

// ============================================================================
// Main App Component
// ============================================================================

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Public routes (auth) */}
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/forgot-password"
            element={
              <PublicRoute>
                <ForgotPasswordPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/reset-password"
            element={
              <PublicRoute>
                <ResetPasswordPage />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/courses"
            element={
              <ProtectedRoute>
                <div style={{ padding: '2rem' }}>
                  <h1>Courses Page (à implémenter)</h1>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute requiredRole="admin">
                <div style={{ padding: '2rem' }}>
                  <h1>Members Page (admin only - à implémenter)</h1>
                </div>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div style={{ padding: '2rem' }}>
                  <h1>Profile Page (à implémenter)</h1>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Error pages */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </React.Suspense>
    </ErrorBoundary>
  );
};

export default App;
