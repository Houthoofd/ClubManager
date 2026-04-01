/**
 * Domain Types - Stock
 * Basé sur la table `stocks` de la DB
 */

import { z } from 'zod';
import { stockSchema } from '../../validators/store/stock.validators.js';

/**
 * Interface principale Stock
 * Correspond à la structure de la table `stocks`
 */
export type Stock = z.infer<typeof stockSchema>;

/**
 * Stock avec relations chargées
 */
export interface StockWithRelations extends Stock {
  // Article
  article: {
    id: number;
    nom: string;
    description?: string | null;
    prix: number;
    image_url?: string | null;
    categorie_id?: number | null;
    actif: boolean;
  };

  // Taille
  taille: {
    id: number;
    nom: string;
    ordre: number;
  };
}

/**
 * Stock avec informations article et taille
 */
export interface StockWithDetails extends Stock {
  article_nom: string;
  article_prix: number;
  article_image_url?: string | null;
  article_actif: boolean;
  taille_nom: string;
  taille_ordre: number;
  categorie_nom?: string;
}

/**
 * Stock avec indicateurs de niveau
 */
export interface StockWithStatus extends Stock {
  // Indicateurs calculés
  en_rupture: boolean;
  stock_bas: boolean;
  pourcentage_stock: number; // Par rapport à quantite_minimum
  statut: 'ok' | 'bas' | 'rupture';
  valeur_stock: number; // quantite * prix_article
}

/**
 * Stock avec historique de mouvements
 */
export interface StockWithHistory extends StockWithRelations {
  // Derniers mouvements
  derniers_mouvements: {
    id: number;
    type_mouvement: string;
    quantite_mouvement: number;
    quantite_avant: number;
    quantite_apres: number;
    motif?: string | null;
    created_at: Date;
  }[];

  // Statistiques de mouvements
  total_entrees: number;
  total_sorties: number;
}

/**
 * Stock pour l'affichage public
 */
export interface StockPublic {
  id: number;
  article_id: number;
  taille_id: number;
  quantite: number;
  disponible: boolean;
}

/**
 * Stock minimal (pour références)
 */
export interface StockBasic {
  id: number;
  article_id: number;
  taille_id: number;
  quantite: number;
}

/**
 * Stock pour liste/tableau
 */
export interface StockListItem {
  id: number;
  article_id: number;
  article_nom: string;
  article_prix: number;
  taille_id: number;
  taille_nom: string;
  quantite: number;
  quantite_minimum: number;
  en_rupture: boolean;
  stock_bas: boolean;
  valeur_stock: number;
  updated_at?: Date | null;
}

/**
 * Stock pour inventaire
 */
export interface StockInventoryItem {
  id: number;
  article_nom: string;
  taille_nom: string;
  quantite_actuelle: number;
  quantite_minimum: number;
  quantite_comptee?: number;
  ecart?: number;
  statut: 'ok' | 'bas' | 'rupture';
  categorie_nom?: string;
}

/**
 * Stock bas (alerte)
 */
export interface StockLowItem {
  id: number;
  article_id: number;
  article_nom: string;
  article_image_url?: string | null;
  taille_id: number;
  taille_nom: string;
  quantite: number;
  quantite_minimum: number;
  manquant: number; // quantite_minimum - quantite
  categorie_nom?: string;
}

/**
 * Stock groupé par article
 */
export interface StockGroupedByArticle {
  article_id: number;
  article_nom: string;
  article_prix: number;
  article_image_url?: string | null;
  categorie_nom?: string;
  stocks: {
    id: number;
    taille_id: number;
    taille_nom: string;
    quantite: number;
    quantite_minimum: number;
    en_rupture: boolean;
    stock_bas: boolean;
  }[];
  quantite_totale: number;
  nombre_tailles: number;
  valeur_totale: number;
}

/**
 * Stock groupé par taille
 */
export interface StockGroupedBySize {
  taille_id: number;
  taille_nom: string;
  taille_ordre: number;
  stocks: {
    id: number;
    article_id: number;
    article_nom: string;
    article_prix: number;
    quantite: number;
    quantite_minimum: number;
    en_rupture: boolean;
    stock_bas: boolean;
  }[];
  quantite_totale: number;
  nombre_articles: number;
  valeur_totale: number;
}

/**
 * Stock avec disponibilité pour commande
 */
export interface StockAvailability {
  id: number;
  article_id: number;
  taille_id: number;
  quantite_disponible: number;
  disponible: boolean;
  quantite_maximum_commande: number;
}

/**
 * Statistiques de stock
 */
export interface StockStats {
  // Totaux
  nombre_stocks: number;
  quantite_totale: number;
  valeur_totale: number;

  // Alertes
  nombre_ruptures: number;
  nombre_stocks_bas: number;
  nombre_stocks_ok: number;

  // Par catégorie
  par_categorie: {
    categorie_id: number | null;
    categorie_nom: string;
    nombre_stocks: number;
    quantite_totale: number;
    valeur_totale: number;
  }[];

  // Par taille
  par_taille: {
    taille_id: number;
    taille_nom: string;
    nombre_stocks: number;
    quantite_totale: number;
  }[];
}

/**
 * Résumé de stock pour reporting
 */
export interface StockSummary {
  article_id: number;
  article_nom: string;
  taille_id: number;
  taille_nom: string;
  quantite: number;
  quantite_minimum: number;
  valeur_unitaire: number;
  valeur_totale: number;
  statut: 'ok' | 'bas' | 'rupture';
  derniere_modification: Date | null;
}

/**
 * Stock pour ajustement
 */
export interface StockAdjustment {
  id: number;
  article_id: number;
  article_nom: string;
  taille_id: number;
  taille_nom: string;
  quantite_avant: number;
  quantite_apres: number;
  quantite_ajustement: number;
  motif?: string;
  effectue_par?: number;
}

/**
 * Stock pour réapprovisionnement suggéré
 */
export interface StockReplenishmentSuggestion {
  id: number;
  article_id: number;
  article_nom: string;
  taille_id: number;
  taille_nom: string;
  quantite_actuelle: number;
  quantite_minimum: number;
  quantite_suggeree: number;
  priorite: 'haute' | 'moyenne' | 'basse';
  cout_reappro: number;
}
