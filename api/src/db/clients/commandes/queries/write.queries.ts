/**
 * Requêtes SQL d'ÉCRITURE pour le module Commandes
 * Responsabilité: Requêtes INSERT, UPDATE, DELETE uniquement
 */

// ============================================================================
// QUERIES D'INSERTION (INSERT)
// ============================================================================

/**
 * Insérer une nouvelle commande
 */
export const INSERT_COMMANDE = `
  INSERT INTO commandes (
    commande_id,
    utilisateur_id,
    statut,
    total,
    articles,
    payment_intent_id,
    date_commande
  ) VALUES (?, ?, ?, ?, ?, ?, NOW())
`;

// ============================================================================
// QUERIES DE MISE À JOUR (UPDATE)
// ============================================================================

/**
 * Mettre à jour le statut d'une commande
 */
export const UPDATE_COMMANDE_STATUT = `
  UPDATE commandes
  SET statut = ?, updated_at = NOW()
  WHERE commande_id = ?
`;

/**
 * Mettre à jour le total d'une commande
 */
export const UPDATE_COMMANDE_TOTAL = `
  UPDATE commandes
  SET total = ?, updated_at = NOW()
  WHERE commande_id = ?
`;

/**
 * Mettre à jour les articles d'une commande
 */
export const UPDATE_COMMANDE_ARTICLES = `
  UPDATE commandes
  SET articles = ?, updated_at = NOW()
  WHERE commande_id = ?
`;

/**
 * Mettre à jour le payment_intent_id d'une commande
 */
export const UPDATE_COMMANDE_PAYMENT_INTENT = `
  UPDATE commandes
  SET payment_intent_id = ?, updated_at = NOW()
  WHERE commande_id = ?
`;

/**
 * Mettre à jour une commande (construction dynamique)
 * @param fields - Liste des champs à mettre à jour (ex: ['statut = ?', 'total = ?'])
 * @returns Requête SQL complète
 */
export const buildUpdateCommandeQuery = (fields: string[]): string => {
  const updates = [...fields, 'updated_at = NOW()'];
  return `UPDATE commandes SET ${updates.join(', ')} WHERE commande_id = ?`;
};

// ============================================================================
// QUERIES DE SUPPRESSION (DELETE)
// ============================================================================

/**
 * Supprimer une commande
 */
export const DELETE_COMMANDE = `
  DELETE FROM commandes
  WHERE commande_id = ?
`;

/**
 * Supprimer les commandes d'un utilisateur (utiliser avec précaution)
 */
export const DELETE_COMMANDES_BY_USER = `
  DELETE FROM commandes
  WHERE utilisateur_id = ?
`;

/**
 * Supprimer les commandes annulées de plus de X jours (nettoyage)
 */
export const DELETE_OLD_CANCELLED_COMMANDES = `
  DELETE FROM commandes
  WHERE statut = 'annulee'
    AND date_commande < DATE_SUB(NOW(), INTERVAL ? DAY)
`;
