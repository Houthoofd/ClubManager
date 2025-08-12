export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // Add explicit mapping for mysqlconnector.js
    ".*mysqlconnector.js$": "<rootDir>/src/db/connector/mysqlconnector.js",
    // Mappings for other problematic modules
    "bignumber.js": "<rootDir>/node_modules/bignumber.js/bignumber.js",
    "ipaddr.js": "<rootDir>/node_modules/ipaddr.js/lib/ipaddr.js",
    // Regular .js imports
    "^(.*)\\.js$": "$1",
    // Package imports
    "@clubmanager/(.*)": "<rootDir>/../packages/$1/src"
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json'
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(zod|pg|ipaddr.js|bignumber.js))"
  ],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  rootDir: '.',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest-setup-improved.ts'],
  injectGlobals: true,
  testTimeout: 30000,
  clearMocks: true,
}

