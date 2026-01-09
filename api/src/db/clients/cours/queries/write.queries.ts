/**
 * Requêtes SQL d'ÉCRITURE pour le module Cours
 * Responsabilité: Requêtes INSERT, UPDATE, DELETE
 */

// ============================================================================
// QUERIES D'INSERTION - COURS
// ============================================================================

/**
 * Insérer un nouveau cours
 */
export const INSERT_COURS = `
  INSERT INTO cours (
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    description,
    actif
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
`;

/**
 * Insérer plusieurs cours (pour génération depuis cours récurrent)
 */
export const INSERT_COURS_BATCH = `
  INSERT INTO cours (
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    actif
  ) VALUES ?
`;

// ============================================================================
// QUERIES D'INSERTION - COURS RÉCURRENTS
// ============================================================================

/**
 * Insérer un nouveau cours récurrent
 */
export const INSERT_COURS_RECURRENT = `
  INSERT INTO cours_recurrent (
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    actif
  ) VALUES (?, ?, ?, ?, 1)
`;

// ============================================================================
// QUERIES DE MISE À JOUR - COURS
// ============================================================================

/**
 * Mettre à jour un cours
 */
export const UPDATE_COURS = `
  UPDATE cours
  SET
    date_cours = ?,
    type_cours = ?,
    heure_debut = ?,
    heure_fin = ?,
    capacite_max = ?,
    description = ?,
    actif = ?
  WHERE id = ?
`;

/**
 * Mettre à jour uniquement certains champs d'un cours
 * Note: Requête dynamique construite selon les champs à modifier
 */
export const UPDATE_COURS_PARTIAL_BASE = `
  UPDATE cours SET
`;

/**
 * Mettre à jour le statut actif d'un cours
 */
export const UPDATE_COURS_ACTIF = `
  UPDATE cours
  SET actif = ?
  WHERE id = ?
`;

/**
 * Mettre à jour la capacité maximale d'un cours
 */
export const UPDATE_COURS_CAPACITE = `
  UPDATE cours
  SET capacite_max = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE MISE À JOUR - COURS RÉCURRENTS
// ============================================================================

/**
 * Mettre à jour un cours récurrent
 */
export const UPDATE_COURS_RECURRENT = `
  UPDATE cours_recurrent
  SET
    jour_semaine = ?,
    type_cours = ?,
    heure_debut = ?,
    heure_fin = ?,
    actif = ?
  WHERE id = ?
`;

/**
 * Mettre à jour uniquement le type de cours récurrent
 */
export const UPDATE_COURS_RECURRENT_TYPE = `
  UPDATE cours_recurrent
  SET type_cours = ?
  WHERE id = ?
`;

/**
 * Mettre à jour uniquement les horaires d'un cours récurrent
 */
export const UPDATE_COURS_RECURRENT_HORAIRES = `
  UPDATE cours_recurrent
  SET
    heure_debut = ?,
    heure_fin = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le statut actif d'un cours récurrent
 */
export const UPDATE_COURS_RECURRENT_ACTIF = `
  UPDATE cours_recurrent
  SET actif = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE SUPPRESSION - COURS
// ============================================================================

/**
 * Supprimer un cours (hard delete)
 */
export const DELETE_COURS = `
  DELETE FROM cours
  WHERE id = ?
`;

/**
 * Supprimer un cours (soft delete - désactivation)
 */
export const SOFT_DELETE_COURS = `
  UPDATE cours
  SET actif = 0
  WHERE id = ?
`;

/**
 * Supprimer tous les cours d'une semaine
 */
export const DELETE_COURS_BY_WEEK = `
  DELETE FROM cours
  WHERE WEEK(date_cours, 1) = ?
    AND YEAR(date_cours) = ?
`;

/**
 * Supprimer les cours passés (plus vieux que X jours)
 */
export const DELETE_OLD_COURS = `
  DELETE FROM cours
  WHERE date_cours < DATE_SUB(CURDATE(), INTERVAL ? DAY)
