import MysqlConnector from '../../connector/mysqlconnector.js';
export class Informations {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    obtenirToutesLesInformations() {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT id, titre, contenu, date_creation, status_id
        FROM informations
        WHERE status_id = 1
        ORDER BY date_creation DESC
      `;
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des informations :', error);
                    reject(error);
                }
                else {
                    resolve(results);
                }
            });
        });
    }
    obtenirInformationParId(id) {
        return new Promise((resolve, reject) => {
            const sql = `
        SELECT id, titre, contenu, date_creation, status_id
        FROM informations
        WHERE id = ? AND status_id = 1
      `;
            this.mysqlConnector.query(sql, [id], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération de l\'information :', error);
                    reject(error);
                }
                else if (results.length === 0) {
                    resolve(null);
                }
                else {
                    resolve(results[0]);
                }
            });
        });
    }
    ajouterInformation(infoData) {
        return new Promise((resolve, reject) => {
            const sql = `
        INSERT INTO informations (titre, contenu, date_creation, status_id)
        VALUES (?, ?, NOW(), 1)
      `;
            this.mysqlConnector.query(sql, [
                infoData.titre,
                infoData.contenu
            ], (error, results) => {
                if (error) {
                    console.error('Erreur lors de l\'ajout de l\'information :', error);
                    reject(error);
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Information ajoutée avec succès'
                    });
                }
            });
        });
    }
    modifierInformation(id, infoData) {
        return new Promise((resolve, reject) => {
            const sql = `
        UPDATE informations 
        SET titre = ?, contenu = ?
        WHERE id = ? AND status_id = 1
      `;
            this.mysqlConnector.query(sql, [
                infoData.titre,
                infoData.contenu,
                id
            ], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la modification de l\'information :', error);
                    reject(error);
                }
                else if (results.affectedRows === 0) {
                    resolve({
                        isConfirm: false,
                        message: 'Information non trouvée'
                    });
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Information modifiée avec succès'
                    });
                }
            });
        });
    }
    // Récupérer les statuts
    obtenirLeStatus() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM status`;
            console.log("Exécution de la requête pour obtenir les statuts");
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des statuts : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Statuts récupérés avec succès :', results);
                    resolve(results);
                }
            });
        });
    }
    // Récupérer les plans tarifaires
    obtenirLesPlansTarifaires() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM plans_tarifaires`;
            console.log("Exécution de la requête pour obtenir les plans tarifaires");
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des plans tarifaires : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Plans tarifaires récupérés avec succès :', results);
                    resolve(results);
                }
            });
        });
    }
    // Récupérer les genres
    obtenirLesGenres() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM genres`;
            console.log("Exécution de la requête pour obtenir les genres");
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des genres : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Genres récupérés avec succès :', results);
                    resolve(results);
                }
            });
        });
    }
    // Récupérer les grades
    obtenirLesGrades() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM grades ORDER BY id ASC`;
            console.log("Exécution de la requête pour obtenir les grades");
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des grades : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Grades récupérés avec succès :', results);
                    resolve(results);
                }
            });
        });
    }
}
