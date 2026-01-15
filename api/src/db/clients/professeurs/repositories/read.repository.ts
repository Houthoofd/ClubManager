/**
 * Repository de lecture pour le module professeurs
 * Gère toutes les opérations de lecture sur les professeurs
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import {
  Professeur,
  ProfesseurComplet,
  CoursRecurrent,
  Utilisateur,
  ProfesseursSearchResult,
  PlanningCoursResult,
  mapRowToProfesseur,
  mapRowToProfesseurComplet,
  mapRowToCoursRecurrent,
  mapRowToUtilisateur,
} from '../types.js';
import {
  GET_ALL_PROFESSEURS,
  GET_PROFESSEUR_BY_ID,
  GET_UTILISATEUR_BY_ID,
  GET_UTILISATEURS_BY_IDS,
  GET_PLANNING_COURS_PROFESSEUR,
  GET_PROFESSEUR_FROM_PROFESSEURS_TABLE,
  COUNT_PROFESSEURS,
  SEARCH_PROFESSEURS,
  GET_COURS_PROFESSEUR_BY_DATE_RANGE,
} from '../queries/index.js';

export class ProfesseursReadRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // Lecture des professeurs
  // ============================================================================

  /**
   * Récupère tous les professeurs
   */
  async getAllProfesseurs(): Promise<Professeur[]> {
    return new Promise<Professeur[]>((resolve, reject) => {
      this.mysqlConnector.query(GET_ALL_PROFESSEURS, [], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des professeurs:', error.message);
          reject(error);
          return;
        }

        const professeurs = results.map((row: any) => mapRowToProfesseur(row));
        console.log(`${professeurs.length} professeurs récupérés avec succès.`);
        resolve(professeurs);
      });
    });
  }

  /**
   * Récupère un professeur par son ID
   */
  async getProfesseurById(id: number): Promise<ProfesseurComplet | null> {
    return new Promise<ProfesseurComplet | null>((resolve, reject) => {
      this.mysqlConnector.query(GET_PROFESSEUR_BY_ID, [id], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la récupération du professeur ID ${id}:`, error.message);
          reject(error);
          return;
        }

        if (results.length > 0) {
          const professeur = mapRowToProfesseurComplet(results[0]);
          console.log(`Professeur ID ${id} trouvé avec succès.`);
          resolve(professeur);
        } else {
          console.log(`Aucun professeur trouvé avec l'ID ${id}.`);
          resolve(null);
        }
      });
    });
  }

  /**
   * Récupère un utilisateur par son ID (peu importe le statut)
   */
  async getUtilisateurById(id: number): Promise<Utilisateur | null> {
    return new Promise<Utilisateur | null>((resolve, reject) => {
      this.mysqlConnector.query(GET_UTILISATEUR_BY_ID, [id], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la récupération de l'utilisateur ID ${id}:`, error.message);
          reject(error);
          return;
        }

        if (results.length > 0) {
          const utilisateur = mapRowToUtilisateur(results[0]);
          console.log(`✅ Utilisateur ID ${id} trouvé avec succès.`);
          resolve(utilisateur);
        } else {
          console.log(`⚠️ Aucun utilisateur trouvé avec l'ID ${id}.`);
          resolve(null);
        }
      });
    });
  }

  /**
   * Récupère plusieurs utilisateurs par leurs IDs
   */
  async getUtilisateursByIds(ids: number[]): Promise<Utilisateur[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }

    return new Promise<Utilisateur[]>((resolve, reject) => {
      this.mysqlConnector.query(GET_UTILISATEURS_BY_IDS, [ids], (error, results) => {
        if (error) {
          console.error('Erreur lors de la récupération des utilisateurs par IDs:', error.message);
          reject(error);
          return;
        }

        const utilisateurs = results.map((row: any) => mapRowToUtilisateur(row));
        console.log(`${utilisateurs.length}/${ids.length} utilisateurs récupérés.`);
        resolve(utilisateurs);
      });
    });
  }

  /**
   * Compte le nombre total de professeurs
   */
  async countProfesseurs(): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.mysqlConnector.query(COUNT_PROFESSEURS, [], (error, results) => {
        if (error) {
          console.error('Erreur lors du comptage des professeurs:', error.message);
          reject(error);
          return;
        }

        const count = results[0]?.total || 0;
        resolve(count);
      });
    });
  }

  // ============================================================================
  // Recherche
  // ============================================================================

  /**
   * Recherche des professeurs par terme de recherche
   */
  async searchProfesseurs(
    searchTerm: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ProfesseursSearchResult> {
    const searchPattern = `%${searchTerm}%`;

    return new Promise<ProfesseursSearchResult>((resolve, reject) => {
      this.mysqlConnector.query(
        SEARCH_PROFESSEURS,
        [searchPattern, searchPattern, searchPattern, searchPattern, limit, offset],
        (error, results) => {
          if (error) {
            console.error('Erreur lors de la recherche des professeurs:', error.message);
            reject(error);
            return;
          }

          const professeurs = results.map((row: any) => mapRowToProfesseur(row));
          console.log(`${professeurs.length} professeurs trouvés pour la recherche "${searchTerm}".`);

          resolve({
            professeurs,
            total: professeurs.length,
          });
        }
      );
    });
  }

  // ============================================================================
  // Planning et cours
  // ============================================================================

  /**
   * Récupère le planning des cours d'un professeur
   * Accepte soit l'ID du professeur, soit l'ID de l'utilisateur
   */
  async getPlanningCoursProfesseur(inputId: number): Promise<PlanningCoursResult> {
    return new Promise<PlanningCoursResult>((resolve, reject) => {
      this.mysqlConnector.query(
        GET_PLANNING_COURS_PROFESSEUR,
        [inputId, inputId, inputId],
        (error, results) => {
          if (error) {
            console.error(`Erreur lors de la récupération du planning pour l'ID ${inputId}:`, error.message);
            reject(error);
            return;
          }

          if (results.length > 0) {
            const cours = results.map((row: any) => mapRowToCoursRecurrent(row));
            const firstCours = cours[0];

            console.log(`Planning trouvé pour l'ID ${inputId} avec ${cours.length} cours.`);

            resolve({
              cours,
              professeur: {
                id: firstCours.professeur_id,
                nom: firstCours.professeur_nom,
                prenom: firstCours.professeur_prenom,
              },
            });
          } else {
            console.log(`Aucun cours trouvé pour l'ID ${inputId}.`);
            resolve({
              cours: [],
            });
          }
        }
      );
    });
  }

  /**
   * Récupère les cours d'un professeur pour une période donnée
   */
  async getCoursProfesseurByDateRange(professeurId: number): Promise<CoursRecurrent[]> {
    return new Promise<CoursRecurrent[]>((resolve, reject) => {
      this.mysqlConnector.query(
        GET_COURS_PROFESSEUR_BY_DATE_RANGE,
        [professeurId],
        (error, results) => {
          if (error) {
            console.error(
              `Erreur lors de la récupération des cours du professeur ${professeurId}:`,
              error.message
            );
            reject(error);
            return;
          }

          const cours = results.map((row: any) => ({
            cours_recurrent_id: row.cours_recurrent_id,
            type_cours: row.type_cours,
            jour_semaine: row.jour_semaine,
            heure_debut: row.heure_debut,
            heure_fin: row.heure_fin,
            est_recurrent_actif: Boolean(row.est_recurrent_actif),
            professeur_id: professeurId,
            professeur_nom: '',
            professeur_prenom: '',
          }));

          console.log(`${cours.length} cours récupérés pour le professeur ${professeurId}.`);
          resolve(cours);
        }
      );
    });
  }

  /**
   * Récupère les informations d'un professeur depuis la table professeurs
   */
  async getProfesseurFromProfesseursTable(professeurId: number): Promise<Professeur | null> {
    return new Promise<Professeur | null>((resolve, reject) => {
      this.mysqlConnector.query(
        GET_PROFESSEUR_FROM_PROFESSEURS_TABLE,
        [professeurId],
        (error, results) => {
          if (error) {
            console.error(
              `Erreur lors de la récupération du professeur depuis la table professeurs (ID ${professeurId}):`,
              error.message
            );
            reject(error);
            return;
          }

          if (results.length > 0) {
            const professeur = mapRowToProfesseur(results[0]);
            resolve(professeur);
          } else {
            resolve(null);
          }
        }
      );
    });
  }
}
