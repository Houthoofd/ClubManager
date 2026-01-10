/**
 * Requêtes SQL de validation pour le module Inscription
 * Responsabilité: Queries de vérification et validation uniquement
 */

// ============================================================================
// QUERIES - VALIDATION COURS
// ============================================================================

/**
 * Vérifier si un cours existe
 */
export const CHECK_COURS_EXISTS = `
  SELECT EXISTS(
    SELECT 1 FROM cours WHERE id = ?
  ) as exists_flag
`;

/**
 * Vérifier si un cours récurrent existe
 */
export const CHECK_COURS_RECURRENT_EXISTS = `
  SELECT EXISTS(
    SELECT 1 FROM cours_recurrents WHERE id = ?
  ) as exists_flag
`;

/**
 * Vérifier si un cours existe à une date donnée
 */
export const CHECK_COURS_EXISTS_BY_DATE = `
  SELECT EXISTS(
    SELECT 1
    FROM cours
    WHERE date_cours = ?
      AND type_cours = ?
      AND heure_debut = ?
      AND heure_fin = ?
  ) as exists_flag
`;

/**
 * Vérifier si un cours récurrent existe pour un jour donné
 */
export const CHECK_COURS_RECURRENT_EXISTS_BY_JOUR = `
  SELECT EXISTS(
    SELECT 1
    FROM cours_recurrents
    WHERE jour_semaine = ?
      AND type_cours = ?
      AND heure_debut = ?
      AND heure_fin = ?
      AND (date_fin IS NULL OR date_fin >= CURDATE())
  ) as exists_flag
`;

/**
 * Vérifier si un cours a des inscriptions
 */
export const CHECK_COURS_HAS_INSCRIPTIONS = `
  SELECT EXISTS(
    SELECT 1 FROM inscriptions WHERE cours_id = ?
  ) as has_inscriptions
`;

/**
 * Vérifier si un cours récurrent a des cours générés
 */
export const CHECK_COURS_RECURRENT_HAS_COURS = `
  SELECT EXISTS(
    SELECT 1 FROM cours WHERE cours_recurrent_id = ?
  ) as has_cours
`;

/**
 * Vérifier si un cours est complet (capacité max atteinte)
 */
export const CHECK_COURS_IS_FULL = `
  SELECT
    (SELECT COUNT(*) FROM inscriptions WHERE cours_id = ?) >= COALESCE(
      (SELECT capacite_max FROM cours WHERE id = ?),
      999999
    ) as is_full
`;

// ============================================================================
// QUERIES - VALIDATION INSCRIPTIONS
// ============================================================================

/**
 * Vérifier si une inscription existe
 */
export const CHECK_INSCRIPTION_EXISTS = `
  SELECT EXISTS(
    SELECT 1 FROM inscriptions WHERE id = ?
  ) as exists_flag
`;

/**
 * Vérifier si un utilisateur est déjà inscrit à un cours
 */
export const CHECK_USER_INSCRIT_TO_COURS = `
  SELECT EXISTS(
    SELECT 1
    FROM inscriptions
    WHERE cours_id = ?
      AND utilisateur_id = ?
  ) as is_inscrit
`;

/**
 * Vérifier si un utilisateur peut s'inscrire (pas de conflit horaire)
 */
export const CHECK_USER_CAN_INSCRIT = `
  SELECT EXISTS(
    SELECT 1
    FROM inscriptions i
    INNER JOIN cours c1 ON i.cours_id = c1.id
    INNER JOIN cours c2 ON c2.id = ?
    WHERE i.utilisateur_id = ?
      AND c1.date_cours = c2.date_cours
      AND (
        (c1.heure_debut <= c2.heure_debut AND c1.heure_fin > c2.heure_debut)
        OR
        (c1.heure_debut < c2.heure_fin AND c1.heure_fin >= c2.heure_fin)
        OR
        (c1.heure_debut >= c2.heure_debut AND c1.heure_fin <= c2.heure_fin)
      )
  ) as has_conflict
`;

/**
 * Vérifier si une inscription est validée
 */
export const CHECK_INSCRIPTION_IS_VALIDE = `
  SELECT est_valide
  FROM inscriptions
  WHERE id = ?
`;

/**
 * Compter le nombre d'inscriptions d'un utilisateur
 */
export const COUNT_INSCRIPTIONS_BY_USER = `
  SELECT COUNT(*) as count
  FROM inscriptions
  WHERE utilisateur_id = ?
`;

/**
 * Compter le nombre d'inscriptions actives d'un utilisateur
 */
export const COUNT_INSCRIPTIONS_ACTIVES_BY_USER = `
  SELECT COUNT(*) as count
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.utilisateur_id = ?
    AND c.date_cours >= CURDATE()
    AND i.est_valide = 1
`;

// ============================================================================
// QUERIES - VALIDATION UTILISATEURS
// ============================================================================

/**
 * Vérifier si un utilisateur existe
 */
export const CHECK_UTILISATEUR_EXISTS = `
  SELECT EXISTS(
    SELECT 1 FROM utilisateurs WHERE id = ?
  ) as exists_flag
`;

/**
 * Vérifier si un utilisateur existe par nom et prénom
 */
export const CHECK_UTILISATEUR_EXISTS_BY_NAME = `
  SELECT EXISTS(
    SELECT 1
    FROM utilisateurs
    WHERE first_name = ?
      AND last_name = ?
  ) as exists_flag
`;

