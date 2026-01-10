/**
 * Requêtes SQL de lecture pour le module Inscription
 * Responsabilité: SELECT queries uniquement
 */

// ============================================================================
// QUERIES - COURS
// ============================================================================

/**
 * Récupérer tous les cours
 */
export const SELECT_ALL_COURS = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.cours_recurrent_id,
    c.created_at,
    c.updated_at
  FROM cours c
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

/**
 * Récupérer un cours par son ID
 */
export const SELECT_COURS_BY_ID = `
  SELECT
    id,
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    cours_recurrent_id,
    created_at,
    updated_at
  FROM cours
  WHERE id = ?
`;

/**
 * Récupérer les cours d'un participant
 */
export const SELECT_COURS_BY_PARTICIPANT = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin
  FROM cours c
  INNER JOIN inscriptions i ON c.id = i.cours_id
  WHERE i.utilisateur_id = ?
    AND c.date_cours >= CURDATE()
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

/**
 * Récupérer les cours d'une semaine spécifique
 */
export const SELECT_COURS_BY_SEMAINE = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin
  FROM cours c
  WHERE YEAR(c.date_cours) = ?
    AND WEEK(c.date_cours, 1) = ?
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

/**
 * Récupérer les semaines ayant des cours
 */
export const SELECT_SEMAINES_AVEC_COURS = `
  SELECT
    WEEK(date_cours, 1) as numero_semaine,
    YEAR(date_cours) as annee,
    MIN(date_cours) as date_debut,
    MAX(date_cours) as date_fin,
    COUNT(*) as nombre_cours
  FROM cours
  GROUP BY YEAR(date_cours), WEEK(date_cours, 1)
  ORDER BY annee DESC, numero_semaine DESC
`;

/**
 * Récupérer les cours avec leurs professeurs
 */
export const SELECT_COURS_WITH_PROFESSEURS = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    GROUP_CONCAT(
      CONCAT(u.id, ':', u.first_name, ' ', u.last_name)
      SEPARATOR ','
    ) as professeurs
  FROM cours c
  LEFT JOIN cours_professeurs cp ON c.id = cp.cours_id
  LEFT JOIN utilisateurs u ON cp.professeur_id = u.id
  GROUP BY c.id
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

// ============================================================================
// QUERIES - COURS RÉCURRENTS
// ============================================================================

/**
 * Récupérer tous les cours récurrents
 */
export const SELECT_ALL_COURS_RECURRENTS = `
  SELECT
    id,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    date_debut,
    date_fin,
    created_at,
    updated_at
  FROM cours_recurrents
  WHERE date_fin IS NULL OR date_fin >= CURDATE()
  ORDER BY jour_semaine ASC, heure_debut ASC
`;

/**
 * Récupérer un cours récurrent par ID
 */
export const SELECT_COURS_RECURRENT_BY_ID = `
  SELECT
    id,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    date_debut,
    date_fin,
    created_at,
    updated_at
  FROM cours_recurrents
  WHERE id = ?
`;

/**
 * Récupérer l'ID d'un cours récurrent par jour et horaire
 */
export const SELECT_COURS_RECURRENT_ID = `
  SELECT id
  FROM cours_recurrents
  WHERE jour_semaine = ?
    AND type_cours = ?
    AND heure_debut = ?
    AND heure_fin = ?
    AND (date_fin IS NULL OR date_fin >= CURDATE())
  LIMIT 1
`;

/**
 * Récupérer les jours de cours (vue récurrente)
 */
export const SELECT_JOURS_DE_COURS = `
  SELECT
    cr.id,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    cr.date_debut,
    cr.date_fin,
    GROUP_CONCAT(
      CONCAT(u.first_name, ' ', u.last_name)
      SEPARATOR ', '
    ) as professeurs
  FROM cours_recurrents cr
  LEFT JOIN cours_recurrents_professeurs crp ON cr.id = crp.cours_recurrent_id
  LEFT JOIN utilisateurs u ON crp.professeur_id = u.id
  WHERE cr.date_fin IS NULL OR cr.date_fin >= CURDATE()
  GROUP BY cr.id
  ORDER BY cr.jour_semaine ASC, cr.heure_debut ASC
`;

/**
 * Récupérer les jours de cours d'une semaine spécifique
 */
export const SELECT_JOURS_DE_COURS_BY_SEMAINE = `
  SELECT
    cr.id,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    cr.date_debut,
    cr.date_fin,
    GROUP_CONCAT(
      CONCAT(u.first_name, ' ', u.last_name)
      SEPARATOR ', '
    ) as professeurs
  FROM cours_recurrents cr
  LEFT JOIN cours_recurrents_professeurs crp ON cr.id = crp.cours_recurrent_id
  LEFT JOIN utilisateurs u ON crp.professeur_id = u.id
  WHERE cr.date_debut <= ?
    AND (cr.date_fin IS NULL OR cr.date_fin >= ?)
  GROUP BY cr.id
  ORDER BY cr.jour_semaine ASC, cr.heure_debut ASC
`;

// ============================================================================
// QUERIES - INSCRIPTIONS
// ============================================================================

/**
 * Récupérer toutes les inscriptions d'un cours
 */
export const SELECT_INSCRIPTIONS_BY_COURS = `
  SELECT
    i.id,
    i.cours_id,
    i.utilisateur_id,
    i.date_inscription,
    i.presence,
    i.est_valide,
    u.first_name as nom,
    u.last_name as prenom,
    u.email
  FROM inscriptions i
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  WHERE i.cours_id = ?
  ORDER BY i.date_inscription ASC
`;

/**
 * Récupérer les cours inscrits d'un utilisateur
 */
