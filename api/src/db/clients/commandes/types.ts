/**
 * Types pour le module Commandes
 */

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

/**
 * Article dans une commande
 */
export interface ArticleCommande {
  article_id: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  image?: string;
  taille?: string;
  couleur?: string;
}

/**
 * Statut possible d'une commande
 */
export enum StatutCommande {
  EN_ATTENTE = 'en_attente',
  CONFIRMEE = 'confirmee',
  EN_PREPARATION = 'en_preparation',
  EXPEDIE = 'expedie',
  LIVREE = 'livree',
  ANNULEE = 'annulee',
  REMBOURSEE = 'remboursee'
}

/**
 * Commande complète avec informations utilisateur
 */
export interface Commande {
  commande_id: string;
  utilisateur_id: number;
  statut: StatutCommande | string;
  total: number;
  articles: ArticleCommande[];
  date_commande: Date | string;
  updated_at: Date | string;
  payment_intent_id: string | null;
  nom_utilisateur?: string;
  email?: string;
}

/**
 * Données pour créer une commande
 */
export interface CreateCommandeData {
  commande_id: string;
  utilisateur_id: number;
  statut?: StatutCommande | string;
  total: number;
  articles: ArticleCommande[];
  payment_intent_id?: string | null;
}

/**
 * Données pour mettre à jour une commande
 */
export interface UpdateCommandeData {
  statut?: StatutCommande | string;
  total?: number;
  articles?: ArticleCommande[];
  payment_intent_id?: string | null;
}

/**
 * Statistiques des commandes
 */
export interface CommandeStatistiques {
  total_commandes: number;
  commandes_en_attente: number;
  commandes_confirmees: number;
  commandes_en_preparation: number;
  commandes_expedie: number;
  commandes_livrees: number;
  commandes_annulees: number;
  commandes_remboursees: number;
  chiffre_affaires_total: number;
  chiffre_affaires_mois: number;
  panier_moyen: number;
}

/**
 * Filtres pour la recherche de commandes
 */
export interface CommandeSearchFilters {
  statut?: StatutCommande | string;
  utilisateur_id?: number;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  montant_min?: number;
  montant_max?: number;
  limit?: number;
  offset?: number;
}

/**
 * Résultat de recherche avec pagination
 */
export interface CommandeSearchResult {
  commandes: Commande[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Statistiques par période
 */
export interface CommandeStatsPeriode {
  periode: string;
  nombre_commandes: number;
  chiffre_affaires: number;
  panier_moyen: number;
}

/**
 * Top produits vendus
 */
export interface TopProduit {
  article_id: string;
  nom: string;
  quantite_vendue: number;
  chiffre_affaires: number;
  nombre_commandes: number;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Structure brute d'une ligne de la table commandes
 */
export interface CommandeRow {
  commande_id: string;
  utilisateur_id: number;
  statut: string;
  total: number;
  articles: string; // JSON stringifié
  date_commande: Date;
  updated_at: Date;
  payment_intent_id: string | null;
  nom_utilisateur?: string;
  email?: string;
}

/**
 * Résultat brut des statistiques
 */
export interface StatistiquesRow {
  total_commandes: number | string;
  commandes_en_attente: number | string;
  commandes_confirmees: number | string;
  commandes_en_preparation: number | string;
  commandes_expedie: number | string;
  commandes_livrees: number | string;
  commandes_annulees: number | string;
  commandes_remboursees: number | string;
  chiffre_affaires_total: number | string;
}

/**
 * Résultat brut du chiffre d'affaires mensuel
 */
export interface ChiffreAffairesMoisRow {
  chiffre_affaires_mois: number | string;
}

/**
 * Résultat brut du count par statut
 */
export interface CountByStatutRow {
  statut: string;
  count: number | string;
}

/**
 * Résultat brut des stats par période
 */
export interface StatsPeriodeRow {
  periode: string;
  nombre_commandes: number | string;
  chiffre_affaires: number | string;
  panier_moyen: number | string;
}

/**
 * Résultat brut du total de résultats de recherche
 */
export interface SearchCountRow {
  total: number | string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si un statut est valide
 */
export function isValidStatut(statut: string): statut is StatutCommande {
  return Object.values(StatutCommande).includes(statut as StatutCommande);
}

/**
 * Vérifie si un article est valide
 */
export function isValidArticle(article: any): article is ArticleCommande {
  return (
    article &&
    typeof article.article_id === 'string' &&
    typeof article.nom === 'string' &&
    typeof article.quantite === 'number' &&
    typeof article.prix_unitaire === 'number' &&
    typeof article.prix_total === 'number' &&
    article.quantite > 0 &&
    article.prix_unitaire >= 0 &&
    article.prix_total >= 0
  );
}

/**
 * Vérifie si une commande est valide
 */
export function isValidCommande(commande: any): commande is Commande {
  return (
    commande &&
    typeof commande.commande_id === 'string' &&
    typeof commande.utilisateur_id === 'number' &&
    typeof commande.statut === 'string' &&
    typeof commande.total === 'number' &&
    Array.isArray(commande.articles) &&
    commande.articles.every(isValidArticle)
  );
}
