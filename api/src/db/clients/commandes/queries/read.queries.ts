/**
 * Requêtes SQL de LECTURE pour le module Commandes
 * Responsabilité: Requêtes SELECT uniquement
 */

// ============================================================================
// QUERIES DE LECTURE BASIQUES
// ============================================================================

/**
 * Sélectionner toutes les commandes avec informations utilisateur
 */
export const SELECT_ALL_COMMANDES = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  ORDER BY c.date_commande DESC
`;

/**
 * Sélectionner une commande par son ID
 */
export const SELECT_COMMANDE_BY_ID = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.commande_id = ?
`;

/**
 * Sélectionner les commandes d'un utilisateur
 */
export const SELECT_COMMANDES_BY_USER_ID = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.utilisateur_id = ?
  ORDER BY c.date_commande DESC
`;

/**
 * Sélectionner les commandes par statut
 */
export const SELECT_COMMANDES_BY_STATUT = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.statut = ?
  ORDER BY c.date_commande DESC
`;

/**
 * Sélectionner une commande par payment_intent_id
 */
export const SELECT_COMMANDE_BY_PAYMENT_INTENT = `
  SELECT
    c.commande_id,
    c.utilisateur_id,
    c.statut,
    c.total,
    c.articles,
    c.date_commande,
    c.updated_at,
    c.payment_intent_id,
    u.nom_utilisateur,
    u.email
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.payment_intent_id = ?
`;

/**
 * Récupérer les commandes récentes d'un utilisateur (pour détection de fraude)
 */
export const SELECT_RECENT_USER_COMMANDES = `
  SELECT commande_id, total, date_commande
  FROM commandes
  WHERE utilisateur_id = ?
    AND date_commande >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
  ORDER BY date_commande DESC
`;
