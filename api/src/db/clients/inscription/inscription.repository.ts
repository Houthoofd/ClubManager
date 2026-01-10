/**
 * Repository pour les opérations de base de données sur les Inscriptions/Cours
 * Responsabilité: Accès à la base de données uniquement (pas de logique métier)
 */

import MysqlConnector from '../../connector/mysqlconnector.js';
import type {
  Cours,
  CoursRow,
  CoursRecurrent,
  CoursRecurrentRow,
  Inscription,
  InscriptionRow,
  UtilisateurInscrit,
  UtilisateurInscritRow,
  Professeur,
  ProfesseurRow,
  JourDeCours,
  JourDeCoursRow,
  SemaineAvecCours,
  SemaineAvecCoursRow,
  StatistiquesPresenceCours,
  StatistiquesPresenceCoursRow,
  StatistiquesPresenceUtilisateur,
  StatistiquesPresenceUtilisateurRow,
  CoursAvecProfesseurs,
  CoursAvecUtilisateurs,
  VerificationInscription,
  CreateCoursRecurrentData,
  UpdateCoursRecurrentData,
  CreateCoursData,
  InscriptionData,
  UpdatePresenceData,
  ConfirmationResult,
  SearchResult,
  CoursFilterOptions,
  InscriptionFilterOptions,
  StatistiquesOptions,
} from './types/index.js';
import * as queries from './queries/index.js';
import {
  parseCoursRow,
  parseCoursRows,
  parseCoursAvecProfesseursRow,
  parseCoursAvecProfesseursRows,
  parseCoursRecurrentRow,
  parseCoursRecurrentRows,
  parseJourDeCoursRow,
  parseJourDeCoursRows,
  parseInscriptionRow,
  parseInscriptionRows,
  parseUtilisateurInscritRow,
  parseUtilisateurInscritRows,
  parseProfesseurRow,
  parseProfesseurRows,
  parseSemaineAvecCoursRow,
  parseSemaineAvecCoursRows,
  parseStatistiquesPresenceCoursRows,
  parseStatistiquesPresenceUtilisateurRows,
  toInt,
  toBool,
} from './utils/index.js';

/**
 * Repository pour la gestion des inscriptions et des cours
 */
