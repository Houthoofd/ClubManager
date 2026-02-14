/**
 * Application Configuration
 *
 * Centralized configuration management for the entire application.
 * All environment variables and app settings are defined here.
 */

import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config();

export interface AppConfig {
  // Environment
  env: "development" | "production" | "test";
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;

  // Server
  port: number;
  host: string;
  apiUrl: string;
  frontendUrl: string;

  // Database
  database: {
    url: string;
    poolSize: number;
    connectionTimeout: number;
  };

  // Redis (for caching and rate limiting)
  redis: {
    enabled: boolean;
    host: string;
    port: number;
    password?: string;
    db: number;
  };

  // Logging
  logging: {
    level: "error" | "warn" | "info" | "debug";
    format: "json" | "pretty";
  };

  // CORS
  cors: {
    enabled: boolean;
    origins: string[];
    credentials: boolean;
  };

  // File Upload
  upload: {
    maxFileSize: number; // in bytes
    allowedMimeTypes: string[];
    destination: string;
  };

  // Email
  email: {
    enabled: boolean;
    from: string;
    fromName: string;
    smtp?: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
    };
    // For services like SendGrid, Mailgun, etc.
    apiKey?: string;
    service?: string;
  };

  // Features
  features: {
    registration: boolean;
    emailVerification: boolean;
    passwordReset: boolean;
    twoFactorAuth: boolean;
    socialLogin: boolean;
    fileUpload: boolean;
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    store: "memory" | "redis";
  };

  // Session
  session: {
    expirationDays: number;
    maxSessionsPerUser: number;
    cleanupIntervalHours: number;
  };

  // Audit
  audit: {
    enabled: boolean;
    retentionDays: number;
    cleanupIntervalHours: number;
  };

  // Sentry
  sentry: {
    enabled: boolean;
    dsn: string;
    environment: string;
    sampleRate: number;
    tracesSampleRate: number;
    profilesSampleRate: number;
    debug: boolean;
  };

  // Security
  security: {
    bcryptRounds: number;
    jwtAlgorithm: "HS256" | "HS384" | "HS512";
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireLowercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecialChars: boolean;
  };
}

/**
 * Parse boolean from environment variable
 */
