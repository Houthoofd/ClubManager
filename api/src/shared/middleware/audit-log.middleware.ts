/**
 * Audit Log Middleware
 *
 * Automatic logging middleware for GraphQL operations.
 * Logs all critical operations, security events, and user actions.
 */

import { GraphQLResolveInfo } from "graphql";
import {
  AuditLogService,
  AuditEventType,
  AuditSeverity,
} from "../services/audit-log.service";

export interface AuditContext {
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  operationName?: string;
}

export interface AuditLogOptions {
  eventType: AuditEventType;
  severity?: AuditSeverity;
  resource?: string;
  skipOnError?: boolean;
}

/**
 * Middleware factory for audit logging
 * Wraps a resolver with automatic audit logging
 */
export function withAuditLog<TArgs = any, TContext = any, TResult = any>(
  options: AuditLogOptions,
) {
  return (
    resolver: (
      parent: any,
      args: TArgs,
      context: TContext,
      info: GraphQLResolveInfo,
    ) => Promise<TResult>,
  ) => {
    return async (
      parent: any,
      args: TArgs,
      context: any,
      info: GraphQLResolveInfo,
    ): Promise<TResult> => {
      const startTime = Date.now();
      let result: TResult;
      let success = true;
      let errorMessage: string | undefined;

      try {
        result = await resolver(parent, args, context, info);
        return result;
      } catch (error: any) {
        success = false;
        errorMessage = error.message || "Unknown error";
        throw error;
      } finally {
        // Log the audit event
        if (context.auditLogService) {
          try {
            const auditService = context.auditLogService as AuditLogService;
            if (auditService) {
              await auditService.log({
                eventType: options.eventType,
                severity: success
                  ? options.severity || AuditSeverity.INFO
                  : AuditSeverity.ERROR,
                userId: context.user?.id,
                ipAddress: context.req?.ip || context.ip,
                userAgent:
                  context.req?.headers?.["user-agent"] || context.userAgent,
                resource: options.resource,
                action: info.fieldName,
                metadata: {
                  ...options.metadata,
                  args: sanitizeVariables(args),
                  duration: Date.now() - startTime,
                  success,
                  errorMessage,
                },
              });
            }
          } catch (auditError) {
            // Never let audit logging crash the app
            console.error("[AUDIT MIDDLEWARE] Failed to log:", auditError);
          }
        }
      }
    };
  };
}

/**
 * Sanitize variables to remove sensitive data
 */
function sanitizeVariables(variables: any): any {
  if (!variables) return {};

  const sanitized = { ...variables };
  const sensitiveFields = [
    "password",
    "token",
    "secret",
    "apiKey",
    "creditCard",
  ];

  for (const key of Object.keys(sanitized)) {
    if (
      sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase()),
      )
    ) {
      sanitized[key] = "[REDACTED]";
    }
  }

  return sanitized;
}

/**
 * Helper middleware for auth operations
 */
export function withAuthAudit<TArgs = any, TContext = any, TResult = any>(
  eventType: AuditEventType,
) {
  return withAuditLog({
    eventType,
    severity: AuditSeverity.INFO,
    resource: "auth",
  });
}

/**
 * Middleware for login attempts
 */
export function withLoginAudit<TArgs = any, TContext = any, TResult = any>(
  resolver: (
    parent: any,
    args: TArgs,
    context: TContext,
    info: GraphQLResolveInfo,
  ) => Promise<TResult>,
) {
  return async (
    parent: any,
    args: TArgs,
    context: any,
    info: GraphQLResolveInfo,
  ): Promise<TResult> => {
    let success = false;
    let userId: string | undefined;
    let errorMessage: string | undefined;

    try {
      const result = await resolver(parent, args, context, info);
      success = true;
      userId = (result as any)?.user?.id;
      return result;
    } catch (error: any) {
      success = false;
      errorMessage = error.message;
      throw error;
    } finally {
      try {
        const auditService = context.auditLogService as AuditLogService;
        if (auditService) {
          await auditService.log({
            eventType: success
              ? AuditEventType.AUTH_LOGIN_SUCCESS
              : AuditEventType.AUTH_LOGIN_FAILED,
            severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
            userId,
            ipAddress: context.req?.ip || context.ip,
            userAgent:
              context.req?.headers?.["user-agent"] || context.userAgent,
            resource: "auth",
            action: "login",
            metadata: {
              email: (args as any)?.email,
            },
            success,
            errorMessage,
          });
        }
      } catch (auditError) {
        console.error("[AUDIT MIDDLEWARE] Failed to log login:", auditError);
      }
    }
  };
}

/**
 * Middleware for data access (GDPR compliance)
 */
export function withDataAccessAudit<TArgs = any, TContext = any, TResult = any>(
  resourceType: string,
) {
  return withAuditLog({
    eventType: AuditEventType.DATA_ACCESSED,
    severity: AuditSeverity.INFO,
    resource: resourceType,
  });
}

/**
 * Middleware for data modification (GDPR compliance)
 */
export function withDataModificationAudit<
  TArgs = any,
  TContext = any,
  TResult = any,
>(resourceType: string, action: "create" | "update" | "delete") {
  const eventTypeMap = {
    create: AuditEventType.USER_CREATED,
    update: AuditEventType.DATA_MODIFIED,
    delete: AuditEventType.DATA_DELETED,
  };

  return withAuditLog({
    eventType: eventTypeMap[action],
    severity: action === "delete" ? AuditSeverity.WARNING : AuditSeverity.INFO,
    resource: resourceType,
  });
}

/**
 * Middleware for admin operations
 */
export function withAdminAudit<TArgs = any, TContext = any, TResult = any>(
  action: string,
) {
  return withAuditLog({
    eventType: AuditEventType.ADMIN_SYSTEM_OPERATION,
    severity: AuditSeverity.WARNING,
    resource: "admin",
  });
}

/**
 * Middleware for security events
 */
export function withSecurityAudit<TArgs = any, TContext = any, TResult = any>(
  eventType: AuditEventType,
) {
  return withAuditLog({
    eventType,
    severity: AuditSeverity.CRITICAL,
    resource: "security",
  });
}

/**
 * Helper to log audit event directly (without middleware)
 */
export async function logAuditEvent(
  context: any,
  options: {
    eventType: AuditEventType;
    severity?: AuditSeverity;
    resource?: string;
    action?: string;
    metadata?: Record<string, any>;
    success: boolean;
    errorMessage?: string;
  },
): Promise<void> {
  try {
    const auditService = context.auditLogService as AuditLogService;
    if (auditService) {
      await auditService.log({
        eventType: options.eventType,
        severity: options.severity || AuditSeverity.INFO,
        userId: context.user?.id,
        ipAddress: context.req?.ip || context.ip,
        userAgent: context.req?.headers?.["user-agent"] || context.userAgent,
        resource: options.resource,
        action: options.action,
        metadata: options.metadata,
        success: options.success,
        errorMessage: options.errorMessage,
      });
    }
  } catch (error) {
    console.error("[AUDIT] Failed to log event:", error);
  }
}
