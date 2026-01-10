/**
 * Requêtes SQL de VALIDATION pour le module Magasin
 * Responsabilité: Requêtes de vérification d'existence et de validation
 */

// ============================================================================
// QUERIES DE VALIDATION D'ARTICLES
// ============================================================================

/**
 * Vérifier si un article existe
 */
export const CHECK_ARTICLE_EXISTS = `
  SELECT COUNT(*) AS count
  FROM articles
  WHERE id = ?
`;

/**
 * Vérifier si un article existe par nom
 */
export const CHECK_ARTICLE_EXISTS_BY_NAME = `
  SELECT COUNT(*) AS count
  FROM articles
  WHERE nom = ?
`;

/**
 * Vérifier si un article existe dans une catégorie
 */
export const CHECK_ARTICLE_EXISTS_IN_CATEGORIE = `
  SELECT COUNT(*) AS count
  FROM articles
  WHERE nom = ? AND categorie_id = ?
`;

/**
 * Vérifier si un article a des stocks
 */
export const CHECK_ARTICLE_HAS_STOCK = `
  SELECT COUNT(*) AS count
  FROM stocks
  WHERE article_id = ? AND quantite > 0
`;

/**
 * Vérifier si un article a des commandes
 */
export const CHECK_ARTICLE_HAS_ORDERS = `
  SELECT COUNT(*) AS count
  FROM articles_commandes
  WHERE article_id = ?
`;

/**
 * Vérifier si un article a des images
 */
export const CHECK_ARTICLE_HAS_IMAGES = `
  SELECT COUNT(*) AS count
  FROM images
  WHERE article_id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE STOCKS
// ============================================================================

/**
 * Vérifier si un stock existe
 */
export const CHECK_STOCK_EXISTS = `
  SELECT COUNT(*) AS count
  FROM stocks
  WHERE article_id = ? AND taille_id = ?
`;

/**
 * Vérifier si la quantité en stock est suffisante
 */
export const CHECK_STOCK_SUFFICIENT = `
  SELECT quantite
  FROM stocks
  WHERE article_id = ? AND taille_id = ?
`;

/**
 * Vérifier si un article a du stock pour une taille
 */
export const CHECK_ARTICLE_HAS_SIZE_IN_STOCK = `
  SELECT COUNT(*) AS count
  FROM stocks
  WHERE article_id = ? AND taille_id = ? AND quantite > 0
`;

/**
 * Vérifier la disponibilité complète pour une commande
 */
export const CHECK_STOCK_AVAILABILITY_FOR_ORDER = `
  SELECT
    s.article_id,
    s.taille_id,
    s.quantite AS stock_disponible,
    ? AS quantite_demandee,
    CASE WHEN s.quantite >= ? THEN 1 ELSE 0 END AS disponible
  FROM stocks s
  WHERE s.article_id = ? AND s.taille_id = ?
`;

/**
 * Obtenir les stocks disponibles pour plusieurs articles
 */
export const CHECK_MULTIPLE_STOCKS_AVAILABILITY = `
  SELECT
    article_id,
    taille_id,
    quantite
  FROM stocks
  WHERE (article_id, taille_id) IN (?)
`;

// ============================================================================
// QUERIES DE VALIDATION DE CATÉGORIES
// ============================================================================

/**
 * Vérifier si une catégorie existe
 */
export const CHECK_CATEGORIE_EXISTS = `
  SELECT COUNT(*) AS count
  FROM categories
  WHERE id = ?
`;

/**
 * Vérifier si une catégorie existe par nom
 */
export const CHECK_CATEGORIE_EXISTS_BY_NAME = `
  SELECT COUNT(*) AS count
  FROM categories
  WHERE nom = ?
`;

/**
 * Vérifier si une catégorie a des articles
 */
export const CHECK_CATEGORIE_HAS_ARTICLES = `
  SELECT COUNT(*) AS count
  FROM articles
  WHERE categorie_id = ?
`;

/**
 * Vérifier si une catégorie peut être supprimée
 */
export const CHECK_CATEGORIE_CAN_BE_DELETED = `
  SELECT
    COUNT(*) AS article_count,
    CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END AS can_delete
  FROM articles
  WHERE categorie_id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE TAILLES
// ============================================================================

/**
 * Vérifier si une taille existe
 */
export const CHECK_TAILLE_EXISTS = `
  SELECT COUNT(*) AS count
  FROM tailles
  WHERE id = ?
`;

/**
 * Vérifier si une taille existe par nom
 */
export const CHECK_TAILLE_EXISTS_BY_NAME = `
  SELECT COUNT(*) AS count
  FROM tailles
  WHERE nom = ?
`;

/**
 * Vérifier si une taille est utilisée dans les stocks
 */
export const CHECK_TAILLE_IN_USE = `
  SELECT COUNT(*) AS count
  FROM stocks
  WHERE taille_id = ?
`;

/**
 * Vérifier si une taille peut être supprimée
 */
export const CHECK_TAILLE_CAN_BE_DELETED = `
  SELECT
    COUNT(*) AS stock_count,
    CASE WHEN COUNT(*) = 0 THEN 1 ELSE 0 END AS can_delete
  FROM stocks
  WHERE taille_id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION DE COMMANDES
// ============================================================================

/**
 * Vérifier si une commande existe
 */
export const CHECK_COMMANDE_EXISTS = `
  SELECT COUNT(*) AS count
  FROM commandes
  WHERE id = ?
