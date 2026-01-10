/**
 * Repository pour les opérations de base de données sur le Magasin
 * Responsabilité: Accès à la base de données uniquement (pas de logique métier)
 */

import MysqlConnector from '../../connector/mysqlconnector.js';
import type {
  Article,
  ArticleRow,
  ArticleAvecCategorie,
  ArticleAvecRelationsRow,
  StockDetail,
  StockDetailRow,
  Categorie,
  CategorieRow,
  Taille,
  TailleRow,
  TailleMap,
  CommandeAvecClient,
  CommandeAvecClientRow,
  CreateArticleData,
  UpdateArticleData,
  CreateCommandeData,
  CreateArticleCommandeData,
  AddStockData,
  UpdateStockData,
  ConfirmationResult,
  ArticlesParCategorie,
  MagasinStats,
} from './types.js';
import * as queries from './queries/index.js';
import {
  parseArticleRow,
  parseArticleRows,
  parseArticlesWithRelations,
  parseArticlesParCategorie,
  parseStockDetailRows,
  parseCategorieRows,
  parseTailleRows,
  createTailleMap,
  getTailleIdFromMap,
  parseCommandesAvecClient,
  toInt,
  toFloat,
  validateId,
  validatePrice,
  validateQuantity,
} from './utils/index.js';

/**
 * Repository pour la gestion du magasin
 */
