/**
 * Requêtes SQL de LECTURE pour le module Magasin
 * Responsabilité: Requêtes SELECT uniquement
 */

// ============================================================================
// QUERIES DE LECTURE D'ARTICLES
// ============================================================================

/**
 * Sélectionner tous les articles avec leurs relations complètes
 */
export const SELECT_ALL_ARTICLES_WITH_RELATIONS = `
  SELECT
    a.id,
    a.nom,
    a.prix,
    a.description,
    a.categorie_id,
    i.url AS image_url,
    t.nom AS stock_taille,
    s.quantite AS stock_quantite,
    c.nom AS categorie_nom
  FROM articles a
  LEFT JOIN images i ON i.article_id = a.id
  LEFT JOIN stocks s ON s.article_id = a.id
  LEFT JOIN tailles t ON t.id = s.taille_id
  LEFT JOIN categories c ON c.id = a.categorie_id
  ORDER BY a.id
`;

/**
 * Sélectionner un article par ID
 */
export const SELECT_ARTICLE_BY_ID = `
  SELECT * FROM articles
  WHERE id = ?
`;

/**
 * Sélectionner un article avec ses relations
 */
export const SELECT_ARTICLE_WITH_RELATIONS = `
  SELECT
    a.id,
    a.nom,
    a.prix,
    a.description,
    a.categorie_id,
    i.url AS image_url,
    t.nom AS stock_taille,
    s.quantite AS stock_quantite,
    c.nom AS categorie_nom
  FROM articles a
  LEFT JOIN images i ON i.article_id = a.id
  LEFT JOIN stocks s ON s.article_id = a.id
  LEFT JOIN tailles t ON t.id = s.taille_id
  LEFT JOIN categories c ON c.id = a.categorie_id
  WHERE a.id = ?
`;

/**
 * Sélectionner tous les articles par catégorie
 */
export const SELECT_ARTICLES_BY_CATEGORIE = `
  SELECT
    a.id,
    a.nom,
    a.prix,
    a.description,
    a.categorie_id,
    i.url AS image_url,
    t.nom AS stock_taille,
    s.quantite AS stock_quantite,
    c.nom AS categorie_nom
  FROM articles a
  LEFT JOIN images i ON i.article_id = a.id
  LEFT JOIN stocks s ON s.article_id = a.id
  LEFT JOIN tailles t ON t.id = s.taille_id
  LEFT JOIN categories c ON c.id = a.categorie_id
  WHERE a.categorie_id = ?
  ORDER BY a.nom
`;

/**
 * Sélectionner tous les articles organisés par catégorie
 */
export const SELECT_ARTICLES_GROUPED_BY_CATEGORIES = `
  SELECT
    a.id,
    a.nom,
    a.prix,
    a.description,
    a.categorie_id,
    i.url AS image_url,
    t.nom AS stock_taille,
    s.quantite AS stock_quantite,
    c.nom AS categorie_nom
  FROM articles a
  LEFT JOIN images i ON i.article_id = a.id
  LEFT JOIN stocks s ON s.article_id = a.id
  LEFT JOIN tailles t ON t.id = s.taille_id
  LEFT JOIN categories c ON c.id = a.categorie_id
  ORDER BY c.nom, a.id
`;

/**
 * Rechercher des articles par nom
 */
export const SEARCH_ARTICLES_BY_NAME = `
  SELECT
    a.*,
    c.nom AS categorie_nom
  FROM articles a
  LEFT JOIN categories c ON c.id = a.categorie_id
  WHERE a.nom LIKE ?
  ORDER BY a.nom
`;

/**
 * Rechercher des articles par plage de prix
 */
export const SEARCH_ARTICLES_BY_PRICE_RANGE = `
  SELECT
    a.*,
    c.nom AS categorie_nom
  FROM articles a
  LEFT JOIN categories c ON c.id = a.categorie_id
  WHERE a.prix BETWEEN ? AND ?
  ORDER BY a.prix
`;

