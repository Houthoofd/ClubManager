/**
 * Requêtes SQL de RECHERCHE pour le module Commandes
 * Responsabilité: Requêtes de recherche avec filtres et pagination uniquement
 */

// ============================================================================
// QUERIES DE RECHERCHE DE BASE
// ============================================================================

/**
 * Rechercher des commandes (requête de base, à compléter dynamiquement)
 */
export const SEARCH_COMMANDES_BASE = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE 1=1
`;

/**
 * Compter les résultats de recherche
 */
export const SEARCH_COMMANDES_COUNT_BASE = `
  SELECT COUNT(*) as total
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE 1=1
`;

// ============================================================================
// CONSTRUCTION DYNAMIQUE DES REQUÊTES
// ============================================================================

/**
 * Construction dynamique de la clause WHERE pour la recherche
 * @param hasStatut - Filtre par statut
 * @param hasUserId - Filtre par utilisateur
 * @param hasDateDebut - Filtre par date de début
 * @param hasDateFin - Filtre par date de fin
 * @param hasSearch - Recherche textuelle (ID, nom, email)
 * @param hasMontantMin - Filtre par montant minimum
 * @param hasMontantMax - Filtre par montant maximum
 * @returns Clause WHERE SQL
 */
export const buildSearchWhereClause = (
  hasStatut: boolean,
  hasUserId: boolean,
  hasDateDebut: boolean,
  hasDateFin: boolean,
  hasSearch: boolean,
  hasMontantMin: boolean,
  hasMontantMax: boolean
): string => {
  const clauses: string[] = [];

  if (hasStatut) {
    clauses.push('c.statut = ?');
  }

  if (hasUserId) {
    clauses.push('c.utilisateur_id = ?');
  }

  if (hasDateDebut) {
    clauses.push('DATE(c.date_commande) >= ?');
  }

  if (hasDateFin) {
    clauses.push('DATE(c.date_commande) <= ?');
  }

  if (hasSearch) {
    clauses.push('(c.commande_id LIKE ? OR u.nom_utilisateur LIKE ? OR u.email LIKE ?)');
  }

  if (hasMontantMin) {
    clauses.push('c.total >= ?');
  }

  if (hasMontantMax) {
    clauses.push('c.total <= ?');
  }

  return clauses.length > 0 ? ' AND ' + clauses.join(' AND ') : '';
};

/**
 * Construire la clause ORDER BY
 * @param sortBy - Champ de tri
 * @param sortOrder - Ordre de tri (ASC ou DESC)
 * @returns Clause ORDER BY SQL
 */
export const buildSearchOrderByClause = (
  sortBy: 'date_commande' | 'total' | 'statut' | 'utilisateur_id' = 'date_commande',
  sortOrder: 'ASC' | 'DESC' = 'DESC'
): string => {
  const validSortFields = ['date_commande', 'total', 'statut', 'utilisateur_id'];
  const field = validSortFields.includes(sortBy) ? sortBy : 'date_commande';
  const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  return ` ORDER BY c.${field} ${order}`;
};

/**
 * Construire la clause LIMIT et OFFSET
 * @param limit - Nombre maximum de résultats
 * @param offset - Décalage
 * @returns Clause LIMIT/OFFSET SQL
 */
export const buildSearchPaginationClause = (
  limit?: number,
  offset?: number
): string => {
  let clause = '';

  if (limit !== undefined && limit > 0) {
    clause += ` LIMIT ${limit}`;
  }

  if (offset !== undefined && offset > 0) {
    clause += ` OFFSET ${offset}`;
  }

  return clause;
};

// ============================================================================
// QUERIES DE RECHERCHE SPÉCIFIQUES
// ============================================================================

/**
 * Rechercher des commandes par ID partiel (autocomplete)
 */
export const SEARCH_COMMANDES_BY_ID_PATTERN = `
  SELECT
    c.commande_id,
    c.statut,
    c.total,
    c.date_commande,
    u.nom_utilisateur
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.commande_id LIKE ?
  ORDER BY c.date_commande DESC
  LIMIT ?
`;

/**
 * Rechercher des commandes par email utilisateur
 */
export const SEARCH_COMMANDES_BY_EMAIL = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE u.email LIKE ?
  ORDER BY c.date_commande DESC
  LIMIT ?
`;

/**
 * Rechercher des commandes par nom d'utilisateur
 */
export const SEARCH_COMMANDES_BY_USERNAME = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE u.nom_utilisateur LIKE ?
  ORDER BY c.date_commande DESC
  LIMIT ?
`;

/**
 * Rechercher des commandes par plage de montants
 */
export const SEARCH_COMMANDES_BY_MONTANT_RANGE = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.total BETWEEN ? AND ?
  ORDER BY c.total DESC
  LIMIT ?
`;