function parseBoolean(
  value: string | undefined,
  defaultValue: boolean,
): boolean {
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Parse integer from environment variable
 */
function parseIntEnv(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse array from comma-separated string
 */
function parseArray(
  value: string | undefined,
  defaultValue: string[],
): string[] {
  if (!value) return defaultValue;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Application configuration
 */
export const appConfig: AppConfig = {
  // Environment
  env: (process.env.NODE_ENV as any) || "development",
  isDevelopment:
    process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // Server
  port: parseIntEnv(process.env.PORT, 4000),
  host: process.env.HOST || "localhost",
  apiUrl: process.env.API_URL || "http://localhost:4000",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Database
  database: {
    url: process.env.DATABASE_URL || "",
    poolSize: parseIntEnv(process.env.DB_POOL_SIZE, 10),
    connectionTimeout: parseIntEnv(process.env.DB_CONNECTION_TIMEOUT, 10000),
  },

  // Redis
  redis: {
    enabled: parseBoolean(process.env.REDIS_ENABLED, false),
    host: process.env.REDIS_HOST || "localhost",
    port: parseIntEnv(process.env.REDIS_PORT, 6379),
    password: process.env.REDIS_PASSWORD,
    db: parseIntEnv(process.env.REDIS_DB, 0),
  },

  // Logging
  logging: {
    level: (process.env.LOG_LEVEL as any) || "info",
    format: (process.env.LOG_FORMAT as any) || "pretty",
  },

  // CORS
  cors: {
    enabled: parseBoolean(process.env.CORS_ENABLED, true),
    origins: parseArray(process.env.CORS_ORIGINS, ["http://localhost:3000"]),
    credentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
  },

  // File Upload
  upload: {
    maxFileSize: parseIntEnv(process.env.UPLOAD_MAX_FILE_SIZE, 5 * 1024 * 1024), // 5MB default
    allowedMimeTypes: parseArray(process.env.UPLOAD_ALLOWED_MIME_TYPES, [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ]),
    destination:
      process.env.UPLOAD_DESTINATION || path.join(process.cwd(), "uploads"),
  },

  // Email
  email: {
    enabled: parseBoolean(process.env.EMAIL_ENABLED, false),
    from: process.env.EMAIL_FROM || "noreply@example.com",
    fromName: process.env.EMAIL_FROM_NAME || "ClubManager",
    smtp: process.env.SMTP_HOST
      ? {
          host: process.env.SMTP_HOST,
          port: parseIntEnv(process.env.SMTP_PORT, 587),
          secure: parseBoolean(process.env.SMTP_SECURE, false),
          user: process.env.SMTP_USER || "",
          password: process.env.SMTP_PASSWORD || "",
        }
      : undefined,
    apiKey: process.env.EMAIL_API_KEY,
    service: process.env.EMAIL_SERVICE, // 'sendgrid', 'mailgun', etc.
  },

  // Features
  features: {
    registration: parseBoolean(process.env.FEATURE_REGISTRATION, true),
    emailVerification: parseBoolean(
      process.env.FEATURE_EMAIL_VERIFICATION,
      true,
    ),
    passwordReset: parseBoolean(process.env.FEATURE_PASSWORD_RESET, true),
    twoFactorAuth: parseBoolean(process.env.FEATURE_TWO_FACTOR_AUTH, false),
    socialLogin: parseBoolean(process.env.FEATURE_SOCIAL_LOGIN, false),
    fileUpload: parseBoolean(process.env.FEATURE_FILE_UPLOAD, true),
  },

  // Rate Limiting
  rateLimit: {
    enabled: parseBoolean(process.env.RATE_LIMIT_ENABLED, true),
    windowMs: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
    maxRequests: parseIntEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    store: (process.env.RATE_LIMIT_STORE as any) || "memory",
  },

  // Session
  session: {
    expirationDays: parseIntEnv(process.env.SESSION_EXPIRATION_DAYS, 30),
    maxSessionsPerUser: parseIntEnv(process.env.SESSION_MAX_PER_USER, 10),
    cleanupIntervalHours: parseIntEnv(
      process.env.SESSION_CLEANUP_INTERVAL_HOURS,
      24,
    ),
  },

  // Audit
  audit: {
    enabled: parseBoolean(process.env.AUDIT_ENABLED, true),
    retentionDays: parseIntEnv(process.env.AUDIT_RETENTION_DAYS, 730), // 2 years (GDPR)
    cleanupIntervalHours: parseIntEnv(
      process.env.AUDIT_CLEANUP_INTERVAL_HOURS,
      24,
    ),
  },

  // Sentry
  sentry: {
    enabled:
      parseBoolean(process.env.SENTRY_ENABLED, false) &&
      !!process.env.SENTRY_DSN,
    dsn: process.env.SENTRY_DSN || "",
    environment:
      process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development",
    sampleRate: parseFloat(process.env.SENTRY_SAMPLE_RATE || "1.0"),
    tracesSampleRate: parseFloat(
      process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1",
    ),
    profilesSampleRate: parseFloat(
      process.env.SENTRY_PROFILES_SAMPLE_RATE || "0.1",
    ),
    debug: parseBoolean(process.env.SENTRY_DEBUG, false),
  },

  // Security
  security: {
    bcryptRounds: parseIntEnv(process.env.BCRYPT_ROUNDS, 12),
    jwtAlgorithm: (process.env.JWT_ALGORITHM as any) || "HS256",
    passwordMinLength: parseIntEnv(process.env.PASSWORD_MIN_LENGTH, 8),
    passwordRequireUppercase: parseBoolean(
      process.env.PASSWORD_REQUIRE_UPPERCASE,
      true,
    ),
    passwordRequireLowercase: parseBoolean(
      process.env.PASSWORD_REQUIRE_LOWERCASE,
      true,
    ),
    passwordRequireNumbers: parseBoolean(
      process.env.PASSWORD_REQUIRE_NUMBERS,
      true,
    ),
    passwordRequireSpecialChars: parseBoolean(
      process.env.PASSWORD_REQUIRE_SPECIAL_CHARS,
      true,
    ),
  },
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!appConfig.database.url) {
    errors.push("DATABASE_URL is required");
  }

  if (
    appConfig.email.enabled &&
    !appConfig.email.smtp &&
    !appConfig.email.apiKey
  ) {
    errors.push("Email is enabled but no SMTP or API key is configured");
  }

  if (appConfig.redis.enabled && appConfig.rateLimit.store === "redis") {
    if (!appConfig.redis.host) {
      errors.push("REDIS_HOST is required when Redis is enabled");
    }
  }

  if (errors.length > 0) {
    console.error("❌ Configuration errors:");
    errors.forEach((error) => console.error(`  - ${error}`));
    throw new Error("Invalid configuration");
  }
}

/**
 * Log configuration (safe - no secrets)
 */
export function logConfig(): void {
  console.log("📋 Application Configuration:");
  console.log(`  Environment: ${appConfig.env}`);
  console.log(`  Port: ${appConfig.port}`);
  console.log(`  API URL: ${appConfig.apiUrl}`);
  console.log(
    `  Database: ${appConfig.database.url ? "✅ Configured" : "❌ Missing"}`,
  );
  console.log(
    `  Redis: ${appConfig.redis.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `  Email: ${appConfig.email.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `  Rate Limiting: ${appConfig.rateLimit.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `  Audit Logging: ${appConfig.audit.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `  Sentry: ${appConfig.sentry.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(`  Features:`);
  console.log(
    `    - Registration: ${appConfig.features.registration ? "✅" : "❌"}`,
  );
  console.log(
    `    - Email Verification: ${appConfig.features.emailVerification ? "✅" : "❌"}`,
  );
  console.log(
    `    - Password Reset: ${appConfig.features.passwordReset ? "✅" : "❌"}`,
  );
  console.log(`    - 2FA: ${appConfig.features.twoFactorAuth ? "✅" : "❌"}`);
  console.log(
    `    - Social Login: ${appConfig.features.socialLogin ? "✅" : "❌"}`,
  );
}

export default appConfig;
