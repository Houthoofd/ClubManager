/**
 * Requêtes SQL de RELATIONS pour le module Compte
 * Responsabilité: Requêtes concernant les relations (genres, grades, status, abonnements)
 */

// ============================================================================
// QUERIES POUR OBTENIR LES IDS DES RELATIONS
// ============================================================================

/**
 * Obtenir l'ID d'un genre par son nom
 */
export const SELECT_GENRE_ID_BY_NAME = `
  SELECT id FROM genres
  WHERE genre_name = ?
`;

/**
 * Obtenir l'ID d'un grade par son nom
 */
export const SELECT_GRADE_ID_BY_NAME = `
  SELECT id FROM grades
  WHERE grade_id = ?
`;

/**
 * Obtenir l'ID d'un statut par son nom
 */
export const SELECT_STATUS_ID_BY_NAME = `
  SELECT id FROM status
  WHERE nom_role = ?
`;

/**
 * Obtenir l'ID d'un abonnement par son nom
 */
export const SELECT_ABONNEMENT_ID_BY_NAME = `
  SELECT id FROM plans_tarifaires
  WHERE nom_plan = ?
`;

// ============================================================================
// QUERIES POUR LISTER TOUS LES GENRES
// ============================================================================

/**
 * Obtenir tous les genres
 */
export const SELECT_ALL_GENRES = `
  SELECT id, genre_name FROM genres
  ORDER BY genre_name
`;

/**
 * Obtenir tous les genres avec le nombre d'utilisateurs
 */
export const SELECT_ALL_GENRES_WITH_COUNT = `
  SELECT
    g.id,
    g.genre_name,
    COUNT(u.id) as user_count
  FROM genres g
  LEFT JOIN utilisateurs u ON g.id = u.genre_id
  GROUP BY g.id, g.genre_name
  ORDER BY g.genre_name
`;

/**
 * Obtenir un genre par ID
 */
export const SELECT_GENRE_BY_ID = `
  SELECT id, genre_name FROM genres
  WHERE id = ?
`;

// ============================================================================
// QUERIES POUR LISTER TOUS LES GRADES
// ============================================================================

/**
 * Obtenir tous les grades
 */
export const SELECT_ALL_GRADES = `
  SELECT id, grade_id, nom_grade FROM grades
  ORDER BY id
`;

/**
 * Obtenir tous les grades avec le nombre d'utilisateurs
 */
export const SELECT_ALL_GRADES_WITH_COUNT = `
  SELECT
    g.id,
    g.grade_id,
    g.nom_grade,
    COUNT(u.id) as user_count
  FROM grades g
  LEFT JOIN utilisateurs u ON g.id = u.grade_id
  GROUP BY g.id, g.grade_id, g.nom_grade
  ORDER BY g.id
`;

/**
 * Obtenir un grade par ID
 */
export const SELECT_GRADE_BY_ID = `
  SELECT id, grade_id, nom_grade FROM grades
  WHERE id = ?
`;

// ============================================================================
// QUERIES POUR LISTER TOUS LES STATUS
// ============================================================================

/**
 * Obtenir tous les status
 */
export const SELECT_ALL_STATUS = `
  SELECT id, nom_role FROM status
  ORDER BY id
`;

/**
 * Obtenir tous les status avec le nombre d'utilisateurs
 */
export const SELECT_ALL_STATUS_WITH_COUNT = `
  SELECT
    s.id,
    s.nom_role,
    COUNT(u.id) as user_count
  FROM status s
  LEFT JOIN utilisateurs u ON s.id = u.status_id
  GROUP BY s.id, s.nom_role
  ORDER BY s.id
`;

/**
 * Obtenir un status par ID
 */
export const SELECT_STATUS_BY_ID = `
  SELECT id, nom_role FROM status
  WHERE id = ?
`;

// ============================================================================
// QUERIES POUR LISTER TOUS LES PLANS TARIFAIRES
// ============================================================================

/**
 * Obtenir tous les plans tarifaires
 */
export const SELECT_ALL_PLANS = `
  SELECT id, nom_plan, prix, duree FROM plans_tarifaires
  ORDER BY prix
`;

