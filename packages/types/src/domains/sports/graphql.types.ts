/**
 * Types TypeScript correspondant aux schémas GraphQL
 * Utilisés par les resolvers
 *
 * Note: Si possible, utiliser GraphQL Code Generator pour générer automatiquement
 */

/**
 * Contexte GraphQL pour Sports
 */
export interface SportsContext {
  prisma?: any;
  userId?: number;
  userRole?: string;
  req?: any;
  res?: any;
}

/**
 * Args pour getSports query
 */
export interface GetSportsArgs {
  id: number;
}

/**
 * Args pour getSportsList query
 */
export interface GetSportsListArgs {
  filter?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  };
}

/**
 * Args pour searchSports query
 */
export interface SearchSportsArgs {
  search: string;
}

/**
 * Args pour createSports mutation
 */
export interface CreateSportsArgs {
  input: {
    name: string;
    status?: string;
  };
}

/**
 * Args pour updateSports mutation
 */
export interface UpdateSportsArgs {
  id: number;
  input: {
    name?: string;
    status?: string;
  };
}

/**
 * Args pour deleteSports mutation
 */
export interface DeleteSportsArgs {
  id: number;
}

/**
 * Parent type pour resolvers Sports
 */
export interface SportsParent {
  id: number;
  name: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}
