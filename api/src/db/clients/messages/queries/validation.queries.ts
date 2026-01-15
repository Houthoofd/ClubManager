/**
 * Requêtes SQL de validation pour le module Messages
 */

// ============================================================================
// VALIDATION DES TYPES DE MESSAGES
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
 * Vérifier si un type de message existe par nom
 */
export const CHECK_TYPE_MESSAGE_EXISTS_BY_NAME = `
  SELECT COUNT(*) as count
  FROM types_messages_personnalises
  WHERE nom_type = ?
`;

/**
 * Vérifier si un type de message est actif
 */
export const CHECK_TYPE_MESSAGE_IS_ACTIVE = `
  SELECT actif
  FROM types_messages_personnalises
  WHERE id = ?
`;

/**
 * Vérifier si un type de message a des messages associés
 */
export const CHECK_TYPE_MESSAGE_HAS_MESSAGES = `
  SELECT COUNT(*) as count
  FROM messages_personnalises
  WHERE type_id = ?
`;

// ============================================================================
// VALIDATION DES MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Vérifier si un message existe
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
  WHERE id = ? AND destinataire_id = ?
`;

/**
 * Vérifier si un message est déjà lu
 */
export const CHECK_MESSAGE_IS_READ = `
  SELECT lu
  FROM messages_personnalises
  WHERE id = ?
`;

/**
 * Vérifier si un message est supprimé
 */
export const CHECK_MESSAGE_IS_DELETED = `
  SELECT supprime
  FROM messages_personnalises
  WHERE id = ?
`;

/**
 * Vérifier si l'utilisateur peut envoyer un message
 */
export const CHECK_USER_CAN_SEND_MESSAGE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND status_id = 1
`;

/**
 * Vérifier si l'utilisateur peut recevoir un message
 */
export const CHECK_USER_CAN_RECEIVE_MESSAGE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND status_id = 1
`;

// ============================================================================
// VALIDATION DES UTILISATEURS
// ============================================================================

/**
 * Vérifier si un utilisateur existe
 */
export const CHECK_USER_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un utilisateur a un email valide
 */
export const CHECK_USER_HAS_VALID_EMAIL = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND email IS NOT NULL AND email != ''
`;

/**
 * Vérifier si un email existe
 */
export const CHECK_EMAIL_EXISTS = `
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
  WHERE id = ? AND status_id = 1
`;

// ============================================================================
// VALIDATION DE L'HISTORIQUE
// ============================================================================

/**
 * Vérifier si un message d'historique existe
 */
export const CHECK_HISTORIQUE_MESSAGE_EXISTS = `
  SELECT COUNT(*) as count
  FROM historique_messages
  WHERE id = ?
`;

/**
 * Vérifier si un message d'historique appartient à un utilisateur
 */
export const CHECK_HISTORIQUE_BELONGS_TO_USER = `
  SELECT COUNT(*) as count
  FROM historique_messages
  WHERE id = ? AND utilisateur_id = ?
`;

/**
 * Vérifier le statut d'un message d'historique
 */
export const CHECK_HISTORIQUE_MESSAGE_STATUS = `
  SELECT status_envoi
  FROM historique_messages
  WHERE id = ?
`;

// ============================================================================
// VALIDATION DES TEMPLATES
// ============================================================================

/**
 * Vérifier si un template existe par ID
 */
export const CHECK_TEMPLATE_EXISTS = `
  SELECT COUNT(*) as count
  FROM email_templates
  WHERE id = ?
`;

/**
 * Vérifier si un template existe par nom
 */
export const CHECK_TEMPLATE_EXISTS_BY_NAME = `
  SELECT COUNT(*) as count
  FROM email_templates
  WHERE nom_template = ?
`;

/**
 * Vérifier si un template est actif
 */
export const CHECK_TEMPLATE_IS_ACTIVE = `
  SELECT actif
  FROM email_templates
  WHERE id = ?
`;

/**
 * Vérifier si un template est actif par nom
 */
export const CHECK_TEMPLATE_IS_ACTIVE_BY_NAME = `
  SELECT actif
  FROM email_templates
  WHERE nom_template = ?
`;

// ============================================================================
// VALIDATION DES ÉCHEANCES (pour rappels de paiement)
// ============================================================================

/**
 * Vérifier si une échéance existe
 */
export const CHECK_ECHEANCE_EXISTS = `
  SELECT COUNT(*) as count
  FROM echeances
  WHERE id = ?
`;

/**
 * Vérifier si des échéances existent
 */
export const CHECK_ECHEANCES_EXIST = `
  SELECT COUNT(*) as count
  FROM echeances
  WHERE id IN (?)
`;

/**
 * Vérifier si une échéance appartient à un utilisateur
 */
export const CHECK_ECHEANCE_BELONGS_TO_USER = `
  SELECT COUNT(*) as count
  FROM echeances
  WHERE id = ? AND user_id = ?
`;

/**
 * Récupérer l'utilisateur d'une échéance
 */
export const GET_USER_FROM_ECHEANCE = `
  SELECT user_id
  FROM echeances
  WHERE id = ?
`;
