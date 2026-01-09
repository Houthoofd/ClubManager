/**
 * Requêtes SQL pour le module Auth
 */

/**
 * Authentification
 */
export const GET_USER_BY_EMAIL = `
  SELECT id, first_name, last_name, email, password_hash, status_id
  FROM utilisateurs
  WHERE email = ? AND status_id = 1
`;

export const GET_USER_BY_EMAIL_ALL_STATUS = `
  SELECT id, email, last_name, first_name, status_id
  FROM utilisateurs
  WHERE email = ?
`;

/**
 * Gestion des comptes
 */
export const CREATE_USER_ACCOUNT = `
  INSERT INTO utilisateurs (first_name, last_name, email, password_hash, status_id)
  VALUES (?, ?, ?, ?, 1)
`;

export const UPDATE_PASSWORD = `
  UPDATE utilisateurs
  SET password_hash = ?
  WHERE id = ? AND status_id = 1
`;

export const UPDATE_PASSWORD_BY_ID = `
  UPDATE utilisateurs
  SET password = ?
  WHERE id = ?
`;

export const CHECK_EMAIL_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE email = ?
`;

/**
 * Tokens de récupération
 */
export const DELETE_USER_RESET_TOKENS = `
  DELETE FROM password_reset_tokens
  WHERE user_id = ?
`;

export const CREATE_RESET_TOKEN = `
  INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
  VALUES (?, ?, ?, ?)
`;

export const GET_VALID_TOKEN = `
  SELECT prt.*, u.id as user_id, u.email, u.last_name, u.first_name
  FROM password_reset_tokens prt
  JOIN utilisateurs u ON prt.user_id = u.id
  WHERE prt.token = ? AND prt.expires_at > ?
`;

export const DELETE_TOKEN = `
  DELETE FROM password_reset_tokens
  WHERE token = ?
`;

export const DELETE_EXPIRED_TOKENS = `
  DELETE FROM password_reset_tokens
  WHERE expires_at < ?
`;

export const DELETE_ALL_USER_TOKENS = `
  DELETE FROM password_reset_tokens
  WHERE user_id = ?
`;

/**
 * Informations de sécurité
 */
export const GET_SECURITY_INFO = `
  SELECT
    u.id, u.email, u.last_name, u.first_name,
    u.date_of_birth, u.date_inscription,
    COUNT(DISTINCT p.id) as nb_paiements,
    COUNT(DISTINCT i.id) as nb_inscriptions,
    DATE(MAX(p.date_paiement)) as dernier_paiement
  FROM utilisateurs u
  LEFT JOIN paiements p ON u.id = p.utilisateur_id
  LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
  WHERE u.id = ?
  GROUP BY u.id
`;

/**
 * Tentatives d'authentification et de récupération
 */
export const COUNT_RECENT_RECOVERY_ATTEMPTS = `
  SELECT COUNT(*) as count
  FROM password_reset_attempts
  WHERE email = ? AND attempted_at > ?
`;

export const COUNT_RECENT_LOGIN_ATTEMPTS = `
  SELECT COUNT(*) as count
  FROM auth_attempts
  WHERE email = ? AND attempted_at > ?
`;

export const INSERT_RECOVERY_ATTEMPT = `
  INSERT INTO password_reset_attempts (email, success, attempted_at)
  VALUES (?, ?, ?)
`;

export const INSERT_AUTH_ATTEMPT = `
  INSERT INTO auth_attempts (email, success, attempted_at)
  VALUES (?, ?, ?)
`;

/**
 * Demandes de récupération manuelle
 */
export const CREATE_MANUAL_RECOVERY_REQUEST = `
  INSERT INTO manual_recovery_requests (
    user_id, reason, verification_data, status, created_at, expires_at
  ) VALUES (?, ?, ?, 'pending', ?, ?)
`;

export const GET_MANUAL_RECOVERY_REQUEST = `
  SELECT * FROM manual_recovery_requests
  WHERE user_id = ? AND status = 'pending' AND expires_at > ?
  ORDER BY created_at DESC
  LIMIT 1
`;

export const UPDATE_MANUAL_RECOVERY_STATUS = `
  UPDATE manual_recovery_requests
  SET status = ?, processed_at = ?
  WHERE id = ?
`;
