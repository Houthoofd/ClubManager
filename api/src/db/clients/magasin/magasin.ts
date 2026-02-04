import {
  ArticleData,
  ConfirmationResult,
  NouvelleCommande,
  ArticleCommande,
  ArticlesParCategorie,
  ArticleCreationData,
} from "@clubmanager/types";
import MysqlConnector from "../../connector/mysqlconnector.js";

export class Magasin {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  obtenirLesArticles(): Promise<any[]> {
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
          console.error(
            "Erreur lors de la récupération des articles : " + error.message,
          );
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
                nom: row.categorie_nom,
              },
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
              quantite: row.stock_quantite,
            });
          }
        }

        resolve(Array.from(articlesMap.values()));
      });
    });
  }

  obtenirArticlesParCategories(): Promise<ArticlesParCategorie> {
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
          console.error(
            "Erreur lors de la récupération des articles par catégories : " +
              error.message,
          );
          return reject(error);
        }

        const mapCategories: ArticlesParCategorie = {};

        for (const row of results) {
          if (!mapCategories[row.categorie_nom]) {
            mapCategories[row.categorie_nom] = [];
          }

          let articles = mapCategories[row.categorie_nom];
          let article = articles.find((a) => a.id === row.id);

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
              quantite: row.stock_quantite,
            });
          }
        }

        resolve(mapCategories);
      });
    });
  }

  obtenirLesCategories(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM categories`;

      console.log(
        "Exécution de la requête pour obtenir les categories existantes",
      );

      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error(
            "Erreur lors de la récupération des categories : " + error.message,
          );
          reject(error);
        } else {
          console.log("Articles récupérés avec succès :", results);
          resolve(results);
        }
      });
    });
  }

  async getTailleMap(): Promise<Record<string, number>> {
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
      this.mysqlConnector.query(
        articleSql,
        articleValues,
        async (err, results) => {
          if (err) {
            return reject({
              isConfirm: false,
              message: "Erreur article: " + err.message,
            });
          }

          const articleId = results.insertId;

          // Fonction pour continuer avec les stocks
          const continueWithStocks = async () => {
            try {
              // Si pas de stocks, résoudre directement
              if (!data.stocks || data.stocks.length === 0) {
                return resolve({
                  isConfirm: true,
                  message: "Article et images ajoutés avec succès",
                  id: articleId,
                });
              }

              // Récupération de la map des tailles
              const tailleMap = await this.getTailleMap();

              const stockSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES ?`;

              const stockValues = data.stocks.map(
                ({ taille, quantite }: any) => {
                  const tailleId = tailleMap[taille];
                  if (!tailleId) throw new Error(`Taille inconnue : ${taille}`);
                  return [articleId, tailleId, quantite];
                },
              );

              this.mysqlConnector.query(stockSql, [stockValues], (errStock) => {
                if (errStock) {
                  return reject({
                    isConfirm: false,
                    message: "Erreur stock: " + errStock.message,
                  });
                }

                resolve({
                  isConfirm: true,
                  message: "Article, images et stocks ajoutés avec succès",
                  id: articleId,
                });
              });
            } catch (errStockMap) {
              return reject({
                isConfirm: false,
                message: "Erreur taille/stock : " + Error,
              });
            }
          };

          // Insertion des images seulement s'il y en a
          if (data.images && data.images.length > 0) {
            const imageSql = `INSERT INTO images (article_id, url) VALUES ?`;
            const imageValues = data.images.map((url: any) => [articleId, url]);

            this.mysqlConnector.query(
              imageSql,
              [imageValues],
              async (errImg) => {
                if (errImg) {
                  return reject({
                    isConfirm: false,
                    message: "Erreur image: " + errImg.message,
                  });
                }
                await continueWithStocks();
              },
            );
          } else {
            // Pas d'images, continuer directement avec les stocks
            await continueWithStocks();
          }
        },
      );
    });
  }

  obtenirLeStock(): Promise<any[]> {
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
          console.error(
            "Erreur lors de la récupération du stock : " + error.message,
          );
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  ajouterStock(
    articleId: number,
    tailleId: number,
    quantite: number,
  ): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      // Vérifie si une ligne existe déjà pour cet article + taille
      const checkSql = `SELECT id, quantite FROM stocks WHERE article_id = ? AND taille_id = ?`;

      this.mysqlConnector.query(
        checkSql,
        [articleId, tailleId],
        (error, results) => {
          if (error) {
            console.error(
              "Erreur lors de la vérification du stock : ",
              error.message,
            );
            reject({
              isConfirm: false,
              message: "Erreur lors de l'ajout du stock",
            });
            return;
          }

          if (results.length > 0) {
            // Mise à jour de la quantité existante
            const updateSql = `UPDATE stocks SET quantite = quantite + ? WHERE article_id = ? AND taille_id = ?`;
            this.mysqlConnector.query(
              updateSql,
              [quantite, articleId, tailleId],
              (err) => {
                if (err) {
                  reject({
                    isConfirm: false,
                    message: "Erreur lors de la mise à jour du stock",
                  });
                } else {
                  resolve({
                    isConfirm: true,
                    message: "Stock mis à jour avec succès",
                  });
                }
              },
            );
          } else {
            // Insertion d'une nouvelle ligne de stock
            const insertSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES (?, ?, ?)`;
            this.mysqlConnector.query(
              insertSql,
              [articleId, tailleId, quantite],
              (err) => {
                if (err) {
                  reject({
                    isConfirm: false,
                    message: "Erreur lors de l'ajout du stock",
                  });
                } else {
                  resolve({
                    isConfirm: true,
                    message: "Stock ajouté avec succès",
                  });
                }
              },
            );
          }
        },
      );
    });
  }

  obtenirLesCommandes(): Promise<any[]> {
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
              prix,
            } = row;

            if (!commandesMap[commande_id]) {
              commandesMap[commande_id] = {
                commande_id,
                date_commande,
                statut,
                client,
                articles: [],
              };
            }

            commandesMap[commande_id].articles.push({
              article,
              taille,
              quantite,
              prix,
            });
          });

          const commandes = Object.values(commandesMap);
          resolve(commandes);
        }
      });
    });
  }

  // CORRIGÉ: Une seule implémentation d'ajouterCommande avec gestion complète et types corrects
  async ajouterCommande(
    data: NouvelleCommande,
  ): Promise<ConfirmationResult & { id?: number; insertId?: number }> {
    console.log("📦 [Magasin] ajouterCommande appelée avec:", data);

    // CRITIQUE: Valider les données reçues
    const { utilisateur_id, articles, total, date, statut } = data;

    console.log("🔍 [Magasin] Données extraites pour ajouterCommande:", {
      utilisateur_id,
      articles_count: articles?.length || 0,
      articles_sample: articles?.[0],
      total,
      date,
      statut,
    });

    // AJOUTÉ: Validation finale des articles avant insertion
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      console.error(
        "❌ [Magasin] Articles invalides dans ajouterCommande:",
        articles,
      );
      return {
        isConfirm: false,
        message: "Articles invalides ou manquants",
      };
    }

    // CORRIGÉ: Vérifier que tous les taille_id sont présents et valides en gérant les types corrects
    const articlesAvecTailleIdInvalide = articles.filter((article: any) => {
      // L'article peut avoir soit taille_id (number) soit taille (string)
      const hasTailleId =
        article.taille_id &&
        !isNaN(parseInt(String(article.taille_id))) &&
        parseInt(String(article.taille_id)) > 0;
      const hasTaille =
        article.taille && String(article.taille).trim().length > 0;

      return !hasTailleId && !hasTaille;
    });

    if (articlesAvecTailleIdInvalide.length > 0) {
      console.error(
        "❌ [Magasin] STOP: Articles sans taille_id ni taille détectés:",
        articlesAvecTailleIdInvalide,
      );
      return {
        isConfirm: false,
        message: `${articlesAvecTailleIdInvalide.length} article(s) n'ont ni taille_id ni taille valides`,
      };
    }

    console.log(
      "✅ [Magasin] Tous les articles ont des informations de taille valides, procédure de création...",
    );

    try {
      // Récupérer la map tailleNom -> tailleId si nécessaire
      const tailleMap = await this.getTailleMap();

      return new Promise((resolve, reject) => {
        this.mysqlConnector.beginTransaction((err, connection) => {
          if (err || !connection) {
            return resolve({
              isConfirm: false,
              message:
                "Erreur transaction: " +
                (err?.message || "Connection undefined"),
            });
          }

          // 1. Insertion commande principale
          const sqlInsertCommande = `INSERT INTO commandes (utilisateur_id, total, date_commande, statut, created_at) VALUES (?, ?, ?, ?, NOW())`;

          this.mysqlConnector.query(
            sqlInsertCommande,
            [utilisateur_id, total || 0, date, statut || "en_attente"],
            (errCommande, resCommande) => {
              if (errCommande) {
                this.mysqlConnector.rollback(connection);
                console.error(
                  "❌ [Magasin] Erreur insertion commande:",
                  errCommande,
                );
                return resolve({
                  isConfirm: false,
                  message: "Erreur commande: " + errCommande.message,
                });
              }

              const commandeId = resCommande.insertId;
              console.log("✅ [Magasin] Commande créée, ID:", commandeId);

              // 2. CORRIGÉ: Préparer les articles avec gestion correcte des types
              console.log(
                "📝 [Magasin] Préparation des articles pour insertion...",
              );

              try {
                const valeursArticles = articles.map(
                  (article: any, index: number) => {
                    // CORRIGÉ: Convertir et valider CHAQUE champ individuellement avec les bons types
                    const article_id = parseInt(String(article.article_id));
                    let taille_id: number;

                    // Si l'article a déjà un taille_id, l'utiliser
                    if (article.taille_id) {
                      taille_id = parseInt(String(article.taille_id));
                    }
                    // Sinon, essayer de le résoudre via le nom de taille
                    else if (article.taille) {
                      const tailleString = String(article.taille);
                      taille_id = tailleMap[tailleString];
                      if (!taille_id) {
                        throw new Error(
                          `Article ${index}: Taille "${tailleString}" inconnue dans la base de données`,
                        );
                      }
                    } else {
                      throw new Error(
                        `Article ${index}: Ni taille_id ni taille fournis`,
                      );
                    }

                    const quantite = parseInt(String(article.quantite)) || 1;
                    const prix = parseFloat(String(article.prix));

                    console.log(`📝 [Magasin] Article ${index} conversion:`, {
                      original: {
                        article_id: article.article_id,
                        taille_id: article.taille_id,
                        taille: article.taille,
                        quantite: article.quantite,
                        prix: article.prix,
                      },
                      converted: { article_id, taille_id, quantite, prix },
                      types: {
                        article_id: typeof article_id,
                        taille_id: typeof taille_id,
                        quantite: typeof quantite,
                        prix: typeof prix,
                      },
                    });

                    // CRITIQUE: Vérification finale avec validation stricte
                    if (!article_id || isNaN(article_id) || article_id <= 0) {
                      throw new Error(
                        `Article ${index}: article_id invalide après conversion (${article_id})`,
                      );
                    }
                    if (!taille_id || isNaN(taille_id) || taille_id <= 0) {
                      throw new Error(
                        `Article ${index}: taille_id invalide après conversion (${taille_id})`,
                      );
                    }
                    if (!quantite || isNaN(quantite) || quantite <= 0) {
                      throw new Error(
                        `Article ${index}: quantite invalide après conversion (${quantite})`,
                      );
                    }
                    if (isNaN(prix) || prix < 0) {
                      throw new Error(
                        `Article ${index}: prix invalide après conversion (${prix})`,
                      );
                    }

                    return [commandeId, article_id, taille_id, quantite, prix];
                  },
                );

                console.log(
                  "📊 [Magasin] Articles préparés avec types validés:",
                  {
                    count: valeursArticles.length,
                    sample: valeursArticles[0],
                    all_taille_ids: valeursArticles.map((v) => v[2]), // Index 2 = taille_id
                  },
                );

                // 3. Insertion des articles
                const sqlInsertArticles = `
                  INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix)
                  VALUES ?
                `;

                this.mysqlConnector.query(
                  sqlInsertArticles,
                  [valeursArticles],
                  (errArticles) => {
                    if (errArticles) {
                      this.mysqlConnector.rollback(connection);
                      console.error(
                        "❌ [Magasin] Erreur insertion articles:",
                        errArticles,
                      );
                      console.error(
                        "❌ [Magasin] Valeurs problématiques:",
                        valeursArticles,
                      );

                      return resolve({
                        isConfirm: false,
                        message: "Erreur articles: " + errArticles.message,
                      });
                    }

                    // 4. Commit transaction
                    this.mysqlConnector.commit(connection, (errCommit) => {
                      if (errCommit) {
                        this.mysqlConnector.rollback(connection);
                        return resolve({
                          isConfirm: false,
                          message: "Erreur commit: " + errCommit.message,
                        });
                      }

                      console.log(
                        "✅ [Magasin] Transaction réussie - Commande et articles créés",
                      );

                      // CORRIGÉ: Retourner le résultat avec l'ID
                      resolve({
                        isConfirm: true,
                        message: "Commande créée avec succès",
                        id: commandeId,
                        insertId: commandeId,
                      });
                    });
                  },
                );
              } catch (preparationError: any) {
                this.mysqlConnector.rollback(connection);
                console.error(
                  "❌ [Magasin] Erreur préparation articles:",
                  preparationError,
                );
                resolve({
                  isConfirm: false,
                  message: `Erreur préparation: ${preparationError.message}`,
                });
              }
            },
          );
        });
      });
    } catch (error: any) {
      console.error("❌ [Magasin] Erreur générale ajouterCommande:", error);
      return {
        isConfirm: false,
        message: `Erreur ajouterCommande: ${error.message}`,
      };
    }
  }

  supprimerArticle(articleId: number): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM articles WHERE id = ?`;

      this.mysqlConnector.query(sql, [articleId], (error, result) => {
        if (error) {
          reject({
            isConfirm: false,
            message: "Erreur lors de la suppression de l'article",
          });
        } else {
          resolve({ isConfirm: true, message: "Article supprimé avec succès" });
        }
      });
    });
  }

  modifierArticle(id: number, data: ArticleData): Promise<ConfirmationResult> {
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
        id,
      ];

      this.mysqlConnector.query(sql, values, async (error, result) => {
        if (error) {
          return reject({
            isConfirm: false,
            message: "Erreur lors de la mise à jour de l'article",
          });
        }

        const deleteImagesSql = `DELETE FROM images WHERE article_id = ?`;
        this.mysqlConnector.query(deleteImagesSql, [id], (deleteError) => {
          if (deleteError) {
            return reject({
              isConfirm: false,
              message: "Erreur lors de la suppression des anciennes images",
            });
          }

          const deleteStocksSql = `DELETE FROM stocks WHERE article_id = ?`;
          this.mysqlConnector.query(
            deleteStocksSql,
            [id],
            async (deleteStockError) => {
              if (deleteStockError) {
                return reject({
                  isConfirm: false,
                  message: "Erreur lors de la suppression des anciens stocks",
                });
              }

              try {
                // Ajouter les nouvelles images
                if (data.images && data.images.length > 0) {
                  const insertImagesSql = `INSERT INTO images (article_id, url) VALUES ?`;
                  const imageValues = data.images.map((url: string) => [
                    id,
                    url,
                  ]);

                  await new Promise<void>((resolveImg, rejectImg) => {
                    this.mysqlConnector.query(
                      insertImagesSql,
                      [imageValues],
                      (insertError) => {
                        if (insertError) rejectImg(insertError);
                        else resolveImg();
                      },
                    );
                  });
                }

                // Ajouter les nouveaux stocks
                if (data.stocks && data.stocks.length > 0) {
                  const tailleMap = await this.getTailleMap();
                  const stockValues = data.stocks.map((stock: any) => [
                    id,
                    tailleMap[stock.taille] || null,
                    stock.quantite,
                  ]);

                  const insertStocksSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES ?`;
                  await new Promise<void>((resolveStock, rejectStock) => {
                    this.mysqlConnector.query(
                      insertStocksSql,
                      [stockValues],
                      (insertStockError) => {
                        if (insertStockError) rejectStock(insertStockError);
                        else resolveStock();
                      },
                    );
                  });
                }

                resolve({
                  isConfirm: true,
                  message: "Article, images et stocks mis à jour avec succès",
                });
              } catch (err: any) {
                reject({
                  isConfirm: false,
                  message:
                    "Erreur lors de l'insertion des images ou stocks : " +
                    err.message,
                });
              }
            },
          );
        });
      });
    });
  }

  async modifierStock(
    articleId: number,
    tailleId: number,
    quantite: number,
  ): Promise<ConfirmationResult> {
    const sql = `
      UPDATE stocks
      SET quantite = ?
      WHERE article_id = ? AND taille_id = ?
    `;

    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        sql,
        [quantite, articleId, tailleId],
        (error, result: any) => {
          if (error) {
            reject({
              isConfirm: false,
              message: `Erreur lors de la modification du stock : ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message:
                "Aucune ligne modifiée : l'article ou la taille est introuvable",
            });
          } else {
            resolve({
              isConfirm: true,
              message: "Stock mis à jour avec succès",
            });
          }
        },
      );
    });
  }

  async obtenirLesTailles(): Promise<{ id: number; nom: string }[]> {
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

  // CORRIGÉ: Méthode creerCommande avec validation des types
  creerCommande(
    utilisateur_id: number,
    articles: any[],
    total: number,
    date: string,
    statut: string,
  ): Promise<ConfirmationResult & { id?: number; insertId?: number }> {
    return new Promise(async (resolve, reject) => {
      console.log(
        "📦 [Magasin] creerCommande appelée - délégation vers ajouterCommande",
      );

      // AJOUTÉ: Validation critique des articles et taille_id AVANT traitement
      console.log(
        "🔍 [Magasin] Validation CRITIQUE des articles avec taille_id...",
      );

      if (!articles || !Array.isArray(articles) || articles.length === 0) {
        console.error(
          "❌ [Magasin] Articles manquants ou invalides:",
          articles,
        );
        return resolve({
          isConfirm: false,
          message: "Articles manquants ou invalides pour la commande",
        });
      }

      // CRITIQUE: Vérifier chaque article individuellement avec gestion des types
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        console.log(`🔍 [Magasin] Validation article ${i}:`, article);

        // CORRIGÉ: Validation de article_id avec conversion de type
        const articleIdNum = parseInt(String(article.article_id));
        if (!article.article_id || isNaN(articleIdNum) || articleIdNum <= 0) {
          console.error(
            `❌ [Magasin] Article ${i}: article_id invalide:`,
            article.article_id,
          );
          return resolve({
            isConfirm: false,
            message: `Article ${i}: ID article invalide (${article.article_id})`,
          });
        }

        // CRITIQUE: Vérification stricte du taille_id OU taille avec conversion de type
        let tailleIdValide = false;
        if (article.taille_id) {
          const tailleIdNum = parseInt(String(article.taille_id));
          tailleIdValide = !isNaN(tailleIdNum) && tailleIdNum > 0;
        } else if (article.taille) {
          const tailleString = String(article.taille).trim();
          tailleIdValide = tailleString.length > 0;
        }

        if (!tailleIdValide) {
          console.error(
            `❌ [Magasin] Article ${i}: taille_id INVALIDE ou MANQUANT:`,
            {
              taille_id_original: article.taille_id,
              taille_original: article.taille,
              type_taille_id: typeof article.taille_id,
              type_taille: typeof article.taille,
            },
          );
          return resolve({
            isConfirm: false,
            message: `Article ${i}: taille_id et taille manquants ou invalides. Vérifiez la sélection de taille.`,
          });
        }

        // CORRIGÉ: Validation de quantite avec conversion de type
        const quantiteNum = parseInt(String(article.quantite));
        if (!article.quantite || isNaN(quantiteNum) || quantiteNum <= 0) {
          console.error(
            `❌ [Magasin] Article ${i}: quantite invalide:`,
            article.quantite,
          );
          return resolve({
            isConfirm: false,
            message: `Article ${i}: Quantité invalide (${article.quantite})`,
          });
        }

        // CORRIGÉ: Validation de prix avec conversion de type
        const prixNum = parseFloat(String(article.prix));
        if (!article.prix || isNaN(prixNum) || prixNum < 0) {
          console.error(
            `❌ [Magasin] Article ${i}: prix invalide:`,
            article.prix,
          );
          return resolve({
            isConfirm: false,
            message: `Article ${i}: Prix invalide (${article.prix})`,
          });
        }
      }

      console.log(
        "✅ [Magasin] Tous les articles ont passé la validation critique",
      );

      try {
        // Déléguer à ajouterCommande avec la structure correcte
        const commandeResult = await this.ajouterCommande({
          utilisateur_id,
          articles,
          total,
          date,
          statut,
        });

        console.log("📦 [Magasin] Résultat ajouterCommande:", commandeResult);
        resolve(commandeResult);
      } catch (error: any) {
        console.error("❌ [Magasin] Erreur dans creerCommande:", error);
        resolve({
          isConfirm: false,
          message: `Erreur création commande: ${error.message}`,
        });
      }
    });
  }
}
