/**
 * Centralized Application Logger
 *
 * Provides a unified logging interface with:
 * - Multiple log levels (debug, info, warn, error, fatal)
 * - Sentry integration for error tracking
 * - Environment-aware logging (dev vs production)
 * - Performance measurement
 * - Breadcrumbs for debugging
 * - Contextual logging
 *
 * @module core/utils/appLogger
 */

import * as Sentry from "@sentry/react";
import type {
  Logger,
  LoggerConfig,
  LogLevel,
  LogContext,
  LoggerEntry,
  PerformanceEntry,
  LogBreadcrumb,
} from "@clubmanager/types";

// ============================================================================
// Constants
// ============================================================================

const LOG_LEVEL_COLORS = {
  debug: "#6c757d",
  info: "#0dcaf0",
  warn: "#ffc107",
  error: "#dc3545",
  fatal: "#a71d2a",
} as const;

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: (import.meta.env.DEV ? "debug" : "warn") as LogLevel,
  enableConsole: true,
  enableSentry: !import.meta.env.DEV,
  enableBreadcrumbs: true,
  enablePerformance: import.meta.env.DEV,
  maxBreadcrumbs: 50,
};

// ============================================================================
// Logger Implementation
// ============================================================================

class AppLogger implements Logger {
  private config: LoggerConfig;
  private globalContext: Partial<LogContext> = {};
  private breadcrumbs: LogBreadcrumb[] = [];
  private performanceTimers: Map<string, PerformanceEntry> = new Map();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log("debug", message, undefined, context);
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    this.log("info", message, undefined, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log("warn", message, undefined, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, error, context);
  }

