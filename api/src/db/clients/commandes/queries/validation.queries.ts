/**
 * Requêtes SQL de VALIDATION pour le module Commandes
 * Responsabilité: Requêtes de vérification et validation uniquement
 */

// ============================================================================
// QUERIES DE VÉRIFICATION D'EXISTENCE
// ============================================================================

/**
 * Vérifier si une commande existe
 */
export const CHECK_COMMANDE_EXISTS = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE commande_id = ?
`;

/**
 * Vérifier si un utilisateur existe
 */
export const CHECK_USER_EXISTS = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un payment_intent_id existe déjà
 */
export const CHECK_PAYMENT_INTENT_EXISTS = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE payment_intent_id = ?
`;

/**
 * Vérifier si un utilisateur a déjà une commande en cours
 */
export const CHECK_USER_HAS_PENDING_COMMANDE = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE utilisateur_id = ?
    AND statut IN ('en_attente', 'confirmee', 'en_preparation')
`;

// ============================================================================
// QUERIES DE VALIDATION DE STATUT
// ============================================================================

/**
 * Vérifier si une commande est dans un statut donné
 */
export const CHECK_COMMANDE_STATUT = `
  SELECT statut
  FROM commandes
  WHERE commande_id = ?
`;

/**
 * Vérifier si une commande peut être annulée (pas déjà expédiée)
 */
export const CHECK_COMMANDE_CAN_BE_CANCELLED = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE commande_id = ?
    AND statut NOT IN ('expedie', 'livree', 'annulee', 'remboursee')
`;

/**
 * Vérifier si une commande peut être modifiée (pas encore confirmée)
 */
export const CHECK_COMMANDE_CAN_BE_MODIFIED = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE commande_id = ?
    AND statut = 'en_attente'
`;

/**
 * Vérifier si une commande peut être remboursée
 */
export const CHECK_COMMANDE_CAN_BE_REFUNDED = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE commande_id = ?
    AND statut IN ('confirmee', 'en_preparation', 'expedie', 'livree')
    AND payment_intent_id IS NOT NULL
`;

// ============================================================================
// QUERIES DE DÉTECTION DE FRAUDE
// ============================================================================

/**
 * Compter les commandes récentes d'un utilisateur (dernières X minutes)
 */
export const COUNT_RECENT_USER_COMMANDES = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE utilisateur_id = ?
    AND date_commande >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
`;

/**
 * Calculer le montant total des commandes récentes d'un utilisateur
 */
export const SUM_RECENT_USER_COMMANDES_TOTAL = `
  SELECT SUM(total) as total
  FROM commandes
  WHERE utilisateur_id = ?
    AND date_commande >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
    AND statut NOT IN ('annulee', 'remboursee')
`;

/**
 * Vérifier si un utilisateur a dépassé un seuil de commandes
 */
export const CHECK_USER_EXCEEDS_ORDER_LIMIT = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE utilisateur_id = ?
    AND date_commande >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    AND statut NOT IN ('annulee', 'remboursee')
  HAVING count > ?
`;

/**
 * Vérifier si un utilisateur a trop de commandes annulées
 */
export const CHECK_USER_HAS_TOO_MANY_CANCELLED = `
  SELECT
    COUNT(*) as total_commandes,
    SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as commandes_annulees,
    (SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) / COUNT(*) * 100) as taux_annulation
  FROM commandes
  WHERE utilisateur_id = ?
    AND date_commande >= DATE_SUB(NOW(), INTERVAL ? DAY)
  HAVING taux_annulation > ?
`;

/**
 * Détecter les tentatives de commandes multiples avec le même payment_intent
 */
export const CHECK_DUPLICATE_PAYMENT_INTENT = `
  SELECT COUNT(*) as count, GROUP_CONCAT(commande_id) as commande_ids
  FROM commandes
  WHERE payment_intent_id = ?
  HAVING count > 1
`;

// ============================================================================
// QUERIES DE VALIDATION MÉTIER
// ============================================================================

/**
 * Vérifier si un utilisateur est actif et peut commander
 */
export const CHECK_USER_CAN_ORDER = `
  SELECT COUNT(*) as count
  FROM utilisateurs
  WHERE id = ?
    AND status_id = 1
`;

/**
 * Vérifier la cohérence du total d'une commande
 */
export const CHECK_COMMANDE_TOTAL_CONSISTENCY = `
  SELECT
    c.commande_id,
    c.total as total_enregistre,
    SUM(JSON_EXTRACT(article.value, '$.prix_total')) as total_calcule
  FROM commandes c
  JOIN JSON_TABLE(
    c.articles,
    '$[*]' COLUMNS (
      value JSON PATH '$'
    )
  ) AS article
  WHERE c.commande_id = ?
  GROUP BY c.commande_id, c.total
  HAVING ABS(total_enregistre - total_calcule) > 0.01
`;

/**
 * Vérifier si les articles d'une commande sont valides (non vides)
 */
export const CHECK_COMMANDE_HAS_ARTICLES = `
  SELECT
    commande_id,
    articles,
    JSON_LENGTH(articles) as nombre_articles
  FROM commandes
  WHERE commande_id = ?
  HAVING nombre_articles = 0 OR articles IS NULL
`;