/**
 * Vérifier si un utilisateur est actif
 */
export const CHECK_UTILISATEUR_IS_ACTIVE = `
  SELECT status_id = 1 as is_active
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un utilisateur a un abonnement valide
 */
export const CHECK_UTILISATEUR_HAS_ABONNEMENT = `
  SELECT
    abonnement_id IS NOT NULL AND abonnement_id > 0 as has_abonnement
  FROM utilisateurs
  WHERE id = ?
`;

// ============================================================================
// QUERIES - VALIDATION PROFESSEURS
// ============================================================================

/**
 * Vérifier si un professeur existe
 */
export const CHECK_PROFESSEUR_EXISTS = `
  SELECT EXISTS(
    SELECT 1
    FROM utilisateurs
    WHERE id = ?
      AND status_id IN (2, 3)
  ) as exists_flag
`;

/**
 * Vérifier si un professeur est assigné à un cours
 */
export const CHECK_PROFESSEUR_ASSIGNED_TO_COURS = `
  SELECT EXISTS(
    SELECT 1
    FROM cours_professeurs
    WHERE cours_id = ?
      AND professeur_id = ?
  ) as is_assigned
`;

/**
 * Vérifier si un professeur est assigné à un cours récurrent
 */
export const CHECK_PROFESSEUR_ASSIGNED_TO_COURS_RECURRENT = `
  SELECT EXISTS(
    SELECT 1
    FROM cours_recurrents_professeurs
    WHERE cours_recurrent_id = ?
      AND professeur_id = ?
  ) as is_assigned
`;

/**
 * Vérifier si un professeur a un conflit horaire
 */
export const CHECK_PROFESSEUR_HAS_CONFLICT = `
  SELECT EXISTS(
    SELECT 1
    FROM cours_professeurs cp
    INNER JOIN cours c1 ON cp.cours_id = c1.id
    INNER JOIN cours c2 ON c2.id = ?
    WHERE cp.professeur_id = ?
      AND c1.date_cours = c2.date_cours
      AND (
        (c1.heure_debut <= c2.heure_debut AND c1.heure_fin > c2.heure_debut)
        OR
        (c1.heure_debut < c2.heure_fin AND c1.heure_fin >= c2.heure_fin)
      )
  ) as has_conflict
`;

/**
 * Compter le nombre de cours d'un professeur
 */
export const COUNT_COURS_BY_PROFESSEUR = `
  SELECT COUNT(DISTINCT cp.cours_id) as count
  FROM cours_professeurs cp
  INNER JOIN cours c ON cp.cours_id = c.id
  WHERE cp.professeur_id = ?
    AND c.date_cours >= CURDATE()
`;

// ============================================================================
// QUERIES - VALIDATION DATES ET HORAIRES
// ============================================================================

/**
 * Vérifier si une date est dans le futur
 */
export const CHECK_DATE_IS_FUTURE = `
  SELECT ? >= CURDATE() as is_future
`;

/**
 * Vérifier si une date est dans le passé
 */
export const CHECK_DATE_IS_PAST = `
  SELECT ? < CURDATE() as is_past
`;

/**
 * Vérifier si une plage horaire est valide (heure_debut < heure_fin)
 */
export const CHECK_TIME_RANGE_IS_VALID = `
  SELECT ? < ? as is_valid
`;

/**
 * Vérifier si une date est un jour de semaine valide
 */
export const CHECK_WEEKDAY_IS_VALID = `
  SELECT ? BETWEEN 0 AND 6 as is_valid
`;

// ============================================================================
// QUERIES - VALIDATION BUSINESS RULES
// ============================================================================

/**
 * Vérifier si un cours peut être supprimé (pas d'inscriptions validées)
 */
export const CHECK_COURS_CAN_BE_DELETED = `
  SELECT NOT EXISTS(
    SELECT 1
    FROM inscriptions
    WHERE cours_id = ?
      AND est_valide = 1
  ) as can_delete
`;

/**
 * Vérifier si un cours récurrent peut être supprimé
 */
export const CHECK_COURS_RECURRENT_CAN_BE_DELETED = `
  SELECT NOT EXISTS(
    SELECT 1
    FROM cours c
    INNER JOIN inscriptions i ON c.id = i.cours_id
    WHERE c.cours_recurrent_id = ?
      AND c.date_cours >= CURDATE()
      AND i.est_valide = 1
  ) as can_delete
`;

/**
 * Vérifier si une inscription peut être modifiée (cours pas encore passé)
 */
export const CHECK_INSCRIPTION_CAN_BE_MODIFIED = `
  SELECT c.date_cours >= CURDATE() as can_modify
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.id = ?
`;

/**
 * Vérifier le délai d'annulation (24h avant le cours)
 */
export const CHECK_CANCELLATION_DEADLINE = `
  SELECT
    TIMESTAMPDIFF(HOUR, NOW(), CONCAT(c.date_cours, ' ', c.heure_debut)) >= 24 as can_cancel
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.id = ?
`;

/**
 * Vérifier si l'utilisateur a atteint sa limite d'inscriptions
 */
export const CHECK_USER_INSCRIPTION_LIMIT = `
  SELECT
    COUNT(*) < COALESCE(
      (SELECT limite_inscriptions FROM parametres LIMIT 1),
      10
    ) as under_limit
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.utilisateur_id = ?
    AND c.date_cours >= CURDATE()
    AND i.est_valide = 1
`;
