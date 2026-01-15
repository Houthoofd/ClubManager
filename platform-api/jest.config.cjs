// Correction : pour Jest en mode ESM, renommez ce fichier en jest.config.cjs et utilisez module.exports
// Pour corriger l'erreur, modifiez votre script/package.json pour utiliser jest.config.cjs au lieu de jest.config.js :
// Exemple : jest --config jest.config.cjs
module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    ".*mysqlconnector.js$": "<rootDir>/src/db/connector/mysqlconnector.js",
    "bignumber.js": "<rootDir>/node_modules/bignumber.js/bignumber.js",
    "ipaddr.js": "<rootDir>/node_modules/ipaddr.js/lib/ipaddr.js",
    "^(.*)\\.js$": "$1",
    "@clubmanager/(.*)": "<rootDir>/../packages/$1/src",
    '^@clubmanager/types$': '<rootDir>/../packages/types/dist/index.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  transformIgnorePatterns: [
    "node_modules/(?!(zod|pg|ipaddr.js|bignumber.js))"
  ],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleDirectories: ['node_modules', 'src'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  rootDir: '.',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup/jest-setup-improved.ts'],
  injectGlobals: true,
  testTimeout: 30000,
  clearMocks: true,
};
