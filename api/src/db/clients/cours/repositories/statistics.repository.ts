/**
 * Repository des STATISTIQUES pour le module Cours
 * Responsabilité: Calcul et récupération des statistiques de présence
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  StatistiquesPresenceCours,
  StatistiquesPresenceUtilisateur,
} from '../types.js';

/**
 * Repository pour les statistiques des cours
 */
export class CoursStatisticsRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ============================================================================
  // STATISTIQUES PAR COURS
  // ============================================================================

  /**
   * Obtenir les statistiques de présence pour un cours
   */
  async getStatistiquesPresenceCours(coursId: number): Promise<StatistiquesPresenceCours | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          c.id AS cours_id,
          c.type_cours,
          c.date_cours,
          COUNT(i.id) AS total_inscrits,
          SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS presents,
          SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS absents,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.id = ?
        GROUP BY c.id, c.type_cours, c.date_cours
      `;

      this.mysqlConnector.query(
        sql,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getStatistiquesPresenceCours:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const stats = results[0];
            resolve({
              cours_id: stats.cours_id,
              type_cours: stats.type_cours,
              date_cours: stats.date_cours,
              total_inscrits: stats.total_inscrits || 0,
              presents: stats.presents || 0,
              absents: stats.absents || 0,
              taux_presence: stats.taux_presence || 0,
            });
          }
        }
      );
    });
  }

  /**
   * Obtenir les statistiques pour tous les cours
   */
  async getStatistiquesGlobales(): Promise<StatistiquesPresenceCours[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          c.id AS cours_id,
          c.type_cours,
          c.date_cours,
          COUNT(i.id) AS total_inscrits,
          SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS presents,
          SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS absents,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.actif = 1
        GROUP BY c.id, c.type_cours, c.date_cours
        ORDER BY c.date_cours DESC
      `;

      this.mysqlConnector.query(
        sql,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getStatistiquesGlobales:', error);
            reject(error);
          } else {
            const stats = results.map((row) => ({
              cours_id: row.cours_id,
              type_cours: row.type_cours,
              date_cours: row.date_cours,
              total_inscrits: row.total_inscrits || 0,
              presents: row.presents || 0,
              absents: row.absents || 0,
              taux_presence: row.taux_presence || 0,
            }));
            resolve(stats);
          }
        }
      );
    });
  }

  // ============================================================================
  // STATISTIQUES PAR UTILISATEUR
  // ============================================================================

  /**
   * Obtenir les statistiques de présence pour un utilisateur
   */
  async getStatistiquesPresenceUtilisateur(
    utilisateurId: number
  ): Promise<StatistiquesPresenceUtilisateur | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          u.id AS utilisateur_id,
          u.last_name AS nom,
          u.first_name AS prenom,
          COUNT(i.id) AS total_cours_inscrits,
          SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS cours_assistes,
          SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS cours_manques,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence
        FROM utilisateurs u
        LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
        WHERE u.id = ?
        GROUP BY u.id, u.last_name, u.first_name
      `;

      this.mysqlConnector.query(
        sql,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getStatistiquesPresenceUtilisateur:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const stats = results[0];
            resolve({
              utilisateur_id: stats.utilisateur_id,
              nom: stats.nom,
              prenom: stats.prenom,
              total_cours_inscrits: stats.total_cours_inscrits || 0,
              cours_assistes: stats.cours_assistes || 0,
              cours_manques: stats.cours_manques || 0,
              taux_presence: stats.taux_presence || 0,
            });
          }
        }
      );
    });
  }

  /**
   * Obtenir les statistiques pour tous les utilisateurs
   */
  async getStatistiquesTousUtilisateurs(): Promise<StatistiquesPresenceUtilisateur[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          u.id AS utilisateur_id,
          u.last_name AS nom,
          u.first_name AS prenom,
          COUNT(i.id) AS total_cours_inscrits,
          SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS cours_assistes,
          SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS cours_manques,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence
        FROM utilisateurs u
        LEFT JOIN inscriptions i ON u.id = i.utilisateur_id
        WHERE u.status_id = 1
        GROUP BY u.id, u.last_name, u.first_name
        HAVING COUNT(i.id) > 0
        ORDER BY taux_presence DESC, u.last_name ASC
      `;

      this.mysqlConnector.query(
        sql,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getStatistiquesTousUtilisateurs:', error);
            reject(error);
          } else {
            const stats = results.map((row) => ({
              utilisateur_id: row.utilisateur_id,
              nom: row.nom,
              prenom: row.prenom,
              total_cours_inscrits: row.total_cours_inscrits || 0,
              cours_assistes: row.cours_assistes || 0,
              cours_manques: row.cours_manques || 0,
              taux_presence: row.taux_presence || 0,
            }));
            resolve(stats);
          }
        }
      );
    });
  }

  // ============================================================================
  // STATISTIQUES PAR TYPE DE COURS
  // ============================================================================

  /**
   * Obtenir les statistiques par type de cours
   */
  async getStatistiquesParTypeCours(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          c.type_cours,
          COUNT(DISTINCT c.id) AS nombre_cours,
          COUNT(i.id) AS total_inscriptions,
          SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presents,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence_moyen
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.actif = 1
        GROUP BY c.type_cours
        ORDER BY nombre_cours DESC
      `;

      this.mysqlConnector.query(
        sql,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getStatistiquesParTypeCours:', error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  // ============================================================================
  // STATISTIQUES PAR JOUR DE LA SEMAINE
  // ============================================================================

  /**
   * Obtenir les statistiques par jour de la semaine
   */
  async getStatistiquesParJourSemaine(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          c.jour_semaine,
          CASE c.jour_semaine
            WHEN 0 THEN 'Dimanche'
            WHEN 1 THEN 'Lundi'
            WHEN 2 THEN 'Mardi'
            WHEN 3 THEN 'Mercredi'
            WHEN 4 THEN 'Jeudi'
            WHEN 5 THEN 'Vendredi'
            WHEN 6 THEN 'Samedi'
          END AS jour_nom,
          COUNT(DISTINCT c.id) AS nombre_cours,
          COUNT(i.id) AS total_inscriptions,
          AVG(c.capacite_max) AS capacite_moyenne,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence_moyen
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.actif = 1
        GROUP BY c.jour_semaine
        ORDER BY c.jour_semaine
      `;

      this.mysqlConnector.query(
        sql,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getStatistiquesParJourSemaine:', error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  // ============================================================================
  // TAUX DE PRÉSENCE MOYEN
  // ============================================================================

  /**
   * Obtenir le taux de présence moyen global
   */
  async getTauxPresenceMoyen(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence_moyen
        FROM inscriptions i
        INNER JOIN cours c ON i.cours_id = c.id
        WHERE c.actif = 1
      `;

      this.mysqlConnector.query(
        sql,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getTauxPresenceMoyen:', error);
            reject(error);
          } else {
            resolve(results[0]?.taux_presence_moyen || 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // COURS LES PLUS POPULAIRES
  // ============================================================================

  /**
   * Obtenir les cours les plus populaires (par nombre d'inscriptions)
   */
  async getCoursPlusPopulaires(limit: number = 10): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          c.id AS cours_id,
          c.type_cours,
          c.date_cours,
          c.heure_debut,
          c.heure_fin,
          COUNT(i.id) AS nombre_inscrits,
          c.capacite_max,
          ROUND((COUNT(i.id) / c.capacite_max) * 100, 2) AS taux_remplissage
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.actif = 1
        GROUP BY c.id, c.type_cours, c.date_cours, c.heure_debut, c.heure_fin, c.capacite_max
        ORDER BY nombre_inscrits DESC
        LIMIT ?
      `;

      this.mysqlConnector.query(
        sql,
        [limit],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getCoursPlusPopulaires:', error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  // ============================================================================
  // UTILISATEURS LES PLUS ASSIDUS
  // ============================================================================

  /**
   * Obtenir les utilisateurs les plus assidus
   */
  async getUtilisateursAssidus(limit: number = 10): Promise<StatistiquesPresenceUtilisateur[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          u.id AS utilisateur_id,
          u.last_name AS nom,
          u.first_name AS prenom,
          COUNT(i.id) AS total_cours_inscrits,
          SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS cours_assistes,
          SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS cours_manques,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence
        FROM utilisateurs u
        INNER JOIN inscriptions i ON u.id = i.utilisateur_id
        WHERE u.status_id = 1
        GROUP BY u.id, u.last_name, u.first_name
        HAVING COUNT(i.id) >= 5
        ORDER BY taux_presence DESC, cours_assistes DESC
        LIMIT ?
      `;

      this.mysqlConnector.query(
        sql,
        [limit],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getUtilisateursAssidus:', error);
            reject(error);
          } else {
            const stats = results.map((row) => ({
              utilisateur_id: row.utilisateur_id,
              nom: row.nom,
              prenom: row.prenom,
              total_cours_inscrits: row.total_cours_inscrits || 0,
              cours_assistes: row.cours_assistes || 0,
              cours_manques: row.cours_manques || 0,
              taux_presence: row.taux_presence || 0,
            }));
            resolve(stats);
          }
        }
      );
    });
  }

  // ============================================================================
  // COMPTAGES
  // ============================================================================

  /**
   * Compter le nombre total de cours
   */
  async countTotalCours(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        'SELECT COUNT(*) AS total FROM cours WHERE actif = 1',
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in countTotalCours:', error);
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  /**
   * Compter le nombre total de participants uniques
   */
  async countTotalParticipants(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        'SELECT COUNT(DISTINCT utilisateur_id) AS total FROM inscriptions',
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in countTotalParticipants:', error);
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  /**
   * Compter le nombre de cours par semaine
   */
  async countCoursParSemaine(weekNumber: number, year: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        `SELECT COUNT(*) AS total
         FROM cours
         WHERE WEEK(date_cours, 1) = ?
           AND YEAR(date_cours) = ?
           AND actif = 1`,
        [weekNumber, year],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in countCoursParSemaine:', error);
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // STATISTIQUES PAR PÉRIODE
  // ============================================================================

  /**
   * Obtenir les statistiques pour une période donnée
   */
  async getStatistiquesPeriode(dateDebut: Date | string, dateFin: Date | string): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          COUNT(DISTINCT c.id) AS nombre_cours,
          COUNT(DISTINCT i.utilisateur_id) AS nombre_participants,
          COUNT(i.id) AS total_inscriptions,
          SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) AS total_presents,
          SUM(CASE WHEN i.present = 0 THEN 1 ELSE 0 END) AS total_absents,
          CASE
            WHEN COUNT(i.id) > 0 THEN
              ROUND((SUM(CASE WHEN i.present = 1 THEN 1 ELSE 0 END) / COUNT(i.id)) * 100, 2)
            ELSE 0
          END AS taux_presence_moyen
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.date_cours BETWEEN ? AND ?
          AND c.actif = 1
      `;

      this.mysqlConnector.query(
        sql,
        [dateDebut, dateFin],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursStatisticsRepository] Error in getStatistiquesPeriode:', error);
            reject(error);
          } else {
            resolve(results[0] || {});
          }
        }
      );
    });
  }
}
