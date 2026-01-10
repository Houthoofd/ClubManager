/**
 * Requêtes SQL de STATISTIQUES pour le module Cours
 * Responsabilité: Requêtes d'analyse et statistiques de présence
 */

// ============================================================================
// STATISTIQUES DE PRÉSENCE PAR COURS
// ============================================================================

/**
 * Obtenir les statistiques de présence pour un cours spécifique
 */
export const GET_STATS_PRESENCE_COURS = `
  SELECT
    c.id AS cours_id,
    c.type_cours,
    c.date_cours,
    COUNT(DISTINCT i.id) AS total_inscrits,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS presents,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS absents,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(DISTINCT i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.id = ?
  GROUP BY c.id, c.type_cours, c.date_cours
`;

/**
 * Obtenir les statistiques de présence pour tous les cours
 */
export const GET_STATS_GLOBALES = `
  SELECT
    c.id AS cours_id,
    c.type_cours,
    c.date_cours,
    COUNT(DISTINCT i.id) AS total_inscrits,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS presents,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS absents,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(DISTINCT i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1
  GROUP BY c.id, c.type_cours, c.date_cours
  ORDER BY c.date_cours DESC
`;

// ============================================================================
// STATISTIQUES DE PRÉSENCE PAR UTILISATEUR
// ============================================================================

/**
 * Obtenir les statistiques de présence pour un utilisateur spécifique
 */
export const GET_STATS_PRESENCE_USER = `
  SELECT
    u.id AS utilisateur_id,
    u.last_name AS nom,
    u.first_name AS prenom,
    COUNT(DISTINCT i.cours_id) AS total_cours_inscrits,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS cours_assistes,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS cours_manques,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(DISTINCT i.cours_id), 0),
      2
    ) AS taux_presence
  FROM utilisateurs u
  LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
  WHERE u.id = ?
  GROUP BY u.id, u.last_name, u.first_name
`;

/**
 * Obtenir les statistiques de présence pour tous les utilisateurs
 */
export const GET_STATS_TOUS_UTILISATEURS = `
  SELECT
    u.id AS utilisateur_id,
    u.last_name AS nom,
    u.first_name AS prenom,
    COUNT(DISTINCT i.cours_id) AS total_cours_inscrits,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS cours_assistes,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS cours_manques,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(DISTINCT i.cours_id), 0),
      2
    ) AS taux_presence
  FROM utilisateurs u
  LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
  WHERE u.status_id = 1
  GROUP BY u.id, u.last_name, u.first_name
  HAVING total_cours_inscrits > 0
  ORDER BY taux_presence DESC
`;

// ============================================================================
// STATISTIQUES AGRÉGÉES
// ============================================================================

/**
 * Obtenir le taux de présence moyen global
 */
export const GET_TAUX_PRESENCE_MOYEN = `
  SELECT
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(*), 0),
      2
    ) AS taux_presence_moyen,
    COUNT(DISTINCT i.cours_id) AS total_cours,
    COUNT(DISTINCT i.utilisateur_id) AS total_participants,
    COUNT(*) AS total_inscriptions,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presences,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS total_absences
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE c.date_cours <= CURDATE()
`;

/**
 * Obtenir les statistiques par type de cours
 */
export const GET_STATS_PAR_TYPE_COURS = `
  SELECT
    c.type_cours,
    COUNT(DISTINCT c.id) AS nombre_cours,
    COUNT(DISTINCT i.utilisateur_id) AS nombre_participants_uniques,
    COUNT(i.id) AS total_inscriptions,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presences,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS total_absences,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1 AND c.date_cours <= CURDATE()
  GROUP BY c.type_cours
  ORDER BY nombre_cours DESC
`;

/**
 * Obtenir les statistiques par jour de la semaine
 */
export const GET_STATS_PAR_JOUR_SEMAINE = `
  SELECT
    DAYOFWEEK(c.date_cours) AS jour_semaine,
    DAYNAME(c.date_cours) AS nom_jour,
    COUNT(DISTINCT c.id) AS nombre_cours,
    COUNT(i.id) AS total_inscriptions,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presences,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS total_absences,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1 AND c.date_cours <= CURDATE()
  GROUP BY jour_semaine, nom_jour
  ORDER BY jour_semaine
`;

// ============================================================================
// CLASSEMENTS ET TOP LISTES
// ============================================================================

/**
 * Obtenir les cours les plus populaires (avec le plus d'inscriptions)
 */
export const GET_COURS_PLUS_POPULAIRES = `
  SELECT
    c.id AS cours_id,
    c.type_cours,
    c.date_cours,
    c.heure_debut,
    c.heure_fin,
    COUNT(i.id) AS nombre_inscriptions,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS nombre_presences,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1
  GROUP BY c.id, c.type_cours, c.date_cours, c.heure_debut, c.heure_fin
  ORDER BY nombre_inscriptions DESC
  LIMIT ?
`;

/**
 * Obtenir les utilisateurs les plus assidus (meilleur taux de présence)
 */
export const GET_UTILISATEURS_ASSIDUS = `
  SELECT
    u.id AS utilisateur_id,
    u.last_name AS nom,
    u.first_name AS prenom,
    COUNT(DISTINCT i.cours_id) AS total_cours_inscrits,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS cours_assistes,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS cours_manques,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(DISTINCT i.cours_id), 0),
      2
    ) AS taux_presence
  FROM utilisateurs u
  INNER JOIN inscriptions i ON u.id = i.utilisateur_id
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE u.status_id = 1 AND c.date_cours <= CURDATE()
  GROUP BY u.id, u.last_name, u.first_name
  HAVING total_cours_inscrits >= ?
  ORDER BY taux_presence DESC, cours_assistes DESC
  LIMIT ?
`;

