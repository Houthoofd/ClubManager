/**
 * Audit Log Service
 *
 * Provides centralized audit logging for security events and GDPR compliance.
 * Tracks all critical operations, user actions, and data access.
 */

import { PrismaClient } from "@prisma/client";

export enum AuditEventType {
  // Authentication
  AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILED = "AUTH_LOGIN_FAILED",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  AUTH_PASSWORD_CHANGE = "AUTH_PASSWORD_CHANGE",
  AUTH_PASSWORD_RESET_REQUEST = "AUTH_PASSWORD_RESET_REQUEST",
  AUTH_PASSWORD_RESET_COMPLETE = "AUTH_PASSWORD_RESET_COMPLETE",
  AUTH_EMAIL_VERIFICATION = "AUTH_EMAIL_VERIFICATION",
  AUTH_ACCOUNT_LOCKED = "AUTH_ACCOUNT_LOCKED",
  AUTH_ACCOUNT_UNLOCKED = "AUTH_ACCOUNT_UNLOCKED",

  // User Management
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",
  USER_ROLE_CHANGED = "USER_ROLE_CHANGED",
  USER_PERMISSIONS_CHANGED = "USER_PERMISSIONS_CHANGED",

  // Data Access (GDPR)
  DATA_ACCESSED = "DATA_ACCESSED",
  DATA_EXPORTED = "DATA_EXPORTED",
  DATA_DELETED = "DATA_DELETED",
  GDPR_DATA_REQUEST = "GDPR_DATA_REQUEST",
  GDPR_DATA_DELETION = "GDPR_DATA_DELETION",

  // Security Events
  SECURITY_RATE_LIMIT_EXCEEDED = "SECURITY_RATE_LIMIT_EXCEEDED",
  SECURITY_UNAUTHORIZED_ACCESS = "SECURITY_UNAUTHORIZED_ACCESS",
  SECURITY_SUSPICIOUS_ACTIVITY = "SECURITY_SUSPICIOUS_ACTIVITY",
  SECURITY_SESSION_HIJACK_ATTEMPT = "SECURITY_SESSION_HIJACK_ATTEMPT",

  // Admin Actions
  ADMIN_USER_IMPERSONATION = "ADMIN_USER_IMPERSONATION",
  ADMIN_CONFIG_CHANGE = "ADMIN_CONFIG_CHANGE",
  ADMIN_SYSTEM_OPERATION = "ADMIN_SYSTEM_OPERATION",
}

export enum AuditSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface AuditLogEntry {
  eventType: AuditEventType;
  severity: AuditSeverity;
  userId?: number;
  actorId?: number; // For admin impersonation
  ipAddress?: string;
  userAgent?: string;
  resource?: string; // Resource being accessed (e.g., 'user:123', 'course:456')
  action?: string;
  metadata?: Record<string, any>;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface AuditQueryOptions {
  userId?: number;
  eventType?: AuditEventType;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  page?: number;
}

export class AuditLogService {
  private prisma: PrismaClient;
  private retentionDays: number;

