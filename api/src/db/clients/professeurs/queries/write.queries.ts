/**
 * Requêtes SQL d'écriture pour le module professeurs
 */

import { PROFESSEUR_STATUS_ID, UTILISATEUR_STATUS_ID } from '../types.js';

// ============================================================================
// Requêtes de modification du statut
// ============================================================================

/**
 * Modifie le statut d'un utilisateur
 */
export const UPDATE_USER_STATUS = `
  UPDATE utilisateurs
  SET status_id = ?, updated_at = NOW()
  WHERE id = ?;
`;

/**
 * Promeut un utilisateur au rang de professeur
 */
export const PROMOTE_USER_TO_PROFESSEUR = `
  UPDATE utilisateurs
  SET status_id = ${PROFESSEUR_STATUS_ID}, updated_at = NOW()
  WHERE id = ?;
`;

/**
 * Rétrograde un professeur au rang d'utilisateur régulier
 */
export const DEMOTE_PROFESSEUR_TO_USER = `
  UPDATE utilisateurs
  SET status_id = ${UTILISATEUR_STATUS_ID}, updated_at = NOW()
  WHERE id = ?;
`;

/**
 * Promeut plusieurs utilisateurs au rang de professeur en une seule requête
 */
export const PROMOTE_USERS_TO_PROFESSEUR_BATCH = `
  UPDATE utilisateurs
  SET status_id = ${PROFESSEUR_STATUS_ID}, updated_at = NOW()
  WHERE id IN (?);
`;

// ============================================================================
// Requêtes de gestion des cours
// ============================================================================

/**
 * Assigne un professeur à un cours récurrent
 */
export const ASSIGN_PROFESSEUR_TO_COURS = `
  INSERT INTO cours_recurrent_professeur (cours_recurrent_id, professeur_id)
  VALUES (?, ?);
`;

/**
 * Retire un professeur d'un cours récurrent
 */
export const REMOVE_PROFESSEUR_FROM_COURS = `
  DELETE FROM cours_recurrent_professeur
  WHERE cours_recurrent_id = ? AND professeur_id = ?;
`;

/**
 * Retire un professeur de tous ses cours récurrents
 */
export const REMOVE_PROFESSEUR_FROM_ALL_COURS = `
  DELETE FROM cours_recurrent_professeur
  WHERE professeur_id = ?;
`;

// ============================================================================
// Requêtes de gestion de la table professeurs
// ============================================================================

/**
 * Crée une entrée dans la table professeurs
 */
export const CREATE_PROFESSEUR_ENTRY = `
  INSERT INTO professeurs (nom, prenom, email)
  VALUES (?, ?, ?);
`;

/**
 * Supprime une entrée de la table professeurs
 */
export const DELETE_PROFESSEUR_ENTRY = `
  DELETE FROM professeurs
  WHERE id = ?;
`;

/**
 * Met à jour les informations d'un professeur dans la table professeurs
 */
export const UPDATE_PROFESSEUR_ENTRY = `
  UPDATE professeurs
  SET nom = ?, prenom = ?, email = ?
  WHERE id = ?;
`;

// ============================================================================
// Requêtes de mise à jour des informations utilisateur
// ============================================================================

/**
 * Met à jour les informations de base d'un utilisateur
 */
export const UPDATE_USER_INFO = `
  UPDATE utilisateurs
  SET
    first_name = ?,
    last_name = ?,
    email = ?,
    genre_id = ?,
    date_of_birth = ?,
    grade_id = ?,
    updated_at = NOW()
  WHERE id = ?;
`;

/**
 * Met à jour uniquement l'email d'un utilisateur
 */
export const UPDATE_USER_EMAIL = `
  UPDATE utilisateurs
  SET email = ?, updated_at = NOW()
  WHERE id = ?;
`;

/**
 * Met à jour uniquement le grade d'un utilisateur
 */
export const UPDATE_USER_GRADE = `
  UPDATE utilisateurs
  SET grade_id = ?, updated_at = NOW()
  WHERE id = ?;
`;

// ============================================================================
// Requêtes de suppression
// ============================================================================

/**
 * Supprime un utilisateur (soft delete via status)
 */
export const SOFT_DELETE_USER = `
  UPDATE utilisateurs
  SET status_id = 0, updated_at = NOW()
  WHERE id = ?;
`;

/**
 * Supprime définitivement un utilisateur (hard delete)
 */
export const HARD_DELETE_USER = `
  DELETE FROM utilisateurs
  WHERE id = ?;
`;
