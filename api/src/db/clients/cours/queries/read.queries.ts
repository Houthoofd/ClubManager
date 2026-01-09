/**
 * Requêtes SQL de LECTURE pour le module Cours
 * Responsabilité: Requêtes SELECT uniquement
 */

// ============================================================================
// QUERIES DE LECTURE BASIQUES - COURS
// ============================================================================

/**
 * Sélectionner tous les cours
 */
export const SELECT_ALL_COURS = `
  SELECT
    id,
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    description,
    actif,
    created_at,
    updated_at
  FROM cours
  WHERE actif = 1
  ORDER BY date_cours DESC, heure_debut ASC
`;

/**
 * Sélectionner un cours par son ID
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
    capacite_max,
    description,
    actif,
    created_at,
    updated_at
  FROM cours
  WHERE id = ?
`;

/**
 * Sélectionner les cours d'une semaine spécifique
 */
export const SELECT_COURS_BY_WEEK = `
  SELECT
    id,
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    description,
    actif
  FROM cours
  WHERE WEEK(date_cours, 1) = ?
    AND YEAR(date_cours) = ?
    AND actif = 1
  ORDER BY date_cours ASC, heure_debut ASC
`;

/**
 * Sélectionner les cours entre deux dates
 */
export const SELECT_COURS_BY_DATE_RANGE = `
  SELECT
    id,
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    description,
    actif
  FROM cours
  WHERE date_cours BETWEEN ? AND ?
    AND actif = 1
  ORDER BY date_cours ASC, heure_debut ASC
`;

/**
 * Sélectionner les cours futurs
 */
export const SELECT_COURS_FUTURS = `
  SELECT
    id,
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    description,
    actif
  FROM cours
  WHERE date_cours >= CURDATE()
    AND actif = 1
  ORDER BY date_cours ASC, heure_debut ASC
  LIMIT ?
`;

/**
 * Sélectionner un cours avec tous ses détails et professeurs
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
    c.capacite_max,
    c.description,
    c.actif,
    GROUP_CONCAT(
      CONCAT(p.id, ':', p.nom, ':', p.prenom)
      SEPARATOR '|'
    ) AS professeurs
  FROM cours c
  LEFT JOIN cours_recurrent cr ON c.jour_semaine = cr.jour_semaine
    AND c.type_cours = cr.type_cours
    AND c.heure_debut = cr.heure_debut
  LEFT JOIN professeurs_cours_recurrent pcr ON cr.id = pcr.cours_recurrent_id
  LEFT JOIN professeurs p ON pcr.professeur_id = p.id
  WHERE c.id = ?
  GROUP BY c.id
`;

/**
 * Sélectionner tous les cours avec professeurs
 */
export const SELECT_ALL_COURS_WITH_PROFESSEURS = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.capacite_max,
    GROUP_CONCAT(
      CONCAT(p.id, ':', p.nom, ':', p.prenom)
      SEPARATOR '|'
    ) AS professeurs
  FROM cours c
  LEFT JOIN cours_recurrent cr ON c.jour_semaine = cr.jour_semaine
    AND c.type_cours = cr.type_cours
    AND c.heure_debut = cr.heure_debut
  LEFT JOIN professeurs_cours_recurrent pcr ON cr.id = pcr.cours_recurrent_id
  LEFT JOIN professeurs p ON pcr.professeur_id = p.id
  WHERE c.actif = 1
  GROUP BY c.id
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

// ============================================================================
// QUERIES DE LECTURE - COURS RÉCURRENTS
// ============================================================================

/**
 * Sélectionner tous les cours récurrents
 */
export const SELECT_ALL_COURS_RECURRENTS = `
  SELECT
    id,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    actif,
    created_at
  FROM cours_recurrent
  WHERE actif = 1
  ORDER BY jour_semaine ASC, heure_debut ASC
`;

/**
 * Sélectionner un cours récurrent par ID
 */
export const SELECT_COURS_RECURRENT_BY_ID = `
  SELECT
    id,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    actif,
    created_at
  FROM cours_recurrent
  WHERE id = ?
`;

/**
 * Sélectionner un cours récurrent par jour et heure
 */
