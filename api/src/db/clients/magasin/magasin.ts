import { ArticleData, ConfirmationResult, NouvelleCommande, ArticleCommande, ArticlesParCategorie, ArticleCreationData } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';

export class Magasin {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  obtenirLesArticles(): Promise<any[]> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirLesArticles");
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.*, 
          i.url AS image_url,
          t.nom AS stock_taille,
          s.quantite AS stock_quantite,
          c.id AS categorie_id,
          c.nom AS categorie_nom
        FROM articles a
        LEFT JOIN images i ON i.article_id = a.id
        LEFT JOIN stocks s ON s.article_id = a.id
        LEFT JOIN tailles t ON t.id = s.taille_id
        LEFT JOIN categories c ON c.id = a.categorie_id
      `;

      console.log("Exécution de la requête avec LEFT JOIN");

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des articles : ' + error.message);
          return reject(error);
        }

        const articlesMap = new Map<number, any>();

        for (const row of results) {
          if (!articlesMap.has(row.id)) {
            articlesMap.set(row.id, {
              id: row.id,
              nom: row.nom,
              prix: row.prix,
              description: row.description,
              images: [],
              stocks: [],
              categorie: {
                id: row.categorie_id,
                nom: row.categorie_nom
              }
            });
          }

          const article = articlesMap.get(row.id);
          
          // Ajouter image si elle existe
          if (row.image_url && !article.images.includes(row.image_url)) {
            article.images.push(row.image_url);
          }
          
          // Ajouter stock si il existe
          if (row.stock_taille && row.stock_quantite) {
            article.stocks.push({
              taille: row.stock_taille,
              quantite: row.stock_quantite
            });
          }
        }

        resolve(Array.from(articlesMap.values()));
      });
    });
  }

  obtenirArticlesParCategories(): Promise<ArticlesParCategorie> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirArticlesParCategories");
      return Promise.resolve({});
    }

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.*, 
          a.categorie_id,
          i.url AS image_url,
          t.nom AS stock_taille,
          s.quantite AS stock_quantite,
          c.nom AS categorie_nom
        FROM articles a
        LEFT JOIN images i ON i.article_id = a.id
        LEFT JOIN stocks s ON s.article_id = a.id
        LEFT JOIN tailles t ON t.id = s.taille_id
        LEFT JOIN categories c ON c.id = a.categorie_id
        ORDER BY c.nom, a.id
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des articles par catégories : ' + error.message);
          return reject(error);
        }

        const mapCategories: ArticlesParCategorie = {};

        for (const row of results) {
          if (!mapCategories[row.categorie_nom]) {
            mapCategories[row.categorie_nom] = [];
          }

          let articles = mapCategories[row.categorie_nom];
          let article = articles.find(a => a.id === row.id);

          if (!article) {
            article = {
              id: row.id,
              nom: row.nom,
              prix: row.prix,
              description: row.description,
              images: [],
              stocks: [],
              categorie_id: row.categorie_id, // bien récupéré dans la requête
            };
            articles.push(article);
          }


          if (row.image_url && !article.images.includes(row.image_url)) {
            article.images.push(row.image_url);
          }

          if (row.stock_taille && row.stock_quantite !== null) {
            article.stocks.push({
              taille: row.stock_taille,
              quantite: row.stock_quantite
            });
          }
        }

        resolve(mapCategories);
      });
    });
  }

  obtenirLesCategories(): Promise<any[]> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirLesCategories");
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM categories`;
  
