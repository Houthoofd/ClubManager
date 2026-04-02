/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 * All env variables must be prefixed with VITE_ to be exposed to the client
 */
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT?: string;

  // Stripe Configuration
  readonly VITE_STRIPE_PUBLIC_KEY: string;

  // Application Configuration
  readonly VITE_APP_NAME?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_APP_ENVIRONMENT?: 'development' | 'staging' | 'production';

  // Feature Flags
  readonly VITE_ENABLE_DEVTOOLS?: string;
  readonly VITE_ENABLE_QUERY_DEVTOOLS?: string;
  readonly VITE_ENABLE_REDUX_DEVTOOLS?: string;

  // Authentication
  readonly VITE_AUTH_TOKEN_KEY?: string;
  readonly VITE_AUTH_REFRESH_TOKEN_KEY?: string;
  readonly VITE_SESSION_TIMEOUT?: string;

  // Logging & Monitoring
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  readonly VITE_ENABLE_CONSOLE_LOGS?: string;
  readonly VITE_SENTRY_DSN?: string;

  // Analytics
  readonly VITE_GA_TRACKING_ID?: string;
  readonly VITE_MIXPANEL_TOKEN?: string;

  // Development
  readonly VITE_USE_MOCK_API?: string;
  readonly VITE_DEBUG_MODE?: string;

  // Build info (injected by Vite)
  readonly MODE: string;
  readonly BASE_URL: string;
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global type augmentations
declare global {
  const __APP_VERSION__: string;
  const __BUILD_TIME__: string;
}

export {};