`;

// ============================================================================
// QUERIES DE SUPPRESSION - COURS RÉCURRENTS
// ============================================================================

/**
 * Supprimer un cours récurrent (hard delete)
 */
export const DELETE_COURS_RECURRENT = `
  DELETE FROM cours_recurrent
  WHERE id = ?
`;

/**
 * Supprimer un cours récurrent (soft delete)
 */
export const SOFT_DELETE_COURS_RECURRENT = `
  UPDATE cours_recurrent
  SET actif = 0
  WHERE id = ?
`;

/**
 * Supprimer un cours récurrent par jour et horaire
 */
export const DELETE_COURS_RECURRENT_BY_DAY_TIME = `
  DELETE FROM cours_recurrent
  WHERE jour_semaine = ?
    AND type_cours = ?
    AND heure_debut = ?
`;

// ============================================================================
// QUERIES DE GÉNÉRATION - COURS DEPUIS RÉCURRENT
// ============================================================================

/**
 * Générer des cours depuis un cours récurrent pour une période
 * Note: Cette requête doit être exécutée plusieurs fois (une par date)
 */
export const GENERATE_COURS_FROM_RECURRENT = `
  INSERT INTO cours (
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    actif
  )
  SELECT
    ? AS date_cours,
    DAYNAME(?) AS jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    20 AS capacite_max,
    1 AS actif
  FROM cours_recurrent
  WHERE id = ?
    AND actif = 1
`;

/**
 * Générer tous les cours de la semaine depuis les cours récurrents
 */
export const GENERATE_WEEK_COURS = `
  INSERT INTO cours (
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    capacite_max,
    actif
  )
  SELECT
    DATE_ADD(?, INTERVAL cr.jour_semaine DAY) AS date_cours,
    DAYNAME(DATE_ADD(?, INTERVAL cr.jour_semaine DAY)) AS jour_cours,
    cr.jour_semaine,
    cr.type_cours,
    cr.heure_debut,
    cr.heure_fin,
    20 AS capacite_max,
    1 AS actif
  FROM cours_recurrent cr
  WHERE cr.actif = 1
    AND NOT EXISTS (
      SELECT 1
      FROM cours c
      WHERE c.date_cours = DATE_ADD(?, INTERVAL cr.jour_semaine DAY)
        AND c.type_cours = cr.type_cours
        AND c.heure_debut = cr.heure_debut
    )
`;

// ============================================================================
// QUERIES D'INSERTION - PROFESSEURS
// ============================================================================

/**
 * Associer un professeur à un cours récurrent
 */
export const INSERT_PROFESSEUR_COURS_RECURRENT = `
  INSERT INTO professeurs_cours_recurrent (
    cours_recurrent_id,
    professeur_id
  ) VALUES (?, ?)
`;

/**
 * Associer plusieurs professeurs à un cours récurrent (batch)
 */
export const INSERT_PROFESSEURS_COURS_RECURRENT_BATCH = `
  INSERT INTO professeurs_cours_recurrent (
    cours_recurrent_id,
    professeur_id
  ) VALUES ?
`;

/**
 * Insérer un nouveau professeur
 */
export const INSERT_PROFESSEUR = `
  INSERT INTO professeurs (
    nom,
    prenom,
    email
  ) VALUES (?, ?, ?)
`;

// ============================================================================
// QUERIES DE SUPPRESSION - PROFESSEURS
// ============================================================================

/**
 * Supprimer tous les professeurs d'un cours récurrent
 */
export const DELETE_PROFESSEURS_BY_COURS_RECURRENT = `
  DELETE FROM professeurs_cours_recurrent
  WHERE cours_recurrent_id = ?
`;

/**
 * Supprimer un professeur spécifique d'un cours récurrent
 */
export const DELETE_PROFESSEUR_FROM_COURS_RECURRENT = `
  DELETE FROM professeurs_cours_recurrent
  WHERE cours_recurrent_id = ?
    AND professeur_id = ?
