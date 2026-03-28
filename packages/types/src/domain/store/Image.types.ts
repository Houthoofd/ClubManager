/**
 * Domain Types - Image
 * Basé sur la table `images` de la DB
 */

import { z } from 'zod';
import { imageSchema } from '../../validators/store/image.validators.js';

/**
 * Interface principale Image
 * Correspond à la structure de la table `images`
 */
export type Image = z.infer<typeof imageSchema>;

/**
 * Image avec relations chargées
 */
export interface ImageWithRelations extends Image {
  // Article auquel l'image appartient
  article: {
    id: number;
    nom: string;
    description?: string | null;
    prix: number;
    image_url?: string | null;
    categorie_id?: number | null;
    actif: boolean;
  };
}

/**
 * Image avec informations de l'article
 */
export interface ImageWithArticle extends Image {
  article_nom: string;
  article_prix: number;
  article_actif: boolean;
  categorie_nom?: string;
}

/**
 * Image pour l'affichage public
 */
export interface ImagePublic {
  id: number;
  url: string;
  ordre: number;
  article_id: number;
}

/**
 * Image minimal (pour références)
 */
export interface ImageBasic {
  id: number;
  url: string;
  ordre: number;
}

/**
 * Image pour liste/tableau
 */
export interface ImageListItem {
  id: number;
  url: string;
  ordre: number;
  article_id: number;
  article_nom: string;
}

/**
 * Image pour galerie
 */
export interface ImageGalleryItem {
  id: number;
  url: string;
  ordre: number;
  article_nom: string;
  article_prix: number;
  thumbnail_url?: string;
}

/**
 * Image avec métadonnées
 */
export interface ImageWithMetadata extends Image {
  // Métadonnées calculées
  taille_fichier?: number;
  largeur?: number;
  hauteur?: number;
  format?: string;
  alt_text?: string;
}

/**
 * Image pour upload
 */
export interface ImageUploadData {
  article_id: number;
  url: string;
  ordre?: number;
}

/**
 * Image triée pour affichage
 */
export interface ImageSorted extends Image {
  position: number; // Position visuelle (1-based)
  est_premiere: boolean;
  est_derniere: boolean;
}