export class InscriptionRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (SELECT) - COURS
  // ==========================================================================

  /**
   * Récupérer tous les cours
   */
  async findAllCours(): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_ALL_COURS,
        [],
        (error, results: CoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer un cours par son ID
   */
  async findCoursById(coursId: number): Promise<Cours | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_BY_ID,
        [coursId],
        (error, results: CoursRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseCoursRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours d'un participant
   */
  async findCoursByParticipant(participantId: number): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_BY_PARTICIPANT,
        [participantId],
        (error, results: CoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours d'une semaine spécifique
   */
  async findCoursBySemaine(annee: number, numeroSemaine: number): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_BY_SEMAINE,
        [annee, numeroSemaine],
        (error, results: CoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les semaines ayant des cours
   */
  async findSemainesAvecCours(): Promise<SemaineAvecCours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_SEMAINES_AVEC_COURS,
        [],
        (error, results: SemaineAvecCoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseSemaineAvecCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours avec leurs professeurs
   */
  async findCoursWithProfesseurs(): Promise<CoursAvecProfesseurs[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_WITH_PROFESSEURS,
        [],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCoursAvecProfesseursRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des cours par date
   */
  async searchCoursByDate(date: string): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COURS_BY_DATE,
        [date],
        (error, results: CoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des cours par plage de dates
   */
  async searchCoursByDateRange(dateDebut: string, dateFin: string): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COURS_BY_DATE_RANGE,
        [dateDebut, dateFin],
        (error, results: CoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Rechercher des cours par type
   */
  async searchCoursByType(typeCours: string): Promise<Cours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SEARCH_COURS_BY_TYPE,
        [`%${typeCours}%`],
        (error, results: CoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseCoursRows(results));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (SELECT) - COURS RÉCURRENTS
  // ==========================================================================

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
            reject(error);
          } else {
            resolve(parseCoursRecurrentRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer un cours récurrent par son ID
   */
  async findCoursRecurrentById(id: number): Promise<CoursRecurrent | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_RECURRENT_BY_ID,
        [id],
        (error, results: CoursRecurrentRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseCoursRecurrentRow(results[0]));
          }
        }
      );
    });
  }

  /**
   * Récupérer l'ID d'un cours récurrent par critères
   */
  async findCoursRecurrentId(
    jourSemaine: number,
    typeCours: string,
    heureDebut: string,
    heureFin: string
  ): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_RECURRENT_ID,
        [jourSemaine, typeCours, heureDebut, heureFin],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].id);
          }
        }
      );
    });
  }

  /**
   * Récupérer les jours de cours (cours récurrents avec professeurs)
   */
  async findJoursDeCours(): Promise<JourDeCours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_JOURS_DE_COURS,
        [],
        (error, results: JourDeCoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseJourDeCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les jours de cours d'une semaine spécifique
   */
  async findJoursDeCoursParSemaine(dateDebut: string, dateFin: string): Promise<JourDeCours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_JOURS_DE_COURS_BY_SEMAINE,
        [dateFin, dateDebut],
        (error, results: JourDeCoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseJourDeCoursRows(results));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (SELECT) - INSCRIPTIONS
  // ==========================================================================

  /**
   * Récupérer toutes les inscriptions d'un cours
   */
  async findInscriptionsByCours(coursId: number): Promise<Inscription[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INSCRIPTIONS_BY_COURS,
        [coursId],
        (error, results: InscriptionRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseInscriptionRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les cours inscrits d'un utilisateur
   */
  async findCoursInscritsByUtilisateur(utilisateurId: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COURS_INSCRITS_BY_UTILISATEUR,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur est inscrit à un cours
   */
  async verifyInscription(coursId: number, utilisateurId: number): Promise<VerificationInscription> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_VERIFY_INSCRIPTION,
        [coursId, utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve({
              isBooked: false,
              isFind: false,
              message: 'Utilisateur non inscrit à ce cours',
              data: {},
            });
          } else {
            const inscription = results[0];
            resolve({
              isBooked: true,
              isFind: true,
              message: 'Utilisateur déjà inscrit',
              data: {
                inscriptionId: inscription.inscriptionId,
                userId: inscription.userId,
                coursId: inscription.cours_id,
                presence: inscription.presence,
                est_valide: inscription.est_valide === 1,
              },
            });
          }
        }
      );
    });
  }

  /**
   * Récupérer une inscription par ID
   */
  async findInscriptionById(inscriptionId: number): Promise<Inscription | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_INSCRIPTION_BY_ID,
        [inscriptionId],
        (error, results: InscriptionRow[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(parseInscriptionRow(results[0]));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (SELECT) - UTILISATEURS
  // ==========================================================================

  /**
   * Récupérer l'ID d'un participant par nom et prénom
   */
  async findParticipantIdByName(firstName: string, lastName: string): Promise<number | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PARTICIPANT_ID_BY_NAME,
        [firstName, lastName],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0].id);
          }
        }
      );
    });
  }

  /**
   * Récupérer les utilisateurs participants d'un cours
   */
  async findUtilisateursByCours(coursId: number): Promise<UtilisateurInscrit[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_UTILISATEURS_BY_COURS,
        [coursId],
        (error, results: UtilisateurInscritRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseUtilisateurInscritRows(results));
          }
        }
      );
    });
  }

  /**
   * Vérifier si un participant existe
   */
  async verifyParticipant(firstName: string, lastName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_VERIFY_PARTICIPANT,
        [firstName, lastName],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.length > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (SELECT) - PROFESSEURS
  // ==========================================================================

  /**
   * Récupérer les professeurs d'un cours
   */
  async findProfesseursByCours(coursId: number): Promise<Professeur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PROFESSEURS_BY_COURS,
        [coursId],
        (error, results: ProfesseurRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseProfesseurRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les professeurs d'un cours récurrent
   */
  async findProfesseursByCoursRecurrent(coursRecurrentId: number): Promise<Professeur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PROFESSEURS_BY_COURS_RECURRENT,
        [coursRecurrentId],
        (error, results: ProfesseurRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseProfesseurRows(results));
          }
        }
      );
    });
  }

  /**
   * Récupérer les IDs des professeurs par leurs noms
   */
  async findProfesseurIdsByNames(names: string[]): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_PROFESSEUR_IDS_BY_NAMES,
        [names],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.map((r) => r.id));
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE LECTURE (SELECT) - STATISTIQUES
  // ==========================================================================

  /**
   * Statistiques de présence par cours
   */
  async getStatistiquesPresenceByCours(
    dateDebut: string,
    dateFin: string
  ): Promise<StatistiquesPresenceCours[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STATS_PRESENCE_BY_COURS,
        [dateDebut, dateFin],
        (error, results: StatistiquesPresenceCoursRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseStatistiquesPresenceCoursRows(results));
          }
        }
      );
    });
  }

  /**
   * Statistiques de présence par utilisateur
   */
  async getStatistiquesPresenceByUtilisateur(
    dateDebut: string,
    dateFin: string
  ): Promise<StatistiquesPresenceUtilisateur[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_STATS_PRESENCE_BY_UTILISATEUR,
        [dateDebut, dateFin],
        (error, results: StatistiquesPresenceUtilisateurRow[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(parseStatistiquesPresenceUtilisateurRows(results));
          }
        }
      );
    });
  }

  /**
   * Compter les inscriptions d'un cours
   */
  async countInscriptionsByCours(coursId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COUNT_INSCRIPTIONS_BY_COURS,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count || 0);
          }
        }
      );
    });
  }

  /**
   * Compter les cours d'un utilisateur
   */
  async countCoursByUtilisateur(utilisateurId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SELECT_COUNT_COURS_BY_UTILISATEUR,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.count || 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (INSERT) - COURS
  // ==========================================================================

  /**
   * Insérer un nouveau cours
   */
  async createCours(data: CreateCoursData): Promise<number> {
    return new Promise((resolve, reject) => {
      const jourSemaine = new Date(data.date_cours).getDay();
      const jourMapping = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const jourCours = jourMapping[jourSemaine];

      this.mysqlConnector.query(
        queries.INSERT_COURS,
        [
          data.date_cours,
          jourCours,
          jourSemaine,
          data.type_cours,
          data.heure_debut,
          data.heure_fin,
          null,
        ],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (INSERT) - COURS RÉCURRENTS
  // ==========================================================================

  /**
   * Insérer un nouveau cours récurrent
   */
  async createCoursRecurrent(data: CreateCoursRecurrentData): Promise<number> {
    return new Promise((resolve, reject) => {
      const jourMapping: Record<string, number> = {
        lundi: 1,
        mardi: 2,
        mercredi: 3,
        jeudi: 4,
        vendredi: 5,
        samedi: 6,
        dimanche: 0,
      };

      const jourSemaine = jourMapping[data.jour.toLowerCase()];
      if (jourSemaine === undefined) {
        reject(new Error(`Jour invalide: ${data.jour}`));
        return;
      }

      this.mysqlConnector.query(
        queries.INSERT_COURS_RECURRENT,
        [
          jourSemaine,
          data.type_cours,
          data.heure_debut,
          data.heure_fin,
          data.date_debut || new Date().toISOString().split('T')[0],
          data.date_fin || null,
        ],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  /**
   * Associer des professeurs à un cours récurrent
   */
  async associateProfesseursToCoursRecurrent(
    coursRecurrentId: number,
    professeurNames: string[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Récupérer les IDs des professeurs
      this.mysqlConnector.query(
        queries.SELECT_PROFESSEUR_IDS_BY_NAMES,
        [professeurNames],
        (error, results: any[]) => {
          if (error) {
            reject(error);
            return;
          }

          const professeurIds = results.map((r) => r.id);
          if (professeurIds.length === 0) {
            resolve();
            return;
          }

          const values = professeurIds.map((profId) => [coursRecurrentId, profId]);

          this.mysqlConnector.query(
            queries.INSERT_COURS_RECURRENT_PROFESSEURS,
            [values],
            (error) => {
              if (error) {
                reject(error);
              } else {
                resolve();
              }
            }
          );
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (INSERT) - INSCRIPTIONS
  // ==========================================================================

  /**
   * Inscrire un utilisateur à un cours
   */
  async createInscription(data: InscriptionData): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_INSCRIPTION,
        [
          data.coursId,
          data.utilisateurId,
          data.presence || 'en_attente',
          data.est_valide ? 1 : 0,
        ],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  /**
   * Inscrire un utilisateur à un cours (version simple)
   */
  async createInscriptionSimple(coursId: number, utilisateurId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_INSCRIPTION_SIMPLE,
        [coursId, utilisateurId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.insertId);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (UPDATE) - INSCRIPTIONS / PRÉSENCE
  // ==========================================================================

  /**
   * Mettre à jour la présence d'une inscription
   */
  async updatePresence(data: UpdatePresenceData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_INSCRIPTION_PRESENCE,
        [data.presence, data.inscriptionId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Valider une inscription (marquer comme présent)
   */
  async validerInscription(coursId: number, utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_INSCRIPTION_VALIDER,
        [coursId, utilisateurId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Annuler une inscription (marquer comme absent)
   */
  async annulerInscription(coursId: number, utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_INSCRIPTION_ANNULER,
        [coursId, utilisateurId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (UPDATE) - COURS RÉCURRENTS
  // ==========================================================================

  /**
   * Mettre à jour un cours récurrent
   */
  async updateCoursRecurrent(data: UpdateCoursRecurrentData): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let jourSemaine = null;
      if (data.jour) {
        const jourMapping: Record<string, number> = {
          lundi: 1,
          mardi: 2,
          mercredi: 3,
          jeudi: 4,
          vendredi: 5,
          samedi: 6,
          dimanche: 0,
        };
        jourSemaine = jourMapping[data.jour.toLowerCase()];
      }

      this.mysqlConnector.query(
        queries.UPDATE_COURS_RECURRENT,
        [
          jourSemaine,
          data.type_cours || null,
          data.heure_debut || null,
          data.heure_fin || null,
          data.date_fin || null,
          data.id,
        ],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (DELETE) - INSCRIPTIONS
  // ==========================================================================

  /**
   * Supprimer une inscription
   */
  async deleteInscription(inscriptionId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_INSCRIPTION,
        [inscriptionId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Désinscrire un utilisateur d'un cours
   */
  async deleteInscriptionByCoursUser(coursId: number, utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_INSCRIPTION_BY_COURS_USER,
        [coursId, utilisateurId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES D'ÉCRITURE (DELETE) - COURS
  // ==========================================================================

  /**
   * Supprimer un cours
   */
  async deleteCours(coursId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_COURS,
        [coursId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Supprimer un cours récurrent
   */
  async deleteCoursRecurrent(coursRecurrentId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_COURS_RECURRENT,
        [coursRecurrentId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Soft delete - Terminer un cours récurrent
   */
  async softDeleteCoursRecurrent(coursRecurrentId: number, dateFin: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SOFT_DELETE_COURS_RECURRENT,
        [dateFin, coursRecurrentId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  /**
   * Supprimer les professeurs d'un cours récurrent
   */
  async deleteProfesseursFromCoursRecurrent(coursRecurrentId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_COURS_RECURRENT_PROFESSEURS,
        [coursRecurrentId],
        (error, results: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(results.affectedRows > 0);
          }
        }
      );
    });
  }

  // ==========================================================================
  // MÉTHODES DE VALIDATION
  // ==========================================================================

  /**
   * Vérifier si un cours existe
   */
  async coursExists(coursId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COURS_EXISTS,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.exists_flag === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un cours récurrent existe
   */
  async coursRecurrentExists(coursRecurrentId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COURS_RECURRENT_EXISTS,
        [coursRecurrentId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.exists_flag === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur existe
   */
  async utilisateurExists(utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_UTILISATEUR_EXISTS,
        [utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.exists_flag === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur est inscrit à un cours
   */
  async isUserInscrit(coursId: number, utilisateurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_INSCRIT_TO_COURS,
        [coursId, utilisateurId],
        (error, results: any[]) => {
          if (error) {
            reject(error);
          } else {
            resolve(results[0]?.is_inscrit === 1);
          }
        }
      );
    });
  }
}

// ==========================================================================
// SINGLETON
// ==========================================================================

let repositoryInstance: InscriptionRepository | null = null;

/**
 * Récupérer l'instance singleton du repository
 */
export function getInscriptionRepository(): InscriptionRepository {
  if (!repositoryInstance) {
    repositoryInstance = new InscriptionRepository();
  }
  return repositoryInstance;
}

export default InscriptionRepository;
