/**
 * Requêtes SQL de VALIDATION pour le module Cours
 * Responsabilité: Vérifications d'existence, contraintes, règles métier
 */

// ============================================================================
// QUERIES DE VÉRIFICATION D'EXISTENCE
// ============================================================================

/**
 * Vérifier si une inscription existe
 */
export const CHECK_INSCRIPTION_EXISTS = `
  SELECT COUNT(*) AS exists_count
  FROM inscriptions
  WHERE utilisateur_id = ?
    AND cours_id = ?
`;

/**
 * Vérifier si une inscription existe par ID
 */
export const CHECK_INSCRIPTION_EXISTS_BY_ID = `
  SELECT COUNT(*) AS exists_count
  FROM inscriptions
  WHERE id = ?
`;

/**
 * Vérifier si un cours existe
 */
export const CHECK_COURS_EXISTS = `
  SELECT COUNT(*) AS exists_count
  FROM cours
  WHERE id = ?
`;

/**
 * Vérifier si un cours récurrent existe
 */
export const CHECK_COURS_RECURRENT_EXISTS = `
  SELECT COUNT(*) AS exists_count
  FROM cours_recurrent
  WHERE id = ?
`;

/**
 * Vérifier si un professeur existe
 */
export const CHECK_PROFESSEUR_EXISTS = `
  SELECT COUNT(*) AS exists_count
  FROM professeurs
  WHERE id = ?
`;

/**
 * Vérifier si un professeur existe par nom
 */
export const CHECK_PROFESSEUR_EXISTS_BY_NAME = `
  SELECT COUNT(*) AS exists_count
  FROM professeurs
  WHERE nom = ? AND prenom = ?
`;

/**
 * Vérifier si un utilisateur existe et est actif
 */
export const CHECK_USER_EXISTS_AND_ACTIVE = `
  SELECT COUNT(*) AS exists_count
  FROM utilisateurs
  WHERE id = ?
    AND status_id = 1
`;

// ============================================================================
// QUERIES DE VÉRIFICATION DE RÈGLES MÉTIER
// ============================================================================

/**
 * Vérifier si un utilisateur peut s'inscrire à un cours
 * (pas déjà inscrit, cours actif, pas complet)
 */
export const CHECK_USER_CAN_REGISTER = `
  SELECT
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM inscriptions
        WHERE utilisateur_id = ?
          AND cours_id = ?
      ) THEN 'ALREADY_REGISTERED'
      WHEN NOT EXISTS (
        SELECT 1
        FROM cours
        WHERE id = ?
          AND actif = 1
      ) THEN 'COURS_INACTIVE'
      WHEN (
        SELECT COUNT(*)
        FROM inscriptions
        WHERE cours_id = ?
      ) >= (
        SELECT capacite_max
        FROM cours
        WHERE id = ?
      ) THEN 'COURS_FULL'
      ELSE 'CAN_REGISTER'
    END AS status
`;

/**
 * Vérifier si un cours est complet
 */
export const CHECK_COURS_IS_FULL = `
  SELECT
    c.capacite_max,
    COUNT(i.id) AS inscriptions_count,
    CASE
      WHEN COUNT(i.id) >= c.capacite_max THEN 1
      ELSE 0
    END AS is_full
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.id = ?
  GROUP BY c.id, c.capacite_max
`;

/**
 * Vérifier si une inscription est un doublon
 */
export const CHECK_DUPLICATE_INSCRIPTION = `
  SELECT
    id,
    utilisateur_id,
    cours_id,
    date_inscription
  FROM inscriptions
  WHERE utilisateur_id = ?
    AND cours_id = ?
  LIMIT 1
`;

/**
 * Vérifier si un cours récurrent existe déjà pour ce jour/horaire
 */
export const CHECK_DUPLICATE_COURS_RECURRENT = `
  SELECT COUNT(*) AS exists_count
  FROM cours_recurrent
  WHERE jour_semaine = ?
    AND heure_debut = ?
    AND heure_fin = ?
    AND type_cours = ?
    AND actif = 1
`;

/**
 * Vérifier si un cours existe déjà pour cette date/horaire
 */
export const CHECK_DUPLICATE_COURS = `
  SELECT COUNT(*) AS exists_count
  FROM cours
  WHERE date_cours = ?
    AND heure_debut = ?
    AND heure_fin = ?
    AND type_cours = ?
    AND actif = 1
`;

// ============================================================================
// QUERIES DE VALIDATION DE DATES
// ============================================================================

/**
 * Vérifier si une date de cours est valide (future ou aujourd'hui)
 */
export const VALIDATE_COURS_DATE = `
  SELECT
    CASE
      WHEN ? < CURDATE() THEN 'DATE_PASSED'
      WHEN ? > DATE_ADD(CURDATE(), INTERVAL 1 YEAR) THEN 'DATE_TOO_FAR'
      ELSE 'VALID'
    END AS status
`;

/**
 * Vérifier si un cours est dans le passé
 */
export const CHECK_COURS_IS_PAST = `
  SELECT
    CASE
      WHEN date_cours < CURDATE() THEN 1
      ELSE 0
    END AS is_past
  FROM cours
  WHERE id = ?
`;

/**
 * Vérifier si un utilisateur peut encore se désinscrire
 * (ex: minimum 24h avant le cours)
 */
