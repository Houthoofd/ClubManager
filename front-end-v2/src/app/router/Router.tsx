/**
 * Application Router
 *
 * Defines all application routes using React Router v7.
 * Includes protected routes, authentication flows, and lazy loading.
 *
 * @module app/router
 */

import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { ErrorBoundary } from "@shared/ui/ErrorBoundary";
import { useAuth } from "@features/auth";

// ============================================================================
// Lazy Loaded Pages
// ============================================================================

// Auth Pages
const LoginPage = React.lazy(() => import("@pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("@pages/auth/RegisterPage"));
const ForgotPasswordPage = React.lazy(
  () => import("@pages/auth/ForgotPasswordPage"),
);
const ResetPasswordPage = React.lazy(
  () => import("@pages/auth/ResetPasswordPage"),
);

// Dashboard
const DashboardPage = React.lazy(
  () => import("@pages/dashboard/DashboardPage"),
);

// Settings
const SettingsPage = React.lazy(() => import("@pages/settings/SettingsPage"));

// Professors
const ProfessorsListPage = React.lazy(
  () => import("@pages/professors/ProfessorsListPage"),
);
const ProfessorDetailPage = React.lazy(
  () => import("@pages/professors/ProfessorDetailPage"),
);

// Courses
const CoursesListPage = React.lazy(
  () => import("@pages/courses/CoursesListPage"),
);
const CourseDetailPage = React.lazy(
  () => import("@pages/courses/CourseDetailPage"),
);

// Error Pages
const NotFoundPage = React.lazy(() => import("./NotFoundPage"));

// ============================================================================
// Protected Route Component
// ============================================================================

interface ProtectedRouteProps {
  /**
   * Required role to access this route
   */
  requiredRole?: string;
  /**
   * Redirect path if not authenticated
   */
  redirectTo?: string;
}

/**
 * Protected Route wrapper component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  redirectTo = "/auth/login",
}) => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div>Chargement...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        state={{
          from: window.location.pathname,
          message: "Vous devez être connecté pour accéder à cette page.",
        }}
        replace
      />
    );
  }

  // Check role if required
  if (requiredRole && user.role !== requiredRole) {
    return (
      <Navigate
        to="/unauthorized"
        state={{
          message:
            "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
        }}
        replace
      />
    );
  }

  // Render child routes
  return <Outlet />;
};

/**
 * Public Route wrapper component
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Don't redirect while loading
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div>Chargement...</div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render child routes
  return <Outlet />;
};

// ============================================================================
// Loading Fallback
// ============================================================================

const LoadingFallback: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
    }}
  >
    <div>Chargement...</div>
  </div>
);

// ============================================================================
// Route Configuration
// ============================================================================

const router = createBrowserRouter([
  // Root redirect
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },

  // Public routes (redirect to dashboard if authenticated)
  {
    path: "/auth",
    element: <PublicRoute />,
    errorElement: (
      <ErrorBoundary>
        <div>Erreur de chargement</div>
      </ErrorBoundary>
    ),
    children: [
      {
        path: "login",
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </React.Suspense>
        ),
      },
      {
        path: "register",
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <RegisterPage />
          </React.Suspense>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <ForgotPasswordPage />
          </React.Suspense>
        ),
      },
      {
        path: "reset-password",
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <ResetPasswordPage />
          </React.Suspense>
        ),
      },
    ],
  },

  // Protected routes (require authentication)
  {
    path: "/dashboard",
    element: <ProtectedRoute />,
    errorElement: (
      <ErrorBoundary>
        <div>Erreur de chargement</div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <DashboardPage />
          </React.Suspense>
        ),
      },
    ],
  },

  // Courses routes
  {
    path: "/courses",
    element: <ProtectedRoute />,
    errorElement: (
      <ErrorBoundary>
        <div>Erreur de chargement</div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <CoursesListPage />
          </React.Suspense>
        ),
      },
      {
        path: ":id",
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <CourseDetailPage />
          </React.Suspense>
        ),
      },
    ],
  },

  // Professors routes
  {
    path: "/professors",
    element: <ProtectedRoute />,
    errorElement: (
      <ErrorBoundary>
        <div>Erreur de chargement</div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <ProfessorsListPage />
          </React.Suspense>
        ),
      },
      {
        path: ":id",
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <ProfessorDetailPage />
          </React.Suspense>
        ),
      },
    ],
  },

  // Members routes (admin only)
  {
    path: "/members",
    element: <ProtectedRoute requiredRole="admin" />,
    errorElement: (
      <ErrorBoundary>
        <div>Erreur de chargement</div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: <div>Members List (à implémenter)</div>,
      },
      {
        path: ":id",
        element: <div>Member Detail (à implémenter)</div>,
      },
    ],
  },

  // Settings routes
  {
    path: "/settings",
    element: <ProtectedRoute />,
    errorElement: (
      <ErrorBoundary>
        <div>Erreur de chargement</div>
      </ErrorBoundary>
    ),
    children: [
      {
        index: true,
        element: (
          <React.Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </React.Suspense>
        ),
      },
    ],
  },

  // Profile routes (legacy - redirect to settings)
  {
    path: "/profile",
    element: <Navigate to="/settings" replace />,
  },

  // Error routes
  {
    path: "/unauthorized",
    element: <div>Non autorisé - 403</div>,
  },
  {
    path: "*",
    element: (
      <React.Suspense fallback={<LoadingFallback />}>
        <NotFoundPage />
      </React.Suspense>
    ),
  },
]);

// ============================================================================
// Router Component
// ============================================================================

/**
 * Main Router component
 * Wraps the entire application with routing functionality
 */
export const Router: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default Router;