// ============================================================================
// COMPTAGES ET TOTAUX
// ============================================================================

/**
 * Compter le nombre de cours par semaine
 */
export const COUNT_COURS_PAR_SEMAINE = `
  SELECT
    YEAR(date_cours) AS annee,
    WEEK(date_cours, 1) AS numero_semaine,
    COUNT(*) AS nombre_cours,
    COUNT(DISTINCT type_cours) AS types_cours_differents
  FROM cours
  WHERE actif = 1
    AND YEAR(date_cours) = ?
    AND WEEK(date_cours, 1) = ?
  GROUP BY annee, numero_semaine
`;

/**
 * Compter le nombre total de participants (inscriptions uniques)
 */
export const COUNT_PARTICIPANTS_TOTAL = `
  SELECT
    COUNT(DISTINCT utilisateur_id) AS total_participants,
    COUNT(*) AS total_inscriptions
  FROM inscriptions
`;

/**
 * Compter le nombre total de cours
 */
export const COUNT_TOTAL_COURS = `
  SELECT
    COUNT(*) AS total_cours,
    COUNT(CASE WHEN actif = 1 THEN 1 END) AS cours_actifs,
    COUNT(CASE WHEN actif = 0 THEN 1 END) AS cours_inactifs,
    COUNT(CASE WHEN date_cours >= CURDATE() THEN 1 END) AS cours_futurs,
    COUNT(CASE WHEN date_cours < CURDATE() THEN 1 END) AS cours_passes
  FROM cours
`;

// ============================================================================
// STATISTIQUES PAR PÉRIODE
// ============================================================================

/**
 * Obtenir les statistiques pour une période donnée
 */
export const GET_STATS_PERIODE = `
  SELECT
    DATE(c.date_cours) AS date,
    COUNT(DISTINCT c.id) AS nombre_cours,
    COUNT(i.id) AS total_inscriptions,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presences,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS total_absences,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.date_cours BETWEEN ? AND ?
    AND c.actif = 1
  GROUP BY DATE(c.date_cours)
  ORDER BY date DESC
`;

/**
 * Obtenir les statistiques mensuelles
 */
export const GET_STATS_MENSUELLES = `
  SELECT
    YEAR(c.date_cours) AS annee,
    MONTH(c.date_cours) AS mois,
    MONTHNAME(c.date_cours) AS nom_mois,
    COUNT(DISTINCT c.id) AS nombre_cours,
    COUNT(DISTINCT i.utilisateur_id) AS nombre_participants_uniques,
    COUNT(i.id) AS total_inscriptions,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presences,
    SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS total_absences,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1
  GROUP BY annee, mois, nom_mois
  ORDER BY annee DESC, mois DESC
  LIMIT ?
`;

// ============================================================================
// STATISTIQUES DE CAPACITÉ
// ============================================================================

/**
 * Obtenir le taux de remplissage des cours
 */
export const GET_TAUX_REMPLISSAGE = `
  SELECT
    c.id AS cours_id,
    c.type_cours,
    c.date_cours,
    c.capacite_max,
    COUNT(i.id) AS inscriptions_actuelles,
    ROUND(
      (COUNT(i.id) * 100.0) / NULLIF(c.capacite_max, 0),
      2
    ) AS taux_remplissage,
    CASE
      WHEN COUNT(i.id) >= c.capacite_max THEN 1
      ELSE 0
    END AS est_complet
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1 AND c.capacite_max IS NOT NULL
  GROUP BY c.id, c.type_cours, c.date_cours, c.capacite_max
  ORDER BY taux_remplissage DESC
`;

/**
 * Obtenir les cours sous-utilisés (faible taux de remplissage)
 */
export const GET_COURS_SOUS_UTILISES = `
  SELECT
    c.id AS cours_id,
    c.type_cours,
    c.date_cours,
    c.heure_debut,
    c.heure_fin,
    c.capacite_max,
    COUNT(i.id) AS inscriptions_actuelles,
    ROUND(
      (COUNT(i.id) * 100.0) / NULLIF(c.capacite_max, 0),
      2
    ) AS taux_remplissage
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.actif = 1
    AND c.capacite_max IS NOT NULL
    AND c.date_cours >= CURDATE()
  GROUP BY c.id, c.type_cours, c.date_cours, c.heure_debut, c.heure_fin, c.capacite_max
  HAVING taux_remplissage < ?
  ORDER BY c.date_cours ASC
`;

// ============================================================================
// TENDANCES ET ANALYSES
// ============================================================================

/**
 * Obtenir l'évolution du nombre d'inscriptions sur les dernières semaines
 */
export const GET_TENDANCE_INSCRIPTIONS = `
  SELECT
    YEAR(i.date_inscription) AS annee,
    WEEK(i.date_inscription, 1) AS semaine,
    COUNT(*) AS nombre_inscriptions,
    COUNT(DISTINCT i.utilisateur_id) AS nouveaux_participants
  FROM inscriptions i
  WHERE i.date_inscription >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
  GROUP BY annee, semaine
  ORDER BY annee DESC, semaine DESC
`;

/**
 * Obtenir l'évolution du taux de présence sur les dernières semaines
 */
export const GET_TENDANCE_PRESENCE = `
  SELECT
    YEAR(c.date_cours) AS annee,
    WEEK(c.date_cours, 1) AS semaine,
    COUNT(i.id) AS total_inscriptions,
    SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presences,
    ROUND(
      (SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) * 100.0) /
      NULLIF(COUNT(i.id), 0),
      2
    ) AS taux_presence
  FROM cours c
  LEFT JOIN inscriptions i ON c.id = i.cours_id
  WHERE c.date_cours >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
    AND c.date_cours <= CURDATE()
    AND c.actif = 1
  GROUP BY annee, semaine
  ORDER BY annee DESC, semaine DESC
`;
