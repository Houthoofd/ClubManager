import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react({
        // Enable Fast Refresh
        fastRefresh: true,
        // Babel plugins for development
        babel: {
          plugins: mode === 'development' ? ['babel-plugin-react-compiler'] : [],
        },
      }),
      // Bundle analyzer (only in analyze mode)
      mode === 'analyze' &&
        visualizer({
          filename: './dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    // Path aliases for cleaner imports
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@app': path.resolve(__dirname, './src/app'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@widgets': path.resolve(__dirname, './src/widgets'),
        '@features': path.resolve(__dirname, './src/features'),
        '@entities': path.resolve(__dirname, './src/entities'),
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },

    // Development server configuration
    server: {
      port: 5173,
      host: true,
      strictPort: false,
      open: false,
      proxy: {
        // Proxy API requests to backend in development
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // Preview server configuration
    preview: {
      port: 4173,
      host: true,
      strictPort: false,
      open: false,
    },

    // Build configuration
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      // Reduce chunk size warnings threshold
      chunkSizeWarningLimit: 1000,
      // Rollup options
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // React core
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // State management & data fetching
            'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-devtools'],
            // UI libraries
            'ui-vendor': [
              '@patternfly/react-core',
              '@patternfly/react-icons',
              '@patternfly/react-styles',
              '@patternfly/react-table',
            ],
            // Stripe
            'stripe-vendor': ['@stripe/stripe-js', '@stripe/react-stripe-js'],
            // Charts
            'charts-vendor': ['recharts'],
            // Utilities
            'utils-vendor': ['js-cookie', 'zod'],
          },
          // Clean file names
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
      // Minify options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
    },

    // Optimize dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        '@patternfly/react-core',
        '@patternfly/react-icons',
      ],
    },

    // Define global constants (only non-sensitive values)
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      modules: {
        localsConvention: 'camelCase',
      },
    },

    // Test configuration (for Vitest)
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/app/test/setup.ts',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/app/test/',
          '**/*.d.ts',
          '**/*.config.*',
          '**/mockData',
          '**/__tests__',
        ],
      },
    },
  };
});
