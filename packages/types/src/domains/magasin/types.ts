/**
 * Types pour le module Magasin
 * Les schémas Zod sont dans validators.ts
 *
 * @module magasin/types
 */

// ============================================================================
// ARTICLE STOCK TYPES (Nouvelle table unifiée - Phase 1)
// ============================================================================

/**
 * Stock d'un article (table unifiée remplaçant stocks et articles_tailles)
 */
export interface ArticleStock {
  /** Identifiant unique */
  id: number;

  /** ID de l'article */
  article_id: number;

  /** ID de la taille */
  taille_id: number;

  /** Quantité totale en stock */
  quantity_total: number;

  /** Quantité réservée */
  quantity_reserved: number;

  /** Quantité disponible */
  quantity_available: number;

  /** Date du dernier réapprovisionnement */
  last_restock_at?: Date | null;

  /** Seuil d'alerte stock faible */
  low_stock_threshold: number;

  /** Date de création */
  created_at: Date;

  /** Date de dernière modification */
  updated_at: Date;
}

/**
 * Données pour créer un stock d'article
 */
export interface CreateArticleStockInput {
  article_id: number;
  taille_id: number;
  quantity_total?: number;
  quantity_reserved?: number;
  quantity_available?: number;
  low_stock_threshold?: number;
}

/**
 * Données pour mettre à jour un stock d'article
 */
export interface UpdateArticleStockInput {
  quantity_total?: number;
  quantity_reserved?: number;
  quantity_available?: number;
  last_restock_at?: Date | string;
  low_stock_threshold?: number;
}

/**
 * Stock d'article avec informations de l'article et de la taille
 */
export interface ArticleStockWithDetails extends ArticleStock {
  article?: {
    id: number;
    nom: string;
    prix: number;
  };
  taille?: {
    id: number;
    nom: string;
  };
}

/**
 * Alerte de stock faible
 */
export interface LowStockAlert {
  article_id: number;
  article_nom: string;
  taille_id: number;
  taille_nom: string;
  quantity_available: number;
  low_stock_threshold: number;
  needs_restock: boolean;
}

// ============================================================================
// LEGACY STOCK TYPES (Compatibilité)
// ============================================================================

// === Stocks ===
export type Stock = {
  taille: string; // taille du produit en string (ex: "S", "M", "L")
  quantite: number; // quantité disponible en stock
};

export type Taille = "S" | "M" | "L" | "XL";

// === Articles ===
// Article complet tel qu'en base ou affiché côté front
export type Article = {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  stocks: Stock[]; // LEGACY: Utiliser article_stock à la place
  categorie_id: number;
  // propriétés optionnelles (ex: dans un panier)
  taille?: string;
  quantite?: number;
  // Nouveau: stocks unifiés
  article_stock?: ArticleStock[];
};

// Article simplifié ou spécifique à l’API (sans description complète ni stocks)
export type ArticleAPI = {
  id: number;
  nom: string;
  prix: number;
  description: string;
  images: string[];
  stocks: Stock[];
};

// Articles regroupés par catégorie (clé = nom de la catégorie)
export type ArticlesParCategorie = {
  [categorieNom: string]: Article[]; // Chaque article doit avoir un id (obligatoire)
};

// === Catégories ===
export type Categorie = {
  id: number;
  nom: string;
};

// === Commandes ===

// Article dans une commande (données envoyées à la création)
export interface ArticleCommande {
  article_id: number;
  taille_id?: number; // optionnel (ex: taille choisie)
  quantite: number;
  prix: number;
}

export type ArticleNomCategorie = {
  nom: string;
  categorie_id: number;
};

export type ArticleCreationData = {
  nom: string;
  description: string;
  prix: number;
  images: string[];
  categorie_id: number;
  stocks: {
    taille: string;
    quantite: number;
  }[];
};

export type ArticleData = ArticleCreationData & {
  id: number;
};

export type NouvelleCommande = {
  utilisateur_id: number;
  articles: {
    article_id: number;
    taille?: string;
    quantite: number;
    prix: number;
  }[];
  statut?: string;
  date?: string;
  total?: number;
};

// === Commandes complètes ===

export type Commande = {
  id: number;
  utilisateur_id: number;
  statut: string;
  date: string;
  total: number;
  articles: ArticleCommande[];
};

export type CommandeDetails = {
  id: number;
  utilisateur_id: number;
  utilisateur_nom?: string; // optionnel pour éviter les jointures
  statut: string;
  date: string;
  total: number;
  articles: ArticleCommandeDetails[];
};

export type ArticleCommandeDetails = {
  article_id: number;
  article_nom: string;
  taille?: string;
  quantite: number;
  prix: number;
};

// === Types utilisateur ===

export type UtilisateurMagasin = {
  id: number;
  nom: string;
  email: string;
};

// === Types de réponse API ===

export type MagasinResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
};

export type ArticlesResponse = MagasinResponse<{
  articles: Article[];
  total?: number;
}>;

export type CommandeResponse = MagasinResponse<{
  commande: Commande;
}>;

export type CommandesResponse = MagasinResponse<{
  commandes: CommandeDetails[];
  total?: number;
}>;

export type CategoriesResponse = MagasinResponse<{
  categories: Categorie[];
}>;

// === Statuts et configuration ===

export enum StatutCommande {
  EN_ATTENTE = "en_attente",
  CONFIRMEE = "confirmee",
  EXPEDIEE = "expediee",
  LIVREE = "livree",
  ANNULEE = "annulee",
}

export type FiltresArticles = {
  categorie_id?: number;
  prix_min?: number;
  prix_max?: number;
  disponible?: boolean;
  recherche?: string;
};

export type OptionsTri = {
  colonne: "nom" | "prix" | "date_creation" | "categorie";
  direction: "asc" | "desc";
};

export type OptionsPagination = {
  page: number;
  limit: number;
};

// === Erreurs spécifiques ===

export class MagasinError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any,
  ) {
    super(message);
    this.name = "MagasinError";
  }
}

// === Types d'identification ===

export type IdMagasin = {
  id: number;
};

export type IdArticle = IdMagasin;
export type IdCommande = IdMagasin;
export type IdCategorie = IdMagasin;
export type IdUtilisateur = IdMagasin;

// === Mapping des tailles ===

export type MappingTaille = {
  [taille: string]: number; // taille string -> id numérique
};

export const TAILLES_MAPPING: MappingTaille = {
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
};

export const TAILLES_REVERSE_MAPPING: { [id: number]: string } = {
  1: "S",
  2: "M",
  3: "L",
  4: "XL",
};

// === Types utilitaires ===

export type ConfirmationResult = {
  success: boolean;
  isConfirm: boolean;
  message?: string;
  data?: any;
};

export type MagasinConfirmationResult = ConfirmationResult;
