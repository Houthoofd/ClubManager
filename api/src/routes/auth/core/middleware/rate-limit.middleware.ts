/**
 * Rate Limit Middleware for GraphQL
 *
 * Middleware pour appliquer le rate limiting aux resolvers GraphQL
 * Utilise le RateLimitService et extrait automatiquement l'identifiant
 * (user ID, IP, email selon le contexte)
 */

import { GraphQLError } from 'graphql';
import { RATE_LIMIT_CONFIG } from '../config/auth.config.js';
import { getRateLimitService, RateLimitResult } from '../services/rate-limit.service.js';
import { RateLimitError } from '../errors/auth.errors.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Contexte GraphQL minimal requis
 */
export interface RateLimitContext {
  user?: {
    id: number;
    email?: string;
  };
  req?: {
    ip?: string;
    headers?: {
      'x-forwarded-for'?: string;
      'x-real-ip'?: string;
    };
  };
}

/**
 * Options pour le middleware de rate limiting
 */
export interface RateLimitOptions {
  /**
   * Type d'action (login, passwordReset, etc.)
   */
  action: keyof typeof RATE_LIMIT_CONFIG;

  /**
   * Stratégie pour extraire l'identifiant
   * - 'userId': Utiliser context.user.id (pour utilisateurs authentifiés)
   * - 'email': Utiliser l'email depuis les args
   * - 'ip': Utiliser l'IP du client
   * - 'custom': Utiliser une fonction personnalisée
   */
  identifierStrategy?: 'userId' | 'email' | 'ip' | 'custom';

  /**
   * Fonction personnalisée pour extraire l'identifiant
   */
  getIdentifier?: (parent: any, args: any, context: RateLimitContext) => string | Promise<string>;

  /**
   * Message d'erreur personnalisé
   */
  message?: string;

  /**
   * Inclure les headers X-RateLimit-* dans la réponse
   */
  includeHeaders?: boolean;
}

/**
 * Type pour un resolver GraphQL
 */
type GraphQLResolver<TParent = any, TArgs = any, TContext = any, TResult = any> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: any
) => Promise<TResult> | TResult;

// ============================================================================
// Identifier Extraction
// ============================================================================

/**
 * Extraire l'identifiant selon la stratégie choisie
 */
