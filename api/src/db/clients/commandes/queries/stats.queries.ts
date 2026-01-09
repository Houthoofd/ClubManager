/**
 * Requêtes SQL de STATISTIQUES pour le module Commandes
 * Responsabilité: Requêtes d'agrégation et calculs statistiques uniquement
 */

// ============================================================================
// QUERIES DE STATISTIQUES GLOBALES
// ============================================================================

/**
 * Obtenir les statistiques globales des commandes
 */
export const SELECT_STATISTIQUES_GLOBALES = `
  SELECT
    COUNT(*) as total_commandes,
    SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as commandes_en_attente,
    SUM(CASE WHEN statut = 'confirmee' THEN 1 ELSE 0 END) as commandes_confirmees,
    SUM(CASE WHEN statut = 'en_preparation' THEN 1 ELSE 0 END) as commandes_en_preparation,
    SUM(CASE WHEN statut = 'expedie' THEN 1 ELSE 0 END) as commandes_expedie,
    SUM(CASE WHEN statut = 'livree' THEN 1 ELSE 0 END) as commandes_livrees,
    SUM(CASE WHEN statut = 'annulee' THEN 1 ELSE 0 END) as commandes_annulees,
    SUM(CASE WHEN statut = 'remboursee' THEN 1 ELSE 0 END) as commandes_remboursees,
    SUM(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE 0 END) as chiffre_affaires_total
  FROM commandes
`;

/**
 * Obtenir le chiffre d'affaires du mois en cours
 */
export const SELECT_CHIFFRE_AFFAIRES_MOIS = `
  SELECT
    SUM(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE 0 END) as chiffre_affaires_mois
  FROM commandes
  WHERE YEAR(date_commande) = YEAR(CURDATE())
    AND MONTH(date_commande) = MONTH(CURDATE())
`;

/**
 * Compter les commandes par statut
 */
export const COUNT_COMMANDES_BY_STATUT = `
  SELECT statut, COUNT(*) as count
  FROM commandes
  GROUP BY statut
`;

/**
 * Obtenir le panier moyen
 */
export const SELECT_PANIER_MOYEN = `
  SELECT
    AVG(total) as panier_moyen
  FROM commandes
  WHERE statut NOT IN ('annulee', 'remboursee')
`;

/**
 * Obtenir le panier moyen par utilisateur
 */
export const SELECT_PANIER_MOYEN_PAR_UTILISATEUR = `
  SELECT
    utilisateur_id,
    u.nom_utilisateur,
    u.email,
    COUNT(*) as nombre_commandes,
    AVG(c.total) as panier_moyen,
    SUM(c.total) as total_depense
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.statut NOT IN ('annulee', 'remboursee')
  GROUP BY c.utilisateur_id, u.nom_utilisateur, u.email
  ORDER BY total_depense DESC
  LIMIT ?
`;

// ============================================================================
// QUERIES DE STATISTIQUES TEMPORELLES
// ============================================================================

/**
 * Statistiques par jour
 */
export const SELECT_STATS_PAR_JOUR = `
  SELECT
    DATE(date_commande) as periode,
    COUNT(*) as nombre_commandes,
    SUM(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE 0 END) as chiffre_affaires,
    AVG(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE NULL END) as panier_moyen
  FROM commandes
  WHERE date_commande >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
  GROUP BY DATE(date_commande)
  ORDER BY periode DESC
`;

/**
 * Statistiques par semaine
 */
export const SELECT_STATS_PAR_SEMAINE = `
  SELECT
    YEARWEEK(date_commande, 1) as periode,
    COUNT(*) as nombre_commandes,
    SUM(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE 0 END) as chiffre_affaires,
    AVG(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE NULL END) as panier_moyen
  FROM commandes
  WHERE date_commande >= DATE_SUB(CURDATE(), INTERVAL ? WEEK)
  GROUP BY YEARWEEK(date_commande, 1)
  ORDER BY periode DESC
`;

/**
 * Statistiques par mois
 */
export const SELECT_STATS_PAR_MOIS = `
  SELECT
    DATE_FORMAT(date_commande, '%Y-%m') as periode,
    COUNT(*) as nombre_commandes,
    SUM(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE 0 END) as chiffre_affaires,
    AVG(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE NULL END) as panier_moyen
  FROM commandes
  WHERE date_commande >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
  GROUP BY DATE_FORMAT(date_commande, '%Y-%m')
  ORDER BY periode DESC
`;

/**
 * Statistiques par année
 */
export const SELECT_STATS_PAR_ANNEE = `
  SELECT
    YEAR(date_commande) as periode,
    COUNT(*) as nombre_commandes,
    SUM(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE 0 END) as chiffre_affaires,
    AVG(CASE WHEN statut NOT IN ('annulee', 'remboursee') THEN total ELSE NULL END) as panier_moyen
  FROM commandes
  WHERE date_commande >= DATE_SUB(CURDATE(), INTERVAL ? YEAR)
  GROUP BY YEAR(date_commande)
  ORDER BY periode DESC
`;

// ============================================================================
// QUERIES DE STATISTIQUES PRODUITS
// ============================================================================

/**
 * Top produits vendus
 */
export const SELECT_TOP_PRODUITS = `
  SELECT
    JSON_UNQUOTE(JSON_EXTRACT(article.value, '$.article_id')) as article_id,
    JSON_UNQUOTE(JSON_EXTRACT(article.value, '$.nom')) as nom,
    SUM(JSON_EXTRACT(article.value, '$.quantite')) as quantite_vendue,
    SUM(JSON_EXTRACT(article.value, '$.prix_total')) as chiffre_affaires,
    COUNT(DISTINCT c.commande_id) as nombre_commandes
  FROM commandes c
  JOIN JSON_TABLE(
    c.articles,
    '$[*]' COLUMNS (
      value JSON PATH '$'
    )
  ) AS article
  WHERE c.statut NOT IN ('annulee', 'remboursee')
  GROUP BY article_id, nom
  ORDER BY quantite_vendue DESC
  LIMIT ?
`;

