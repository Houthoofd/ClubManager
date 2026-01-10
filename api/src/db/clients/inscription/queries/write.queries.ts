/**
 * Requêtes SQL d'écriture pour le module Inscription
 * Responsabilité: INSERT, UPDATE, DELETE queries uniquement
 */

// ============================================================================
// QUERIES - INSERT COURS
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
    cours_recurrent_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?)
`;

/**
 * Insérer plusieurs cours en batch
 */
export const INSERT_COURS_BATCH = `
  INSERT INTO cours (
    date_cours,
    jour_cours,
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    cours_recurrent_id
  ) VALUES ?
`;

// ============================================================================
// QUERIES - INSERT COURS RÉCURRENTS
// ============================================================================

/**
 * Insérer un nouveau cours récurrent
 */
export const INSERT_COURS_RECURRENT = `
  INSERT INTO cours_recurrents (
    jour_semaine,
    type_cours,
    heure_debut,
    heure_fin,
    date_debut,
    date_fin
  ) VALUES (?, ?, ?, ?, ?, ?)
`;

/**
 * Insérer un cours récurrent via procédure stockée
 */
export const CALL_INSERT_COURS_RECURRENT = `
  CALL InsertCoursRecurrent(?, ?, ?, ?, ?, ?, ?)
`;

// ============================================================================
// QUERIES - INSERT INSCRIPTIONS
// ============================================================================

/**
 * Insérer une nouvelle inscription
 */
export const INSERT_INSCRIPTION = `
  INSERT INTO inscriptions (
    cours_id,
    utilisateur_id,
    date_inscription,
    presence,
    est_valide
  ) VALUES (?, ?, NOW(), ?, ?)
`;

/**
 * Insérer une inscription simple (avec valeurs par défaut)
 */
export const INSERT_INSCRIPTION_SIMPLE = `
  INSERT INTO inscriptions (
    cours_id,
    utilisateur_id
  ) VALUES (?, ?)
`;

// ============================================================================
// QUERIES - INSERT PROFESSEURS
// ============================================================================

/**
 * Associer des professeurs à un cours
 */
export const INSERT_COURS_PROFESSEURS = `
  INSERT INTO cours_professeurs (
    cours_id,
    professeur_id
  ) VALUES ?
`;

/**
 * Associer des professeurs à un cours récurrent
 */
export const INSERT_COURS_RECURRENT_PROFESSEURS = `
  INSERT INTO cours_recurrents_professeurs (
    cours_recurrent_id,
    professeur_id
  ) VALUES ?
`;

/**
 * Associer un professeur à un cours récurrent (single)
 */
export const INSERT_COURS_RECURRENT_PROFESSEUR = `
  INSERT INTO cours_recurrents_professeurs (
    cours_recurrent_id,
    professeur_id
  ) VALUES (?, ?)
`;

// ============================================================================
// QUERIES - UPDATE COURS
// ============================================================================

/**
 * Mettre à jour un cours
 */
export const UPDATE_COURS = `
  UPDATE cours
  SET
    date_cours = COALESCE(?, date_cours),
    type_cours = COALESCE(?, type_cours),
    heure_debut = COALESCE(?, heure_debut),
    heure_fin = COALESCE(?, heure_fin),
    jour_cours = COALESCE(?, jour_cours),
    jour_semaine = COALESCE(?, jour_semaine),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour un cours récurrent
 */
export const UPDATE_COURS_RECURRENT = `
  UPDATE cours_recurrents
  SET
    jour_semaine = COALESCE(?, jour_semaine),
    type_cours = COALESCE(?, type_cours),
    heure_debut = COALESCE(?, heure_debut),
    heure_fin = COALESCE(?, heure_fin),
    date_fin = COALESCE(?, date_fin),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour un cours récurrent via procédure stockée
 */
export const CALL_UPDATE_COURS_RECURRENT = `
  CALL ModifierCoursRecurrent(?, ?, ?, ?, ?, ?, ?)
`;

// ============================================================================
// QUERIES - UPDATE INSCRIPTIONS / PRÉSENCE
// ============================================================================

/**
 * Mettre à jour la présence d'une inscription
 */
export const UPDATE_INSCRIPTION_PRESENCE = `
  UPDATE inscriptions
  SET
    presence = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Valider une inscription (marquer comme présent)
 */
export const UPDATE_INSCRIPTION_VALIDER = `
  UPDATE inscriptions
  SET
    presence = 'present',
    est_valide = 1,
    updated_at = NOW()
  WHERE cours_id = ?
    AND utilisateur_id = ?
`;

/**
 * Annuler une inscription (marquer comme absent)
 */
export const UPDATE_INSCRIPTION_ANNULER = `
  UPDATE inscriptions
  SET
    presence = 'absent',
    updated_at = NOW()
  WHERE cours_id = ?
    AND utilisateur_id = ?
`;

/**
 * Mettre en attente une inscription
 */
export const UPDATE_INSCRIPTION_EN_ATTENTE = `
  UPDATE inscriptions
  SET
    presence = 'en_attente',
    updated_at = NOW()
  WHERE cours_id = ?
    AND utilisateur_id = ?
`;

/**
 * Mettre à jour le statut de validation
 */
export const UPDATE_INSCRIPTION_EST_VALIDE = `
  UPDATE inscriptions
  SET
    est_valide = ?,
    updated_at = NOW()
  WHERE id = ?
`;

