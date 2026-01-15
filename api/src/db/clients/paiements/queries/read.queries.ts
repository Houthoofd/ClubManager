/**
 * Requêtes SQL de lecture pour le module Paiements
 */

// ============================================================================
// PAIEMENTS
// ============================================================================

/**
 * Récupérer tous les paiements avec détails
 */
export const SELECT_ALL_PAIEMENTS = `
  SELECT
    p.id,
    p.utilisateur_id,
    p.montant,
    p.date_paiement,
    p.methode_paiement,
    p.statut,
    p.stripe_payment_intent_id,
    p.stripe_charge_id,
    p.abonnement_id,
    p.commande_id,
    p.echeance_id,
    p.periode_debut,
    p.periode_fin,
    p.notes,
    p.created_at,
    p.updated_at,
    u.first_name,
    u.last_name,
    pt.nom_plan
  FROM paiements p
  INNER JOIN utilisateurs u ON p.utilisateur_id = u.id
  LEFT JOIN plans_tarifaires pt ON p.abonnement_id = pt.id
  ORDER BY p.date_paiement DESC
`;

/**
 * Récupérer les paiements d'un utilisateur
 */
export const SELECT_PAIEMENTS_BY_USER = `
  SELECT
    p.id,
    p.utilisateur_id,
    p.montant,
    p.date_paiement,
    p.methode_paiement,
    p.statut,
    p.stripe_payment_intent_id,
    p.stripe_charge_id,
    p.abonnement_id,
    p.commande_id,
    p.echeance_id,
    p.periode_debut,
    p.periode_fin,
    p.notes,
    p.created_at,
    p.updated_at,
    u.first_name,
    u.last_name,
    pt.nom_plan
  FROM paiements p
  INNER JOIN utilisateurs u ON p.utilisateur_id = u.id
  LEFT JOIN plans_tarifaires pt ON p.abonnement_id = pt.id
  WHERE p.utilisateur_id = ?
  ORDER BY p.date_paiement DESC
`;

/**
 * Récupérer un paiement par ID
 */
export const SELECT_PAIEMENT_BY_ID = `
  SELECT
    p.id,
    p.utilisateur_id,
    p.montant,
    p.date_paiement,
    p.methode_paiement,
    p.statut,
    p.stripe_payment_intent_id,
    p.stripe_charge_id,
    p.abonnement_id,
    p.commande_id,
    p.echeance_id,
    p.periode_debut,
    p.periode_fin,
    p.notes,
    p.created_at,
    p.updated_at
  FROM paiements p
  WHERE p.id = ?
`;

/**
 * Récupérer les détails d'un paiement Stripe
 */
export const SELECT_PAIEMENT_STRIPE_DETAILS = `
  SELECT
    p.id as paiement_id,
    p.utilisateur_id,
    p.montant,
    p.statut,
    p.stripe_payment_intent_id,
    p.stripe_charge_id,
    p.echeance_id,
    e.statut as echeance_statut,
    u.first_name,
    u.last_name,
    u.email
  FROM paiements p
  INNER JOIN utilisateurs u ON p.utilisateur_id = u.id
  LEFT JOIN echeances_paiements e ON p.echeance_id = e.id
  WHERE p.stripe_payment_intent_id = ?
`;

/**
 * Récupérer les paiements par statut
 */
export const SELECT_PAIEMENTS_BY_STATUS = `
  SELECT
    p.id,
    p.utilisateur_id,
    p.montant,
    p.date_paiement,
    p.methode_paiement,
    p.statut,
    p.stripe_payment_intent_id,
    p.created_at,
    u.first_name,
    u.last_name
  FROM paiements p
  INNER JOIN utilisateurs u ON p.utilisateur_id = u.id
  WHERE p.statut = ?
  ORDER BY p.date_paiement DESC
`;

/**
 * Récupérer les paiements par méthode
 */
export const SELECT_PAIEMENTS_BY_METHOD = `
  SELECT
    p.id,
    p.utilisateur_id,
    p.montant,
    p.date_paiement,
    p.methode_paiement,
    p.statut,
    p.created_at,
    u.first_name,
    u.last_name
  FROM paiements p
  INNER JOIN utilisateurs u ON p.utilisateur_id = u.id
  WHERE p.methode_paiement = ?
  ORDER BY p.date_paiement DESC
`;

/**
 * Compter les paiements d'un utilisateur
 */