// ============================================================================
// QUERIES DE LECTURE DE STOCKS
// ============================================================================

/**
 * Sélectionner tous les stocks
 */
export const SELECT_ALL_STOCKS = `
  SELECT
    s.id,
    s.article_id,
    s.taille_id,
    s.quantite,
    t.nom AS taille_nom,
    a.nom AS article_nom
  FROM stocks s
  LEFT JOIN tailles t ON t.id = s.taille_id
  LEFT JOIN articles a ON a.id = s.article_id
  ORDER BY a.nom, t.nom
`;

/**
 * Sélectionner les stocks d'un article
 */
export const SELECT_STOCKS_BY_ARTICLE = `
  SELECT
    s.id,
    s.article_id,
    s.taille_id,
    s.quantite,
    t.nom AS taille_nom
  FROM stocks s
  LEFT JOIN tailles t ON t.id = s.taille_id
  WHERE s.article_id = ?
  ORDER BY t.nom
`;

/**
 * Sélectionner un stock spécifique
 */
export const SELECT_STOCK_BY_ARTICLE_AND_TAILLE = `
  SELECT
    s.id,
    s.article_id,
    s.taille_id,
    s.quantite,
    t.nom AS taille_nom
  FROM stocks s
  LEFT JOIN tailles t ON t.id = s.taille_id
  WHERE s.article_id = ? AND s.taille_id = ?
`;

/**
 * Vérifier l'existence d'un stock
 */
export const CHECK_STOCK_EXISTS = `
  SELECT id, quantite
  FROM stocks
  WHERE article_id = ? AND taille_id = ?
`;

/**
 * Sélectionner les articles en rupture de stock
 */
export const SELECT_OUT_OF_STOCK_ARTICLES = `
  SELECT DISTINCT
    a.id,
    a.nom,
    a.prix,
    c.nom AS categorie_nom
  FROM articles a
  LEFT JOIN categories c ON c.id = a.categorie_id
  LEFT JOIN stocks s ON s.article_id = a.id
  WHERE s.quantite = 0 OR s.id IS NULL
  ORDER BY a.nom
`;

/**
 * Sélectionner les articles avec stock faible
 */
export const SELECT_LOW_STOCK_ARTICLES = `
  SELECT
    a.id,
    a.nom,
    s.quantite,
    t.nom AS taille_nom
  FROM articles a
  LEFT JOIN stocks s ON s.article_id = a.id
  LEFT JOIN tailles t ON t.id = s.taille_id
  WHERE s.quantite <= ?
  ORDER BY s.quantite ASC, a.nom
`;

// ============================================================================
// QUERIES DE LECTURE DE CATÉGORIES
// ============================================================================

/**
 * Sélectionner toutes les catégories
 */
export const SELECT_ALL_CATEGORIES = `
  SELECT id, nom
  FROM categories
  ORDER BY nom
`;

/**
 * Sélectionner une catégorie par ID
 */
export const SELECT_CATEGORIE_BY_ID = `
  SELECT id, nom
  FROM categories
  WHERE id = ?
`;

/**
 * Sélectionner une catégorie par nom
 */
export const SELECT_CATEGORIE_BY_NAME = `
  SELECT id, nom
  FROM categories
  WHERE nom = ?
`;

/**
 * Compter les articles par catégorie
 */
export const COUNT_ARTICLES_BY_CATEGORIE = `
  SELECT
    c.id,
    c.nom,
    COUNT(a.id) AS article_count
  FROM categories c
  LEFT JOIN articles a ON a.categorie_id = c.id
  GROUP BY c.id, c.nom
  ORDER BY c.nom
`;

// ============================================================================
// QUERIES DE LECTURE DE TAILLES
// ============================================================================

/**
 * Sélectionner toutes les tailles
 */
