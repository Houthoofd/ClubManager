/**
 * Types GraphQL pour Commandes (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module commandes/graphql.types
 */

/**
 * Article dans une commande (GraphQL)
 */
export interface CommandeArticle {
  articleId: number;
  nom?: string;
  tailleId: number;
  taille?: string;
  quantite: number;
  prix: number;
}

/**
 * Commande complète (GraphQL)
 */
export interface Commande {
  commandeId: string;
  utilisateurId: number;
  statut: StatutCommande;
  total: number;
  articles: CommandeArticle[];
  dateCommande: string;
  updatedAt?: string;
  paymentIntentId?: string;
  nomUtilisateur?: string;
  email?: string;
}

/**
 * Statuts possibles pour une commande (GraphQL)
 */
export enum StatutCommande {
  EN_ATTENTE = 'en_attente',
  CONFIRMEE = 'confirmee',
  EN_PREPARATION = 'en_preparation',
  EXPEDIEE = 'expediee',
  LIVREE = 'livree',
  ANNULEE = 'annulee',
}

/**
 * Statistiques des commandes (GraphQL)
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
 * Compteur par statut (GraphQL)
 */
export interface CommandeCountByStatut {
  statut: StatutCommande;
  count: number;
}

/**
 * Résultat de recherche paginé (GraphQL)
 */
export interface CommandeSearchResult {
  items: Commande[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Résultat d'une opération sur commande (GraphQL)
 */
export interface CommandeOperationResult {
  success: boolean;
  message: string;
  commande?: Commande;
}

/**
 * Résultat d'une mise à jour en lot (GraphQL)
 */
export interface BatchUpdateResult {
  success: boolean;
  message: string;
  updatedCount: number;
  errors?: string[];
}

/**
 * Input pour un article de commande (GraphQL)
 */
export interface CommandeArticleInput {
  articleId: number;
  tailleId: number;
  quantite: number;
  prix: number;
}

/**
 * Input pour créer une commande (GraphQL)
 */
export interface CreateCommandeInput {
  utilisateurId: number;
  articles: CommandeArticleInput[];
  paymentIntentId?: string;
}

/**
 * Input pour mettre à jour une commande (GraphQL)
 */
export interface UpdateCommandeInput {
  statut?: StatutCommande;
  total?: number;
  articles?: CommandeArticleInput[];
  paymentIntentId?: string;
}

/**
 * Input pour les filtres de recherche (GraphQL)
 */
export interface CommandeSearchFilters {
  utilisateurId?: number;
  statut?: StatutCommande;
  dateDebut?: string;
  dateFin?: string;
  montantMin?: number;
  montantMax?: number;
  numeroCommande?: string;
  page?: number;
  limit?: number;
}

/**
 * Contexte GraphQL pour Commandes
 */
export interface CommandesContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