/**
 * Vérifier la validité d'un statut de commande
 */
export const CHECK_VALID_STATUT = (statut: string): boolean => {
  const validStatuts = [
    'en_attente',
    'confirmee',
    'en_preparation',
    'expedie',
    'livree',
    'annulee',
    'remboursee'
  ];
  return validStatuts.includes(statut);
};

// ============================================================================
// QUERIES DE VALIDATION DE TRANSITIONS DE STATUT
// ============================================================================

/**
 * Transitions de statut autorisées
 */
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  'en_attente': ['confirmee', 'annulee'],
  'confirmee': ['en_preparation', 'annulee', 'remboursee'],
  'en_preparation': ['expedie', 'annulee', 'remboursee'],
  'expedie': ['livree', 'remboursee'],
  'livree': ['remboursee'],
  'annulee': [], // État final
  'remboursee': [] // État final
};

/**
 * Vérifier si une transition de statut est valide
 */
export const isValidStatusTransition = (currentStatut: string, newStatut: string): boolean => {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatut];
  return allowedTransitions ? allowedTransitions.includes(newStatut) : false;
};

/**
 * Vérifier si un statut est final (ne peut plus changer)
 */
export const isFinalStatus = (statut: string): boolean => {
  return statut === 'annulee' || statut === 'remboursee' || statut === 'livree';
};

// ============================================================================
// QUERIES DE VALIDATION TEMPORELLE
// ============================================================================

/**
 * Vérifier si une commande est trop ancienne pour être modifiée
 */
export const CHECK_COMMANDE_TOO_OLD = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE commande_id = ?
    AND date_commande < DATE_SUB(NOW(), INTERVAL ? HOUR)
`;

/**
 * Vérifier si une commande est expirée (en attente depuis trop longtemps)
 */
export const CHECK_COMMANDE_EXPIRED = `
  SELECT COUNT(*) as count
  FROM commandes
  WHERE commande_id = ?
    AND statut = 'en_attente'
    AND date_commande < DATE_SUB(NOW(), INTERVAL ? HOUR)
`;

/**
 * Obtenir les commandes expirées à traiter
 */
export const SELECT_EXPIRED_COMMANDES = `
  SELECT commande_id, utilisateur_id, date_commande
  FROM commandes
  WHERE statut = 'en_attente'
    AND date_commande < DATE_SUB(NOW(), INTERVAL ? HOUR)
  LIMIT ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE MONTANTS
// ============================================================================

/**
 * Vérifier si un montant est valide (positif et raisonnable)
 */
export const CHECK_VALID_MONTANT = (montant: number): boolean => {
  return montant > 0 && montant <= 1000000; // Max 1 million
};

/**
 * Vérifier si un montant est suspect (très élevé)
 */
export const CHECK_SUSPICIOUS_MONTANT = (montant: number): boolean => {
  return montant > 10000; // Plus de 10k € est suspect
};

/**
 * Obtenir le montant moyen des commandes d'un utilisateur
 */
export const SELECT_USER_AVERAGE_ORDER_AMOUNT = `
  SELECT AVG(total) as montant_moyen
  FROM commandes
  WHERE utilisateur_id = ?
    AND statut NOT IN ('annulee', 'remboursee')
    AND date_commande >= DATE_SUB(NOW(), INTERVAL ? DAY)
`;

/**
 * Vérifier si un montant dévie trop de la moyenne de l'utilisateur
 */
export const CHECK_MONTANT_DEVIATION = `
  SELECT
    ? as montant_actuel,
    AVG(total) as montant_moyen,
    STDDEV(total) as ecart_type,
    (? - AVG(total)) / NULLIF(STDDEV(total), 0) as z_score
  FROM commandes
  WHERE utilisateur_id = ?
    AND statut NOT IN ('annulee', 'remboursee')
    AND date_commande >= DATE_SUB(NOW(), INTERVAL ? DAY)
  HAVING ABS(z_score) > 3
`;

// ============================================================================
// QUERIES DE VALIDATION D'INTÉGRITÉ
// ============================================================================

/**
 * Vérifier l'intégrité référentielle (commande -> utilisateur)
 */
export const CHECK_REFERENTIAL_INTEGRITY = `
  SELECT c.commande_id
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.commande_id = ?
    AND u.id IS NULL
`;

/**
 * Détecter les commandes orphelines (utilisateur supprimé)
 */
export const SELECT_ORPHANED_COMMANDES = `
  SELECT c.commande_id, c.utilisateur_id, c.date_commande
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE u.id IS NULL
  LIMIT ?
`;

/**
 * Vérifier les doublons potentiels (même utilisateur, même total, même date)
 */
export const CHECK_POTENTIAL_DUPLICATES = `
  SELECT
    c1.commande_id,
    c2.commande_id as duplicate_id,
    c1.total,
    c1.date_commande
  FROM commandes c1
  JOIN commandes c2 ON
    c1.utilisateur_id = c2.utilisateur_id
    AND c1.total = c2.total
    AND ABS(TIMESTAMPDIFF(SECOND, c1.date_commande, c2.date_commande)) < 60
    AND c1.commande_id != c2.commande_id
  WHERE c1.commande_id = ?
`;
