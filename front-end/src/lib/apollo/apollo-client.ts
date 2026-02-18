import { ApolloClient, InMemoryCache, createHttpLink, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

// ============================================================================
// Configuration
// ============================================================================

const GRAPHQL_ENDPOINT = import.meta.env.VITE_GRAPHQL_URL || "http://localhost:4000/graphql";

// ============================================================================
// HTTP Link
// ============================================================================

const httpLink = createHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: "include", // Include cookies for authentication
});

// ============================================================================
// Auth Link - Add authentication token to requests
// ============================================================================

const authLink = setContext((_, { headers }) => {
  // Get authentication token from localStorage
  const token = localStorage.getItem("authToken");

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
});

// ============================================================================
// Error Link - Handle GraphQL and network errors
// ============================================================================

const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      const errorCode = extensions?.code;

      // Handle authentication errors
      if (errorCode === "UNAUTHENTICATED" || errorCode === "FORBIDDEN") {
        // Clear auth data
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");

        // Trigger auth-cleared event
        window.dispatchEvent(new Event("auth-cleared"));

        // Development logging only
        if (import.meta.env.DEV) {
          console.error(
            `[GraphQL Auth Error]: ${message}`,
            `\nOperation: ${operation.operationName}`,
            `\nPath: ${path}`,
          );
        }
      } else {
        // Log other GraphQL errors in development
        if (import.meta.env.DEV) {
          console.error(
            `[GraphQL Error]: ${message}`,
            `\nOperation: ${operation.operationName}`,
            `\nPath: ${path}`,
            locations ? `\nLocation: ${JSON.stringify(locations)}` : "",
          );
        }
      }
    });
  }

  if (networkError) {
    // Handle network errors
    if (import.meta.env.DEV) {
      console.error(
        `[Network Error]: ${networkError.message}`,
        `\nOperation: ${operation.operationName}`,
      );
    }
  }
});

// ============================================================================
// Cache Configuration
// ============================================================================

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Pagination handling for users
        users: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        // Pagination handling for courses
        courses: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        // Pagination handling for articles
        articles: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
        // Pagination handling for commandes
        commandes: {
          keyArgs: false,
          merge(existing = [], incoming) {
            return [...existing, ...incoming];
          },
        },
      },
    },
  },
});

// ============================================================================
// Apollo Client Instance
// ============================================================================

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
  connectToDevTools: import.meta.env.DEV,
});

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Clear Apollo cache
 * Useful after logout or when you need to reset all cached data
 */
export const clearApolloCache = async (): Promise<void> => {
  await apolloClient.clearStore();
};

/**
 * Refetch all active queries
 * Useful after a mutation that affects multiple queries
 */
export const refetchAllQueries = async (): Promise<void> => {
  await apolloClient.refetchQueries({
    include: "active",
  });
};

/**
 * Reset Apollo store (clear cache + refetch active queries)
 * Use this instead of clearStore when you want to maintain active queries
 */
export const resetApolloStore = async (): Promise<void> => {
  await apolloClient.resetStore();
};
