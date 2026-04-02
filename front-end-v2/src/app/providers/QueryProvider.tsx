/**
 * React Query Provider
 *
 * Configures and provides React Query (TanStack Query) for the application.
 * Handles data fetching, caching, and synchronization.
 *
 * @module app/providers/QueryProvider
 */

import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { featureFlags, isDevelopment } from '@shared/config';
import { ApiError, AuthenticationError } from '@shared/api';

// ============================================================================
// Query Client Configuration
// ============================================================================

/**
 * Create Query Client with custom configuration
 */
function createQueryClient(): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Log errors in development
        if (isDevelopment) {
          console.error('Query error:', error, query);
        }

        // Handle authentication errors globally
        if (error instanceof AuthenticationError) {
          // Clear auth state and redirect to login
          // This will be handled by the auth feature
          console.warn('Authentication error - user needs to re-login');
        }
      },
    }),

    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Log errors in development
        if (isDevelopment) {
          console.error('Mutation error:', error, mutation);
        }

        // Handle authentication errors globally
        if (error instanceof AuthenticationError) {
          console.warn('Authentication error during mutation');
        }
      },
    }),

    defaultOptions: {
      queries: {
        // Stale time: how long data is considered fresh (5 minutes)
        staleTime: 5 * 60 * 1000,

        // Cache time: how long inactive data stays in cache (10 minutes)
        gcTime: 10 * 60 * 1000,

        // Retry logic
        retry: (failureCount, error) => {
          // Don't retry on client errors (4xx)
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },

        // Retry delay with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refetch settings
        refetchOnWindowFocus: !isDevelopment, // Disable in dev for better DX
        refetchOnMount: true,
        refetchOnReconnect: true,

        // Network mode
        networkMode: 'online',
      },

      mutations: {
        // Retry mutations once
        retry: 1,

        // Retry delay
        retryDelay: 1000,

        // Network mode
        networkMode: 'online',
      },
    },
  });
}

// ============================================================================
// Provider Component
// ============================================================================

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Query Provider Component
 *
 * Wraps the application with React Query provider and devtools.
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // Create query client once (singleton)
  const [queryClient] = React.useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* React Query Devtools - only in development if enabled */}
      {isDevelopment && featureFlags.queryDevtools && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;
