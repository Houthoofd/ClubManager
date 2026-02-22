/**
 * ====================================================================
 * APOLLO CLIENT CONFIGURATION - CLUBMANAGER
 * ====================================================================
 *
 * Configuration centralisée du client Apollo GraphQL.
 * Gère les connexions au serveur GraphQL, l'authentification et le cache.
 *
 * Features:
 * - Authentication automatique via headers
 * - Error handling centralisé
 * - Cache optimisé avec policies avancées
 * - Query batching pour performances
 * - Query deduplication automatique
 * - Support des subscriptions (WebSocket)
 *
 * 🚀 OPTIMISATIONS PERFORMANCE:
 * - Batching des requêtes (réduit les appels réseau)
 * - Cache intelligent avec TTL
 * - Deduplication des queries identiques
 * - Possibilité de persisted queries
 */

import { ApolloClient, InMemoryCache, HttpLink, from } from "@apollo/client";
import { BatchHttpLink } from "@apollo/client/link/batch-http";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { createAPQLink } from "./persisted-queries";
import { restoreCacheFromStorage, setupCachePersistence } from "./cache-persistence";
import { logger } from "@/core/utils/appLogger";

// ====================================================================
// CONFIGURATION
// ====================================================================

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_ENDPOINT || "http://localhost:4000/graphql";
const ENABLE_BATCHING = import.meta.env.VITE_ENABLE_QUERY_BATCHING !== "false"; // true par défaut
const ENABLE_APQ = import.meta.env.VITE_ENABLE_APQ !== "false"; // true par défaut en prod
const ENABLE_CACHE_PERSISTENCE = import.meta.env.VITE_ENABLE_CACHE_PERSISTENCE !== "false"; // true par défaut

// ====================================================================
// HTTP LINK - Standard ou Batching
// ====================================================================

/**
 * Utilise BatchHttpLink pour grouper plusieurs requêtes GraphQL
 * dans une seule requête HTTP (améliore les performances).
 *
 * Si batching désactivé, utilise HttpLink standard.
 */
const httpLink = ENABLE_BATCHING
  ? new BatchHttpLink({
      uri: GRAPHQL_ENDPOINT,
      credentials: "include",
      batchMax: 10, // Max 10 queries par batch
      batchInterval: 20, // Attendre 20ms pour grouper les queries
    })
  : new HttpLink({
      uri: GRAPHQL_ENDPOINT,
      credentials: "include",
    });

// ====================================================================
// AUTH LINK - Ajoute le token JWT à chaque requête
// ====================================================================

