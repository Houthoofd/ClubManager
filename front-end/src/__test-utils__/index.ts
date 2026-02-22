/**
 * Test Utilities - Central Export Index
 *
 * This file provides a centralized export point for all test utilities,
 * factories, mocks, helpers, and fixtures used throughout the test suite.
 *
 * Usage:
 *   import { UserFactory, ProductFactory, renderWithProviders } from '@/__test-utils__';
 */

// ============================================================================
// FACTORIES
// ============================================================================

export { UserFactory } from './factories/user.factory';
export type { User, UserRole, UserStatus } from './factories/user.factory';

export { ProductFactory, PRODUCT_CATEGORIES } from './factories/product.factory';
export type { Product } from './factories/product.factory';

export { CourseFactory, COURSE_CATEGORIES, COURSE_LEVELS, DAYS_OF_WEEK } from './factories/course.factory';
export type { Course, CourseSchedule } from './factories/course.factory';

// ============================================================================
// HELPERS
// ============================================================================

export {
  renderWithProviders,
  renderWithApollo,
  renderWithRouter,
  renderWithI18n,
  renderBare,
} from './helpers/renderWithProviders';
export type {
  RenderWithProvidersOptions,
  ExtendedRenderResult,
} from './helpers/renderWithProviders';

// ============================================================================
// MOCKS
// ============================================================================

// Add mock exports here as they are created
// export { mockAuthService } from './mocks/auth.mock';
// export { mockGraphQLClient } from './mocks/graphql.mock';

// ============================================================================
// FIXTURES
// ============================================================================

// Add fixture exports here as they are created
// export { userFixtures } from './fixtures/user.fixtures';
// export { courseFixtures } from './fixtures/course.fixtures';

// ============================================================================
// COMMON TEST UTILITIES
// ============================================================================

/**
 * Common test data and utilities
 */
export const TEST_IDS = {
  // Common test IDs for components
  LOADING_SPINNER: 'loading-spinner',
  ERROR_MESSAGE: 'error-message',
  EMPTY_STATE: 'empty-state',
  SUBMIT_BUTTON: 'submit-button',
  CANCEL_BUTTON: 'cancel-button',
} as const;

/**
 * Common test delays (in milliseconds)
 */
export const TEST_DELAYS = {
  SHORT: 100,
  MEDIUM: 500,
  LONG: 1000,
  NETWORK: 2000,
} as const;

/**
 * Common test URLs
 */
export const TEST_URLS = {
  API_BASE: 'http://localhost:4000',
  GRAPHQL: 'http://localhost:4000/graphql',
  REST_API: 'http://localhost:4000/api',
} as const;

/**
 * Wait for async operations in tests
 */
export const waitFor = (ms: number = TEST_DELAYS.SHORT): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Flush all pending promises
 */
export const flushPromises = (): Promise<void> => {
  return new Promise((resolve) => setImmediate(resolve));
};

/**
 * Create a deferred promise for testing
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
}

export const createDeferred = <T = void>(): Deferred<T> => {
  let resolve: (value: T) => void;
  let reject: (reason?: any) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve: resolve!,
    reject: reject!,
  };
};

/**
 * Mock console methods for tests (to suppress expected errors/warnings)
 */
export const mockConsole = () => {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  return {
    mockError: () => {
      console.error = jest.fn();
    },
    mockWarn: () => {
      console.warn = jest.fn();
    },
    mockLog: () => {
      console.log = jest.fn();
    },
    restore: () => {
      console.error = originalError;
      console.warn = originalWarn;
      console.log = originalLog;
    },
  };
};

/**
 * Create a mock file for testing file uploads
 */
export const createMockFile = (
  name: string = 'test-file.txt',
  size: number = 1024,
  type: string = 'text/plain'
): File => {
  const content = 'a'.repeat(size);
  return new File([content], name, { type });
};

/**
 * Create mock image file
 */
export const createMockImage = (
  name: string = 'test-image.png',
  width: number = 100,
  height: number = 100
): File => {
  // Create a simple canvas and convert to blob
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, width, height);
  }

  // Note: In real tests, you might use a mock blob instead
  return new File(['mock-image-data'], name, { type: 'image/png' });
};

/**
 * Common GraphQL error response
 */
export const createGraphQLError = (message: string = 'GraphQL Error') => ({
  errors: [
    {
      message,
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
      },
    },
  ],
});

/**
 * Common REST API error response
 */
export const createAPIError = (
  message: string = 'API Error',
  status: number = 500,
  code: string = 'INTERNAL_ERROR'
) => ({
  error: {
    message,
    status,
    code,
  },
});

/**
 * Sleep utility for tests (use sparingly, prefer waitFor from @testing-library)
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Generate random ID for tests
 */
export const generateTestId = (): string => {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Generate random email for tests
 */
export const generateTestEmail = (prefix: string = 'test'): string => {
  return `${prefix}-${Date.now()}@example.com`;
};

/**
 * Default export with all utilities
 */
export default {
  // Factories
  UserFactory,
  ProductFactory,
  CourseFactory,

  // Helpers
  renderWithProviders,
  renderWithApollo,
  renderWithRouter,
  renderWithI18n,
  renderBare,

  // Constants
  TEST_IDS,
  TEST_DELAYS,
  TEST_URLS,

  // Utilities
  waitFor,
  flushPromises,
  createDeferred,
  mockConsole,
  createMockFile,
  createMockImage,
  createGraphQLError,
  createAPIError,
  sleep,
  generateTestId,
  generateTestEmail,
};
