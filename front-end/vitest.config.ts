import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  test: {
    // ============================================================================
    // Environment Configuration
    // ============================================================================
    environment: "jsdom",

    // ============================================================================
    // Setup Files
    // ============================================================================
    setupFiles: ["./src/setupTests.ts"],

    // ============================================================================
    // Globals Configuration
    // ============================================================================
    globals: true,

    // ============================================================================
    // Coverage Configuration
    // ============================================================================
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/**/*.d.ts",
        "src/**/*.config.ts",
        "src/**/*.config.js",
        "src/**/index.ts", // Barrel exports
        "src/core/api/apollo/generated/**", // Generated GraphQL
        "src/**/*.stories.tsx", // Storybook files
        "src/**/__tests__/**", // Test files themselves
        "src/**/__mocks__/**", // Mock files
        "src/examples/**", // Example files
        "dist/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        // Documentation files
        "src/APOLLO_OPTIMIZATIONS.ts",
        "src/COMPLETE_STACK_EXAMPLE.tsx",
        "src/I18N_INTEGRATION_GUIDE.tsx",
        "src/MODULAR_ARCHITECTURE_COMPLETE.tsx",
        "src/MODULAR_COMPONENTS_GENERATED.tsx",
        "src/PERFORMANCE_OPTIMIZATIONS.ts",
        "src/PHASE1_COMPLETE.ts",
        "src/PHASE2_IN_PROGRESS.ts",
        "src/PROJECT_STRUCTURE.ts",
        "src/STACK_INTEGRATION.tsx",
      ],
      // Coverage thresholds
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70,
      },
      // Watermarks for coverage visualization
      watermarks: {
        statements: [70, 90],
        functions: [70, 90],
        branches: [60, 80],
        lines: [70, 90],
      },
    },

    // ============================================================================
    // Include/Exclude Patterns
    // ============================================================================
    include: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],

    exclude: ["node_modules", "dist", ".idea", ".git", ".cache", "src/core/api/apollo/generated"],

    // ============================================================================
    // Test Timeout
    // ============================================================================
    testTimeout: 10000,
    hookTimeout: 10000,

    // ============================================================================
    // Reporters
    // ============================================================================
    reporters: ["verbose"],

    // ============================================================================
    // Mock Configuration
    // ============================================================================
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,

    // ============================================================================
    // Watch Configuration
    // ============================================================================
    watch: false,

    // ============================================================================
    // UI Configuration (optional)
    // ============================================================================
    // Uncomment to enable Vitest UI
    // ui: true,

    // ============================================================================
    // Benchmark Configuration (optional)
    // ============================================================================
    // benchmark: {
    //   include: ['src/**/*.bench.{ts,tsx}'],
    // },
  },

  // ============================================================================
  // Resolve Configuration (same as vite.config.ts)
  // ============================================================================
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/app": path.resolve(__dirname, "./src/app"),
      "@/core": path.resolve(__dirname, "./src/core"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
      "@/features": path.resolve(__dirname, "./src/features"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
      "@/styles": path.resolve(__dirname, "./src/styles"),
    },
  },

  // ============================================================================
  // Define (environment variables for tests)
  // ============================================================================
  define: {
    "import.meta.env.VITE_STRIPE_PUBLIC_KEY": JSON.stringify("pk_test_mock"),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify("http://localhost:4000"),
    "import.meta.env.NODE_ENV": JSON.stringify("test"),
  },
});
