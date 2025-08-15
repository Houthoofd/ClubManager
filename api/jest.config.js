export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    ".*mysqlconnector.js$": "<rootDir>/src/db/connector/mysqlconnector.js",
    "bignumber.js": "<rootDir>/node_modules/bignumber.js/bignumber.js",
    "ipaddr.js": "<rootDir>/node_modules/ipaddr.js/lib/ipaddr.js",
    "^(.*)\\.js$": "$1",
    "@clubmanager/(.*)": "<rootDir>/../packages/$1/src"
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(zod|pg|ipaddr.js|bignumber.js))"
  ],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'], // plus pratique pour les imports
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  rootDir: '.',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest-setup-improved.ts'],
  injectGlobals: true,
  testTimeout: 30000,
  clearMocks: true,
};
