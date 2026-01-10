/**
 * Requêtes SQL d'ÉCRITURE pour le module Informations
 * Responsabilité: Requêtes INSERT, UPDATE, DELETE
 */

// ============================================================================
// QUERIES D'INSERTION - INFORMATIONS
// ============================================================================

/**
 * Insérer une nouvelle information
 */
export const INSERT_INFORMATION = `
  INSERT INTO informations (
    titre,
    contenu,
    date_creation,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  )
  VALUES (?, ?, NOW(), 1, ?, ?, ?, ?)
`;

/**
 * Insérer une information avec tous les champs
 */
export const INSERT_INFORMATION_FULL = `
  INSERT INTO informations (
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible,
    created_at,
    updated_at
  )
  VALUES (?, ?, NOW(), NULL, ?, ?, ?, ?, ?, NOW(), NOW())
`;

/**
 * Insérer une information minimale (titre + contenu uniquement)
 */
export const INSERT_INFORMATION_MINIMAL = `
  INSERT INTO informations (titre, contenu, date_creation, status_id)
  VALUES (?, ?, NOW(), 1)
`;

// ============================================================================
// QUERIES DE MISE À JOUR - INFORMATIONS
// ============================================================================

/**
 * Mettre à jour une information complète
 */
export const UPDATE_INFORMATION = `
  UPDATE informations
  SET
    titre = ?,
    contenu = ?,
    date_modification = NOW(),
    categorie_id = ?,
    priorite = ?,
    visible = ?,
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le titre d'une information
 */
export const UPDATE_INFORMATION_TITRE = `
  UPDATE informations
  SET
    titre = ?,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le contenu d'une information
 */
export const UPDATE_INFORMATION_CONTENU = `
  UPDATE informations
  SET
    contenu = ?,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour la catégorie d'une information
 */
export const UPDATE_INFORMATION_CATEGORIE = `
  UPDATE informations
  SET
    categorie_id = ?,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour la priorité d'une information
 */
export const UPDATE_INFORMATION_PRIORITE = `
  UPDATE informations
  SET
    priorite = ?,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour la visibilité d'une information
 */
export const UPDATE_INFORMATION_VISIBLE = `
  UPDATE informations
  SET
    visible = ?,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le status d'une information
 */
export const UPDATE_INFORMATION_STATUS = `
  UPDATE informations
  SET
    status_id = ?,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour partiellement une information (base pour update dynamique)
 */
export const UPDATE_INFORMATION_PARTIAL_BASE = `
  UPDATE informations
  SET date_modification = NOW(), updated_at = NOW()
`;

// ============================================================================
// QUERIES DE SUPPRESSION - INFORMATIONS
// ============================================================================

/**
 * Supprimer définitivement une information
 */
export const DELETE_INFORMATION = `
  DELETE FROM informations
  WHERE id = ?
`;

/**
 * Soft delete - Marquer une information comme supprimée
 */
export const SOFT_DELETE_INFORMATION = `
  UPDATE informations
  SET
    status_id = 3,
    visible = 0,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Archiver une information
 */
export const ARCHIVE_INFORMATION = `
  UPDATE informations
  SET
    status_id = 2,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Restaurer une information archivée
 */
export const RESTORE_INFORMATION = `
  UPDATE informations
  SET
    status_id = 1,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Publier une information (depuis brouillon)
 */
export const PUBLISH_INFORMATION = `
  UPDATE informations
  SET
    status_id = 1,
    visible = 1,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre en brouillon une information
 */
export const DRAFT_INFORMATION = `
  UPDATE informations
  SET
    status_id = 0,
    visible = 0,
    date_modification = NOW(),
    updated_at = NOW()
  WHERE id = ?
`;

/**
 * Supprimer toutes les informations d'une catégorie
 */
export const DELETE_INFORMATIONS_BY_CATEGORIE = `
  DELETE FROM informations
  WHERE categorie_id = ?
`;

/**
 * Supprimer toutes les informations d'un auteur
 */
export const DELETE_INFORMATIONS_BY_AUTEUR = `
  DELETE FROM informations
  WHERE auteur_id = ?
`;

/**
 * Supprimer les informations obsolètes (plus de N jours)
 */
export const DELETE_OLD_INFORMATIONS = `
  DELETE FROM informations
  WHERE date_creation < DATE_SUB(NOW(), INTERVAL ? DAY)
    AND status_id IN (2, 3)
`;

// ============================================================================
// QUERIES D'INSERTION - CATÉGORIES
// ============================================================================

/**
 * Insérer une nouvelle catégorie
 */
export const INSERT_CATEGORIE = `
  INSERT INTO categories_informations (nom, description, couleur, icone)
  VALUES (?, ?, ?, ?)
