/**
 * Requêtes SQL de RECHERCHE pour le module Compte
 * Responsabilité: Requêtes de recherche avec filtres uniquement
 */

// ============================================================================
// QUERIES DE RECHERCHE DE BASE
// ============================================================================

/**
 * Rechercher des utilisateurs (requête de base, à compléter dynamiquement)
 */
export const SEARCH_USERS_BASE = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.nom_utilisateur,
    u.email,
    g.genre_name AS genres,
    s.nom_role AS status,
    gr.grade_id AS grades,
    a.nom_plan AS abonnement,
    u.date_of_birth,
    u.phone
  FROM utilisateurs u
  LEFT JOIN genres g ON u.genre_id = g.id
  LEFT JOIN status s ON u.status_id = s.id
  LEFT JOIN grades gr ON u.grade_id = gr.id
  LEFT JOIN plans_tarifaires a ON u.abonnement_id = a.id
  WHERE 1=1
`;

/**
 * Compter les résultats de recherche
 */
export const SEARCH_USERS_COUNT_BASE = `
  SELECT COUNT(*) as total
  FROM utilisateurs u
  WHERE 1=1
`;

// ============================================================================
// CONSTRUCTION DYNAMIQUE DES REQUÊTES
// ============================================================================

/**
 * Construire la clause WHERE pour la recherche
 */
export function buildSearchWhereClause(
  hasName: boolean,
  hasEmail: boolean,
  hasStatus: boolean,
  hasGenre: boolean,
  hasGrade: boolean,
  hasAbonnement: boolean
): string {
  const clauses: string[] = [];

  if (hasName) {
    clauses.push('(u.first_name LIKE ? OR u.last_name LIKE ? OR u.nom_utilisateur LIKE ?)');
  }

  if (hasEmail) {
    clauses.push('u.email LIKE ?');
  }

  if (hasStatus) {
    clauses.push('u.status_id = ?');
  }

  if (hasGenre) {
    clauses.push('u.genre_id = ?');
  }

  if (hasGrade) {
    clauses.push('u.grade_id = ?');
  }

  if (hasAbonnement) {
    clauses.push('u.abonnement_id = ?');
  }

  return clauses.length > 0 ? ' AND ' + clauses.join(' AND ') : '';
}

/**
 * Construire la clause ORDER BY
 */
export function buildSearchOrderByClause(
  sortBy: 'first_name' | 'last_name' | 'email' | 'date_of_birth' = 'last_name',
  sortOrder: 'ASC' | 'DESC' = 'ASC'
): string {
  const validSortFields = ['first_name', 'last_name', 'email', 'date_of_birth'];
  const field = validSortFields.includes(sortBy) ? sortBy : 'last_name';
  const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  return ` ORDER BY u.${field} ${order}`;
}

// ============================================================================
// QUERIES DE RECHERCHE SPÉCIFIQUES
// ============================================================================

/**
 * Rechercher des utilisateurs par nom partiel (autocomplete)
 */
export const SEARCH_USERS_BY_NAME_PATTERN = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.nom_utilisateur,
    u.email
  FROM utilisateurs u
  WHERE (u.first_name LIKE ? OR u.last_name LIKE ? OR u.nom_utilisateur LIKE ?)
    AND u.status_id = 1
  ORDER BY u.last_name, u.first_name
  LIMIT ?
`;

/**
 * Rechercher des utilisateurs par email partiel
 */
export const SEARCH_USERS_BY_EMAIL_PATTERN = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.nom_utilisateur,
    u.email
  FROM utilisateurs u
  WHERE u.email LIKE ?
    AND u.status_id = 1
  ORDER BY u.email
  LIMIT ?
`;

/**
 * Rechercher des utilisateurs par téléphone
 */
export const SEARCH_USERS_BY_PHONE = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone
  FROM utilisateurs u
  WHERE u.phone LIKE ?
    AND u.status_id = 1
  ORDER BY u.last_name, u.first_name
  LIMIT ?
`;

/**
 * Rechercher des utilisateurs par plage d'âge
 */
export const SEARCH_USERS_BY_AGE_RANGE = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.date_of_birth,
    TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) as age
  FROM utilisateurs u
  WHERE u.date_of_birth IS NOT NULL
    AND TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) BETWEEN ? AND ?
    AND u.status_id = 1
  ORDER BY age, u.last_name
  LIMIT ?
`;

/**
 * Rechercher des utilisateurs créés récemment
 */
export const SEARCH_RECENT_USERS = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.created_at
  FROM utilisateurs u
  WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    AND u.status_id = 1
  ORDER BY u.created_at DESC
  LIMIT ?
`;

