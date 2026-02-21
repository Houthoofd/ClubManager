import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), "");

  // Get configuration from environment with fallbacks
  const stripePublicKey =
    env.VITE_STRIPE_PUBLIC_KEY ||
    env.VITE_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51RWzE9BQMqChSZKpCmBYTuBAWMcSJzg9D17ltUMtPvH72XI6krdNQsLFQeXqCgPIVXos0L7EwRFjOSB6x1tbU1Zn00EiJkQHsZ";

  const apiBaseUrl = env.VITE_API_BASE_URL || env.VITE_API_URL || "https://clubmanagment.com/";

  const isDevelopment = mode === "development";
  const isProduction = mode === "production";

  // Log configuration (development only)
  if (isDevelopment) {
    console.log("🔧 [Vite Config] Environment loaded:", {
      command,
      mode,
      stripe_key: stripePublicKey.substring(0, 25) + "...",
      stripe_mode: stripePublicKey.includes("test") ? "TEST" : "LIVE",
      api_url: apiBaseUrl,
      account: stripePublicKey.substring(8, 23),
    });
  }

  // Warning if using test keys in production
  if (isProduction && stripePublicKey.includes("test")) {
    console.warn("⚠️  [Vite Config] WARNING: Using Stripe TEST key in PRODUCTION mode!");
  }

  return {
    plugins: [
      react(),
      // Bundle analyzer - génère stats.html après build
      visualizer({
        open: false,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
    ],

    // Path resolution
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
      dedupe: ["@apollo/client", "react", "react-dom"],
    },

    // Define environment variables for client-side access
    define: {
      "import.meta.env.VITE_STRIPE_PUBLIC_KEY": JSON.stringify(stripePublicKey),
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(apiBaseUrl),
      "import.meta.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || mode),
    },

    server: {
      port: Number(env.PORT) || 5173,
      host: true,
      // Enable CORS for development
      cors: true,
    },

    build: {
      outDir: "dist",
      sourcemap: isProduction ? false : true,
      // Rollup configuration
      rollupOptions: {
        onwarn(warning, warn) {
          // Ignore Apollo Client resolution warnings
          if (warning.code === "MISSING_EXPORT" && warning.exporter?.includes("@apollo/client")) {
            return;
          }
          warn(warning);
        },
        output: {
          // 🚀 OPTIMISATION: Code splitting avancé pour meilleur caching
          manualChunks(id) {
            // Vendor chunks (bibliothèques stables)
            if (id.includes("node_modules")) {
              // React core
              if (id.includes("react") || id.includes("react-dom")) {
                return "vendor-react";
              }

              // Stripe
              if (id.includes("@stripe")) {
                return "vendor-stripe";
              }

              // PatternFly UI (lourd)
              if (id.includes("@patternfly")) {
                return "vendor-patternfly";
              }

              // Apollo GraphQL
              if (id.includes("@apollo/client") || id.includes("graphql")) {
                return "vendor-apollo";
              }

              // State management
              if (id.includes("zustand") || id.includes("redux")) {
                return "vendor-state";
              }

              // Recharts (graphiques - lourd)
              if (id.includes("recharts") || id.includes("d3-")) {
                return "vendor-charts";
              }

              // i18n
              if (id.includes("i18next") || id.includes("react-i18next")) {
                return "vendor-i18n";
              }

              // Sentry monitoring
              if (id.includes("@sentry")) {
                return "vendor-sentry";
              }

              // Autres dépendances
              return "vendor-other";
            }

            // Feature-based chunks
            if (id.includes("/features/shop/")) {
              return "feature-shop";
            }
            if (id.includes("/features/stats/")) {
              return "feature-stats";
            }
            if (id.includes("/features/courses/")) {
              return "feature-courses";
            }
            if (id.includes("/features/users/")) {
              return "feature-users";
            }
            if (id.includes("/features/messages/")) {
              return "feature-messages";
            }
          },
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true,
      },
      // Increase chunk size warning limit (KB)
      chunkSizeWarningLimit: 800,
      // Minification
      minify: isProduction ? "terser" : false,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : undefined,
    },

    optimizeDeps: {
      include: ["@apollo/client"],
      esbuildOptions: {
        mainFields: ["module", "main"],
      },
    },

    // Preview server configuration (for build preview)
    preview: {
      port: Number(env.PREVIEW_PORT) || 4173,
      host: true,
    },
  };
});
