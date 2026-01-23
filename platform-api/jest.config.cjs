// Configuration Jest optimisée pour ESM + TypeScript
// Jest 29.7+ avec ts-jest 29.2+ pour un meilleur support ESM

module.exports = {
  // Preset optimisé pour ESM avec TypeScript
  preset: "ts-jest/presets/default-esm",

  // Environnement de test
  testEnvironment: "node",

  // Extensions à traiter comme ESM
  extensionsToTreatAsEsm: [".ts"],

  // Configuration de ts-jest pour ESM
  globals: {
    "ts-jest": {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        moduleResolution: "node",
        module: "esnext",
        target: "esnext",
      },
    },
  },

  // Mapping des modules pour résoudre les imports
  moduleNameMapper: {
    // Monorepo packages
    "^@clubmanager/types$":
      "<rootDir>/../platform-packages/types/dist/index.js",
    "^@clubmanager/(.*)$": "<rootDir>/../packages/$1/src",

    // Résolution des imports .js vers .ts (pattern ESM/TS)
    "^(\\.{1,2}/.*)\\.js$": "$1",

    // Modules problématiques spécifiques
    ".*mysqlconnector\\.js$": "<rootDir>/src/db/connector/mysqlconnector.js",
    "^bignumber\\.js$": "<rootDir>/node_modules/bignumber.js/bignumber.js",
    "^ipaddr\\.js$": "<rootDir>/node_modules/ipaddr.js/lib/ipaddr.js",
  },

  // Configuration du transformateur
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          moduleResolution: "node",
          module: "esnext",
          target: "esnext",
        },
      },
    ],
  },

  // Patterns de transformation à ignorer (sauf modules ESM)
  transformIgnorePatterns: [
    "node_modules/(?!(zod|pg|ipaddr\\.js|bignumber\\.js|@clubmanager)/)",
  ],

  // Patterns de tests à exécuter
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
  ],

  // Extensions de modules à résoudre
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Répertoires de résolution des modules
  moduleDirectories: ["node_modules", "src"],

  // Chemins de tests à ignorer
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "\\.skip\\.test\\.ts$",
  ],

  // Chemins de coverage à ignorer
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/build/",
    "/__tests__/",
    "/__mocks__/",
    "/test-helpers/",
    "\\.test\\.ts$",
    "\\.mock\\.ts$",
  ],

  // Dossier racine
  rootDir: ".",

  // Options d'affichage
  verbose: true,

  // Fichiers de setup pour configuration ESM
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup/jest.setup.ts"],

  // Injecter les globales Jest (describe, it, expect, etc.)
  injectGlobals: true,

  // Timeout par défaut
  testTimeout: 30000,

  // Nettoyer les mocks entre chaque test
  clearMocks: true,
  resetMocks: false,
  restoreMocks: false,

  // Configuration de la couverture
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
    "!src/**/__mocks__/**",
    "!src/**/test-helpers/**",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.mock.{ts,tsx}",
  ],

  // Répertoire de sortie de la couverture
  coverageDirectory: "<rootDir>/coverage",

  // Reporters de couverture
  coverageReporters: ["text", "text-summary", "html", "lcov", "json"],

  // Seuils de couverture (ajustez selon vos besoins)
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70,
  //   },
  // },

  // Parallélisation des tests
  maxWorkers: "50%",

  // Détection des fuites de mémoire
  detectLeaks: false,

  // Forcer la sortie après l'exécution des tests
  forceExit: false,

  // Mode watch
  watchPathIgnorePatterns: ["/node_modules/", "/dist/"],

  // Options ESM supplémentaires
  resolver: undefined,

  // Cache
  cache: true,
  cacheDirectory: "<rootDir>/.jest-cache",
};
