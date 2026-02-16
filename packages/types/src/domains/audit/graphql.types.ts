/**
 * Types TypeScript correspondant aux schémas GraphQL
 * Utilisés par les resolvers
 *
 * Note: Si possible, utiliser GraphQL Code Generator pour générer automatiquement
 */

/**
 * Contexte GraphQL pour Audit
 */
export interface AuditContext {
  prisma?: any;
  userId?: number;
  userRole?: string;
  req?: any;
  res?: any;
}

/**
 * Args pour getAudit query
 */
export interface GetAuditArgs {
  id: number;
}

/**
 * Args pour getAuditList query
 */
export interface GetAuditListArgs {
  filter?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Args pour searchAudit query
 */
export interface SearchAuditArgs {
  search: string;
}

/**
 * Args pour createAudit mutation
 */
export interface CreateAuditArgs {
  input: {
    name: string;
    status?: string;
  };
}

/**
 * Args pour updateAudit mutation
 */
export interface UpdateAuditArgs {
  id: number;
  input: {
    name?: string;
    status?: string;
  };
}

/**
 * Args pour deleteAudit mutation
 */
export interface DeleteAuditArgs {
  id: number;
}

/**
 * Parent type pour resolvers Audit
 */
export interface AuditParent {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
