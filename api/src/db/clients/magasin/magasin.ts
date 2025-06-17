import { } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';
import { ArticleData, ConfirmationResult, NouvelleCommande, ArticleCommande, ArticlesParCategorie, ArticleCreationData } from '@clubmanager/types'

export class Magasin {

  obtenirLesArticles(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const mysqlConnector = new MysqlConnector();

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

    mysqlConnector.query(sql, [], (error, results) => {
      mysqlConnector.close();

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

      const articlesAvecDetails = Array.from(articlesMap.values());
      console.log("Articles enrichis avec catégories :", articlesAvecDetails);
      resolve(articlesAvecDetails);
    });
  });
}

obtenirArticlesParCategories(): Promise<ArticlesParCategorie> {
  return new Promise((resolve, reject) => {
    const mysqlConnector = new MysqlConnector();

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

    mysqlConnector.query(sql, [], (error, results) => {
      mysqlConnector.close();

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
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT * FROM categories`;
  
      console.log("Exécution de la requête pour obtenir les categories existantes");
  
      mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des categories : ' + error.message);
          reject(error);
        } else {
          console.log('Articles récupérés avec succès :', results);
          resolve(results);
        }
  
        mysqlConnector.close();
      });
    });
  }

  async getTailleMap(): Promise<Record<string, number>> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();
      const sql = `SELECT id, nom FROM tailles`;

      mysqlConnector.query(sql, [], (error, results) => {
        mysqlConnector.close();
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
    const mysqlConnector = new MysqlConnector();

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
      mysqlConnector.query(articleSql, articleValues, async (err, results) => {
        if (err) {
          mysqlConnector.close();
          return reject({ isConfirm: false, message: 'Erreur article: ' + err.message });
        }

        const articleId = results.insertId;

        // Insertion des images
        const imageSql = `INSERT INTO images (article_id, url) VALUES ?`;
        const imageValues = (data.images || []).map((url) => [articleId, url]);

        mysqlConnector.query(imageSql, [imageValues], async (errImg) => {
          if (errImg) {
            mysqlConnector.close();
            return reject({ isConfirm: false, message: 'Erreur image: ' + errImg.message });
          }

          try {
            // Récupération de la map des tailles
            const tailleMap = await this.getTailleMap();

            const stockSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES ?`;

            const stockValues = (data.stocks || []).map(({ taille, quantite }) => {
              const tailleId = tailleMap[taille];
              if (!tailleId) throw new Error(`Taille inconnue : ${taille}`);
              return [articleId, tailleId, quantite];
            });

            mysqlConnector.query(stockSql, [stockValues], (errStock) => {
              mysqlConnector.close();

              if (errStock) {
                return reject({ isConfirm: false, message: 'Erreur stock: ' + errStock.message });
              }

              resolve({
                isConfirm: true,
                message: 'Article, images et stocks ajoutés avec succès',
              });
            });

          } catch (errStockMap) {
            mysqlConnector.close();
            return reject({ isConfirm: false, message: 'Erreur taille/stock : ' + Error });
          }
        });
      });
    });
  }




  obtenirLeStock(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const mysqlConnector = new MysqlConnector();
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

    mysqlConnector.query(sql, [], (error, results) => {
      if (error) {
        console.error('Erreur lors de la récupération du stock : ' + error.message);
        reject(error);
      } else {
        resolve(results);
      }

      mysqlConnector.close();
    });
  });
}

