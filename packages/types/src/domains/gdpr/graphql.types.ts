/**
 * Types TypeScript correspondant aux schémas GraphQL
 * Utilisés par les resolvers
 *
 * Note: Si possible, utiliser GraphQL Code Generator pour générer automatiquement
 */

/**
 * Contexte GraphQL pour Gdpr
 */
export interface GdprContext {
  prisma?: any;
  userId?: number;
  userRole?: string;
  req?: any;
  res?: any;
}

/**
 * Args pour getGdpr query
 */
export interface GetGdprArgs {
  id: number;
}

/**
 * Args pour getGdprList query
 */
export interface GetGdprListArgs {
  filter?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Args pour searchGdpr query
 */
export interface SearchGdprArgs {
  search: string;
}

/**
 * Args pour createGdpr mutation
 */
export interface CreateGdprArgs {
  input: {
    name: string;
    status?: string;
  };
}

/**
 * Args pour updateGdpr mutation
 */
export interface UpdateGdprArgs {
  id: number;
  input: {
    name?: string;
    status?: string;
  };
}

/**
 * Args pour deleteGdpr mutation
 */
export interface DeleteGdprArgs {
  id: number;
}

/**
 * Parent type pour resolvers Gdpr
 */
export interface GdprParent {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