export const COUNT_PAIEMENTS_BY_USER = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE utilisateur_id = ?
`;

/**
 * Compter les paiements par statut
 */
export const COUNT_PAIEMENTS_BY_STATUS = `
  SELECT COUNT(*) as count
  FROM paiements
  WHERE statut = ?
`;

// ============================================================================
// ÉCHÉANCES
// ============================================================================

/**
 * Récupérer toutes les échéances avec détails utilisateur
 */
export const SELECT_ALL_ECHEANCES = `
  SELECT
    e.id,
    e.utilisateur_id,
    e.montant,
    e.date_echeance,
    e.statut,
    e.description,
    e.abonnement_id,
    e.created_at,
    e.updated_at,
    u.first_name,
    u.last_name,
    pt.nom_plan as abonnement_nom
  FROM echeances_paiements e
  INNER JOIN utilisateurs u ON e.utilisateur_id = u.id
  LEFT JOIN plans_tarifaires pt ON e.abonnement_id = pt.id
  ORDER BY e.date_echeance DESC
`;

/**
 * Récupérer les échéances d'un utilisateur
 */
export const SELECT_ECHEANCES_BY_USER = `
  SELECT
    e.id,
    e.utilisateur_id,
    e.montant,
    e.date_echeance,
    e.statut,
    e.description,
    e.abonnement_id,
    e.created_at,
    e.updated_at,
    u.first_name,
    u.last_name,
    pt.nom_plan as abonnement_nom
  FROM echeances_paiements e
  INNER JOIN utilisateurs u ON e.utilisateur_id = u.id
  LEFT JOIN plans_tarifaires pt ON e.abonnement_id = pt.id
  WHERE e.utilisateur_id = ?
  ORDER BY e.date_echeance DESC
`;

/**
 * Récupérer une échéance par ID
 */
export const SELECT_ECHEANCE_BY_ID = `
  SELECT
    e.id,
    e.utilisateur_id,
    e.montant,
    e.date_echeance,
    e.statut,
    e.description,
    e.abonnement_id,
    e.created_at,
    e.updated_at
  FROM echeances_paiements e
  WHERE e.id = ?
`;

/**
 * Récupérer les échéances par statut
 */
export const SELECT_ECHEANCES_BY_STATUS = `
  SELECT
    e.id,
    e.utilisateur_id,
    e.montant,
    e.date_echeance,
    e.statut,
    e.description,
    e.created_at,
    u.first_name,
    u.last_name
  FROM echeances_paiements e
  INNER JOIN utilisateurs u ON e.utilisateur_id = u.id
  WHERE e.statut = ?
  ORDER BY e.date_echeance ASC
`;

/**
 * Récupérer les échéances en attente d'un utilisateur
 */
export const SELECT_ECHEANCES_EN_ATTENTE_BY_USER = `
  SELECT
    e.id,
    e.utilisateur_id,
    e.montant,
    e.date_echeance,
    e.statut,
    e.description,
    e.abonnement_id,
    e.created_at
  FROM echeances_paiements e
  WHERE e.utilisateur_id = ?
    AND e.statut = 'en_attente'
  ORDER BY e.date_echeance ASC
`;

/**
 * Récupérer les échéances en retard
 */
export const SELECT_ECHEANCES_EN_RETARD = `
  SELECT
    e.id,
    e.utilisateur_id,
    e.montant,
    e.date_echeance,
    e.statut,
    e.description,
    e.created_at,
    u.first_name,
    u.last_name,
    u.email
  FROM echeances_paiements e
  INNER JOIN utilisateurs u ON e.utilisateur_id = u.id
  WHERE e.statut = 'en_attente'
    AND e.date_echeance < CURDATE()
  ORDER BY e.date_echeance ASC
`;

/**
 * Compter les échéances d'un utilisateur par statut
 */
export const COUNT_ECHEANCES_BY_USER_AND_STATUS = `
  SELECT COUNT(*) as count
  FROM echeances_paiements
  WHERE utilisateur_id = ? AND statut = ?
`;

// ============================================================================
// COMMANDES
// ============================================================================

/**
 * Récupérer toutes les commandes avec détails
 */
export const SELECT_ALL_COMMANDES = `
  SELECT
    c.id,
    c.utilisateur_id,
    c.montant_total,
    c.statut,
    c.date_commande,
    c.paiement_id,
    c.notes,
    c.created_at,
    c.updated_at,
    u.first_name,
    u.last_name
  FROM commandes c
  INNER JOIN utilisateurs u ON c.utilisateur_id = u.id
  ORDER BY c.date_commande DESC