export const SELECT_COURS_RECURRENT_BY_DAY_TIME = `
  SELECT
    id,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    actif,
    created_at
  FROM cours_recurrent
  WHERE jour_semaine = ?
    AND type_cours = ?
    AND heure_debut = ?
    AND actif = 1
  LIMIT 1
`;

/**
 * Sélectionner les cours récurrents d'un jour spécifique
 */
export const SELECT_COURS_RECURRENTS_BY_DAY = `
  SELECT
    id,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    actif
  FROM cours_recurrent
  WHERE jour_semaine = ?
    AND actif = 1
  ORDER BY heure_debut ASC
`;

/**
 * Sélectionner un cours récurrent avec ses professeurs
 */
export const SELECT_COURS_RECURRENT_WITH_PROFESSEURS = `
  SELECT
    cr.id,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    cr.actif,
    GROUP_CONCAT(
      CONCAT(p.id, ':', p.nom, ':', p.prenom)
      SEPARATOR '|'
    ) AS professeurs
  FROM cours_recurrent cr
  LEFT JOIN professeurs_cours_recurrent pcr ON cr.id = pcr.cours_recurrent_id
  LEFT JOIN professeurs p ON pcr.professeur_id = p.id
  WHERE cr.id = ?
  GROUP BY cr.id
`;

// ============================================================================
// QUERIES DE LECTURE - PLANNING HEBDOMADAIRE
// ============================================================================

/**
 * Sélectionner les jours de cours (planning hebdomadaire)
 */
export const SELECT_JOURS_DE_COURS = `
  SELECT
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    GROUP_CONCAT(
      CONCAT(p.nom, ' ', p.prenom)
      SEPARATOR ', '
    ) AS professeurs
  FROM cours_recurrent cr
  LEFT JOIN professeurs_cours_recurrent pcr ON cr.id = pcr.cours_recurrent_id
  LEFT JOIN professeurs p ON pcr.professeur_id = p.id
  WHERE cr.actif = 1
  GROUP BY cr.id, cr.jour_semaine, cr.type_cours, cr.heure_debut, cr.heure_fin
  ORDER BY cr.jour_semaine ASC, cr.heure_debut ASC
`;

/**
 * Sélectionner les jours de cours pour une semaine spécifique
 */
export const SELECT_JOURS_DE_COURS_PAR_SEMAINE = `
  SELECT
    c.date_cours,
    DAYNAME(c.date_cours) AS jour,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    GROUP_CONCAT(
      CONCAT(p.nom, ' ', p.prenom)
      SEPARATOR ', '
    ) AS professeurs
  FROM cours c
  LEFT JOIN cours_recurrent cr ON c.jour_semaine = cr.jour_semaine
    AND c.type_cours = cr.type_cours
    AND c.heure_debut = cr.heure_debut
  LEFT JOIN professeurs_cours_recurrent pcr ON cr.id = pcr.cours_recurrent_id
  LEFT JOIN professeurs p ON pcr.professeur_id = p.id
  WHERE WEEK(c.date_cours, 1) = ?
    AND YEAR(c.date_cours) = ?
    AND c.actif = 1
  GROUP BY c.id, c.date_cours, c.type_cours, c.heure_debut, c.heure_fin
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

// ============================================================================
// QUERIES DE LECTURE - PARTICIPANTS
// ============================================================================

/**
 * Sélectionner les utilisateurs participants à un cours
 */
export const SELECT_PARTICIPANTS_BY_COURS = `
  SELECT
    u.id,
    u.first_name AS prenom,
    u.last_name AS nom,
    i.present AS presence,
    i.date_inscription
  FROM inscriptions i
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  WHERE i.cours_id = ?
  ORDER BY u.last_name ASC, u.first_name ASC
