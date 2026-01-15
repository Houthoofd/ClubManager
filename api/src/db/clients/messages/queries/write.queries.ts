/**
 * Requêtes SQL d'écriture pour le module Messages
 */

// ============================================================================
// TYPES DE MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Créer un nouveau type de message
 */
export const INSERT_TYPE_MESSAGE = `
  INSERT INTO types_messages_personnalises (
    nom_type,
    description,
    actif,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, NOW(), NOW())
`;

/**
 * Mettre à jour un type de message
 */
export const UPDATE_TYPE_MESSAGE = `
  UPDATE types_messages_personnalises
  SET
    nom_type = ?,
    description = ?,
    actif = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un type de message
 */
export const DELETE_TYPE_MESSAGE = `
  DELETE FROM types_messages_personnalises
  WHERE id = ?
`;

/**
 * Désactiver un type de message
 */
export const DEACTIVATE_TYPE_MESSAGE = `
  UPDATE types_messages_personnalises
  SET actif = 0, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Réactiver un type de message
 */
export const REACTIVATE_TYPE_MESSAGE = `
  UPDATE types_messages_personnalises
  SET actif = 1, updated_at = NOW()
  WHERE id = ?
`;

// ============================================================================
// MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Envoyer un message personnalisé
 */
export const INSERT_MESSAGE_PERSONNALISE = `
  INSERT INTO messages_personnalises (
    titre,
    contenu,
    type_id,
    expediteur_id,
    destinataire_id,
    lu,
    supprime,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, 0, 0, NOW(), NOW())
`;

/**
 * Marquer un message comme lu
 */
export const MARK_MESSAGE_AS_READ = `
  UPDATE messages_personnalises
  SET lu = 1, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Marquer un message comme non lu
 */
export const MARK_MESSAGE_AS_UNREAD = `
  UPDATE messages_personnalises
  SET lu = 0, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un message reçu (soft delete)
 */
export const SOFT_DELETE_MESSAGE = `
  UPDATE messages_personnalises
  SET supprime = 1, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Restaurer un message supprimé
 */
export const RESTORE_MESSAGE = `
  UPDATE messages_personnalises
  SET supprime = 0, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer définitivement un message
 */
export const DELETE_MESSAGE_PERMANENTLY = `
  DELETE FROM messages_personnalises
  WHERE id = ?
`;

/**
 * Désactiver un message (via type)
 */
export const DEACTIVATE_MESSAGE = `
  UPDATE types_messages_personnalises tmp
  INNER JOIN messages_personnalises mp ON mp.type_id = tmp.id
  SET tmp.actif = 0, tmp.updated_at = NOW()
  WHERE mp.id = ?
`;

/**
 * Réactiver un message (via type)
 */
export const REACTIVATE_MESSAGE = `
  UPDATE types_messages_personnalises tmp
  INNER JOIN messages_personnalises mp ON mp.type_id = tmp.id
  SET tmp.actif = 1, tmp.updated_at = NOW()
  WHERE mp.id = ?
`;

// ============================================================================
// HISTORIQUE DES MESSAGES (EMAILS)
// ============================================================================

/**
 * Sauvegarder un message dans l'historique
 */
export const INSERT_MESSAGE_HISTORIQUE = `
  INSERT INTO historique_messages (
    utilisateur_id,
    type_message,
    contenu,
    status_envoi,
    email_recipient,
    message_id,
    error_message,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`;

/**
 * Mettre à jour le statut d'un message dans l'historique
 */
export const UPDATE_MESSAGE_STATUS = `
  UPDATE historique_messages
  SET
    status_envoi = ?,
    message_id = ?,
    error_message = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un message de l'historique
 */
export const DELETE_MESSAGE_HISTORIQUE = `
  DELETE FROM historique_messages
  WHERE id = ?
`;

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Créer un nouveau template d'email
 */
export const INSERT_EMAIL_TEMPLATE = `
  INSERT INTO email_templates (
    nom_template,
    sujet,
    contenu_html,
    contenu_texte,
    variables_disponibles,
    actif,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
`;

/**
 * Mettre à jour un template d'email
 */
export const UPDATE_EMAIL_TEMPLATE = `
  UPDATE email_templates
  SET
    nom_template = ?,
    sujet = ?,
    contenu_html = ?,
    contenu_texte = ?,
    variables_disponibles = ?,
    actif = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un template d'email
 */
export const DELETE_EMAIL_TEMPLATE = `
  DELETE FROM email_templates
  WHERE id = ?
`;

/**
 * Désactiver un template d'email
 */
export const DEACTIVATE_EMAIL_TEMPLATE = `
  UPDATE email_templates
  SET actif = 0, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Réactiver un template d'email
 */
export const REACTIVATE_EMAIL_TEMPLATE = `
  UPDATE email_templates
  SET actif = 1, updated_at = NOW()
  WHERE id = ?
`;