      console.log("Exécution de la requête pour obtenir les categories existantes");
  
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des categories : ' + error.message);
          reject(error);
        } else {
          console.log('Articles récupérés avec succès :', results);
          resolve(results);
        }
      });
    });
  }

  async getTailleMap(): Promise<Record<string, number>> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour getTailleMap");
      return {};
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT id, nom FROM tailles`;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) return reject(error);

        const map: Record<string, number> = {};
        for (const row of results) {
          map[row.nom] = row.id;
        }
        resolve(map);
      });
    });
  }

  async ajouterArticle(data: ArticleCreationData): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour ajouterArticle");
      return { isConfirm: false, message: "Service temporairement indisponible - Pool fermé" };
    }

    const articleSql = `
      INSERT INTO articles (nom, description, prix, categorie_id)
      VALUES (?, ?, ?, ?)
    `;

    const articleValues = [
      data.nom,
      data.description,
      data.prix,
      data.categorie_id,
    ];

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(articleSql, articleValues, async (err, results) => {
        if (err) {
          return reject({ isConfirm: false, message: 'Erreur article: ' + err.message });
        }

        const articleId = results.insertId;

        // Fonction pour continuer avec les stocks
        const continueWithStocks = async () => {
          try {
            // Récupération de la map des tailles
            const tailleMap = await this.getTailleMap();

            const stockSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES ?`;

            const stockValues = (data.stocks || []).map(({ taille, quantite }) => {
              const tailleId = tailleMap[taille];
              if (!tailleId) throw new Error(`Taille inconnue : ${taille}`);
              return [articleId, tailleId, quantite];
            });

            this.mysqlConnector.query(stockSql, [stockValues], (errStock) => {
              if (errStock) {
                return reject({ isConfirm: false, message: 'Erreur stock: ' + errStock.message });
              }

              resolve({
                isConfirm: true,
                message: 'Article, images et stocks ajoutés avec succès',
              });
            });

          } catch (errStockMap) {
            return reject({ isConfirm: false, message: 'Erreur taille/stock : ' + Error });
          }
        };

        // Insertion des images seulement s'il y en a
        if (data.images && data.images.length > 0) {
          const imageSql = `INSERT INTO images (article_id, url) VALUES ?`;
          const imageValues = data.images.map((url) => [articleId, url]);

          this.mysqlConnector.query(imageSql, [imageValues], async (errImg) => {
            if (errImg) {
              return reject({ isConfirm: false, message: 'Erreur image: ' + errImg.message });
            }
            await continueWithStocks();
          });
        } else {
          // Pas d'images, continuer directement avec les stocks
          await continueWithStocks();
        }
      });
    });
  }

  obtenirLeStock(): Promise<any[]> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirLeStock");
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          a.id AS article_id,
          a.nom AS article,
          t.nom AS taille,
          s.quantite
        FROM stocks s
        JOIN articles a ON s.article_id = a.id
        JOIN tailles t ON s.taille_id = t.id
        ORDER BY a.nom, t.nom
      `;

      console.log("Exécution de la requête pour obtenir le stock");

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération du stock : ' + error.message);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  ajouterStock(articleId: number, tailleId: number, quantite: number): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour ajouterStock");
      return Promise.resolve({
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      });
    }

    return new Promise((resolve, reject) => {
      // Vérifie si une ligne existe déjà pour cet article + taille
      const checkSql = `SELECT id, quantite FROM stocks WHERE article_id = ? AND taille_id = ?`;

      this.mysqlConnector.query(checkSql, [articleId, tailleId], (error, results) => {
        if (error) {
          console.error("Erreur lors de la vérification du stock : ", error.message);
          reject({ isConfirm: false, message: "Erreur lors de l'ajout du stock" });
          return;
        }

        if (results.length > 0) {
          // Mise à jour de la quantité existante
          const updateSql = `UPDATE stocks SET quantite = quantite + ? WHERE article_id = ? AND taille_id = ?`;
          this.mysqlConnector.query(updateSql, [quantite, articleId, tailleId], (err) => {
            if (err) {
              reject({ isConfirm: false, message: "Erreur lors de la mise à jour du stock" });
            } else {
              resolve({ isConfirm: true, message: "Stock mis à jour avec succès" });
            }
          });
        } else {
          // Insertion d'une nouvelle ligne de stock
          const insertSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES (?, ?, ?)`;
          this.mysqlConnector.query(insertSql, [articleId, tailleId, quantite], (err) => {
            if (err) {
              reject({ isConfirm: false, message: "Erreur lors de l'ajout du stock" });
            } else {
              resolve({ isConfirm: true, message: "Stock ajouté avec succès" });
            }
          });
        }
      });
    });
  }

  obtenirLesCommandes(): Promise<any[]> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirLesCommandes");
      return Promise.resolve([]);
    }

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.id AS commande_id,
          c.date_commande,
          c.statut,
          u.nom_utilisateur AS client,
          a.nom AS article,
          t.nom AS taille,
          ca.quantite,
          ca.prix
        FROM commandes c
        JOIN utilisateurs u ON c.utilisateur_id = u.id
        JOIN commande_articles ca ON c.id = ca.commande_id
        JOIN articles a ON ca.article_id = a.id
        JOIN tailles t ON ca.taille_id = t.id
        ORDER BY c.date_commande DESC
      `;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          // Regrouper les commandes
          const commandesMap: Record<number, any> = {};

          results.forEach((row: any) => {
            const {
              commande_id,
              date_commande,
              statut,
              client,
              article,
              taille,
              quantite,
              prix
            } = row;

            if (!commandesMap[commande_id]) {
              commandesMap[commande_id] = {
                commande_id,
                date_commande,
                statut,
                client,
                articles: []
              };
            }

            commandesMap[commande_id].articles.push({
              article,
              taille,
              quantite,
              prix
            });
          });

          const commandes = Object.values(commandesMap);
          resolve(commandes);
        }
      });
    });
  }

  async ajouterCommande(data: NouvelleCommande): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour ajouterCommande");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    try {
      // Récupérer la map tailleNom -> tailleId
      const tailleMap = await this.getTailleMap();

      return new Promise((resolve, reject) => {
        this.mysqlConnector.beginTransaction((err, connection) => {
          if (err || !connection) {
            return reject({ isConfirm: false, message: 'Erreur transaction: ' + (err?.message || 'Connection undefined') });
          }

          // Insertion commande
          const sqlInsertCommande = `INSERT INTO commandes (utilisateur_id, statut, date_commande) VALUES (?, ?, ?)`;
          this.mysqlConnector.query(sqlInsertCommande, [data.utilisateur_id, data.statut, data.date], (errCommande, resCommande) => {
            if (errCommande) {
              this.mysqlConnector.rollback(connection);
              return reject({ isConfirm: false, message: 'Erreur commande: ' + errCommande.message });
            }

            const commandeId = resCommande.insertId;
            console.log("commandeId:", commandeId);

            // Construire valeursArticlesFinales *après* avoir la commandeId
            const valeursArticlesFinales = data.articles.map(article => [
              commandeId,
              article.article_id,
              article.taille ? tailleMap[article.taille] || null : null,
              article.quantite || 1,
              article.prix,
            ]);

            console.log("valeursArticlesFinales:", valeursArticlesFinales);

            const sqlInsertArticles = `
              INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix)
              VALUES ?
            `;
            this.mysqlConnector.query(sqlInsertArticles, [valeursArticlesFinales], (errArticles) => {
              if (errArticles) {
                this.mysqlConnector.rollback(connection);
                return reject({ isConfirm: false, message: 'Erreur articles: ' + errArticles.message });
              }

              this.mysqlConnector.commit(connection, (errCommit) => {
                if (errCommit) {
                  this.mysqlConnector.rollback(connection);
                  return reject({ isConfirm: false, message: 'Erreur commit: ' + errCommit.message });
                }

                resolve({ isConfirm: true, message: "Commande créée avec succès, en attente de paiement" });
              });
            });
          });
        });
      });
    } catch (error) {
      console.error("Erreur dans ajouterCommande:", error);
      return { isConfirm: false, message: "Erreur lors de la création de la commande" };
    }
  }

  supprimerArticle(articleId: number): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour supprimerArticle");
      return Promise.resolve({
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      });
    }

    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM articles WHERE id = ?`;

      this.mysqlConnector.query(sql, [articleId], (error, result) => {
        if (error) {
          reject({ isConfirm: false, message: "Erreur lors de la suppression de l'article" });
        } else {
          resolve({ isConfirm: true, message: "Article supprimé avec succès" });
        }
      });
    });
  }

  modifierArticle(id: number, data: ArticleData): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour modifierArticle");
      return Promise.resolve({
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      });
    }

    return new Promise(async (resolve, reject) => {
      const sql = `
        UPDATE articles 
        SET nom = ?, description = ?, prix = ?, categorie_id = ?
        WHERE id = ?
      `;

      const values = [
        data.nom,
        data.description,
        data.prix,
        data.categorie_id,
        id
      ];

      this.mysqlConnector.query(sql, values, async (error, result) => {
        if (error) {
          return reject({ isConfirm: false, message: "Erreur lors de la mise à jour de l'article" });
        }

        const deleteImagesSql = `DELETE FROM images WHERE article_id = ?`;
        this.mysqlConnector.query(deleteImagesSql, [id], (deleteError) => {
          if (deleteError) {
            return reject({ isConfirm: false, message: "Erreur lors de la suppression des anciennes images" });
          }

          const deleteStocksSql = `DELETE FROM stocks WHERE article_id = ?`;
          this.mysqlConnector.query(deleteStocksSql, [id], async (deleteStockError) => {
            if (deleteStockError) {
              return reject({ isConfirm: false, message: "Erreur lors de la suppression des anciens stocks" });
            }

            try {
              // Ajouter les nouvelles images
              if (data.images && data.images.length > 0) {
                const insertImagesSql = `INSERT INTO images (article_id, url) VALUES ?`;
                const imageValues = data.images.map((url: string) => [id, url]);

                await new Promise<void>((resolveImg, rejectImg) => {
                  this.mysqlConnector.query(insertImagesSql, [imageValues], (insertError) => {
                    if (insertError) rejectImg(insertError);
                    else resolveImg();
                  });
                });
              }

              // Ajouter les nouveaux stocks
              if (data.stocks && data.stocks.length > 0) {
                const tailleMap = await this.getTailleMap();
                const stockValues = data.stocks.map((stock: any) => [
                  id, 
                  tailleMap[stock.taille] || null, 
                  stock.quantite
                ]);

                const insertStocksSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES ?`;
                await new Promise<void>((resolveStock, rejectStock) => {
                  this.mysqlConnector.query(insertStocksSql, [stockValues], (insertStockError) => {
                    if (insertStockError) rejectStock(insertStockError);
                    else resolveStock();
                  });
                });
              }

              resolve({
                isConfirm: true,
                message: "Article, images et stocks mis à jour avec succès"
              });
            } catch (err: any) {
              reject({ isConfirm: false, message: "Erreur lors de l'insertion des images ou stocks : " + err.message });
            }
          });
        });
      });
    });
  }

  async modifierStock(articleId: number, tailleId: number, quantite: number): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour modifierStock");
      return {
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      };
    }

    const sql = `
      UPDATE stocks 
      SET quantite = ?
      WHERE article_id = ? AND taille_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(sql, [quantite, articleId, tailleId], (error, result: any) => {
        if (error) {
          reject({
            isConfirm: false,
            message: `Erreur lors de la modification du stock : ${error.message}`
          });
        } else if (result.affectedRows === 0) {
          resolve({
            isConfirm: false,
            message: "Aucune ligne modifiée : l'article ou la taille est introuvable"
          });
        } else {
          resolve({
            isConfirm: true,
            message: "Stock mis à jour avec succès"
          });
        }
      });
    });
  }

  async obtenirLesTailles(): Promise<{ id: number; nom: string }[]> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour obtenirLesTailles");
      return [];
    }

    return new Promise((resolve, reject) => {
      const sql = `SELECT id, nom FROM tailles ORDER BY nom`;

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  // Ajouter cette méthode manquante
  creerCommande(
    utilisateur_id: number,
    articles: any[],
    total: number,
    date: string,
    statut = 'en_attente'
  ): Promise<ConfirmationResult> {
    if (!this.mysqlConnector.isPoolReady()) {
      console.error("❌ Pool MySQL non disponible pour creerCommande");
      return Promise.resolve({
        isConfirm: false,
        message: "Service temporairement indisponible - Pool fermé"
      });
    }

    const commande = { 
      utilisateur_id, 
      articles, 
      total, 
      date, 
      statut 
    };
    return this.ajouterCommande(commande);
  }
}