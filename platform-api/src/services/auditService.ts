import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuditLogData {
  tenantId: string;
  userId?: number;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  changes?: any;
  ipAddress: string;
  userAgent?: string;
}

export enum AuditAction {
  // Authentification
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  LOGIN_FAILED = "LOGIN_FAILED",
  PASSWORD_RESET = "PASSWORD_RESET",

  // CRUD Operations
  CREATE = "CREATE",
  READ = "READ",
  UPDATE = "UPDATE",
  DELETE = "DELETE",

  // Données sensibles
  EXPORT = "EXPORT",
  BULK_DELETE = "BULK_DELETE",

  // Configuration
  CONFIG_CHANGE = "CONFIG_CHANGE",
  PLAN_CHANGE = "PLAN_CHANGE",

  // Permissions
  PERMISSION_GRANT = "PERMISSION_GRANT",
  PERMISSION_REVOKE = "PERMISSION_REVOKE",
}

class AuditService {
  /**
   * Créer un log d'audit
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          changes: data.changes ? JSON.stringify(data.changes) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Ne pas throw pour ne pas bloquer la requête principale
    }
  }

  /**
   * Log une authentification
   */
  async logAuth(
    tenantId: string,
    userId: number | undefined,
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.LOGIN_FAILED,
    ipAddress: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      tenantId,
      userId,
      action,
      resource: "auth",
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log une opération CRUD
   */
  async logCrud(
    tenantId: string,
    userId: number,
    action:
      | AuditAction.CREATE
      | AuditAction.READ
      | AuditAction.UPDATE
      | AuditAction.DELETE,
    resource: string,
    resourceId: string,
    changes?: { before?: any; after?: any },
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      changes,
      ipAddress: ipAddress || "unknown",
      userAgent,
    });
  }

  /**
   * Log un export de données (RGPD)
   */
  async logExport(
    tenantId: string,
    userId: number,
    resource: string,
    ipAddress: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      tenantId,
      userId,
      action: AuditAction.EXPORT,
      resource,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Récupérer les logs d'audit pour un tenant
   */
  async getLogsForTenant(
    tenantId: string,
    options?: {
      userId?: number;
      action?: AuditAction;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { tenantId };

    if (options?.userId) where.userId = options.userId;
    if (options?.action) where.action = options.action;
    if (options?.resource) where.resource = options.resource;
    if (options?.startDate || options?.endDate) {
      where.timestamp = {};
      if (options.startDate) where.timestamp.gte = options.startDate;
      if (options.endDate) where.timestamp.lte = options.endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        take: options?.limit || 100,
        skip: options?.offset || 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  /**
   * Récupérer les logs d'audit pour un utilisateur
   */
  async getLogsForUser(userId: number, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Nettoyer les vieux logs (conservation 90 jours par défaut)
   */
  async cleanOldLogs(retentionDays = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }
}

// Export singleton instance
export const auditService = new AuditService();
export default auditService;
