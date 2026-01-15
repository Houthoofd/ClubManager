/**
 * Requêtes SQL de VALIDATION pour le module Messagerie
 * Responsabilité: Vérification de l'existence et de la validité des données
 */

// ============================================================================
// QUERIES DE VALIDATION DES TYPES DE MESSAGES
// ============================================================================

/**
 * Vérifier si un type de message existe par ID
 */
export const CHECK_TYPE_MESSAGE_EXISTS = `
  SELECT COUNT(*) as count
  FROM types_messages_personnalises
  WHERE id = ?
`;

/**
 * Vérifier si un type de message existe par titre
 */
export const CHECK_TYPE_MESSAGE_EXISTS_BY_TITLE = `
  SELECT COUNT(*) as count
  FROM types_messages_personnalises
  WHERE title = ?
`;

/**
 * Vérifier si un type de message existe (autre que l'ID spécifié)
 */
export const CHECK_TYPE_MESSAGE_EXISTS_BY_TITLE_EXCLUDE_ID = `
  SELECT COUNT(*) as count
  FROM types_messages_personnalises
  WHERE title = ? AND id != ?
`;

// ============================================================================
// QUERIES DE VALIDATION DES MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Vérifier si un message existe par ID
 */
export const CHECK_MESSAGE_EXISTS = `
  SELECT COUNT(*) as count
  FROM messages_personnalises
  WHERE id = ?
`;

/**
 * Vérifier si un message appartient à un utilisateur
 */
export const CHECK_MESSAGE_BELONGS_TO_USER = `
  SELECT COUNT(*) as count
  FROM messages_personnalises
  WHERE id = ? AND utilisateur_id = ?
`;

/**
 * Vérifier si un utilisateur a des messages
 */
export const CHECK_USER_HAS_MESSAGES = `
  SELECT COUNT(*) as count
  FROM messages_personnalises
  WHERE utilisateur_id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DES UTILISATEURS
// ============================================================================

/**
 * Vérifier si un utilisateur existe par ID
 */
export const CHECK_USER_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un utilisateur existe par userId
 */
export const CHECK_USER_EXISTS_BY_USERID = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE userId = ?
`;

/**
 * Vérifier si un utilisateur existe par email
 */
export const CHECK_USER_EXISTS_BY_EMAIL = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE email = ?
`;

/**
 * Vérifier si un utilisateur est actif
 */
export const CHECK_USER_IS_ACTIVE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND active = TRUE
`;

// ============================================================================
// QUERIES DE VALIDATION DES TEMPLATES D'EMAIL
// ============================================================================

/**
 * Vérifier si un template d'email existe par ID
 */
export const CHECK_EMAIL_TEMPLATE_EXISTS = `
  SELECT COUNT(*) as count
  FROM email_templates
  WHERE id = ?
`;

/**
 * Vérifier si un template d'email existe par titre
 */
export const CHECK_EMAIL_TEMPLATE_EXISTS_BY_TITLE = `
  SELECT COUNT(*) as count
  FROM email_templates
  WHERE title = ?
`;

/**
 * Vérifier si un template d'email existe (autre que l'ID spécifié)
 */
export const CHECK_EMAIL_TEMPLATE_EXISTS_BY_TITLE_EXCLUDE_ID = `
  SELECT COUNT(*) as count
  FROM email_templates
  WHERE title = ? AND id != ?
`;

/**
 * Vérifier si un template est actif
 */
export const CHECK_EMAIL_TEMPLATE_IS_ACTIVE = `
  SELECT COUNT(*) as count
  FROM email_templates
  WHERE id = ? AND active = TRUE
`;

// ============================================================================
// QUERIES DE VALIDATION DE L'HISTORIQUE
// ============================================================================

/**
 * Vérifier si un message existe dans l'historique
 */
export const CHECK_HISTORIQUE_MESSAGE_EXISTS = `
  SELECT COUNT(*) as count
  FROM historique_messages
  WHERE id = ?
`;

/**
 * Vérifier si un message de l'historique appartient à un utilisateur
 */
export const CHECK_HISTORIQUE_MESSAGE_BELONGS_TO_USER = `
  SELECT COUNT(*) as count
  FROM historique_messages
  WHERE id = ? AND utilisateur_id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE COHÉRENCE
// ============================================================================

/**
 * Vérifier si tous les utilisateurs d'une liste existent
 */
export const CHECK_ALL_USERS_EXIST = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id IN (?)
`;

/**
 * Vérifier si tous les utilisateurs d'une liste sont actifs
 */
export const CHECK_ALL_USERS_ACTIVE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id IN (?) AND active = TRUE
`;
