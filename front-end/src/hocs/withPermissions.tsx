import React, { ComponentType } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface WithPermissionsOptions {
  /**
   * Roles autorisés à accéder au composant
   */
  allowedRoles?: UserRole[];

  /**
   * Permissions spécifiques requises
   */
  requiredPermissions?: string[];

  /**
   * Si true, l'utilisateur doit avoir TOUTES les permissions
   * Si false, l'utilisateur doit avoir AU MOINS UNE permission
   */
  requireAll?: boolean;

  /**
   * Rediriger vers cette route si accès refusé (au lieu d'afficher le message)
   */
  redirectTo?: string;

  /**
   * Message personnalisé à afficher si accès refusé
   */
  accessDeniedMessage?: string;

  /**
   * Callback appelé quand l'accès est refusé
   */
  onAccessDenied?: () => void;
}

interface AccessDeniedProps {
  message: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ message }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      textAlign: "center",
      minHeight: "300px",
    }}
  >
    <div
      style={{
        fontSize: "3rem",
        marginBottom: "1rem",
        color: "var(--pf-v5-global--danger-color--100)",
      }}
    >
      🚫
    </div>
    <h4 style={{ marginBottom: "0.5rem", fontSize: "1.25rem", fontWeight: 600 }}>Accès refusé</h4>
    <p style={{ color: "var(--pf-v5-global--Color--200)" }}>{message}</p>
  </div>
);

/**
 * HOC qui protège un composant avec un contrôle d'accès basé sur les rôles et permissions
 *
 * @example
 * ```typescript
 * // Protéger par rôle
 * const AdminDashboard = withPermissions(Dashboard, {
 *   allowedRoles: ['admin']
 * });
 *
 * // Protéger par permissions
 * const CourseEditor = withPermissions(Editor, {
 *   requiredPermissions: ['courses.edit', 'courses.create']
 * });
 *
 * // Redirection si accès refusé
 * const SecretPage = withPermissions(Secret, {
 *   allowedRoles: ['admin'],
 *   redirectTo: '/dashboard'
 * });
 * ```
 */
export function withPermissions<P extends object>(
  Component: ComponentType<P>,
  options: WithPermissionsOptions = {},
) {
  const {
    allowedRoles = [],
    requiredPermissions = [],
    requireAll = false,
    redirectTo,
    accessDeniedMessage = "Vous n'avez pas les permissions nécessaires pour accéder à cette page.",
    onAccessDenied,
  } = options;

  const WrappedComponent: React.FC<P> = (props) => {
    const { user, isAuthenticated } = useAuthStore();

    // Vérifier l'authentification
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" replace />;
    }

    // Vérifier les rôles
    const hasRequiredRole =
      allowedRoles.length === 0 || allowedRoles.includes(user.role as UserRole);

    // Vérifier les permissions
    const userPermissions = (user as any).permissions || [];
    let hasRequiredPermissions = true;

    if (requiredPermissions.length > 0) {
      if (requireAll) {
        // L'utilisateur doit avoir TOUTES les permissions requises
        hasRequiredPermissions = requiredPermissions.every((permission) =>
          userPermissions.includes(permission),
        );
      } else {
        // L'utilisateur doit avoir AU MOINS UNE permission requise
        hasRequiredPermissions = requiredPermissions.some((permission) =>
          userPermissions.includes(permission),
        );
      }
    }

    // Vérifier l'accès
    const hasAccess = hasRequiredRole && hasRequiredPermissions;

    if (!hasAccess) {
      // Appeler le callback si fourni
      if (onAccessDenied) {
        onAccessDenied();
      }

      // Rediriger si spécifié
      if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
      }

      // Sinon, afficher le message d'accès refusé
      return <AccessDenied message={accessDeniedMessage} />;
    }

    // L'utilisateur a l'accès, rendre le composant
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPermissions(${Component.displayName || Component.name || "Component"})`;

  return WrappedComponent;
}

/**
 * Hook personnalisé pour vérifier les permissions dans les composants
 *
 * @example
 * ```typescript
 * const MyComponent = () => {
 *   const { hasPermission, hasRole, hasAnyPermission } = usePermissions();
 *
 *   if (!hasRole('admin')) {
 *     return <div>Admin only</div>;
 *   }
 *
 *   return (
 *     <div>
 *       {hasPermission('courses.edit') && <EditButton />}
 *       {hasAnyPermission(['courses.delete', 'admin.delete']) && <DeleteButton />}
 *     </div>
 *   );
 * };
 * ```
 */
export function usePermissions() {
  const { user, isAuthenticated } = useAuthStore();

  const hasRole = (role: UserRole): boolean => {
    return isAuthenticated && user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return isAuthenticated && user ? roles.includes(user.role as UserRole) : false;
  };

  const hasPermission = (permission: string): boolean => {
    return isAuthenticated && user ? ((user as any).permissions || []).includes(permission) : false;
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    const userPermissions = (user as any).permissions || [];
    return permissions.every((permission) => userPermissions.includes(permission));
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user) return false;
    const userPermissions = (user as any).permissions || [];
    return permissions.some((permission) => userPermissions.includes(permission));
  };

  return {
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    isAuthenticated,
    user,
  };
}

/**
 * Composant wrapper pour le contrôle conditionnel de permissions
 *
 * @example
 * ```tsx
 * <RequirePermissions allowedRoles={['admin']}>
 *   <AdminPanel />
 * </RequirePermissions>
 *
 * <RequirePermissions requiredPermissions={['courses.edit']}>
 *   <EditButton />
 * </RequirePermissions>
 * ```
 */
interface RequirePermissionsProps extends WithPermissionsOptions {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RequirePermissions: React.FC<RequirePermissionsProps> = ({
  children,
  fallback = null,
  allowedRoles = [],
  requiredPermissions = [],
  requireAll = false,
}) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  const hasRequiredRole = allowedRoles.length === 0 || allowedRoles.includes(user.role as UserRole);

  const userPermissions = (user as any).permissions || [];
  let hasRequiredPermissions = true;

  if (requiredPermissions.length > 0) {
    if (requireAll) {
      hasRequiredPermissions = requiredPermissions.every((permission) =>
        userPermissions.includes(permission),
      );
    } else {
      hasRequiredPermissions = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );
    }
  }

  const hasAccess = hasRequiredRole && hasRequiredPermissions;

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