/**
 * Rechercher des commandes par article (recherche dans JSON)
 */
export const SEARCH_COMMANDES_BY_ARTICLE = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE JSON_SEARCH(c.articles, 'one', ?, NULL, '$[*].article_id') IS NOT NULL
  ORDER BY c.date_commande DESC
  LIMIT ?
`;

/**
 * Rechercher des commandes par nom de produit (recherche dans JSON)
 */
export const SEARCH_COMMANDES_BY_PRODUCT_NAME = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE JSON_SEARCH(c.articles, 'one', ?, NULL, '$[*].nom') IS NOT NULL
  ORDER BY c.date_commande DESC
  LIMIT ?
`;

/**
 * Recherche avancée avec plusieurs filtres (requête complète)
 */
export interface SearchCommandesParams {
  statut?: string;
  utilisateurId?: number;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
  search?: string;
  articleId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date_commande' | 'total' | 'statut' | 'utilisateur_id';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Construire une requête de recherche complète
 * @param params - Paramètres de recherche
 * @returns Objet contenant la requête SQL et les paramètres
 */
export const buildSearchQuery = (params: SearchCommandesParams): { query: string; params: any[] } => {
  let query = SEARCH_COMMANDES_BASE;
  const queryParams: any[] = [];

  // Filtres
  if (params.statut) {
    query += ' AND c.statut = ?';
    queryParams.push(params.statut);
  }

  if (params.utilisateurId) {
    query += ' AND c.utilisateur_id = ?';
    queryParams.push(params.utilisateurId);
  }

  if (params.dateDebut) {
    query += ' AND DATE(c.date_commande) >= ?';
    queryParams.push(params.dateDebut);
  }

  if (params.dateFin) {
    query += ' AND DATE(c.date_commande) <= ?';
    queryParams.push(params.dateFin);
  }

  if (params.montantMin !== undefined) {
    query += ' AND c.total >= ?';
    queryParams.push(params.montantMin);
  }

  if (params.montantMax !== undefined) {
    query += ' AND c.total <= ?';
    queryParams.push(params.montantMax);
  }

  if (params.search) {
    query += ' AND (c.commande_id LIKE ? OR u.nom_utilisateur LIKE ? OR u.email LIKE ?)';
    const searchPattern = `%${params.search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }

  if (params.articleId) {
    query += ' AND JSON_SEARCH(c.articles, \'one\', ?, NULL, \'$[*].article_id\') IS NOT NULL';
    queryParams.push(params.articleId);
  }

  // Tri
  query += buildSearchOrderByClause(params.sortBy, params.sortOrder);

  // Pagination
  if (params.limit !== undefined) {
    query += ' LIMIT ?';
    queryParams.push(params.limit);
  }

  if (params.offset !== undefined) {
    query += ' OFFSET ?';
    queryParams.push(params.offset);
  }

  return { query, params: queryParams };
};

/**
 * Construire une requête de comptage pour la recherche
 * @param params - Paramètres de recherche
 * @returns Objet contenant la requête SQL de comptage et les paramètres
 */
export const buildSearchCountQuery = (params: SearchCommandesParams): { query: string; params: any[] } => {
  let query = SEARCH_COMMANDES_COUNT_BASE;
  const queryParams: any[] = [];

  // Mêmes filtres que pour la recherche (sans tri ni pagination)
  if (params.statut) {
    query += ' AND c.statut = ?';
    queryParams.push(params.statut);
  }

  if (params.utilisateurId) {
    query += ' AND c.utilisateur_id = ?';
    queryParams.push(params.utilisateurId);
  }

  if (params.dateDebut) {
    query += ' AND DATE(c.date_commande) >= ?';
    queryParams.push(params.dateDebut);
  }

  if (params.dateFin) {
    query += ' AND DATE(c.date_commande) <= ?';
    queryParams.push(params.dateFin);
  }

  if (params.montantMin !== undefined) {
    query += ' AND c.total >= ?';
    queryParams.push(params.montantMin);
  }

  if (params.montantMax !== undefined) {
    query += ' AND c.total <= ?';
    queryParams.push(params.montantMax);
  }

  if (params.search) {
    query += ' AND (c.commande_id LIKE ? OR u.nom_utilisateur LIKE ? OR u.email LIKE ?)';
    const searchPattern = `%${params.search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }

  if (params.articleId) {
    query += ' AND JSON_SEARCH(c.articles, \'one\', ?, NULL, \'$[*].article_id\') IS NOT NULL';
    queryParams.push(params.articleId);
  }

  return { query, params: queryParams };
};