const extractIdentifier = async (
  parent: any,
  args: any,
  context: RateLimitContext,
  options: RateLimitOptions
): Promise<string> => {
  const strategy = options.identifierStrategy || 'ip';

  switch (strategy) {
    case 'userId':
      if (!context.user?.id) {
        throw new GraphQLError('User not authenticated', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return `user:${context.user.id}`;

    case 'email':
      const email = args.email || args.input?.email || context.user?.email;
      if (!email) {
        throw new GraphQLError('Email not provided', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      return `email:${email.toLowerCase()}`;

    case 'ip':
      const ip = getClientIp(context);
      if (!ip) {
        throw new GraphQLError('Unable to determine client IP', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
      return `ip:${ip}`;

    case 'custom':
      if (!options.getIdentifier) {
        throw new Error('Custom identifier strategy requires getIdentifier function');
      }
      const customId = await options.getIdentifier(parent, args, context);
      if (!customId) {
        throw new GraphQLError('Unable to determine identifier', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
      return customId;

    default:
      throw new Error(`Unknown identifier strategy: ${strategy}`);
  }
};

/**
 * Extraire l'IP du client depuis le contexte
 */
const getClientIp = (context: RateLimitContext): string | null => {
  // Priorité : X-Forwarded-For (proxy) > X-Real-IP > req.ip
  const forwardedFor = context.req?.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For peut contenir plusieurs IPs, prendre la première
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = context.req?.headers?.['x-real-ip'];
  if (realIp) {
    return realIp;
  }

  return context.req?.ip || null;
};

// ============================================================================
// Middleware
// ============================================================================

/**
 * Créer un middleware de rate limiting pour un resolver GraphQL
 *
 * @param options - Options de configuration
 * @returns Higher-order function qui wrappe le resolver
 *
 * @example
 * ```ts
 * const login = withRateLimit({ action: 'login', identifierStrategy: 'email' })(
 *   async (parent, args, context) => {
 *     // Logique de login
 *   }
 * );
 * ```
 */
export const withRateLimit = <TParent = any, TArgs = any, TContext extends RateLimitContext = RateLimitContext, TResult = any>(
  options: RateLimitOptions
) => {
  return (resolver: GraphQLResolver<TParent, TArgs, TContext, TResult>): GraphQLResolver<TParent, TArgs, TContext, TResult> => {
    return async (parent, args, context, info) => {
      const service = getRateLimitService();

      try {
        // Extraire l'identifiant
        const identifier = await extractIdentifier(parent, args, context, options);

        // Vérifier le rate limit
        const result = await service.checkLimit(identifier, options.action);

        // Si bloqué, lancer une erreur
        if (!result.allowed) {
          throw new RateLimitError(
            options.message || result.message || 'Too many requests',
            {
              identifier,
              action: options.action,
              resetAt: result.resetAt,
              blockedUntil: result.blockedUntil,
            }
          );
        }

        // Ajouter les headers de rate limit si demandé
        if (options.includeHeaders && context.req) {
          addRateLimitHeaders(context, result);
        }

        // Exécuter le resolver original
        return await resolver(parent, args, context, info);
      } catch (error) {
        // Si c'est déjà une RateLimitError, la propager
        if (error instanceof RateLimitError) {
          throw error;
        }

        // Sinon, laisser passer l'erreur originale
        throw error;
      }
    };
  };
};

/**
 * Ajouter les headers X-RateLimit-* à la réponse
 */
const addRateLimitHeaders = (context: RateLimitContext, result: RateLimitResult): void => {
  // Note: En GraphQL, il n'est pas toujours possible d'ajouter des headers
  // Cette fonction est préparée pour une future implémentation
  // Pour l'instant, les infos sont disponibles dans l'erreur
};

// ============================================================================
// Helper Middlewares (préconfigurés)
// ============================================================================

/**
 * Rate limit pour login (par email)
 */
export const withLoginRateLimit = () =>
  withRateLimit({
    action: 'login',
    identifierStrategy: 'email',
    message: 'Trop de tentatives de connexion. Veuillez réessayer plus tard.',
  });

/**
 * Rate limit pour password reset (par email)
 */
export const withPasswordResetRateLimit = () =>
  withRateLimit({
    action: 'passwordReset',
    identifierStrategy: 'email',
    message: 'Trop de demandes de réinitialisation. Veuillez réessayer plus tard.',
  });

/**
 * Rate limit pour email verification (par email)
 */
export const withEmailVerificationRateLimit = () =>
  withRateLimit({
    action: 'emailVerification',
    identifierStrategy: 'email',
    message: 'Trop de demandes de vérification. Veuillez réessayer plus tard.',
  });

/**
 * Rate limit pour registration (par IP)
 */
export const withRegistrationRateLimit = () =>
  withRateLimit({
    action: 'registration',
    identifierStrategy: 'ip',
    message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.',
  });

/**
 * Rate limit pour refresh token (par user ID)
 */
export const withRefreshTokenRateLimit = () =>
  withRateLimit({
    action: 'refreshToken',
    identifierStrategy: 'userId',
    message: 'Trop de demandes de rafraîchissement de token.',
  });

/**
 * Rate limit général (par user ID ou IP si non authentifié)
 */
export const withGeneralRateLimit = () =>
  withRateLimit({
    action: 'general',
    identifierStrategy: 'custom',
    getIdentifier: async (parent, args, context) => {
      if (context.user?.id) {
        return `user:${context.user.id}`;
      }
      const ip = getClientIp(context);
      return ip ? `ip:${ip}` : 'unknown';
    },
  });

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Réinitialiser le rate limit après une action réussie
 * Utile pour reset le compteur après un login réussi, par exemple
 */
export const resetRateLimitAfterSuccess = async (
  context: RateLimitContext,
  action: keyof typeof RATE_LIMIT_CONFIG,
  identifier: string
): Promise<void> => {
  const service = getRateLimitService();
  await service.reset(identifier, action);
};

/**
 * Vérifier le statut du rate limit sans incrémenter
 */
export const checkRateLimitStatus = async (
  context: RateLimitContext,
  action: keyof typeof RATE_LIMIT_CONFIG,
  identifier: string
): Promise<RateLimitResult | null> => {
  const service = getRateLimitService();
  return service.getStatus(identifier, action);
};

// ============================================================================
// Export groupé
// ============================================================================

export const RateLimitMiddleware = {
  withRateLimit,
  withLoginRateLimit,
  withPasswordResetRateLimit,
  withEmailVerificationRateLimit,
  withRegistrationRateLimit,
  withRefreshTokenRateLimit,
  withGeneralRateLimit,
  resetRateLimitAfterSuccess,
  checkRateLimitStatus,
  getClientIp,
};

export default RateLimitMiddleware;
