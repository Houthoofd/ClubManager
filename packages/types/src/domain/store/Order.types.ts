/**
 * Domain Types - Order
 * Basé sur la table `commandes` de la DB
 */

import { z } from 'zod';
import { orderSchema } from '../../validators/store/order.validators.js';
import { OrderStatus } from '../../enums/store.enums.js';

/**
 * Interface principale Order
 * Correspond à la structure de la table `commandes`
 */
export type Order = z.infer<typeof orderSchema>;

/**
 * Order avec relations chargées
 */
export interface OrderWithRelations extends Order {
  // Utilisateur qui a passé la commande
  utilisateur: {
    id: number;
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
    photo_url?: string;
  };

  // Articles de la commande
  articles: {
    id: number;
    article_id: number;
    article_nom: string;
    article_image_url?: string | null;
    taille_id: number;
    taille_nom: string;
    quantite: number;
    prix: number;
    sous_total: number;
  }[];
}

/**
 * Order avec items (commande_articles)
 */
export interface OrderWithItems extends Order {
  // Items de la commande
  items: {
    id: number;
    article_id: number;
    taille_id: number;
    quantite: number;
    prix: number;
  }[];

  // Nombre d'articles
  nombre_articles: number;
  quantite_totale: number;
}

/**
 * Order avec détails complets
 */
export interface OrderWithDetails extends OrderWithRelations {
  // Statistiques
  nombre_articles: number;
  quantite_totale: number;

  // Infos calculées
  peut_etre_annulee: boolean;
  peut_etre_modifiee: boolean;
  est_expediee: boolean;
  est_livree: boolean;

  // Catégories des articles
  categories: string[];
}

/**
 * Order pour l'affichage public
 */
export interface OrderPublic {
  id: number;
  unique_id?: string | null;
  numero_commande?: string | null;
  total: number;
  date_commande: Date;
  statut: OrderStatus;
  nombre_articles: number;
}

/**
 * Order minimal (pour références)
 */
export interface OrderBasic {
  id: number;
  numero_commande?: string | null;
  utilisateur_id: number;
  total: number;
  date_commande: Date;
  statut: OrderStatus;
}

/**
 * Order pour liste/tableau
 */
export interface OrderListItem {
  id: number;
  unique_id?: string | null;
  numero_commande?: string | null;
  utilisateur_id: number;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_email: string;
  total: number;
  date_commande: Date;
  statut: OrderStatus;
  nombre_articles: number;
  quantite_totale: number;
  created_at: Date;
  updated_at?: Date | null;
}

/**
 * Order pour historique utilisateur
 */
export interface OrderHistoryItem {
  id: number;
  unique_id?: string | null;
  numero_commande?: string | null;
  total: number;
  date_commande: Date;
  statut: OrderStatus;
  nombre_articles: number;
  articles_apercu: {
    article_nom: string;
    taille_nom: string;
    quantite: number;
    image_url?: string | null;
  }[];
}

/**
 * Order pour détail complet
 */
export interface OrderDetail extends OrderWithRelations {
  // Nom complet utilisateur
  utilisateur_nom_complet: string;

  // Labels
  statut_label: string;
  statut_couleur: string;

  // Montant formaté
  total_formatted: string;

  // Calculs
  nombre_articles: number;
  quantite_totale: number;

  // Actions possibles
  peut_etre_annulee: boolean;
  peut_etre_modifiee: boolean;
  peut_etre_expediee: boolean;
  peut_etre_livree: boolean;
}

/**
 * Order pour création/panier
 */
export interface OrderCart {
  utilisateur_id: number;
  items: {
    article_id: number;
    taille_id: number;
    quantite: number;
    prix: number;
  }[];
  total: number;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Statistiques de commandes
 */
export interface OrderStats {
  // Totaux
  nombre_commandes: number;
  montant_total: number;
  montant_moyen: number;

  // Par statut
  par_statut: {
    [key in OrderStatus]: {
      nombre: number;
      montant: number;
    };
  };

  // Tendances
  commandes_en_attente: number;
  commandes_payees: number;
  commandes_expediees: number;
  commandes_livrees: number;
  commandes_annulees: number;

  // Articles
  nombre_articles_vendus: number;
  quantite_totale_vendue: number;
}

/**
 * Résumé mensuel des commandes
 */
export interface OrderMonthlySummary {
  annee: number;
  mois: number; // 1-12
  nombre_commandes: number;
  montant_total: number;
  nombre_articles: number;
  panier_moyen: number;
}

/**
 * Résumé journalier des commandes
 */
export interface OrderDailySummary {
  date: Date;
  nombre_commandes: number;
  montant_total: number;
  nombre_nouveaux_clients: number;
  panier_moyen: number;
}

/**
 * Order avec utilisateur
 */
export interface OrderWithUser extends Order {
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_email: string;
  utilisateur_photo_url?: string;
}

/**
 * Order pour export/reporting
 */
export interface OrderExport {
  id: number;
  numero_commande?: string | null;
  date_commande: Date;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_email: string;
  total: number;
  statut: OrderStatus;
  nombre_articles: number;
  quantite_totale: number;
  ip_address?: string | null;
  created_at: Date;
}

/**
 * Order avec articles détaillés
 */
export interface OrderWithArticleDetails extends Order {
  articles: {
    id: number;
    article_id: number;
    article_nom: string;
    article_description?: string | null;
    article_image_url?: string | null;
    categorie_nom?: string;
    taille_id: number;
    taille_nom: string;
    quantite: number;
    prix_unitaire: number;
    prix_total: number;
  }[];
  sous_total: number;
  nombre_articles_distincts: number;
}

/**
 * Labels des statuts de commande
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'En attente',
  [OrderStatus.PAID]: 'Payée',
  [OrderStatus.SHIPPED]: 'Expédiée',
  [OrderStatus.DELIVERED]: 'Livrée',
  [OrderStatus.CANCELLED]: 'Annulée',
};

/**
 * Couleurs des statuts de commande
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'orange',
  [OrderStatus.PAID]: 'blue',
  [OrderStatus.SHIPPED]: 'purple',
  [OrderStatus.DELIVERED]: 'green',
  [OrderStatus.CANCELLED]: 'red',
};

/**
 * Order pour notification
 */
export interface OrderNotification {
  id: number;
  numero_commande?: string | null;
  utilisateur_nom: string;
  utilisateur_prenom: string;
  utilisateur_email: string;
  total: number;
  statut: OrderStatus;
  date_commande: Date;
  nombre_articles: number;
}
