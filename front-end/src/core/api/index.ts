/**
 * ====================================================================
 * CORE API - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour toutes les configurations API.
 *
 * Usage:
 * ```tsx
 * import { apolloClient } from '@/core/api';
 * ```
 */

// ====================================================================
// APOLLO CLIENT (GraphQL)
// ====================================================================

export {
  apolloClient,
  clearApolloCache,
  resetApolloStore,
} from "./apollo";

export type { ApolloClient, ApolloQueryResult } from "./apollo";

// ====================================================================
// GRAPHQL QUERIES
// ====================================================================

// Les queries GraphQL sont dans ./graphql/queries/
// Elles sont générées par GraphQL Code Generator
// et accessibles via @/core/api/apollo/generated/graphql