`;

/**
 * Vérifier si une commande appartient à un utilisateur
 */
export const CHECK_COMMANDE_BELONGS_TO_USER = `
  SELECT COUNT(*) AS count
  FROM commandes
  WHERE id = ? AND utilisateur_id = ?
`;

/**
 * Vérifier si une commande peut être modifiée
 */
export const CHECK_COMMANDE_CAN_BE_MODIFIED = `
  SELECT
    statut,
    CASE WHEN statut IN ('en_attente', 'confirmee') THEN 1 ELSE 0 END AS can_modify
  FROM commandes
  WHERE id = ?
`;

/**
 * Vérifier si une commande peut être annulée
 */
export const CHECK_COMMANDE_CAN_BE_CANCELLED = `
  SELECT
    statut,
    CASE WHEN statut NOT IN ('expediee', 'livree', 'annulee') THEN 1 ELSE 0 END AS can_cancel
  FROM commandes
  WHERE id = ?
`;

/**
 * Vérifier si une commande a des articles
 */
export const CHECK_COMMANDE_HAS_ARTICLES = `
  SELECT COUNT(*) AS count
  FROM articles_commandes
  WHERE commande_id = ?
`;

/**
 * Vérifier le statut d'une commande
 */
export const CHECK_COMMANDE_STATUS = `
  SELECT statut
  FROM commandes
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION D'UTILISATEURS
// ============================================================================

/**
 * Vérifier si un utilisateur existe
 */
export const CHECK_USER_EXISTS = `
  SELECT COUNT(*) AS count
  FROM utilisateurs
  WHERE id = ?
`;

/**
 * Vérifier si un utilisateur est actif
 */
export const CHECK_USER_IS_ACTIVE = `
  SELECT COUNT(*) AS count
  FROM utilisateurs
  WHERE id = ? AND status_id = 1
`;

/**
 * Vérifier si un utilisateur a des commandes
 */
export const CHECK_USER_HAS_ORDERS = `
  SELECT COUNT(*) AS count
  FROM commandes
  WHERE utilisateur_id = ?
`;

// ============================================================================
// QUERIES DE VALIDATION D'IMAGES
// ============================================================================

/**
 * Vérifier si une image existe
 */
export const CHECK_IMAGE_EXISTS = `
  SELECT COUNT(*) AS count
  FROM images
  WHERE id = ?
`;

/**
 * Vérifier si une image appartient à un article
 */
export const CHECK_IMAGE_BELONGS_TO_ARTICLE = `
  SELECT COUNT(*) AS count
  FROM images
  WHERE id = ? AND article_id = ?
`;

/**
 * Vérifier si une URL d'image existe déjà
 */
export const CHECK_IMAGE_URL_EXISTS = `
  SELECT COUNT(*) AS count
  FROM images
  WHERE url = ?
`;

// ============================================================================
// QUERIES DE VALIDATION COMPLEXES
// ============================================================================

/**
 * Vérifier la cohérence d'un article avant création
 */
export const VALIDATE_ARTICLE_CREATION = `
  SELECT
    (SELECT COUNT(*) FROM articles WHERE nom = ?) AS nom_exists,
    (SELECT COUNT(*) FROM categories WHERE id = ?) AS categorie_exists
`;

/**
 * Vérifier la cohérence d'une commande avant création
 */
export const VALIDATE_COMMANDE_CREATION = `
  SELECT
    (SELECT COUNT(*) FROM utilisateurs WHERE id = ? AND status_id = 1) AS user_valid,
    COUNT(*) AS articles_valid
  FROM articles
  WHERE id IN (?)
`;

/**
 * Vérifier la disponibilité des stocks pour une liste d'articles
 */
export const VALIDATE_STOCKS_FOR_COMMANDE = `
  SELECT
    s.article_id,
    s.taille_id,
    s.quantite AS stock_disponible,
    a.nom AS article_nom,
    t.nom AS taille_nom,
    CASE WHEN s.quantite >= ? THEN 1 ELSE 0 END AS disponible
  FROM stocks s
  INNER JOIN articles a ON a.id = s.article_id
  INNER JOIN tailles t ON t.id = s.taille_id
  WHERE s.article_id = ? AND s.taille_id = ?
`;

/**
 * Vérifier l'intégrité référentielle avant suppression d'article
 */
export const VALIDATE_ARTICLE_DELETION = `
  SELECT
    (SELECT COUNT(*) FROM articles_commandes WHERE article_id = ?) AS in_orders,
    (SELECT COUNT(*) FROM stocks WHERE article_id = ?) AS has_stocks,
    (SELECT COUNT(*) FROM images WHERE article_id = ?) AS has_images
`;

/**
 * Vérifier si un article peut être commandé
 */
export const VALIDATE_ARTICLE_CAN_BE_ORDERED = `
  SELECT
    a.id,
    a.nom,
    a.prix,
    CASE WHEN EXISTS (
      SELECT 1 FROM stocks s WHERE s.article_id = a.id AND s.quantite > 0
    ) THEN 1 ELSE 0 END AS has_stock
  FROM articles a
  WHERE a.id = ?
`;