export const SELECT_ALL_TAILLES = `
  SELECT id, nom
  FROM tailles
  ORDER BY
    CASE nom
      WHEN 'XS' THEN 1
      WHEN 'S' THEN 2
      WHEN 'M' THEN 3
      WHEN 'L' THEN 4
      WHEN 'XL' THEN 5
      WHEN 'XXL' THEN 6
      WHEN 'XXXL' THEN 7
      ELSE 8
    END
`;

/**
 * Sélectionner une taille par ID
 */
export const SELECT_TAILLE_BY_ID = `
  SELECT id, nom
  FROM tailles
  WHERE id = ?
`;

/**
 * Sélectionner une taille par nom
 */
export const SELECT_TAILLE_BY_NAME = `
  SELECT id, nom
  FROM tailles
  WHERE nom = ?
`;

/**
 * Créer une map des tailles (pour optimisation)
 */
export const SELECT_TAILLE_MAP = `
  SELECT id, nom
  FROM tailles
`;

// ============================================================================
// QUERIES DE LECTURE D'IMAGES
// ============================================================================

/**
 * Sélectionner toutes les images d'un article
 */
export const SELECT_IMAGES_BY_ARTICLE = `
  SELECT id, article_id, url
  FROM images
  WHERE article_id = ?
  ORDER BY id
`;

/**
 * Sélectionner une image par ID
 */
export const SELECT_IMAGE_BY_ID = `
  SELECT id, article_id, url
  FROM images
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE LECTURE DE COMMANDES
// ============================================================================

/**
 * Sélectionner toutes les commandes avec détails
 */
export const SELECT_ALL_COMMANDES_WITH_DETAILS = `
  SELECT
    co.id AS commande_id,
    co.date_commande,
    co.statut,
    co.total,
    u.id AS utilisateur_id,
    CONCAT(u.first_name, ' ', u.last_name) AS client_nom,
    u.email AS client_email,
    a.id AS article_id,
    a.nom AS article_nom,
    t.nom AS taille,
    ac.quantite,
    ac.prix
  FROM commandes co
  LEFT JOIN utilisateurs u ON u.id = co.utilisateur_id
  LEFT JOIN articles_commandes ac ON ac.commande_id = co.id
  LEFT JOIN articles a ON a.id = ac.article_id
  LEFT JOIN tailles t ON t.id = ac.taille_id
  ORDER BY co.date_commande DESC, co.id
`;

/**
 * Sélectionner une commande par ID
 */
export const SELECT_COMMANDE_BY_ID = `
  SELECT * FROM commandes
  WHERE id = ?
`;

/**
 * Sélectionner une commande avec détails
 */
export const SELECT_COMMANDE_WITH_DETAILS = `
  SELECT
    co.id AS commande_id,
    co.date_commande,
    co.statut,
    co.total,
    u.id AS utilisateur_id,
    CONCAT(u.first_name, ' ', u.last_name) AS client_nom,
    u.email AS client_email,
    a.id AS article_id,
    a.nom AS article_nom,
    t.nom AS taille,
    ac.quantite,
    ac.prix
  FROM commandes co
  LEFT JOIN utilisateurs u ON u.id = co.utilisateur_id
  LEFT JOIN articles_commandes ac ON ac.commande_id = co.id
  LEFT JOIN articles a ON a.id = ac.article_id
  LEFT JOIN tailles t ON t.id = ac.taille_id
  WHERE co.id = ?
  ORDER BY a.nom
`;

/**
 * Sélectionner les commandes d'un utilisateur
 */
export const SELECT_COMMANDES_BY_USER = `
  SELECT
    co.id AS commande_id,
    co.date_commande,
    co.statut,
    co.total,
    u.id AS utilisateur_id,
    CONCAT(u.first_name, ' ', u.last_name) AS client_nom,
    u.email AS client_email,
    a.id AS article_id,
    a.nom AS article_nom,
    t.nom AS taille,
    ac.quantite,
    ac.prix
  FROM commandes co
  LEFT JOIN utilisateurs u ON u.id = co.utilisateur_id
  LEFT JOIN articles_commandes ac ON ac.commande_id = co.id
  LEFT JOIN articles a ON a.id = ac.article_id
  LEFT JOIN tailles t ON t.id = ac.taille_id
  WHERE co.utilisateur_id = ?
  ORDER BY co.date_commande DESC
