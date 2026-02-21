/**
 * ============================================================================
 * CENTRALIZED LOGGER
 * ============================================================================
 *
 * Enhanced logging utility with:
 * - Structured logging
 * - Log levels
 * - Remote logging support (production)
 * - Performance tracking
 * - Context preservation
 *
 * Usage:
 * ```tsx
 * import logger from '@/shared/utils/logger';
 *
 * logger.info('User logged in', { userId: 123 });
 * logger.error('API failed', { endpoint: '/api/users', statusCode: 500 });
 * logger.debug('Component mounted', { component: 'Dashboard' });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "success";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  stack?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const isDevelopment = import.meta.env.MODE === "development";
const MAX_LOGS = 100; // Keep only last 100 logs in memory

// ============================================================================
// Logger Class
// ============================================================================

class Logger {
  private logs: LogEntry[] = [];
  private remoteLoggingEnabled = false;

  constructor() {
    // Auto-enable remote logging in production
    if (!isDevelopment) {
      this.enableRemoteLogging();
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context?: any): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    // Add stack trace for errors
    if (level === "error") {
      entry.stack = new Error().stack;
    }

    // Store in memory
    this.storeLogs(entry);

    // Console output (dev only or errors in prod)
    if (isDevelopment || level === "error") {
      this.consoleOutput(entry);
    }

    // Send to remote (prod only)
    if (!isDevelopment && this.remoteLoggingEnabled && level === "error") {
      this.sendToRemote(entry);
    }
  }

  /**
   * Store logs in memory (limited to MAX_LOGS)
   */
  private storeLogs(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }
  }

  /**
   * Format and output to console
   */
  private consoleOutput(entry: LogEntry): void {
    const style = this.getStyle(entry.level);
    const prefix = this.getPrefix(entry.level);

    console.log(`%c${prefix}`, style, entry.message, entry.context || "");

    if (entry.stack && isDevelopment) {
      console.log("%cStack trace:", "color: gray; font-size: 0.9em");
      console.log(entry.stack);
    }
  }

  /**
   * Get console style for log level
   */
  private getStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: "color: gray; font-weight: normal",
      info: "color: #0066cc; font-weight: bold",
      warn: "color: #ff9800; font-weight: bold",
      error: "color: #f44336; font-weight: bold",
      success: "color: #4caf50; font-weight: bold",
    };
    return styles[level];
  }

  /**
   * Get emoji prefix for log level
   */
  private getPrefix(level: LogLevel): string {
    const prefixes: Record<LogLevel, string> = {
      debug: "🔧 [DEBUG]",
      info: "ℹ️  [INFO]",
      warn: "⚠️  [WARN]",
      error: "❌ [ERROR]",
      success: "✅ [SUCCESS]",
    };
    return prefixes[level];
  }

  /**
   * Send logs to remote service (Sentry, LogRocket, etc.)
   */
  private sendToRemote(entry: LogEntry): void {
    // TODO: Integrate with actual service
    // Example for Sentry:
    // import * as Sentry from '@sentry/react';
    // Sentry.captureMessage(entry.message, {
    //   level: entry.level as Sentry.SeverityLevel,
    //   contexts: { extra: entry.context }
    // });

    console.log("[Remote Logging]", entry);
  }

  /**
   * Enable remote logging
   */
  enableRemoteLogging(): void {
    this.remoteLoggingEnabled = true;
  }

  /**
   * Disable remote logging
   */
  disableRemoteLogging(): void {
    this.remoteLoggingEnabled = false;
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Debug level logging
   */
  debug(message: string, context?: any): void {
    this.log("debug", message, context);
  }

  /**
   * Info level logging
   */
  info(message: string, context?: any): void {
    this.log("info", message, context);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context?: any): void {
    this.log("warn", message, context);
  }

  /**
   * Error level logging
   */
  error(message: string, context?: any): void {
    this.log("error", message, context);
  }

  /**
   * Success level logging
   */
  success(message: string, context?: any): void {
    this.log("success", message, context);
  }

  /**
   * Group logs (development only)
   */
  group(label: string, callback: () => void): void {
    if (isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Table output (development only)
   */
  table(data: any): void {
    if (isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Performance timing
   */
  time(label: string): void {
    if (isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all stored logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// ============================================================================
// Singleton instance
// ============================================================================

const logger = new Logger();

// ============================================================================
// Named exports (backward compatibility)
// ============================================================================

export const log = (...args: any[]): void => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debug = (message: string, context?: any): void => {
  logger.debug(message, context);
};

export const info = (message: string, context?: any): void => {
  logger.info(message, context);
};

export const warn = (message: string, context?: any): void => {
  logger.warn(message, context);
};

export const error = (message: string, context?: any): void => {
  logger.error(message, context);
};

export const success = (message: string, context?: any): void => {
  logger.success(message, context);
};

export const group = (label: string, callback: () => void): void => {
  logger.group(label, callback);
};

export const table = (data: any): void => {
  logger.table(data);
};

export const time = (label: string): void => {
  logger.time(label);
};

export const timeEnd = (label: string): void => {
  logger.timeEnd(label);
};

// ============================================================================
// Default export
// ============================================================================

export default logger;
