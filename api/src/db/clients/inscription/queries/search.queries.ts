/**
 * Requêtes SQL de recherche pour le module Inscription
 * Responsabilité: Queries de recherche et filtrage avancé
 */

// ============================================================================
// QUERIES - RECHERCHE COURS
// ============================================================================

/**
 * Rechercher des cours par date
 */
export const SEARCH_COURS_BY_DATE = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.cours_recurrent_id
  FROM cours c
  WHERE c.date_cours = ?
  ORDER BY c.heure_debut ASC
`;

/**
 * Rechercher des cours par plage de dates
 */
export const SEARCH_COURS_BY_DATE_RANGE = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.cours_recurrent_id
  FROM cours c
  WHERE c.date_cours BETWEEN ? AND ?
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

/**
 * Rechercher des cours par type
 */
export const SEARCH_COURS_BY_TYPE = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.cours_recurrent_id
  FROM cours c
  WHERE c.type_cours LIKE ?
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

/**
 * Rechercher des cours par jour de la semaine
 */
export const SEARCH_COURS_BY_JOUR_SEMAINE = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.cours_recurrent_id
  FROM cours c
  WHERE c.jour_semaine = ?
    AND c.date_cours >= CURDATE()
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

/**
 * Rechercher des cours par professeur
 */
export const SEARCH_COURS_BY_PROFESSEUR = `
  SELECT DISTINCT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.cours_recurrent_id
  FROM cours c
  INNER JOIN cours_professeurs cp ON c.id = cp.cours_id
  WHERE cp.professeur_id = ?
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

/**
 * Rechercher des cours avec filtres multiples
 */
export const SEARCH_COURS_ADVANCED = `
  SELECT
    c.id,
    c.date_cours,
    c.jour_cours,
    c.jour_semaine,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    c.cours_recurrent_id,
    COUNT(DISTINCT i.id) as nombre_inscrits
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE 1=1
    AND (? IS NULL OR c.date_cours >= ?)
    AND (? IS NULL OR c.date_cours <= ?)
    AND (? IS NULL OR c.type_cours LIKE ?)
    AND (? IS NULL OR c.jour_semaine = ?)
  GROUP BY c.id
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

/**
 * Rechercher des cours disponibles (avec places)
 */
export const SEARCH_COURS_DISPONIBLES = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    COUNT(i.id) as inscrits,
    COALESCE(c.capacite_max, 999) as capacite_max,
    (COALESCE(c.capacite_max, 999) - COUNT(i.id)) as places_restantes
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.date_cours >= CURDATE()
  GROUP BY c.id
  HAVING places_restantes > 0
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

// ============================================================================
// QUERIES - RECHERCHE COURS RÉCURRENTS
// ============================================================================

/**
 * Rechercher des cours récurrents par type
 */
export const SEARCH_COURS_RECURRENT_BY_TYPE = `
  SELECT
    cr.id,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    cr.date_debut,
    cr.date_fin
  FROM cours_recurrents cr
  WHERE cr.type_cours LIKE ?
    AND (cr.date_fin IS NULL OR cr.date_fin >= CURDATE())
  ORDER BY cr.jour_semaine ASC, cr.heure_debut ASC
`;

/**
 * Rechercher des cours récurrents actifs
 */
export const SEARCH_COURS_RECURRENT_ACTIFS = `
  SELECT
    cr.id,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    cr.date_debut,
    cr.date_fin,
    COUNT(DISTINCT c.id) as nombre_cours_generes
  FROM cours_recurrents cr
  LEFT JOIN cours c ON cr.id = c.cours_recurrent_id AND c.date_cours >= CURDATE()
  WHERE cr.date_fin IS NULL OR cr.date_fin >= CURDATE()
  GROUP BY cr.id
  ORDER BY cr.jour_semaine ASC, cr.heure_debut ASC
`;

/**
 * Rechercher des cours récurrents par jour
 */
export const SEARCH_COURS_RECURRENT_BY_JOUR = `
  SELECT
    cr.id,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    cr.date_debut,
    cr.date_fin
  FROM cours_recurrents cr
  WHERE cr.jour_semaine = ?
    AND (cr.date_fin IS NULL OR cr.date_fin >= CURDATE())
  ORDER BY cr.heure_debut ASC
`;

// ============================================================================
// QUERIES - RECHERCHE INSCRIPTIONS
// ============================================================================

/**
 * Rechercher des inscriptions par statut de présence
 */
export const SEARCH_INSCRIPTIONS_BY_PRESENCE = `
  SELECT
    i.id,
    i.cours_id,
    i.utilisateur_id,
    i.presence,
    i.est_valide,
    u.first_name as prenom,
    u.last_name as nom,
    c.date_cours,
    c.type_cours
  FROM inscriptions i
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.presence = ?
  ORDER BY c.date_cours DESC