`;

// ============================================================================
// QUERIES DE MISE À JOUR - CATÉGORIES
// ============================================================================

/**
 * Mettre à jour une catégorie
 */
export const UPDATE_CATEGORIE = `
  UPDATE categories_informations
  SET
    nom = ?,
    description = ?,
    couleur = ?,
    icone = ?
  WHERE id = ?
`;

/**
 * Mettre à jour le nom d'une catégorie
 */
export const UPDATE_CATEGORIE_NOM = `
  UPDATE categories_informations
  SET nom = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE SUPPRESSION - CATÉGORIES
// ============================================================================

/**
 * Supprimer une catégorie
 */
export const DELETE_CATEGORIE = `
  DELETE FROM categories_informations
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'HISTORIQUE
// ============================================================================

/**
 * Insérer un historique de modification
 */
export const INSERT_HISTORIQUE = `
  INSERT INTO informations_historique (
    information_id,
    champ_modifie,
    ancienne_valeur,
    nouvelle_valeur,
    utilisateur_id,
    date_modification
  )
  VALUES (?, ?, ?, ?, ?, NOW())
`;

/**
 * Supprimer l'historique d'une information
 */
export const DELETE_HISTORIQUE_BY_INFORMATION = `
  DELETE FROM informations_historique
  WHERE information_id = ?
`;

// ============================================================================
// QUERIES DE VUES/TRACKING
// ============================================================================

/**
 * Insérer une vue d'information
 */
export const INSERT_VUE = `
  INSERT INTO informations_vues (
    information_id,
    utilisateur_id,
    date_vue,
    ip_address
  )
  VALUES (?, ?, NOW(), ?)
`;

/**
 * Incrémenter le compteur de vues
 */
export const INCREMENT_VUES_COUNT = `
  UPDATE informations
  SET vues_count = vues_count + 1
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE NOTIFICATIONS
// ============================================================================

/**
 * Insérer une notification
 */
export const INSERT_NOTIFICATION = `
  INSERT INTO informations_notifications (
    information_id,
    utilisateur_id,
    lu,
    date_notification
  )
  VALUES (?, ?, 0, NOW())
`;

/**
 * Marquer une notification comme lue
 */
export const MARK_NOTIFICATION_READ = `
  UPDATE informations_notifications
  SET lu = 1
  WHERE id = ?
`;

/**
 * Marquer toutes les notifications d'un utilisateur comme lues
 */
export const MARK_ALL_NOTIFICATIONS_READ = `
  UPDATE informations_notifications
  SET lu = 1
  WHERE utilisateur_id = ?
`;

/**
 * Supprimer les notifications d'une information
 */
export const DELETE_NOTIFICATIONS_BY_INFORMATION = `
  DELETE FROM informations_notifications
  WHERE information_id = ?
`;

// ============================================================================
// QUERIES DE MAINTENANCE
// ============================================================================

/**
 * Nettoyer les anciennes vues (plus de N jours)
 */
export const CLEANUP_OLD_VUES = `
  DELETE FROM informations_vues
  WHERE date_vue < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

/**
 * Nettoyer les anciennes notifications lues
 */
export const CLEANUP_OLD_NOTIFICATIONS = `
  DELETE FROM informations_notifications
  WHERE lu = 1
    AND date_notification < DATE_SUB(NOW(), INTERVAL ? DAY)
`;

/**
 * Archiver automatiquement les informations obsolètes
 */
export const AUTO_ARCHIVE_OLD_INFORMATIONS = `
  UPDATE informations
  SET
    status_id = 2,
    date_modification = NOW()
  WHERE date_creation < DATE_SUB(NOW(), INTERVAL ? DAY)
    AND status_id = 1
    AND priorite < 3
`;

/**
 * Réinitialiser les compteurs de vues
 */
export const RESET_VUES_COUNT = `
  UPDATE informations
  SET vues_count = 0
  WHERE id = ?
`;

// ============================================================================
// QUERIES BATCH
// ============================================================================

/**
 * Mettre à jour le status de plusieurs informations
 */
export const UPDATE_MULTIPLE_INFORMATIONS_STATUS = `
  UPDATE informations
  SET
    status_id = ?,
    date_modification = NOW()
  WHERE id IN (?)
`;

/**
 * Supprimer plusieurs informations
 */
export const DELETE_MULTIPLE_INFORMATIONS = `
  DELETE FROM informations
  WHERE id IN (?)
`;

/**
 * Archiver plusieurs informations
 */
export const ARCHIVE_MULTIPLE_INFORMATIONS = `
  UPDATE informations
  SET
    status_id = 2,
    date_modification = NOW()
  WHERE id IN (?)
`;

/**
 * Restaurer plusieurs informations
 */
export const RESTORE_MULTIPLE_INFORMATIONS = `
  UPDATE informations
  SET
    status_id = 1,
    date_modification = NOW()
  WHERE id IN (?)
`;
