/**
 * Requêtes SQL d'ÉCRITURE pour le module Magasin
 * Responsabilité: Requêtes INSERT, UPDATE, DELETE
 */

// ============================================================================
// QUERIES D'INSERTION D'ARTICLES
// ============================================================================

/**
 * Insérer un nouvel article
 */
export const INSERT_ARTICLE = `
  INSERT INTO articles (nom, prix, description, categorie_id)
  VALUES (?, ?, ?, ?)
`;

/**
 * Insérer une image d'article
 */
export const INSERT_IMAGE = `
  INSERT INTO images (article_id, url)
  VALUES (?, ?)
`;

/**
 * Insérer plusieurs images (batch)
 */
export const INSERT_IMAGES_BATCH = `
  INSERT INTO images (article_id, url)
  VALUES ?
`;

// ============================================================================
// QUERIES DE MISE À JOUR D'ARTICLES
// ============================================================================

/**
 * Mettre à jour un article
 */
export const UPDATE_ARTICLE = `
  UPDATE articles
  SET nom = ?, prix = ?, description = ?, categorie_id = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le nom d'un article
 */
export const UPDATE_ARTICLE_NAME = `
  UPDATE articles
  SET nom = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le prix d'un article
 */
export const UPDATE_ARTICLE_PRICE = `
  UPDATE articles
  SET prix = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour la description d'un article
 */
export const UPDATE_ARTICLE_DESCRIPTION = `
  UPDATE articles
  SET description = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour la catégorie d'un article
 */
export const UPDATE_ARTICLE_CATEGORIE = `
  UPDATE articles
  SET categorie_id = ?, updated_at = NOW()
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE SUPPRESSION D'ARTICLES
// ============================================================================

/**
 * Supprimer un article
 */
export const DELETE_ARTICLE = `
  DELETE FROM articles
  WHERE id = ?
`;

/**
 * Supprimer toutes les images d'un article
 */
export const DELETE_IMAGES_BY_ARTICLE = `
  DELETE FROM images
  WHERE article_id = ?
`;

/**
 * Supprimer une image spécifique
 */
export const DELETE_IMAGE = `
  DELETE FROM images
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'INSERTION DE STOCKS
// ============================================================================

/**
 * Insérer un nouveau stock
 */
export const INSERT_STOCK = `
  INSERT INTO stocks (article_id, taille_id, quantite)
  VALUES (?, ?, ?)
`;

/**
 * Insérer plusieurs stocks (batch)
 */
export const INSERT_STOCKS_BATCH = `
  INSERT INTO stocks (article_id, taille_id, quantite)
  VALUES ?
`;

// ============================================================================
// QUERIES DE MISE À JOUR DE STOCKS
// ============================================================================

/**
 * Mettre à jour la quantité d'un stock
 */
export const UPDATE_STOCK_QUANTITY = `
  UPDATE stocks
  SET quantite = ?
  WHERE article_id = ? AND taille_id = ?
`;

/**
 * Incrémenter la quantité d'un stock
 */
export const INCREMENT_STOCK_QUANTITY = `
  UPDATE stocks
  SET quantite = quantite + ?
  WHERE article_id = ? AND taille_id = ?
`;

/**
 * Décrémenter la quantité d'un stock
 */
export const DECREMENT_STOCK_QUANTITY = `
  UPDATE stocks
  SET quantite = quantite - ?
  WHERE article_id = ? AND taille_id = ? AND quantite >= ?
`;

/**
 * Mettre à jour un stock (upsert-like - avec ON DUPLICATE KEY)
 */
export const UPSERT_STOCK = `
  INSERT INTO stocks (article_id, taille_id, quantite)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE quantite = quantite + VALUES(quantite)
`;

// ============================================================================
// QUERIES DE SUPPRESSION DE STOCKS
// ============================================================================

/**
 * Supprimer tous les stocks d'un article
 */
export const DELETE_STOCKS_BY_ARTICLE = `
  DELETE FROM stocks
  WHERE article_id = ?
`;

/**
 * Supprimer un stock spécifique
 */
export const DELETE_STOCK = `
  DELETE FROM stocks
  WHERE article_id = ? AND taille_id = ?
`;

// ============================================================================
// QUERIES D'INSERTION DE COMMANDES
// ============================================================================

/**
 * Insérer une nouvelle commande
 */
