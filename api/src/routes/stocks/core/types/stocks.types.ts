// ================================================================
// Types pour les Stocks
// ================================================================

import { Decimal } from "@prisma/client/runtime/library";

/**
 * Données d'un produit en stock
 */
export interface StockData {
  id: number;
  nom: string;
  description?: string | null;
  reference?: string | null;
  categorie?: string | null;
  prix_unitaire: Decimal | number;
  quantite_disponible: number;
  quantite_minimale?: number;
  quantite_maximale?: number;
  unite?: string | null;
  emplacement?: string | null;
  fournisseur?: string | null;
  code_barre?: string | null;
  image_url?: string | null;
  actif: boolean;
  date_creation: Date;
  date_modification?: Date | null;
  date_derniere_entree?: Date | null;
  date_derniere_sortie?: Date | null;
}

/**
 * Filtres pour les stocks
 */
export interface StockFilters {
  nom?: string;
  reference?: string;
  categorie?: string;
  fournisseur?: string;
  actif?: boolean;
  quantite_min?: number;
  quantite_max?: number;
  prix_min?: number;
  prix_max?: number;
  en_rupture?: boolean;
  stock_faible?: boolean;
  emplacement?: string;
  code_barre?: string;
  recherche?: string;
}

/**
 * Input pour créer un stock
 */
export interface CreateStockInput {
  nom: string;
  description?: string;
  reference?: string;
  categorie?: string;
  prix_unitaire: number;
  quantite_disponible?: number;
  quantite_minimale?: number;
  quantite_maximale?: number;
  unite?: string;
  emplacement?: string;
  fournisseur?: string;
  code_barre?: string;
  image_url?: string;
  actif?: boolean;
}

/**
 * Input pour mettre à jour un stock
 */
export interface UpdateStockInput {
  nom?: string;
  description?: string;
  reference?: string;
  categorie?: string;
  prix_unitaire?: number;
  quantite_disponible?: number;
  quantite_minimale?: number;
  quantite_maximale?: number;
  unite?: string;
  emplacement?: string;
  fournisseur?: string;
  code_barre?: string;
  image_url?: string;
  actif?: boolean;
}

/**
 * Mouvement de stock
 */
export interface MouvementStockData {
  id: number;
  stock_id: number;
  type: "entree" | "sortie" | "ajustement";
  quantite: number;
  raison?: string | null;
  utilisateur_id?: number | null;
  reference_document?: string | null;
  date_mouvement: Date;
  commentaire?: string | null;
}

/**
 * Input pour un mouvement de stock
 */
export interface CreateMouvementStockInput {
  stock_id: number;
  type: "entree" | "sortie" | "ajustement";
  quantite: number;
  raison?: string;
  reference_document?: string;
  commentaire?: string;
}
