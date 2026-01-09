/**
 * Repository de VALIDATION pour le module Cours
 * Responsabilité: Vérifications d'existence, validations de règles métier
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les validations des cours
 */
export class CoursValidationRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ============================================================================
  // VÉRIFICATIONS D'EXISTENCE
  // ============================================================================

  /**
   * Vérifier si une inscription existe
   */
  async inscriptionExists(utilisateurId: number, coursId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_INSCRIPTION_EXISTS,
        [utilisateurId, coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in inscriptionExists:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si une inscription existe par ID
   */
  async inscriptionExistsById(inscriptionId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_INSCRIPTION_EXISTS_BY_ID,
        [inscriptionId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in inscriptionExistsById:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

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
            console.error('[CoursValidationRepository] Error in coursExists:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
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
            console.error('[CoursValidationRepository] Error in coursRecurrentExists:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un professeur existe
   */
  async professeurExists(professeurId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PROFESSEUR_EXISTS,
        [professeurId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in professeurExists:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un professeur existe par nom
   */
  async professeurExistsByName(nom: string, prenom: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PROFESSEUR_EXISTS_BY_NAME,
        [nom, prenom],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in professeurExistsByName:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur existe et est actif
   */
  async userExistsAndActive(userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_EXISTS_AND_ACTIVE,
        [userId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in userExistsAndActive:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // VÉRIFICATIONS DE RÈGLES MÉTIER
  // ============================================================================

  /**
   * Vérifier si un utilisateur peut s'inscrire à un cours
   * Retourne un statut: 'CAN_REGISTER', 'ALREADY_REGISTERED', 'COURS_INACTIVE', 'COURS_FULL'
   */
  async checkUserCanRegister(utilisateurId: number, coursId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_USER_CAN_REGISTER,
        [utilisateurId, coursId, coursId, coursId, coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkUserCanRegister:', error);
            reject(error);
          } else {
            resolve(results[0]?.status || 'ERROR');
          }
        }
      );
    });
  }

  /**
   * Vérifier si un cours est complet
   */
  async checkCoursIsFull(coursId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COURS_IS_FULL,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkCoursIsFull:', error);
            reject(error);
          } else {
            resolve(results[0]?.is_full === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si une inscription est un doublon
   */
  async checkDuplicateInscription(utilisateurId: number, coursId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_DUPLICATE_INSCRIPTION,
        [utilisateurId, coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkDuplicateInscription:', error);
            reject(error);
          } else {
            resolve(results.length > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un cours récurrent existe déjà pour ce jour/horaire
   */
  async checkDuplicateCoursRecurrent(
    jourSemaine: number,
    heureDebut: string,
    heureFin: string,
    typeCours: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_DUPLICATE_COURS_RECURRENT,
        [jourSemaine, heureDebut, heureFin, typeCours],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkDuplicateCoursRecurrent:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un cours existe déjà pour cette date/horaire
   */
  async checkDuplicateCours(
    dateCours: Date | string,
    heureDebut: string,
    heureFin: string,
    typeCours: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_DUPLICATE_COURS,
        [dateCours, heureDebut, heureFin, typeCours],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkDuplicateCours:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATIONS DE DATES
  // ============================================================================

  /**
   * Valider une date de cours
   * Retourne: 'VALID', 'DATE_PASSED', 'DATE_TOO_FAR'
   */
  async validateCoursDate(dateCours: Date | string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.VALIDATE_COURS_DATE,
        [dateCours, dateCours],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in validateCoursDate:', error);
            reject(error);
          } else {
            resolve(results[0]?.status || 'ERROR');
          }
        }
      );
    });
  }

  /**
   * Vérifier si un cours est dans le passé
   */
  async checkCoursIsPast(coursId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COURS_IS_PAST,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkCoursIsPast:', error);
            reject(error);
          } else {
            resolve(results[0]?.is_past === 1);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un utilisateur peut encore se désinscrire
   * Retourne: 'CAN_UNREGISTER', 'TOO_LATE'
   */
  async checkCanUnregister(inscriptionId: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_CAN_UNREGISTER,
        [inscriptionId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkCanUnregister:', error);
            reject(error);
          } else {
            resolve(results[0]?.status || 'ERROR');
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATIONS DE CAPACITÉ
  // ============================================================================

  /**
   * Vérifier la capacité restante d'un cours
   */
  async checkCoursCapacity(coursId: number): Promise<{
    capacite_max: number;
    places_occupees: number;
    places_restantes: number;
    has_capacity: boolean;
  } | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_COURS_CAPACITY,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkCoursCapacity:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve({
              capacite_max: results[0].capacite_max,
              places_occupees: results[0].places_occupees,
              places_restantes: results[0].places_restantes,
              has_capacity: results[0].has_capacity === 1,
            });
          }
        }
      );
    });
  }

  /**
   * Valider une capacité
   * Retourne: 'VALID', 'INVALID_NEGATIVE', 'INVALID_TOO_HIGH'
   */
  async validateCapacite(capacite: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.VALIDATE_CAPACITE,
        [capacite, capacite],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in validateCapacite:', error);
            reject(error);
          } else {
            resolve(results[0]?.status || 'ERROR');
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATIONS DE PROFESSEURS
  // ============================================================================

  /**
   * Vérifier si un professeur est déjà associé à un cours récurrent
   */
  async checkProfesseurAlreadyAssigned(
    coursRecurrentId: number,
    professeurId: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PROFESSEUR_ALREADY_ASSIGNED,
        [coursRecurrentId, professeurId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkProfesseurAlreadyAssigned:', error);
            reject(error);
          } else {
            resolve(results[0]?.exists_count > 0);
          }
        }
      );
    });
  }

  /**
   * Vérifier si un professeur a un conflit d'horaire
   */
  async checkProfesseurConflict(
    professeurId: number,
    jourSemaine: number,
    heureDebut: string,
    heureFin: string
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_PROFESSEUR_CONFLICT,
        [
          professeurId,
          jourSemaine,
          heureDebut,
          heureDebut,
          heureFin,
          heureFin,
          heureDebut,
          heureFin,
        ],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkProfesseurConflict:', error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATIONS D'HORAIRES
  // ============================================================================

  /**
   * Valider des horaires (début < fin, durée raisonnable)
   * Retourne: 'VALID', 'INVALID_ORDER', 'TOO_SHORT', 'TOO_LONG'
   */
  async validateHoraires(heureDebut: string, heureFin: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.VALIDATE_HORAIRES,
        [heureDebut, heureFin, heureFin, heureDebut, heureFin, heureDebut],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in validateHoraires:', error);
            reject(error);
          } else {
            resolve(results[0]?.status || 'ERROR');
          }
        }
      );
    });
  }

  /**
   * Vérifier s'il y a un conflit d'horaire pour un cours
   */
  async checkHoraireConflict(
    dateCours: Date | string,
    heureDebut: string,
    heureFin: string,
    excludeCoursId?: number
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_HORAIRE_CONFLICT,
        [
          dateCours,
          excludeCoursId || 0,
          heureDebut,
          heureDebut,
          heureFin,
          heureFin,
          heureDebut,
          heureFin,
        ],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkHoraireConflict:', error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  /**
   * Vérifier s'il y a un conflit d'horaire pour un cours récurrent
   */
  async checkHoraireConflictRecurrent(
    jourSemaine: number,
    heureDebut: string,
    heureFin: string,
    excludeCoursRecurrentId?: number
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_HORAIRE_CONFLICT_RECURRENT,
        [
          jourSemaine,
          excludeCoursRecurrentId || 0,
          heureDebut,
          heureDebut,
          heureFin,
          heureFin,
          heureDebut,
          heureFin,
        ],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in checkHoraireConflictRecurrent:', error);
            reject(error);
          } else {
            resolve(results);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATIONS DE JOUR DE SEMAINE
  // ============================================================================

  /**
   * Valider un jour de semaine (0-6)
   * Retourne: 'VALID', 'INVALID'
   */
  async validateJourSemaine(jourSemaine: number): Promise<string> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.VALIDATE_JOUR_SEMAINE,
        [jourSemaine, jourSemaine],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in validateJourSemaine:', error);
            reject(error);
          } else {
            resolve(results[0]?.status || 'ERROR');
          }
        }
      );
    });
  }

  // ============================================================================
  // COMPTAGES POUR VALIDATION
  // ============================================================================

  /**
   * Compter les inscriptions actives d'un utilisateur
   */
  async countUserActiveInscriptions(userId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_USER_ACTIVE_INSCRIPTIONS,
        [userId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in countUserActiveInscriptions:', error);
            reject(error);
          } else {
            resolve(results[0]?.count || 0);
          }
        }
      );
    });
  }

  /**
   * Compter les cours d'un jour spécifique
   */
  async countCoursByDay(dateCours: Date | string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_COURS_BY_DAY,
        [dateCours],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in countCoursByDay:', error);
            reject(error);
          } else {
            resolve(results[0]?.count || 0);
          }
        }
      );
    });
  }

  /**
   * Compter les cours récurrents d'un jour
   */
  async countCoursRecurrentsByDay(jourSemaine: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.COUNT_COURS_RECURRENTS_BY_DAY,
        [jourSemaine],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursValidationRepository] Error in countCoursRecurrentsByDay:', error);
            reject(error);
          } else {
            resolve(results[0]?.count || 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // VALIDATIONS COMPOSÉES (BUSINESS RULES)
  // ============================================================================

  /**
   * Valider complètement une inscription
   * Vérifie: utilisateur existe, cours existe, pas de doublon, places disponibles
   */
  async validateInscription(utilisateurId: number, coursId: number): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Vérifier que l'utilisateur existe et est actif
      const userExists = await this.userExistsAndActive(utilisateurId);
      if (!userExists) {
        errors.push('Utilisateur introuvable ou inactif');
      }

      // Vérifier que le cours existe
      const coursExists = await this.coursExists(coursId);
      if (!coursExists) {
        errors.push('Cours introuvable');
      }

      // Vérifier pas de doublon
      const isDuplicate = await this.checkDuplicateInscription(utilisateurId, coursId);
      if (isDuplicate) {
        errors.push('Utilisateur déjà inscrit à ce cours');
      }

      // Vérifier places disponibles
      const isFull = await this.checkCoursIsFull(coursId);
      if (isFull) {
        errors.push('Cours complet');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('[CoursValidationRepository] Error in validateInscription:', error);
      return {
        valid: false,
        errors: ['Erreur lors de la validation'],
      };
    }
  }

  /**
   * Valider complètement un cours récurrent
   * Vérifie: jour valide, horaires valides, pas de conflit, pas de doublon
   */
  async validateCoursRecurrent(
    jourSemaine: number,
    typeCours: string,
    heureDebut: string,
    heureFin: string
  ): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Valider le jour de semaine
      const jourStatus = await this.validateJourSemaine(jourSemaine);
      if (jourStatus !== 'VALID') {
        errors.push('Jour de semaine invalide');
      }

      // Valider les horaires
      const horaireStatus = await this.validateHoraires(heureDebut, heureFin);
      if (horaireStatus !== 'VALID') {
        errors.push(`Horaires invalides: ${horaireStatus}`);
      }

      // Vérifier pas de doublon
      const isDuplicate = await this.checkDuplicateCoursRecurrent(
        jourSemaine,
        heureDebut,
        heureFin,
        typeCours
      );
      if (isDuplicate) {
        errors.push('Un cours récurrent existe déjà pour ce jour et cette heure');
      }

      // Vérifier pas de conflit d'horaire
      const conflicts = await this.checkHoraireConflictRecurrent(
        jourSemaine,
        heureDebut,
        heureFin
      );
      if (conflicts.length > 0) {
        errors.push('Conflit d\'horaire avec un autre cours');
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('[CoursValidationRepository] Error in validateCoursRecurrent:', error);
      return {
        valid: false,
        errors: ['Erreur lors de la validation'],
      };
    }
  }
}
