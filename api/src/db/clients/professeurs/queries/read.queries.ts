/**
 * Requêtes SQL de lecture pour le module professeurs
 */

import { PROFESSEUR_STATUS_ID } from '../types.js';

// ============================================================================
// Requêtes de lecture des professeurs
// ============================================================================

/**
 * Récupère tous les professeurs
 */
export const GET_ALL_PROFESSEURS = `
  SELECT
    id,
    first_name,
    last_name,
    nom_utilisateur,
    email,
    genre_id,
    date_of_birth,
    grade_id,
    status_id,
    created_at,
    updated_at
  FROM utilisateurs
  WHERE status_id = ${PROFESSEUR_STATUS_ID}
  ORDER BY last_name, first_name;
`;

/**
 * Récupère un professeur par son ID
 */
export const GET_PROFESSEUR_BY_ID = `
  SELECT
    id,
    first_name,
    last_name,
    nom_utilisateur,
    email,
    genre_id,
    date_of_birth,
    grade_id,
    status_id,
    created_at,
    updated_at
  FROM utilisateurs
  WHERE id = ? AND status_id = ${PROFESSEUR_STATUS_ID};
`;

/**
 * Récupère un utilisateur par son ID (peu importe le statut)
 */
export const GET_UTILISATEUR_BY_ID = `
  SELECT
    id,
    first_name,
    last_name,
    nom_utilisateur,
    email,
    genre_id,
    date_of_birth,
    grade_id,
    status_id,
    created_at,
    updated_at
  FROM utilisateurs
  WHERE id = ?;
`;

/**
 * Récupère plusieurs utilisateurs par leurs IDs
 */
export const GET_UTILISATEURS_BY_IDS = `
  SELECT
    id,
    first_name,
    last_name,
    nom_utilisateur,
    email,
    genre_id,
    date_of_birth,
    grade_id,
    status_id,
    created_at,
    updated_at
  FROM utilisateurs
  WHERE id IN (?);
`;

/**
 * Récupère le planning des cours d'un professeur
 * Accepte soit l'ID du professeur, soit l'ID de l'utilisateur
 */
export const GET_PLANNING_COURS_PROFESSEUR = `
  SELECT
    cr.id AS cours_recurrent_id,
    cr.type_cours,
    cr.jour_semaine,
    cr.heure_debut,
    cr.heure_fin,
    cr.active AS est_recurrent_actif,
    p.id AS professeur_id,
    p.nom AS professeur_nom,
    p.prenom AS professeur_prenom
  FROM
    cours_recurrent cr
  JOIN
    cours_recurrent_professeur crp ON cr.id = crp.cours_recurrent_id
  JOIN
    professeurs p ON crp.professeur_id = p.id
  WHERE
    p.id = IF(
      -- Vérifie si l'ID est dans la table professeurs
      (SELECT COUNT(*) FROM professeurs WHERE id = ?),
      ?,
      -- Sinon, trouve l'ID du professeur correspondant à l'ID de l'utilisateur
      (SELECT p2.id FROM professeurs p2
       JOIN utilisateurs u ON p2.nom = u.last_name AND p2.prenom = u.first_name
       WHERE u.id = ? LIMIT 1)
    )
  ORDER BY
    cr.jour_semaine, cr.heure_debut;
`;

/**
 * Récupère les informations d'un professeur depuis la table professeurs
 */
export const GET_PROFESSEUR_FROM_PROFESSEURS_TABLE = `
  SELECT
    p.id,
    p.nom,
    p.prenom,
    u.email,
    u.nom_utilisateur,
    u.genre_id,
    u.date_of_birth,
    u.grade_id,
    u.status_id
  FROM professeurs p
  LEFT JOIN utilisateurs u ON p.nom = u.last_name AND p.prenom = u.first_name
  WHERE p.id = ?;
`;

/**
 * Récupère le nombre total de professeurs
 */
export const COUNT_PROFESSEURS = `
  SELECT COUNT(*) as total
  FROM utilisateurs
  WHERE status_id = ${PROFESSEUR_STATUS_ID};
`;

/**
 * Recherche des professeurs par nom, prénom ou email
 */
export const SEARCH_PROFESSEURS = `
  SELECT
    id,
    first_name,
    last_name,
    nom_utilisateur,
    email,
    genre_id,
    date_of_birth,
    grade_id,
    status_id,
    created_at,
    updated_at
  FROM utilisateurs
  WHERE status_id = ${PROFESSEUR_STATUS_ID}
    AND (
      first_name LIKE ?
      OR last_name LIKE ?
      OR email LIKE ?
      OR nom_utilisateur LIKE ?
    )
  ORDER BY last_name, first_name
  LIMIT ? OFFSET ?;
`;

/**
 * Récupère les cours d'un professeur pour une période donnée
 */
export const GET_COURS_PROFESSEUR_BY_DATE_RANGE = `
  SELECT
    cr.id AS cours_recurrent_id,
    cr.type_cours,
    cr.jour_semaine,
    cr.heure_debut,
    cr.heure_fin,
    cr.active AS est_recurrent_actif
  FROM
    cours_recurrent cr
  JOIN
    cours_recurrent_professeur crp ON cr.id = crp.cours_recurrent_id
  WHERE
    crp.professeur_id = ?
    AND cr.active = 1
  ORDER BY
    cr.jour_semaine, cr.heure_debut;
`;
