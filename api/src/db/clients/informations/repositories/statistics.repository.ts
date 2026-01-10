/**
 * Repository de statistiques pour le module Informations
 * Contient toutes les méthodes de statistiques et d'analyse
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  InformationStatistiques,
  InformationTrend,
  InformationPopularity,
} from '../types.js';

import * as queries from '../queries/index.js';

/**
 * Repository de statistiques pour les informations
 */
export class InformationsStatisticsRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // STATISTIQUES GÉNÉRALES
  // ============================================================================

  /**
   * Obtenir les statistiques générales des informations
   */
  async getGeneralStatistics(): Promise<InformationStatistiques> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(queries.GET_INFORMATIONS_STATISTICS, [], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve({
            total: 0,
            actives: 0,
            inactives: 0,
            prioritaires: 0,
            publiees: 0,
            brouillons: 0,
            archivees: 0,
          });
        } else {
          const stats = results[0];
          resolve({
            total: stats.total || 0,
            actives: stats.actives || 0,
            inactives: stats.inactives || 0,
            prioritaires: stats.prioritaires || 0,
            publiees: stats.publiees || 0,
            brouillons: stats.brouillons || 0,
            archivees: stats.archivees || 0,
          });
        }
      });
    });
  }

  /**
   * Obtenir le nombre d'informations par statut
   */
  async getCountByStatus(): Promise<Array<{ status_id: number; status_nom: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.status_id,
          s.nom as status_nom,
          COUNT(*) as count
        FROM informations i
        LEFT JOIN status s ON i.status_id = s.id
        WHERE i.actif = 1
        GROUP BY i.status_id, s.nom
        ORDER BY count DESC
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            status_id: row.status_id,
            status_nom: row.status_nom,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir le nombre d'informations par catégorie
   */
  async getCountByCategorie(): Promise<Array<{ categorie_id: number; categorie_nom: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.categorie_id,
          c.nom as categorie_nom,
          COUNT(*) as count
        FROM informations i
        LEFT JOIN categories_informations c ON i.categorie_id = c.id
        WHERE i.actif = 1
        GROUP BY i.categorie_id, c.nom
        ORDER BY count DESC
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            categorie_id: row.categorie_id,
            categorie_nom: row.categorie_nom,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir le nombre d'informations par genre
   */
  async getCountByGenre(): Promise<Array<{ genre_id: number; genre_nom: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.genre_id,
          g.nom as genre_nom,
          COUNT(*) as count
        FROM informations i
        LEFT JOIN genres g ON i.genre_id = g.id
        WHERE i.actif = 1
        GROUP BY i.genre_id, g.nom
        ORDER BY count DESC
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            genre_id: row.genre_id,
            genre_nom: row.genre_nom,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir le nombre d'informations par grade
   */
  async getCountByGrade(): Promise<Array<{ grade_id: number; grade_nom: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.grade_id,
          gr.nom as grade_nom,
          COUNT(*) as count
        FROM informations i
        LEFT JOIN grades gr ON i.grade_id = gr.id
        WHERE i.actif = 1
        GROUP BY i.grade_id, gr.nom
        ORDER BY count DESC
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            grade_id: row.grade_id,
            grade_nom: row.grade_nom,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir le nombre d'informations par plan tarifaire
   */
  async getCountByPlanTarifaire(): Promise<Array<{ plan_id: number; plan_nom: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.plan_tarifaire_id as plan_id,
          pt.nom as plan_nom,
          COUNT(*) as count
        FROM informations i
        LEFT JOIN plans_tarifaires pt ON i.plan_tarifaire_id = pt.id
        WHERE i.actif = 1
        GROUP BY i.plan_tarifaire_id, pt.nom
        ORDER BY count DESC
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            plan_id: row.plan_id,
            plan_nom: row.plan_nom,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir le nombre d'informations par auteur
   */
  async getCountByAuteur(limit: number = 10): Promise<Array<{ auteur_id: number; auteur_nom: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.auteur_id,
          CONCAT(u.nom, ' ', u.prenom) as auteur_nom,
          COUNT(*) as count
        FROM informations i
        LEFT JOIN utilisateurs u ON i.auteur_id = u.id
        WHERE i.actif = 1
        GROUP BY i.auteur_id, auteur_nom
        ORDER BY count DESC
        LIMIT ?
      `;

      this.mysqlConnector.query(query, [limit], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            auteur_id: row.auteur_id,
            auteur_nom: row.auteur_nom,
            count: row.count,
          })));
        }
      });
    });
  }

  // ============================================================================
  // STATISTIQUES TEMPORELLES
  // ============================================================================

  /**
   * Obtenir le nombre d'informations créées par mois
   */
  async getCountByMonth(year?: number): Promise<Array<{ year: number; month: number; count: number }>> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT
          YEAR(created_at) as year,
          MONTH(created_at) as month,
          COUNT(*) as count
        FROM informations
        WHERE actif = 1
      `;

      const params: any[] = [];

      if (year) {
        query += ' AND YEAR(created_at) = ?';
        params.push(year);
      }

      query += `
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year DESC, month DESC
      `;

      this.mysqlConnector.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            year: row.year,
            month: row.month,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir le nombre d'informations publiées par mois
   */
  async getPublishedByMonth(year?: number): Promise<Array<{ year: number; month: number; count: number }>> {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT
          YEAR(date_publication) as year,
          MONTH(date_publication) as month,
          COUNT(*) as count
        FROM informations
        WHERE actif = 1 AND date_publication IS NOT NULL
      `;

      const params: any[] = [];

      if (year) {
        query += ' AND YEAR(date_publication) = ?';
        params.push(year);
      }

      query += `
        GROUP BY YEAR(date_publication), MONTH(date_publication)
        ORDER BY year DESC, month DESC
      `;

      this.mysqlConnector.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            year: row.year,
            month: row.month,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir les tendances des informations (derniers 30 jours)
   */
  async getTrends(days: number = 30): Promise<InformationTrend[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          DATE(created_at) as date,
          COUNT(*) as count,
          SUM(CASE WHEN prioritaire = 1 THEN 1 ELSE 0 END) as prioritaires
        FROM informations
        WHERE actif = 1
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `;

      this.mysqlConnector.query(query, [days], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            date: row.date,
            count: row.count,
            prioritaires: row.prioritaires,
          })));
        }
      });
    });
  }

  // ============================================================================
  // STATISTIQUES AVANCÉES
  // ============================================================================

  /**
   * Obtenir les informations les plus récentes avec statistiques
   */
  async getRecentWithStats(limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.id,
          i.titre,
          i.slug,
          i.date_publication,
          i.prioritaire,
          s.nom as status_nom,
          c.nom as categorie_nom,
          CONCAT(u.nom, ' ', u.prenom) as auteur_nom,
          DATEDIFF(CURDATE(), i.date_publication) as jours_depuis_publication
        FROM informations i
        LEFT JOIN status s ON i.status_id = s.id
        LEFT JOIN categories_informations c ON i.categorie_id = c.id
        LEFT JOIN utilisateurs u ON i.auteur_id = u.id
        WHERE i.actif = 1
        ORDER BY i.date_publication DESC
        LIMIT ?
      `;

      this.mysqlConnector.query(query, [limit], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir les informations expirant bientôt
   */
  async getExpiringSoon(days: number = 7): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.id,
          i.titre,
          i.slug,
          i.date_expiration,
          DATEDIFF(i.date_expiration, CURDATE()) as jours_restants,
          s.nom as status_nom,
          c.nom as categorie_nom
        FROM informations i
        LEFT JOIN status s ON i.status_id = s.id
        LEFT JOIN categories_informations c ON i.categorie_id = c.id
        WHERE i.actif = 1
          AND i.date_expiration IS NOT NULL
          AND i.date_expiration >= CURDATE()
          AND i.date_expiration <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
        ORDER BY i.date_expiration ASC
      `;

      this.mysqlConnector.query(query, [days], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir les informations expirées
   */
  async getExpired(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          i.id,
          i.titre,
          i.slug,
          i.date_expiration,
          DATEDIFF(CURDATE(), i.date_expiration) as jours_depuis_expiration,
          s.nom as status_nom,
          c.nom as categorie_nom
        FROM informations i
        LEFT JOIN status s ON i.status_id = s.id
        LEFT JOIN categories_informations c ON i.categorie_id = c.id
        WHERE i.actif = 1
          AND i.date_expiration IS NOT NULL
          AND i.date_expiration < CURDATE()
        ORDER BY i.date_expiration DESC
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtenir le taux de publication (informations publiées vs brouillons)
   */
  async getPublicationRate(): Promise<{ total: number; publiees: number; brouillons: number; taux: number }> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status_id = (SELECT id FROM status WHERE nom = 'Publié' LIMIT 1) THEN 1 ELSE 0 END) as publiees,
          SUM(CASE WHEN status_id = (SELECT id FROM status WHERE nom = 'Brouillon' LIMIT 1) THEN 1 ELSE 0 END) as brouillons
        FROM informations
        WHERE actif = 1
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0) {
          resolve({ total: 0, publiees: 0, brouillons: 0, taux: 0 });
        } else {
          const stats = results[0];
          const total = stats.total || 0;
          const publiees = stats.publiees || 0;
          const brouillons = stats.brouillons || 0;
          const taux = total > 0 ? (publiees / total) * 100 : 0;

          resolve({
            total,
            publiees,
            brouillons,
            taux: Math.round(taux * 100) / 100,
          });
        }
      });
    });
  }

  /**
   * Obtenir les tags les plus utilisés
   */
  async getTopTags(limit: number = 20): Promise<Array<{ tag: string; count: number }>> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          JSON_UNQUOTE(JSON_EXTRACT(tags, CONCAT('$[', numbers.n, ']'))) as tag,
          COUNT(*) as count
        FROM informations
        CROSS JOIN (
          SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
          UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
          UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
          UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
        ) numbers
        WHERE actif = 1
          AND tags IS NOT NULL
          AND JSON_TYPE(tags) = 'ARRAY'
          AND JSON_LENGTH(tags) > numbers.n
        GROUP BY tag
        HAVING tag IS NOT NULL AND tag != 'null'
        ORDER BY count DESC
        LIMIT ?
      `;

      this.mysqlConnector.query(query, [limit], (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(results.map((row: any) => ({
            tag: row.tag,
            count: row.count,
          })));
        }
      });
    });
  }

  /**
   * Obtenir la durée moyenne de vie des informations
   */
  async getAverageLifespan(): Promise<{ moyenne_jours: number }> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          AVG(DATEDIFF(
            COALESCE(date_expiration, CURDATE()),
            date_publication
          )) as moyenne_jours
        FROM informations
        WHERE actif = 1
          AND date_publication IS NOT NULL
      `;

      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          reject(error);
        } else if (results.length === 0 || results[0].moyenne_jours === null) {
          resolve({ moyenne_jours: 0 });
        } else {
          resolve({
            moyenne_jours: Math.round(results[0].moyenne_jours * 100) / 100,
          });
        }
      });
    });
  }

  /**
   * Obtenir les statistiques par période
   */
  async getStatsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    publiees: number;
    brouillons: number;
    prioritaires: number;
    par_categorie: Array<{ categorie_nom: string; count: number }>;
  }> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status_id = (SELECT id FROM status WHERE nom = 'Publié' LIMIT 1) THEN 1 ELSE 0 END) as publiees,
          SUM(CASE WHEN status_id = (SELECT id FROM status WHERE nom = 'Brouillon' LIMIT 1) THEN 1 ELSE 0 END) as brouillons,
          SUM(CASE WHEN prioritaire = 1 THEN 1 ELSE 0 END) as prioritaires
        FROM informations
        WHERE actif = 1
          AND created_at BETWEEN ? AND ?
      `;

      this.mysqlConnector.query(query, [startDate, endDate], (error, mainResults) => {
        if (error) {
          reject(error);
          return;
        }

        const categorieQuery = `
          SELECT
            c.nom as categorie_nom,
            COUNT(*) as count
          FROM informations i
          LEFT JOIN categories_informations c ON i.categorie_id = c.id
          WHERE i.actif = 1
            AND i.created_at BETWEEN ? AND ?
          GROUP BY c.nom
          ORDER BY count DESC
        `;

        this.mysqlConnector.query(categorieQuery, [startDate, endDate], (error, categorieResults) => {
          if (error) {
            reject(error);
          } else {
            const stats = mainResults[0] || {};
            resolve({
              total: stats.total || 0,
              publiees: stats.publiees || 0,
              brouillons: stats.brouillons || 0,
              prioritaires: stats.prioritaires || 0,
              par_categorie: categorieResults.map((row: any) => ({
                categorie_nom: row.categorie_nom,
                count: row.count,
              })),
            });
          }
        });
      });
    });
  }

  // ============================================================================
  // RAPPORTS ET EXPORTS
  // ============================================================================

  /**
   * Générer un rapport complet des statistiques
   */
  async generateFullReport(): Promise<{
    general: InformationStatistiques;
    par_statut: Array<{ status_id: number; status_nom: string; count: number }>;
    par_categorie: Array<{ categorie_id: number; categorie_nom: string; count: number }>;
    par_auteur: Array<{ auteur_id: number; auteur_nom: string; count: number }>;
    taux_publication: { total: number; publiees: number; brouillons: number; taux: number };
    tendances_30j: InformationTrend[];
    duree_moyenne_vie: { moyenne_jours: number };
    top_tags: Array<{ tag: string; count: number }>;
  }> {
    try {
      const [
        general,
        par_statut,
        par_categorie,
        par_auteur,
        taux_publication,
        tendances_30j,
        duree_moyenne_vie,
        top_tags,
      ] = await Promise.all([
        this.getGeneralStatistics(),
        this.getCountByStatus(),
        this.getCountByCategorie(),
        this.getCountByAuteur(10),
        this.getPublicationRate(),
        this.getTrends(30),
        this.getAverageLifespan(),
        this.getTopTags(20),
      ]);

      return {
        general,
        par_statut,
        par_categorie,
        par_auteur,
        taux_publication,
        tendances_30j,
        duree_moyenne_vie,
        top_tags,
      };
    } catch (error) {
      throw error;
    }
  }
}

// Singleton
let statisticsRepositoryInstance: InformationsStatisticsRepository | null = null;

export function getInformationsStatisticsRepository(): InformationsStatisticsRepository {
  if (!statisticsRepositoryInstance) {
    statisticsRepositoryInstance = new InformationsStatisticsRepository();
  }
  return statisticsRepositoryInstance;
}
