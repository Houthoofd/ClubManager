// Correction : pour Jest en mode ESM, renommez ce fichier en jest.config.cjs et utilisez module.exports
// Pour corriger l'erreur, modifiez votre script/package.json pour utiliser jest.config.cjs au lieu de jest.config.js :
// Exemple : jest --config jest.config.cjs
module.exports = {
  preset: "ts-jest/presets/js-with-ts-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^.*/db/connector/mysqlconnector\\.js$":
      "<rootDir>/src/db/connector/__mocks__/mysqlconnector.ts",
    "bignumber.js": "<rootDir>/node_modules/bignumber.js/bignumber.js",
    "ipaddr.js": "<rootDir>/node_modules/ipaddr.js/lib/ipaddr.js",
    "@clubmanager/(.*)": "<rootDir>/../packages/$1/src",
    "^@clubmanager/types$": "<rootDir>/../packages/types/dist/index.js",
    "^\\.\\./generated/prisma/index\\.js$":
      "<rootDir>/src/infrastructure/__mocks__/prisma-client.js",
    "^\\.\\./(\\.\\./)*/generated/prisma/index\\.js$":
      "<rootDir>/src/infrastructure/__mocks__/prisma-client.js",
    "^@prisma/client$":
      "<rootDir>/src/infrastructure/__mocks__/prisma-client.js",
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
  transformIgnorePatterns: ["node_modules/(?!(zod|pg|ipaddr.js|bignumber.js))"],
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  moduleFileExtensions: ["ts", "js", "json", "node"],
  moduleDirectories: ["node_modules", "src"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/archived/",
    "magasin.integration.test.ts",
    ".integration.test.tsx",
  ],
  rootDir: "../..",
  verbose: true,
  // setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest-setup-improved.ts'],
  injectGlobals: true,
  testTimeout: 30000,
  clearMocks: true,
  // Load .env.test BEFORE any modules are imported
  // This ensures Prisma connects to the test database
  setupFiles: ["<rootDir>/tests/jest.setup.cjs"],
  // Global teardown to close MySQL connections and prevent open handles
  globalTeardown: "<rootDir>/tests/jest.teardown.cjs",
};
