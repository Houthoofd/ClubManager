/**
 * Middleware GraphQL pour Auth
 * Fonctions réutilisables pour protéger les resolvers
 */

import { GraphQLResolveInfo } from 'graphql';
import {
  UnauthenticatedError,
  ForbiddenError,
  AccountDisabledError,
  EmailNotVerifiedError,
} from '../errors/auth.errors.js';

/**
 * Interface pour le contexte GraphQL avec user
 */
export interface AuthContext {
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    status_id: number;
    status?: string;
    role?: string;
    email_verifie?: boolean;
  };
  req?: any;
  res?: any;
}

/**
 * Options pour requireAuth
 */
export interface RequireAuthOptions {
  /**
   * Roles autorisés (si spécifié, vérifie le role de l'user)
   */
  roles?: string[];

  /**
   * Vérifier que l'email est vérifié
   */
  requireEmailVerified?: boolean;

  /**
   * Vérifier que le compte est actif (status_id)
   */
  requireActiveAccount?: boolean;

  /**
   * Message d'erreur personnalisé
   */
  message?: string;
}

/**
 * Middleware: Vérifier que l'utilisateur est authentifié
 *
 * @example
 * ```typescript
 * Query: {
 *   myProfile: requireAuth(async (_, __, context) => {
 *     // context.user est garanti d'exister ici
 *     return getProfile(context.user.id);
 *   })
 * }
 * ```
 */
export function requireAuth<TArgs = any, TResult = any>(
  resolver: (
    parent: any,
    args: TArgs,
    context: AuthContext & { user: NonNullable<AuthContext['user']> },
    info: GraphQLResolveInfo
  ) => Promise<TResult> | TResult,
  options: RequireAuthOptions = {}
) {
  return async (
    parent: any,
    args: TArgs,
    context: AuthContext,
    info: GraphQLResolveInfo
  ): Promise<TResult> => {
    // 1. Vérifier que l'utilisateur est authentifié
    if (!context.user) {
      throw new UnauthenticatedError(options.message);
    }

    // 2. Vérifier que le compte est actif (si requis)
    if (options.requireActiveAccount) {
      // status_id 1 = actif (adapter selon votre schéma)
      if (context.user.status_id !== 1) {
        throw new AccountDisabledError('Votre compte est désactivé');
      }
    }

    // 3. Vérifier que l'email est vérifié (si requis)
    if (options.requireEmailVerified) {
      if (!context.user.email_verifie) {
        throw new EmailNotVerifiedError();
      }
    }

    // 4. Vérifier les roles (si spécifié)
    if (options.roles && options.roles.length > 0) {
      const userRole = context.user.role || 'user';
      if (!options.roles.includes(userRole)) {
        throw new ForbiddenError(
          `Rôle requis: ${options.roles.join(' ou ')}`
        );
      }
    }

    // Tout est OK, appeler le resolver avec le contexte typé
    return resolver(
      parent,
      args,
      context as AuthContext & { user: NonNullable<AuthContext['user']> },
      info
    );
  };
}

/**
 * Middleware: Vérifier que l'utilisateur est admin
 *
 * @example
 * ```typescript
 * Mutation: {
 *   deleteUser: requireAdmin(async (_, { id }, context) => {
 *     return deleteUser(id);
 *   })
 * }
 * ```
 */
export function requireAdmin<TArgs = any, TResult = any>(
  resolver: (
    parent: any,
    args: TArgs,
    context: AuthContext & { user: NonNullable<AuthContext['user']> },
    info: GraphQLResolveInfo
  ) => Promise<TResult> | TResult
) {
  return requireAuth(resolver, {
    roles: ['admin', 'super_admin'],
    requireActiveAccount: true,
  });
}

/**
 * Middleware: Vérifier que l'utilisateur est propriétaire de la ressource
 *
 * @example
 * ```typescript
 * Mutation: {
 *   updateProfile: requireOwner(
 *     async (_, { id, input }, context) => {
 *       return updateProfile(id, input);
 *     },
 *     (args) => args.id // Extraire l'ID de la ressource depuis les args
 *   )
 * }
 * ```
 */
export function requireOwner<TArgs = any, TResult = any>(
  resolver: (
    parent: any,
    args: TArgs,
    context: AuthContext & { user: NonNullable<AuthContext['user']> },
    info: GraphQLResolveInfo
  ) => Promise<TResult> | TResult,
  getResourceUserId: (args: TArgs) => number | string
) {
  return requireAuth(
    async (parent, args, context, info) => {
      const resourceUserId = getResourceUserId(args);

      // Permettre aux admins de tout modifier
      if (context.user.role === 'admin' || context.user.role === 'super_admin') {
        return resolver(parent, args, context, info);
      }

      // Vérifier que l'utilisateur est propriétaire
      if (context.user.id !== Number(resourceUserId)) {
        throw new ForbiddenError(
          'Vous ne pouvez modifier que vos propres ressources'
        );
      }

      return resolver(parent, args, context, info);
    },
    {
      requireActiveAccount: true,
    }
  );
}

/**
 * Middleware: Vérifier que l'utilisateur a vérifié son email
 *
 * @example
 * ```typescript
 * Mutation: {
 *   createPost: requireVerifiedEmail(async (_, { input }, context) => {
 *     return createPost(input, context.user.id);
 *   })
 * }
 * ```
 */
export function requireVerifiedEmail<TArgs = any, TResult = any>(
  resolver: (
    parent: any,
    args: TArgs,
    context: AuthContext & { user: NonNullable<AuthContext['user']> },
    info: GraphQLResolveInfo
  ) => Promise<TResult> | TResult
) {
  return requireAuth(resolver, {
    requireEmailVerified: true,
    requireActiveAccount: true,
  });
}

/**
 * Helper: Vérifier si l'utilisateur est authentifié (sans throw)
 * Utile pour les resolvers optionnellement protégés
 *
 * @example
 * ```typescript
 * Query: {
 *   publicContent: async (_, __, context) => {
 *     const isAuth = isAuthenticated(context);
 *     return getContent(isAuth ? 'premium' : 'free');
 *   }
 * }
 * ```
 */
export function isAuthenticated(context: AuthContext): boolean {
  return !!context.user;
}

/**
 * Helper: Vérifier si l'utilisateur a un rôle spécifique
 */
export function hasRole(context: AuthContext, roles: string[]): boolean {
  if (!context.user) return false;
  const userRole = context.user.role || 'user';
  return roles.includes(userRole);
}

/**
 * Helper: Vérifier si l'utilisateur est admin
 */
export function isAdmin(context: AuthContext): boolean {
  return hasRole(context, ['admin', 'super_admin']);
}

/**
 * Helper: Vérifier si l'utilisateur est propriétaire d'une ressource
 */
export function isOwner(context: AuthContext, resourceUserId: number | string): boolean {
  if (!context.user) return false;
  return context.user.id === Number(resourceUserId);
}

/**
 * Helper: Vérifier si l'utilisateur peut accéder à une ressource
 * (propriétaire ou admin)
 */
export function canAccess(context: AuthContext, resourceUserId: number | string): boolean {
  return isAdmin(context) || isOwner(context, resourceUserId);
}
