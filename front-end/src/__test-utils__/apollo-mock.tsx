/**
 * ====================================================================
 * Apollo Mock Utilities
 * ====================================================================
 *
 * Utilities for testing GraphQL hooks and components with Apollo Client.
 * Provides MockedProvider wrappers, common mocks, and helper functions.
 *
 * Usage:
 * ```tsx
 * import { createApolloWrapper, mockGrades } from '@/__test-utils__/apollo-mock';
 *
 * const { result } = renderHook(() => useGrades(), {
 *   wrapper: createApolloWrapper([mockGrades.success])
 * });
 * ```
 */

import { MockedProvider, MockedResponse, MockLink } from "@apollo/client/testing";
import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { ReactNode } from "react";
import {
  GetGradesDocument,
  GetStatusesDocument,
  GetGendersDocument,
  GetSubscriptionsDocument,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Types
// ============================================================================

export interface ApolloWrapperOptions {
  mocks?: MockedResponse[];
  addTypename?: boolean;
  defaultOptions?: any;
  cache?: InMemoryCache;
  link?: ApolloLink;
}

// ============================================================================
// Mock Data Fixtures
// ============================================================================

/**
 * Mock Grades Data
 */
export const mockGradesData = [
  {
    id: "1",
    grade_name: "1ère année",
    description: "Première année",
    level_order: 1,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Grade" as const,
  },
  {
    id: "2",
    grade_name: "2ème année",
    description: "Deuxième année",
    level_order: 2,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Grade" as const,
  },
  {
    id: "3",
    grade_name: "3ème année",
    description: "Troisième année",
    level_order: 3,
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Grade" as const,
  },
];

/**
 * Mock Statuses Data
 */
export const mockStatusesData = [
  {
    id: "1",
    status_name: "Actif",
    description: "Utilisateur actif",
    color: "#22c55e",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Status" as const,
  },
  {
    id: "2",
    status_name: "Inactif",
    description: "Utilisateur inactif",
    color: "#ef4444",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Status" as const,
  },
  {
    id: "3",
    status_name: "En attente",
    description: "En attente de validation",
    color: "#f59e0b",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Status" as const,
  },
];

/**
 * Mock Genders Data
 */
export const mockGendersData = [
  {
    id: "1",
    gender_name: "Homme",
    abbreviation: "H",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Gender" as const,
  },
  {
    id: "2",
    gender_name: "Femme",
    abbreviation: "F",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Gender" as const,
  },
  {
    id: "3",
    gender_name: "Autre",
    abbreviation: "A",
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Gender" as const,
  },
];

/**
 * Mock Subscriptions Data
 */
export const mockSubscriptionsData = [
  {
    id: "1",
    subscription_name: "Mensuel",
    description: "Abonnement mensuel",
    price: 29.99,
    duration_months: 1,
    features: ["Accès aux cours", "Support email"],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Subscription" as const,
  },
  {
    id: "2",
    subscription_name: "Trimestriel",
    description: "Abonnement trimestriel",
    price: 79.99,
    duration_months: 3,
    features: ["Accès aux cours", "Support email", "Réduction 10%"],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Subscription" as const,
  },
  {
    id: "3",
    subscription_name: "Annuel",
    description: "Abonnement annuel",
    price: 299.99,
    duration_months: 12,
    features: ["Accès aux cours", "Support prioritaire", "Réduction 20%"],
    active: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    __typename: "Subscription" as const,
  },
];

// ============================================================================
// Mock Queries
// ============================================================================

/**
 * Mock GetGrades Query
 */
export const mockGrades = {
  success: {
    request: {
      query: GetGradesDocument,
    },
    result: {
      data: {
        grades: mockGradesData,
      },
    },
  } as MockedResponse,

  empty: {
    request: {
      query: GetGradesDocument,
    },
    result: {
      data: {
        grades: [],
      },
    },
  } as MockedResponse,

  error: {
    request: {
      query: GetGradesDocument,
    },
    error: new Error("Failed to fetch grades"),
  } as MockedResponse,

  networkError: {
    request: {
      query: GetGradesDocument,
    },
    error: new Error("Network error"),
  } as MockedResponse,
};

/**
 * Mock GetStatuses Query
 */
export const mockStatuses = {
  success: {
    request: {
      query: GetStatusesDocument,
    },
    result: {
      data: {
        statuses: mockStatusesData,
      },
    },
  } as MockedResponse,

  empty: {
    request: {
      query: GetStatusesDocument,
    },
    result: {
      data: {
        statuses: [],
      },
    },
  } as MockedResponse,

  error: {
    request: {
      query: GetStatusesDocument,
    },
    error: new Error("Failed to fetch statuses"),
  } as MockedResponse,
};

/**
 * Mock GetGenders Query
 */
export const mockGenders = {
  success: {
    request: {
      query: GetGendersDocument,
    },
    result: {
      data: {
        genders: mockGendersData,
      },
    },
  } as MockedResponse,

  empty: {
    request: {
      query: GetGendersDocument,
    },
    result: {
      data: {
        genders: [],
      },
    },
  } as MockedResponse,

  error: {
    request: {
      query: GetGendersDocument,
    },
    error: new Error("Failed to fetch genders"),
  } as MockedResponse,
};

/**
 * Mock GetSubscriptions Query
 */
export const mockSubscriptions = {
  success: {
    request: {
      query: GetSubscriptionsDocument,
    },
    result: {
      data: {
        subscriptions: mockSubscriptionsData,
      },
    },
  } as MockedResponse,

  empty: {
    request: {
      query: GetSubscriptionsDocument,
    },
    result: {
      data: {
        subscriptions: [],
      },
    },
  } as MockedResponse,

  error: {
    request: {
      query: GetSubscriptionsDocument,
    },
    error: new Error("Failed to fetch subscriptions"),
  } as MockedResponse,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create Apollo Wrapper Component
 *
 * @param mocks - Array of mocked responses
 * @param options - Additional options for MockedProvider
 * @returns Wrapper component for testing
 *
 * @example
 * ```tsx
 * const wrapper = createApolloWrapper([mockGrades.success, mockStatuses.success]);
 * const { result } = renderHook(() => useGrades(), { wrapper });
 * ```
 */
export function createApolloWrapper(
  mocks: MockedResponse[] = [],
  options: Omit<ApolloWrapperOptions, "mocks"> = {},
) {
  const { addTypename = false, defaultOptions, cache, link } = options;

  return ({ children }: { children: ReactNode }) => (
    <MockedProvider
      mocks={mocks}
      addTypename={addTypename}
      defaultOptions={defaultOptions}
      cache={cache}
      link={link}
    >
      {children}
    </MockedProvider>
  );
}

/**
 * Create Apollo Test Client with MockLink
 *
 * This creates a real ApolloClient instance with MockLink for SSR-compatible testing.
 * Use this when MockedProvider doesn't work properly in your test environment.
 *
 * @param mocks - Array of mocked responses
 * @param options - Additional options
 * @returns ApolloClient instance for testing
 *
 * @example
 * ```tsx
 * const client = createApolloTestClient([mockGrades.success]);
 * const wrapper = ({ children }) => (
 *   <ApolloProvider client={client}>{children}</ApolloProvider>
 * );
 * const { result } = renderHook(() => useGrades(), { wrapper });
 * ```
 */
export function createApolloTestClient(
  mocks: MockedResponse[] = [],
  options: { cache?: InMemoryCache; addTypename?: boolean } = {},
) {
  const { cache = new InMemoryCache(), addTypename = false } = options;

  const mockLink = new MockLink(mocks, addTypename);

  return new ApolloClient({
    link: mockLink,
    cache,
    defaultOptions: {
      watchQuery: {
        fetchPolicy: "no-cache",
      },
      query: {
        fetchPolicy: "no-cache",
      },
    },
  });
}

/**
 * Create Apollo Provider Wrapper with MockLink
 *
 * Convenience wrapper that creates an ApolloClient with MockLink and wraps children
 * in ApolloProvider. This is the recommended approach for testing hooks in SSR environments.
 *
 * @param mocks - Array of mocked responses
 * @param options - Additional options
 * @returns Wrapper component for testing
 *
 * @example
 * ```tsx
 * const wrapper = createApolloProviderWrapper([mockGrades.success]);
 * const { result } = renderHook(() => useGrades(), { wrapper });
 * await waitFor(() => expect(result.current.loading).toBe(false));
 * ```
 */
export function createApolloProviderWrapper(
  mocks: MockedResponse[] = [],
  options: { cache?: InMemoryCache; addTypename?: boolean } = {},
) {
  const client = createApolloTestClient(mocks, options);

  return ({ children }: { children: ReactNode }) => (
    <ApolloProvider client={client}>{children}</ApolloProvider>
  );
}

/**
 * Create Default Apollo Wrapper (all reference data loaded)
 *
 * @returns Wrapper with all common reference data mocks
 *
 * @example
 * ```tsx
 * const wrapper = createDefaultApolloWrapper();
 * const { result } = renderHook(() => useGrades(), { wrapper });
 * ```
 */
export function createDefaultApolloWrapper() {
  return createApolloWrapper([
    mockGrades.success,
    mockStatuses.success,
    mockGenders.success,
    mockSubscriptions.success,
  ]);
}

/**
 * Wait for Apollo queries to complete
 *
 * @param timeout - Timeout in milliseconds (default: 1000)
 * @returns Promise that resolves after timeout
 *
 * @example
 * ```tsx
 * const { result } = renderHook(() => useGrades(), { wrapper });
 * await waitForApollo();
 * expect(result.current.loading).toBe(false);
 * ```
 */
export async function waitForApollo(timeout: number = 100): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

/**
 * Create a custom mock response
 *
 * @param query - GraphQL document
 * @param data - Response data
 * @param variables - Query variables (optional)
 * @returns MockedResponse
 *
 * @example
 * ```tsx
 * const customMock = createMockResponse(
 *   GetUserDocument,
 *   { user: { id: '1', name: 'John' } },
 *   { id: '1' }
 * );
 * ```
 */
export function createMockResponse<TData = any, TVariables = any>(
  query: any,
  data: TData,
  variables?: TVariables,
): MockedResponse {
  return {
    request: {
      query,
      variables,
    },
    result: {
      data,
    },
  };
}

/**
 * Create a mock error response
 *
 * @param query - GraphQL document
 * @param errorMessage - Error message
 * @param variables - Query variables (optional)
 * @returns MockedResponse with error
 *
 * @example
 * ```tsx
 * const errorMock = createMockError(
 *   GetUserDocument,
 *   'User not found',
 *   { id: '999' }
 * );
 * ```
 */
export function createMockError<TVariables = any>(
  query: any,
  errorMessage: string,
  variables?: TVariables,
): MockedResponse {
  return {
    request: {
      query,
      variables,
    },
    error: new Error(errorMessage),
  };
}

// ============================================================================
// Export All
// ============================================================================

export default {
  createApolloWrapper,
  createApolloTestClient,
  createApolloProviderWrapper,
  createDefaultApolloWrapper,
  waitForApollo,
  createMockResponse,
  createMockError,
  mockGrades,
  mockStatuses,
  mockGenders,
  mockSubscriptions,
  mockGradesData,
  mockStatusesData,
  mockGendersData,
  mockSubscriptionsData,
};