  constructor(prisma: PrismaClient, retentionDays: number = 730) {
    // 2 years default (GDPR)
    this.prisma = prisma;
    this.retentionDays = retentionDays;
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          eventType: entry.eventType,
          severity: entry.severity,
          userId: entry.userId,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          resource: entry.resource,
          action: entry.action,
          success: entry.success,
          errorCode: entry.errorCode,
          message: entry.errorMessage,
          metadata: entry.metadata as any,
          timestamp: new Date(),
        },
      });

      // Log critical events to console for immediate visibility
      if (
        entry.severity === AuditSeverity.CRITICAL ||
        entry.severity === AuditSeverity.ERROR
      ) {
        console.error("[AUDIT]", {
          eventType: entry.eventType,
          severity: entry.severity,
          userId: entry.userId,
          success: entry.success,
          errorMessage: entry.errorMessage,
        });
      }
    } catch (error) {
      // Never let audit logging crash the app
      console.error("[AUDIT ERROR] Failed to log audit event:", error);
    }
  }

  /**
   * Query audit logs with filters
   */
  async query(options: AuditQueryOptions) {
    const where: any = {};

    if (options.userId) where.userId = options.userId;
    if (options.eventType) where.eventType = options.eventType;
    if (options.severity) where.severity = options.severity;
    if (options.startDate || options.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const page = options.page || 1;
    const limit = options.limit || 100;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
    };
  }

  /**
   * Get audit logs for a specific user (GDPR data export)
   */
  async getUserAuditLogs(userId: number) {
    return this.query({
      userId,
      limit: 10000, // Get all logs for GDPR export
    });
  }

  /**
   * Get security events (failed logins, rate limits, unauthorized access)
   */
  async getSecurityEvents(startDate?: Date, endDate?: Date) {
    const securityEventTypes = [
      AuditEventType.AUTH_LOGIN_FAILED,
      AuditEventType.AUTH_ACCOUNT_LOCKED,
      AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
      AuditEventType.SECURITY_UNAUTHORIZED_ACCESS,
      AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
      AuditEventType.SECURITY_SESSION_HIJACK_ATTEMPT,
    ];

    const where: any = {
      eventType: { in: securityEventTypes },
    };

    if (startDate && endDate) {
      where.timestamp = { gte: startDate, lte: endDate };
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });
  }

  /**
   * Get failed login attempts for a user
   */
  async getFailedLoginAttempts(userId: number, withinMinutes: number = 15) {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);

    return this.prisma.auditLog.count({
      where: {
        userId,
        eventType: AuditEventType.AUTH_LOGIN_FAILED,
        timestamp: { gte: since },
      },
    });
  }

  /**
   * Get failed login attempts by IP
   */
  async getFailedLoginAttemptsByIP(
    ipAddress: string,
    withinMinutes: number = 15,
  ) {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);

    return this.prisma.auditLog.count({
      where: {
        ipAddress,
        eventType: AuditEventType.AUTH_LOGIN_FAILED,
        timestamp: { gte: since },
      },
    });
  }

  /**
   * Cleanup old audit logs (retention policy)
   */
  async cleanup(): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - this.retentionDays * 24 * 60 * 60 * 1000,
    );

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
      },
    });

    console.log(
      `[AUDIT] Cleaned up ${result.count} old audit logs older than ${this.retentionDays} days`,
    );

    return result.count;
  }

  /**
   * Get audit statistics for dashboard
   */
  async getStatistics(startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
      },
      select: {
        eventType: true,
        severity: true,
        success: true,
      },
    });

    const stats = {
      total: logs.length,
      byEventType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      successRate: 0,
    };

    let successCount = 0;

    logs.forEach((log) => {
      // Count by event type
      stats.byEventType[log.eventType] =
        (stats.byEventType[log.eventType] || 0) + 1;

      // Count by severity
      stats.bySeverity[log.severity] =
        (stats.bySeverity[log.severity] || 0) + 1;

      // Count success/failure
      if (log.success) {
        successCount++;
      }
    });

    if (logs.length > 0) {
      stats.successRate = (successCount / logs.length) * 100;
    }

    return stats;
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(userId: number) {
    const logs = await this.getUserAuditLogs(userId);

    return {
      userId,
      exportDate: new Date().toISOString(),
      totalRecords: logs.total,
      auditLogs: logs.logs,
    };
  }

  /**
   * Delete all logs for a user (for GDPR compliance)
   * Optionally retain security-related events for legal compliance
   */
  async deleteUserLogs(
    userId: number,
    retainSecurityEvents: boolean = true,
  ): Promise<number> {
    if (retainSecurityEvents) {
      // Keep security events for legal compliance
      const result = await this.prisma.auditLog.deleteMany({
        where: {
          userId,
          eventType: {
            notIn: [
              AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED,
              AuditEventType.SECURITY_UNAUTHORIZED_ACCESS,
              AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
            ],
          },
        },
      });
      console.log("[AUDIT] Deleted user logs except security events:", userId);
      return result.count;
    } else {
      // Delete all logs
      const result = await this.prisma.auditLog.deleteMany({
        where: { userId },
      });
      console.log("[AUDIT] Deleted all user logs:", userId);
      return result.count;
    }
  }
}

// Singleton instance
let auditLogService: AuditLogService | null = null;

export function createAuditLogService(
  prisma: PrismaClient,
  retentionDays?: number,
): AuditLogService {
  if (!auditLogService) {
    auditLogService = new AuditLogService(prisma, retentionDays);
  }
  return auditLogService;
}

export function getAuditLogService(): AuditLogService {
  if (!auditLogService) {
    throw new Error(
      "AuditLogService not initialized. Call createAuditLogService first.",
    );
  }
  return auditLogService;
}
