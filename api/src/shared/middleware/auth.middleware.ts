/**
 * Authentication Middleware for GraphQL
 *
 * Provides authentication and authorization middlewares for GraphQL resolvers.
 * These middlewares check user authentication status and permissions.
 */

import { GraphQLResolveInfo } from "graphql";
import {
  AuthenticationError,
  AuthorizationError,
} from "../errors/GraphQLErrors.js";

/**
 * User context interface
 * This should match your authentication token structure
 */
export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  status_id: number;
  role: string;
  status: string;
}

/**
 * GraphQL context interface
 * Re-export from shared types for convenience
 */
export { GraphQLContext } from "../types/context.types.js";

/**
 * Status/Role constants
 */
export const UserRole = {
  ADMIN: "admin",
  PROFESSEUR: "professeur",
  MEMBRE: "membre",
  PROSPECT: "prospect",
} as const;

export const UserStatusId = {
  ADMIN: 1,
  PROFESSEUR: 2,
  MEMBRE: 3,
  PROSPECT: 4,
} as const;

/**
 * Check if user is authenticated
 */
export function isAuthenticated(context: GraphQLContext): boolean {
  return !!context.user && !!context.user.id;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: AuthUser): boolean {
  return (
    user.status_id === UserStatusId.ADMIN ||
    user.role === UserRole.ADMIN ||
    user.status === UserRole.ADMIN
  );
}

/**
 * Check if user is professeur
 */
export function isProfesseur(user: AuthUser): boolean {
  return (
    user.status_id === UserStatusId.PROFESSEUR ||
    user.role === UserRole.PROFESSEUR ||
    user.status === UserRole.PROFESSEUR
  );
}

/**
 * Check if user is membre (paid member)
 */
export function isMembre(user: AuthUser): boolean {
  return (
    user.status_id === UserStatusId.MEMBRE ||
    user.role === UserRole.MEMBRE ||
    user.status === UserRole.MEMBRE
  );
}

/**
 * Check if user is prospect (unpaid)
 */
export function isProspect(user: AuthUser): boolean {
  return (
    user.status_id === UserStatusId.PROSPECT ||
    user.role === UserRole.PROSPECT ||
    user.status === UserRole.PROSPECT
  );
}

/**
 * Check if user owns the resource
 */
export function isOwner(user: AuthUser, resourceUserId: number): boolean {
  return user.id === resourceUserId;
}

/**
 * Check if user has admin or professeur privileges
 */
export function isStaff(user: AuthUser): boolean {
  return isAdmin(user) || isProfesseur(user);
}

/**
 * Middleware: Require authentication
 * Throws AuthenticationError if user is not authenticated
 */
export function requireAuth<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    return resolver(parent, args, context, info);
  };
}

/**
 * Middleware: Require admin role
 * Throws AuthenticationError if not authenticated
 * Throws AuthorizationError if not admin
 */
export function requireAdmin<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    if (!context.user || !isAdmin(context.user)) {
      throw new AuthorizationError(
        "Vous devez être administrateur pour accéder à cette ressource",
      );
    }

    return resolver(parent, args, context, info);
  };
}

/**
 * Middleware: Require professeur or admin role
 * Throws AuthenticationError if not authenticated
 * Throws AuthorizationError if not professeur or admin
 */
export function requireStaff<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    if (!context.user || !isStaff(context.user)) {
      throw new AuthorizationError(
        "Vous devez être professeur ou administrateur pour accéder à cette ressource",
      );
    }

    return resolver(parent, args, context, info);
  };
}

/**
 * Middleware: Require owner or admin
 * Checks if user is the owner of the resource OR an admin
 *
 * @param getUserId - Function to extract the resource owner's user ID from args
 */
export function requireOwner<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  getUserId: (args: TArgs) => number | Promise<number>,
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    if (!context.user) {
      throw new AuthenticationError("Utilisateur non trouvé dans le contexte");
    }

    // Admin can access everything
    if (isAdmin(context.user)) {
      return resolver(parent, args, context, info);
    }

    // Check ownership
    const resourceUserId = await getUserId(args);
    if (!isOwner(context.user, resourceUserId)) {
      throw new AuthorizationError(
        "Vous n'avez pas les droits pour accéder à cette ressource",
      );
    }

    return resolver(parent, args, context, info);
  };
}

/**
 * Middleware: Require owner, staff, or admin
 * More flexible version that allows staff (professeur) access in addition to owner/admin
 *
 * @param getUserId - Function to extract the resource owner's user ID from args
 */