/**
 * Top produits par chiffre d'affaires
 */
export const SELECT_TOP_PRODUITS_PAR_CA = `
  SELECT
    JSON_UNQUOTE(JSON_EXTRACT(article.value, '$.article_id')) as article_id,
    JSON_UNQUOTE(JSON_EXTRACT(article.value, '$.nom')) as nom,
    SUM(JSON_EXTRACT(article.value, '$.quantite')) as quantite_vendue,
    SUM(JSON_EXTRACT(article.value, '$.prix_total')) as chiffre_affaires,
    COUNT(DISTINCT c.commande_id) as nombre_commandes
  FROM commandes c
  JOIN JSON_TABLE(
    c.articles,
    '$[*]' COLUMNS (
      value JSON PATH '$'
    )
  ) AS article
  WHERE c.statut NOT IN ('annulee', 'remboursee')
  GROUP BY article_id, nom
  ORDER BY chiffre_affaires DESC
  LIMIT ?
`;

/**
 * Produits les moins vendus
 */
export const SELECT_PRODUITS_MOINS_VENDUS = `
  SELECT
    JSON_UNQUOTE(JSON_EXTRACT(article.value, '$.article_id')) as article_id,
    JSON_UNQUOTE(JSON_EXTRACT(article.value, '$.nom')) as nom,
    SUM(JSON_EXTRACT(article.value, '$.quantite')) as quantite_vendue,
    SUM(JSON_EXTRACT(article.value, '$.prix_total')) as chiffre_affaires,
    COUNT(DISTINCT c.commande_id) as nombre_commandes
  FROM commandes c
  JOIN JSON_TABLE(
    c.articles,
    '$[*]' COLUMNS (
      value JSON PATH '$'
    )
  ) AS article
  WHERE c.statut NOT IN ('annulee', 'remboursee')
  GROUP BY article_id, nom
  ORDER BY quantite_vendue ASC
  LIMIT ?
`;

// ============================================================================
// QUERIES DE STATISTIQUES CLIENTS
// ============================================================================

/**
 * Top clients par nombre de commandes
 */
export const SELECT_TOP_CLIENTS_PAR_NOMBRE = `
  SELECT
    c.utilisateur_id,
    u.nom_utilisateur,
    u.email,
    COUNT(*) as nombre_commandes,
    SUM(c.total) as total_depense,
    AVG(c.total) as panier_moyen
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.statut NOT IN ('annulee', 'remboursee')
  GROUP BY c.utilisateur_id, u.nom_utilisateur, u.email
  ORDER BY nombre_commandes DESC
  LIMIT ?
`;

/**
 * Top clients par montant dépensé
 */
export const SELECT_TOP_CLIENTS_PAR_MONTANT = `
  SELECT
    c.utilisateur_id,
    u.nom_utilisateur,
    u.email,
    COUNT(*) as nombre_commandes,
    SUM(c.total) as total_depense,
    AVG(c.total) as panier_moyen
  FROM commandes c
  LEFT JOIN utilisateurs u ON c.utilisateur_id = u.id
  WHERE c.statut NOT IN ('annulee', 'remboursee')
  GROUP BY c.utilisateur_id, u.nom_utilisateur, u.email
  ORDER BY total_depense DESC
  LIMIT ?
`;

/**
 * Taux de conversion par statut
 */
export const SELECT_TAUX_CONVERSION = `
  SELECT
    COUNT(*) as total_commandes,
    SUM(CASE WHEN statut IN ('livree', 'expedie') THEN 1 ELSE 0 END) as commandes_reussies,
    SUM(CASE WHEN statut IN ('annulee', 'remboursee') THEN 1 ELSE 0 END) as commandes_echouees,
    (SUM(CASE WHEN statut IN ('livree', 'expedie') THEN 1 ELSE 0 END) / COUNT(*) * 100) as taux_reussite,
    (SUM(CASE WHEN statut IN ('annulee', 'remboursee') THEN 1 ELSE 0 END) / COUNT(*) * 100) as taux_echec
  FROM commandes
`;

/**
 * Temps moyen de traitement des commandes (de en_attente à livree)
 */
export const SELECT_TEMPS_MOYEN_TRAITEMENT = `
  SELECT
    AVG(TIMESTAMPDIFF(HOUR, date_commande, updated_at)) as heures_moyennes
  FROM commandes
  WHERE statut = 'livree'
    AND date_commande >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
`;

/**
 * Répartition des commandes par tranche horaire
 */
export const SELECT_COMMANDES_PAR_HEURE = `
  SELECT
    HOUR(date_commande) as heure,
    COUNT(*) as nombre_commandes,
    SUM(total) as chiffre_affaires
  FROM commandes
  WHERE date_commande >= DATE_SUB(NOW(), INTERVAL ? DAY)
  GROUP BY HOUR(date_commande)
  ORDER BY heure
`;

/**
 * Répartition des commandes par jour de la semaine
 */
export const SELECT_COMMANDES_PAR_JOUR_SEMAINE = `
  SELECT
    DAYNAME(date_commande) as jour,
    DAYOFWEEK(date_commande) as numero_jour,
    COUNT(*) as nombre_commandes,
    SUM(total) as chiffre_affaires,
    AVG(total) as panier_moyen
  FROM commandes
  WHERE date_commande >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    AND statut NOT IN ('annulee', 'remboursee')
  GROUP BY DAYOFWEEK(date_commande), DAYNAME(date_commande)
  ORDER BY numero_jour
`;
