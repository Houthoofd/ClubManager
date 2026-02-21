/**
 * Unified API Client
 * Centralizes API communication with error handling, retries, and interceptors
 */

import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';

// ============================================================================
// Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://clubmanagment.com/';
const GRAPHQL_ENDPOINT = `${API_BASE_URL}graphql`;

// ============================================================================
// Error Handling Link
// ============================================================================

const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      const errorCode = extensions?.code as string;

      console.error(
        `[GraphQL Error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
        { code: errorCode, operation: operation.operationName }
      );

      // Handle specific error codes
      switch (errorCode) {
        case 'UNAUTHENTICATED':
          // Redirect to login or refresh token
          console.warn('User not authenticated, clearing session...');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;

        case 'FORBIDDEN':
          console.error('Access forbidden to resource');
          // Show toast notification
          break;

        case 'BAD_USER_INPUT':
          console.warn('Invalid input provided', { message });
          break;

        default:
          // Generic error handling
          break;
      }
    });
  }

  if (networkError) {
    console.error(`[Network Error]: ${networkError.message}`, {
      operation: operation.operationName,
      timestamp: new Date().toISOString(),
    });

    // Handle network errors
    if ('statusCode' in networkError) {
      const statusCode = (networkError as any).statusCode;

      switch (statusCode) {
        case 401:
          console.warn('Unauthorized request');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;

        case 403:
          console.error('Forbidden access');
          break;

        case 500:
        case 502:
        case 503:
          console.error('Server error, retrying...');
          break;

        default:
          console.error(`HTTP Error ${statusCode}`);
      }
    }
  }

  return forward(operation);
});

// ============================================================================
// Retry Link (for network failures)
// ============================================================================

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error, _operation) => {
      // Retry only on network errors, not GraphQL errors
      return !!error && !error.message.includes('GraphQL');
    },
  },
});

// ============================================================================
// Authentication Link
// ============================================================================

const authLink = new ApolloLink((operation, forward) => {
  // Get token from localStorage
  const token = localStorage.getItem('token');

  // Add authorization header if token exists
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  }));

  return forward(operation);
});

// ============================================================================
// Logging Link (Development only)
// ============================================================================

const loggingLink = new ApolloLink((operation, forward) => {
  const isDev = import.meta.env.DEV;

  if (isDev) {
    console.log(`[GraphQL Request] ${operation.operationName}`, {
      query: operation.query.loc?.source.body,
      variables: operation.variables,
    });
  }

  const startTime = Date.now();

  return forward(operation).map((response) => {
    const duration = Date.now() - startTime;

    if (isDev) {
      console.log(`[GraphQL Response] ${operation.operationName} (${duration}ms)`, response);
    }

    return response;
  });
});

// ============================================================================
// HTTP Link
// ============================================================================

const httpLink = new HttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: 'include', // Include cookies for session management
});

// ============================================================================
// Apollo Client
// ============================================================================

export const apolloClient = new ApolloClient({
  link: from([
    loggingLink,
    errorLink,
    retryLink,
    authLink,
    httpLink,
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge strategies for paginated queries
          cours: {
            keyArgs: false,
            merge(existing = [], incoming) {
              return incoming;
            },
          },
          articles: {
            keyArgs: ['categorie'],
            merge(existing = [], incoming) {
              return incoming;
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Set authentication token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

/**
 * Clear authentication token
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem('token');
  apolloClient.clearStore(); // Clear Apollo cache
};

/**
 * Get current authentication token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// ============================================================================
// Cache Utilities
// ============================================================================

/**
 * Clear all Apollo cache
 */
export const clearCache = async (): Promise<void> => {
  await apolloClient.clearStore();
};

/**
 * Reset Apollo cache (clears and refetches active queries)
 */
export const resetCache = async (): Promise<void> => {
  await apolloClient.resetStore();
};

/**
 * Refetch specific query
 */
export const refetchQuery = async (queryName: string): Promise<void> => {
  await apolloClient.refetchQueries({
    include: [queryName],
  });
};

// ============================================================================
// Export
// ============================================================================

export default apolloClient;