export class MagasinRepository {
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
        }
      );
    });
  }

  /**
   * Récupérer un article par son ID
   */
  async getArticleById(articleId: number): Promise<ArticleAvecCategorie | null> {
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
        }
      );
    });
  }

  /**
   * Récupérer les articles organisés par catégorie
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
            resolve(parseArticlesParCategorie(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les articles d'une catégorie spécifique
   */
  async getArticlesByCategorie(categorieId: number): Promise<ArticleAvecCategorie[]> {
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
        }
      );
    });
  }

  /**
   * Rechercher des articles par nom
   */
  async searchArticlesByName(searchTerm: string): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      const searchPattern = `%${searchTerm}%`;
      this.mysqlConnector.query(
        queries.SEARCH_ARTICLES_BY_NAME,
        [searchPattern],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des articles par plage de prix
   */
  async searchArticlesByPriceRange(
    minPrice: number,
    maxPrice: number
  ): Promise<ArticleAvecCategorie[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_ARTICLES_BY_PRICE_RANGE,
        [minPrice, maxPrice],
        (error, results: ArticleAvecRelationsRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseArticlesWithRelations(results));
          }
        }
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
        }
      );
    });
  }

  /**
   * Récupérer les stocks d'un article
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
        }
      );
    });
  }

  /**
   * Récupérer un stock spécifique (article + taille)
   */
  async getStockByArticleAndTaille(
    articleId: number,
    tailleId: number
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
        }
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
        }
      );
    });
  }

  /**
   * Récupérer les articles avec stock faible
   */
  async getLowStockArticles(threshold: number = 5): Promise<StockDetail[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_LOW_STOCK_ARTICLES,
        [threshold],
        (error, results: StockDetailRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseStockDetailRows(results));
          }
        }
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
        }
      );
    });
  }

  /**
   * Récupérer une catégorie par ID
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
        }
      );
    });
  }

  /**
   * Récupérer une catégorie par nom
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
        }
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
        }
      );
    });
  }

  /**
   * Récupérer une taille par ID
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
        }
      );
    });
  }

  /**
   * Récupérer une taille par nom
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
        }
      );
    });
  }

  /**
   * Récupérer une map des tailles (nom -> id)
   */
  async getTailleMap(): Promise<TailleMap> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_TAILLE_MAP,
        [],
        (error, results: TailleRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(createTailleMap(results));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE DE COMMANDES
  // ==========================================================================

  /**
   * Récupérer toutes les commandes avec détails
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
        }
      );
    });
  }

  /**
   * Récupérer une commande par ID avec détails
   */
  async getCommandeById(commandeId: number): Promise<CommandeAvecClient | null> {
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
        }
      );
    });
  }

  /**
   * Récupérer les commandes d'un utilisateur
   */
  async getCommandesByUser(utilisateurId: number): Promise<CommandeAvecClient[]> {
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
        }
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
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE CRÉATION D'ARTICLES
  // ==========================================================================

  /**
   * Créer un nouvel article
   */
  async createArticle(data: CreateArticleData): Promise<ConfirmationResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Insérer l'article
        this.mysqlConnector.query(
          queries.INSERT_ARTICLE,
          [data.nom, data.prix, data.description || null, data.categorie_id],
          async (error, results) => {
            if (error) {
              return reject({
                isConfirm: false,
                message: `Erreur lors de la création de l'article: ${error.message}`,
              });
            }

            const articleId = results.insertId;

            try {
              // Insérer les images si présentes
              if (data.images && data.images.length > 0) {
                const imageValues = data.images.map((url) => [articleId, url]);
                await new Promise<void>((resolveImg, rejectImg) => {
                  this.mysqlConnector.query(
                    queries.INSERT_IMAGES_BATCH,
                    [imageValues],
                    (errImg) => {
                      if (errImg) rejectImg(errImg);
                      else resolveImg();
                    }
                  );
                });
              }

              // Insérer les stocks si présents
              if (data.stocks && data.stocks.length > 0) {
                const tailleMap = await this.getTailleMap();
                const stockValues = data.stocks.map((stock) => {
                  const tailleId = getTailleIdFromMap(tailleMap, stock.taille);
                  if (!tailleId) {
                    throw new Error(`Taille inconnue: ${stock.taille}`);
                  }
                  return [articleId, tailleId, stock.quantite];
                });

                await new Promise<void>((resolveStock, rejectStock) => {
                  this.mysqlConnector.query(
                    queries.INSERT_STOCKS_BATCH,
                    [stockValues],
                    (errStock) => {
                      if (errStock) rejectStock(errStock);
                      else resolveStock();
                    }
                  );
                });
              }

              resolve({
                isConfirm: true,
                message: 'Article créé avec succès',
                data: { id: articleId },
              });
            } catch (err: any) {
              reject({
                isConfirm: false,
                message: `Erreur lors de l'ajout des images/stocks: ${err.message}`,
              });
            }
          }
        );
      } catch (err: any) {
        reject({
          isConfirm: false,
          message: `Erreur inattendue: ${err.message}`,
        });
      }
    });
  }

  // ==========================================================================
  // MÉTHODES DE MISE À JOUR D'ARTICLES
  // ==========================================================================

  /**
   * Mettre à jour un article
   */
  async updateArticle(
    articleId: number,
    data: UpdateArticleData
  ): Promise<ConfirmationResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Mettre à jour l'article de base
        this.mysqlConnector.query(
          queries.UPDATE_ARTICLE,
          [
            data.nom,
            data.prix,
            data.description || null,
            data.categorie_id,
            articleId,
          ],
          async (error) => {
            if (error) {
              return reject({
                isConfirm: false,
                message: `Erreur lors de la mise à jour de l'article: ${error.message}`,
              });
            }

            try {
              // Mettre à jour les images si fournies
              if (data.images !== undefined) {
                // Supprimer les anciennes images
                await new Promise<void>((resolveDel, rejectDel) => {
                  this.mysqlConnector.query(
                    queries.DELETE_IMAGES_BY_ARTICLE,
                    [articleId],
                    (errDel) => {
                      if (errDel) rejectDel(errDel);
                      else resolveDel();
                    }
                  );
                });

                // Insérer les nouvelles images
                if (data.images.length > 0) {
                  const imageValues = data.images.map((url) => [articleId, url]);
                  await new Promise<void>((resolveImg, rejectImg) => {
                    this.mysqlConnector.query(
                      queries.INSERT_IMAGES_BATCH,
                      [imageValues],
                      (errImg) => {
                        if (errImg) rejectImg(errImg);
                        else resolveImg();
                      }
                    );
                  });
                }
              }

              // Mettre à jour les stocks si fournis
              if (data.stocks !== undefined) {
                // Supprimer les anciens stocks
                await new Promise<void>((resolveDel, rejectDel) => {
                  this.mysqlConnector.query(
                    queries.DELETE_STOCKS_BY_ARTICLE,
                    [articleId],
                    (errDel) => {
                      if (errDel) rejectDel(errDel);
                      else resolveDel();
                    }
                  );
                });

                // Insérer les nouveaux stocks
                if (data.stocks.length > 0) {
                  const tailleMap = await this.getTailleMap();
                  const stockValues = data.stocks.map((stock) => {
                    const tailleId = getTailleIdFromMap(tailleMap, stock.taille);
                    if (!tailleId) {
                      throw new Error(`Taille inconnue: ${stock.taille}`);
                    }
                    return [articleId, tailleId, stock.quantite];
                  });

                  await new Promise<void>((resolveStock, rejectStock) => {
                    this.mysqlConnector.query(
                      queries.INSERT_STOCKS_BATCH,
                      [stockValues],
                      (errStock) => {
                        if (errStock) rejectStock(errStock);
                        else resolveStock();
                      }
                    );
                  });
                }
              }

              resolve({
                isConfirm: true,
                message: 'Article mis à jour avec succès',
              });
            } catch (err: any) {
              reject({
                isConfirm: false,
                message: `Erreur lors de la mise à jour des images/stocks: ${err.message}`,
              });
            }
          }
        );
      } catch (err: any) {
        reject({
          isConfirm: false,
          message: `Erreur inattendue: ${err.message}`,
        });
      }
    });
  }

  // ==========================================================================
  // MÉTHODES DE SUPPRESSION D'ARTICLES
  // ==========================================================================

  /**
   * Supprimer un article (avec images et stocks)
   */
  async deleteArticle(articleId: number): Promise<ConfirmationResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Supprimer les images
        await new Promise<void>((resolveDel, rejectDel) => {
          this.mysqlConnector.query(
            queries.DELETE_IMAGES_BY_ARTICLE,
            [articleId],
            (err) => {
              if (err) rejectDel(err);
              else resolveDel();
            }
          );
        });

        // Supprimer les stocks
        await new Promise<void>((resolveDel, rejectDel) => {
          this.mysqlConnector.query(
            queries.DELETE_STOCKS_BY_ARTICLE,
            [articleId],
            (err) => {
              if (err) rejectDel(err);
              else resolveDel();
            }
          );
        });

        // Supprimer l'article
        this.mysqlConnector.query(
          queries.DELETE_ARTICLE,
          [articleId],
          (error) => {
            if (error) {
              return reject({
                isConfirm: false,
                message: `Erreur lors de la suppression de l'article: ${error.message}`,
              });
            }

            resolve({
              isConfirm: true,
              message: 'Article supprimé avec succès',
            });
          }
        );
      } catch (err: any) {
        reject({
          isConfirm: false,
          message: `Erreur lors de la suppression: ${err.message}`,
        });
      }
    });
  }

  // ==========================================================================
  // MÉTHODES DE GESTION DES STOCKS
  // ==========================================================================

  /**
   * Ajouter du stock (ou mettre à jour si existe)
   */
  async addStock(data: AddStockData): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      // Vérifier si le stock existe déjà
      this.mysqlConnector.query(
        queries.CHECK_STOCK_EXISTS,
        [data.article_id, data.taille_id],
        (error, results) => {
          if (error) {
            return reject({
              isConfirm: false,
              message: `Erreur lors de la vérification du stock: ${error.message}`,
            });
          }

          const count = results[0]?.count || 0;

          if (count > 0) {
            // Mettre à jour le stock existant
            this.mysqlConnector.query(
              queries.INCREMENT_STOCK_QUANTITY,
              [data.quantite, data.article_id, data.taille_id],
              (errUpdate) => {
                if (errUpdate) {
                  return reject({
                    isConfirm: false,
                    message: `Erreur lors de la mise à jour du stock: ${errUpdate.message}`,
                  });
                }

                resolve({
                  isConfirm: true,
                  message: 'Stock mis à jour avec succès',
                });
              }
            );
          } else {
            // Insérer un nouveau stock
            this.mysqlConnector.query(
              queries.INSERT_STOCK,
              [data.article_id, data.taille_id, data.quantite],
              (errInsert) => {
                if (errInsert) {
                  return reject({
                    isConfirm: false,
                    message: `Erreur lors de l'ajout du stock: ${errInsert.message}`,
                  });
                }

                resolve({
                  isConfirm: true,
                  message: 'Stock ajouté avec succès',
                });
              }
            );
          }
        }
      );
    });
  }

  /**
   * Mettre à jour la quantité d'un stock
   */
  async updateStock(data: UpdateStockData): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_STOCK_QUANTITY,
        [data.quantite, data.article_id, data.taille_id],
        (error) => {
          if (error) {
            return reject({
              isConfirm: false,
              message: `Erreur lors de la mise à jour du stock: ${error.message}`,
            });
          }

          resolve({
            isConfirm: true,
            message: 'Stock mis à jour avec succès',
          });
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE CRÉATION DE COMMANDES
  // ==========================================================================

  /**
   * Créer une nouvelle commande
   */
  async createCommande(data: CreateCommandeData): Promise<ConfirmationResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const dateCommande = data.date || new Date().toISOString().slice(0, 19).replace('T', ' ');
        const statut = data.statut || 'en_attente';

        // Obtenir la map des tailles
        const tailleMap = await this.getTailleMap();

        // Insérer la commande
        this.mysqlConnector.query(
          queries.INSERT_COMMANDE,
          [data.utilisateur_id, dateCommande, statut, data.total],
          async (error, results) => {
            if (error) {
              return reject({
                isConfirm: false,
                message: `Erreur lors de la création de la commande: ${error.message}`,
              });
            }

            const commandeId = results.insertId;

            try {
              // Préparer les articles de la commande
              const articleValues = data.articles.map((article) => {
                const tailleId = getTailleIdFromMap(tailleMap, article.taille);
                if (!tailleId) {
                  throw new Error(`Taille inconnue: ${article.taille}`);
                }
                return [
                  commandeId,
                  article.article_id,
                  tailleId,
                  article.quantite,
                  article.prix,
                ];
              });

              // Insérer les articles de la commande
              await new Promise<void>((resolveArticles, rejectArticles) => {
                this.mysqlConnector.query(
                  queries.INSERT_ARTICLES_COMMANDE_BATCH,
                  [articleValues],
                  (errArticles) => {
                    if (errArticles) rejectArticles(errArticles);
                    else resolveArticles();
                  }
                );
              });

              // Décrémenter les stocks
              for (const article of data.articles) {
                const tailleId = getTailleIdFromMap(tailleMap, article.taille);
                if (tailleId) {
                  await new Promise<void>((resolveStock, rejectStock) => {
                    this.mysqlConnector.query(
                      queries.DECREMENT_STOCK_QUANTITY,
                      [article.quantite, article.article_id, tailleId, article.quantite],
                      (errStock) => {
                        if (errStock) rejectStock(errStock);
                        else resolveStock();
                      }
                    );
                  });
                }
              }

              resolve({
                isConfirm: true,
                message: 'Commande créée avec succès',
                data: { id: commandeId },
              });
            } catch (err: any) {
              reject({
                isConfirm: false,
                message: `Erreur lors de l'ajout des articles à la commande: ${err.message}`,
              });
            }
          }
        );
      } catch (err: any) {
        reject({
          isConfirm: false,
          message: `Erreur inattendue: ${err.message}`,
        });
      }
    });
  }

  // ==========================================================================
  // MÉTHODES DE MISE À JOUR DE COMMANDES
  // ==========================================================================

  /**
   * Mettre à jour le statut d'une commande
   */
  async updateCommandeStatut(
    commandeId: number,
    statut: string
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COMMANDE_STATUT,
        [statut, commandeId],
        (error) => {
          if (error) {
            return reject({
              isConfirm: false,
              message: `Erreur lors de la mise à jour du statut: ${error.message}`,
            });
          }

          resolve({
            isConfirm: true,
            message: 'Statut de la commande mis à jour avec succès',
          });
        }
      );
    });
  }

  /**
   * Annuler une commande
   */
  async cancelCommande(commandeId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CANCEL_COMMANDE,
        [commandeId],
        (error) => {
          if (error) {
            return reject({
              isConfirm: false,
              message: `Erreur lors de l'annulation de la commande: ${error.message}`,
            });
          }

          resolve({
            isConfirm: true,
            message: 'Commande annulée avec succès',
          });
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION
  // ==========================================================================

  /**
   * Vérifier si un article existe
   */
  async articleExists(articleId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_ARTICLE_EXISTS,
        [articleId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si une catégorie existe
   */
  async categorieExists(categorieId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_CATEGORIE_EXISTS,
        [categorieId],
        (error, results) => {
          if (error) {
            reject(error);
          } else {
            resolve((results[0]?.count || 0) > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si la quantité en stock est suffisante
   */
  async checkStockSufficient(
    articleId: number,
    tailleId: number,
    quantiteDemandee: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_STOCK_SUFFICIENT,
        [articleId, tailleId],
        (error, results) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(false);
          } else {
            const quantiteDisponible = results[0]?.quantite || 0;
            resolve(quantiteDisponible >= quantiteDemandee);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES STATISTIQUES
  // ==========================================================================

  /**
   * Obtenir les statistiques du magasin
   */
  async getStats(): Promise<MagasinStats> {
    return new Promise(async (resolve, reject) => {
      try {
        // Total articles
        const totalArticles = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(queries.COUNT_TOTAL_ARTICLES, [], (err, results) => {
            if (err) rej(err);
            else res(results[0]?.total || 0);
          });
        });

        // Total commandes
        const totalCommandes = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(queries.COUNT_TOTAL_COMMANDES, [], (err, results) => {
            if (err) rej(err);
            else res(results[0]?.total || 0);
          });
        });

        // Total revenu
        const totalRevenu = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(queries.SUM_TOTAL_REVENUE, [], (err, results) => {
            if (err) rej(err);
            else res(results[0]?.total_revenue || 0);
          });
        });

        // Articles en rupture
        const articlesEnRupture = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(
            queries.COUNT_OUT_OF_STOCK_ARTICLES,
            [],
            (err, results) => {
              if (err) rej(err);
              else res(results[0]?.total || 0);
            }
          );
        });

        // Commandes en attente
        const commandesEnAttente = await new Promise<number>((res, rej) => {
          this.mysqlConnector.query(
            queries.COUNT_PENDING_COMMANDES,
            [],
            (err, results) => {
              if (err) rej(err);
              else res(results[0]?.total || 0);
            }
          );
        });

        resolve({
          totalArticles,
          totalCommandes,
          totalRevenu,
          articlesEnRupture,
          commandesEnAttente,
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

// ==========================================================================
// SINGLETON INSTANCE
// ==========================================================================

let repositoryInstance: MagasinRepository | null = null;

/**
 * Obtenir l'instance singleton du repository
 */
export function getMagasinRepository(): MagasinRepository {
  if (!repositoryInstance) {
    repositoryInstance = new MagasinRepository();
  }
  return repositoryInstance;
}
