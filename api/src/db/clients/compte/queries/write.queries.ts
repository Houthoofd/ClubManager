/**
 * Requêtes SQL d'ÉCRITURE pour le module Compte
 * Responsabilité: Requêtes INSERT, UPDATE, DELETE uniquement
 */

// ============================================================================
// QUERIES DE MISE À JOUR (UPDATE)
// ============================================================================

/**
 * Mettre à jour le mot de passe (création - uniquement si vide)
 */
export const UPDATE_PASSWORD_IF_EMPTY = `
  UPDATE utilisateurs
  SET password = ?
  WHERE id = ? AND (password IS NULL OR password = "")
`;

/**
 * Mettre à jour le mot de passe (modification)
 */
export const UPDATE_PASSWORD = `
  UPDATE utilisateurs
  SET password = ?
  WHERE id = ?
`;

/**
 * Mettre à jour les informations du compte
 */
export const UPDATE_COMPTE_INFO = `
  UPDATE utilisateurs
  SET first_name = ?, last_name = ?, email = ?, date_of_birth = ?, phone = ?
  WHERE id = ? AND status_id = 1
`;

/**
 * Mettre à jour le prénom
 */
export const UPDATE_FIRST_NAME = `
  UPDATE utilisateurs
  SET first_name = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le nom
 */
export const UPDATE_LAST_NAME = `
  UPDATE utilisateurs
  SET last_name = ?
  WHERE id = ?
`;

/**
 * Mettre à jour l'email
 */
export const UPDATE_EMAIL = `
  UPDATE utilisateurs
  SET email = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le téléphone
 */
export const UPDATE_PHONE = `
  UPDATE utilisateurs
  SET phone = ?
  WHERE id = ?
`;

/**
 * Mettre à jour la date de naissance
 */
export const UPDATE_DATE_OF_BIRTH = `
  UPDATE utilisateurs
  SET date_of_birth = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le nom d'utilisateur
 */
export const UPDATE_USERNAME = `
  UPDATE utilisateurs
  SET nom_utilisateur = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le genre
 */
export const UPDATE_GENRE = `
  UPDATE utilisateurs
  SET genre_id = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le statut
 */
export const UPDATE_STATUS = `
  UPDATE utilisateurs
  SET status_id = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le grade
 */
export const UPDATE_GRADE = `
  UPDATE utilisateurs
  SET grade_id = ?
  WHERE id = ?
`;

/**
 * Mettre à jour l'abonnement
 */
export const UPDATE_ABONNEMENT = `
  UPDATE utilisateurs
  SET abonnement_id = ?
  WHERE id = ?
`;

/**
 * Fonction pour construire dynamiquement la requête de mise à jour utilisateur
 */
export function buildUpdateUtilisateurQuery(fields: string[]): string {
  const updates = fields.map(field => `${field} = ?`);
  return `UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`;
}

/**
 * Désactiver un compte (soft delete)
 */
export const SOFT_DELETE_COMPTE = `
  UPDATE utilisateurs
  SET status_id = 0
  WHERE id = ? AND status_id = 1
`;

/**
 * Réactiver un compte
 */
export const REACTIVATE_COMPTE = `
  UPDATE utilisateurs
  SET status_id = 1
  WHERE id = ? AND status_id = 0
`;

/**
 * Mettre à jour la date de dernière connexion
 */
export const UPDATE_LAST_LOGIN = `
  UPDATE utilisateurs
  SET last_login = NOW()
  WHERE id = ?
`;

/**
 * Incrémenter le compteur de tentatives de connexion échouées
 */
export const INCREMENT_FAILED_LOGIN_ATTEMPTS = `
  UPDATE utilisateurs
  SET failed_login_attempts = failed_login_attempts + 1,
      last_failed_login = NOW()
  WHERE id = ?
`;

/**
 * Réinitialiser le compteur de tentatives de connexion échouées
 */
export const RESET_FAILED_LOGIN_ATTEMPTS = `
  UPDATE utilisateurs
  SET failed_login_attempts = 0,
      last_failed_login = NULL
  WHERE id = ?
`;

/**
 * Verrouiller un compte (après trop de tentatives échouées)
 */
export const LOCK_ACCOUNT = `
  UPDATE utilisateurs
  SET account_locked = 1,
      locked_at = NOW()
  WHERE id = ?
`;

/**
 * Déverrouiller un compte
 */
export const UNLOCK_ACCOUNT = `
  UPDATE utilisateurs
  SET account_locked = 0,
      locked_at = NULL,
      failed_login_attempts = 0
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'INSERTION (INSERT)
// ============================================================================

/**
 * Créer un nouveau compte utilisateur
 */
export const INSERT_USER = `
  INSERT INTO utilisateurs (
    first_name,
    last_name,
    nom_utilisateur,
    email,
    password,
    phone,
    date_of_birth,
    genre_id,
    status_id,
    grade_id,
    abonnement_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

/**
 * Créer un utilisateur simple (données minimales)
 */
export const INSERT_USER_MINIMAL = `
  INSERT INTO utilisateurs (
    first_name,
    last_name,
    email,
    status_id
  ) VALUES (?, ?, ?, 1)
`;

// ============================================================================
// QUERIES DE SUPPRESSION (DELETE)
// ============================================================================

/**
 * Supprimer définitivement un compte (hard delete - à utiliser avec précaution)
 */
export const DELETE_USER_HARD = `
  DELETE FROM utilisateurs
  WHERE id = ?
`;

/**
 * Supprimer les comptes inactifs depuis X jours
 */
export const DELETE_INACTIVE_USERS = `
  DELETE FROM utilisateurs
  WHERE status_id = 0
    AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

/**
 * Anonymiser les données d'un utilisateur (RGPD)
 */
export const ANONYMIZE_USER_DATA = `
  UPDATE utilisateurs
  SET
    first_name = 'Utilisateur',
    last_name = 'Supprimé',
    nom_utilisateur = CONCAT('deleted_', id),
    email = CONCAT('deleted_', id, '@anonymized.local'),
    phone = NULL,
    password = NULL,
    date_of_birth = NULL,
    status_id = 0
  WHERE id = ?
`;
