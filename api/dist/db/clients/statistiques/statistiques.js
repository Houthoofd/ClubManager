import MysqlConnector from '../../connector/mysqlconnector.js';
export class Statistiques {
    /**
     * Obtient les statistiques de fréquentation pour un utilisateur spécifique
     */
    async obtenirStatistiquesFrequentation(utilisateurId) {
        const mysqlConnector = new MysqlConnector();
        try {
            const query = `
        WITH
        cours_recurrents_actifs AS (
          SELECT COUNT(*) AS total_cours_recurrents_actifs
          FROM cours_recurrent
          WHERE active = 1
        ),
        cours_par_mois AS (
          SELECT
            MONTHNAME(c.date_cours) as mois,
            MONTH(c.date_cours) as mois_num,
            YEAR(c.date_cours) as annee,
            (SELECT total_cours_recurrents_actifs FROM cours_recurrents_actifs) * 4 as total_cours_mois
          FROM cours c
          GROUP BY YEAR(c.date_cours), MONTH(c.date_cours)
        ),
        presences_par_mois AS (
          SELECT
            MONTHNAME(c.date_cours) as mois,
            MONTH(c.date_cours) as mois_num,
            YEAR(c.date_cours) as annee,
            COUNT(DISTINCT DATE(c.date_cours)) as presences_validees
          FROM inscriptions i
          JOIN cours c ON i.cours_id = c.id
          WHERE i.utilisateur_id = ?
          AND i.status_id = 1
          GROUP BY YEAR(c.date_cours), MONTH(c.date_cours)
        ),
        total_frequentation AS (
          SELECT COUNT(*) as total FROM inscriptions WHERE utilisateur_id = ? AND status_id = 1
        )
        SELECT
          COALESCE(p.mois, c.mois) as mois,
          COALESCE(p.presences_validees, 0) as frequentation,
          c.total_cours_mois as nombres_total_de_cours_du_mois,
          ROUND(COALESCE(p.presences_validees, 0) * 100.0 / NULLIF(c.total_cours_mois, 0), 2) as pourcentage_de_cours_valides,
          (SELECT total FROM total_frequentation) as totalFrequentation
        FROM cours_par_mois c
        LEFT JOIN presences_par_mois p ON c.annee = p.annee AND c.mois_num = p.mois_num
        ORDER BY c.annee, c.mois_num;
      `;
            const results = await this.executerRequete(mysqlConnector, query, [utilisateurId, utilisateurId], (rows) => rows);
            // On extrait le totalFrequentation du premier résultat (identique pour chaque ligne)
            const totalFrequentation = results.length > 0 ? Number(results[0].totalFrequentation) : 0;
            const frequentationParMois = results.map((row) => ({
                mois: row.mois,
                frequentation: Number(row.frequentation),
                nombres_total_de_cours_du_mois: Number(row.nombres_total_de_cours_du_mois),
                pourcentage_de_cours_valides: Number(row.pourcentage_de_cours_valides)
            }));
            return {
                totalFrequentation,
                frequentationParMois
            };
        }
        catch (error) {
            console.error(`Erreur lors de l'obtention des statistiques pour l'utilisateur ${utilisateurId}:`, error);
            throw error;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Exécute une requête SQL et retourne le résultat transformé
     */
    async executerRequete(connector, query, params, transformer) {
        return new Promise((resolve, reject) => {
            connector.query(query, params, (error, results) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(transformer(results));
                }
            });
        });
    }
    /**
     * Obtient les statistiques de progression pour un utilisateur spécifique
     */
    async obtenirProgressionUtilisateur(utilisateurId) {
        const mysqlConnector = new MysqlConnector();
        try {
            const [coursSuivis, progression] = await Promise.all([
                this.executerRequete(mysqlConnector, `SELECT COUNT(*) as total FROM inscriptions WHERE utilisateur_id = ? AND status_id = 1;`, [utilisateurId], (results) => Number(results[0].total)),
                this.executerRequete(mysqlConnector, `
            SELECT
              c.id as cours_id,
              c.type_cours as titre,
              COUNT(i.id) as cours_suivis,
              (COUNT(i.id) * 100 / (
                SELECT COUNT(*) FROM cours WHERE cours_recurrent_id = c.cours_recurrent_id
              )) as progression
            FROM cours c
            JOIN inscriptions i ON c.id = i.cours_id AND i.utilisateur_id = ? AND i.status_id = 1
            GROUP BY c.id, c.type_cours, c.cours_recurrent_id;
          `, [utilisateurId], (results) => results),
            ]);
            let niveauActuel = 'Débutant';
            if (coursSuivis > 30)
                niveauActuel = 'Avancé';
            else if (coursSuivis > 10)
                niveauActuel = 'Intermédiaire';
            return {
                utilisateur_id: utilisateurId,
                coursSuivis,
                progressionParCours: progression,
                niveauActuel,
            };
        }
        catch (error) {
            console.error(`Erreur lors de l'obtention de la progression pour l'utilisateur ${utilisateurId}:`, error);
            throw error;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient les présences par mois pour un utilisateur
     */
    async obtenirPresenceParMois(userId) {
        const mysqlConnector = new MysqlConnector();
        try {
            const query = `
        SELECT
          u.last_name, u.first_name, MONTH(c.date_cours) AS mois,
          CASE MONTH(c.date_cours)
            WHEN 1 THEN 'Janvier'
            WHEN 2 THEN 'Février'
            WHEN 3 THEN 'Mars'
            WHEN 4 THEN 'Avril'
            WHEN 5 THEN 'Mai'
            WHEN 6 THEN 'Juin'
            WHEN 7 THEN 'Juillet'
            WHEN 8 THEN 'Août'
            WHEN 9 THEN 'Septembre'
            WHEN 10 THEN 'Octobre'
            WHEN 11 THEN 'Novembre'
            WHEN 12 THEN 'Décembre'
          END AS nom_mois,
          c.type_cours, COUNT(i.id) AS total_presences
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        JOIN utilisateurs u ON i.utilisateur_id = u.id
        WHERE i.status_id = 1
          AND i.utilisateur_id = ?
        GROUP BY u.last_name, u.first_name, mois, c.type_cours
        ORDER BY u.last_name, u.first_name, mois, c.type_cours;
      `;
            return this.executerRequete(mysqlConnector, query, [userId], (results) => results);
        }
        catch (error) {
            console.error(`Erreur lors de la récupération des présences pour l'utilisateur ${userId}:`, error);
            throw error;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient les présences non validées par mois pour un utilisateur
     */
    async obtenirPresencesNonValideesParMois(userId) {
        const mysqlConnector = new MysqlConnector();
        try {
            const query = `
        SELECT
          u.last_name, u.first_name, MONTH(c.date_cours) AS mois,
          CASE MONTH(c.date_cours)
            WHEN 1 THEN 'Janvier'
            WHEN 2 THEN 'Février'
            WHEN 3 THEN 'Mars'
            WHEN 4 THEN 'Avril'
            WHEN 5 THEN 'Mai'
            WHEN 6 THEN 'Juin'
            WHEN 7 THEN 'Juillet'
            WHEN 8 THEN 'Août'
            WHEN 9 THEN 'Septembre'
            WHEN 10 THEN 'Octobre'
            WHEN 11 THEN 'Novembre'
            WHEN 12 THEN 'Décembre'
          END AS nom_mois,
          c.type_cours, COUNT(i.id) AS total_presences
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        JOIN utilisateurs u ON i.utilisateur_id = u.id
        WHERE i.status_id IS NULL
          AND i.utilisateur_id = ?
        GROUP BY u.last_name, u.first_name, mois, c.type_cours
        ORDER BY u.last_name, u.first_name, mois, c.type_cours;
      `;
            return this.executerRequete(mysqlConnector, query, [userId], (results) => results);
        }
        catch (error) {
            console.error(`Erreur lors de la récupération des présences non validées pour l'utilisateur ${userId}:`, error);
            throw error;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient les statistiques de fréquentation par mois pour tous les utilisateurs
     */
    async obtenirStatistiquesPresenceParMois() {
        const mysqlConnector = new MysqlConnector();
        try {
            const query = `
        SELECT
          MONTHNAME(c.date_cours) as mois,
          COUNT(DISTINCT i.utilisateur_id) as frequentation
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id AND i.status_id = 1
        GROUP BY MONTH(c.date_cours), mois
        ORDER BY MONTH(c.date_cours);
      `;
            return this.executerRequete(mysqlConnector, query, [], (results) => results);
        }
        catch (error) {
            console.error("Erreur lors de l'obtention des statistiques de présence par mois:", error);
            throw error;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Formate les résultats de présence pour affichage graphique
     */
    formatPresenceData(data) {
        const formatted = {};
        data.forEach((item) => {
            const { nom_mois, type_cours, total_presences } = item;
            if (!formatted[nom_mois]) {
                formatted[nom_mois] = {};
            }
            formatted[nom_mois][type_cours] = total_presences;
        });
        return formatted;
    }
    /**
     * Obtient le nombre total de membres actifs
     */
    async getNombreMembres() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `SELECT COUNT(*) AS count FROM utilisateurs WHERE status_id IN (1,2,3,4,5)`;
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            return result[0]?.count ?? 0;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient le montant total des paiements du mois en cours
     */
    async getTotalPaiementsMois() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT COALESCE(SUM(montant), 0) AS total
        FROM paiements
        WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE())
          AND YEAR(date_paiement) = YEAR(CURRENT_DATE())
          AND statut = 'validé'
      `;
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            return result[0]?.total ?? 0;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient le nombre de paiements récents (effectués au cours des 7 derniers jours)
     */
    async getPaiementsRecents() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT COUNT(*) AS count
        FROM paiements
        WHERE date_paiement >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
          AND statut = 'validé'
      `;
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            return result[0]?.count ?? 0;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient le nombre de paiements en attente
     */
    async getPaiementsEnAttente() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT COUNT(DISTINCT utilisateur_id) AS count
        FROM paiements
        WHERE statut = 'en attente'
      `;
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            return result[0]?.count ?? 0;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient le nombre total de plans actifs
     */
    async getPlansActifs() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `SELECT COUNT(*) AS count FROM plans_tarifaires`;
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            return result[0]?.count ?? 0;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient le taux de renouvellement des abonnements
     */
    async getTauxRenouvellement() {
        const mysqlConnector = new MysqlConnector();
        try {
            // Si tu as une table "statistiques" ou "renouvellements", adapte ici
            const sql = `
        SELECT
          ROUND(
            (SELECT COUNT(*) FROM paiements WHERE statut = 'validé' AND periode_fin >= CURRENT_DATE()) * 100.0 /
            NULLIF((SELECT COUNT(*) FROM paiements WHERE periode_fin >= CURRENT_DATE()), 0), 2
          ) AS taux
      `;
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            return result[0]?.taux ?? 0;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient les paiements par mois (12 derniers mois)
     */
    async getPaiementsParMois() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT
          DATE_FORMAT(date_paiement, '%b') AS mois,
          SUM(montant) AS total
        FROM paiements
        WHERE statut = 'validé'
        GROUP BY YEAR(date_paiement), MONTH(date_paiement)
        ORDER BY YEAR(date_paiement) DESC, MONTH(date_paiement) DESC
        LIMIT 12
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Obtient le nombre de membres par plan
     */
    async getMembresParPlan() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT pt.nom_plan AS plan, COUNT(u.id) AS value
        FROM utilisateurs u
        JOIN plans_tarifaires pt ON u.abonnement_id = pt.id
        WHERE u.status_id IN (1,2,3,4,5)
        GROUP BY pt.nom_plan
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    async getDerniersPaiements() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT p.*, u.nom_utilisateur
        FROM paiements p
        JOIN utilisateurs u ON p.utilisateur_id = u.id
        ORDER BY p.date_paiement DESC
        LIMIT 10
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    async getPaiementsEchus() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT p.*, u.nom_utilisateur
        FROM paiements p
        JOIN utilisateurs u ON p.utilisateur_id = u.id
        WHERE p.periode_fin < CURRENT_DATE()
        ORDER BY p.periode_fin DESC
        LIMIT 10
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    async getNouveauxMembres() {
        const mysqlConnector = new MysqlConnector();
        try {
            // Correction : la colonne d'inscription est 'date_inscription' dans la table utilisateurs
            const sql = `
        SELECT u.first_name, u.last_name, u.date_inscription
        FROM utilisateurs u
        WHERE u.date_inscription >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        ORDER BY u.date_inscription DESC
        LIMIT 10
      `;
            console.log('[getNouveauxMembres] SQL:', sql);
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            console.log('[getNouveauxMembres] Result:', result);
            if (!Array.isArray(result)) {
                console.error('[getNouveauxMembres] Résultat inattendu:', result);
                throw new Error('Résultat inattendu pour getNouveauxMembres');
            }
            return result;
        }
        catch (error) {
            console.error('[getNouveauxMembres] Erreur:', error);
            throw error;
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Top 5 membres les plus assidus (présences validées)
     */
    async getTopMembresAssidus() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT u.first_name, u.last_name, COUNT(i.id) AS total_presences_validees
        FROM utilisateurs u
        LEFT JOIN inscriptions i ON u.id = i.utilisateur_id AND i.status_id = 1
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY total_presences_validees DESC
        LIMIT 5
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Répartition des membres par grade
     */
    async getMembresParGrade() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT g.grade_id, COUNT(u.id) AS count
        FROM utilisateurs u
        JOIN grades g ON u.grade_id = g.id
        GROUP BY g.grade_id
        ORDER BY count DESC
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Répartition des membres par genre
     */
    async getMembresParGenre() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT ge.genre_name, COUNT(u.id) AS count
        FROM utilisateurs u
        JOIN genres ge ON u.genre_id = ge.id
        GROUP BY ge.genre_name
        ORDER BY count DESC
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Prochains anniversaires des membres (dans les 30 jours)
     */
    async getProchainsAnniversaires() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT first_name, last_name, date_of_birth
        FROM utilisateurs
        WHERE
          DATE_FORMAT(date_of_birth, '%m-%d') BETWEEN DATE_FORMAT(CURRENT_DATE(), '%m-%d')
          AND DATE_FORMAT(DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY), '%m-%d')
        ORDER BY DATE_FORMAT(date_of_birth, '%m-%d')
        LIMIT 10
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Articles les plus vendus
     */
    async getArticlesPlusVendus() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT a.nom, SUM(ca.quantite) AS total_vendu
        FROM commande_articles ca
        JOIN articles a ON ca.article_id = a.id
        GROUP BY a.nom
        ORDER BY total_vendu DESC
        LIMIT 10
      `;
            return await this.executerRequete(mysqlConnector, sql, [], rows => rows);
        }
        finally {
            mysqlConnector.close();
        }
    }
    /**
     * Nombre de cours à venir cette semaine
     */
    async getCoursSemaine() {
        const mysqlConnector = new MysqlConnector();
        try {
            const sql = `
        SELECT COUNT(*) AS count
        FROM cours
        WHERE WEEK(date_cours, 1) = WEEK(CURRENT_DATE(), 1)
          AND YEAR(date_cours) = YEAR(CURRENT_DATE())
          AND date_cours >= CURRENT_DATE()
      `;
            const result = await this.executerRequete(mysqlConnector, sql, [], rows => rows);
            return result[0]?.count ?? 0;
        }
        finally {
            mysqlConnector.close();
        }
    }
}