`;

/**
 * Rechercher des inscriptions non validées
 */
export const SEARCH_INSCRIPTIONS_NON_VALIDEES = `
  SELECT
    i.id,
    i.cours_id,
    i.utilisateur_id,
    i.date_inscription,
    i.presence,
    u.first_name as prenom,
    u.last_name as nom,
    c.date_cours,
    c.type_cours,
    c.heure_debut
  FROM inscriptions i
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE i.est_valide = 0
    AND c.date_cours >= CURDATE()
  ORDER BY c.date_cours ASC, c.heure_debut ASC
`;

/**
 * Rechercher des inscriptions en attente
 */
export const SEARCH_INSCRIPTIONS_EN_ATTENTE = `
  SELECT
    i.id,
    i.cours_id,
    i.utilisateur_id,
    i.date_inscription,
    u.first_name as prenom,
    u.last_name as nom,
    c.date_cours,
    c.type_cours
  FROM inscriptions i
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE (i.presence = 'en_attente' OR i.presence IS NULL)
    AND c.date_cours >= CURDATE()
  ORDER BY i.date_inscription ASC
`;

/**
 * Rechercher des inscriptions par plage de dates
 */
export const SEARCH_INSCRIPTIONS_BY_DATE_RANGE = `
  SELECT
    i.id,
    i.cours_id,
    i.utilisateur_id,
    i.date_inscription,
    i.presence,
    i.est_valide,
    u.first_name as prenom,
    u.last_name as nom,
    c.date_cours,
    c.type_cours
  FROM inscriptions i
  INNER JOIN utilisateurs u ON i.utilisateur_id = u.id
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE c.date_cours BETWEEN ? AND ?
  ORDER BY c.date_cours ASC, u.last_name ASC
`;

// ============================================================================
// QUERIES - RECHERCHE UTILISATEURS
// ============================================================================

/**
 * Rechercher des participants par nom
 */
export const SEARCH_PARTICIPANTS_BY_NAME = `
  SELECT DISTINCT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.status_id,
    COUNT(DISTINCT i.id) as nombre_cours
  FROM utilisateurs u
  LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
  WHERE (u.first_name LIKE ? OR u.last_name LIKE ?)
    AND u.status_id = 1
  GROUP BY u.id
  ORDER BY u.last_name ASC, u.first_name ASC
`;

/**
 * Rechercher des participants actifs
 */
export const SEARCH_PARTICIPANTS_ACTIFS = `
  SELECT DISTINCT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(DISTINCT i.id) as nombre_cours,
    COUNT(DISTINCT CASE WHEN c.date_cours >= CURDATE() THEN i.id END) as cours_futurs
  FROM utilisateurs u
  INNER JOIN inscriptions i ON u.id = i.utilisateur_id
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE u.status_id = 1
  GROUP BY u.id
  HAVING nombre_cours > 0
  ORDER BY cours_futurs DESC, u.last_name ASC
`;

/**
 * Rechercher des professeurs disponibles
 */
export const SEARCH_PROFESSEURS_DISPONIBLES = `
  SELECT
    u.id,
    u.first_name as prenom,
    u.last_name as nom,
    u.email,
    COUNT(DISTINCT cp.cours_id) as nombre_cours
  FROM utilisateurs u
  LEFT JOIN cours_professeurs cp ON u.id = cp.professeur_id
  LEFT JOIN cours c ON cp.cours_id = c.id AND c.date_cours >= CURDATE()
  WHERE u.status_id IN (2, 3)
  GROUP BY u.id
  ORDER BY nombre_cours ASC, u.last_name ASC
`;

/**
 * Rechercher des professeurs par nom
 */
export const SEARCH_PROFESSEURS_BY_NAME = `
  SELECT
    u.id,
    u.first_name as prenom,
    u.last_name as nom,
    u.email
  FROM utilisateurs u
  WHERE (u.first_name LIKE ? OR u.last_name LIKE ?)
    AND u.status_id IN (2, 3)
  ORDER BY u.last_name ASC, u.first_name ASC
