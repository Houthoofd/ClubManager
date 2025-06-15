var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import MysqlConnector from '../../connector/mysqlconnector.js';
export class Magasin {
    // Récupérer les articles
    obtenirLesArticles() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
        SELECT 
          a.*, 
          i.url AS image_url,
          t.nom AS stock_taille, -- ou t.nom selon ta table
          s.quantite AS stock_quantite
        FROM articles a
        LEFT JOIN images i ON i.article_id = a.id
        LEFT JOIN stocks s ON s.article_id = a.id
        LEFT JOIN tailles t ON t.id = s.taille_id
      `;
            console.log("Exécution de la requête avec LEFT JOIN");
            mysqlConnector.query(sql, [], (error, results) => {
                mysqlConnector.close();
                if (error) {
                    console.error('Erreur lors de la récupération des articles : ' + error.message);
                    return reject(error);
                }
                // Regrouper les résultats
                const articlesMap = new Map();
                for (const row of results) {
                    if (!articlesMap.has(row.id)) {
                        articlesMap.set(row.id, {
                            id: row.id,
                            nom: row.nom,
                            prix: row.prix,
                            categorie_id: row.categorie_id,
                            description: row.description,
                            images: [],
                            stocks: []
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
                console.log("Articles enrichis avec LEFT JOIN :", articlesAvecDetails);
                resolve(articlesAvecDetails);
            });
        });
    }
    obtenirLesCategories() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `SELECT * FROM categories`;
            console.log("Exécution de la requête pour obtenir les categories existantes");
            mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des categories : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Articles récupérés avec succès :', results);
                    resolve(results);
                }
                mysqlConnector.close();
            });
        });
    }
    getTailleMap() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const mysqlConnector = new MysqlConnector();
                const sql = `SELECT id, nom FROM tailles`;
                mysqlConnector.query(sql, [], (error, results) => {
                    mysqlConnector.close();
                    if (error)
                        return reject(error);
                    const map = {};
                    for (const row of results) {
                        map[row.nom] = row.id;
                    }
                    resolve(map);
                });
            });
        });
    }
    ajouterArticle(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
                mysqlConnector.query(articleSql, articleValues, (err, results) => __awaiter(this, void 0, void 0, function* () {
                    if (err) {
                        mysqlConnector.close();
                        return reject({ isConfirm: false, message: 'Erreur article: ' + err.message });
                    }
                    const articleId = results.insertId;
                    // Insertion des images
                    const imageSql = `INSERT INTO images (article_id, url) VALUES ?`;
                    const imageValues = (data.images || []).map((url) => [articleId, url]);
                    mysqlConnector.query(imageSql, [imageValues], (errImg) => __awaiter(this, void 0, void 0, function* () {
                        if (errImg) {
                            mysqlConnector.close();
                            return reject({ isConfirm: false, message: 'Erreur image: ' + errImg.message });
                        }
                        try {
                            // Récupération de la map des tailles
                            const tailleMap = yield this.getTailleMap();
                            const stockSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES ?`;
                            const stockValues = (data.stocks || []).map(({ taille, quantite }) => {
                                const tailleId = tailleMap[taille];
                                if (!tailleId)
                                    throw new Error(`Taille inconnue : ${taille}`);
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
                        }
                        catch (errStockMap) {
                            mysqlConnector.close();
                            return reject({ isConfirm: false, message: 'Erreur taille/stock : ' + Error });
                        }
                    }));
                }));
            });
        });
    }
    obtenirLeStock() {
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
                }
                else {
                    resolve(results);
                }
                mysqlConnector.close();
            });
        });
    }
    ajouterStock(articleId, tailleId, quantite) {
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
                        }
                        else {
                            resolve({ isConfirm: true, message: "Stock mis à jour avec succès" });
                        }
                    });
                }
                else {
                    // Insertion d'une nouvelle ligne de stock
                    const insertSql = `INSERT INTO stocks (article_id, taille_id, quantite) VALUES (?, ?, ?)`;
                    mysqlConnector.query(insertSql, [articleId, tailleId, quantite], (err) => {
                        mysqlConnector.close();
                        if (err) {
                            reject({ isConfirm: false, message: "Erreur lors de l'ajout du stock" });
                        }
                        else {
                            resolve({ isConfirm: true, message: "Stock ajouté avec succès" });
                        }
                    });
                }
            });
        });
    }
    obtenirLesCommandes() {
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
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    ajouterCommande(data) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            mysqlConnector.beginTransaction((err) => {
                if (err) {
                    reject({ isConfirm: false, message: "Erreur lors du début de la transaction" });
                    return;
                }
                const sqlInsertCommande = `INSERT INTO commandes (utilisateur_id) VALUES (?)`;
                mysqlConnector.query(sqlInsertCommande, [data.utilisateur_id], (err, result) => {
                    if (err) {
                        return mysqlConnector.rollback(() => {
                            reject({ isConfirm: false, message: "Erreur lors de l'insertion de la commande" });
                        });
                    }
                    const commandeId = result.insertId;
                    const valeursArticles = data.articles.map((article) => [
                        commandeId,
                        article.article_id,
                        article.taille_id,
                        article.quantite,
                        article.prix
                    ]);
                    const sqlInsertArticles = `
          INSERT INTO commande_articles (commande_id, article_id, taille_id, quantite, prix)
          VALUES ?
        `;
                    mysqlConnector.query(sqlInsertArticles, [valeursArticles], (err2) => {
                        if (err2) {
                            return mysqlConnector.rollback(() => {
                                reject({ isConfirm: false, message: "Erreur lors de l'insertion des articles" });
                            });
                        }
                        // Décrémenter les stocks
                        const decrements = data.articles.map((article) => {
                            return new Promise((resolveDec, rejectDec) => {
                                const sqlMajStock = `
                UPDATE stocks
                SET quantite = quantite - ?
                WHERE article_id = ? AND taille_id = ? AND quantite >= ?
              `;
                                const values = [
                                    article.quantite,
                                    article.article_id,
                                    article.taille_id,
                                    article.quantite
                                ];
                                mysqlConnector.query(sqlMajStock, values, (err3, result3) => {
                                    if (err3 || result3.affectedRows === 0) {
                                        return rejectDec("Stock insuffisant ou erreur lors de la mise à jour du stock");
                                    }
                                    resolveDec();
                                });
                            });
                        });
                        // Vérifie que tous les stocks ont été décrémentés
                        Promise.allSettled(decrements).then((results) => {
                            const hasFailure = results.some(r => r.status === 'rejected');
                            if (hasFailure) {
                                return mysqlConnector.rollback(() => {
                                    reject({ isConfirm: false, message: "Échec lors de la mise à jour des stocks" });
                                });
                            }
                            // Tout s’est bien passé → commit
                            mysqlConnector.commit((commitErr) => {
                                if (commitErr) {
                                    return mysqlConnector.rollback(() => {
                                        reject({ isConfirm: false, message: "Erreur lors du commit final" });
                                    });
                                }
                                resolve({
                                    isConfirm: true,
                                    message: "Commande enregistrée et stock mis à jour avec succès"
                                });
                            });
                        });
                    });
                });
            });
        });
    }
    supprimerArticle(articleId) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `DELETE FROM articles WHERE id = ?`;
            mysqlConnector.query(sql, [articleId], (error, result) => {
                mysqlConnector.close();
                if (error) {
                    reject({ isConfirm: false, message: "Erreur lors de la suppression de l'article" });
                }
                else {
                    resolve({ isConfirm: true, message: "Article supprimé avec succès" });
                }
            });
        });
    }
    modifierArticle(id, data) {
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
    modifierStock(articleId, tailleId, quantite) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    }
                    else if (result.affectedRows === 0) {
                        resolve({
                            isConfirm: false,
                            message: "Aucune ligne modifiée : l'article ou la taille est introuvable"
                        });
                    }
                    else {
                        resolve({
                            isConfirm: true,
                            message: "Stock mis à jour avec succès"
                        });
                    }
                });
            });
        });
    }
    creerCommande(utilisateur_id, articles) {
        const commande = {
            utilisateur_id,
            articles,
            statut: 'en_attente'
        };
        return this.ajouterCommande(commande);
    }
}