/**
 * Obtenir tous les plans tarifaires avec le nombre d'abonnés
 */
export const SELECT_ALL_PLANS_WITH_COUNT = `
  SELECT
    p.id,
    p.nom_plan,
    p.prix,
    p.duree,
    COUNT(u.id) as subscriber_count
  FROM plans_tarifaires p
  LEFT JOIN utilisateurs u ON p.id = u.abonnement_id
  GROUP BY p.id, p.nom_plan, p.prix, p.duree
  ORDER BY p.prix
`;

/**
 * Obtenir un plan tarifaire par ID
 */
export const SELECT_PLAN_BY_ID = `
  SELECT id, nom_plan, prix, duree FROM plans_tarifaires
  WHERE id = ?
`;

/**
 * Obtenir les plans tarifaires actifs
 */
export const SELECT_ACTIVE_PLANS = `
  SELECT id, nom_plan, prix, duree, description
  FROM plans_tarifaires
  WHERE active = 1
  ORDER BY prix
`;

// ============================================================================
// QUERIES DE MISE À JOUR DES RELATIONS
// ============================================================================

/**
 * Mettre à jour toutes les relations d'un utilisateur
 */
export const UPDATE_USER_RELATIONS = `
  UPDATE utilisateurs
  SET
    genre_id = ?,
    status_id = ?,
    grade_id = ?,
    abonnement_id = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES POUR LES STATISTIQUES DES RELATIONS
// ============================================================================

/**
 * Obtenir le nombre d'utilisateurs par genre
 */
export const COUNT_USERS_BY_GENRE = `
  SELECT
    g.id,
    g.genre_name,
    COUNT(u.id) as count
  FROM genres g
  LEFT JOIN utilisateurs u ON g.id = u.genre_id AND u.status_id = 1
  GROUP BY g.id, g.genre_name
  ORDER BY count DESC
`;

/**
 * Obtenir le nombre d'utilisateurs par grade
 */
export const COUNT_USERS_BY_GRADE = `
  SELECT
    g.id,
    g.grade_id,
    g.nom_grade,
    COUNT(u.id) as count
  FROM grades g
  LEFT JOIN utilisateurs u ON g.id = u.grade_id AND u.status_id = 1
  GROUP BY g.id, g.grade_id, g.nom_grade
  ORDER BY count DESC
`;

/**
 * Obtenir le nombre d'utilisateurs par status
 */
export const COUNT_USERS_BY_STATUS = `
  SELECT
    s.id,
    s.nom_role,
    COUNT(u.id) as count
  FROM status s
  LEFT JOIN utilisateurs u ON s.id = u.status_id
  GROUP BY s.id, s.nom_role
  ORDER BY count DESC
`;

/**
 * Obtenir le nombre d'utilisateurs par abonnement
 */
export const COUNT_USERS_BY_ABONNEMENT = `
  SELECT
    p.id,
    p.nom_plan,
    p.prix,
    COUNT(u.id) as count
  FROM plans_tarifaires p
  LEFT JOIN utilisateurs u ON p.id = u.abonnement_id AND u.status_id = 1
  GROUP BY p.id, p.nom_plan, p.prix
  ORDER BY count DESC
`;

// ============================================================================
// QUERIES DE VALIDATION DES RELATIONS
// ============================================================================

/**
 * Vérifier si un genre existe
 */
export const CHECK_GENRE_EXISTS = `
  SELECT COUNT(*) as count
  FROM genres
  WHERE id = ?
`;

/**
 * Vérifier si un grade existe
 */
export const CHECK_GRADE_EXISTS = `
  SELECT COUNT(*) as count
  FROM grades
  WHERE id = ?
`;

/**
 * Vérifier si un status existe
 */
export const CHECK_STATUS_EXISTS = `
  SELECT COUNT(*) as count
  FROM status
  WHERE id = ?
`;

/**
 * Vérifier si un plan tarifaire existe
 */
export const CHECK_PLAN_EXISTS = `
  SELECT COUNT(*) as count
  FROM plans_tarifaires
  WHERE id = ?
`;
