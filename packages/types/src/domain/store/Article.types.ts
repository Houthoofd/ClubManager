/**
 * Domain Types - Article
 * Basé sur la table `articles` de la DB
 */

import { z } from 'zod';
import { articleSchema } from '../../validators/store/article.validators.js';

/**
 * Interface principale Article
 * Correspond à la structure de la table `articles`
 */
export type Article = z.infer<typeof articleSchema>;

/**
 * Article avec relations chargées
 */
export interface ArticleWithRelations extends Article {
  // Catégorie de l'article
  categorie?: {
    id: number;
    nom: string;
    description?: string | null;
    ordre: number;
  } | null;

  // Images additionnelles de l'article
  images: {
    id: number;
    url: string;
    ordre: number;
  }[];

  // Stocks disponibles par taille
  stocks: {
    id: number;
    taille_id: number;
    taille_nom: string;
    quantite: number;
    quantite_minimum: number;
  }[];
}

/**
 * Article avec images
 */
export interface ArticleWithImages extends Article {
  // Images additionnelles
  images: {
    id: number;
    url: string;
    ordre: number;
  }[];
}

/**
 * Article avec stocks
 */
export interface ArticleWithStocks extends Article {
  // Stocks par taille
  stocks: {
    id: number;
    taille_id: number;
    taille_nom: string;
    quantite: number;
    quantite_minimum: number;
    en_rupture: boolean;
    stock_bas: boolean;
  }[];

  // Indicateurs généraux
  quantite_totale: number;
  en_rupture_totale: boolean;
  tailles_disponibles: number;
}

/**
 * Article avec statistiques
 */
export interface ArticleWithStats extends Article {
  // Statistiques de vente
  nombre_ventes: number;
  quantite_vendue: number;
  revenu_total: number;

  // Statistiques de stock
  quantite_totale_stock: number;
  nombre_tailles_disponibles: number;
  valeur_stock: number;
}

/**
 * Article pour l'affichage public
 */
export interface ArticlePublic {
  id: number;
  nom: string;
  description?: string | null;
  prix: number;
  image_url?: string | null;
  categorie_id?: number | null;
  categorie_nom?: string;
  actif: boolean;
  images?: {
    id: number;
    url: string;
    ordre: number;
  }[];
  tailles_disponibles?: {
    id: number;
    nom: string;
    quantite: number;
    disponible: boolean;
  }[];
  en_stock: boolean;
}

/**
 * Article minimal (pour références)
 */
export interface ArticleBasic {
  id: number;
  nom: string;
  prix: number;
  image_url?: string | null;
  actif: boolean;
}

/**
 * Article pour liste/tableau
 */
export interface ArticleListItem {
  id: number;
  nom: string;
  description?: string | null;
  prix: number;
  image_url?: string | null;
  categorie_id?: number | null;
  categorie_nom?: string;
  actif: boolean;
  quantite_totale: number;
  nombre_images: number;
  nombre_tailles: number;
  created_at: Date;
  updated_at?: Date | null;
}

/**
 * Article pour catalogue
 */
export interface ArticleCatalogItem {
  id: number;
  nom: string;
  description?: string | null;
  prix: number;
  image_url?: string | null;
  categorie_nom?: string;
  images: string[]; // URLs des images
  en_stock: boolean;
  tailles_disponibles: string[]; // Noms des tailles
}

/**
 * Article pour détail complet
 */
export interface ArticleDetail extends ArticleWithRelations {
  // Statistiques
  nombre_ventes?: number;
  quantite_vendue?: number;

  // Stock calculé
  quantite_totale: number;
  en_rupture_totale: boolean;
  stock_bas: boolean;
  valeur_stock: number;

  // Images triées par ordre
  images_triees: {
    id: number;
    url: string;
    ordre: number;
  }[];

  // Stocks avec infos complètes
  stocks_detailles: {
    id: number;
    taille_id: number;
    taille_nom: string;
    taille_ordre: number;
    quantite: number;
    quantite_minimum: number;
    en_rupture: boolean;
    stock_bas: boolean;
    disponible: boolean;
  }[];
}

/**
 * Article pour panier/commande
 */
export interface ArticleCartItem {
  id: number;
  nom: string;
  prix: number;
  image_url?: string | null;
  taille_id: number;
  taille_nom: string;
  quantite_selectionnee: number;
  quantite_disponible: number;
  sous_total: number;
}

/**
 * Article avec disponibilité pour une taille spécifique
 */
export interface ArticleWithSizeAvailability extends Article {
  taille_id: number;
  taille_nom: string;
  quantite_disponible: number;
  disponible: boolean;
  stock_id?: number;
}

/**
 * Résumé article pour reporting
 */
export interface ArticleSummary {
  id: number;
  nom: string;
  categorie_nom?: string;
  prix: number;
  quantite_stock: number;
  valeur_stock: number;
  nombre_ventes: number;
  quantite_vendue: number;
  revenu_total: number;
  actif: boolean;
}
