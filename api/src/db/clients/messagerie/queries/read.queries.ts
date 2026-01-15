/**
 * Requêtes SQL de LECTURE pour le module Messagerie
 * Responsabilité: Requêtes SELECT uniquement
 */

// ============================================================================
// QUERIES DE LECTURE DES TYPES DE MESSAGES
// ============================================================================

/**
 * Sélectionner tous les types de messages
 */
export const SELECT_ALL_TYPES_MESSAGES = `
  SELECT
    id,
    title,
    content,
    created_at,
    updated_at
  FROM types_messages_personnalises
  ORDER BY title
`;

/**
 * Sélectionner un type de message par ID
 */
export const SELECT_TYPE_MESSAGE_BY_ID = `
  SELECT
    id,
    title,
    content,
    created_at,
    updated_at
  FROM types_messages_personnalises
  WHERE id = ?
`;

/**
 * Sélectionner un type de message par titre
 */
export const SELECT_TYPE_MESSAGE_BY_TITLE = `
  SELECT
    id,
    title,
    content,
    created_at,
    updated_at
  FROM types_messages_personnalises
  WHERE title = ?
`;

// ============================================================================
// QUERIES DE LECTURE DES MESSAGES PERSONNALISÉS
// ============================================================================

/**
 * Sélectionner tous les messages personnalisés d'un utilisateur
 */
export const SELECT_MESSAGES_BY_USER = `
  SELECT
    mp.id,
    mp.contenu as content,
    mp.created_at as date_reception,
    'Système' as expediteur_prenom,
    'Club Manager' as expediteur_nom,
    'Message personnalisé' as title,
    FALSE as lu
  FROM messages_personnalises mp
  WHERE mp.utilisateur_id = ?
  ORDER BY mp.created_at DESC
`;

/**
 * Sélectionner un message personnalisé par ID
 */
export const SELECT_MESSAGE_BY_ID = `
  SELECT
    id,
    utilisateur_id,
    contenu,
    created_at,
    updated_at
  FROM messages_personnalises
  WHERE id = ?
`;

/**
 * Sélectionner les messages non lus d'un utilisateur
 * Note: Nécessite l'ajout d'un champ 'lu' dans la table
 */
export const SELECT_MESSAGES_NON_LUS = `
  SELECT
    mp.id,
    mp.contenu as content,
    mp.created_at as date_reception,
    'Système' as expediteur_prenom,
    'Club Manager' as expediteur_nom,
    'Message personnalisé' as title
  FROM messages_personnalises mp
  WHERE mp.utilisateur_id = ?
  ORDER BY mp.created_at DESC
`;

// ============================================================================
// QUERIES DE LECTURE DES UTILISATEURS
// ============================================================================

/**
 * Récupérer l'ID numérique d'un utilisateur à partir de son userId
 */
export const SELECT_USER_ID_FROM_USERID = `
  SELECT id
  FROM utilisateurs
  WHERE userId = ?
`;

/**
 * Sélectionner tous les utilisateurs actifs
 */
export const SELECT_ALL_ACTIVE_USERS = `
  SELECT
    id,
    userId,
    CONCAT(first_name, ' ', last_name) as full_name,
    first_name,
    last_name,
    email,
    s.nom_role as status
  FROM utilisateurs u
  LEFT JOIN status s ON u.status_id = s.id
  WHERE active = TRUE
  ORDER BY first_name, last_name
`;

/**
 * Sélectionner un utilisateur par ID
 */
export const SELECT_USER_BY_ID = `
  SELECT
    id,
    userId,
    CONCAT(first_name, ' ', last_name) as full_name,
    first_name,
    last_name,
    email
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Sélectionner un utilisateur par email
 */
export const SELECT_USER_BY_EMAIL = `
  SELECT
    id,
    userId,
    first_name,
    last_name,
    email
  FROM utilisateurs
  WHERE email = ?
`;

// ============================================================================
// QUERIES DE LECTURE DES TEMPLATES D'EMAIL
// ============================================================================

/**
 * Sélectionner tous les templates d'email
 */
export const SELECT_ALL_EMAIL_TEMPLATES = `
  SELECT
    id,
    title,
    subject,
    content_text,
    content_html,
    variables,
    category,
    active,
    created_at,
    updated_at
  FROM email_templates
  ORDER BY category, title
`;

/**
 * Sélectionner un template d'email par ID
 */
export const SELECT_EMAIL_TEMPLATE_BY_ID = `
  SELECT
    id,
    title,
    subject,
    content_text,
    content_html,
    variables,
    category,
    active,
    created_at,
    updated_at
  FROM email_templates
  WHERE id = ?
`;

/**
 * Sélectionner un template d'email par titre
 */
export const SELECT_EMAIL_TEMPLATE_BY_TITLE = `
  SELECT
    id,
    title,
    subject,
    content_text,
    content_html,
    variables,
    category,
    active,
    created_at,
    updated_at
  FROM email_templates
  WHERE title = ?
`;

/**
 * Sélectionner les templates actifs
 */
export const SELECT_ACTIVE_EMAIL_TEMPLATES = `
  SELECT
    id,
    title,
    subject,
    content_text,
    content_html,
    variables,
    category,
    active,
    created_at,
    updated_at
  FROM email_templates
  WHERE active = TRUE
  ORDER BY category, title
