/**
 * Jest Setup File for ESM
 *
 * This file is executed before each test file to set up the testing environment.
 * It configures global mocks, test utilities, and environment variables.
 */

import { jest } from '@jest/globals';

// ============================================================================
// Environment Configuration
// ============================================================================

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_EXPIRES_IN = '1h';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';

// ============================================================================
// Global Test Timeout
// ============================================================================

jest.setTimeout(30000);

// ============================================================================
// Console Suppression for Cleaner Test Output
// ============================================================================

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

// Suppress console output during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   error: jest.fn(),
//   warn: jest.fn(),
//   info: jest.fn(),
//   debug: jest.fn(),
// };

// ============================================================================
// Global Mocks
// ============================================================================

// Mock timers if needed (uncomment to enable)
// jest.useFakeTimers();

// ============================================================================
// Custom Matchers
// ============================================================================

// Add custom matchers
expect.extend({
  toBeValidDate(received: any) {
    const pass = received instanceof Date && !isNaN(received.getTime());
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid Date`
          : `expected ${received} to be a valid Date`,
    };
  },

  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = typeof received === 'string' && uuidRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid UUID`
          : `expected ${received} to be a valid UUID`,
    };
  },

  toBeValidJWT(received: string) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = typeof received === 'string' && jwtRegex.test(received);
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid JWT`
          : `expected ${received} to be a valid JWT`,
    };
  },

  toHaveBeenCalledWithMatch(received: jest.Mock, expected: any) {
    const calls = received.mock.calls;
    const pass = calls.some((call: any[]) => {
      return call.some((arg: any) => {
        if (typeof expected === 'object' && expected !== null) {
          return Object.keys(expected).every(
            (key) => arg && arg[key] === expected[key]
          );
        }
        return arg === expected;
      });
    });
    return {
      pass,
      message: () =>
        pass
          ? `expected mock not to have been called with matching ${JSON.stringify(expected)}`
          : `expected mock to have been called with matching ${JSON.stringify(expected)}`,
    };
  },
});

// ============================================================================
// Type Declarations for Custom Matchers
// ============================================================================

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidDate(): R;
      toBeValidUUID(): R;
      toBeValidJWT(): R;
      toHaveBeenCalledWithMatch(expected: any): R;
    }
  }
}

// ============================================================================
// Cleanup After Each Test
// ============================================================================

afterEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// Global Teardown
// ============================================================================

afterAll(() => {
  // Restore console
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
});

// ============================================================================
// Unhandled Promise Rejection Handler
// ============================================================================

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// ============================================================================
// Export for TypeScript
// ============================================================================

export {};