`;

/**
 * Supprimer un professeur par nom d'un cours récurrent
 */
export const DELETE_PROFESSEUR_BY_NAME_FROM_COURS = `
  DELETE pcr
  FROM professeurs_cours_recurrent pcr
  INNER JOIN professeurs p ON pcr.professeur_id = p.id
  WHERE pcr.cours_recurrent_id = ?
    AND p.nom = ?
    AND p.prenom = ?
`;

// ============================================================================
// QUERIES DE MISE À JOUR - PROFESSEURS
// ============================================================================

/**
 * Mettre à jour les informations d'un professeur
 */
export const UPDATE_PROFESSEUR = `
  UPDATE professeurs
  SET
    nom = ?,
    prenom = ?,
    email = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'INSERTION - INSCRIPTIONS
// ============================================================================

/**
 * Inscrire un utilisateur à un cours
 */
export const INSERT_INSCRIPTION = `
  INSERT INTO inscriptions (
    utilisateur_id,
    cours_id,
    date_inscription,
    status_id,
    present,
    notes
  ) VALUES (?, ?, NOW(), 1, 0, ?)
`;

// ============================================================================
// QUERIES DE MISE À JOUR - INSCRIPTIONS
// ============================================================================

/**
 * Marquer la présence d'un utilisateur à un cours
 */
export const UPDATE_INSCRIPTION_PRESENCE = `
  UPDATE inscriptions
  SET present = ?
  WHERE id = ?
`;

/**
 * Valider la présence d'un utilisateur (marquer présent)
 */
export const VALIDATE_INSCRIPTION_PRESENCE = `
  UPDATE inscriptions
  SET present = 1, status_id = 4
  WHERE id = ?
`;

/**
 * Annuler la présence d'un utilisateur (marquer absent)
 */
export const CANCEL_INSCRIPTION_PRESENCE = `
  UPDATE inscriptions
  SET present = 0
  WHERE id = ?
`;

/**
 * Mettre à jour le statut d'une inscription
 */
export const UPDATE_INSCRIPTION_STATUS = `
  UPDATE inscriptions
  SET status_id = ?
  WHERE id = ?
`;

/**
 * Mettre à jour les notes d'une inscription
 */
export const UPDATE_INSCRIPTION_NOTES = `
  UPDATE inscriptions
  SET notes = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE SUPPRESSION - INSCRIPTIONS
// ============================================================================

/**
 * Désinscrire un utilisateur d'un cours
 */
export const DELETE_INSCRIPTION = `
  DELETE FROM inscriptions
  WHERE id = ?
`;

/**
 * Désinscrire un utilisateur d'un cours par utilisateur et cours
 */
export const DELETE_INSCRIPTION_BY_USER_COURS = `
  DELETE FROM inscriptions
  WHERE utilisateur_id = ?
    AND cours_id = ?
`;

/**
 * Supprimer toutes les inscriptions d'un cours
 */
export const DELETE_INSCRIPTIONS_BY_COURS = `
  DELETE FROM inscriptions
  WHERE cours_id = ?
`;

/**
 * Supprimer toutes les inscriptions d'un utilisateur
 */
export const DELETE_INSCRIPTIONS_BY_USER = `
  DELETE FROM inscriptions
  WHERE utilisateur_id = ?
`;

// ============================================================================
// QUERIES DE NETTOYAGE / MAINTENANCE
// ============================================================================

/**
 * Supprimer les inscriptions des cours passés (plus de X jours)
 */
export const CLEANUP_OLD_INSCRIPTIONS = `
  DELETE i
  FROM inscriptions i
  INNER JOIN cours c ON i.cours_id = c.id
  WHERE c.date_cours < DATE_SUB(CURDATE(), INTERVAL ? DAY)
`;

/**
 * Archiver les cours anciens (déplacer vers table archive si elle existe)
 */
export const ARCHIVE_OLD_COURS = `
  UPDATE cours
  SET actif = 0
  WHERE date_cours < DATE_SUB(CURDATE(), INTERVAL ? DAY)
    AND actif = 1
`;
