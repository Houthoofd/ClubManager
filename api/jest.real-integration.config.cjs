// Jest configuration for REAL INTEGRATION tests
// This config does NOT mock anything - it uses the real database and real connectors
// connected to the test database (clubmanager_test)

module.exports = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: {
        module: "ESNext",
        moduleResolution: "NodeNext",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
  moduleNameMapper: {
    // DO NOT mock the MySQL connector for real integration tests
    // "^.*/db/connector/mysqlconnector\\.js$": "<rootDir>/src/db/connector/__mocks__/mysqlconnector.ts",
    "bignumber.js": "<rootDir>/node_modules/bignumber.js/bignumber.js",
    "ipaddr.js": "<rootDir>/node_modules/ipaddr.js/lib/ipaddr.js",
    "@clubmanager/(.*)": "<rootDir>/../packages/$1/src",
    "^@clubmanager/types$": "<rootDir>/../packages/types/dist/index.js",
    // Map generated Prisma client path to the actual generated location
    "^\\.\\./generated/prisma/index\\.js$":
      "<rootDir>/src/generated/prisma/index.js",
    "^\\.\\./(\\.\\./)*/generated/prisma/index\\.js$":
      "<rootDir>/src/generated/prisma/index.js",
    // NOTE: For REAL integration tests, we DO NOT mock @prisma/client or MySQL connector
    // We use the real Prisma client and real MySQL connector connected to clubmanager_test
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(zod|pg|ipaddr.js|bignumber.js|@prisma|.prisma))",
  ],
  // Only run real integration tests
  testMatch: ["**/__tests__/**/*.real-integration.test.ts"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  moduleDirectories: ["node_modules", "src"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  rootDir: ".",
  verbose: true,
  injectGlobals: true,
  testTimeout: 60000, // 60 secondes pour les tests avec vraie DB
  clearMocks: false, // Ne pas effacer les mocks puisqu'on n'en utilise pas
  resetMocks: false,
  restoreMocks: false,
  // Load .env.test BEFORE any modules are imported
  // This is CRITICAL for integration tests to connect to the right database
  setupFiles: ["<rootDir>/tests/jest.setup.mjs"],
  // Exécuter les tests séquentiellement pour éviter les conflits de base de données
  maxWorkers: 1,
  // Force sequential execution to avoid DB conflicts
  runInBand: true,
};
