/**
 * Configuration Jest pour les tests Webhooks Stripe
 * Optimisée pour les tests unitaires et d'intégration des webhooks
 */

module.exports = {
  // Environnement de test
  testEnvironment: "node",

  // Support des modules ES6
  extensionsToTreatAsEsm: [".ts"],

  // Transformation TypeScript
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          module: "esnext",
          target: "es2022",
          moduleResolution: "node",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          resolveJsonModule: true,
        },
      },
    ],
  },

  // Extensions de fichiers à résoudre
  moduleFileExtensions: ["ts", "js", "json", "node"],

  // Patterns de fichiers de test (webhooks uniquement)
  testMatch: ["**/routes/stripe/__tests__/stripe.webhook*.test.ts"],

  // Patterns à ignorer
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/coverage/"],

  // Mapping des modules
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Configuration de la couverture
  collectCoverageFrom: [
    "src/routes/stripe/core/webhooks/**/*.ts",
    "!src/routes/stripe/core/webhooks/**/*.test.ts",
    "!src/routes/stripe/core/webhooks/**/*.spec.ts",
    "!src/routes/stripe/core/webhooks/**/index.ts",
  ],

  // Répertoire de sortie de la couverture
  coverageDirectory: "coverage/webhooks",

  // Reporters de couverture
  coverageReporters: ["text", "text-summary", "html", "lcov", "json"],

  // Seuils de couverture
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "./src/routes/stripe/core/webhooks/webhook.service.ts": {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Root directory
  rootDir: "../..",

  // Fichiers de setup
  setupFilesAfterEnv: ["<rootDir>/config/jest/jest.setup.webhook.cjs"],

  // Timeouts
  testTimeout: 10000,

  // Verbose pour plus de détails
  verbose: true,

  // Afficher les tests individuels
  displayName: {
    name: "WEBHOOKS",
    color: "blue",
  },

  // Bail après N échecs
  bail: 0,

  // Nombre de workers (parallélisation)
  maxWorkers: "50%",

  // Clear mocks entre chaque test
  clearMocks: true,

  // Restore mocks après chaque test
  restoreMocks: true,

  // Reset mocks entre les tests
  resetMocks: true,

  // Variables d'environnement
  testEnvironmentOptions: {
    NODE_ENV: "test",
  },

  // Globals
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },

  // Reporters
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "./coverage/webhooks/html-report",
        filename: "report.html",
        pageTitle: "Webhook Tests Report",
        expand: true,
        openReport: false,
      },
    ],
  ],

  // Détection des fuites de mémoire
  detectLeaks: false,

  // Afficher les changements de fichiers surveillés
  watchPathIgnorePatterns: ["/node_modules/", "/dist/", "/coverage/"],

  // Force la sortie après tous les tests
  forceExit: false,

  // Afficher chaque test
  silent: false,

  // Patterns des modules à ne pas transformer
  transformIgnorePatterns: ["node_modules/(?!(stripe|@stripe)/)"],
};
