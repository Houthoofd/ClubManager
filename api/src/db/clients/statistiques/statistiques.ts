import MysqlConnector from '../../connector/mysqlconnector.js';
import type {
  StatistiquesFrequentation,
  FrequentationParCours,
  FrequentationParMois,
  StatistiquesProgressionUtilisateur,
  ProgressionParCours
} from '@clubmanager/types';

export class Statistiques {
  /**
   * Obtient les statistiques de fréquentation globales
   * @returns Les statistiques de fréquentation
   */
  async obtenirStatistiquesFrequentation(): Promise<StatistiquesFrequentation> {
    const mysqlConnector = new MysqlConnector();
    try {
      // Obtenir le total de la fréquentation
      const totalQuery = `
        SELECT COUNT(*) as total
        FROM utilisateur_cours
        WHERE status_id = 3; -- Status 3 = présence validée
      `;
      
      // Obtenir la fréquentation par cours
      const parCoursQuery = `
        SELECT c.id as cours_id, c.titre, COUNT(uc.utilisateur_id) as frequentation
        FROM cours c
        LEFT JOIN utilisateur_cours uc ON c.id = uc.cours_id AND uc.status_id = 3
        GROUP BY c.id, c.titre
        ORDER BY frequentation DESC;
      `;
      
      // Obtenir la fréquentation par mois
      const parMoisQuery = `
        SELECT 
          MONTHNAME(c.date) as mois, 
          COUNT(uc.utilisateur_id) as frequentation
        FROM cours c
        LEFT JOIN utilisateur_cours uc ON c.id = uc.cours_id AND uc.status_id = 3
        GROUP BY MONTH(c.date), mois
        ORDER BY MONTH(c.date);
      `;
      
      const totalResult = await new Promise<number>((resolve, reject) => {
        mysqlConnector.query(totalQuery, [], (error, results) => {
          if (error) reject(error);
          else resolve(Number(results[0].total));
        });
      });

      const parCoursResult = await new Promise<FrequentationParCours[]>((resolve, reject) => {
        mysqlConnector.query(parCoursQuery, [], (error, results) => {
          if (error) reject(error);
          else resolve(results as FrequentationParCours[]);
        });
      });

      const parMoisResult = await new Promise<FrequentationParMois[]>((resolve, reject) => {
        mysqlConnector.query(parMoisQuery, [], (error, results) => {
          if (error) reject(error);
          else resolve(results as FrequentationParMois[]);
        });
      });
      
      return {
        totalFrequentation: totalResult,
        frequentationParCours: parCoursResult,
        frequentationParMois: parMoisResult
      };
    } catch (error) {
      console.error("Erreur lors de l'obtention des statistiques:", error);
      throw error;
    } finally {
      mysqlConnector.close();
    }
  }
  
  /**
   * Obtient les statistiques de progression pour un utilisateur spécifique
   * @param utilisateurId - L'ID de l'utilisateur
   * @returns Les statistiques de progression de l'utilisateur
   */
  async obtenirProgressionUtilisateur(utilisateurId: number): Promise<StatistiquesProgressionUtilisateur> {
    const mysqlConnector = new MysqlConnector();
    
    try {
      // Nombre total de cours suivis
      const coursSuivisQuery = `
        SELECT COUNT(*) as total
        FROM utilisateur_cours
        WHERE utilisateur_id = ? AND status_id = 3;
      `;
      
      // Progression par cours
      const progressionQuery = `
        SELECT 
          c.id as cours_id, 
          c.titre,
          COUNT(uc.id) as cours_suivis,
          (COUNT(uc.id) * 100 / (
            SELECT COUNT(*) FROM cours WHERE cours_parent_id = c.cours_parent_id
          )) as progression
        FROM cours c
        JOIN utilisateur_cours uc ON c.id = uc.cours_id AND uc.utilisateur_id = ? AND uc.status_id = 3
        GROUP BY c.id, c.titre, c.cours_parent_id;
      `;
      
      const coursSuivisResult = await new Promise<number>((resolve, reject) => {
        mysqlConnector.query(coursSuivisQuery, [utilisateurId], (error, results) => {
          if (error) reject(error);
          else resolve(Number(results[0].total));
        });
      });

      const progressionResult = await new Promise<ProgressionParCours[]>((resolve, reject) => {
        mysqlConnector.query(progressionQuery, [utilisateurId], (error, results) => {
          if (error) reject(error);
          else resolve(results as ProgressionParCours[]);
        });
      });
      
      // Niveau actuel (basé sur le nombre de cours suivis)
      let niveauActuel = 'Débutant';
      if (coursSuivisResult > 30) niveauActuel = 'Avancé';
      else if (coursSuivisResult > 10) niveauActuel = 'Intermédiaire';
      
      return {
        utilisateur_id: utilisateurId,
        coursSuivis: coursSuivisResult,
        progressionParCours: progressionResult,
        niveauActuel
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
   * @param userId - L'ID de l'utilisateur
   * @returns Les données de présence par mois
   */
  async obtenirPresenceParMois(userId: number) {
    const mysqlConnector = new MysqlConnector();
    
    try {
      const query = `
        SELECT 
          MONTH(c.date) as mois,
          YEAR(c.date) as annee,
          COUNT(*) as nombre_presences
        FROM utilisateur_cours uc
        JOIN cours c ON uc.cours_id = c.id
        WHERE uc.utilisateur_id = ? AND uc.status_id = 3
        GROUP BY YEAR(c.date), MONTH(c.date)
        ORDER BY annee, mois;
      `;
      
      return new Promise((resolve, reject) => {
        mysqlConnector.query(query, [userId], (error, results) => {
          if (error) {
            console.error(`Erreur lors de la récupération des présences pour l'utilisateur ${userId}:`, error);
            reject(error);
          } else {
            resolve(results);
          }
          mysqlConnector.close();
        });
      });
    } catch (error) {
      console.error(`Erreur générale lors de la récupération des présences:`, error);
      throw error;
    }
  }
  
  /**
   * Formate les données de présence pour l'affichage
   * @param data - Les données brutes de présence par mois
   * @returns Les données formatées
   */
  formatPresenceData(data: any[]) {
    const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    // Transformer les données en un format adapté pour les graphiques
    return data.map(item => ({
      mois: moisNoms[item.mois - 1],
      annee: item.annee,
      nombre_presences: item.nombre_presences,
      label: `${moisNoms[item.mois - 1]} ${item.annee}`
    }));
  }
}
