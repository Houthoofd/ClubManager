/**
 * Repository de LECTURE pour le module Cours
 * Responsabilité: Opérations de lecture uniquement (SELECT)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  Cours,
  CoursRow,
  CoursRecurrent,
  CoursRecurrentRow,
  CoursAvecProfesseurs,
  JourDeCours,
  JourDeCoursRow,
  UtilisateurParticipant,
  UtilisateurParticipantRow,
  Professeur,
  ProfesseurRow,
  Semaine,
  DisponibiliteCours,
} from '../types.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations de lecture sur les cours
 */
export class CoursReadRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  /**
   * Récupérer tous les cours
   */
  async findAll(): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_COURS,
        [],
        (error, results: CoursRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findAll:', error);
            reject(error);
          } else {
            resolve(results as Cours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer un cours par son ID
   */
  async findById(coursId: number): Promise<Cours | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_BY_ID,
        [coursId],
        (error, results: CoursRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findById:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as Cours);
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours d'une semaine spécifique
   */
  async findByWeek(weekNumber: number, year: number): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_BY_WEEK,
        [weekNumber, year],
        (error, results: CoursRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findByWeek:', error);
            reject(error);
          } else {
            resolve(results as Cours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours entre deux dates
   */
  async findByDateRange(startDate: Date | string, endDate: Date | string): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_BY_DATE_RANGE,
        [startDate, endDate],
        (error, results: CoursRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findByDateRange:', error);
            reject(error);
          } else {
            resolve(results as Cours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours futurs
   */
  async findFutureCours(limit: number = 50): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_FUTURS,
        [limit],
        (error, results: CoursRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findFutureCours:', error);
            reject(error);
          } else {
            resolve(results as Cours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer un cours avec ses professeurs
   */
  async findByIdWithProfesseurs(coursId: number): Promise<CoursAvecProfesseurs | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_WITH_PROFESSEURS,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findByIdWithProfesseurs:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            const cours = results[0];
            // Parser les professeurs depuis le GROUP_CONCAT
            const professeurs = this.parseProfesseursFromConcat(cours.professeurs);
            resolve({
              ...cours,
              professeurs,
            } as CoursAvecProfesseurs);
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les cours avec leurs professeurs
   */
  async findAllWithProfesseurs(): Promise<CoursAvecProfesseurs[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_COURS_WITH_PROFESSEURS,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findAllWithProfesseurs:', error);
            reject(error);
          } else {
            const coursAvecProfs = results.map((row) => ({
              ...row,
              professeurs: this.parseProfesseursFromConcat(row.professeurs),
            }));
            resolve(coursAvecProfs as CoursAvecProfesseurs[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les cours récurrents
   */
  async findAllCoursRecurrents(): Promise<CoursRecurrent[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_COURS_RECURRENTS,
        [],
        (error, results: CoursRecurrentRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findAllCoursRecurrents:', error);
            reject(error);
          } else {
            resolve(results as CoursRecurrent[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer un cours récurrent par son ID
   */
  async findCoursRecurrentById(coursRecurrentId: number): Promise<CoursRecurrent | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_RECURRENT_BY_ID,
        [coursRecurrentId],
        (error, results: CoursRecurrentRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findCoursRecurrentById:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as CoursRecurrent);
          }
        }
      );
    });
  }

  /**
   * Récupérer un cours récurrent par jour et heure
   */
  async findCoursRecurrentByDayTime(
    jourSemaine: number,
    typeCours: string,
    heureDebut: string
  ): Promise<CoursRecurrent | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_RECURRENT_BY_DAY_TIME,
        [jourSemaine, typeCours, heureDebut],
        (error, results: CoursRecurrentRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findCoursRecurrentByDayTime:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as CoursRecurrent);
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours récurrents d'un jour spécifique
   */
  async findCoursRecurrentsByDay(jourSemaine: number): Promise<CoursRecurrent[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_RECURRENTS_BY_DAY,
        [jourSemaine],
        (error, results: CoursRecurrentRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findCoursRecurrentsByDay:', error);
            reject(error);
          } else {
            resolve(results as CoursRecurrent[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les jours de cours (planning hebdomadaire)
   */
  async getJoursDeCours(): Promise<JourDeCours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_JOURS_DE_COURS,
        [],
        (error, results: JourDeCoursRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getJoursDeCours:', error);
            reject(error);
          } else {
            const joursDeCours = results.map((row) => ({
              jour: this.getJourNameFromNumber(row.jour_semaine),
              type_cours: row.type_cours,
              heure_debut: row.heure_debut,
              heure_fin: row.heure_fin,
              professeurs: row.professeurs ? row.professeurs.split(', ') : [],
            }));
            resolve(joursDeCours as JourDeCours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les jours de cours pour une semaine spécifique
   */
  async getJoursDeCoursParSemaine(weekNumber: number, year: number): Promise<JourDeCours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_JOURS_DE_COURS_PAR_SEMAINE,
        [weekNumber, year],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getJoursDeCoursParSemaine:', error);
            reject(error);
          } else {
            const joursDeCours = results.map((row) => ({
              jour: row.jour,
              type_cours: row.type_cours,
              heure_debut: row.heure_debut,
              heure_fin: row.heure_fin,
              professeurs: row.professeurs ? row.professeurs.split(', ') : [],
            }));
            resolve(joursDeCours as JourDeCours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les participants d'un cours
   */
  async getParticipantsByCours(coursId: number): Promise<UtilisateurParticipant[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PARTICIPANTS_BY_COURS,
        [coursId],
        (error, results: UtilisateurParticipantRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getParticipantsByCours:', error);
            reject(error);
          } else {
            resolve(results as UtilisateurParticipant[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours d'un utilisateur
   */
  async getCoursByUser(userId: number): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_BY_USER,
        [userId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getCoursByUser:', error);
            reject(error);
          } else {
            resolve(results as Cours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours futurs d'un utilisateur
   */
  async getCoursFutursByUser(userId: number): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_FUTURS_BY_USER,
        [userId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getCoursFutursByUser:', error);
            reject(error);
          } else {
            resolve(results as Cours[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer toutes les semaines avec cours
   */
  async getSemainesAvecCours(): Promise<Semaine[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_SEMAINES_AVEC_COURS,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getSemainesAvecCours:', error);
            reject(error);
          } else {
            resolve(results as Semaine[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer les informations d'une semaine spécifique
   */
  async getSemaineInfo(weekNumber: number, year: number): Promise<Semaine | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_SEMAINE_INFO,
        [weekNumber, year],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getSemaineInfo:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as Semaine);
          }
        }
      );
    });
  }

  /**
   * Récupérer les professeurs d'un cours récurrent
   */
  async getProfesseursByCoursRecurrent(coursRecurrentId: number): Promise<Professeur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PROFESSEURS_BY_COURS_RECURRENT,
        [coursRecurrentId],
        (error, results: ProfesseurRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getProfesseursByCoursRecurrent:', error);
            reject(error);
          } else {
            resolve(results as Professeur[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer un professeur par nom et prénom
   */
  async findProfesseurByName(nom: string, prenom: string): Promise<Professeur | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PROFESSEUR_BY_NAME,
        [nom, prenom],
        (error, results: ProfesseurRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in findProfesseurByName:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as Professeur);
          }
        }
      );
    });
  }

  /**
   * Récupérer tous les professeurs
   */
  async getAllProfesseurs(): Promise<Professeur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_PROFESSEURS,
        [],
        (error, results: ProfesseurRow[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getAllProfesseurs:', error);
            reject(error);
          } else {
            resolve(results as Professeur[]);
          }
        }
      );
    });
  }

  /**
   * Compter les inscriptions pour un cours
   */
  async countInscriptionsByCours(coursId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_INSCRIPTIONS_BY_COURS,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in countInscriptionsByCours:', error);
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier la disponibilité d'un cours
   */
  async checkCoursDisponibilite(coursId: number): Promise<DisponibiliteCours | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COURS_DISPONIBILITE,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in checkCoursDisponibilite:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve({
              cours_id: results[0].id,
              capacite_max: results[0].capacite_max,
              places_occupees: results[0].places_occupees,
              places_disponibles: results[0].places_disponibles,
              complet: results[0].complet === 1,
            });
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours disponibles (avec places)
   */
  async getCoursDisponibles(): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_DISPONIBLES,
        [],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursReadRepository] Error in getCoursDisponibles:', error);
            reject(error);
          } else {
            resolve(results as Cours[]);
          }
        }
      );
    });
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================================================

  /**
   * Parser les professeurs depuis un GROUP_CONCAT
   * Format: "id:nom:prenom|id:nom:prenom"
   */
  private parseProfesseursFromConcat(professeursStr: string | null): Professeur[] {
    if (!professeursStr) return [];

    try {
      return professeursStr.split('|').map((profStr) => {
        const [id, nom, prenom] = profStr.split(':');
        return {
          id: parseInt(id, 10),
          nom,
          prenom,
        } as Professeur;
      });
    } catch (error) {
      console.error('[CoursReadRepository] Error parsing professeurs:', error);
      return [];
    }
  }

  /**
   * Obtenir le nom du jour depuis le numéro (0-6)
   */
  private getJourNameFromNumber(jourNum: number): string {
    const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return jours[jourNum] || 'inconnu';
  }
}
