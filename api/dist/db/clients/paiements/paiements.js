import MysqlConnector from '../../connector/mysqlconnector.js';
export class Paiements {
    obtenirLesTousLesPaiements() {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
          SELECT paiements.*, 
            utilisateurs.first_name, 
             utilisateurs.last_name, 
          plans_tarifaires.nom_plan
        FROM paiements
        INNER JOIN utilisateurs ON paiements.utilisateur_id = utilisateurs.id
        INNER JOIN plans_tarifaires ON paiements.abonnement_id = plans_tarifaires.id;

        `;
            console.log("Exécution de la requête pour obtenir les paiements");
            mysqlConnector.query(sql, [], (error, results) => {
                if (error) {
                    console.error('Erreur lors de la récupération des paiements : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('cours récupérés avec succès :', results);
                    resolve(results);
                }
                mysqlConnector.close();
            });
        });
    }
    /**
     * Récupère les paiements pour un utilisateur spécifique
     * @param utilisateurId - L'ID de l'utilisateur
     * @returns Une promesse qui résout avec la liste des paiements de l'utilisateur
     */
    obtenirPaiementsParUtilisateur(utilisateurId) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
          SELECT paiements.*, 
            utilisateurs.first_name, 
            utilisateurs.last_name, 
            plans_tarifaires.nom_plan
          FROM paiements
          INNER JOIN utilisateurs ON paiements.utilisateur_id = utilisateurs.id
          INNER JOIN plans_tarifaires ON paiements.abonnement_id = plans_tarifaires.id
          WHERE paiements.utilisateur_id = ?;
        `;
            console.log(`Exécution de la requête pour obtenir les paiements de l'utilisateur ID ${utilisateurId}`);
            mysqlConnector.query(sql, [utilisateurId], (error, results) => {
                if (error) {
                    console.error(`Erreur lors de la récupération des paiements pour l'utilisateur ${utilisateurId}: ${error.message}`);
                    reject(error);
                }
                else {
                    console.log(`Paiements récupérés avec succès pour l'utilisateur ${utilisateurId}:`, results);
                    resolve(results);
                }
                mysqlConnector.close();
            });
        });
    }
    /**
     * Crée un nouveau paiement
     * @param paiementData - Les données du paiement à créer
     * @returns Une promesse qui résout avec les données du paiement créé
     */
    creerPaiement(paiementData) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            // Générer la date actuelle pour le paiement
            const dateActuelle = new Date().toISOString().slice(0, 19).replace('T', ' ');
            const sql = `
          INSERT INTO paiements 
            (utilisateur_id, montant, description, date, statut, abonnement_id)
          VALUES 
            (?, ?, ?, ?, 'en attente', ?);
        `;
            const values = [
                paiementData.utilisateur_id,
                paiementData.montant,
                paiementData.description,
                dateActuelle,
                paiementData.abonnement_id || null
            ];
            console.log("Exécution de la requête pour créer un paiement");
            console.log(sql, values);
            mysqlConnector.query(sql, values, (error, results) => {
                if (error) {
                    console.error('Erreur lors de la création du paiement : ' + error.message);
                    reject(error);
                }
                else {
                    console.log('Paiement créé avec succès, ID:', results.insertId);
                    // Retourner les données du paiement créé
                    const createdPaiement = {
                        id: results.insertId,
                        ...paiementData,
                        date: dateActuelle,
                        statut: 'en attente'
                    };
                    resolve(createdPaiement);
                }
                mysqlConnector.close();
            });
        });
    }
    /**
     * Récupère les échéances de paiement pour un utilisateur spécifique
     * @param utilisateurId - L'ID de l'utilisateur
     * @returns Une promesse qui résout avec la liste des échéances
     */
    obtenirEcheancesPourUtilisateur(utilisateurId) {
        return new Promise((resolve, reject) => {
            const mysqlConnector = new MysqlConnector();
            const sql = `
          SELECT 
            id,
            abonnement_id,
            date_echeance,
            montant,
            statut
          FROM echeances_paiements
          WHERE utilisateur_id = ?
          ORDER BY date_echeance DESC;

        `;
            console.log('SQL pour échéances:', sql);
            console.log('Param utilisateur_id:', utilisateurId);
            mysqlConnector.query(sql, [utilisateurId], (error, results) => {
                if (error) {
                    console.error('Erreur SQL échéances:', error);
                    reject(error);
                }
                else {
                    console.log('Résultats échéances:', results);
                    resolve(results);
                }
                mysqlConnector.close();
            });
        });
    }
}
