/**
 * Requêtes SQL d'ÉCRITURE pour le module Messagerie
 * Responsabilité: Requêtes INSERT, UPDATE, DELETE uniquement
 */

// ============================================================================
// QUERIES D'ÉCRITURE DES TYPES DE MESSAGES
// ============================================================================

/**
 * Insérer un nouveau type de message
 */
export const INSERT_TYPE_MESSAGE = `
  INSERT INTO types_messages_personnalises (title, content)
  VALUES (?, ?)
`;

/**
 * Mettre à jour un type de message
 */
export const UPDATE_TYPE_MESSAGE = `
  UPDATE types_messages_personnalises
  SET title = ?, content = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un type de message
 */
export const DELETE_TYPE_MESSAGE = `
  DELETE FROM types_messages_personnalises
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'ÉCRITURE DES MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Insérer un nouveau message personnalisé
 */
export const INSERT_MESSAGE_PERSONNALISE = `
  INSERT INTO messages_personnalises (utilisateur_id, contenu)
  VALUES (?, ?)
`;

/**
 * Insérer plusieurs messages personnalisés en batch
 */
export const INSERT_MESSAGES_PERSONNALISES_BATCH = `
  INSERT INTO messages_personnalises (utilisateur_id, contenu)
  VALUES ?
`;

/**
 * Marquer un message comme lu
 * Note: Nécessite l'ajout d'un champ 'lu' dans la table
 */
export const UPDATE_MESSAGE_LU = `
  UPDATE messages_personnalises
  SET lu = TRUE, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un message personnalisé
 */
export const DELETE_MESSAGE_PERSONNALISE = `
  DELETE FROM messages_personnalises
  WHERE id = ?
`;

/**
 * Supprimer les messages d'un utilisateur
 */
export const DELETE_MESSAGES_BY_USER = `
  DELETE FROM messages_personnalises
  WHERE utilisateur_id = ?
`;

/**
 * Supprimer les anciens messages
 */
export const DELETE_OLD_MESSAGES = `
  DELETE FROM messages_personnalises
  WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

// ============================================================================
// QUERIES D'ÉCRITURE DES TEMPLATES D'EMAIL
// ============================================================================

/**
 * Insérer un nouveau template d'email
 */
export const INSERT_EMAIL_TEMPLATE = `
  INSERT INTO email_templates (
    title,
    subject,
    content_text,
    content_html,
    variables,
    category,
    active
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

/**
 * Mettre à jour un template d'email
 */
export const UPDATE_EMAIL_TEMPLATE = `
  UPDATE email_templates
  SET
    title = ?,
    subject = ?,
    content_text = ?,
    content_html = ?,
    variables = ?,
    category = ?,
    active = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour partiellement un template d'email
 */
export const UPDATE_EMAIL_TEMPLATE_PARTIAL = `
  UPDATE email_templates
  SET updated_at = NOW()
`;

/**
 * Activer/Désactiver un template d'email
 */
export const UPDATE_EMAIL_TEMPLATE_STATUS = `
  UPDATE email_templates
  SET active = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un template d'email
 */
export const DELETE_EMAIL_TEMPLATE = `
  DELETE FROM email_templates
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'ÉCRITURE DE L'HISTORIQUE DES MESSAGES
// ============================================================================

/**
 * Insérer un message dans l'historique
 */
export const INSERT_HISTORIQUE_MESSAGE = `
  INSERT INTO historique_messages (
    utilisateur_id,
    type_message,
    sujet,
    contenu,
    recipients,
    status,
    error_message
  )
  VALUES (?, ?, ?, ?, ?, ?, ?)
`;

/**
 * Mettre à jour le statut d'un message dans l'historique
 */
export const UPDATE_HISTORIQUE_MESSAGE_STATUS = `
  UPDATE historique_messages
  SET
    status = ?,
    error_message = ?,
    sent_at = CASE WHEN ? = 'sent' THEN NOW() ELSE sent_at END
  WHERE id = ?
`;

/**
 * Marquer un message comme envoyé
 */
export const UPDATE_HISTORIQUE_MESSAGE_SENT = `
  UPDATE historique_messages
  SET status = 'sent', sent_at = NOW()
  WHERE id = ?
`;

/**
 * Marquer un message comme échoué
 */
export const UPDATE_HISTORIQUE_MESSAGE_FAILED = `
  UPDATE historique_messages
  SET status = 'failed', error_message = ?
  WHERE id = ?
`;

/**
 * Supprimer un message de l'historique
 */
export const DELETE_HISTORIQUE_MESSAGE = `
  DELETE FROM historique_messages
  WHERE id = ?
`;

/**
 * Supprimer les anciens messages de l'historique
 */
export const DELETE_OLD_HISTORIQUE_MESSAGES = `
  DELETE FROM historique_messages
  WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

/**
 * Nettoyer les messages en échec de plus de X jours
 */
export const DELETE_FAILED_HISTORIQUE_MESSAGES = `
  DELETE FROM historique_messages
  WHERE status = 'failed'
    AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

// ============================================================================
// QUERIES DE MAINTENANCE
// ============================================================================

/**
 * Archiver les anciens messages
 * Note: Nécessite une table d'archive
 */
export const ARCHIVE_OLD_MESSAGES = `
  INSERT INTO messages_personnalises_archive
  SELECT * FROM messages_personnalises
  WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

/**
 * Réinitialiser les statuts des messages en attente depuis trop longtemps
 */
export const RESET_STUCK_MESSAGES = `
  UPDATE historique_messages
  SET status = 'failed',
      error_message = 'Timeout: Message resté en attente trop longtemps'
  WHERE status = 'pending'
    AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
`;