`;

/**
 * Récupérer les commandes d'un utilisateur
 */
export const SELECT_COMMANDES_BY_USER = `
  SELECT
    c.id,
    c.utilisateur_id,
    c.montant_total,
    c.statut,
    c.date_commande,
    c.paiement_id,
    c.notes,
    c.created_at,
    c.updated_at
  FROM commandes c
  WHERE c.utilisateur_id = ?
  ORDER BY c.date_commande DESC
`;

/**
 * Récupérer une commande par ID
 */
export const SELECT_COMMANDE_BY_ID = `
  SELECT
    c.id,
    c.utilisateur_id,
    c.montant_total,
    c.statut,
    c.date_commande,
    c.paiement_id,
    c.notes,
    c.created_at,
    c.updated_at
  FROM commandes c
  WHERE c.id = ?
`;

/**
 * Récupérer les articles d'une commande
 */
export const SELECT_ARTICLES_BY_COMMANDE = `
  SELECT
    ac.id,
    ac.commande_id,
    ac.article_id,
    ac.quantite,
    ac.prix_unitaire,
    ac.created_at
  FROM articles_commandes ac
  WHERE ac.commande_id = ?
`;

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Obtenir les statistiques des paiements
 */
export const SELECT_STATISTIQUES_PAIEMENTS = `
  SELECT
    COUNT(*) as total_paiements,
    SUM(montant) as montant_total,
    AVG(montant) as moyenne_montant,
    SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as paiements_valides,
    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as paiements_en_attente,
    SUM(CASE WHEN statut = 'refuse' THEN 1 ELSE 0 END) as paiements_refuses
  FROM paiements
`;

/**
 * Obtenir les statistiques des paiements par utilisateur
 */
export const SELECT_STATISTIQUES_PAIEMENTS_BY_USER = `
  SELECT
    COUNT(*) as total_paiements,
    SUM(montant) as montant_total,
    AVG(montant) as moyenne_montant,
    MIN(date_paiement) as premier_paiement,
    MAX(date_paiement) as dernier_paiement
  FROM paiements
  WHERE utilisateur_id = ?
`;

/**
 * Obtenir les statistiques des échéances
 */
export const SELECT_STATISTIQUES_ECHEANCES = `
  SELECT
    COUNT(*) as total_echeances,
    SUM(montant) as montant_total,
    SUM(CASE WHEN statut = 'payee' THEN 1 ELSE 0 END) as echeances_payees,
    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as echeances_en_attente,
    SUM(CASE WHEN statut = 'en_retard' THEN 1 ELSE 0 END) as echeances_en_retard,
    SUM(CASE WHEN statut = 'en_attente' OR statut = 'en_retard' THEN montant ELSE 0 END) as montant_restant
  FROM echeances_paiements
`;

/**
 * Obtenir les statistiques des échéances par utilisateur
 */
export const SELECT_STATISTIQUES_ECHEANCES_BY_USER = `
  SELECT
    COUNT(*) as total_echeances,
    SUM(montant) as montant_total,
    SUM(CASE WHEN statut = 'payee' THEN montant ELSE 0 END) as montant_paye,
    SUM(CASE WHEN statut = 'en_attente' OR statut = 'en_retard' THEN montant ELSE 0 END) as montant_restant
  FROM echeances_paiements
  WHERE utilisateur_id = ?
`;

/**
 * Obtenir les paiements par méthode (statistiques)
 */
export const SELECT_PAIEMENTS_BY_METHOD_STATS = `
  SELECT
    methode_paiement,
    COUNT(*) as nombre,
    SUM(montant) as montant_total
  FROM paiements
  WHERE statut = 'valide'
  GROUP BY methode_paiement
  ORDER BY nombre DESC
`;

// ============================================================================
// UTILISATEURS (pour contexte)
// ============================================================================

/**
 * Récupérer le statut d'un utilisateur
 */
export const SELECT_USER_STATUS = `
  SELECT
    u.id,
    u.status_id,
    s.nom_role as status_name
  FROM utilisateurs u
  LEFT JOIN status s ON u.status_id = s.id
  WHERE u.id = ?
`;

/**
 * Récupérer l'ID du statut utilisateur par nom
 */
export const SELECT_STATUS_ID_BY_NAME = `
  SELECT id
  FROM status
  WHERE nom_role = ?
  LIMIT 1
`;