/**
 * Rechercher des utilisateurs par mois d'anniversaire
 */
export const SEARCH_USERS_BY_BIRTHDAY_MONTH = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.date_of_birth,
    DAY(u.date_of_birth) as birthday_day
  FROM utilisateurs u
  WHERE MONTH(u.date_of_birth) = ?
    AND u.status_id = 1
  ORDER BY birthday_day, u.last_name
`;

/**
 * Rechercher des utilisateurs dont l'abonnement expire bientôt
 */
export const SEARCH_USERS_EXPIRING_SUBSCRIPTION = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.subscription_end_date,
    DATEDIFF(u.subscription_end_date, CURDATE()) as days_remaining
  FROM utilisateurs u
  WHERE u.subscription_end_date IS NOT NULL
    AND u.subscription_end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
    AND u.status_id = 1
  ORDER BY u.subscription_end_date
  LIMIT ?
`;

/**
 * Recherche avancée avec tous les filtres
 */
export interface SearchUsersParams {
  name?: string;
  email?: string;
  statusId?: number;
  genreId?: number;
  gradeId?: number;
  abonnementId?: number;
  ageMin?: number;
  ageMax?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'first_name' | 'last_name' | 'email' | 'date_of_birth';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Construire une requête de recherche complète
 */
export function buildSearchQuery(params: SearchUsersParams): { query: string; params: any[] } {
  let query = SEARCH_USERS_BASE;
  const queryParams: any[] = [];

  // Filtres
  if (params.name) {
    query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.nom_utilisateur LIKE ?)';
    const searchPattern = `%${params.name}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }

  if (params.email) {
    query += ' AND u.email LIKE ?';
    queryParams.push(`%${params.email}%`);
  }

  if (params.statusId !== undefined) {
    query += ' AND u.status_id = ?';
    queryParams.push(params.statusId);
  }

  if (params.genreId !== undefined) {
    query += ' AND u.genre_id = ?';
    queryParams.push(params.genreId);
  }

  if (params.gradeId !== undefined) {
    query += ' AND u.grade_id = ?';
    queryParams.push(params.gradeId);
  }

  if (params.abonnementId !== undefined) {
    query += ' AND u.abonnement_id = ?';
    queryParams.push(params.abonnementId);
  }

  if (params.ageMin !== undefined || params.ageMax !== undefined) {
    if (params.ageMin !== undefined && params.ageMax !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) BETWEEN ? AND ?';
      queryParams.push(params.ageMin, params.ageMax);
    } else if (params.ageMin !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) >= ?';
      queryParams.push(params.ageMin);
    } else if (params.ageMax !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) <= ?';
      queryParams.push(params.ageMax);
    }
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
}

/**
 * Construire une requête de comptage pour la recherche
 */
export function buildSearchCountQuery(params: SearchUsersParams): { query: string; params: any[] } {
  let query = SEARCH_USERS_COUNT_BASE;
  const queryParams: any[] = [];

  // Mêmes filtres que pour la recherche (sans tri ni pagination)
  if (params.name) {
    query += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.nom_utilisateur LIKE ?)';
    const searchPattern = `%${params.name}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
  }

  if (params.email) {
    query += ' AND u.email LIKE ?';
    queryParams.push(`%${params.email}%`);
  }

  if (params.statusId !== undefined) {
    query += ' AND u.status_id = ?';
    queryParams.push(params.statusId);
  }

  if (params.genreId !== undefined) {
    query += ' AND u.genre_id = ?';
    queryParams.push(params.genreId);
  }

  if (params.gradeId !== undefined) {
    query += ' AND u.grade_id = ?';
    queryParams.push(params.gradeId);
  }

  if (params.abonnementId !== undefined) {
    query += ' AND u.abonnement_id = ?';
    queryParams.push(params.abonnementId);
  }

  if (params.ageMin !== undefined || params.ageMax !== undefined) {
    if (params.ageMin !== undefined && params.ageMax !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) BETWEEN ? AND ?';
      queryParams.push(params.ageMin, params.ageMax);
    } else if (params.ageMin !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) >= ?';
      queryParams.push(params.ageMin);
    } else if (params.ageMax !== undefined) {
      query += ' AND TIMESTAMPDIFF(YEAR, u.date_of_birth, CURDATE()) <= ?';
      queryParams.push(params.ageMax);
    }
  }

  return { query, params: queryParams };
}