`;

/**
 * Sélectionner les commandes par statut
 */
export const SELECT_COMMANDES_BY_STATUT = `
  SELECT
    co.id AS commande_id,
    co.date_commande,
    co.statut,
    co.total,
    u.id AS utilisateur_id,
    CONCAT(u.first_name, ' ', u.last_name) AS client_nom,
    u.email AS client_email
  FROM commandes co
  LEFT JOIN utilisateurs u ON u.id = co.utilisateur_id
  WHERE co.statut = ?
  ORDER BY co.date_commande DESC
`;

/**
 * Sélectionner les articles d'une commande
 */
export const SELECT_ARTICLES_BY_COMMANDE = `
  SELECT
    ac.id,
    ac.article_id,
    a.nom AS article_nom,
    ac.taille_id,
    t.nom AS taille,
    ac.quantite,
    ac.prix
  FROM articles_commandes ac
  LEFT JOIN articles a ON a.id = ac.article_id
  LEFT JOIN tailles t ON t.id = ac.taille_id
  WHERE ac.commande_id = ?
  ORDER BY a.nom
`;

// ============================================================================
// QUERIES STATISTIQUES
// ============================================================================

/**
 * Compter le total d'articles
 */
export const COUNT_TOTAL_ARTICLES = `
  SELECT COUNT(*) AS total
  FROM articles
`;

/**
 * Compter le total de commandes
 */
export const COUNT_TOTAL_COMMANDES = `
  SELECT COUNT(*) AS total
  FROM commandes
`;

/**
 * Calculer le revenu total
 */
export const SUM_TOTAL_REVENUE = `
  SELECT COALESCE(SUM(total), 0) AS total_revenue
  FROM commandes
  WHERE statut NOT IN ('annulee')
`;

/**
 * Compter les articles en rupture de stock
 */
export const COUNT_OUT_OF_STOCK_ARTICLES = `
  SELECT COUNT(DISTINCT a.id) AS total
  FROM articles a
  LEFT JOIN stocks s ON s.article_id = a.id
  WHERE s.quantite = 0 OR s.id IS NULL
`;

/**
 * Compter les commandes en attente
 */
export const COUNT_PENDING_COMMANDES = `
  SELECT COUNT(*) AS total
  FROM commandes
  WHERE statut = 'en_attente'
`;

/**
 * Top articles vendus
 */
export const SELECT_TOP_SELLING_ARTICLES = `
  SELECT
    a.id,
    a.nom,
    SUM(ac.quantite) AS total_vendu,
    SUM(ac.quantite * ac.prix) AS total_revenue
  FROM articles a
  INNER JOIN articles_commandes ac ON ac.article_id = a.id
  INNER JOIN commandes co ON co.id = ac.commande_id
  WHERE co.statut NOT IN ('annulee')
  GROUP BY a.id, a.nom
  ORDER BY total_vendu DESC
  LIMIT ?
`;

/**
 * Revenus par catégorie
 */
export const SELECT_REVENUE_BY_CATEGORIE = `
  SELECT
    c.id,
    c.nom AS categorie_nom,
    SUM(ac.quantite * ac.prix) AS total_revenue,
    COUNT(DISTINCT co.id) AS total_commandes
  FROM categories c
  LEFT JOIN articles a ON a.categorie_id = c.id
  LEFT JOIN articles_commandes ac ON ac.article_id = a.id
  LEFT JOIN commandes co ON co.id = ac.commande_id
  WHERE co.statut NOT IN ('annulee')
  GROUP BY c.id, c.nom
  ORDER BY total_revenue DESC
`;
