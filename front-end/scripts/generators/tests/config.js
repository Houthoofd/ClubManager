/**
 * Configuration for the test generator
 */

export const config = {
  // Source directories to scan
  sourceDirs: {
    features: "src/features",
    shared: "src/shared",
    core: "src/core",
  },

  // Test directory name
  testDirName: "__tests__",

  // File patterns to detect
  patterns: {
    hook: /^use[A-Z]\w+\.(ts|tsx)$/,
    component: /^[A-Z]\w+\.(tsx)$/,
    util: /\.(utils?|helpers?|formatters?)\.(ts|tsx)$/,
    store: /-store\.(ts|tsx)$/,
    page: /Page\.(tsx)$/,
  },

  // File types and their characteristics
  fileTypes: {
    hook: {
      pattern: /^use[A-Z]\w+/,
      testSuffix: ".test.ts",
      subdir: "hooks",
      detectGraphQL: true,
    },
    hookGraphQL: {
      pattern: /^use[A-Z]\w+/,
      testSuffix: ".test.ts",
      subdir: "hooks",
    },
    component: {
      pattern: /^[A-Z]\w+/,
      testSuffix: ".test.tsx",
      subdir: "components",
    },
    util: {
      pattern: /\.(utils?|helpers?|formatters?)/,
      testSuffix: ".test.ts",
      subdir: "utils",
    },
    store: {
      pattern: /-store/,
      testSuffix: ".test.ts",
      subdir: "stores",
    },
    page: {
      pattern: /Page/,
      testSuffix: ".test.tsx",
      subdir: "pages",
    },
  },

  // GraphQL detection patterns
  graphqlPatterns: {
    useQuery: /useQuery/,
    useMutation: /useMutation/,
    useLazyQuery: /useLazyQuery/,
    useSubscription: /useSubscription/,
    gql: /gql`/,
    apolloImport: /from ['"]@apollo\/client['"]/,
  },

  // React patterns
  reactPatterns: {
    useState: /useState/,
    useEffect: /useEffect/,
    useCallback: /useCallback/,
    useMemo: /useMemo/,
    useRef: /useRef/,
    useContext: /useContext/,
  },

  // Timer patterns (for debounce, throttle, etc.)
  timerPatterns: {
    setTimeout: /setTimeout/,
    setInterval: /setInterval/,
    debounce: /debounce/i,
    throttle: /throttle/i,
  },

  // Zustand patterns
  zustandPatterns: {
    create: /create\(/,
    zustandImport: /from ['"]zustand['"]/,
    persist: /persist\(/,
  },

  // Files to ignore
  ignorePatterns: [
    /\.test\.(ts|tsx)$/,
    /\.spec\.(ts|tsx)$/,
    /\.d\.ts$/,
    /index\.(ts|tsx)$/,
    /types\.(ts|tsx)$/,
    /constants\.(ts|tsx)$/,
    /\.stories\.(ts|tsx)$/,
  ],

  // Directories to ignore
  ignoreDirs: ["__tests__", "node_modules", "dist", "build", "coverage", ".git", "generated"],

  // CLI options defaults
  defaults: {
    overwrite: false,
    dryRun: false,
    verbose: false,
    interactive: true,
  },

  // Test naming conventions
  naming: {
    testFile: (fileName, ext) => `${fileName}.test${ext}`,
    describe: (name) => `${name}`,
    itShould: (action) => `should ${action}`,
  },

  // Imports to add based on file type
  commonImports: {
    vitest: "import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';",
    rtl: "import { render, screen, waitFor, fireEvent } from '@testing-library/react';",
    userEvent: "import userEvent from '@testing-library/user-event';",
    apollo: "import { MockedProvider } from '@apollo/client/testing';",
    renderHook: "import { renderHook, waitFor } from '@testing-library/react';",
  },

  // Coverage targets (aligned with vitest.config.ts thresholds)
  coverage: {
    statements: 70,
    branches: 60,
    functions: 70,
    lines: 70,
    // Target for comprehensive coverage
    ideal: {
      statements: 85,
      branches: 75,
      functions: 85,
      lines: 85,
    },
  },

  // Test generation strategies
  testGeneration: {
    // Always include these test cases for hooks
    hookDefaults: [
      "should be defined",
      "should return expected initial state",
      "should handle loading states",
      "should handle error states",
      "should handle success states",
    ],
    // Always include these test cases for components
    componentDefaults: [
      "should render without crashing",
      "should match snapshot",
      "should render with required props",
      "should handle loading state",
      "should handle error state",
      "should handle empty state",
    ],
    // Always include these test cases for utils
    utilDefaults: [
      "should be defined",
      "should handle valid input",
      "should handle invalid input",
      "should handle edge cases",
      "should handle null/undefined",
    ],
    // Always include these test cases for stores
    storeDefaults: [
      "should initialize with default state",
      "should update state correctly",
      "should handle async actions",
      "should handle errors in actions",
      "should persist state if configured",
    ],
    // Minimum number of test cases per file type
    minimumTests: {
      hook: 5,
      component: 6,
      util: 5,
      store: 5,
      page: 4,
    },
  },

  // Output colors (for CLI)
  colors: {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
  },
};

export default config;
