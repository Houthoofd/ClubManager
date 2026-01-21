export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  INVENTORY_ADD = 'inventory_add',
  INVENTORY_REMOVE = 'inventory_remove',
  INVENTORY_SET = 'inventory_set',
  MESSAGE_CREATE = 'message_create',
  MESSAGE_UPDATE = 'message_update',
  MESSAGE_DELETE = 'message_delete',
  MESSAGE_READ = 'message_read',
  MESSAGE_BULK_SEND = 'message_bulk_send',
  MESSAGE_BULK_READ = 'message_bulk_read',
  MESSAGE_ALL_READ = 'message_all_read',
  MESSAGE_STATUS_UPDATE = 'message_status_update'
}

export interface AuditLog {
  action: AuditAction;
  entityType: string;
  entityId: string | number;
  userId: number;
  details?: Record<string, any>;
  timestamp: Date;
}

class AuditService {
  async log(entry: Omit<AuditLog, 'timestamp'>): Promise<void> {
    try {
      console.log('Audit log:', {
        ...entry,
        timestamp: new Date()
      });
      // TODO: Store in database
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }

  async logCreate(entityType: string, entityId: string | number, userId: number, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: AuditAction.CREATE,
      entityType,
      entityId,
      userId,
      details
    });
  }

  async logUpdate(entityType: string, entityId: string | number, userId: number, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: AuditAction.UPDATE,
      entityType,
      entityId,
      userId,
      details
    });
  }

  async logDelete(entityType: string, entityId: string | number, userId: number, details?: Record<string, any>): Promise<void> {
    await this.log({
      action: AuditAction.DELETE,
      entityType,
      entityId,
      userId,
      details
    });
  }
}

export const auditService = new AuditService();