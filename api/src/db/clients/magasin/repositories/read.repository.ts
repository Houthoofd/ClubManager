/**
 * Repository pour les opérations de lecture du Magasin
 * Responsabilité: Récupération de données sans modification
 */

import MysqlConnector from "../../../connector/mysqlconnector.js";
import type {
  ArticleAvecCategorie,
  ArticleAvecRelationsRow,
  ArticlesParCategorie,
  StockDetail,
  StockDetailRow,
  Categorie,
  CategorieRow,
  Taille,
  TailleRow,
  TailleMap,
  CommandeAvecClient,
  CommandeAvecClientRow,
} from "../types.js";
import * as queries from "../queries/index.js";
import {
  parseArticlesWithRelations,
  parseArticlesParCategorie,
  parseStockDetailRows,
  parseCategorieRows,
  parseTailleRows,
  createTailleMap,
  parseCommandesAvecClient,
} from "../utils/index.js";

/**
 * Repository pour les opérations de lecture
 */
export class ReadRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE D'ARTICLES
  // ==========================================================================

  /**
   * Récupérer tous les articles avec leurs relations (images, stocks, catégorie)
   */
  async getAllArticles(): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_ARTICLES_WITH_RELATIONS,
        [],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer un article par son ID
   */
  async getArticleById(
    articleId: number,
  ): Promise<ArticleAvecCategorie | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ARTICLE_WITH_RELATIONS,
        [articleId],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const articles = parseArticlesWithRelations(results);
            resolve(articles[0] || null);
          }
        },
      );
    });
  }

  /**
   * Récupérer tous les articles groupés par catégorie
   */
  async getArticlesParCategories(): Promise<ArticlesParCategorie> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ARTICLES_GROUPED_BY_CATEGORIES,
        [],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            const articlesParCategorie = parseArticlesParCategorie(results);
            resolve(articlesParCategorie);
          }
        },
      );
    });
  }

  /**
   * Récupérer les articles d'une catégorie spécifique
   */
  async getArticlesByCategorie(
    categorieId: number,
  ): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ARTICLES_BY_CATEGORIE,
        [categorieId],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE STOCKS
  // ==========================================================================

  /**
   * Récupérer tous les stocks
   */
  async getAllStocks(): Promise<StockDetail[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_STOCKS,
        [],
        (error, results: StockDetailRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseStockDetailRows(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer les stocks pour un article
   */
  async getStocksByArticle(articleId: number): Promise<StockDetail[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STOCKS_BY_ARTICLE,
        [articleId],
        (error, results: StockDetailRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseStockDetailRows(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer un stock spécifique pour un article et une taille
   */
  async getStockByArticleAndTaille(
    articleId: number,
    tailleId: number,
  ): Promise<StockDetail | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STOCK_BY_ARTICLE_AND_TAILLE,
        [articleId, tailleId],
        (error, results: StockDetailRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const stocks = parseStockDetailRows(results);
            resolve(stocks[0] || null);
          }
        },
      );
    });
  }

  /**
   * Récupérer les articles en rupture de stock
   */
  async getOutOfStockArticles(): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_OUT_OF_STOCK_ARTICLES,
        [],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer les articles avec un stock faible
   */
  async getLowStockArticles(
    threshold: number = 5,
  ): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_LOW_STOCK_ARTICLES,
        [threshold],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE CATÉGORIES
  // ==========================================================================

  /**
   * Récupérer toutes les catégories
   */
  async getAllCategories(): Promise<Categorie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_CATEGORIES,
        [],
        (error, results: CategorieRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCategorieRows(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer une catégorie par son ID
   */
  async getCategorieById(categorieId: number): Promise<Categorie | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_CATEGORIE_BY_ID,
        [categorieId],
        (error, results: CategorieRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const categories = parseCategorieRows(results);
            resolve(categories[0] || null);
          }
        },
      );
    });
  }

  /**
   * Récupérer une catégorie par son nom
   */
  async getCategorieByName(nom: string): Promise<Categorie | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_CATEGORIE_BY_NAME,
        [nom],
        (error, results: CategorieRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const categories = parseCategorieRows(results);
            resolve(categories[0] || null);
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE TAILLES
  // ==========================================================================

  /**
   * Récupérer toutes les tailles
   */
  async getAllTailles(): Promise<Taille[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_TAILLES,
        [],
        (error, results: TailleRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseTailleRows(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer une taille par son ID
   */
  async getTailleById(tailleId: number): Promise<Taille | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TAILLE_BY_ID,
        [tailleId],
        (error, results: TailleRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const tailles = parseTailleRows(results);
            resolve(tailles[0] || null);
          }
        },
      );
    });
  }

  /**
   * Récupérer une taille par son nom
   */
  async getTailleByName(nom: string): Promise<Taille | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TAILLE_BY_NAME,
        [nom],
        (error, results: TailleRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const tailles = parseTailleRows(results);
            resolve(tailles[0] || null);
          }
        },
      );
    });
  }

  /**
   * Créer un mapping nom de taille -> ID
   */
  async getTailleMap(): Promise<TailleMap> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_TAILLES,
        [],
        (error, results: TailleRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(createTailleMap(parseTailleRows(results)));
          }
        },
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE COMMANDES
  // ==========================================================================

  /**
   * Récupérer toutes les commandes
   */
  async getAllCommandes(): Promise<CommandeAvecClient[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_COMMANDES_WITH_DETAILS,
        [],
        (error, results: CommandeAvecClientRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandesAvecClient(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer une commande par son ID
   */
  async getCommandeById(
    commandeId: number,
  ): Promise<CommandeAvecClient | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDE_WITH_DETAILS,
        [commandeId],
        (error, results: CommandeAvecClientRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const commandes = parseCommandesAvecClient(results);
            resolve(commandes[0] || null);
          }
        },
      );
    });
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getCommandesByUser(
    utilisateurId: number,
  ): Promise<CommandeAvecClient[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDES_BY_USER,
        [utilisateurId],
        (error, results: CommandeAvecClientRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandesAvecClient(results));
          }
        },
      );
    });
  }

  /**
   * Récupérer les commandes par statut
   */
  async getCommandesByStatut(statut: string): Promise<CommandeAvecClient[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COMMANDES_BY_STATUT,
        [statut],
        (error, results: CommandeAvecClientRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCommandesAvecClient(results));
          }
        },
      );
    });
  }
}
