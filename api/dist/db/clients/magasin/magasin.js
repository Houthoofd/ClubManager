import MysqlConnector from '../../connector/mysqlconnector.js';
export class Magasin {
    // Récupérer les articles
    obtenirLesArticles() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `SELECT * FROM articles`;
            console.log("Exécution de la requête pour obtenir les articles");
            mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des articles : ' + error.message);
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
    ajouterArticle(data) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            // Requête SQL pour insérer un nouvel article
            const sql = `
        INSERT INTO articles (nom, description, prix, image_url, categorie_id) 
        VALUES (?, ?, ?, ?, ?)
      `;
            // Valeurs à insérer dans la base de données
            const values = [
                data.nom,
                data.description,
                data.prix,
                data.image_url,
                data.categorie_id,
            ];
            console.log("Exécution de la requête pour ajouter l'article avec les données : ", values);
            // Exécution de la requête SQL
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'ajout de l\'article : ' + error.message);
                    reject({
                        isConfirm: false,
                        message: 'Erreur lors de l\'ajout de l\'article',
                    });
                }
                else {
                    console.log('Article ajouté avec succès :', results);
                    resolve({
                        isConfirm: true,
                        message: 'Article ajouté avec succès',
                    });
                }
                // Fermeture de la connexion
                mysqlConnector.close();
            });
        });
    }
}
