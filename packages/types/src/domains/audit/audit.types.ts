/**
 * Generated TypeScript types for audit domain
 * @generated - Do not edit manually
 */

export interface AuditLogs {
  id: number;
  user_id?: number;
  /** Action effectuée (create, update, delete, login, etc.) */
  action: string;
  /** Type d'entité concernée (user, order, session, etc.) */
  entity_type?: string;
  /** ID de l'entité concernée */
  entity_id?: number;
  description?: string;
  ip_address?: string;
  /** Navigateur/appareil */
  user_agent?: string;
  created_at?: string;
}

export interface AuditLogsInsert {
  user_id?: number;
  /** Action effectuée (create, update, delete, login, etc.) */
  action: string;
  /** Type d'entité concernée (user, order, session, etc.) */
  entity_type?: string;
  /** ID de l'entité concernée */
  entity_id?: number;
  description?: string;
  ip_address?: string;
  /** Navigateur/appareil */
  user_agent?: string;
}

export interface AuditLogsUpdate {
  user_id?: number;
  /** Action effectuée (create, update, delete, login, etc.) */
  action?: string;
  /** Type d'entité concernée (user, order, session, etc.) */
  entity_type?: string;
  /** ID de l'entité concernée */
  entity_id?: number;
  description?: string;
  ip_address?: string;
  /** Navigateur/appareil */
  user_agent?: string;
  created_at?: string;
}

