/**
 * ====================================================================
 * TEST SETUP & CONFIGURATION
 * ====================================================================
 *
 * Global test setup for Jest/Vitest with React Testing Library.
 * Configures mocks, utilities, and custom matchers for all tests.
 *
 * @see https://testing-library.com/docs/react-testing-library/setup
 * @see https://vitest.dev/config/
 */

import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// ============================================================================
// AUTO CLEANUP
// ============================================================================

// Cleanup after each test case (unmount React components, clear DOM)
afterEach(() => {
  cleanup();
});

// ============================================================================
// MOCK: WINDOW.MATCHMEDIA (for responsive components)
// ============================================================================

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================================================
// MOCK: INTERSECTION OBSERVER (for lazy loading, infinite scroll)
// ============================================================================

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// ============================================================================
// MOCK: RESIZE OBSERVER (for responsive charts, layouts)
// ============================================================================

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// ============================================================================
// MOCK: CONSOLE WARNINGS/ERRORS (reduce noise in tests)
// ============================================================================

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Filter out known noisy warnings
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || "";

  // Ignore React 18 act() warnings in tests (handled by RTL)
  if (message.includes("Warning: ReactDOM.render")) return;
  if (message.includes("Warning: useLayoutEffect")) return;
  if (message.includes("Not implemented: HTMLFormElement.prototype.submit")) return;

  // Call original for real errors
  originalConsoleError(...args);
};

console.warn = (...args: any[]) => {
  const message = args[0]?.toString() || "";

  // Ignore PatternFly warnings in tests
  if (message.includes("PatternFly")) return;
  if (message.includes("componentWillReceiveProps")) return;

  // Call original for real warnings
  originalConsoleWarn(...args);
};

// ============================================================================
// MOCK: LOCALSTORAGE (for auth, preferences tests)
// ============================================================================

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
});

// ============================================================================
// MOCK: ENVIRONMENT VARIABLES
// ============================================================================

process.env.VITE_API_BASE_URL = "http://localhost:3000";
process.env.VITE_STRIPE_PUBLIC_KEY = "pk_test_mock_key_for_testing";
process.env.NODE_ENV = "test";

// ============================================================================
// MOCK: REACT-ROUTER (for navigation tests)
// ============================================================================

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: "/",
      search: "",
      hash: "",
      state: null,
    }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

// ============================================================================
// MOCK: I18NEXT (for translation tests)
// ============================================================================

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: vi.fn(),
      language: "fr",
    },
  }),
  Trans: ({ children }: any) => children,
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// ============================================================================
// MOCK: APOLLO CLIENT (for GraphQL tests)
// ============================================================================

// Mock will be provided per-test using MockedProvider
// See: https://www.apollographql.com/docs/react/development-testing/testing/

// ============================================================================
// MOCK: ZUSTAND STORES (for state management tests)
// ============================================================================

// Reset all stores before each test
afterEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// CUSTOM MATCHERS
// ============================================================================

// Add custom Jest DOM matchers
// - toBeInTheDocument()
// - toHaveTextContent()
// - toBeVisible()
// etc.

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

/**
 * Wait for async operations in tests
 * Usage: await waitFor(() => expect(element).toBeInTheDocument())
 */
export { waitFor, screen, within } from "@testing-library/react";

/**
 * Fire DOM events
 * Usage: await userEvent.click(button)
 */
export { default as userEvent } from "@testing-library/user-event";

/**
 * Custom render function with providers
 * (Define in test-utils.tsx if needed)
 */

// ============================================================================
// DEBUG HELPERS
// ============================================================================

// Enable debug mode with DEBUG=true npm test
if (process.env.DEBUG === "true") {
  console.log("🧪 Test debug mode enabled");
}

/**
 * Helper to debug test failures
 * Usage: debugTest(container)
 */
export const debugTest = (container?: HTMLElement) => {
  if (process.env.DEBUG === "true") {
    console.log("=".repeat(80));
    console.log("DOM SNAPSHOT:");
    console.log(container?.innerHTML || "No container provided");
    console.log("=".repeat(80));
  }
};

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Mock user data for tests
 */
export const mockUser = (overrides = {}) => ({
  id: 1,
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
  role: "student",
  is_active: true,
  ...overrides,
});

/**
 * Mock order data for tests
 */
export const mockOrder = (overrides = {}) => ({
  id: 1,
  user_id: 1,
  total_amount: 49.99,
  status: "pending",
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock product data for tests
 */
export const mockProduct = (overrides = {}) => ({
  id: 1,
  name: "Test Product",
  price: 19.99,
  stock: 10,
  is_active: true,
  ...overrides,
});

// ============================================================================
// EXPORT TEST CONFIGURATION
// ============================================================================

export const testConfig = {
  timeout: 5000, // Default timeout for async tests
  retries: 0, // Don't retry failed tests
  bail: false, // Don't stop on first failure
} as const;

console.log("✅ Test environment configured");
