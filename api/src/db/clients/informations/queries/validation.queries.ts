/**
 * Requêtes SQL de VALIDATION pour le module Informations
 * Responsabilité: Vérifications et validations
 */

// ============================================================================
// QUERIES DE VÉRIFICATION D'EXISTENCE
// ============================================================================

/**
 * Vérifier si une information existe
 */
export const CHECK_INFORMATION_EXISTS = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
`;

/**
 * Vérifier si une information active existe
 */
export const CHECK_ACTIVE_INFORMATION_EXISTS = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ? AND status_id = 1
`;

/**
 * Vérifier si une catégorie existe
 */
export const CHECK_CATEGORIE_EXISTS = `
  SELECT COUNT(*) AS count
  FROM categories_informations
  WHERE id = ?
`;

/**
 * Vérifier si un auteur existe
 */
export const CHECK_AUTEUR_EXISTS = `
  SELECT COUNT(*) AS count
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un status existe
 */
export const CHECK_STATUS_EXISTS = `
  SELECT COUNT(*) AS count
  FROM status
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE VÉRIFICATION DE DOUBLONS
// ============================================================================

/**
 * Vérifier si une information avec le même titre existe déjà
 */
export const CHECK_DUPLICATE_TITRE = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE titre = ?
    AND id != ?
    AND status_id = 1
`;

/**
 * Vérifier si une information avec le même titre existe (pour création)
 */
export const CHECK_DUPLICATE_TITRE_NEW = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE titre = ?
    AND status_id = 1
`;

/**
 * Vérifier si une catégorie avec le même nom existe
 */
export const CHECK_DUPLICATE_CATEGORIE = `
  SELECT COUNT(*) AS count
  FROM categories_informations
  WHERE nom = ?
    AND id != ?
`;

/**
 * Vérifier si une catégorie avec le même nom existe (pour création)
 */
export const CHECK_DUPLICATE_CATEGORIE_NEW = `
  SELECT COUNT(*) AS count
  FROM categories_informations
  WHERE nom = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE PERMISSIONS
// ============================================================================

/**
 * Vérifier si un utilisateur peut modifier une information
 */
export const CHECK_CAN_EDIT_INFORMATION = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND (auteur_id = ? OR ? IN (
      SELECT id FROM utilisateurs WHERE id = ? AND status_id IN (2, 3)
    ))
`;

/**
 * Vérifier si un utilisateur est l'auteur d'une information
 */
export const CHECK_IS_AUTHOR = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND auteur_id = ?
`;

/**
 * Vérifier si un utilisateur est admin ou manager
 */
export const CHECK_IS_ADMIN_OR_MANAGER = `
  SELECT COUNT(*) AS count
  FROM utilisateurs
  WHERE id = ?
    AND status_id IN (2, 3)
`;

// ============================================================================
// QUERIES DE VALIDATION DE STATUT
// ============================================================================

/**
 * Vérifier si une information est publiée
 */
export const CHECK_IS_PUBLISHED = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND status_id = 1
`;

/**
 * Vérifier si une information est en brouillon
 */
export const CHECK_IS_DRAFT = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND status_id = 0
`;

/**
 * Vérifier si une information est archivée
 */
export const CHECK_IS_ARCHIVED = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND status_id = 2
`;

/**
 * Vérifier si une information est supprimée
 */
export const CHECK_IS_DELETED = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND status_id = 3
`;

/**
 * Vérifier si une information est visible
 */
export const CHECK_IS_VISIBLE = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND visible = 1
`;

// ============================================================================
// QUERIES DE VALIDATION DE DATES
// ============================================================================

/**
 * Vérifier si une information a été modifiée récemment
 */
export const CHECK_RECENTLY_MODIFIED = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND date_modification >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
`;

/**
 * Vérifier si une information est récente
 */
export const CHECK_IS_RECENT = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE id = ?
    AND date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
`;

// ============================================================================
// QUERIES DE VALIDATION DE DÉPENDANCES
// ============================================================================

/**
 * Vérifier si une catégorie a des informations associées
 */
export const CHECK_CATEGORIE_HAS_INFORMATIONS = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE categorie_id = ?
    AND status_id != 3
`;

/**
 * Vérifier si un auteur a des informations associées
 */
export const CHECK_AUTEUR_HAS_INFORMATIONS = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE auteur_id = ?
    AND status_id != 3
`;

/**
 * Vérifier si une information a des notifications actives
 */
export const CHECK_HAS_ACTIVE_NOTIFICATIONS = `
  SELECT COUNT(*) AS count
  FROM informations_notifications
  WHERE information_id = ?
    AND lu = 0
`;

