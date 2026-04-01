/**
 * Domain Types - Category
 * Basé sur la table `categories` de la DB
 */

import { z } from 'zod';
import { categorySchema } from '../../validators/store/category.validators.js';

/**
 * Interface principale Category
 * Correspond à la structure de la table `categories`
 */
export type Category = z.infer<typeof categorySchema>;

/**
 * Category avec relations chargées
 */
export interface CategoryWithRelations extends Category {
  // Articles dans cette catégorie
  articles: {
    id: number;
    nom: string;
    description?: string | null;
    prix: number;
    image_url?: string | null;
    actif: boolean;
  }[];
}

/**
 * Category avec statistiques
 */
export interface CategoryWithStats extends Category {
  // Nombre d'articles dans la catégorie
  nombre_articles: number;
  // Nombre d'articles actifs
  nombre_articles_actifs: number;
  // Prix moyen des articles
  prix_moyen?: number;
}

/**
 * Category avec articles et leurs images
 */
export interface CategoryWithArticles extends Category {
  articles: {
    id: number;
    nom: string;
    description?: string | null;
    prix: number;
    image_url?: string | null;
    actif: boolean;
    images?: {
      id: number;
      url: string;
      ordre: number;
    }[];
  }[];
}

/**
 * Category pour l'affichage public
 */
export interface CategoryPublic {
  id: number;
  nom: string;
  description?: string | null;
  ordre: number;
  nombre_articles_actifs?: number;
}

/**
 * Category minimal (pour références)
 */
export interface CategoryBasic {
  id: number;
  nom: string;
  ordre: number;
}

/**
 * Category pour liste/tableau
 */
export interface CategoryListItem {
  id: number;
  nom: string;
  description?: string | null;
  ordre: number;
  nombre_articles: number;
  nombre_articles_actifs: number;
}

/**
 * Category pour navigation/menu
 */
export interface CategoryMenuItem {
  id: number;
  nom: string;
  ordre: number;
  nombre_articles_actifs: number;
}