ajouterStock(articleId: number, tailleId: number, quantite: number): Promise<ConfirmationResult> {
  return new Promise((resolve, reject) => {
    const mysqlConnector = new MysqlConnector();

    // Vérifie si une ligne existe déjà pour cet article + taille
    const checkSql = `SELECT id, quantite FROM stocks WHERE article_id = ? AND taille_id = ?`;

    mysqlConnector.query(checkSql, [articleId, tailleId], (error, results) => {
      if (error) {
        console.error("Erreur lors de la vérification du stock : ", error.message);
        reject({ isConfirm: false, message: "Erreur lors de l'ajout du stock" });
        mysqlConnector.close();
        return;
      }

      if (results.length > 0) {
        // Mise à jour de la quantité existante
        const updateSql = `UPDATE stocks SET quantite = quantite + ? WHERE article_id = ? AND taille_id = ?`;
        mysqlConnector.query(updateSql, [quantite, articleId, tailleId], (err) => {
          mysqlConnector.close();
          if (err) {
            reject({ isConfirm: false, message: "Erreur lors de la mise à jour du stock" });
          } else {
            resolve({ isConfirm: true, message: "Stock mis à jour avec succès" });
          }
        });
      } else {
        // Insertion d'une nouvelle ligne de stock
        const insertSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES (?, ?, ?)`;
        mysqlConnector.query(insertSql, [articleId, tailleId, quantite], (err) => {
          mysqlConnector.close();
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
  return new Promise((resolve, reject) => {
    const mysqlConnector = new MysqlConnector();
    const sql = `
      SELECT 
        c.id AS commande_id,
        c.date_commande,
        c.statut,
        u.nom AS client,
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

    mysqlConnector.query(sql, [], (error, results) => {
      mysqlConnector.close();
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

 async ajouterCommande(data: NouvelleCommande): Promise<ConfirmationResult> {
  const mysqlConnector = new MysqlConnector();

  try {
    // Récupérer la map tailleNom -> tailleId
    const tailleMap = await this.getTailleMap();

    // Début de transaction
    await new Promise<void>((resolve, reject) => {
      mysqlConnector.beginTransaction(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Insertion commande
    const result = await new Promise<any>((resolve, reject) => {
      const sqlInsertCommande = `INSERT INTO commandes (utilisateur_id, statut, date_commande) VALUES (?, ?, ?)`;
      mysqlConnector.query(sqlInsertCommande, [data.utilisateur_id, data.statut, data.date], (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    const commandeId = result.insertId;
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

    // Insertion articles commande
    await new Promise<void>((resolve, reject) => {
      const sqlInsertArticles = `
        INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix)
        VALUES ?
      `;
      mysqlConnector.query(sqlInsertArticles, [valeursArticlesFinales], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Commit
    await new Promise<void>((resolve, reject) => {
      mysqlConnector.commit(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    mysqlConnector.close();

    return { isConfirm: true, message: "Commande créée avec succès, en attente de paiement" };
  } catch (error) {
    console.error("Erreur dans ajouterCommande:", error);

    // Rollback si erreur
    await new Promise<void>((resolve) => {
      mysqlConnector.rollback(() => {
        mysqlConnector.close();
        resolve();
      });
    });

    return { isConfirm: false, message: "Erreur lors de la création de la commande" };
  }
}







supprimerArticle(articleId: number): Promise<ConfirmationResult> {
  return new Promise((resolve, reject) => {
    const mysqlConnector = new MysqlConnector();
    const sql = `DELETE FROM articles WHERE id = ?`;

    mysqlConnector.query(sql, [articleId], (error, result) => {
      mysqlConnector.close();

      if (error) {
        reject({ isConfirm: false, message: "Erreur lors de la suppression de l'article" });
      } else {
        resolve({ isConfirm: true, message: "Article supprimé avec succès" });
      }
    });
  });
}

  modifierArticle(id: number, data: ArticleData): Promise<ConfirmationResult> {
    return new Promise((resolve, reject) => {
      const mysqlConnector = new MysqlConnector();

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

      mysqlConnector.query(sql, values, (error, result) => {
        if (error) {
          mysqlConnector.close();
          return reject({ isConfirm: false, message: "Erreur lors de la mise à jour de l'article" });
        }

        // Supprimer les anciennes images
        const deleteSql = `DELETE FROM images WHERE article_id = ?`;
        mysqlConnector.query(deleteSql, [id], (deleteError) => {
          if (deleteError) {
            mysqlConnector.close();
            return reject({ isConfirm: false, message: "Erreur lors de la suppression des images" });
          }

          // Réinsérer les nouvelles images
          const insertSql = `INSERT INTO images (article_id, url) VALUES ?`;
          const imageValues = (data.images || []).map((url) => [id, url]);

          mysqlConnector.query(insertSql, [imageValues], (insertError) => {
            mysqlConnector.close();

            if (insertError) {
              return reject({ isConfirm: false, message: "Erreur lors de l'insertion des images" });
            }

            resolve({
              isConfirm: true,
              message: "Article et images mis à jour avec succès"
            });
          });
        });
      });
    });
  }



async modifierStock(articleId: number, tailleId: number, quantite: number): Promise<ConfirmationResult> {
  const mysqlConnector = new MysqlConnector();

  const sql = `
    UPDATE stocks 
    SET quantite = ?
    WHERE article_id = ? AND taille_id = ?
  `;

  return new Promise((resolve, reject) => {
    mysqlConnector.query(sql, [quantite, articleId, tailleId], (error, result) => {
      mysqlConnector.close();

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


  creerCommande(
    utilisateur_id: number,
    articles: ArticleCommande[],
    total: number,
    date: string,
    statut = 'en_attente'
  ): Promise<ConfirmationResult> {
    const commande = { utilisateur_id, articles, total, date, statut };
    return this.ajouterCommande(commande);
  }



}