`;

/**
 * Sélectionner les cours d'un utilisateur
 */
export const SELECT_COURS_BY_USER = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    i.present,
    i.date_inscription
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.utilisateur_id = ?
    AND c.actif = 1
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

/**
 * Sélectionner les cours futurs d'un utilisateur
 */
export const SELECT_COURS_FUTURS_BY_USER = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.capacite_max,
    i.id AS inscription_id,
    i.present
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.utilisateur_id = ?
    AND c.date_cours >= CURDATE()
    AND c.actif = 1
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

// ============================================================================
// QUERIES DE LECTURE - SEMAINES
// ============================================================================

/**
 * Sélectionner toutes les semaines avec cours
 */
export const SELECT_SEMAINES_AVEC_COURS = `
  SELECT DISTINCT
    YEAR(date_cours) AS annee,
    WEEK(date_cours, 1) AS numero_semaine,
    MIN(date_cours) AS date_debut,
    MAX(date_cours) AS date_fin,
    COUNT(*) AS nombre_cours
  FROM cours
  WHERE actif = 1
  GROUP BY YEAR(date_cours), WEEK(date_cours, 1)
  ORDER BY annee DESC, numero_semaine DESC
`;

/**
 * Sélectionner les informations d'une semaine spécifique
 */
export const SELECT_SEMAINE_INFO = `
  SELECT
    YEAR(date_cours) AS annee,
    WEEK(date_cours, 1) AS numero_semaine,
    MIN(date_cours) AS date_debut,
    MAX(date_cours) AS date_fin,
    COUNT(*) AS nombre_cours
  FROM cours
  WHERE WEEK(date_cours, 1) = ?
    AND YEAR(date_cours) = ?
    AND actif = 1
  GROUP BY YEAR(date_cours), WEEK(date_cours, 1)
`;

// ============================================================================
// QUERIES DE LECTURE - PROFESSEURS
// ============================================================================

/**
 * Sélectionner les professeurs d'un cours récurrent
 */
export const SELECT_PROFESSEURS_BY_COURS_RECURRENT = `
  SELECT
    p.id,
    p.nom,
    p.prenom,
    p.email
  FROM professeurs p
  INNER JOIN professeurs_cours_recurrent pcr ON p.id = pcr.professeur_id
  WHERE pcr.cours_recurrent_id = ?
  ORDER BY p.nom ASC, p.prenom ASC
`;

/**
 * Sélectionner un professeur par nom et prénom
 */
export const SELECT_PROFESSEUR_BY_NAME = `
  SELECT
    id,
    nom,
    prenom,
    email
  FROM professeurs
  WHERE nom = ? AND prenom = ?
  LIMIT 1
`;

/**
 * Sélectionner tous les professeurs
 */
export const SELECT_ALL_PROFESSEURS = `
  SELECT
    id,
    nom,
    prenom,
    email
  FROM professeurs
  ORDER BY nom ASC, prenom ASC
`;

// ============================================================================
// QUERIES DE LECTURE - DISPONIBILITÉ
// ============================================================================

/**
 * Compter les inscriptions pour un cours
 */
export const COUNT_INSCRIPTIONS_BY_COURS = `
  SELECT COUNT(*) AS total
  FROM inscriptions
  WHERE cours_id = ?
`;

/**
 * Vérifier la disponibilité d'un cours
 */
export const CHECK_COURS_DISPONIBILITE = `
  SELECT
    c.id,
    c.capacite_max,
    COUNT(i.id) AS places_occupees,
    (c.capacite_max - COUNT(i.id)) AS places_disponibles,
    CASE WHEN COUNT(i.id) >= c.capacite_max THEN 1 ELSE 0 END AS complet
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.id = ?
  GROUP BY c.id, c.capacite_max
`;

/**
 * Sélectionner les cours disponibles (avec places)
 */
export const SELECT_COURS_DISPONIBLES = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.capacite_max,
    COUNT(i.id) AS places_occupees,
    (c.capacite_max - COUNT(i.id)) AS places_disponibles
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1
    AND c.date_cours >= CURDATE()
  GROUP BY c.id
  HAVING places_disponibles > 0
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

// ============================================================================
// QUERIES DE LECTURE - RECHERCHE
// ============================================================================

/**
 * Rechercher des cours avec filtres dynamiques
 * Note: Les filtres doivent être ajoutés dynamiquement selon les paramètres
 */
export const SEARCH_COURS_BASE = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.capacite_max,
    c.description,
    c.actif,
    COUNT(i.id) AS nombre_inscrits
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE 1=1
`;
