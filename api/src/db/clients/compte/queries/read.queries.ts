/**
 * Requêtes SQL de LECTURE pour le module Compte
 * Responsabilité: Requêtes SELECT uniquement
 */

// ============================================================================
// QUERIES DE LECTURE BASIQUES
// ============================================================================

/**
 * Sélectionner un utilisateur par son nom et prénom
 */
export const SELECT_USER_BY_NAME = `
  SELECT * FROM utilisateurs
  WHERE first_name = ? AND last_name = ?
`;

/**
 * Sélectionner un utilisateur avec ses relations
 */
export const SELECT_USER_WITH_RELATIONS = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.nom_utilisateur,
    u.email,
    u.password,
    g.genre_name AS genres,
    s.nom_role AS status,
    gr.grade_id AS grades,
    a.nom_plan AS abonnement,
    u.date_of_birth
  FROM utilisateurs u
  LEFT JOIN genres g ON u.genre_id = g.id
  LEFT JOIN status s ON u.status_id = s.id
  LEFT JOIN grades gr ON u.grade_id = gr.id
  LEFT JOIN plans_tarifaires a ON u.abonnement_id = a.id
  WHERE u.first_name = ? AND u.last_name = ?
`;

/**
 * Sélectionner un utilisateur par ID
 */
export const SELECT_USER_BY_ID = `
  SELECT * FROM utilisateurs
  WHERE id = ?
`;

/**
 * Sélectionner un utilisateur par ID avec relations
 */
export const SELECT_USER_BY_ID_WITH_RELATIONS = `
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
  WHERE u.id = ?
`;

/**
 * Sélectionner les informations basiques du compte
 */
export const SELECT_COMPTE_INFO = `
  SELECT id, first_name, last_name, email, date_of_birth, phone
  FROM utilisateurs
  WHERE id = ? AND status_id = 1
`;

/**
 * Sélectionner un utilisateur par email
 */
export const SELECT_USER_BY_EMAIL = `
  SELECT * FROM utilisateurs
  WHERE email = ?
`;

/**
 * Sélectionner un utilisateur par nom d'utilisateur
 */
export const SELECT_USER_BY_USERNAME = `
  SELECT * FROM utilisateurs
  WHERE nom_utilisateur = ?
`;

/**
 * Sélectionner tous les utilisateurs actifs
 */
export const SELECT_ALL_ACTIVE_USERS = `
  SELECT * FROM utilisateurs
  WHERE status_id = 1
  ORDER BY last_name, first_name
`;

/**
 * Sélectionner tous les utilisateurs avec relations
 */
export const SELECT_ALL_USERS_WITH_RELATIONS = `
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
  ORDER BY u.last_name, u.first_name
`;

/**
 * Sélectionner un utilisateur par ID (simple, sans relations)
 */
export const SELECT_USER_SIMPLE = `
  SELECT
    id,
    first_name,
    last_name,
    nom_utilisateur,
    email,
    phone,
    date_of_birth,
    genre_id,
    status_id,
    grade_id,
    abonnement_id
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Sélectionner le mot de passe d'un utilisateur (pour vérification)
 */
export const SELECT_USER_PASSWORD = `
  SELECT id, password
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Sélectionner les utilisateurs par statut
 */
export const SELECT_USERS_BY_STATUS = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.nom_utilisateur,
    u.email,
    s.nom_role AS status
  FROM utilisateurs u
  LEFT JOIN status s ON u.status_id = s.id
  WHERE u.status_id = ?
  ORDER BY u.last_name, u.first_name
`;

/**
 * Sélectionner les utilisateurs par grade
 */
export const SELECT_USERS_BY_GRADE = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.nom_utilisateur,
    u.email,
    gr.grade_id AS grade,
    gr.nom_grade
  FROM utilisateurs u
  LEFT JOIN grades gr ON u.grade_id = gr.id
  WHERE u.grade_id = ?
  ORDER BY u.last_name, u.first_name
`;

/**
 * Sélectionner les utilisateurs par abonnement
 */
export const SELECT_USERS_BY_ABONNEMENT = `
  SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.nom_utilisateur,
    u.email,
    a.nom_plan AS abonnement
  FROM utilisateurs u
  LEFT JOIN plans_tarifaires a ON u.abonnement_id = a.id
  WHERE u.abonnement_id = ?
  ORDER BY u.last_name, u.first_name
`;
