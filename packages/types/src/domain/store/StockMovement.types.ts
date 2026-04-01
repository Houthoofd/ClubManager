/**
 * Domain Types - StockMovement
 * Basé sur la table `mouvements_stock` de la DB
 */

import { z } from 'zod';
import { stockMovementSchema } from '../../validators/store/stock-movement.validators.js';
import { StockMovementType } from '../../enums/store.enums.js';

/**
 * Interface principale StockMovement
 * Correspond à la structure de la table `mouvements_stock`
 */
export type StockMovement = z.infer<typeof stockMovementSchema>;

/**
 * StockMovement avec relations chargées
 */
export interface StockMovementWithRelations extends StockMovement {
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

  // Utilisateur qui a effectué le mouvement
  effectue_par_utilisateur?: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

/**
 * StockMovement avec détails article
 */
export interface StockMovementWithDetails extends StockMovement {
  article_nom: string;
  article_prix: number;
  article_image_url?: string | null;
  categorie_nom?: string;
  effectue_par_nom?: string;
  effectue_par_prenom?: string;
}

/**
 * StockMovement pour l'affichage public
 */
export interface StockMovementPublic {
  id: number;
  article_id: number;
  taille: string;
  type_mouvement: StockMovementType;
  quantite_mouvement: number;
  created_at: Date;
}

/**
 * StockMovement minimal (pour références)
 */
export interface StockMovementBasic {
  id: number;
  article_id: number;
  taille: string;
  type_mouvement: StockMovementType;
  quantite_mouvement: number;
  created_at: Date;
}

/**
 * StockMovement pour liste/tableau
 */
export interface StockMovementListItem {
  id: number;
  article_id: number;
  article_nom: string;
  article_image_url?: string | null;
  taille: string;
  type_mouvement: StockMovementType;
  type_mouvement_label: string;
  quantite_avant: number;
  quantite_apres: number;
  quantite_mouvement: number;
  commande_id?: string | null;
  motif?: string | null;
  effectue_par?: number | null;
  effectue_par_nom?: string;
  created_at: Date;
}

/**
 * StockMovement pour historique
 */
export interface StockMovementHistoryItem {
  id: number;
  type_mouvement: StockMovementType;
  type_mouvement_label: string;
  quantite_avant: number;
  quantite_apres: number;
  quantite_mouvement: number;
  motif?: string | null;
  effectue_par_nom?: string;
  created_at: Date;
}

/**
 * StockMovement groupé par type
 */
export interface StockMovementGroupedByType {
  type_mouvement: StockMovementType;
  type_mouvement_label: string;
  nombre_mouvements: number;
  quantite_totale: number;
  mouvements: StockMovementListItem[];
}

/**
 * StockMovement groupé par article
 */
export interface StockMovementGroupedByArticle {
  article_id: number;
  article_nom: string;
  article_image_url?: string | null;
  categorie_nom?: string;
  mouvements: {
    id: number;
    taille: string;
    type_mouvement: StockMovementType;
    quantite_mouvement: number;
    created_at: Date;
  }[];
  nombre_mouvements: number;
  total_entrees: number;
  total_sorties: number;
}

/**
 * StockMovement groupé par date
 */
export interface StockMovementGroupedByDate {
  date: Date;
  nombre_mouvements: number;
  total_entrees: number;
  total_sorties: number;
  mouvements: StockMovementListItem[];
}

/**
 * StockMovement pour export/reporting
 */
export interface StockMovementExport {
  date: Date;
  article_nom: string;
  categorie_nom?: string;
  taille: string;
  type_mouvement: StockMovementType;
  type_mouvement_label: string;
  quantite_avant: number;
  quantite_apres: number;
  quantite_mouvement: number;
  commande_id?: string | null;
  motif?: string | null;
  effectue_par_nom?: string;
}

/**
 * Statistiques de mouvements de stock
 */
export interface StockMovementStats {
  // Totaux
  nombre_mouvements: number;
  total_entrees: number;
  total_sorties: number;
  solde_net: number;

  // Par type
  par_type: {
    [key in StockMovementType]: {
      nombre: number;
      quantite: number;
    };
  };

  // Par période
  par_jour?: {
    date: Date;
    nombre_mouvements: number;
    entrees: number;
    sorties: number;
  }[];

  // Articles les plus mouvementés
  articles_top?: {
    article_id: number;
    article_nom: string;
    nombre_mouvements: number;
    total_mouvement: number;
  }[];
}

/**
 * Résumé mensuel des mouvements de stock
 */
export interface StockMovementMonthlySummary {
  annee: number;
  mois: number; // 1-12
  nombre_mouvements: number;
  total_entrees: number;
  total_sorties: number;
  articles_affectes: number;
}

/**
 * StockMovement avec impact sur valeur
 */
export interface StockMovementWithValue extends StockMovement {
  article_nom: string;
  article_prix: number;
  valeur_avant: number;
  valeur_apres: number;
  impact_valeur: number;
}

/**
 * StockMovement pour audit
 */
export interface StockMovementAudit {
  id: number;
  date: Date;
  article_nom: string;
  taille: string;
  type_mouvement: StockMovementType;
  type_mouvement_label: string;
  quantite_avant: number;
  quantite_apres: number;
  quantite_mouvement: number;
  commande_id?: string | null;
  motif?: string | null;
  effectue_par: number | null;
  effectue_par_nom: string;
  effectue_par_email: string;
}

/**
 * StockMovement pour timeline/historique
 */
export interface StockMovementTimeline {
  id: number;
  timestamp: Date;
  type_mouvement: StockMovementType;
  description: string;
  quantite_mouvement: number;
  quantite_resultante: number;
  icone: string;
  couleur: string;
}

/**
 * Labels des types de mouvements
 */
export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  [StockMovementType.ORDER]: 'Commande',
  [StockMovementType.DELIVERY]: 'Livraison',
  [StockMovementType.CANCELLATION]: 'Annulation',
  [StockMovementType.RETURN]: 'Retour',
  [StockMovementType.ADJUSTMENT]: 'Ajustement',
  [StockMovementType.INVENTORY]: 'Inventaire',
};

/**
 * Couleurs des types de mouvements
 */
export const STOCK_MOVEMENT_TYPE_COLORS: Record<StockMovementType, string> = {
  [StockMovementType.ORDER]: 'red',
  [StockMovementType.DELIVERY]: 'green',
  [StockMovementType.CANCELLATION]: 'orange',
  [StockMovementType.RETURN]: 'blue',
  [StockMovementType.ADJUSTMENT]: 'purple',
  [StockMovementType.INVENTORY]: 'gray',
};

/**
 * Icônes des types de mouvements
 */
export const STOCK_MOVEMENT_TYPE_ICONS: Record<StockMovementType, string> = {
  [StockMovementType.ORDER]: '🛒',
  [StockMovementType.DELIVERY]: '📦',
  [StockMovementType.CANCELLATION]: '❌',
  [StockMovementType.RETURN]: '↩️',
  [StockMovementType.ADJUSTMENT]: '🔧',
  [StockMovementType.INVENTORY]: '📋',
};