`;

/**
 * Sélectionner les templates par catégorie
 */
export const SELECT_EMAIL_TEMPLATES_BY_CATEGORY = `
  SELECT
    id,
    title,
    subject,
    content_text,
    content_html,
    variables,
    category,
    active,
    created_at,
    updated_at
  FROM email_templates
  WHERE category = ?
  ORDER BY title
`;

// ============================================================================
// QUERIES DE LECTURE DE L'HISTORIQUE DES MESSAGES
// ============================================================================

/**
 * Sélectionner l'historique des messages
 */
export const SELECT_HISTORIQUE_MESSAGES = `
  SELECT
    hm.id,
    hm.utilisateur_id,
    hm.type_message,
    hm.sujet,
    hm.contenu,
    hm.recipients,
    hm.status,
    hm.error_message,
    hm.created_at,
    hm.sent_at,
    u.email as user_email,
    CONCAT(u.first_name, ' ', u.last_name) as user_name
  FROM historique_messages hm
  LEFT JOIN utilisateurs u ON u.id = hm.utilisateur_id
  ORDER BY hm.created_at DESC
  LIMIT ?
`;

/**
 * Sélectionner l'historique des messages d'un utilisateur
 */
export const SELECT_HISTORIQUE_MESSAGES_BY_USER = `
  SELECT
    hm.id,
    hm.utilisateur_id,
    hm.type_message,
    hm.sujet,
    hm.contenu,
    hm.recipients,
    hm.status,
    hm.error_message,
    hm.created_at,
    hm.sent_at,
    u.email as user_email,
    CONCAT(u.first_name, ' ', u.last_name) as user_name
  FROM historique_messages hm
  LEFT JOIN utilisateurs u ON u.id = hm.utilisateur_id
  WHERE hm.utilisateur_id = ?
  ORDER BY hm.created_at DESC
  LIMIT ?
`;

/**
 * Sélectionner l'historique des messages par statut
 */
export const SELECT_HISTORIQUE_MESSAGES_BY_STATUS = `
  SELECT
    hm.id,
    hm.utilisateur_id,
    hm.type_message,
    hm.sujet,
    hm.contenu,
    hm.recipients,
    hm.status,
    hm.error_message,
    hm.created_at,
    hm.sent_at,
    u.email as user_email,
    CONCAT(u.first_name, ' ', u.last_name) as user_name
  FROM historique_messages hm
  LEFT JOIN utilisateurs u ON u.id = hm.utilisateur_id
  WHERE hm.status = ?
  ORDER BY hm.created_at DESC
  LIMIT ?
`;

/**
 * Sélectionner un message de l'historique par ID
 */
export const SELECT_HISTORIQUE_MESSAGE_BY_ID = `
  SELECT
    hm.id,
    hm.utilisateur_id,
    hm.type_message,
    hm.sujet,
    hm.contenu,
    hm.recipients,
    hm.status,
    hm.error_message,
    hm.created_at,
    hm.sent_at,
    u.email as user_email,
    CONCAT(u.first_name, ' ', u.last_name) as user_name
  FROM historique_messages hm
  LEFT JOIN utilisateurs u ON u.id = hm.utilisateur_id
  WHERE hm.id = ?
`;

// ============================================================================
// QUERIES STATISTIQUES
// ============================================================================

/**
 * Compter le total de types de messages
 */
export const COUNT_TOTAL_TYPES_MESSAGES = `
  SELECT COUNT(*) as count
  FROM types_messages_personnalises
`;

/**
 * Compter le total de messages envoyés
 */
export const COUNT_TOTAL_MESSAGES_ENVOYES = `
  SELECT COUNT(*) as count
  FROM messages_personnalises
`;

/**
 * Compter les messages d'un utilisateur
 */
export const COUNT_MESSAGES_BY_USER = `
  SELECT COUNT(*) as count
  FROM messages_personnalises
  WHERE utilisateur_id = ?
`;

/**
 * Statistiques des messages par jour (derniers 7 jours)
 */
export const SELECT_MESSAGES_PAR_JOUR = `
  SELECT
    DATE(created_at) as date,
    COUNT(*) as count
  FROM messages_personnalises
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  GROUP BY DATE(created_at)
  ORDER BY date DESC
`;

/**
 * Statistiques des messages par type
 */
export const SELECT_MESSAGES_PAR_TYPE = `
  SELECT
    type_message,
    COUNT(*) as count
  FROM historique_messages
  GROUP BY type_message
  ORDER BY count DESC
`;

/**
 * Statistiques des messages par statut
 */
export const SELECT_MESSAGES_PAR_STATUT = `
  SELECT
    status,
    COUNT(*) as count
  FROM historique_messages
  GROUP BY status
  ORDER BY count DESC
`;

/**
 * Taux de succès d'envoi
 */
export const SELECT_TAUX_SUCCES = `
  SELECT
    SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as succes,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as echecs,
    COUNT(*) as total
  FROM historique_messages
  WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
`;
