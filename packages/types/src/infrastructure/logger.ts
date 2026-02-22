/**
 * Logger Types
 * Types for centralized logging system with Sentry integration
 */

// ============================================================================
// Log Levels
// ============================================================================

/**
 * Available log levels
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Log level priority (for filtering)
 */
export enum LogLevelPriority {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

// ============================================================================
// Log Context
// ============================================================================

/**
 * Additional context for logs
 */
export interface LogContext {
  /** User ID if authenticated */
  userId?: string | number;

  /** Session ID */
  sessionId?: string;

  /** Request ID for tracing */
  requestId?: string;

  /** Feature/module name */
  feature?: string;

  /** Component name */
  component?: string;

  /** Action being performed */
  action?: string;

  /** Additional metadata */
  metadata?: Record<string, any>;

  /** Tags for filtering */
  tags?: string[];

  /** Timestamp override */
  timestamp?: Date | string;
}

// ============================================================================
// Log Entry
// ============================================================================

/**
 * Complete log entry
 */
export interface LoggerEntry {
  /** Log level */
  level: LogLevel;

  /** Log message */
  message: string;

  /** Additional context */
  context?: LogContext;

  /** Error object (for error/fatal logs) */
  error?: Error;

  /** Timestamp */
  timestamp: Date;

  /** Environment (dev, test, prod) */
  environment: string;

  /** Application version */
  version?: string;
}

// ============================================================================
// Logger Configuration
// ============================================================================

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Minimum log level to display */
  minLevel: LogLevel;

  /** Enable console output */
  enableConsole: boolean;

  /** Enable Sentry integration */
  enableSentry: boolean;

  /** Enable breadcrumbs for Sentry */
  enableBreadcrumbs: boolean;

  /** Enable performance tracking */
  enablePerformance: boolean;

  /** Custom log formatters */
  formatters?: {
    console?: (entry: LoggerEntry) => string;
    sentry?: (entry: LoggerEntry) => any;
  };

  /** Filters for logs */
  filters?: {
    /** Filter by feature */
    features?: string[];
    /** Filter by component */
    components?: string[];
    /** Filter by tags */
    tags?: string[];
  };

  /** Max breadcrumbs to keep */
  maxBreadcrumbs?: number;
}

// ============================================================================
// Logger Interface
// ============================================================================

/**
 * Logger interface
 */
export interface Logger {
  /** Log debug message */
  debug(message: string, context?: LogContext): void;

  /** Log info message */
  info(message: string, context?: LogContext): void;

  /** Log warning message */
  warn(message: string, context?: LogContext): void;

  /** Log error message */
  error(message: string, error?: Error, context?: LogContext): void;

  /** Log fatal error */
  fatal(message: string, error?: Error, context?: LogContext): void;

  /** Start performance measurement */
  startTimer(label: string): () => void;

  /** Set global context */
  setContext(context: Partial<LogContext>): void;

  /** Clear global context */
  clearContext(): void;

  /** Get current configuration */
  getConfig(): LoggerConfig;

  /** Update configuration */
  configure(config: Partial<LoggerConfig>): void;
}

// ============================================================================
// Performance Measurement
// ============================================================================

/**
 * Performance measurement entry
 */
export interface PerformanceEntry {
  /** Label/name of the operation */
  label: string;

  /** Start timestamp */
  startTime: number;

  /** End timestamp */
  endTime?: number;

  /** Duration in ms */
  duration?: number;

  /** Additional context */
  context?: LogContext;
}

// ============================================================================
// Breadcrumb
// ============================================================================

/**
 * Breadcrumb for debugging
 */
export interface LogBreadcrumb {
  /** Breadcrumb type */
  type: "navigation" | "http" | "user" | "error" | "info";

  /** Category */
  category?: string;

  /** Message */
  message?: string;

  /** Level */
  level?: LogLevel;

  /** Data */
  data?: Record<string, any>;

  /** Timestamp */
  timestamp: Date;
}
