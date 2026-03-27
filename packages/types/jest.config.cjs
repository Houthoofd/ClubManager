/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: "ts-jest",

  // Set test environment to Node.js
  testEnvironment: "node",

  // Roots to search for tests
  roots: ["<rootDir>/src"],

  // Test file patterns
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.spec.ts"],

  // Coverage collection
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/index.ts",
    "!src/**/index.ts",
  ],

  // Coverage output
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html", "json-summary"],

  // Coverage thresholds (optional - can be adjusted)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // File extensions
  moduleFileExtensions: ["ts", "js", "json"],

  // Transform files with ts-jest
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },

  // Module name mapper (if needed for path aliases)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (in milliseconds)
  testTimeout: 10000,
};
