import { ConfirmationResult, StatistiquesFrequentation } from '@clubmanager/types';
import MysqlConnector from '../../connector/mysqlconnector.js';
import mysql from 'mysql';

export class Statistiques {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  obtenirStatistiquesGenerales(): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM utilisateurs WHERE status_id = 1) as total_utilisateurs,
          (SELECT COUNT(*) FROM cours WHERE date_cours >= CURDATE()) as cours_a_venir,
          (SELECT COUNT(*) FROM inscriptions i JOIN cours c ON i.cours_id = c.id WHERE c.date_cours >= CURDATE()) as total_inscriptions,
          (SELECT COUNT(*) FROM professeurs WHERE status_id = 5) as total_professeurs
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des statistiques générales :', error);
          reject(error);
        } else {
          resolve(results[0]);
        }
      });
    });
  }

  obtenirStatistiquesParCours(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          c.type_cours,
          COUNT(i.id) as nombre_inscriptions,
          AVG(i.status_id) as taux_presence
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.date_cours >= CURDATE()
        GROUP BY c.type_cours
        ORDER BY nombre_inscriptions DESC
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des statistiques par cours :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  obtenirStatistiquesPresence(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          DATE(c.date_cours) as date_cours,
          c.type_cours,
          COUNT(i.id) as total_inscrits,
          SUM(CASE WHEN i.status_id = 1 THEN 1 ELSE 0 END) as presents
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.date_cours >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(c.date_cours), c.type_cours
        ORDER BY date_cours DESC
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des statistiques de présence :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtient les statistiques de fréquentation pour un utilisateur spécifique
   */
  async obtenirStatistiquesFrequentation(utilisateurId: number): Promise<any> {
    console.log('[Statistiques] obtenirStatistiquesFrequentation - utilisateurId:', utilisateurId);
    return new Promise((resolve, reject) => {
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
      console.log('[Statistiques] Query:', query);
      this.mysqlConnector.query(query, [utilisateurId, utilisateurId], (error, results) => {
        if (error) {
          console.error('[Statistiques] Erreur SQL:', error);
          reject(error);
        } else {
          console.log('[Statistiques] Résultats SQL:', results);
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtient les statistiques de progression pour un utilisateur spécifique
   */
  async obtenirProgressionUtilisateur(utilisateurId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          c.id as cours_id,
          c.type_cours as titre,
          COUNT(i.id) as cours_suivis,
          (COUNT(i.id) * 100 / (
            SELECT COUNT(*) FROM cours WHERE cours_recurrent_id = c.cours_recurrent_id
          )) as progression
        FROM cours c
        JOIN inscriptions i ON c.id = i.cours_id AND i.utilisateur_id = ? AND i.status_id = 1
        GROUP BY c.id, c.type_cours, c.cours_recurrent_id
      `;
      this.mysqlConnector.query(sql, [utilisateurId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération de la progression :', error);
          reject(error);
        } else {
          const coursSuivis = results.reduce((total: number, cours: any) => total + cours.cours_suivis, 0);
          let niveauActuel = 'Débutant';
          if (coursSuivis > 30) niveauActuel = 'Avancé';
          else if (coursSuivis > 10) niveauActuel = 'Intermédiaire';

          resolve({
            utilisateur_id: utilisateurId,
            coursSuivis,
            progressionParCours: results,
            niveauActuel
          });
        }
      });
    });
  }

  /**
   * Obtient les présences par mois pour un utilisateur
   */
  async obtenirPresenceParMois(userId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
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
      this.mysqlConnector.query(query, [userId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des présences par mois :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtient les présences non validées par mois pour un utilisateur
   */
  async obtenirPresencesNonValideesParMois(userId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
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
        WHERE i.status_id = 0
          AND i.utilisateur_id = ?
        GROUP BY u.last_name, u.first_name, mois, c.type_cours
        ORDER BY u.last_name, u.first_name, mois, c.type_cours;
      `;
      this.mysqlConnector.query(query, [userId], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des présences non validées :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtient les statistiques de fréquentation par mois pour tous les utilisateurs
   */
  async obtenirStatistiquesPresenceParMois(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          MONTH(c.date_cours) as mois,
          MONTHNAME(c.date_cours) as nom_mois,
          COUNT(i.id) as total_inscriptions,
          SUM(CASE WHEN i.status_id = 1 THEN 1 ELSE 0 END) as presences_validees
        FROM cours c
        LEFT JOIN inscriptions i ON c.id = i.cours_id
        WHERE c.date_cours >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY MONTH(c.date_cours), MONTHNAME(c.date_cours)
        ORDER BY mois
      `;
      this.mysqlConnector.query(query, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des statistiques de présence par mois :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtient le nombre total de membres actifs
   */
  async getNombreMembres(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM utilisateurs WHERE status_id IN (1,2,3,4,5)`;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération du nombre de membres :', error);
          reject(error);
        } else {
          resolve(results[0]?.count ?? 0);
        }
      });
    });
  }

  /**
   * Obtient le montant total des paiements du mois en cours
   */
  async getTotalPaiementsMois(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COALESCE(SUM(montant), 0) AS total
        FROM paiements
        WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE())
          AND YEAR(date_paiement) = YEAR(CURRENT_DATE())
          AND statut = 'confirmé'
      `;
      this.mysqlConnector.query(sql, [], (error: mysql.MysqlError | null, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération du total des paiements :', error.message);
          reject(error);
        } else {
          resolve(results[0].total);
        }
      });
    });
  }

  /**
   * Obtient le nombre de paiements récents (effectués au cours des 7 derniers jours)
   */
  async getPaiementsRecents(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) AS count
        FROM paiements
        WHERE date_paiement >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
          AND statut = 'confirmé'
      `;
      this.mysqlConnector.query(sql, [], (error: mysql.MysqlError | null, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération des paiements récents :', error.message);
          reject(error);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }

  /**
   * Obtient le nombre de paiements en attente
   */
  async getPaiementsEnAttente(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) AS count
        FROM paiements
        WHERE statut = 'en attente'
      `;
      this.mysqlConnector.query(sql, [], (error: mysql.MysqlError | null, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération des paiements en attente :', error.message);
          reject(error);
        } else {
          resolve(results[0].count);
        }
      });
    });
  }

  /**
   * Obtient le nombre total de plans actifs
   */
  async getPlansActifs(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `SELECT COUNT(*) AS count FROM plans_tarifaires`;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération du nombre de plans actifs :', error);
          reject(error);
        } else {
          resolve(results[0]?.count ?? 0);
        }
      });
    });
  }

  /**
   * Obtient le taux de renouvellement des abonnements
   */
  async getTauxRenouvellement(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT
          ROUND(
            (SELECT COUNT(*) FROM paiements WHERE statut = 'validé' AND periode_fin >= CURRENT_DATE()) * 100.0 /
            NULLIF((SELECT COUNT(*) FROM paiements WHERE periode_fin >= CURRENT_DATE()), 0), 2
          ) AS taux
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération du taux de renouvellement :', error);
          reject(error);
        } else {
          resolve(results[0]?.taux ?? 0);
        }
      });
    });
  }

  /**
   * Obtient les paiements par mois (12 derniers mois)
   */
  async getPaiementsParMois(): Promise<{ mois: string, total: number }[]> {
    return new Promise((resolve, reject) => {
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
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des paiements par mois :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Obtient le nombre de membres par plan
   */
  async getMembresParPlan(): Promise<{ plan: string, value: number }[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT pt.nom_plan AS plan, COUNT(u.id) AS value
        FROM utilisateurs u
        JOIN plans_tarifaires pt ON u.abonnement_id = pt.id
        WHERE u.status_id IN (1,2,3,4,5)
        GROUP BY pt.nom_plan
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération du nombre de membres par plan :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  async getDerniersPaiements(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT p.*, u.nom_utilisateur
        FROM paiements p
        JOIN utilisateurs u ON p.utilisateur_id = u.id
        WHERE p.statut = 'confirmé'
        ORDER BY p.date_paiement DESC
        LIMIT 10
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des derniers paiements :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  async getPaiementsEchus(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(*) AS count
        FROM echeances_paiements ep
        JOIN utilisateurs u ON ep.utilisateur_id = u.id
        WHERE ep.date_echeance < CURRENT_DATE()
          AND ep.statut = 'en_attente'
      `;
      this.mysqlConnector.query(sql, [], (error: mysql.MysqlError | null, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération des paiements échus :', error.message);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  async getNouveauxMembres(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.first_name, u.last_name, u.date_inscription
        FROM utilisateurs u
        WHERE u.date_inscription >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        ORDER BY u.date_inscription DESC
        LIMIT 10
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des nouveaux membres :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Top 5 membres les plus assidus (présences validées)
   */
  async getTopMembresAssidus(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT u.first_name, u.last_name, COUNT(i.id) AS total_presences_validees
        FROM utilisateurs u
        LEFT JOIN inscriptions i ON u.id = i.utilisateur_id AND i.status_id = 1
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY total_presences_validees DESC
        LIMIT 5
      `;
      this.mysqlConnector.query(sql, [], (error: mysql.MysqlError | null, results: any[]) => {
        if (error) {
          console.error('Erreur lors de la récupération des membres les plus assidus :', error.message);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Répartition des membres par grade
   */
  async getMembresParGrade(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT g.grade_id, COUNT(u.id) AS count
        FROM utilisateurs u
        JOIN grades g ON u.grade_id = g.id
        GROUP BY g.grade_id
        ORDER BY count DESC
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des membres par grade :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Répartition des membres par genre
   */
  async getMembresParGenre(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT ge.genre_name, COUNT(u.id) AS count
        FROM utilisateurs u
        JOIN genres ge ON u.genre_id = ge.id
        GROUP BY ge.genre_name
        ORDER BY count DESC
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des membres par genre :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Prochains anniversaires des membres (dans les 30 jours)
   */
  async getProchainsAnniversaires(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT first_name, last_name, date_of_birth
        FROM utilisateurs
        WHERE
          DATE_FORMAT(date_of_birth, '%m-%d') BETWEEN DATE_FORMAT(CURRENT_DATE(), '%m-%d')
          AND DATE_FORMAT(DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY), '%m-%d')
        ORDER BY DATE_FORMAT(date_of_birth, '%m-%d')
        LIMIT 10
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des prochains anniversaires :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Articles les plus vendus
   */
  async getArticlesPlusVendus(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT a.nom, SUM(ca.quantite) AS total_vendu
        FROM commande_articles ca
        JOIN articles a ON ca.article_id = a.id
        GROUP BY a.nom
        ORDER BY total_vendu DESC
        LIMIT 10
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des articles les plus vendus :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }

  /**
   * Nombre de cours à venir cette semaine
   */
  async getCoursSemaine(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT COUNT(*) AS count
        FROM cours
        WHERE WEEK(date_cours, 1) = WEEK(CURRENT_DATE(), 1)
          AND YEAR(date_cours) = YEAR(CURRENT_DATE())
          AND date_cours >= CURRENT_DATE()
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des cours de la semaine :', error);
          reject(error);
        } else {
          resolve(results[0]?.count ?? 0);
        }
      });
    });
  }

  obtenirEvolutionInscriptions(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          DATE(i.date_inscription) as date_inscription,
          COUNT(*) as nouvelles_inscriptions
        FROM inscriptions i
        JOIN cours c ON i.cours_id = c.id
        WHERE i.date_inscription >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        GROUP BY DATE(i.date_inscription)
        ORDER BY date_inscription ASC
      `;
      this.mysqlConnector.query(sql, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération de l\'évolution des inscriptions :', error);
          reject(error);
        } else {
          resolve(results);
        }
      });
    });
  }
}
