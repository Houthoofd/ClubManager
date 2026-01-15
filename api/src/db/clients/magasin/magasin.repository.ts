/**
 * Repository pour les opérations de base de données sur le Magasin
 * Responsabilité: Orchestration des sous-repositories modulaires
 */

import MysqlConnector from "../../connector/mysqlconnector.js";
import type {
  Article,
  ArticleAvecCategorie,
  StockDetail,
  Categorie,
  Taille,
  TailleMap,
  CommandeAvecClient,
  CreateArticleData,
  UpdateArticleData,
  CreateCommandeData,
  AddStockData,
  UpdateStockData,
  ConfirmationResult,
  ArticlesParCategorie,
  MagasinStats,
} from "./types.js";

import { ReadRepository } from "./repositories/read.repository.js";
import { WriteRepository } from "./repositories/write.repository.js";
import { SearchRepository } from "./repositories/search.repository.js";
import { ValidationRepository } from "./repositories/validation.repository.js";

/**
 * Repository principal pour la gestion du magasin
 * Délègue aux repositories spécialisés
 */
export class MagasinRepository {
  private mysqlConnector: MysqlConnector;
  private readRepo: ReadRepository;
  private writeRepo: WriteRepository;
  private searchRepo: SearchRepository;
  private validationRepo: ValidationRepository;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
    this.readRepo = new ReadRepository();
    this.writeRepo = new WriteRepository();
    this.searchRepo = new SearchRepository();
    this.validationRepo = new ValidationRepository();
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE D'ARTICLES
  // ==========================================================================

  /**
   * Récupérer tous les articles avec leurs relations (images, stocks, catégorie)
   */
  async getAllArticles(): Promise<ArticleAvecCategorie[]> {
    return this.readRepo.getAllArticles();
  }

  /**
   * Récupérer un article par son ID
   */
  async getArticleById(
    articleId: number,
  ): Promise<ArticleAvecCategorie | null> {
    return this.readRepo.getArticleById(articleId);
  }

  /**
   * Récupérer tous les articles groupés par catégorie
   */
  async getArticlesParCategories(): Promise<ArticlesParCategorie> {
    return this.readRepo.getArticlesParCategories();
  }

  /**
   * Récupérer les articles d'une catégorie spécifique
   */
  async getArticlesByCategorie(
    categorieId: number,
  ): Promise<ArticleAvecCategorie[]> {
    return this.readRepo.getArticlesByCategorie(categorieId);
  }

  /**
   * Rechercher des articles par nom
   */
  async searchArticlesByName(
    searchTerm: string,
  ): Promise<ArticleAvecCategorie[]> {
    return this.searchRepo.searchArticlesByName(searchTerm);
  }

