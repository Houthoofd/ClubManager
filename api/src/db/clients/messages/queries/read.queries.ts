/**
 * Requêtes SQL de lecture pour le module Messages
 */

// ============================================================================
// TYPES DE MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Récupérer tous les types de messages
 */
export const SELECT_ALL_TYPES_MESSAGES = `
  SELECT
    id,
    nom_type,
    description,
    actif,
    created_at,
    updated_at
  FROM types_messages_personnalises
  WHERE actif = 1
  ORDER BY nom_type ASC
`;

/**
 * Récupérer un type de message par ID
 */
export const SELECT_TYPE_MESSAGE_BY_ID = `
  SELECT
    id,
    nom_type,
    description,
    actif,
    created_at,
    updated_at
  FROM types_messages_personnalises
  WHERE id = ?
`;

/**
 * Récupérer un type de message par nom
 */
export const SELECT_TYPE_MESSAGE_BY_NAME = `
  SELECT
    id,
    nom_type,
    description,
    actif,
    created_at,
    updated_at
  FROM types_messages_personnalises
  WHERE nom_type = ?
`;

// ============================================================================
// MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Récupérer les messages reçus par un utilisateur
 */
export const SELECT_MESSAGES_RECUS_PAR_UTILISATEUR = `
  SELECT
    mp.id,
    mp.titre,
    mp.contenu,
    mp.type_id,
    mp.expediteur_id,
    mp.destinataire_id,
    mp.lu,
    mp.supprime,
    mp.created_at,
    mp.updated_at,
    tmp.nom_type as type_nom,
    exp.first_name as expediteur_prenom,
    exp.last_name as expediteur_nom,
    dest.first_name as destinataire_prenom,
    dest.last_name as destinataire_nom
  FROM messages_personnalises mp
  INNER JOIN types_messages_personnalises tmp ON mp.type_id = tmp.id
  INNER JOIN utilisateurs exp ON mp.expediteur_id = exp.id
  INNER JOIN utilisateurs dest ON mp.destinataire_id = dest.id
  WHERE mp.destinataire_id = ?
    AND mp.supprime = 0
    AND tmp.actif = 1
  ORDER BY mp.created_at DESC
`;

/**
 * Récupérer un message personnalisé par ID
 */
export const SELECT_MESSAGE_PERSONNALISE_BY_ID = `
  SELECT
    mp.id,
    mp.titre,
    mp.contenu,
    mp.type_id,
    mp.expediteur_id,
    mp.destinataire_id,
    mp.lu,
    mp.supprime,
    mp.created_at,
    mp.updated_at
  FROM messages_personnalises mp
  WHERE mp.id = ?
`;

/**
 * Récupérer les messages avec détails complets
 */
export const SELECT_MESSAGE_WITH_DETAILS = `
  SELECT
    mp.id,
    mp.titre,
    mp.contenu,
    mp.lu,
    mp.supprime,
    mp.created_at,
    tmp.nom_type as type_nom,
    exp.first_name as expediteur_prenom,
    exp.last_name as expediteur_nom,
    dest.first_name as destinataire_prenom,
    dest.last_name as destinataire_nom
  FROM messages_personnalises mp
  INNER JOIN types_messages_personnalises tmp ON mp.type_id = tmp.id
  INNER JOIN utilisateurs exp ON mp.expediteur_id = exp.id
  INNER JOIN utilisateurs dest ON mp.destinataire_id = dest.id
  WHERE mp.id = ?
`;

/**
 * Compter les messages non lus d'un utilisateur
 */
export const COUNT_MESSAGES_NON_LUS = `
  SELECT COUNT(*) as count
  FROM messages_personnalises mp
  INNER JOIN types_messages_personnalises tmp ON mp.type_id = tmp.id
  WHERE mp.destinataire_id = ?
    AND mp.lu = 0
    AND mp.supprime = 0
    AND tmp.actif = 1
`;

/**
 * Récupérer les messages inactifs
 */
export const SELECT_MESSAGES_INACTIFS = `
  SELECT
    mp.id,
    mp.titre,
    mp.contenu,
    mp.type_id,
    mp.expediteur_id,
    mp.destinataire_id,
    mp.lu,
    mp.supprime,
    mp.created_at,
    mp.updated_at,
    tmp.nom_type as type_nom
  FROM messages_personnalises mp
  INNER JOIN types_messages_personnalises tmp ON mp.type_id = tmp.id
  WHERE tmp.actif = 0
    AND mp.supprime = 0
  ORDER BY mp.created_at DESC
`;

/**
 * Récupérer les messages supprimés
 */
