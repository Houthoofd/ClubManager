/**
 * Types GraphQL pour Compte (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module compte/graphql.types
 */

/**
 * Informations complètes d'un compte utilisateur (GraphQL)
 */
export interface CompteInfo {
  id: number;
  firstName: string;
  lastName: string;
  nomUtilisateur?: string;
  email: string;
  dateOfBirth?: string;
  phone?: string;
  genreId?: number;
  genreName?: string;
  statusId: number;
  statusName?: string;
  gradeId?: number;
  gradeName?: string;
  abonnementId?: number;
  abonnementName?: string;
}

/**
 * Résultat d'une opération sur compte (GraphQL)
 */
export interface CompteOperationResult {
  success: boolean;
  message: string;
  compte?: CompteInfo;
}

/**
 * Résultat de recherche de comptes (GraphQL)
 */
export interface CompteSearchResult {
  isFind: boolean;
  message: string;
  data: CompteInfo[];
}

/**
 * Résultat de conversion nom -> ID (GraphQL)
 */
export interface ConversionResult {
  genreId?: number;
  gradeId?: number;
  statusId?: number;
  abonnementId?: number;
}

/**
 * Genre utilisateur (GraphQL)
 */
export interface CompteGenre {
  id: number;
  genreName: string;
}

/**
 * Grade utilisateur (GraphQL)
 */
export interface CompteGrade {
  id: number;
  gradeId: string;
  nomGrade?: string;
}

/**
 * Status utilisateur (GraphQL)
 */
export interface CompteStatus {
  id: number;
  nomRole: string;
}

/**
 * Plan tarifaire (abonnement) (GraphQL)
 */
export interface ComptePlanTarifaire {
  id: number;
  nomPlan: string;
  prix?: number;
}

/**
 * Input pour mettre à jour un compte (GraphQL)
 */
export interface UpdateCompteInput {
  firstName?: string;
  lastName?: string;
  nomUtilisateur?: string;
  email?: string;
  dateOfBirth?: string;
  phone?: string;
  genreId?: number;
  gradeId?: number;
  statusId?: number;
  abonnementId?: number;
  password?: string;
}

/**
 * Input pour rechercher un compte par email (GraphQL)
 */
export interface SearchCompteByEmailInput {
  email: string;
}

/**
 * Input pour conversion de noms en IDs (GraphQL)
 */
export interface ConversionInput {
  genreName?: string;
  gradeName?: string;
  statusName?: string;
  abonnementName?: string;
}

/**
 * Statistiques d'un compte (GraphQL)
 */
export interface CompteStatistiques {
  nombreCours: number;
  nombreCommandes: number;
  depensesTotal: number;
  derniereConnexion?: string;
}

/**
 * Contexte GraphQL pour Compte
 */
export interface CompteContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
