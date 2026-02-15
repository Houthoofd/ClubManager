/**
 * Types pour la gestion des commandes
 */

/**
 * Article dans une commande
 */
export interface CommandeArticle {
  produit_id: number;
  nom: string;
  quantite: number;
  prix_unitaire: number;
  total: number;
}

/**
 * Commande complète avec informations utilisateur
 */
export interface Commande {
  commande_id: string;
  utilisateur_id: number;
  statut: CommandeStatut;
  total: number;
  articles: CommandeArticle[];
  date_commande: Date;
  updated_at: Date;
  payment_intent_id?: string;
  nom_utilisateur?: string;
  email?: string;
}

/**
 * Statut de commande
 */
export type CommandeStatut =
  | "en_attente"
  | "confirmee"
  | "en_preparation"
  | "expediee"
  | "livree"
  | "annulee";

/**
 * Données pour créer une commande
 */
export interface CreateCommandeInput {
  utilisateur_id: number;
  articles: CommandeArticle[];
  total: number;
  statut?: CommandeStatut;
  payment_intent_id?: string;
  date_commande?: Date;
}

/**
 * Données pour mettre à jour une commande
 */
export interface UpdateCommandeInput {
  statut?: CommandeStatut;
  total?: number;
  articles?: CommandeArticle[];
  payment_intent_id?: string;
}

/**
 * Résultat d'une opération sur commande
 */
export interface CommandeResult {
  success: boolean;
  message: string;
  commande?: Commande;
  commande_id?: string;
}

/**
 * Statistiques des commandes
 */
export interface CommandeStats {
  totalCommandes: number;
  commandesEnAttente: number;
  commandesConfirmees: number;
  commandesEnPreparation: number;
  commandesExpediees: number;
  commandesLivrees: number;
  commandesAnnulees: number;
  revenuTotal: number;
  revenuMoisEnCours: number;
  panierMoyen: number;
}

/**
 * Compteurs par statut
 */
export interface CommandeCountByStatut {
  [statut: string]: number;
}

/**
 * Filtres de recherche de commandes
 */
export interface CommandeSearchFilters {
  statut?: CommandeStatut;
  utilisateur_id?: number;
  date_debut?: string;
  date_fin?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Résultat de recherche paginé
 */
export interface CommandeSearchResult {
  items: Commande[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
