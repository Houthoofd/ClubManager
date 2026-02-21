/**
 * ====================================================================
 * APOLLO API - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour Apollo Client et ses utilitaires.
 *
 * Usage:
 * ```tsx
 * import { apolloClient, clearApolloCache } from '@/core/api/apollo';
 * ```
 */

// ====================================================================
// APOLLO CLIENT
// ====================================================================

export {
  apolloClient,
  clearApolloCache,
  resetApolloStore,
  default as default,
} from "./apollo-client";

// ====================================================================
// TYPES
// ====================================================================

// Re-export des types Apollo utiles
export type { ApolloClient, ApolloQueryResult } from "@apollo/client";
