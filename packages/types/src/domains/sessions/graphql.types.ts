/**
 * Types TypeScript correspondant aux schémas GraphQL
 * Utilisés par les resolvers
 *
 * Note: Si possible, utiliser GraphQL Code Generator pour générer automatiquement
 */

/**
 * Contexte GraphQL pour Sessions
 */
export interface SessionsContext {
  prisma?: any;
  userId?: number;
  userRole?: string;
  req?: any;
  res?: any;
}

/**
 * Args pour getSessions query
 */
export interface GetSessionsArgs {
  id: number;
}

/**
 * Args pour getSessionsList query
 */
export interface GetSessionsListArgs {
  filter?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Args pour searchSessions query
 */
export interface SearchSessionsArgs {
  search: string;
}

/**
 * Args pour createSessions mutation
 */
export interface CreateSessionsArgs {
  input: {
    name: string;
    status?: string;
  };
}

/**
 * Args pour updateSessions mutation
 */
export interface UpdateSessionsArgs {
  id: number;
  input: {
    name?: string;
    status?: string;
  };
}

/**
 * Args pour deleteSessions mutation
 */
export interface DeleteSessionsArgs {
  id: number;
}

/**
 * Parent type pour resolvers Sessions
 */
export interface SessionsParent {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
