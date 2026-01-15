/**
 * Requêtes SQL de validation pour le module Paiements
 */

// ============================================================================
// VALIDATION DES PAIEMENTS
// ============================================================================

/**
 * Vérifier si un paiement existe
 */
export const CHECK_PAIEMENT_EXISTS = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE id = ?
`;

/**
 * Vérifier si un paiement existe par payment_intent_id
 */
export const CHECK_PAIEMENT_EXISTS_BY_INTENT = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE stripe_payment_intent_id = ?
`;

/**
 * Vérifier si un paiement appartient à un utilisateur
 */
export const CHECK_PAIEMENT_BELONGS_TO_USER = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE id = ? AND utilisateur_id = ?
`;

/**
 * Vérifier le statut d'un paiement
 */
export const CHECK_PAIEMENT_STATUS = `
  SELECT statut
  FROM paiements
  WHERE id = ?
`;

/**
 * Vérifier si un paiement peut être annulé
 */
export const CHECK_PAIEMENT_CAN_CANCEL = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE id = ? AND statut IN ('en_attente', 'valide')
`;

/**
 * Vérifier si un utilisateur a déjà payé
 */
export const CHECK_USER_HAS_PAIEMENTS = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE utilisateur_id = ? AND statut = 'valide'
`;

/**
 * Vérifier si c'est le premier paiement de l'utilisateur
 */
export const CHECK_IS_FIRST_PAIEMENT = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE utilisateur_id = ? AND statut = 'valide'
`;

// ============================================================================
// VALIDATION DES ÉCHÉANCES
// ============================================================================

/**
 * Vérifier si une échéance existe
 */
export const CHECK_ECHEANCE_EXISTS = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE id = ?
`;

/**
 * Vérifier si une échéance appartient à un utilisateur
 */
export const CHECK_ECHEANCE_BELONGS_TO_USER = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE id = ? AND utilisateur_id = ?
`;

/**
 * Vérifier le statut d'une échéance
 */
export const CHECK_ECHEANCE_STATUS = `
  SELECT statut
  FROM echeances_paiements
  WHERE id = ?
`;

/**
 * Vérifier si une échéance est déjà payée
 */
export const CHECK_ECHEANCE_IS_PAYEE = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE id = ? AND statut = 'payee'
`;

/**
 * Vérifier si une échéance peut être modifiée
 */
export const CHECK_ECHEANCE_CAN_MODIFY = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE id = ? AND statut = 'en_attente'
`;

/**
 * Vérifier si un utilisateur a des échéances en attente
 */
export const CHECK_USER_HAS_ECHEANCES_EN_ATTENTE = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE utilisateur_id = ? AND statut = 'en_attente'
`;

/**
 * Vérifier si un utilisateur a des échéances en retard
 */
export const CHECK_USER_HAS_ECHEANCES_EN_RETARD = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE utilisateur_id = ?
    AND statut = 'en_attente'
    AND date_echeance < CURDATE()
`;

// ============================================================================
// VALIDATION DES COMMANDES
// ============================================================================

/**
 * Vérifier si une commande existe
 */
export const CHECK_COMMANDE_EXISTS = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE id = ?
`;

/**
 * Vérifier si une commande appartient à un utilisateur
 */
export const CHECK_COMMANDE_BELONGS_TO_USER = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE id = ? AND utilisateur_id = ?
`;

/**
 * Vérifier le statut d'une commande
 */
export const CHECK_COMMANDE_STATUS = `
  SELECT statut
  FROM commandes
  WHERE id = ?
`;

/**
 * Vérifier si une commande a un paiement associé
 */
export const CHECK_COMMANDE_HAS_PAIEMENT = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE id = ? AND paiement_id IS NOT NULL
`;

/**
 * Vérifier si une commande peut être annulée
 */
export const CHECK_COMMANDE_CAN_CANCEL = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE id = ? AND statut IN ('en_attente', 'confirmee', 'en_preparation')
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
 * Vérifier si un utilisateur est actif
 */
export const CHECK_USER_IS_ACTIVE = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND status_id = 1
`;

