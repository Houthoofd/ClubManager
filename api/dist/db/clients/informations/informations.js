import MysqlConnector from '../../connector/mysqlconnector.js';
export class Informations {
    mysqlConnector;
    constructor() {
        this.mysqlConnector = MysqlConnector.getInstance();
    }
    async obtenirLesInformations() {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour obtenirLesInformations");
            return {
                isFind: false,
                message: "Service temporairement indisponible - Pool fermé",
                data: []
            };
        }
        const sql = `
      SELECT id, titre, contenu, date_creation, status_id
      FROM informations
      WHERE status_id = 1
      ORDER BY date_creation DESC
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des informations :', error);
                    reject(error);
                }
                else {
                    resolve({
                        isFind: true,
                        message: 'Informations récupérées avec succès',
                        data: results
                    });
                }
            });
        });
    }
    async obtenirLesGenres() {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour obtenirLesGenres");
            return {
                isFind: false,
                message: "Service temporairement indisponible - Pool fermé",
                data: []
            };
        }
        const sql = `SELECT * FROM genres`;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des genres : ' + error.message);
                    reject(error);
                }
                else {
                    resolve({
                        isFind: true,
                        message: 'Genres récupérés avec succès',
                        data: results
                    });
                }
            });
        });
    }
    async obtenirLesStatus() {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour obtenirLesStatus");
            return {
                isFind: false,
                message: "Service temporairement indisponible - Pool fermé",
                data: []
            };
        }
        const sql = `SELECT * FROM status`;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des statuts : ' + error.message);
                    reject(error);
                }
                else {
                    resolve({
                        isFind: true,
                        message: 'Statuts récupérés avec succès',
                        data: results
                    });
                }
            });
        });
    }
    async obtenirLesGrades() {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour obtenirLesGrades");
            return {
                isFind: false,
                message: "Service temporairement indisponible - Pool fermé",
                data: []
            };
        }
        const sql = `SELECT * FROM grades ORDER BY id ASC`;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des grades : ' + error.message);
                    reject(error);
                }
                else {
                    resolve({
                        isFind: true,
                        message: 'Grades récupérés avec succès',
                        data: results
                    });
                }
            });
        });
    }
    async obtenirLesPlans() {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour obtenirLesPlans");
            return {
                isFind: false,
                message: "Service temporairement indisponible - Pool fermé",
                data: []
            };
        }
        const sql = `SELECT * FROM plans_tarifaires`;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des plans tarifaires : ' + error.message);
                    reject(error);
                }
                else {
                    resolve({
                        isFind: true,
                        message: 'Plans tarifaires récupérés avec succès',
                        data: results
                    });
                }
            });
        });
    }
    async obtenirLesAbonnements() {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour obtenirLesAbonnements");
            return {
                isFind: false,
                message: "Service temporairement indisponible - Pool fermé",
                data: []
            };
        }
        const sql = `SELECT * FROM abonnements`;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des abonnements : ' + error.message);
                    reject(error);
                }
                else {
                    resolve({
                        isFind: true,
                        message: 'Abonnements récupérés avec succès',
                        data: results
                    });
                }
            });
        });
    }
    async creerInformation(informationData) {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour creerInformation");
            throw new Error("Service temporairement indisponible - Pool fermé");
        }
        const sql = `
      INSERT INTO informations (titre, contenu, date_creation, status_id)
      VALUES (?, ?, NOW(), 1)
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [
                informationData.titre,
                informationData.contenu
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
    async modifierInformation(id, informationData) {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour modifierInformation");
            throw new Error("Service temporairement indisponible - Pool fermé");
        }
        const sql = `
      UPDATE informations 
      SET titre = ?, contenu = ?
      WHERE id = ? AND status_id = 1
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [
                informationData.titre,
                informationData.contenu,
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
    async supprimerInformation(id) {
        if (!this.mysqlConnector.isPoolReady()) {
            console.error("❌ Pool MySQL non disponible pour supprimerInformation");
            throw new Error("Service temporairement indisponible - Pool fermé");
        }
        const sql = `
      DELETE FROM informations
      WHERE id = ?
    `;
        return new Promise((resolve, reject) => {
            this.mysqlConnector.query(sql, [id], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la suppression de l\'information :', error);
                    reject(error);
                }
                else {
                    resolve({
                        isConfirm: true,
                        message: 'Information supprimée avec succès'
                    });
                }
            });
        });
    }
    // Ajouter ces méthodes manquantes
    async obtenirLeStatus() {
        return this.obtenirLesStatus();
    }
    async obtenirLesPlansTarifaires() {
        return this.obtenirLesPlans();
    }
}
