/**
 * Types GraphQL pour Magasin (camelCase pour GraphQL)
 * Ces types correspondent aux schémas GraphQL définis dans graphql.typedefs.ts
 *
 * @module magasin/graphql.types
 */

/**
 * Article du magasin (GraphQL)
 */
export interface Article {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  categorieId: number;
  actif: boolean;
  dateCreation?: string;
  dateModification?: string;
}

/**
 * Stock d'un article (GraphQL)
 */
export interface Stock {
  tailleId: number;
  taille: string;
  quantite: number;
}

/**
 * Article avec stocks (GraphQL)
 */
export interface ArticleAvecStocks {
  id: number;
  nom: string;
  description: string;
  prix: number;
  images: string[];
  categorieId: number;
  actif: boolean;
  stocks: Stock[];
  dateCreation?: string;
  dateModification?: string;
}

/**
 * Catégorie d'articles (GraphQL)
 */
export interface Categorie {
  id: number;
  nom: string;
  description?: string;
}

/**
 * Taille disponible (GraphQL)
 */
export interface Taille {
  id: number;
  nom: string;
  ordre?: number;
}

/**
 * Article dans une commande (GraphQL)
 */
export interface CommandeArticle {
  articleId: number;
  nom: string;
  tailleId: number;
  taille: string;
  quantite: number;
  prixUnitaire: number;
  total: number;
}

/**
 * Commande (GraphQL)
 */
export interface Commande {
  id: string;
  numeroCommande: string;
  utilisateurId: number;
  utilisateurNom?: string;
  utilisateurPrenom?: string;
  utilisateurEmail?: string;
  articles: CommandeArticle[];
  total: number;
  statut: string;
  dateCommande: string;
  dateModification?: string;
  paymentIntentId?: string;
}

/**
 * Résultat d'une opération sur un article (GraphQL)
 */
export interface ArticleOperationResult {
  success: boolean;
  message: string;
  article?: ArticleAvecStocks;
}

/**
 * Résultat d'une opération sur une commande (GraphQL)
 */
export interface CommandeOperationResult {
  success: boolean;
  message: string;
  commande?: Commande;
}

/**
 * Résultat de liste d'articles (GraphQL)
 */
export interface ListArticlesResult {
  articles: ArticleAvecStocks[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Résultat de liste de commandes (GraphQL)
 */
export interface ListCommandesResult {
  commandes: Commande[];
  total: number;
  page?: number;
  limit?: number;
}

/**
 * Statistiques du magasin (GraphQL)
 */
export interface StatistiquesMagasin {
  totalArticles: number;
  articlesActifs: number;
  articlesEnRupture: number;
  totalCommandes: number;
  commandesEnAttente: number;
  commandesValidees: number;
  commandesLivrees: number;
  chiffreAffaires: number;
  panierMoyen: number;
}

/**
 * Input pour créer un article (GraphQL)
 */
export interface CreateArticleInput {
  nom: string;
  description: string;
  prix: number;
  images?: string[];
  categorieId: number;
  stocks?: StockInput[];
  actif?: boolean;
}

/**
 * Input pour un stock (GraphQL)
 */
export interface StockInput {
  tailleId: number;
  quantite: number;
}

/**
 * Input pour modifier un article (GraphQL)
 */
export interface UpdateArticleInput {
  nom?: string;
  description?: string;
  prix?: number;
  images?: string[];
  categorieId?: number;
  stocks?: StockInput[];
  actif?: boolean;
}

/**
 * Input pour un article dans une commande (GraphQL)
 */
export interface CommandeArticleInput {
  articleId: number;
  tailleId: number;
  quantite: number;
}

/**
 * Input pour créer une commande (GraphQL)
 */
export interface CreateCommandeInput {
  utilisateurId: number;
  articles: CommandeArticleInput[];
}

/**
 * Input pour modifier une commande (GraphQL)
 */
export interface UpdateCommandeInput {
  statut?: string;
  articles?: CommandeArticleInput[];
}

/**
 * Filtres pour la recherche d'articles (GraphQL)
 */
export interface ArticleFilters {
  categorieId?: number;
  prixMin?: number;
  prixMax?: number;
  actif?: boolean;
  recherche?: string;
  enStock?: boolean;
}

/**
 * Filtres pour la recherche de commandes (GraphQL)
 */
export interface CommandeFilters {
  utilisateurId?: number;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
}

/**
 * Options de pagination (GraphQL)
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Résultat du health check du magasin (GraphQL)
 */
export interface MagasinHealthResult {
  status: string;
  message: string;
  checks: MagasinHealthChecks;
  timestamp?: string;
}

/**
 * Détails des vérifications du health check (GraphQL)
 */
export interface MagasinHealthChecks {
  database: boolean;
  stock: boolean;
  paiements: boolean;
}

/**
 * Contexte GraphQL pour Magasin
 */
export interface MagasinContext {
  user?: {
    id: number;
    email: string;
    role: string;
  };
  req?: any;
  res?: any;
}
