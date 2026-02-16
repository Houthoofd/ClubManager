/**
 * Types pour la base de données (snake_case Prisma)
 * Correspond aux tables et colonnes de la DB
 */

/**
 * Audit dans la base de données (snake_case)
 */
export interface AuditDB {
  id: number;
  name: string;
  status: string;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
}

/**
 * Audit avec relations
 */
export interface AuditWithRelationsDB extends AuditDB {
  user?: {
    id: number;
    email: string;
  };
}

/**
 * Type pour création dans la DB
 */
export interface CreateAuditDB {
  name: string;
  status: string;
  user_id?: number;
}

/**
 * Type pour mise à jour dans la DB
 */
export interface UpdateAuditDB {
  name?: string;
  status?: string;
  updated_at?: Date;
}