  /**
   * Rechercher des articles par plage de prix
   */
  async searchArticlesByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<ArticleAvecCategorie[]> {
    return this.searchRepo.searchArticlesByPriceRange(minPrice, maxPrice);
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE STOCKS
  // ==========================================================================

  /**
   * Récupérer tous les stocks
   */
  async getAllStocks(): Promise<StockDetail[]> {
    return this.readRepo.getAllStocks();
  }

  /**
   * Récupérer les stocks pour un article
   */
  async getStocksByArticle(articleId: number): Promise<StockDetail[]> {
    return this.readRepo.getStocksByArticle(articleId);
  }

  /**
   * Récupérer un stock spécifique pour un article et une taille
   */
  async getStockByArticleAndTaille(
    articleId: number,
    tailleId: number,
  ): Promise<StockDetail | null> {
    return this.readRepo.getStockByArticleAndTaille(articleId, tailleId);
  }

  /**
   * Récupérer les articles en rupture de stock
   */
  async getOutOfStockArticles(): Promise<ArticleAvecCategorie[]> {
    return this.readRepo.getOutOfStockArticles();
  }

  /**
   * Récupérer les articles avec un stock faible
   */
  async getLowStockArticles(
    threshold: number = 5,
  ): Promise<ArticleAvecCategorie[]> {
    return this.readRepo.getLowStockArticles(threshold);
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE CATÉGORIES
  // ==========================================================================

  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<Categorie[]> {
    return this.readRepo.getAllCategories();
  }

  /**
   * Récupérer une catégorie par son ID
   */
  async getCategorieById(categorieId: number): Promise<Categorie | null> {
    return this.readRepo.getCategorieById(categorieId);
  }

  /**
   * Récupérer une catégorie par son nom
   */
  async getCategorieByName(nom: string): Promise<Categorie | null> {
    return this.readRepo.getCategorieByName(nom);
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE TAILLES
  // ==========================================================================

  /**
   * Récupérer toutes les tailles
   */
  async getAllTailles(): Promise<Taille[]> {
    return this.readRepo.getAllTailles();
  }

  /**
   * Récupérer une taille par son ID
   */
  async getTailleById(tailleId: number): Promise<Taille | null> {
    return this.readRepo.getTailleById(tailleId);
  }

  /**
   * Récupérer une taille par son nom
   */
  async getTailleByName(nom: string): Promise<Taille | null> {
    return this.readRepo.getTailleByName(nom);
  }

  /**
   * Créer un mapping nom de taille -> ID
   */
  async getTailleMap(): Promise<TailleMap> {
    return this.readRepo.getTailleMap();
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE COMMANDES
  // ==========================================================================

  /**
   * Récupérer toutes les commandes
   */
  async getAllCommandes(): Promise<CommandeAvecClient[]> {
    return this.readRepo.getAllCommandes();
  }

  /**
   * Récupérer une commande par son ID
   */
  async getCommandeById(
    commandeId: number,
  ): Promise<CommandeAvecClient | null> {
    return this.readRepo.getCommandeById(commandeId);
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getCommandesByUser(
    utilisateurId: number,
  ): Promise<CommandeAvecClient[]> {
    return this.readRepo.getCommandesByUser(utilisateurId);
  }

  /**
   * Récupérer les commandes par statut
   */
  async getCommandesByStatut(statut: string): Promise<CommandeAvecClient[]> {
    return this.readRepo.getCommandesByStatut(statut);
  }

  // ==========================================================================
  // MÉTHODES DE CRÉATION D'ARTICLES
  // ==========================================================================

  /**
   * Créer un nouvel article
   */
  async createArticle(data: CreateArticleData): Promise<ConfirmationResult> {
    return this.writeRepo.createArticle(data);
  }

  // ==========================================================================
  // MÉTHODES DE MISE À JOUR D'ARTICLES
  // ==========================================================================

  /**
   * Mettre à jour un article
   */
  async updateArticle(
    articleId: number,
    data: UpdateArticleData,
  ): Promise<ConfirmationResult> {
    return this.writeRepo.updateArticle(articleId, data);
  }

  // ==========================================================================
  // MÉTHODES DE SUPPRESSION D'ARTICLES
  // ==========================================================================

  /**
   * Supprimer un article (avec images et stocks)
   */
  async deleteArticle(articleId: number): Promise<ConfirmationResult> {
    return this.writeRepo.deleteArticle(articleId);
  }

  // ==========================================================================
  // MÉTHODES DE GESTION DES STOCKS
  // ==========================================================================

  /**
   * Ajouter du stock (ou mettre à jour si existe)
   */
  async addStock(data: AddStockData): Promise<ConfirmationResult> {
    return this.writeRepo.addStock(data);
  }

  /**
   * Mettre à jour la quantité d'un stock
   */
  async updateStock(data: UpdateStockData): Promise<ConfirmationResult> {
    return this.writeRepo.updateStock(data);
  }

  // ==========================================================================
  // MÉTHODES DE CRÉATION DE COMMANDES
  // ==========================================================================

  /**
   * Créer une nouvelle commande
   */
  async createCommande(data: CreateCommandeData): Promise<ConfirmationResult> {
    return this.writeRepo.createCommande(data);
  }

  // ==========================================================================
  // MÉTHODES DE MISE À JOUR DE COMMANDES
  // ==========================================================================

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateCommandeStatut(
    commandeId: number,
    statut: string,
  ): Promise<ConfirmationResult> {
    return this.writeRepo.updateCommandeStatut(commandeId, statut);
  }

  /**
   * Annuler une commande
   */
  async cancelCommande(commandeId: number): Promise<ConfirmationResult> {
    return this.writeRepo.cancelCommande(commandeId);
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION
  // ==========================================================================

  /**
   * Vérifier si un article existe
   */
  async articleExists(articleId: number): Promise<boolean> {
    return this.validationRepo.articleExists(articleId);
  }

  /**
   * Vérifier si une catégorie existe
   */
  async categorieExists(categorieId: number): Promise<boolean> {
    return this.validationRepo.categorieExists(categorieId);
  }

  /**
   * Vérifier si la quantité en stock est suffisante
   */
  async checkStockSufficient(
    articleId: number,
    tailleId: number,
    quantiteDemandee: number,
  ): Promise<boolean> {
    return this.validationRepo.checkStockSufficient(
      articleId,
      tailleId,
      quantiteDemandee,
    );
  }

  // ==========================================================================
  // MÉTHODES STATISTIQUES
  // ==========================================================================

  /**
   * Obtenir les statistiques du magasin
   */
  async getStats(): Promise<MagasinStats> {
    return this.searchRepo.getStats();
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

let repositoryInstance: MagasinRepository | null = null;

/**
 * Récupérer l'instance singleton du repository
 */
export function getMagasinRepository(): MagasinRepository {
  if (!repositoryInstance) {
    repositoryInstance = new MagasinRepository();
  }
  return repositoryInstance;
}
