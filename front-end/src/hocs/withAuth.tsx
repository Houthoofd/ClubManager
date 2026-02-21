import React, { ComponentType, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '@patternfly/react-core';

export interface WithAuthOptions {
  /**
   * Redirection path when user is not authenticated
   * @default '/login'
   */
  redirectTo?: string;

  /**
   * Show loading spinner while checking authentication
   * @default true
   */
  showLoader?: boolean;

  /**
   * Custom loader component
   */
  LoaderComponent?: ComponentType;

  /**
   * Callback when user is not authenticated
   */
  onUnauthorized?: () => void;

  /**
   * Allow access even if not authenticated (useful for optional auth)
   * @default false
   */
  allowGuest?: boolean;
}

/**
 * HOC to protect routes that require authentication
 *
 * @example
 * ```typescript
 * const ProtectedDashboard = withAuth(Dashboard);
 *
 * // With options
 * const ProtectedProfile = withAuth(Profile, {
 *   redirectTo: '/unauthorized',
 *   showLoader: true
 * });
 * ```
 */
export function withAuth<P extends object>(
  WrappedComponent: ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const {
    redirectTo = '/login',
    showLoader = true,
    LoaderComponent,
    onUnauthorized,
    allowGuest = false,
  } = options;

  const ComponentWithAuth: React.FC<P> = (props) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuthStore();

    useEffect(() => {
      if (!isLoading && !isAuthenticated && !allowGuest) {
        onUnauthorized?.();
        navigate(redirectTo, { replace: true });
      }
    }, [isLoading, isAuthenticated, navigate]);

    // Still loading authentication state
    if (isLoading) {
      if (!showLoader) return null;

      if (LoaderComponent) {
        return <LoaderComponent />;
      }

      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <Spinner size="xl" />
        </div>
      );
    }

    // Not authenticated and guest not allowed
    if (!isAuthenticated && !allowGuest) {
      return null;
    }

    // Authenticated or guest allowed - render component
    return <WrappedComponent {...props} user={user} />;
  };

  ComponentWithAuth.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithAuth;
}

/**
 * HOC variant that requires specific roles
 *
 * @example
 * ```typescript
 * const AdminPanel = withAuthRole(Panel, ['ADMIN', 'SUPER_ADMIN']);
 * ```
 */
export function withAuthRole<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRoles: string[],
  options: WithAuthOptions & {
    unauthorizedRedirect?: string;
    onInsufficientPermissions?: () => void;
  } = {}
) {
  const {
    unauthorizedRedirect = '/unauthorized',
    onInsufficientPermissions,
    ...authOptions
  } = options;

  const ComponentWithAuthRole: React.FC<P> = (props) => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading } = useAuthStore();

    const hasRequiredRole = React.useMemo(() => {
      if (!user?.role) return false;
      return requiredRoles.includes(user.role);
    }, [user?.role]);

    useEffect(() => {
      if (!isLoading && isAuthenticated && !hasRequiredRole) {
        onInsufficientPermissions?.();
        navigate(unauthorizedRedirect, { replace: true });
      }
    }, [isLoading, isAuthenticated, hasRequiredRole, navigate]);

    // First check authentication
    const AuthenticatedComponent = withAuth(WrappedComponent, authOptions);

    // Still loading or not authenticated
    if (isLoading || !isAuthenticated) {
      return <AuthenticatedComponent {...props} />;
    }

    // Authenticated but insufficient permissions
    if (!hasRequiredRole) {
      return null;
    }

    // Has required role - render component
    return <WrappedComponent {...props} user={user} />;
  };

  ComponentWithAuthRole.displayName = `withAuthRole(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithAuthRole;
}

/**
 * Hook version for functional components
 *
 * @example
 * ```typescript
 * function Dashboard() {
 *   useRequireAuth();
 *   return <div>Protected content</div>;
 * }
 * ```
 */
export function useRequireAuth(options: WithAuthOptions = {}) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { redirectTo = '/login', onUnauthorized, allowGuest = false } = options;

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !allowGuest) {
      onUnauthorized?.();
      navigate(redirectTo, { replace: true });
    }
  }, [isLoading, isAuthenticated, allowGuest, navigate, redirectTo, onUnauthorized]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook version for role-based access
 *
 * @example
 * ```typescript
 * function AdminPanel() {
 *   const { hasAccess } = useRequireRole(['ADMIN']);
 *   if (!hasAccess) return <Unauthorized />;
 *   return <div>Admin content</div>;
 * }
 * ```
 */
export function useRequireRole(
  requiredRoles: string[],
  options: WithAuthOptions & { unauthorizedRedirect?: string } = {}
) {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { unauthorizedRedirect = '/unauthorized' } = options;

  const hasAccess = React.useMemo(() => {
    if (!user?.role) return false;
    return requiredRoles.includes(user.role);
  }, [user?.role, requiredRoles]);

  useRequireAuth(options);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      navigate(unauthorizedRedirect, { replace: true });
    }
  }, [isLoading, isAuthenticated, hasAccess, navigate, unauthorizedRedirect]);

  return { hasAccess, isLoading, user };
}
