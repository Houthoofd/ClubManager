/**
 * Requêtes SQL de validation pour le module professeurs
 */

import { PROFESSEUR_STATUS_ID } from '../types.js';

// ============================================================================
// Requêtes de validation d'existence
// ============================================================================

/**
 * Vérifie si un utilisateur existe
 */
export const USER_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?;
`;

/**
 * Vérifie si un professeur existe (par ID utilisateur)
 */
export const PROFESSEUR_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND status_id = ${PROFESSEUR_STATUS_ID};
`;

/**
 * Vérifie si un professeur existe dans la table professeurs
 */
export const PROFESSEUR_EXISTS_IN_TABLE = `
  SELECT COUNT(*) as count
  FROM professeurs
  WHERE id = ?;
`;

/**
 * Vérifie si plusieurs utilisateurs existent
 */
export const USERS_EXIST = `
  SELECT id
  FROM utilisateurs
  WHERE id IN (?);
`;

/**
 * Vérifie si un cours récurrent existe
 */
export const COURS_RECURRENT_EXISTS = `
  SELECT COUNT(*) as count
  FROM cours_recurrent
  WHERE id = ?;
`;

// ============================================================================
// Requêtes de validation de statut
// ============================================================================

/**
 * Vérifie si un utilisateur est déjà professeur
 */
export const IS_USER_ALREADY_PROFESSEUR = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND status_id = ${PROFESSEUR_STATUS_ID};
`;

/**
 * Vérifie si un utilisateur peut être promu professeur
 */
export const CAN_USER_BE_PROMOTED = `
  SELECT
    id,
    status_id,
    email,
    first_name,
    last_name
  FROM utilisateurs
  WHERE id = ? AND status_id != ${PROFESSEUR_STATUS_ID};
`;

/**
 * Vérifie le statut actuel d'un utilisateur
 */
export const GET_USER_STATUS = `
  SELECT status_id
  FROM utilisateurs
  WHERE id = ?;
`;

// ============================================================================
// Requêtes de validation d'email
// ============================================================================

/**
 * Vérifie si un email existe déjà (pour éviter les doublons)
 */
export const EMAIL_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE email = ? AND id != ?;
`;

/**
 * Vérifie si un email est unique
 */
export const IS_EMAIL_UNIQUE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE email = ?;
`;

// ============================================================================
// Requêtes de validation des cours
// ============================================================================

/**
 * Vérifie si un professeur est assigné à un cours
 */
export const IS_PROFESSEUR_ASSIGNED_TO_COURS = `
  SELECT COUNT(*) as count
  FROM cours_recurrent_professeur
  WHERE professeur_id = ? AND cours_recurrent_id = ?;
`;

/**
 * Vérifie si un professeur a des cours actifs
 */
export const HAS_ACTIVE_COURS = `
  SELECT COUNT(*) as count
  FROM cours_recurrent_professeur crp
  JOIN cours_recurrent cr ON crp.cours_recurrent_id = cr.id
  WHERE crp.professeur_id = ? AND cr.active = 1;
`;

/**
 * Compte le nombre de cours d'un professeur
 */
export const COUNT_PROFESSEUR_COURS = `
  SELECT COUNT(*) as count
  FROM cours_recurrent_professeur
  WHERE professeur_id = ?;
`;

/**
 * Vérifie si un cours a déjà un professeur assigné
 */
export const COURS_HAS_PROFESSEUR = `
  SELECT COUNT(*) as count
  FROM cours_recurrent_professeur
  WHERE cours_recurrent_id = ?;
`;

// ============================================================================
// Requêtes de validation de contraintes métier
// ============================================================================

/**
 * Vérifie si un professeur peut être rétrogradé (pas de cours actifs)
 */
export const CAN_DEMOTE_PROFESSEUR = `
  SELECT
    (SELECT COUNT(*) FROM cours_recurrent_professeur crp
     JOIN cours_recurrent cr ON crp.cours_recurrent_id = cr.id
     WHERE crp.professeur_id = ? AND cr.active = 1) as active_cours_count;
`;

/**
 * Vérifie les dépendances d'un professeur avant suppression
 */
export const CHECK_PROFESSEUR_DEPENDENCIES = `
  SELECT
    (SELECT COUNT(*) FROM cours_recurrent_professeur WHERE professeur_id = ?) as cours_count,
    (SELECT COUNT(*) FROM cours WHERE professeur_id = ?) as cours_ponctuels_count;
`;

/**
 * Vérifie si un utilisateur a les permissions nécessaires
 */
export const CHECK_USER_PERMISSIONS = `
  SELECT status_id
  FROM utilisateurs
  WHERE id = ? AND status_id IN (2, 5);
`;

// ============================================================================
// Requêtes de validation de doublons
// ============================================================================

/**
 * Vérifie les doublons de nom/prénom dans la table professeurs
 */
export const CHECK_DUPLICATE_PROFESSEUR = `
  SELECT COUNT(*) as count
  FROM professeurs
  WHERE nom = ? AND prenom = ? AND id != ?;
`;

/**
 * Vérifie si un utilisateur existe déjà avec ce nom d'utilisateur
 */
export const USERNAME_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE nom_utilisateur = ? AND id != ?;
`;

// ============================================================================
// Requêtes de validation de données
// ============================================================================

/**
 * Valide les données d'un utilisateur (champs requis présents)
 */
export const VALIDATE_USER_DATA = `
  SELECT
    CASE
      WHEN first_name IS NULL OR first_name = '' THEN 0
      WHEN last_name IS NULL OR last_name = '' THEN 0
      WHEN email IS NULL OR email = '' THEN 0
      WHEN email NOT LIKE '%@%' THEN 0
      ELSE 1
    END as is_valid
  FROM utilisateurs
  WHERE id = ?;
`;

/**
 * Vérifie si un grade existe
 */
export const GRADE_EXISTS = `
  SELECT COUNT(*) as count
  FROM grades
  WHERE id = ?;
`;

/**
 * Vérifie si un genre existe
 */
export const GENRE_EXISTS = `
  SELECT COUNT(*) as count
  FROM genres
  WHERE id = ?;
`;
