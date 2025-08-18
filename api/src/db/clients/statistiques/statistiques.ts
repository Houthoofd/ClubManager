import MysqlConnector from '../../connector/mysqlconnector.js';
import type {
  StatistiquesFrequentation,
  FrequentationParCours,
  FrequentationParMois,
  StatistiquesProgressionUtilisateur,
  ProgressionParCours,
} from '@clubmanager/types';

interface PresenceParMois {
  last_name: string;
  first_name: string;
  mois: number;
  nom_mois: string;
  type_cours: string;
  total_presences: number;
}

interface PresenceFormatee {
  [mois: string]: {
    [type_cours: string]: number;
  };
}

interface StatistiquesFrequentationUtilisateur {
  totalFrequentation: number;
  frequentationParMois: FrequentationParMois[];
}


export class Statistiques {
  /**
   * Obtient les statistiques de fréquentation pour un utilisateur spécifique
   */
  async obtenirStatistiquesFrequentation(utilisateurId: number): Promise<StatistiquesFrequentationUtilisateur> {
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

      const results = await this.executerRequete<any[]>(
        mysqlConnector,
        query,
        [utilisateurId, utilisateurId],
        (rows) => rows
      );

      // On extrait le totalFrequentation du premier résultat (identique pour chaque ligne)
      const totalFrequentation = results.length > 0 ? Number(results[0].totalFrequentation) : 0;
      const frequentationParMois = results.map((row: any) => ({
        mois: row.mois,
        frequentation: Number(row.frequentation),
        nombres_total_de_cours_du_mois: Number(row.nombres_total_de_cours_du_mois),
        pourcentage_de_cours_valides: Number(row.pourcentage_de_cours_valides)
      }));

      return {
        totalFrequentation,
        frequentationParMois
      };
    } catch (error) {
      console.error(`Erreur lors de l'obtention des statistiques pour l'utilisateur ${utilisateurId}:`, error);
      throw error;
    } finally {
      mysqlConnector.close();
    }
  }

  /**
   * Exécute une requête SQL et retourne le résultat transformé
   */
  private async executerRequete<T>(
    connector: MysqlConnector,
    query: string,
    params: any[],
    transformer: (results: any) => T,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      connector.query(query, params, (error, results) => {
        if (error) {
          reject(error);
        } else {
          resolve(transformer(results));
        }
      });
    });
  }

  /**
   * Obtient les statistiques de progression pour un utilisateur spécifique
   */
  async obtenirProgressionUtilisateur(utilisateurId: number): Promise<StatistiquesProgressionUtilisateur> {
    const mysqlConnector = new MysqlConnector();
    try {
      const [coursSuivis, progression] = await Promise.all([
        this.executerRequete<number>(
          mysqlConnector,
          `SELECT COUNT(*) as total FROM inscriptions WHERE utilisateur_id = ? AND status_id = 1;`,
          [utilisateurId],
          (results) => Number(results[0].total),
        ),
        this.executerRequete<ProgressionParCours[]>(
          mysqlConnector,
          `
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
          `,
          [utilisateurId],
          (results) => results as ProgressionParCours[],
        ),
      ]);

      let niveauActuel = 'Débutant';
      if (coursSuivis > 30) niveauActuel = 'Avancé';
      else if (coursSuivis > 10) niveauActuel = 'Intermédiaire';

      return {
        utilisateur_id: utilisateurId,
        coursSuivis,
        progressionParCours: progression,
        niveauActuel,
      };
    } catch (error) {
      console.error(`Erreur lors de l'obtention de la progression pour l'utilisateur ${utilisateurId}:`, error);
      throw error;
    } finally {
      mysqlConnector.close();
    }
  }

  /**
   * Obtient les présences par mois pour un utilisateur
   */
  async obtenirPresenceParMois(userId: number): Promise<PresenceParMois[]> {
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
      return this.executerRequete<PresenceParMois[]>(
        mysqlConnector,
        query,
        [userId],
        (results) => results as PresenceParMois[],
      );
    } catch (error) {
      console.error(`Erreur lors de la récupération des présences pour l'utilisateur ${userId}:`, error);
      throw error;
    } finally {
      mysqlConnector.close();
    }
  }

  /**
   * Obtient les présences non validées par mois pour un utilisateur
   */
  async obtenirPresencesNonValideesParMois(userId: number): Promise<PresenceParMois[]> {
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
      return this.executerRequete<PresenceParMois[]>(
        mysqlConnector,
        query,
        [userId],
        (results) => results as PresenceParMois[],
      );
    } catch (error) {
      console.error(`Erreur lors de la récupération des présences non validées pour l'utilisateur ${userId}:`, error);
      throw error;
    } finally {
      mysqlConnector.close();
    }
  }

  /**
   * Obtient les statistiques de fréquentation par mois pour tous les utilisateurs
   */
  async obtenirStatistiquesPresenceParMois(): Promise<FrequentationParMois[]> {
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
      return this.executerRequete<FrequentationParMois[]>(
        mysqlConnector,
        query,
        [],
        (results) => results as FrequentationParMois[],
      );
    } catch (error) {
      console.error("Erreur lors de l'obtention des statistiques de présence par mois:", error);
      throw error;
    } finally {
      mysqlConnector.close();
    }
  }

  /**
   * Formate les résultats de présence pour affichage graphique
   */
  formatPresenceData(data: PresenceParMois[]): PresenceFormatee {
    const formatted: PresenceFormatee = {};
    data.forEach((item) => {
      const { nom_mois, type_cours, total_presences } = item;
      if (!formatted[nom_mois]) {
        formatted[nom_mois] = {};
      }
      formatted[nom_mois][type_cours] = total_presences;
    });
    return formatted;
  }
}
