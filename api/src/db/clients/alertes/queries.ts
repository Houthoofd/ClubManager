/**
 * Requêtes SQL pour le module Alertes
 */

/**
 * Récupère toutes les alertes actives avec détails utilisateur
 */
export const GET_ALERTES_ACTIVES = `
  SELECT
    au.id,
    au.utilisateur_id,
    at.nom as type_alerte,
    at.code,
    at.description,
    at.priorite,
    au.donnees_contexte,
    au.date_detection,
    CONCAT(u.first_name, ' ', u.last_name) as nom_utilisateur,
    u.email,
    u.status_id
  FROM alertes_utilisateurs au
  JOIN alertes_types at ON au.alerte_type_id = at.id
  JOIN utilisateurs u ON au.utilisateur_id = u.id
  WHERE au.statut = 'active'
  ORDER BY
    CASE at.priorite
      WHEN 'critique' THEN 1
      WHEN 'haute' THEN 2
      WHEN 'normale' THEN 3
      WHEN 'basse' THEN 4
    END,
    au.date_detection DESC
`;

/**
 * Marque une alerte comme ignorée
 */
export const IGNORER_ALERTE = `
  UPDATE alertes_utilisateurs
  SET statut = 'ignoree', notes = ?, date_resolution = NOW()
  WHERE id = ?
`;

/**
 * Récupère les statistiques des alertes (30 derniers jours)
 */
export const GET_STATISTIQUES_ALERTES = `
  SELECT
    COUNT(*) as total_alertes,
    COUNT(CASE WHEN statut = 'active' THEN 1 END) as alertes_actives,
    COUNT(CASE WHEN statut = 'resolue' THEN 1 END) as alertes_resolues,
    COUNT(CASE WHEN at.priorite = 'critique' AND au.statut = 'active' THEN 1 END) as alertes_critiques
  FROM alertes_utilisateurs au
  JOIN alertes_types at ON au.alerte_type_id = at.id
  WHERE au.date_detection >= DATE_SUB(NOW(), INTERVAL 30 DAY)
`;

/**
 * Stored procedures
 */
export const CALL_OBTENIR_DASHBOARD_ALERTES = 'CALL obtenir_dashboard_alertes()';
export const CALL_OBTENIR_ALERTES_UTILISATEUR = 'CALL obtenir_alertes_utilisateur(?)';
export const CALL_DETECTER_ALERTES = 'CALL detecter_alertes_utilisateurs()';
export const CALL_RESOUDRE_ALERTE = 'CALL resoudre_alerte(?, ?, ?)';