export const SELECT_COURS_INSCRITS_BY_UTILISATEUR = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    i.presence,
    i.date_inscription,
    i.est_valide,
    u.id as utilisateur_id,
    u.first_name as nom,
    u.last_name as prenom
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  WHERE i.utilisateur_id = ?
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

/**
 * Vérifier si un utilisateur est inscrit à un cours
 */
export const SELECT_VERIFY_INSCRIPTION = `
  SELECT
    i.id as inscriptionId,
    i.utilisateur_id as userId,
    i.cours_id,
    i.presence,
    i.est_valide
  FROM inscriptions i
  WHERE i.cours_id = ?
    AND i.utilisateur_id = ?
  LIMIT 1
`;

/**
 * Récupérer une inscription par ID
 */
export const SELECT_INSCRIPTION_BY_ID = `
  SELECT
    id,
    cours_id,
    utilisateur_id,
    date_inscription,
    presence,
    est_valide,
    created_at,
    updated_at
  FROM inscriptions
  WHERE id = ?
`;

// ============================================================================
// QUERIES - UTILISATEURS / PARTICIPANTS
// ============================================================================

/**
 * Récupérer l'ID d'un participant par nom et prénom
 */
export const SELECT_PARTICIPANT_ID_BY_NAME = `
  SELECT id
  FROM utilisateurs
  WHERE first_name = ?
    AND last_name = ?
  LIMIT 1
`;

/**
 * Récupérer les utilisateurs participants d'un cours
 */
export const SELECT_UTILISATEURS_BY_COURS = `
  SELECT
    u.id,
    u.last_name as nom,
    u.first_name as prenom,
    u.email,
    i.presence,
    i.date_inscription,
    i.est_valide
  FROM inscriptions i
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  WHERE i.cours_id = ?
  ORDER BY u.last_name ASC, u.first_name ASC
`;

/**
 * Vérifier si un participant existe
 */
export const SELECT_VERIFY_PARTICIPANT = `
  SELECT id
  FROM utilisateurs
  WHERE first_name = ?
    AND last_name = ?
  LIMIT 1
`;

// ============================================================================
// QUERIES - PROFESSEURS
// ============================================================================

/**
 * Récupérer les professeurs d'un cours
 */
export const SELECT_PROFESSEURS_BY_COURS = `
  SELECT
    u.id,
    u.first_name as prenom,
    u.last_name as nom,
    u.email
  FROM cours_professeurs cp
  INNER JOIN utilisateurs u ON cp.professeur_id = u.id
  WHERE cp.cours_id = ?
  ORDER BY u.last_name ASC, u.first_name ASC
`;

/**
 * Récupérer les professeurs d'un cours récurrent
 */
export const SELECT_PROFESSEURS_BY_COURS_RECURRENT = `
  SELECT
    u.id,
    u.first_name as prenom,
    u.last_name as nom,
    u.email
  FROM cours_recurrents_professeurs crp
  INNER JOIN utilisateurs u ON crp.professeur_id = u.id
  WHERE crp.cours_recurrent_id = ?
  ORDER BY u.last_name ASC, u.first_name ASC
`;

/**
 * Récupérer les IDs des professeurs par leurs noms
 */
export const SELECT_PROFESSEUR_IDS_BY_NAMES = `
  SELECT id
  FROM utilisateurs
  WHERE CONCAT(first_name, ' ', last_name) IN (?)
`;

// ============================================================================
// QUERIES - STATISTIQUES
// ============================================================================

/**
 * Statistiques de présence par cours
 */
export const SELECT_STATS_PRESENCE_BY_COURS = `
  SELECT
    c.id as cours_id,
    c.date_cours,
    c.type_cours,
    COUNT(i.id) as total_inscrits,
    SUM(CASE WHEN i.presence = 'present' THEN 1 ELSE 0 END) as presents,
    SUM(CASE WHEN i.presence = 'absent' THEN 1 ELSE 0 END) as absents,
    SUM(CASE WHEN i.presence = 'en_attente' OR i.presence IS NULL THEN 1 ELSE 0 END) as en_attente,
    ROUND(
      (SUM(CASE WHEN i.presence = 'present' THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) as taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.date_cours BETWEEN ? AND ?
  GROUP BY c.id
  ORDER BY c.date_cours DESC
`;

/**
 * Statistiques de présence par utilisateur
 */
export const SELECT_STATS_PRESENCE_BY_UTILISATEUR = `
  SELECT
    u.id as utilisateur_id,
    u.last_name as nom,
    u.first_name as prenom,
    COUNT(i.id) as total_cours,
    SUM(CASE WHEN i.presence = 'present' THEN 1 ELSE 0 END) as presents,
    SUM(CASE WHEN i.presence = 'absent' THEN 1 ELSE 0 END) as absents,
    SUM(CASE WHEN i.presence = 'en_attente' OR i.presence IS NULL THEN 1 ELSE 0 END) as en_attente,
    ROUND(
      (SUM(CASE WHEN i.presence = 'present' THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) as taux_presence
  FROM utilisateurs u
  INNER JOIN inscriptions i ON u.id = i.utilisateur_id
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE c.date_cours BETWEEN ? AND ?
  GROUP BY u.id
  ORDER BY u.last_name ASC, u.first_name ASC
`;

/**
 * Compter les inscriptions par cours
 */
export const SELECT_COUNT_INSCRIPTIONS_BY_COURS = `
  SELECT COUNT(*) as count
  FROM inscriptions
  WHERE cours_id = ?
`;

/**
 * Compter les cours d'un utilisateur
 */
export const SELECT_COUNT_COURS_BY_UTILISATEUR = `
  SELECT COUNT(*) as count
  FROM inscriptions
  WHERE utilisateur_id = ?
`;