/**
 * Vérifier le statut d'un utilisateur
 */
export const CHECK_USER_STATUS = `
  SELECT status_id
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un utilisateur a un abonnement
 */
export const CHECK_USER_HAS_ABONNEMENT = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ? AND abonnement_id IS NOT NULL
`;

// ============================================================================
// VALIDATION DES ABONNEMENTS
// ============================================================================

/**
 * Vérifier si un abonnement existe
 */
export const CHECK_ABONNEMENT_EXISTS = `
  SELECT COUNT(*) as count
  FROM plans_tarifaires
  WHERE id = ?
`;

/**
 * Vérifier si un abonnement est actif
 */
export const CHECK_ABONNEMENT_IS_ACTIVE = `
  SELECT COUNT(*) as count
  FROM plans_tarifaires
  WHERE id = ? AND actif = 1
`;

/**
 * Récupérer le prix d'un abonnement
 */
export const GET_ABONNEMENT_PRIX = `
  SELECT prix
  FROM plans_tarifaires
  WHERE id = ?
`;

// ============================================================================
// VALIDATION DES ARTICLES
// ============================================================================

/**
 * Vérifier si un article existe
 */
export const CHECK_ARTICLE_EXISTS = `
  SELECT COUNT(*) as count
  FROM articles
  WHERE id = ?
`;

/**
 * Vérifier si un article est disponible
 */
export const CHECK_ARTICLE_IS_AVAILABLE = `
  SELECT COUNT(*) as count
  FROM articles
  WHERE id = ? AND stock > 0
`;

/**
 * Récupérer le prix d'un article
 */
export const GET_ARTICLE_PRIX = `
  SELECT prix
  FROM articles
  WHERE id = ?
`;

/**
 * Vérifier le stock d'un article
 */
export const CHECK_ARTICLE_STOCK = `
  SELECT stock
  FROM articles
  WHERE id = ?
`;

// ============================================================================
// VALIDATION DES MONTANTS
// ============================================================================

/**
 * Vérifier le montant d'un paiement
 */
export const VERIFY_PAIEMENT_AMOUNT = `
  SELECT montant
  FROM paiements
  WHERE id = ?
`;

/**
 * Vérifier le montant d'une échéance
 */
export const VERIFY_ECHEANCE_AMOUNT = `
  SELECT montant
  FROM echeances_paiements
  WHERE id = ?
`;

/**
 * Vérifier le montant total d'une commande
 */
export const VERIFY_COMMANDE_TOTAL = `
  SELECT montant_total
  FROM commandes
  WHERE id = ?
`;

/**
 * Calculer le montant total des articles d'une commande
 */
export const CALCULATE_COMMANDE_TOTAL = `
  SELECT SUM(quantite * prix_unitaire) as total
  FROM articles_commandes
  WHERE commande_id = ?
`;

// ============================================================================
// VALIDATION STRIPE
// ============================================================================

/**
 * Vérifier si un payment_intent existe déjà
 */
export const CHECK_STRIPE_INTENT_EXISTS = `
  SELECT id, statut
  FROM paiements
  WHERE stripe_payment_intent_id = ?
`;

/**
 * Vérifier si un charge_id existe déjà
 */
export const CHECK_STRIPE_CHARGE_EXISTS = `
  SELECT id, statut
  FROM paiements
  WHERE stripe_charge_id = ?
`;

// ============================================================================
// VALIDATION DES DOUBLONS
// ============================================================================

/**
 * Vérifier les doublons de paiement par période
 */
export const CHECK_DUPLICATE_PAIEMENT_BY_PERIOD = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE utilisateur_id = ?
    AND abonnement_id = ?
    AND periode_debut = ?
    AND periode_fin = ?
`;

/**
 * Vérifier les doublons d'échéance par date
 */
export const CHECK_DUPLICATE_ECHEANCE_BY_DATE = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE utilisateur_id = ?
    AND abonnement_id = ?
    AND date_echeance = ?
`;