`;

// ============================================================================
// QUERIES - RECHERCHE AVANCÉE
// ============================================================================

/**
 * Rechercher des cours avec statistiques complètes
 */
export const SEARCH_COURS_WITH_STATS = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    COUNT(DISTINCT i.id) as total_inscrits,
    COUNT(DISTINCT CASE WHEN i.est_valide = 1 THEN i.id END) as inscrits_valides,
    COUNT(DISTINCT CASE WHEN i.presence = 'present' THEN i.id END) as presents,
    COUNT(DISTINCT CASE WHEN i.presence = 'absent' THEN i.id END) as absents,
    COUNT(DISTINCT cp.professeur_id) as nombre_professeurs,
    GROUP_CONCAT(DISTINCT CONCAT(u.first_name, ' ', u.last_name) SEPARATOR ', ') as professeurs
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  LEFT JOIN cours_professeurs cp ON c.id = cp.cours_id
  LEFT JOIN utilisateurs u ON cp.professeur_id = u.id
  WHERE c.date_cours BETWEEN ? AND ?
  GROUP BY c.id
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;

/**
 * Rechercher des utilisateurs avec leur historique de présence
 */
export const SEARCH_UTILISATEURS_WITH_PRESENCE_HISTORY = `
  SELECT
    u.id,
    u.first_name as prenom,
    u.last_name as nom,
    u.email,
    COUNT(DISTINCT i.id) as total_inscriptions,
    COUNT(DISTINCT CASE WHEN i.presence = 'present' THEN i.id END) as total_presents,
    COUNT(DISTINCT CASE WHEN i.presence = 'absent' THEN i.id END) as total_absents,
    COUNT(DISTINCT CASE WHEN c.date_cours >= CURDATE() THEN i.id END) as inscriptions_futures,
    ROUND(
      (COUNT(DISTINCT CASE WHEN i.presence = 'present' THEN i.id END) * 100.0) /
      NULLIF(COUNT(DISTINCT CASE WHEN c.date_cours < CURDATE() THEN i.id END), 0),
      2
    ) as taux_presence
  FROM utilisateurs u
  LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
  LEFT JOIN cours c ON i.cours_id = c.id
  WHERE u.status_id = 1
  GROUP BY u.id
  ORDER BY taux_presence DESC, u.last_name ASC
`;

/**
 * Rechercher des conflits horaires pour un cours
 */
export const SEARCH_CONFLITS_HORAIRES = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    COUNT(DISTINCT cp.professeur_id) as nombre_conflits,
    GROUP_CONCAT(DISTINCT CONCAT(u.first_name, ' ', u.last_name) SEPARATOR ', ') as professeurs_en_conflit
  FROM cours c
  INNER JOIN cours_professeurs cp ON c.id = cp.cours_id
  INNER JOIN utilisateurs u ON cp.professeur_id = u.id
  WHERE c.date_cours = ?
    AND EXISTS (
      SELECT 1
      FROM cours c2
      INNER JOIN cours_professeurs cp2 ON c2.id = cp2.cours_id
      WHERE cp2.professeur_id = cp.professeur_id
        AND c2.id != c.id
        AND c2.date_cours = c.date_cours
        AND (
          (c2.heure_debut <= c.heure_debut AND c2.heure_fin > c.heure_debut)
          OR
          (c2.heure_debut < c.heure_fin AND c2.heure_fin >= c.heure_fin)
        )
    )
  GROUP BY c.id
  ORDER BY c.heure_debut ASC
`;

/**
 * Rechercher les créneaux disponibles
 */
export const SEARCH_CRENEAUX_DISPONIBLES = `
  SELECT DISTINCT
    c1.date_cours,
    c1.heure_fin as creneau_debut,
    MIN(c2.heure_debut) as creneau_fin,
    TIMESTAMPDIFF(MINUTE, c1.heure_fin, MIN(c2.heure_debut)) as duree_minutes
  FROM cours c1
  INNER JOIN cours c2 ON c1.date_cours = c2.date_cours AND c1.heure_fin < c2.heure_debut
  WHERE c1.date_cours BETWEEN ? AND ?
  GROUP BY c1.date_cours, c1.heure_fin
  HAVING duree_minutes >= ?
  ORDER BY c1.date_cours ASC, creneau_debut ASC
`;

/**
 * Recherche full-text sur les cours
 */
export const SEARCH_COURS_FULLTEXT = `
  SELECT
    c.id,
    c.date_cours,
    c.type_cours,
    c.heure_debut,
    c.heure_fin,
    GROUP_CONCAT(DISTINCT CONCAT(u.first_name, ' ', u.last_name) SEPARATOR ', ') as professeurs
  FROM cours c
  LEFT JOIN cours_professeurs cp ON c.id = cp.cours_id
  LEFT JOIN utilisateurs u ON cp.professeur_id = u.id
  WHERE c.type_cours LIKE ?
    OR EXISTS (
      SELECT 1
      FROM cours_professeurs cp2
      INNER JOIN utilisateurs u2 ON cp2.professeur_id = u2.id
      WHERE cp2.cours_id = c.id
        AND (u2.first_name LIKE ? OR u2.last_name LIKE ?)
    )
  GROUP BY c.id
  ORDER BY c.date_cours DESC, c.heure_debut ASC
`;