export const CHECK_CAN_UNREGISTER = `
  SELECT
    c.date_cours,
    c.heure_debut,
    CASE
      WHEN CONCAT(c.date_cours, ' ', c.heure_debut) < DATE_ADD(NOW(), INTERVAL 24 HOUR)
      THEN 'TOO_LATE'
      ELSE 'CAN_UNREGISTER'
    END AS status
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE CAPACITÉ
// ============================================================================

/**
 * Vérifier la capacité restante d'un cours
 */
export const CHECK_COURS_CAPACITY = `
  SELECT
    c.id,
    c.capacite_max,
    COUNT(i.id) AS places_occupees,
    (c.capacite_max - COUNT(i.id)) AS places_restantes,
    CASE
      WHEN COUNT(i.id) >= c.capacite_max THEN 0
      ELSE 1
    END AS has_capacity
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.id = ?
  GROUP BY c.id, c.capacite_max
`;

/**
 * Vérifier si la capacité est valide (nombre positif)
 */
export const VALIDATE_CAPACITE = `
  SELECT
    CASE
      WHEN ? <= 0 THEN 'INVALID_NEGATIVE'
      WHEN ? > 100 THEN 'INVALID_TOO_HIGH'
      ELSE 'VALID'
    END AS status
`;

// ============================================================================
// QUERIES DE VALIDATION DE PROFESSEURS
// ============================================================================

/**
 * Vérifier si un professeur est déjà associé à un cours récurrent
 */
export const CHECK_PROFESSEUR_ALREADY_ASSIGNED = `
  SELECT COUNT(*) AS exists_count
  FROM professeurs_cours_recurrent
  WHERE cours_recurrent_id = ?
    AND professeur_id = ?
`;

/**
 * Vérifier si un professeur a un conflit d'horaire
 */
export const CHECK_PROFESSEUR_CONFLICT = `
  SELECT
    cr.id,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin
  FROM professeurs_cours_recurrent pcr
  INNER JOIN cours_recurrent cr ON pcr.cours_recurrent_id = cr.id
  WHERE pcr.professeur_id = ?
    AND cr.jour_semaine = ?
    AND cr.actif = 1
    AND (
      (cr.heure_debut <= ? AND cr.heure_fin > ?)
      OR (cr.heure_debut < ? AND cr.heure_fin >= ?)
      OR (cr.heure_debut >= ? AND cr.heure_fin <= ?)
    )
`;

// ============================================================================
// QUERIES DE VALIDATION D'HORAIRES
// ============================================================================

/**
 * Vérifier si les horaires sont valides (début < fin)
 */
export const VALIDATE_HORAIRES = `
  SELECT
    CASE
      WHEN ? >= ? THEN 'INVALID_ORDER'
      WHEN TIMEDIFF(?, ?) < '00:30:00' THEN 'TOO_SHORT'
      WHEN TIMEDIFF(?, ?) > '04:00:00' THEN 'TOO_LONG'
      ELSE 'VALID'
    END AS status
`;

/**
 * Vérifier s'il y a un conflit d'horaire pour un cours
 */
export const CHECK_HORAIRE_CONFLICT = `
  SELECT
    id,
    date_cours,
    type_cours,
    heure_debut,
    heure_fin
  FROM cours
  WHERE date_cours = ?
    AND actif = 1
    AND id != ?
    AND (
      (heure_debut <= ? AND heure_fin > ?)
      OR (heure_debut < ? AND heure_fin >= ?)
      OR (heure_debut >= ? AND heure_fin <= ?)
    )
`;

/**
 * Vérifier s'il y a un conflit d'horaire pour un cours récurrent
 */
export const CHECK_HORAIRE_CONFLICT_RECURRENT = `
  SELECT
    id,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin
  FROM cours_recurrent
  WHERE jour_semaine = ?
    AND actif = 1
    AND id != ?
    AND (
      (heure_debut <= ? AND heure_fin > ?)
      OR (heure_debut < ? AND heure_fin >= ?)
      OR (heure_debut >= ? AND heure_fin <= ?)
    )
`;

// ============================================================================
// QUERIES DE VALIDATION DE JOUR DE SEMAINE
// ============================================================================

/**
 * Valider un numéro de jour de semaine (0-6)
 */
export const VALIDATE_JOUR_SEMAINE = `
  SELECT
    CASE
      WHEN ? < 0 OR ? > 6 THEN 'INVALID'
      ELSE 'VALID'
    END AS status
`;

// ============================================================================
// QUERIES DE COMPTAGE POUR VALIDATION
// ============================================================================

/**
 * Compter les inscriptions actives d'un utilisateur
 */
export const COUNT_USER_ACTIVE_INSCRIPTIONS = `
  SELECT COUNT(*) AS count
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.utilisateur_id = ?
    AND c.date_cours >= CURDATE()
    AND c.actif = 1
`;

/**
 * Compter les cours d'un jour spécifique
 */
export const COUNT_COURS_BY_DAY = `
  SELECT COUNT(*) AS count
  FROM cours
  WHERE date_cours = ?
    AND actif = 1
`;

/**
 * Compter les cours récurrents d'un jour
 */
export const COUNT_COURS_RECURRENTS_BY_DAY = `
  SELECT COUNT(*) AS count
  FROM cours_recurrent
  WHERE jour_semaine = ?
    AND actif = 1
`;
