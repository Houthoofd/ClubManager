/**
 * Requêtes SQL de LECTURE pour le module Informations
 * Responsabilité: Requêtes SELECT uniquement
 */

// ============================================================================
// QUERIES DE LECTURE BASIQUES - INFORMATIONS
// ============================================================================

/**
 * Sélectionner toutes les informations actives
 */
export const SELECT_ALL_INFORMATIONS = `
  SELECT
    id,
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
  FROM informations
  WHERE status_id = 1
  ORDER BY date_creation DESC
`;

/**
 * Sélectionner toutes les informations (y compris inactives)
 */
export const SELECT_ALL_INFORMATIONS_WITH_INACTIVE = `
  SELECT
    id,
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
  FROM informations
  ORDER BY date_creation DESC
`;

/**
 * Sélectionner une information par son ID
 */
export const SELECT_INFORMATION_BY_ID = `
  SELECT
    id,
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
  FROM informations
  WHERE id = ?
`;

/**
 * Sélectionner une information active par son ID
 */
export const SELECT_ACTIVE_INFORMATION_BY_ID = `
  SELECT
    id,
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
  FROM informations
  WHERE id = ? AND status_id = 1
`;

/**
 * Sélectionner les informations avec relations
 */
export const SELECT_INFORMATIONS_WITH_RELATIONS = `
  SELECT
    i.id,
    i.titre,
    i.contenu,
    i.date_creation,
    i.date_modification,
    i.status_id,
    i.auteur_id,
    i.categorie_id,
    i.priorite,
    i.visible,
    u.first_name AS auteur_prenom,
    u.last_name AS auteur_nom,
    CONCAT(u.first_name, ' ', u.last_name) AS auteur,
    c.nom AS categorie,
    s.nom_role AS status
  FROM informations i
  LEFT JOIN utilisateurs u ON i.auteur_id = u.id
  LEFT JOIN categories_informations c ON i.categorie_id = c.id
  LEFT JOIN status s ON i.status_id = s.id
  WHERE i.status_id = 1
  ORDER BY i.date_creation DESC
`;

/**
 * Sélectionner une information avec relations par ID
 */
export const SELECT_INFORMATION_WITH_RELATIONS_BY_ID = `
  SELECT
    i.id,
    i.titre,
    i.contenu,
    i.date_creation,
    i.date_modification,
    i.status_id,
    i.auteur_id,
    i.categorie_id,
    i.priorite,
    i.visible,
    CONCAT(u.first_name, ' ', u.last_name) AS auteur,
    c.nom AS categorie,
    s.nom_role AS status
  FROM informations i
  LEFT JOIN utilisateurs u ON i.auteur_id = u.id
  LEFT JOIN categories_informations c ON i.categorie_id = c.id
  LEFT JOIN status s ON i.status_id = s.id
  WHERE i.id = ?
`;

// ============================================================================
// QUERIES DE LECTURE - FILTRES ET RECHERCHE
// ============================================================================

/**
 * Rechercher des informations par titre
 */
export const SEARCH_INFORMATIONS_BY_TITRE = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE titre LIKE ?
    AND status_id = 1
  ORDER BY date_creation DESC
  LIMIT ? OFFSET ?
`;

/**
 * Rechercher des informations par contenu
 */
export const SEARCH_INFORMATIONS_BY_CONTENU = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE contenu LIKE ?
    AND status_id = 1
  ORDER BY date_creation DESC
  LIMIT ? OFFSET ?
`;

/**
 * Rechercher des informations par titre ou contenu
 */
export const SEARCH_INFORMATIONS_FULL_TEXT = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE (titre LIKE ? OR contenu LIKE ?)
    AND status_id = 1
  ORDER BY date_creation DESC
  LIMIT ? OFFSET ?
`;

/**
 * Filtrer les informations par catégorie
 */
export const SELECT_INFORMATIONS_BY_CATEGORIE = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE categorie_id = ?
    AND status_id = 1
  ORDER BY date_creation DESC
`;

/**
 * Filtrer les informations par auteur
 */
export const SELECT_INFORMATIONS_BY_AUTEUR = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE auteur_id = ?
    AND status_id = 1
  ORDER BY date_creation DESC
`;

/**
 * Filtrer les informations par status
 */
export const SELECT_INFORMATIONS_BY_STATUS = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE status_id = ?
  ORDER BY date_creation DESC
`;

/**
 * Filtrer les informations par priorité
 */
export const SELECT_INFORMATIONS_BY_PRIORITE = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE priorite = ?
    AND status_id = 1
  ORDER BY date_creation DESC
`;

/**
 * Filtrer les informations visibles uniquement
 */
export const SELECT_INFORMATIONS_VISIBLE = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE visible = 1
    AND status_id = 1
  ORDER BY date_creation DESC
`;

/**
 * Sélectionner les informations par plage de dates
 */
export const SELECT_INFORMATIONS_BY_DATE_RANGE = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE date_creation BETWEEN ? AND ?
    AND status_id = 1
  ORDER BY date_creation DESC
`;

/**
 * Sélectionner les informations récentes (N derniers jours)
 */
export const SELECT_RECENT_INFORMATIONS = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE date_creation >= DATE_SUB(NOW(), INTERVAL ? DAY)
    AND status_id = 1
  ORDER BY date_creation DESC
  LIMIT ?
`;

/**
 * Sélectionner les informations prioritaires
 */
