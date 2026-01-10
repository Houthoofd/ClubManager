/**
 * Types pour le module Magasin
 */

// ============================================================================
// TYPES TYPESCRIPT
// ============================================================================

/**
 * Article complet du magasin
 */
export interface Article {
  id: number;
  nom: string;
  prix: number;
  description: string | null;
  categorie_id: number;
  images: string[];
  stocks: StockArticle[];
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Article avec informations de catégorie
 */
export interface ArticleAvecCategorie {
  id: number;
  nom: string;
  prix: number;
  description: string | null;
  categorie: {
    id: number;
    nom: string;
  };
  images: string[];
  stocks: StockArticle[];
}

/**
 * Stock d'un article
 */
export interface StockArticle {
  taille: string;
  quantite: number;
}

/**
 * Stock détaillé avec IDs
 */
export interface StockDetail {
  id: number;
  article_id: number;
  taille_id: number;
  taille: string;
  quantite: number;
}

/**
 * Catégorie d'articles
 */
export interface Categorie {
  id: number;
  nom: string;
}

/**
 * Taille disponible
 */
export interface Taille {
  id: number;
  nom: string;
}

/**
 * Map des tailles (nom -> id)
 */
export interface TailleMap {
  [key: string]: number;
}

/**
 * Articles organisés par catégorie
 */
export interface ArticlesParCategorie {
  [categorieName: string]: ArticleAvecCategorie[];
}

/**
 * Commande du magasin
 */
export interface Commande {
  id: number;
  utilisateur_id: number;
  date_commande: Date | string;
  statut: string;
  total: number;
  articles: ArticleCommande[];
  created_at?: Date | string;
  updated_at?: Date | string;
}

/**
 * Article dans une commande
 */
export interface ArticleCommande {
  article_id: number;
  nom?: string;
  taille: string;
  quantite: number;
  prix: number;
}

/**
 * Commande avec informations client
 */
export interface CommandeAvecClient {
  commande_id: number;
  date_commande: Date | string;
  statut: string;
  total: number;
  client: {
    id: number;
    nom: string;
    email: string;
  };
  articles: ArticleCommande[];
}

/**
 * Données pour créer un article
 */
export interface CreateArticleData {
  nom: string;
  prix: number;
  description?: string;
  categorie_id: number;
  images: string[];
  stocks: CreateStockData[];
}

/**
 * Données pour créer un stock
 */
export interface CreateStockData {
  taille: string;
  quantite: number;
}

/**
 * Données pour mettre à jour un article
 */
export interface UpdateArticleData {
  nom?: string;
  prix?: number;
  description?: string;
  categorie_id?: number;
  images?: string[];
  stocks?: CreateStockData[];
}

/**
 * Données pour créer une commande
 */
export interface CreateCommandeData {
  utilisateur_id: number;
  articles: CreateArticleCommandeData[];
  total: number;
  date?: string;
  statut?: string;
}

/**
 * Données pour un article dans une commande
 */
export interface CreateArticleCommandeData {
  article_id: number;
  taille: string;
  quantite: number;
  prix: number;
}

/**
 * Données pour ajouter du stock
 */
export interface AddStockData {
  article_id: number;
  taille_id: number;
  quantite: number;
}

/**
 * Données pour modifier du stock
 */
export interface UpdateStockData {
  article_id: number;
  taille_id: number;
  quantite: number;
}

/**
 * Résultat de confirmation d'opération
 */
export interface ConfirmationResult {
  isConfirm: boolean;
  message: string;
  data?: any;
}

// ============================================================================
// TYPES SQL (RAW DB ROWS)
// ============================================================================

/**
 * Row article de la base de données
 */
export interface ArticleRow {
  id: number;
  nom: string;
  prix: number;
  description: string | null;
  categorie_id: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row article avec jointures
 */
export interface ArticleAvecRelationsRow {
  id: number;
  nom: string;
  prix: number;
  description: string | null;
  categorie_id: number;
  categorie_nom: string | null;
  image_url: string | null;
  stock_taille: string | null;
  stock_quantite: number | null;
}

/**
 * Row stock de la base de données
 */
export interface StockRow {
  id: number;
  article_id: number;
  taille_id: number;
  quantite: number;
}

/**
 * Row stock avec détails
 */
export interface StockDetailRow {
  id: number;
  article_id: number;
  taille_id: number;
  taille_nom: string;
  quantite: number;
}

/**
 * Row catégorie de la base de données
 */
export interface CategorieRow {
  id: number;
  nom: string;
}

/**
 * Row taille de la base de données
 */
export interface TailleRow {
  id: number;
  nom: string;
}

/**
 * Row image de la base de données
 */
export interface ImageRow {
  id: number;
  article_id: number;
  url: string;
}

/**
 * Row commande de la base de données
 */
export interface CommandeRow {
  id: number;
  utilisateur_id: number;
  date_commande: Date;
  statut: string;
  total: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Row commande avec détails client
 */
export interface CommandeAvecClientRow {
  commande_id: number;
  date_commande: Date;
  statut: string;
  total: number;
  utilisateur_id: number;
  client_nom: string;
  client_email: string;
  article_id: number;
  article_nom: string;
  taille: string;
  quantite: number;
  prix: number;
}

/**
 * Row article_commande de la base de données
 */
export interface ArticleCommandeRow {
  id: number;
  commande_id: number;
  article_id: number;
  taille_id: number;
  quantite: number;
  prix: number;
}

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Statuts possibles d'une commande
 */
export enum StatutCommande {
  EN_ATTENTE = 'en_attente',
  CONFIRMEE = 'confirmee',
  EN_PREPARATION = 'en_preparation',
  EXPEDIEE = 'expediee',
  LIVREE = 'livree',
  ANNULEE = 'annulee',
}

/**
 * Tailles standard disponibles
 */
export enum TailleStandard {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  XXXL = 'XXXL',
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Vérifie si un article est valide
 */
export function isValidArticle(article: any): article is Article {
  return (
    article &&
    typeof article.id === 'number' &&
    typeof article.nom === 'string' &&
    typeof article.prix === 'number' &&
    typeof article.categorie_id === 'number' &&
    Array.isArray(article.images) &&
    Array.isArray(article.stocks)
  );
}

/**
 * Vérifie si un stock est valide
 */
export function isValidStock(stock: any): stock is CreateStockData {
  return (
    stock &&
    typeof stock.taille === 'string' &&
    typeof stock.quantite === 'number' &&
    stock.quantite >= 0
  );
}

/**
 * Vérifie si une commande est valide
 */
export function isValidCommande(commande: any): commande is CreateCommandeData {
  return (
    commande &&
    typeof commande.utilisateur_id === 'number' &&
    Array.isArray(commande.articles) &&
    commande.articles.length > 0 &&
    typeof commande.total === 'number' &&
    commande.total > 0
  );
}

/**
 * Vérifie si un article de commande est valide
 */
export function isValidArticleCommande(article: any): article is CreateArticleCommandeData {
  return (
    article &&
    typeof article.article_id === 'number' &&
    typeof article.taille === 'string' &&
    typeof article.quantite === 'number' &&
    article.quantite > 0 &&
    typeof article.prix === 'number' &&
    article.prix > 0
  );
}

/**
 * Vérifie si un prix est valide
 */
export function isValidPrice(prix: number): boolean {
  return typeof prix === 'number' && prix > 0 && Number.isFinite(prix);
}

/**
 * Vérifie si une quantité est valide
 */
export function isValidQuantity(quantite: number): boolean {
  return typeof quantite === 'number' && quantite >= 0 && Number.isInteger(quantite);
}

/**
 * Vérifie si un ID est valide
 */
export function isValidId(id: number): boolean {
  return typeof id === 'number' && id > 0 && Number.isInteger(id);
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

/**
 * Type pour les champs d'article pouvant être mis à jour
 */
export type UpdatableArticleFields = 'nom' | 'prix' | 'description' | 'categorie_id';

/**
 * Type pour les champs de commande pouvant être mis à jour
 */
export type UpdatableCommandeFields = 'statut' | 'total';

/**
 * Options de recherche d'articles
 */
export interface ArticleSearchOptions {
  categorieId?: number;
  prixMin?: number;
  prixMax?: number;
  nom?: string;
  includeOutOfStock?: boolean;
}

/**
 * Options de recherche de commandes
 */
export interface CommandeSearchOptions {
  utilisateurId?: number;
  statut?: string;
  dateDebut?: Date | string;
  dateFin?: Date | string;
}

/**
 * Statistiques du magasin
 */
export interface MagasinStats {
  totalArticles: number;
  totalCommandes: number;
  totalRevenu: number;
  articlesEnRupture: number;
  commandesEnAttente: number;
}
