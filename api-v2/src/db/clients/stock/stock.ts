import MysqlConnector from '../../connector/mysqlconnector.js';

interface ArticleCommande {
  article_id: number;
  taille: string;
  quantite: number;
}

interface StockInfo {
  stock_physique: number;
  stock_reserve: number;
  stock_disponible: number;
}

interface MouvementStock {
  article_id: number;
  taille: string;
  type_mouvement: 'commande' | 'livraison' | 'annulation' | 'retour' | 'ajustement';
  quantite_avant: number;
  quantite_apres: number;
  quantite_mouvement: number;
  commande_id?: string;
  motif?: string;
}

export class StockService {
  private static mysqlConnector = MysqlConnector.getInstance();

  /**
   * Réserver du stock lors d'une commande
   */
  static async reserverStock(articles: ArticleCommande[], commandeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.beginTransaction((err, connection) => {
        if (err) {
          reject(err);
          return;
        }

        let processedCount = 0;
        const totalArticles = articles.length;

        const processNextArticle = (index: number) => {
          if (index >= totalArticles) {
            this.mysqlConnector.commit(connection!, (commitErr) => {
              if (commitErr) {
                this.mysqlConnector.rollback(connection!);
                reject(commitErr);
              } else {
                console.log(`✅ Stock réservé pour la commande ${commandeId}`);
                resolve();
              }
            });
            return;
          }

          const article = articles[index];
          const { article_id, taille, quantite } = article;

          // Vérifier le stock disponible
          const stockSql = 'SELECT stock_physique, stock_reserve, stock_disponible FROM stocks WHERE article_id = ? AND taille = ?';
          
          connection!.query(stockSql, [article_id, taille], (stockError, stockResults: any) => {
            if (stockError) {
              this.mysqlConnector.rollback(connection!);
              reject(stockError);
              return;
            }

            if (!stockResults.length) {
              this.mysqlConnector.rollback(connection!);
              reject(new Error(`Stock non trouvé pour l'article ${article_id} taille ${taille}`));
              return;
            }

            const stock = stockResults[0] as StockInfo;

            if (stock.stock_disponible < quantite) {
              this.mysqlConnector.rollback(connection!);
              reject(new Error(
                `Stock insuffisant pour l'article ${article_id} taille ${taille}. ` +
                `Disponible: ${stock.stock_disponible}, Demandé: ${quantite}`
              ));
              return;
            }

            // Réserver le stock
            const updateSql = 'UPDATE stocks SET stock_reserve = stock_reserve + ? WHERE article_id = ? AND taille = ?';
            
            connection!.query(updateSql, [quantite, article_id, taille], (updateError) => {
              if (updateError) {
                this.mysqlConnector.rollback(connection!);
                reject(updateError);
                return;
              }

              // Enregistrer le mouvement
              const mouvementSql = `
                INSERT INTO mouvements_stock 
                (article_id, taille, type_mouvement, quantite_avant, quantite_apres, quantite_mouvement, commande_id, motif)
                VALUES (?, ?, 'commande', ?, ?, ?, ?, 'Réservation stock pour commande')
              `;

              connection!.query(mouvementSql, [
                article_id,
                taille,
                stock.stock_reserve,
                stock.stock_reserve + quantite,
                quantite,
                commandeId
              ], (mouvementError) => {
                if (mouvementError) {
                  this.mysqlConnector.rollback(connection!);
                  reject(mouvementError);
                  return;
                }

                processNextArticle(index + 1);
              });
            });
          });
        };

        processNextArticle(0);
      });
    });
  }

  /**
   * Vérifier la disponibilité du stock pour une liste d'articles
   */
  static async verifierDisponibilite(articles: ArticleCommande[]): Promise<{ disponible: boolean; details: any[] }> {
    return new Promise((resolve, reject) => {
      const details: any[] = [];
      let toutDisponible = true;
      let processedCount = 0;

      if (articles.length === 0) {
        resolve({ disponible: true, details: [] });
        return;
      }

      articles.forEach((article, index) => {
        const { article_id, taille, quantite } = article;

        const sql = 'SELECT stock_disponible FROM stocks WHERE article_id = ? AND taille = ?';
        
        this.mysqlConnector.query(sql, [article_id, taille], (error, results: any) => {
          if (error) {
            reject(error);
            return;
          }

          const stockDisponible = results.length ? results[0].stock_disponible : 0;
          const estDisponible = stockDisponible >= quantite;

          if (!estDisponible) {
            toutDisponible = false;
          }

          details.push({
            article_id,
            taille,
            quantite_demandee: quantite,
            stock_disponible: stockDisponible,
            disponible: estDisponible
          });

          processedCount++;
          if (processedCount === articles.length) {
            resolve({ disponible: toutDisponible, details });
          }
        });
      });
    });
  }

  /**
   * Confirmer la livraison (décrémenter le stock physique)
   */
  static async confirmerLivraison(commandeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // D'abord récupérer les articles de la commande
      const sql = 'SELECT articles FROM commandes WHERE commande_id = ?';
      
      this.mysqlConnector.query(sql, [commandeId], (error, results: any) => {
        if (error) {
          reject(error);
          return;
        }

        if (!results.length) {
          reject(new Error(`Commande ${commandeId} non trouvée`));
          return;
        }

        let articles: ArticleCommande[];
        try {
          articles = JSON.parse(results[0].articles);
        } catch (parseError) {
          reject(new Error(`Erreur parsing articles pour commande ${commandeId}`));
          return;
        }

        this.mysqlConnector.beginTransaction((transErr, connection) => {
          if (transErr) {
            reject(transErr);
            return;
          }

          this.processLivraisonArticles(connection!, articles, commandeId, 0, resolve, reject);
        });
      });
    });
  }

  /**
   * Annuler une commande (libérer le stock réservé)
   */
  static async annulerCommande(commandeId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // D'abord récupérer les articles de la commande
      const sql = 'SELECT articles FROM commandes WHERE commande_id = ?';
      
      this.mysqlConnector.query(sql, [commandeId], (error, results: any) => {
        if (error) {
          reject(error);
          return;
        }

        if (!results.length) {
          reject(new Error(`Commande ${commandeId} non trouvée`));
          return;
        }

        let articles: ArticleCommande[];
        try {
          articles = JSON.parse(results[0].articles);
        } catch (parseError) {
          reject(new Error(`Erreur parsing articles pour commande ${commandeId}`));
          return;
        }

        this.mysqlConnector.beginTransaction((transErr, connection) => {
          if (transErr) {
            reject(transErr);
            return;
          }

          this.processAnnulationArticles(connection!, articles, commandeId, 0, resolve, reject);
        });
      });
    });
  }

  /**
   * Récupérer l'historique des mouvements de stock
   */
  static async getHistoriqueMouvements(
    article_id?: number, 
    taille?: string, 
    limit: number = 100
  ): Promise<MouvementStock[]> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT ms.*, a.nom as article_nom 
        FROM mouvements_stock ms
        JOIN articles a ON ms.article_id = a.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (article_id) {
        query += ' AND ms.article_id = ?';
        params.push(article_id);
      }

      if (taille) {
        query += ' AND ms.taille = ?';
        params.push(taille);
      }

      query += ' ORDER BY ms.created_at DESC LIMIT ?';
      params.push(limit);

      this.mysqlConnector.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir un résumé des stocks par article
   */
  static async getResumeStocks(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.id as article_id,
          a.nom as article_nom,
          s.taille,
          s.stock_physique,
          s.stock_reserve,
          s.stock_disponible,
          s.quantite as stock_total
        FROM articles a
        JOIN stocks s ON a.id = s.article_id
        WHERE a.active = 1
        ORDER BY a.nom, s.taille
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Traiter la livraison des articles (méthode privée)
   */
  private static processLivraisonArticles(
    connection: any,
    articles: ArticleCommande[],
    commandeId: string,
    index: number,
    resolve: () => void,
    reject: (error: any) => void
  ): void {
    if (index >= articles.length) {
      this.mysqlConnector.commit(connection, (commitErr) => {
        if (commitErr) {
          this.mysqlConnector.rollback(connection);
          reject(commitErr);
        } else {
          console.log(`✅ Stock décrémenté pour la livraison ${commandeId}`);
          resolve();
        }
      });
      return;
    }

    const article = articles[index];
    const { article_id, taille, quantite } = article;

    // Décrémenter le stock physique et libérer la réservation
    const updateSql = `
      UPDATE stocks 
      SET stock_physique = stock_physique - ?, 
          stock_reserve = stock_reserve - ? 
      WHERE article_id = ? AND taille = ?
    `;

    connection.query(updateSql, [quantite, quantite, article_id, taille], (updateError: any) => {
      if (updateError) {
        this.mysqlConnector.rollback(connection);
        reject(updateError);
        return;
      }

      // Enregistrer le mouvement
      const mouvementSql = `
        INSERT INTO mouvements_stock 
        (article_id, taille, type_mouvement, quantite_avant, quantite_apres, quantite_mouvement, commande_id, motif)
        VALUES (?, ?, 'livraison', ?, ?, ?, ?, 'Livraison confirmée')
      `;

      connection.query(mouvementSql, [
        article_id, 
        taille, 
        0, 
        0, 
        -quantite, 
        commandeId
      ], (mouvementError: any) => {
        if (mouvementError) {
          this.mysqlConnector.rollback(connection);
          reject(mouvementError);
          return;
        }

        this.processLivraisonArticles(connection, articles, commandeId, index + 1, resolve, reject);
      });
    });
  }

  /**
   * Traiter l'annulation des articles (méthode privée)
   */
  private static processAnnulationArticles(
    connection: any,
    articles: ArticleCommande[],
    commandeId: string,
    index: number,
    resolve: () => void,
    reject: (error: any) => void
  ): void {
    if (index >= articles.length) {
      this.mysqlConnector.commit(connection, (commitErr) => {
        if (commitErr) {
          this.mysqlConnector.rollback(connection);
          reject(commitErr);
        } else {
          console.log(`✅ Stock libéré pour l'annulation ${commandeId}`);
          resolve();
        }
      });
      return;
    }

    const article = articles[index];
    const { article_id, taille, quantite } = article;

    // Libérer la réservation
    const updateSql = 'UPDATE stocks SET stock_reserve = stock_reserve - ? WHERE article_id = ? AND taille = ?';

    connection.query(updateSql, [quantite, article_id, taille], (updateError: any) => {
      if (updateError) {
        this.mysqlConnector.rollback(connection);
        reject(updateError);
        return;
      }

      // Enregistrer le mouvement
      const mouvementSql = `
        INSERT INTO mouvements_stock 
        (article_id, taille, type_mouvement, quantite_avant, quantite_apres, quantite_mouvement, commande_id, motif)
        VALUES (?, ?, 'annulation', ?, ?, ?, ?, 'Commande annulée - stock libéré')
      `;

      connection.query(mouvementSql, [
        article_id, 
        taille, 
        0, 
        0, 
        quantite, 
        commandeId
      ], (mouvementError: any) => {
        if (mouvementError) {
          this.mysqlConnector.rollback(connection);
          reject(mouvementError);
          return;
        }

        this.processAnnulationArticles(connection, articles, commandeId, index + 1, resolve, reject);
      });
    });
  }
}