export function requireOwnerOrStaff<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  getUserId: (args: TArgs) => number | Promise<number>,
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    if (!context.user) {
      throw new AuthenticationError("Utilisateur non trouvé dans le contexte");
    }

    // Admin or professeur can access everything
    if (isStaff(context.user)) {
      return resolver(parent, args, context, info);
    }

    // Check ownership
    const resourceUserId = await getUserId(args);
    if (!isOwner(context.user, resourceUserId)) {
      throw new AuthorizationError(
        "Vous n'avez pas les droits pour accéder à cette ressource",
      );
    }

    return resolver(parent, args, context, info);
  };
}

/**
 * Middleware: Require membre status (paid member)
 * Throws AuthenticationError if not authenticated
 * Throws AuthorizationError if not membre or higher
 */
export function requireMembre<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    if (!context.user) {
      throw new AuthenticationError("Utilisateur non trouvé dans le contexte");
    }

    // Admin, professeur, or membre can access
    if (
      isAdmin(context.user) ||
      isProfesseur(context.user) ||
      isMembre(context.user)
    ) {
      return resolver(parent, args, context, info);
    }

    throw new AuthorizationError(
      "Vous devez être membre pour accéder à cette ressource. Veuillez effectuer un paiement.",
    );
  };
}

/**
 * Middleware: Require specific role(s)
 * More generic middleware to check for specific roles
 *
 * @param allowedRoles - Array of allowed roles/statuses
 */
export function requireRole<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  allowedRoles: string[],
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    if (!context.user) {
      throw new AuthenticationError("Utilisateur non trouvé dans le contexte");
    }

    const userRole = context.user.role || context.user.status;
    if (!allowedRoles.includes(userRole)) {
      throw new AuthorizationError(
        `Cette ressource nécessite un des rôles suivants: ${allowedRoles.join(", ")}`,
      );
    }

    return resolver(parent, args, context, info);
  };
}

/**
 * Middleware: Require specific status ID(s)
 * Checks by status_id rather than role string
 *
 * @param allowedStatusIds - Array of allowed status IDs
 */
export function requireStatusId<
  TArgs = any,
  TContext extends GraphQLContext = GraphQLContext,
  TResult = any,
>(
  allowedStatusIds: number[],
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    if (!isAuthenticated(context)) {
      throw new AuthenticationError(
        "Vous devez être connecté pour accéder à cette ressource",
      );
    }

    if (!context.user) {
      throw new AuthenticationError("Utilisateur non trouvé dans le contexte");
    }

    if (!allowedStatusIds.includes(context.user.status_id)) {
      throw new AuthorizationError(
        "Vous n'avez pas le statut requis pour accéder à cette ressource",
      );
    }

    return resolver(parent, args, context, info);
  };
}

/**
 * Helper: Combine multiple middlewares
 * Allows you to chain multiple middleware functions
 *
 * Example:
 * ```ts
 * const resolver = combineMiddlewares(
 *   requireAuth,
 *   withValidation(schema),
 *   withAuditLog('user.update')
 * )(myResolver);
 * ```
 */
export function combineMiddlewares<TArgs = any, TContext = any, TResult = any>(
  ...middlewares: Array<
    (
      resolver: (
        parent: any,
        args: TArgs,
        context: TContext,
        info: GraphQLResolveInfo,
      ) => Promise<TResult>,
    ) => (
      parent: any,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo,
    ) => Promise<TResult>
  >
) {
  return (
    resolver: (
      parent: any,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo,
    ) => Promise<TResult>,
  ) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      resolver,
    );
  };
}

/**
 * Helper: Get user from context (throws if not authenticated)
 */
export function getUserFromContext(context: GraphQLContext): AuthUser {
  if (!isAuthenticated(context) || !context.user) {
    throw new AuthenticationError("Utilisateur non authentifié");
  }
  return context.user;
}

/**
 * Helper: Get user ID from context
 */
export function getUserIdFromContext(context: GraphQLContext): number {
  const user = getUserFromContext(context);
  return user.id;
}

/**
 * Helper: Check if context user is admin
 */
export function assertAdmin(context: GraphQLContext): void {
  const user = getUserFromContext(context);
  if (!isAdmin(user)) {
    throw new AuthorizationError(
      "Vous devez être administrateur pour effectuer cette action",
    );
  }
}

/**
 * Helper: Check if context user is staff
 */
export function assertStaff(context: GraphQLContext): void {
  const user = getUserFromContext(context);
  if (!isStaff(user)) {
    throw new AuthorizationError(
      "Vous devez être professeur ou administrateur pour effectuer cette action",
    );
  }
}

/**
 * Helper: Check if context user owns resource
 */
export function assertOwnership(
  context: GraphQLContext,
  resourceUserId: number,
): void {
  const user = getUserFromContext(context);
  if (!isAdmin(user) && !isOwner(user, resourceUserId)) {
    throw new AuthorizationError(
      "Vous n'avez pas les droits pour accéder à cette ressource",
    );
  }
}
