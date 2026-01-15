/**
 * Repository pour les opérations d'écriture du Magasin
 * Responsabilité: Création, modification et suppression de données
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  CreateArticleData,
  UpdateArticleData,
  CreateCommandeData,
  AddStockData,
  UpdateStockData,
  ConfirmationResult,
  TailleMap,
} from '../types.js';
import * as queries from '../queries/index.js';
import {
  createTailleMap,
  getTailleIdFromMap,
  parseTailleRows,
} from '../utils/index.js';
import type { TailleRow } from '../types.js';

/**
 * Repository pour les opérations d'écriture
 */
export class WriteRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
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
  // MÉTHODES UTILITAIRES
  // ==========================================================================

  /**
   * Créer un mapping nom de taille -> ID
   */
  private async getTailleMap(): Promise<TailleMap> {
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
        }
      );
    });
  }
}
