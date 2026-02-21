/**
 * ====================================================================
 * CORE - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les modules core de l'application.
 * Le dossier core contient les configurations et services fondamentaux.
 *
 * Usage:
 * ```tsx
 * import { apolloClient } from '@/core';
 * ```
 */

// ====================================================================
// API (Apollo Client, GraphQL)
// ====================================================================

export { apolloClient, clearApolloCache, resetApolloStore } from "./api";

export type { ApolloClient, ApolloQueryResult } from "./api";

// ====================================================================
// CONFIGURATION
// ====================================================================

export {
  env,
  isDev,
  isProd,
  isTest,
  getEnvironment,
  isFeatureEnabled,
  getApiUrl,
  getGraphQLUrl,
  type Env,
} from "./config";

// ====================================================================
// SERVICES
// ====================================================================

export { authService, userService } from "./services";
export type { AuthUser, AuthTokens, AuthSession } from "./services";
export type { UserProfile, UserPreferences, UpdateUserInput } from "./services";

// ====================================================================
// CONSTANTS
// ====================================================================

export * from "./constants";
