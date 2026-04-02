/**
 * Application Providers
 *
 * Compose all application-level providers (Query, Router, Theme, etc.)
 * into a single provider component.
 *
 * @module app/providers
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@shared/ui/ErrorBoundary';
import { featureFlags } from '@shared/config';

// ============================================================================
// Query Client Configuration
// ============================================================================

/**
 * React Query client configuration
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ============================================================================
// Provider Props
// ============================================================================

interface AppProvidersProps {
  children: React.ReactNode;
}

// ============================================================================
// Providers Component
// ============================================================================

/**
 * Application Providers
 *
 * Wraps the application with all necessary providers:
 * - React Query (data fetching & caching)
 * - React Router (navigation)
 * - Error Boundary (error handling)
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
          {featureFlags.queryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// ============================================================================
// Exports
// ============================================================================

export { queryClient };
export default AppProviders;