export const SELECT_MESSAGES_SUPPRIMES = `
  SELECT
    mp.id,
    mp.titre,
    mp.contenu,
    mp.type_id,
    mp.expediteur_id,
    mp.destinataire_id,
    mp.lu,
    mp.supprime,
    mp.created_at,
    mp.updated_at,
    tmp.nom_type as type_nom,
    exp.first_name as expediteur_prenom,
    exp.last_name as expediteur_nom,
    dest.first_name as destinataire_prenom,
    dest.last_name as destinataire_nom
  FROM messages_personnalises mp
  INNER JOIN types_messages_personnalises tmp ON mp.type_id = tmp.id
  INNER JOIN utilisateurs exp ON mp.expediteur_id = exp.id
  INNER JOIN utilisateurs dest ON mp.destinataire_id = dest.id
  WHERE mp.supprime = 1
  ORDER BY mp.updated_at DESC
`;

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Obtenir les statistiques des messages
 */
export const SELECT_STATISTIQUES_MESSAGES = `
  SELECT
    COUNT(*) as total,
    SUM(CASE WHEN mp.supprime = 0 THEN 1 ELSE 0 END) as envoyes,
    SUM(CASE WHEN mp.lu = 1 AND mp.supprime = 0 THEN 1 ELSE 0 END) as lus,
    SUM(CASE WHEN mp.lu = 0 AND mp.supprime = 0 THEN 1 ELSE 0 END) as non_lus,
    SUM(CASE WHEN mp.supprime = 1 THEN 1 ELSE 0 END) as supprimes
  FROM messages_personnalises mp
`;

/**
 * Obtenir les statistiques de suppression
 */
export const SELECT_STATISTIQUES_SUPPRESSIONS = `
  SELECT
    COUNT(*) as total_supprimes,
    MAX(updated_at) as derniere_suppression
  FROM messages_personnalises
  WHERE supprime = 1
`;

// ============================================================================
// HISTORIQUE DES MESSAGES (EMAILS)
// ============================================================================

/**
 * Récupérer l'historique des messages d'un utilisateur
 */
export const SELECT_MESSAGE_HISTORY = `
  SELECT
    id,
    utilisateur_id,
    type_message,
    contenu,
    status_envoi,
    email_recipient,
    message_id,
    error_message,
    created_at,
    updated_at
  FROM historique_messages
  WHERE utilisateur_id = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`;

/**
 * Récupérer un message de l'historique par ID
 */
export const SELECT_HISTORIQUE_MESSAGE_BY_ID = `
  SELECT
    id,
    utilisateur_id,
    type_message,
    contenu,
    status_envoi,
    email_recipient,
    message_id,
    error_message,
    created_at,
    updated_at
  FROM historique_messages
  WHERE id = ?
`;

/**
 * Récupérer l'historique par type de message
 */
export const SELECT_HISTORIQUE_BY_TYPE = `
  SELECT
    id,
    utilisateur_id,
    type_message,
    contenu,
    status_envoi,
    email_recipient,
    message_id,
    error_message,
    created_at,
    updated_at
  FROM historique_messages
  WHERE type_message = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`;

/**
 * Récupérer l'historique par status
 */
export const SELECT_HISTORIQUE_BY_STATUS = `
  SELECT
    id,
    utilisateur_id,
    type_message,
    contenu,
    status_envoi,
    email_recipient,
    message_id,
    error_message,
    created_at,
    updated_at
  FROM historique_messages
  WHERE status_envoi = ?
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`;

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Récupérer tous les templates actifs
 */
export const SELECT_ALL_TEMPLATES = `
  SELECT
    id,
    nom_template,
    sujet,
    contenu_html,
    contenu_texte,
    variables_disponibles,
    actif,
    created_at,
    updated_at
  FROM email_templates
  WHERE actif = 1
  ORDER BY nom_template ASC
`;

/**
 * Récupérer un template par nom
 */
export const SELECT_TEMPLATE_BY_NAME = `
  SELECT
    id,
    nom_template,
    sujet,
    contenu_html,
    contenu_texte,
    variables_disponibles,
    actif,
    created_at,
    updated_at
  FROM email_templates
  WHERE nom_template = ? AND actif = 1
`;

/**
 * Récupérer un template par ID
 */
export const SELECT_TEMPLATE_BY_ID = `
  SELECT
    id,
    nom_template,
    sujet,
    contenu_html,
    contenu_texte,
    variables_disponibles,
    actif,
    created_at,
    updated_at
  FROM email_templates
  WHERE id = ?
`;

// ============================================================================
// UTILISATEURS (pour emails)
// ============================================================================

/**
 * Récupérer les emails des destinataires
 */
export const SELECT_EMAILS_DESTINATAIRES = `
  SELECT
    id,
    email,
    first_name,
    last_name,
    nom_utilisateur
  FROM utilisateurs
  WHERE id IN (?)
    AND email IS NOT NULL
    AND email != ''
`;

/**
 * Récupérer un utilisateur avec email
 */
export const SELECT_UTILISATEUR_WITH_EMAIL = `
  SELECT
    id,
    email,
    first_name,
    last_name,
    nom_utilisateur
  FROM utilisateurs
  WHERE id = ?
    AND email IS NOT NULL
    AND email != ''
`;