export const INSERT_COMMANDE = `
  INSERT INTO commandes (utilisateur_id, date_commande, statut, total)
  VALUES (?, ?, ?, ?)
`;

/**
 * Insérer un article dans une commande
 */
export const INSERT_ARTICLE_COMMANDE = `
  INSERT INTO articles_commandes (commande_id, article_id, taille_id, quantite, prix)
  VALUES (?, ?, ?, ?, ?)
`;

/**
 * Insérer plusieurs articles dans une commande (batch)
 */
export const INSERT_ARTICLES_COMMANDE_BATCH = `
  INSERT INTO articles_commandes (commande_id, article_id, taille_id, quantite, prix)
  VALUES ?
`;

// ============================================================================
// QUERIES DE MISE À JOUR DE COMMANDES
// ============================================================================

/**
 * Mettre à jour le statut d'une commande
 */
export const UPDATE_COMMANDE_STATUT = `
  UPDATE commandes
  SET statut = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour le total d'une commande
 */
export const UPDATE_COMMANDE_TOTAL = `
  UPDATE commandes
  SET total = ?, updated_at = NOW()
  WHERE id = ?
`;

/**
 * Mettre à jour une commande complète
 */
export const UPDATE_COMMANDE = `
  UPDATE commandes
  SET statut = ?, total = ?, updated_at = NOW()
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE SUPPRESSION DE COMMANDES
// ============================================================================

/**
 * Supprimer une commande
 */
export const DELETE_COMMANDE = `
  DELETE FROM commandes
  WHERE id = ?
`;

/**
 * Supprimer tous les articles d'une commande
 */
export const DELETE_ARTICLES_BY_COMMANDE = `
  DELETE FROM articles_commandes
  WHERE commande_id = ?
`;

/**
 * Supprimer un article spécifique d'une commande
 */
export const DELETE_ARTICLE_FROM_COMMANDE = `
  DELETE FROM articles_commandes
  WHERE commande_id = ? AND article_id = ? AND taille_id = ?
`;

/**
 * Annuler une commande (soft delete via statut)
 */
export const CANCEL_COMMANDE = `
  UPDATE commandes
  SET statut = 'annulee', updated_at = NOW()
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'INSERTION DE CATÉGORIES
// ============================================================================

/**
 * Insérer une nouvelle catégorie
 */
export const INSERT_CATEGORIE = `
  INSERT INTO categories (nom)
  VALUES (?)
`;

// ============================================================================
// QUERIES DE MISE À JOUR DE CATÉGORIES
// ============================================================================

/**
 * Mettre à jour une catégorie
 */
export const UPDATE_CATEGORIE = `
  UPDATE categories
  SET nom = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE SUPPRESSION DE CATÉGORIES
// ============================================================================

/**
 * Supprimer une catégorie
 */
export const DELETE_CATEGORIE = `
  DELETE FROM categories
  WHERE id = ?
`;

// ============================================================================
// QUERIES D'INSERTION DE TAILLES
// ============================================================================

/**
 * Insérer une nouvelle taille
 */
export const INSERT_TAILLE = `
  INSERT INTO tailles (nom)
  VALUES (?)
`;

// ============================================================================
// QUERIES DE MISE À JOUR DE TAILLES
// ============================================================================

/**
 * Mettre à jour une taille
 */
export const UPDATE_TAILLE = `
  UPDATE tailles
  SET nom = ?
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE SUPPRESSION DE TAILLES
// ============================================================================

/**
 * Supprimer une taille
 */
export const DELETE_TAILLE = `
  DELETE FROM tailles
  WHERE id = ?
`;

// ============================================================================
// QUERIES TRANSACTIONNELLES
// ============================================================================

/**
 * Créer une commande complète avec mise à jour des stocks
 * Note: Cette opération doit être effectuée dans une transaction
 */
export const CREATE_COMMANDE_TRANSACTION = {
  insertCommande: INSERT_COMMANDE,
  insertArticles: INSERT_ARTICLES_COMMANDE_BATCH,
  decrementStocks: DECREMENT_STOCK_QUANTITY,
};

/**
 * Supprimer un article avec toutes ses dépendances
 * Note: Cette opération doit être effectuée dans une transaction
 */
export const DELETE_ARTICLE_TRANSACTION = {
  deleteImages: DELETE_IMAGES_BY_ARTICLE,
  deleteStocks: DELETE_STOCKS_BY_ARTICLE,
  deleteArticle: DELETE_ARTICLE,
};
