/**
 * Domain Types - Size
 * Basé sur la table `tailles` de la DB
 */

import { z } from 'zod';
import { sizeSchema } from '../../validators/store/size.validators.js';

/**
 * Interface principale Size
 * Correspond à la structure de la table `tailles`
 */
export type Size = z.infer<typeof sizeSchema>;

/**
 * Size avec relations chargées
 */
export interface SizeWithRelations extends Size {
  // Stocks associés à cette taille
  stocks: {
    id: number;
    article_id: number;
    quantite: number;
    quantite_minimum: number;
  }[];
}

/**
 * Size avec statistiques de stock
 */
export interface SizeWithStats extends Size {
  // Nombre total de stocks pour cette taille
  nombre_stocks: number;
  // Quantité totale en stock pour cette taille (tous articles confondus)
  quantite_totale: number;
  // Nombre d'articles avec cette taille
  nombre_articles: number;
}

/**
 * Size avec informations d'articles
 */
export interface SizeWithArticles extends Size {
  // Articles disponibles dans cette taille
  articles: {
    id: number;
    nom: string;
    prix: number;
    image_url?: string | null;
    actif: boolean;
    quantite_disponible: number;
  }[];
}

/**
 * Size pour l'affichage public
 */
export interface SizePublic {
  id: number;
  nom: string;
  ordre: number;
}

/**
 * Size minimal (pour références)
 */
export interface SizeBasic {
  id: number;
  nom: string;
  ordre: number;
}

/**
 * Size pour liste/tableau
 */
export interface SizeListItem {
  id: number;
  nom: string;
  ordre: number;
  nombre_stocks: number;
  quantite_totale: number;
}

/**
 * Size pour sélection dans un formulaire
 */
export interface SizeOption {
  id: number;
  nom: string;
  disponible: boolean;
  quantite_disponible?: number;
}

/**
 * Size avec disponibilité pour un article spécifique
 */
export interface SizeWithAvailability extends Size {
  disponible: boolean;
  quantite_disponible: number;
  en_rupture: boolean;
}