// ============================================================================
// QUERIES - DELETE COURS
// ============================================================================

/**
 * Supprimer un cours
 */
export const DELETE_COURS = `
  DELETE FROM cours
  WHERE id = ?
`;

/**
 * Supprimer tous les cours futurs d'un cours récurrent
 */
export const DELETE_COURS_FUTURS_BY_RECURRENT = `
  DELETE FROM cours
  WHERE cours_recurrent_id = ?
    AND date_cours >= CURDATE()
`;

/**
 * Supprimer les cours d'une plage de dates
 */
export const DELETE_COURS_BY_DATE_RANGE = `
  DELETE FROM cours
  WHERE date_cours BETWEEN ? AND ?
`;

// ============================================================================
// QUERIES - DELETE COURS RÉCURRENTS
// ============================================================================

/**
 * Supprimer un cours récurrent
 */
export const DELETE_COURS_RECURRENT = `
  DELETE FROM cours_recurrents
  WHERE id = ?
`;

/**
 * Soft delete - Terminer un cours récurrent (set date_fin)
 */
export const SOFT_DELETE_COURS_RECURRENT = `
  UPDATE cours_recurrents
  SET
    date_fin = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer un cours récurrent via procédure stockée
 */
export const CALL_DELETE_COURS_RECURRENT = `
  CALL SupprimerCoursRecurrent(?)
`;

// ============================================================================
// QUERIES - DELETE INSCRIPTIONS
// ============================================================================

/**
 * Supprimer une inscription
 */
export const DELETE_INSCRIPTION = `
  DELETE FROM inscriptions
  WHERE id = ?
`;

/**
 * Désinscrire un utilisateur d'un cours
 */
export const DELETE_INSCRIPTION_BY_COURS_USER = `
  DELETE FROM inscriptions
  WHERE cours_id = ?
    AND utilisateur_id = ?
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
export const DELETE_INSCRIPTIONS_BY_UTILISATEUR = `
  DELETE FROM inscriptions
  WHERE utilisateur_id = ?
`;

// ============================================================================
// QUERIES - DELETE PROFESSEURS
// ============================================================================

/**
 * Supprimer tous les professeurs d'un cours
 */
export const DELETE_COURS_PROFESSEURS = `
  DELETE FROM cours_professeurs
  WHERE cours_id = ?
`;

/**
 * Supprimer un professeur spécifique d'un cours
 */
export const DELETE_COURS_PROFESSEUR = `
  DELETE FROM cours_professeurs
  WHERE cours_id = ?
    AND professeur_id = ?
`;

/**
 * Supprimer tous les professeurs d'un cours récurrent
 */
export const DELETE_COURS_RECURRENT_PROFESSEURS = `
  DELETE FROM cours_recurrents_professeurs
  WHERE cours_recurrent_id = ?
`;

/**
 * Supprimer un professeur spécifique d'un cours récurrent
 */
export const DELETE_COURS_RECURRENT_PROFESSEUR = `
  DELETE FROM cours_recurrents_professeurs
  WHERE cours_recurrent_id = ?
    AND professeur_id = ?
`;

/**
 * Supprimer des professeurs par IDs
 */
export const DELETE_COURS_RECURRENT_PROFESSEURS_BY_IDS = `
  DELETE FROM cours_recurrents_professeurs
  WHERE cours_recurrent_id = ?
    AND professeur_id IN (?)
`;

// ============================================================================
// QUERIES - STORED PROCEDURES
// ============================================================================

/**
 * Appeler la procédure pour supprimer un cours récurrent avec ses dépendances
 */
export const CALL_SUPPRIMER_JOUR_COURS = `
  CALL SupprimerJourDeCours(?, ?, ?, ?)
`;

/**
 * Appeler la procédure pour inscrire un utilisateur
 */
export const CALL_INSCRIRE_UTILISATEUR = `
  CALL InscrireUtilisateurCours(?, ?)
`;

/**
 * Appeler la procédure pour désinscrire un utilisateur
 */
export const CALL_DESINSCRIRE_UTILISATEUR = `
  CALL DesinscrireUtilisateurCours(?, ?)
`;

// ============================================================================
// QUERIES - BATCH OPERATIONS
// ============================================================================

/**
 * Mettre à jour la présence de plusieurs inscriptions
 */
export const UPDATE_INSCRIPTIONS_PRESENCE_BATCH = `
  UPDATE inscriptions
  SET presence = ?
  WHERE id IN (?)
`;

/**
 * Valider plusieurs inscriptions
 */
export const UPDATE_INSCRIPTIONS_VALIDER_BATCH = `
  UPDATE inscriptions
  SET
    presence = 'present',
    est_valide = 1,
    updated_at = NOW()
  WHERE id IN (?)
`;

/**
 * Annuler plusieurs inscriptions
 */
export const UPDATE_INSCRIPTIONS_ANNULER_BATCH = `
  UPDATE inscriptions
  SET
    presence = 'absent',
    updated_at = NOW()
  WHERE id IN (?)
`;

/**
 * Supprimer plusieurs inscriptions
 */
export const DELETE_INSCRIPTIONS_BATCH = `
  DELETE FROM inscriptions
  WHERE id IN (?)
`;

/**
 * Supprimer plusieurs cours
 */
export const DELETE_COURS_BATCH = `
  DELETE FROM cours
  WHERE id IN (?)
`;
