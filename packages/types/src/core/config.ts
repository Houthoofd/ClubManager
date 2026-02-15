/**
 * Centralized Configuration Types
 *
 * All configuration-related interfaces and types for ClubManager API.
 * This file consolidates types from various config files across the API.
 */

// ============================================================================
// APPLICATION CONFIG TYPES
// ============================================================================

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

  // Database
  database: {
    url: string;
    poolMin?: number;
    poolMax?: number;
    connectionTimeout?: number;
  };

  // Authentication
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshTokenExpiresIn: string;
    bcryptRounds: number;
  };

  // External Services
  stripe: {
    secretKey: string;
    publicKey?: string;
    webhookSecret: string;
    apiVersion?: string;
  };

  sendgrid: {
    apiKey: string;
    fromEmail: string;
    fromName?: string;
  };

  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3: {
      bucket: string;
      endpoint?: string;
    };
  };

  // Feature Flags
  features: {
    emailVerification: boolean;
    twoFactorAuth: boolean;
    webhooks: boolean;
    analytics: boolean;
  };

  // Rate Limiting
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
  };

  // CORS
  cors: {
    enabled: boolean;
    origins: string[];
    credentials: boolean;
  };

  // Logging
  logging: {
    level: "debug" | "info" | "warn" | "error";
    format: "json" | "pretty";
    destination?: string;
  };

  // Monitoring
  monitoring: {
    sentryDsn?: string;
    sentryEnabled: boolean;
    healthCheckEnabled: boolean;
  };
}

// ============================================================================
// SENTRY CONFIG TYPES
// ============================================================================

export interface SentryConfig {
  dsn: string;
  environment: string;
  enabled: boolean;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate: number;
  debug: boolean;
  integrations: {
    http: boolean;
    express: boolean;
    graphql: boolean;
    prisma: boolean;
    console: boolean;
  };
  beforeSend?: (event: any, hint: any) => any | null;
  beforeBreadcrumb?: (breadcrumb: any, hint: any) => any | null;
}

export interface SentryBreadcrumb {
  message: string;
  category: string;
  level: "fatal" | "error" | "warning" | "info" | "debug";
  data?: Record<string, any>;
  timestamp?: number;
}

export interface SentryUser {
  id: string | number;
  email?: string;
  username?: string;
  ip_address?: string;
}

// ============================================================================
// DATABASE CONFIG TYPES
// ============================================================================

export interface DatabaseConfig {
  url: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean | DatabaseSSLConfig;
  poolMin?: number;
  poolMax?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  logging?: boolean;
  migrations?: {
    directory?: string;
    tableName?: string;
  };
}

export interface DatabaseSSLConfig {
  rejectUnauthorized?: boolean;
  ca?: string;
  cert?: string;
  key?: string;
}

// ============================================================================
// EMAIL CONFIG TYPES
// ============================================================================

export interface EmailConfig {
  provider: "sendgrid" | "smtp" | "ses";
  sendgrid?: {
    apiKey: string;
  };
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  ses?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
  templates?: {
    directory: string;
    engine: "handlebars" | "ejs" | "pug";
  };
  defaults?: {
    subject?: string;
    tags?: string[];
  };
}

// ============================================================================
// STORAGE CONFIG TYPES
// ============================================================================

export interface StorageConfig {
  provider: "s3" | "local" | "cloudinary";
  s3?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    acl?: string;
  };
  local?: {
    uploadDir: string;
    publicPath: string;
  };
  cloudinary?: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
  };
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  imageProcessing?: {
    enabled: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: "jpg" | "png" | "webp";
  };
}

// ============================================================================
// AUTHENTICATION CONFIG TYPES
// ============================================================================

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
    algorithm?: "HS256" | "HS384" | "HS512" | "RS256";
    issuer?: string;
    audience?: string;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    bcryptRounds: number;
  };
  session: {
    enabled: boolean;
    maxSessions: number;
    expiresInDays: number;
    slidingExpiration: boolean;
  };
  rateLimit: {
    enabled: boolean;
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  };
  oauth?: {
    google?: OAuthProviderConfig;
    facebook?: OAuthProviderConfig;
    github?: OAuthProviderConfig;
  };
  twoFactor?: {
    enabled: boolean;
    issuer: string;
  };
}

export interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  scope?: string[];
}

// ============================================================================
// CACHE CONFIG TYPES
// ============================================================================

export interface CacheConfig {
  enabled: boolean;
  provider: "memory" | "redis" | "memcached";
  redis?: {
    host: string;
    port: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
  };
  memcached?: {
    servers: string[];
    options?: any;
  };
  ttl: number;
  maxKeys?: number;
  checkPeriod?: number;
}

// ============================================================================
// WEBHOOK CONFIG TYPES
// ============================================================================

export interface WebhookConfig {
  enabled: boolean;
  endpoints: WebhookEndpoint[];
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  signature?: {
    enabled: boolean;
    secret: string;
    algorithm: "sha256" | "sha512";
  };
  timeout?: number;
}

export interface WebhookEndpoint {
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  active: boolean;
}

// ============================================================================
// QUEUE CONFIG TYPES
// ============================================================================

export interface QueueConfig {
  enabled: boolean;
  provider: "bullmq" | "bee-queue" | "sqs";
  redis?: {
    host: string;
    port: number;
    password?: string;
  };
  sqs?: {
    region: string;
    queueUrl: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  defaultJobOptions?: {
    attempts?: number;
    backoff?: {
      type: "exponential" | "fixed";
      delay: number;
    };
    removeOnComplete?: boolean | number;
    removeOnFail?: boolean | number;
  };
}

// ============================================================================
// GRAPHQL CONFIG TYPES
// ============================================================================

export interface GraphQLConfig {
  endpoint: string;
  playground: boolean;
  introspection: boolean;
  uploads: boolean;
  maxFileSize?: number;
  maxFiles?: number;
  complexity?: {
    enabled: boolean;
    maxComplexity: number;
  };
  depth?: {
    enabled: boolean;
    maxDepth: number;
  };
  tracing?: boolean;
  caching?: boolean;
}

// ============================================================================
// FEATURE FLAGS CONFIG TYPES
// ============================================================================

export interface FeatureFlagsConfig {
  emailVerification: boolean;
  phoneVerification: boolean;
  twoFactorAuth: boolean;
  socialLogin: boolean;
  webhooks: boolean;
  analytics: boolean;
  auditLogs: boolean;
  rateLimiting: boolean;
  caching: boolean;
  queueing: boolean;
  fileUploads: boolean;
  payments: boolean;
  subscriptions: boolean;
  notifications: boolean;
  chat: boolean;
  videoStreaming: boolean;
}

// ============================================================================
// SECURITY CONFIG TYPES
// ============================================================================

export interface SecurityConfig {
  cors: {
    enabled: boolean;
    origins: string[];
    methods?: string[];
    credentials: boolean;
    maxAge?: number;
  };
  helmet: {
    enabled: boolean;
    contentSecurityPolicy?: boolean;
    hsts?: boolean;
    frameguard?: boolean;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
  };
  csrf: {
    enabled: boolean;
    cookieName?: string;
  };
  encryption: {
    algorithm: string;
    key: string;
    iv?: string;
  };
  trustedProxies?: string[];
  allowedHosts?: string[];
}
