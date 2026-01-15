/**
 * Requêtes SQL d'écriture pour le module Paiements
 */

// ============================================================================
// PAIEMENTS
// ============================================================================

/**
 * Créer un nouveau paiement
 */
export const INSERT_PAIEMENT = `
  INSERT INTO paiements (
    utilisateur_id,
    montant,
    date_paiement,
    methode_paiement,
    statut,
    stripe_payment_intent_id,
    stripe_charge_id,
    abonnement_id,
    commande_id,
    echeance_id,
    periode_debut,
    periode_fin,
    notes,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`;

/**
 * Créer un paiement pour une échéance
 */
export const INSERT_PAIEMENT_ECHEANCE = `
  INSERT INTO paiements (
    utilisateur_id,
    montant,
    date_paiement,
    methode_paiement,
    statut,
    stripe_payment_intent_id,
    abonnement_id,
    periode_debut,
    periode_fin,
    created_at,
    updated_at
  ) VALUES (?, ?, NOW(), ?, 'valide', ?, ?, ?, ?, NOW(), NOW())
`;

/**
 * Mettre à jour un paiement
 */
export const UPDATE_PAIEMENT = `
  UPDATE paiements
  SET
    montant = ?,
    methode_paiement = ?,
    statut = ?,
    stripe_payment_intent_id = ?,
    stripe_charge_id = ?,
    notes = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le statut d'un paiement
 */
export const UPDATE_PAIEMENT_STATUS = `
  UPDATE paiements
  SET statut = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour les informations Stripe d'un paiement
 */
export const UPDATE_PAIEMENT_STRIPE = `
  UPDATE paiements
  SET
    stripe_charge_id = ?,
    statut = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Annuler un paiement
 */
export const CANCEL_PAIEMENT = `
  UPDATE paiements
  SET statut = 'annule', updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un paiement
 */
export const DELETE_PAIEMENT = `
  DELETE FROM paiements
  WHERE id = ?
`;

/**
 * Enregistrer un paiement (version simplifiée)
 */
export const INSERT_PAIEMENT_SIMPLE = `
  INSERT INTO paiements (
    utilisateur_id,
    montant,
    date_paiement,
    methode_paiement,
    statut,
    created_at,
    updated_at
  ) VALUES (?, ?, NOW(), ?, 'valide', NOW(), NOW())
`;

// ============================================================================
// ÉCHÉANCES
// ============================================================================

/**
 * Créer une nouvelle échéance
 */
export const INSERT_ECHEANCE = `
  INSERT INTO echeances_paiements (
    utilisateur_id,
    montant,
    date_echeance,
    statut,
    description,
    abonnement_id,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
`;

/**
 * Mettre à jour une échéance
 */
export const UPDATE_ECHEANCE = `
  UPDATE echeances_paiements
  SET
    montant = ?,
    date_echeance = ?,
    statut = ?,
    description = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le statut d'une échéance
 */
export const UPDATE_ECHEANCE_STATUS = `
  UPDATE echeances_paiements
  SET statut = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Marquer une échéance comme payée
 */
export const MARK_ECHEANCE_PAYEE = `
  UPDATE echeances_paiements
  SET statut = 'payee', updated_at = NOW()
  WHERE id = ?
`;

/**
 * Marquer une échéance comme en retard
 */
export const MARK_ECHEANCE_EN_RETARD = `
  UPDATE echeances_paiements
  SET statut = 'en_retard', updated_at = NOW()
  WHERE id = ? AND statut = 'en_attente'
`;

/**
 * Annuler une échéance
 */
export const CANCEL_ECHEANCE = `
  UPDATE echeances_paiements
  SET statut = 'annulee', updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer une échéance
 */
export const DELETE_ECHEANCE = `
  DELETE FROM echeances_paiements
  WHERE id = ?
`;

// ============================================================================
// COMMANDES
// ============================================================================

/**
 * Créer une nouvelle commande
 */
export const INSERT_COMMANDE = `
  INSERT INTO commandes (
    utilisateur_id,
    montant_total,
    statut,
    date_commande,
    paiement_id,
    notes,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, NOW(), ?, ?, NOW(), NOW())
`;

/**
 * Mettre à jour une commande
 */
export const UPDATE_COMMANDE = `
  UPDATE commandes
  SET
    montant_total = ?,
    statut = ?,
    paiement_id = ?,
    notes = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le statut d'une commande
 */
export const UPDATE_COMMANDE_STATUS = `
  UPDATE commandes
  SET statut = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Lier un paiement à une commande
 */
export const UPDATE_COMMANDE_PAIEMENT = `
  UPDATE commandes
  SET paiement_id = ?, statut = 'confirmee', updated_at = NOW()
  WHERE id = ?
`;

/**
 * Annuler une commande
 */
export const CANCEL_COMMANDE = `
  UPDATE commandes
  SET statut = 'annulee', updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer une commande
 */
export const DELETE_COMMANDE = `
  DELETE FROM commandes
  WHERE id = ?
`;

// ============================================================================
// ARTICLES DE COMMANDE
// ============================================================================

/**
 * Ajouter un article à une commande
 */
export const INSERT_ARTICLE_COMMANDE = `
  INSERT INTO articles_commandes (
    commande_id,
    article_id,
    quantite,
    prix_unitaire,
    created_at
  ) VALUES (?, ?, ?, ?, NOW())
`;

/**
 * Mettre à jour un article de commande
 */
export const UPDATE_ARTICLE_COMMANDE = `
  UPDATE articles_commandes
  SET
    quantite = ?,
    prix_unitaire = ?
  WHERE id = ?
`;

/**
 * Supprimer un article de commande
 */
export const DELETE_ARTICLE_COMMANDE = `
  DELETE FROM articles_commandes
  WHERE id = ?
`;

/**
 * Supprimer tous les articles d'une commande
 */
export const DELETE_ARTICLES_BY_COMMANDE = `
  DELETE FROM articles_commandes
  WHERE commande_id = ?
`;

// ============================================================================
// UTILISATEURS (mise à jour statut)
// ============================================================================

/**
 * Mettre à jour le statut d'un utilisateur
 */
export const UPDATE_USER_STATUS = `
  UPDATE utilisateurs
  SET status_id = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour l'abonnement d'un utilisateur
 */
export const UPDATE_USER_ABONNEMENT = `
  UPDATE utilisateurs
  SET abonnement_id = ?, updated_at = NOW()
  WHERE id = ?
`;