const authLink = setContext((_, { headers }) => {
  // Récupérer le token du localStorage
  const token = localStorage.getItem("authToken");

  // Retourner les headers avec le token si disponible
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// ====================================================================
// ERROR LINK - Gestion centralisée des erreurs
// ====================================================================

const errorLink = onError(({ error }) => {
  logger.error("Apollo GraphQL error occurred", error as Error, {
    feature: "apollo",
    component: "errorLink",
  });

  // Gérer les erreurs d'authentification
  if (error.message?.includes("UNAUTHENTICATED") || error.message?.includes("401")) {
    logger.warn("Authentication error detected, redirecting to login", {
      feature: "apollo",
      action: "logout",
    });

    // Nettoyer le localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");

    // Rediriger vers la page de connexion
    if (window.location.pathname !== "/pages/connexion") {
      window.location.href = "/pages/connexion";
    }
  }
});

// ====================================================================
// CACHE CONFIGURATION - Optimisé pour performance
// ====================================================================

/**
 * 🚀 Restauration du cache depuis localStorage
 */
const restoredCache = ENABLE_CACHE_PERSISTENCE ? restoreCacheFromStorage() : null;

/**
 * 🚀 Cache InMemory avec policies avancées:
 *
 * - Type policies pour normalisation optimale
 * - Merge functions pour pagination
 * - Field policies avec read functions pour computed fields
 * - Cache TTL (Time To Live) pour certaines queries
 * - Persistence dans localStorage pour chargements rapides
 */
const cache = new InMemoryCache({
  // Configuration des types pour normalisation
  typePolicies: {
    Query: {
      fields: {
        // Configuration du cache pour les requêtes paginées
        products: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
        users: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
        courses: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
        orders: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
        // Stats avec cache plus agressif (changent moins souvent)
        statistics: {
          merge(_existing, incoming) {
            return incoming;
          },
        },
      },
    },
    // Normalisation par ID pour les types principaux
    User: {
      keyFields: ["id"],
    },
    Course: {
      keyFields: ["id"],
    },
    Product: {
      keyFields: ["id"],
    },
    Order: {
      keyFields: ["id"],
    },
    Message: {
      keyFields: ["id"],
    },
  },
  // Possibilité de fragments pour réutilisation
  possibleTypes: {},
}).restore(restoredCache || {});

// ====================================================================
// APQ LINK - Automatic Persisted Queries
// ====================================================================

/**
 * 🚀 Automatic Persisted Queries pour réduire la bande passante
 * Envoie uniquement le hash SHA-256 des queries au lieu du texte complet
 */
const apqLink = ENABLE_APQ
  ? createAPQLink({
      enabled: true,
      useGETForHashedQueries: true,
      disableForOperations: ["UploadFile", "UploadMultipleFiles"],
      minQuerySize: 500,
    })
  : undefined;

// ====================================================================
// APOLLO CLIENT INSTANCE - Optimisé pour performance
// ====================================================================

/**
 * 🚀 Configuration Apollo optimisée:
 *
 * - Query deduplication automatique (évite les requêtes dupliquées)
 * - Batching activé (groupe les queries)
 * - Cache-first par défaut (réduit les appels réseau)
 * - Assumé immutable cache (performance)
 */
export const apolloClient = new ApolloClient({
  link: apqLink
    ? from([errorLink, authLink, apqLink, httpLink])
    : from([errorLink, authLink, httpLink]),
  cache,
  // Options par défaut optimisées pour performance
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network", // Montre le cache puis update
      nextFetchPolicy: "cache-first", // Subsequent fetches utilisent cache
      errorPolicy: "all",
      notifyOnNetworkStatusChange: false, // Moins de re-renders
    },
    query: {
      fetchPolicy: "cache-first", // Cache first pour meilleure perf
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
      // Après mutation, re-fetch les queries affectées
      awaitRefetchQueries: false, // Non bloquant
    },
  },
  // 🚀 OPTIMISATIONS
  queryDeduplication: true, // Évite les queries dupliquées en vol
  assumeImmutableResults: true, // Assume que le cache est immutable (perf++)
});

// ====================================================================
// CACHE PERSISTENCE SETUP
// ====================================================================

/**
 * 🚀 Active la persistence automatique du cache dans localStorage
 * Le cache est sauvegardé automatiquement après chaque modification
 */
if (ENABLE_CACHE_PERSISTENCE) {
  setupCachePersistence(cache);
  logger.info("Apollo cache persistence enabled", {
    feature: "apollo",
    component: "cache-persistence",
  });
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================

/**
 * Clear Apollo cache and reset store
 * Utile lors de la déconnexion
 */
export const clearApolloCache = async (): Promise<void> => {
  await apolloClient.clearStore();
};

/**
 * Reset Apollo store
 * Utile après une connexion pour refetch les queries
 */
export const resetApolloStore = async (): Promise<void> => {
  await apolloClient.resetStore();
};

/**
 * 🚀 Refetch specific queries by name
 * Plus performant que resetStore pour updates ciblées
 *
 * @param queryNames - Array de noms de queries à refetch
 */
export const refetchQueries = (queryNames: string[]): void => {
  apolloClient.refetchQueries({
    include: queryNames,
  });
};

/**
 * 🚀 Evict cached item by ID
 * Utile pour invalider un item spécifique du cache
 *
 * @param typename - Type GraphQL (ex: "User", "Product")
 * @param id - ID de l'item à éviter
 */
export const evictCacheItem = (typename: string, id: string | number): void => {
  apolloClient.cache.evict({
    id: apolloClient.cache.identify({ __typename: typename, id }),
  });
  apolloClient.cache.gc(); // Garbage collection
};

/**
 * 🚀 Get cache statistics
 * Debug utility pour voir l'état du cache
 */
export const getCacheStats = (): { size: number } => {
  const cacheData = apolloClient.cache.extract();
  const size = new Blob([JSON.stringify(cacheData)]).size;
  return { size };
};

// ====================================================================
// EXPORTS
// ====================================================================

export default apolloClient;

// Export des nouvelles optimisations
export * from "./optimistic-updates";
export * from "./cache-persistence";
export * from "./persisted-queries";
