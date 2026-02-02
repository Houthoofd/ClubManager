/**
 * Types pour le service Stock
 */

// ============================================
// TYPES DE BASE
// ============================================

export type TypeMouvementStock = 'commande' | 'livraison' | 'annulation' | 'retour' | 'ajustement' | 'reception';

export type StatutStock = 'disponible' | 'reserve' | 'rupture' | 'alerte';

// ============================================
// INTERFACES
// ============================================

/**
 * Article dans une commande
 */
export interface ArticleCommande {
  article_id: number;
  taille: string;
  quantite: number;
}

/**
 * Informations de stock pour un article
 */
export interface StockInfo {
  article_id: number;
  taille: string;
  stock_physique: number;
  stock_reserve: number;
  stock_disponible: number;
  seuil_alerte?: number;
  statut?: StatutStock;
}

/**
 * Stock avec détails de l'article
 */
export interface StockAvecDetails extends StockInfo {
  article_nom: string;
  article_code?: string;
  article_prix?: number;
  derniere_mise_a_jour?: Date;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * Mouvement de stock
 */
export interface MouvementStock {
  id?: number;
  article_id: number;
  taille: string;
  type_mouvement: TypeMouvementStock;
  quantite_avant: number;
  quantite_apres: number;
  quantite_mouvement: number;
  commande_id?: string;
  motif?: string;
  utilisateur_id?: number;
  created_at?: Date;
}

/**
 * Mouvement de stock avec détails
 */
export interface MouvementStockAvecDetails extends MouvementStock {
  article_nom: string;
  utilisateur_nom?: string;
  utilisateur_prenom?: string;
}

/**
 * Résumé de stock pour un article
 */
export interface ResumeStock {
  article_id: number;
  article_nom: string;
  article_code?: string;
  tailles: {
    taille: string;
    stock_physique: number;
    stock_reserve: number;
    stock_disponible: number;
    statut: StatutStock;
  }[];
  stock_total_physique: number;
  stock_total_disponible: number;
  valeur_totale?: number;
}

/**
 * Alerte de stock
 */
export interface AlerteStock {
  article_id: number;
  article_nom: string;
  taille: string;
  stock_disponible: number;
  seuil_alerte: number;
  statut: 'rupture' | 'alerte';
  jours_rupture?: number;
}

// ============================================
// INPUTS
// ============================================

/**
 * Input pour réserver du stock
 */
export interface ReserverStockInput {
  articles: ArticleCommande[];
  commande_id: string;
  utilisateur_id?: number;
}

/**
 * Input pour vérifier la disponibilité
 */
export interface VerifierDisponibiliteInput {
  articles: ArticleCommande[];
}

/**
 * Input pour confirmer une livraison
 */
export interface ConfirmerLivraisonInput {
  commande_id: string;
  utilisateur_id?: number;
  date_livraison?: Date;
}

/**
 * Input pour annuler une commande
 */
export interface AnnulerCommandeInput {
  commande_id: string;
  motif?: string;
  utilisateur_id?: number;
}

/**
 * Input pour ajuster le stock
 */
export interface AjusterStockInput {
  article_id: number;
  taille: string;
  quantite: number;
  type_ajustement: 'ajout' | 'retrait';
  motif: string;
  utilisateur_id?: number;
}

/**
 * Input pour réapprovisionner le stock
 */
export interface ReapprovisionnerStockInput {
  article_id: number;
  taille: string;
  quantite: number;
  motif?: string;
  utilisateur_id?: number;
}

/**
 * Input pour définir un seuil d'alerte
 */
export interface DefinirSeuilAlerteInput {
  article_id: number;
  taille: string;
  seuil_alerte: number;
}

/**
 * Input pour filtrer les stocks
 */
export interface FiltrerStocksInput {
  article_id?: number;
  taille?: string;
  statut?: StatutStock;
  recherche?: string;
  limit?: number;
  offset?: number;
}

/**
 * Input pour filtrer les mouvements
 */
export interface FiltrerMouvementsInput {
  article_id?: number;
  taille?: string;
  type_mouvement?: TypeMouvementStock;
  commande_id?: string;
  date_debut?: Date;
  date_fin?: Date;
  limit?: number;
  offset?: number;
}

// ============================================
// RÉSULTATS
// ============================================

/**
 * Résultat de vérification de disponibilité
 */
export interface ResultatDisponibilite {
  disponible: boolean;
  details: {
    article_id: number;
    taille: string;
    quantite_demandee: number;
    stock_disponible: number;
    disponible: boolean;
  }[];
}

/**
 * Résultat de réservation de stock
 */
export interface ResultatReservation {
  success: boolean;
  message: string;
  commande_id: string;
  articles_reserves: ArticleCommande[];
  mouvements?: MouvementStock[];
}

/**
 * Résultat de livraison
 */
export interface ResultatLivraison {
  success: boolean;
  message: string;
  commande_id: string;
  articles_livres: ArticleCommande[];
  date_livraison: Date;
}

/**
 * Résultat d'annulation
 */
export interface ResultatAnnulation {
  success: boolean;
  message: string;
  commande_id: string;
  articles_liberes: ArticleCommande[];
}

/**
 * Résultat d'ajustement de stock
 */
export interface ResultatAjustement {
  success: boolean;
  message: string;
  stock_avant: number;
  stock_apres: number;
  quantite_mouvement: number;
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Statistiques générales des stocks
 */
export interface StatistiquesStocks {
  nombre_articles_total: number;
  nombre_articles_actifs: number;
  nombre_articles_en_rupture: number;
  nombre_articles_alerte: number;
  valeur_stock_total: number;
  nombre_mouvements_total: number;
  nombre_mouvements_mois: number;
  top_articles_vendus: {
    article_id: number;
    article_nom: string;
    quantite_vendue: number;
  }[];
  alertes_actives: AlerteStock[];
}

/**
 * Statistiques pour un article
 */
export interface StatistiquesArticle {
  article_id: number;
  article_nom: string;
  stock_total_physique: number;
  stock_total_reserve: number;
  stock_total_disponible: number;
  valeur_stock: number;
  nombre_tailles: number;
  mouvements_30_jours: number;
  quantite_vendue_30_jours: number;
  quantite_recue_30_jours: number;
  rotation_stock: number;
  derniere_vente?: Date;
  dernier_approvisionnement?: Date;
}

/**
 * Statistiques de mouvements
 */
export interface StatistiquesMouvements {
  periode_debut: Date;
  periode_fin: Date;
  nombre_commandes: number;
  nombre_livraisons: number;
  nombre_annulations: number;
  nombre_ajustements: number;
  quantite_totale_reservee: number;
  quantite_totale_livree: number;
  quantite_totale_annulee: number;
  mouvements_par_type: {
    type: TypeMouvementStock;
    nombre: number;
    quantite_totale: number;
  }[];
}

// ============================================
// ERREURS
// ============================================

/**
 * Types d'erreurs du service Stock
 */
export enum StockErrorType {
  STOCK_NOT_FOUND = 'STOCK_NOT_FOUND',
  INSUFFICIENT_STOCK = 'INSUFFICIENT_STOCK',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  INVALID_ARTICLE = 'INVALID_ARTICLE',
  INVALID_TAILLE = 'INVALID_TAILLE',
  COMMANDE_NOT_FOUND = 'COMMANDE_NOT_FOUND',
  ALREADY_RESERVED = 'ALREADY_RESERVED',
  ALREADY_DELIVERED = 'ALREADY_DELIVERED',
  ALREADY_CANCELLED = 'ALREADY_CANCELLED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Erreur personnalisée pour le service Stock
 */
export class StockError extends Error {
  type: StockErrorType;
  statusCode: number;
  details?: any;

  constructor(
    message: string,
    type: StockErrorType = StockErrorType.UNKNOWN_ERROR,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.name = 'StockError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, StockError.prototype);
  }
}