/**
 * Vérifier si une information a un historique
 */
export const CHECK_HAS_HISTORIQUE = `
  SELECT COUNT(*) AS count
  FROM informations_historique
  WHERE information_id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE CONTENU
// ============================================================================

/**
 * Vérifier la longueur du titre
 */
export const VALIDATE_TITRE_LENGTH = `
  SELECT
    CHAR_LENGTH(titre) AS longueur,
    CASE
      WHEN CHAR_LENGTH(titre) >= 3 AND CHAR_LENGTH(titre) <= 200 THEN 1
      ELSE 0
    END AS valide
  FROM informations
  WHERE id = ?
`;

/**
 * Vérifier la longueur du contenu
 */
export const VALIDATE_CONTENU_LENGTH = `
  SELECT
    CHAR_LENGTH(contenu) AS longueur,
    CASE
      WHEN CHAR_LENGTH(contenu) >= 10 THEN 1
      ELSE 0
    END AS valide
  FROM informations
  WHERE id = ?
`;

/**
 * Vérifier si une priorité est valide
 */
export const VALIDATE_PRIORITE = `
  SELECT
    CASE
      WHEN ? BETWEEN 1 AND 4 THEN 1
      ELSE 0
    END AS valide
`;

// ============================================================================
// QUERIES DE VALIDATION COMPLÈTE
// ============================================================================

/**
 * Validation complète d'une information
 */
export const VALIDATE_INFORMATION_COMPLETE = `
  SELECT
    i.id,
    i.titre,
    i.contenu,
    i.status_id,
    i.visible,
    CASE
      WHEN CHAR_LENGTH(i.titre) >= 3 AND CHAR_LENGTH(i.titre) <= 200 THEN 1
      ELSE 0
    END AS titre_valide,
    CASE
      WHEN CHAR_LENGTH(i.contenu) >= 10 THEN 1
      ELSE 0
    END AS contenu_valide,
    CASE
      WHEN i.categorie_id IS NULL OR EXISTS (
        SELECT 1 FROM categories_informations WHERE id = i.categorie_id
      ) THEN 1
      ELSE 0
    END AS categorie_valide,
    CASE
      WHEN i.auteur_id IS NULL OR EXISTS (
        SELECT 1 FROM utilisateurs WHERE id = i.auteur_id
      ) THEN 1
      ELSE 0
    END AS auteur_valide,
    CASE
      WHEN i.priorite IS NULL OR (i.priorite BETWEEN 1 AND 4) THEN 1
      ELSE 0
    END AS priorite_valide
  FROM informations i
  WHERE i.id = ?
`;

/**
 * Vérifier si une information peut être publiée
 */
export const CHECK_CAN_PUBLISH = `
  SELECT
    CASE
      WHEN
        CHAR_LENGTH(titre) >= 3 AND
        CHAR_LENGTH(contenu) >= 10 AND
        status_id = 0 AND
        (auteur_id IS NOT NULL)
      THEN 1
      ELSE 0
    END AS can_publish
  FROM informations
  WHERE id = ?
`;

/**
 * Vérifier si une information peut être archivée
 */
export const CHECK_CAN_ARCHIVE = `
  SELECT
    CASE
      WHEN status_id = 1 THEN 1
      ELSE 0
    END AS can_archive
  FROM informations
  WHERE id = ?
`;

/**
 * Vérifier si une information peut être restaurée
 */
export const CHECK_CAN_RESTORE = `
  SELECT
    CASE
      WHEN status_id IN (2, 3) THEN 1
      ELSE 0
    END AS can_restore
  FROM informations
  WHERE id = ?
`;

/**
 * Vérifier si une information peut être supprimée
 */
export const CHECK_CAN_DELETE = `
  SELECT
    CASE
      WHEN status_id IN (0, 2, 3) THEN 1
      ELSE 0
    END AS can_delete
  FROM informations
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE COMPTAGE POUR VALIDATION
// ============================================================================

/**
 * Compter les informations actives d'une catégorie
 */
export const COUNT_ACTIVE_INFORMATIONS_BY_CATEGORIE = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE categorie_id = ?
    AND status_id = 1
`;

/**
 * Compter les informations en brouillon d'un auteur
 */
export const COUNT_DRAFTS_BY_AUTEUR = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE auteur_id = ?
    AND status_id = 0
`;

/**
 * Compter les informations publiées d'un auteur
 */
export const COUNT_PUBLISHED_BY_AUTEUR = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE auteur_id = ?
    AND status_id = 1
`;