export const SELECT_HIGH_PRIORITY_INFORMATIONS = `
  SELECT
    id,
    titre,
    contenu,
    date_creation,
    date_modification,
    status_id,
    auteur_id,
    categorie_id,
    priorite,
    visible
  FROM informations
  WHERE priorite >= 3
    AND status_id = 1
    AND visible = 1
  ORDER BY priorite DESC, date_creation DESC
  LIMIT ?
`;

// ============================================================================
// QUERIES DE LECTURE - RÉFÉRENTIELS
// ============================================================================

/**
 * Sélectionner tous les status
 */
export const SELECT_ALL_STATUS = `
  SELECT
    id,
    nom_role,
    description
  FROM status
  ORDER BY id ASC
`;

/**
 * Sélectionner un status par ID
 */
export const SELECT_STATUS_BY_ID = `
  SELECT
    id,
    nom_role,
    description
  FROM status
  WHERE id = ?
`;

/**
 * Sélectionner tous les genres
 */
export const SELECT_ALL_GENRES = `
  SELECT
    id,
    genre_name
  FROM genres
  ORDER BY genre_name ASC
`;

/**
 * Sélectionner un genre par ID
 */
export const SELECT_GENRE_BY_ID = `
  SELECT
    id,
    genre_name
  FROM genres
  WHERE id = ?
`;

/**
 * Sélectionner tous les grades
 */
export const SELECT_ALL_GRADES = `
  SELECT
    id,
    grade_id,
    nom_grade,
    ordre
  FROM grades
  ORDER BY ordre ASC, id ASC
`;

/**
 * Sélectionner un grade par ID
 */
export const SELECT_GRADE_BY_ID = `
  SELECT
    id,
    grade_id,
    nom_grade,
    ordre
  FROM grades
  WHERE id = ?
`;

/**
 * Sélectionner tous les plans tarifaires
 */
export const SELECT_ALL_PLANS_TARIFAIRES = `
  SELECT
    id,
    nom_plan,
    prix,
    duree,
    description
  FROM plans_tarifaires
  ORDER BY prix ASC
`;

/**
 * Sélectionner un plan tarifaire par ID
 */
export const SELECT_PLAN_TARIFAIRE_BY_ID = `
  SELECT
    id,
    nom_plan,
    prix,
    duree,
    description
  FROM plans_tarifaires
  WHERE id = ?
`;

/**
 * Sélectionner toutes les catégories d'informations
 */
export const SELECT_ALL_CATEGORIES = `
  SELECT
    id,
    nom,
    description,
    couleur,
    icone
  FROM categories_informations
  ORDER BY nom ASC
`;

/**
 * Sélectionner une catégorie par ID
 */
export const SELECT_CATEGORIE_BY_ID = `
  SELECT
    id,
    nom,
    description,
    couleur,
    icone
  FROM categories_informations
  WHERE id = ?
`;

// ============================================================================
// QUERIES DE COMPTAGE
// ============================================================================

/**
 * Compter toutes les informations
 */
export const COUNT_ALL_INFORMATIONS = `
  SELECT COUNT(*) AS total
  FROM informations
  WHERE status_id = 1
`;

/**
 * Compter les informations par catégorie
 */
export const COUNT_INFORMATIONS_BY_CATEGORIE = `
  SELECT
    c.nom AS categorie,
    COUNT(i.id) AS count
  FROM categories_informations c
  LEFT JOIN informations i ON c.id = i.categorie_id AND i.status_id = 1
  GROUP BY c.id, c.nom
  ORDER BY count DESC
`;

/**
 * Compter les informations par status
 */
export const COUNT_INFORMATIONS_BY_STATUS = `
  SELECT
    s.nom_role AS status,
    COUNT(i.id) AS count
  FROM status s
  LEFT JOIN informations i ON s.id = i.status_id
  GROUP BY s.id, s.nom_role
  ORDER BY count DESC
`;

/**
 * Compter les informations par priorité
 */
export const COUNT_INFORMATIONS_BY_PRIORITE = `
  SELECT
    priorite,
    COUNT(*) AS count
  FROM informations
  WHERE status_id = 1
  GROUP BY priorite
  ORDER BY priorite DESC
`;

/**
 * Compter les informations récentes (7 derniers jours)
 */
export const COUNT_RECENT_INFORMATIONS = `
  SELECT COUNT(*) AS count
  FROM informations
  WHERE date_creation >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    AND status_id = 1
`;

// ============================================================================
// QUERIES DE PAGINATION
// ============================================================================

/**
 * Query de base pour recherche avec filtres (base pour pagination)
 */
export const SEARCH_INFORMATIONS_BASE = `
  SELECT
    i.id,
    i.titre,
    i.contenu,
    i.date_creation,
    i.date_modification,
    i.status_id,
    i.auteur_id,
    i.categorie_id,
    i.priorite,
    i.visible,
    CONCAT(u.first_name, ' ', u.last_name) AS auteur,
    c.nom AS categorie
  FROM informations i
  LEFT JOIN utilisateurs u ON i.auteur_id = u.id
  LEFT JOIN categories_informations c ON i.categorie_id = c.id
  WHERE 1=1
`;

/**
 * Compter les résultats de recherche
 */
export const COUNT_SEARCH_RESULTS = `
  SELECT COUNT(*) AS total
  FROM informations i
  WHERE 1=1
`;