  /**
   * Log fatal error (always sent to Sentry)
   */
  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log("fatal", message, error, context);
  }

  /**
   * Start performance timer
   * Returns a function to stop the timer
   */
  startTimer(label: string): () => void {
    const entry: PerformanceEntry = {
      label,
      startTime: performance.now(),
    };

    this.performanceTimers.set(label, entry);

    return () => this.stopTimer(label);
  }

  /**
   * Set global context (merged with all logs)
   */
  setContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  /**
   * Clear global context
   */
  clearContext(): void {
    this.globalContext = {};
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    // Check if log level is enabled
    if (!this.shouldLog(level)) {
      return;
    }

    const mergedContext = { ...this.globalContext, ...context };
    const entry: LoggerEntry = {
      level,
      message,
      context: mergedContext,
      error,
      timestamp: new Date(),
      environment: import.meta.env.MODE,
      version: import.meta.env.VITE_APP_VERSION,
    };

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Sentry integration
    if (this.config.enableSentry) {
      this.logToSentry(entry);
    }

    // Add breadcrumb
    if (this.config.enableBreadcrumbs) {
      this.addBreadcrumb({
        type: level === "error" || level === "fatal" ? "error" : "info",
        level,
        message,
        data: mergedContext,
        timestamp: entry.timestamp,
      });
    }
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const minPriority = LOG_LEVEL_PRIORITY[this.config.minLevel];
    const currentPriority = LOG_LEVEL_PRIORITY[level];
    return currentPriority >= minPriority;
  }

  /**
   * Log to browser console
   */
  private logToConsole(entry: LoggerEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const color = LOG_LEVEL_COLORS[entry.level];
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;

    const consoleMethod = this.getConsoleMethod(entry.level);
    const contextStr = entry.context ? JSON.stringify(entry.context, null, 2) : "";

    if (entry.error) {
      consoleMethod(
        `%c${prefix}%c ${entry.message}`,
        `color: ${color}; font-weight: bold;`,
        "color: inherit;",
        entry.error,
        contextStr,
      );
    } else {
      consoleMethod(
        `%c${prefix}%c ${entry.message}`,
        `color: ${color}; font-weight: bold;`,
        "color: inherit;",
        contextStr,
      );
    }
  }

  /**
   * Get appropriate console method for log level
   */
  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case "debug":
        return console.debug;
      case "info":
        return console.info;
      case "warn":
        return console.warn;
      case "error":
      case "fatal":
        return console.error;
      default:
        return console.log;
    }
  }

  /**
   * Log to Sentry
   */
  private logToSentry(entry: LoggerEntry): void {
    // Set Sentry context
    if (entry.context) {
      Sentry.setContext("log_context", entry.context as Record<string, unknown>);

      if (entry.context.userId) {
        Sentry.setUser({ id: String(entry.context.userId) });
      }

      if (entry.context.tags) {
        entry.context.tags.forEach((tag) => {
          Sentry.setTag("log_tag", tag);
        });
      }
    }

    // Handle errors
    if (entry.level === "error" || entry.level === "fatal") {
      if (entry.error) {
        Sentry.captureException(entry.error, {
          level: entry.level === "fatal" ? "fatal" : "error",
          tags: {
            log_level: entry.level,
            feature: entry.context?.feature,
            component: entry.context?.component,
          },
          contexts: {
            log: {
              message: entry.message,
              ...entry.context,
            },
          },
        });
      } else {
        Sentry.captureMessage(entry.message, {
          level: entry.level === "fatal" ? "fatal" : "error",
          tags: {
            log_level: entry.level,
            feature: entry.context?.feature,
            component: entry.context?.component,
          },
        });
      }
    } else if (entry.level === "warn") {
      // Warnings as breadcrumbs
      Sentry.addBreadcrumb({
        message: entry.message,
        level: "warning",
        data: entry.context,
      });
    } else {
      // Info/debug as breadcrumbs
      Sentry.addBreadcrumb({
        message: entry.message,
        level: "info",
        data: entry.context,
      });
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  private addBreadcrumb(breadcrumb: LogBreadcrumb): void {
    this.breadcrumbs.push(breadcrumb);

    // Limit breadcrumbs
    const maxBreadcrumbs = this.config.maxBreadcrumbs || 50;
    if (this.breadcrumbs.length > maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-maxBreadcrumbs);
    }

    // Add to Sentry
    if (this.config.enableSentry) {
      Sentry.addBreadcrumb({
        type: breadcrumb.type,
        category: breadcrumb.category,
        message: breadcrumb.message,
        level: this.mapLogLevelToSentryLevel(breadcrumb.level),
        data: breadcrumb.data,
      });
    }
  }

  /**
   * Map log level to Sentry severity level
   */
  private mapLogLevelToSentryLevel(level?: LogLevel): Sentry.SeverityLevel {
    switch (level) {
      case "debug":
        return "debug";
      case "info":
        return "info";
      case "warn":
        return "warning";
      case "error":
        return "error";
      case "fatal":
        return "fatal";
      default:
        return "info";
    }
  }

  /**
   * Stop performance timer
   */
  private stopTimer(label: string): void {
    const entry = this.performanceTimers.get(label);
    if (!entry) {
      this.warn(`Timer "${label}" not found`, { feature: "performance" });
      return;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;

    if (this.config.enablePerformance) {
      this.info(`⏱️ ${label}: ${entry.duration.toFixed(2)}ms`, {
        feature: "performance",
        metadata: {
          label,
          duration: entry.duration,
          startTime: entry.startTime,
          endTime: entry.endTime,
        },
      });
    }

    this.performanceTimers.delete(label);
  }

  /**
   * Get all breadcrumbs (for debugging)
   */
  getBreadcrumbs(): LogBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Singleton logger instance
 */
export const logger = new AppLogger();

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Create a scoped logger with default context
 */
export function createLogger(defaultContext: Partial<LogContext>): Logger {
  const scopedLogger = new AppLogger();
  scopedLogger.setContext(defaultContext);
  return scopedLogger;
}

/**
 * Create a feature-specific logger
 */
export function createFeatureLogger(feature: string): Logger {
  return createLogger({ feature });
}

/**
 * Create a component-specific logger
 */
export function createComponentLogger(feature: string, component: string): Logger {
  return createLogger({ feature, component });
}

// ============================================================================
// Exports
// ============================================================================

export type { Logger, LoggerConfig, LogLevel, LogContext };
export default logger;
