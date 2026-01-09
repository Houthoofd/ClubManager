/**
 * Repository d'ÉCRITURE pour le module Cours
 * Responsabilité: Opérations d'écriture uniquement (INSERT, UPDATE, DELETE)
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  CreateCoursData,
  CreateCoursRecurrentData,
  UpdateCoursRecurrentData,
  CoursConfirmationResult,
} from '../types.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations d'écriture sur les cours
 */
export class CoursWriteRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ============================================================================
  // INSERTION - COURS
  // ============================================================================

  /**
   * Créer un nouveau cours
   */
  async createCours(data: CreateCoursData): Promise<number> {
    return new Promise((resolve, reject) => {
      const values = [
        data.date_cours,
        data.jour_cours || null,
        data.jour_semaine || null,
        data.type_cours,
        data.heure_debut,
        data.heure_fin,
        data.capacite_max || 20,
        data.description || null,
      ];

      this.mysqlConnector.query(
        queries.INSERT_COURS,
        values,
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in createCours:', error);
            reject(error);
          } else {
            resolve(result.insertId);
          }
        }
      );
    });
  }

  // ============================================================================
  // INSERTION - COURS RÉCURRENTS
  // ============================================================================

  /**
   * Créer un cours récurrent
   */
  async createCoursRecurrent(data: CreateCoursRecurrentData): Promise<number> {
    return new Promise((resolve, reject) => {
      const jourSemaine = typeof data.jour_semaine === 'string'
        ? this.getJourSemaineNumber(data.jour_semaine)
        : data.jour_semaine;

      const values = [
        jourSemaine,
        data.type_cours,
        data.heure_debut,
        data.heure_fin,
      ];

      this.mysqlConnector.query(
        queries.INSERT_COURS_RECURRENT,
        values,
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in createCoursRecurrent:', error);
            reject(error);
          } else {
            resolve(result.insertId);
          }
        }
      );
    });
  }

  // ============================================================================
  // MISE À JOUR - COURS
  // ============================================================================

  /**
   * Mettre à jour un cours
   */
  async updateCours(
    coursId: number,
    data: Partial<CreateCoursData>
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      const values = [
        data.date_cours,
        data.type_cours,
        data.heure_debut,
        data.heure_fin,
        data.capacite_max,
        data.description,
        data.actif !== undefined ? data.actif : 1,
        coursId,
      ];

      this.mysqlConnector.query(
        queries.UPDATE_COURS,
        values,
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in updateCours:', error);
            resolve({
              isConfirm: false,
              message: `Erreur lors de la mise à jour: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Cours mis à jour avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Mettre à jour le statut actif d'un cours
   */
  async updateCoursActif(coursId: number, actif: boolean): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COURS_ACTIF,
        [actif ? 1 : 0, coursId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in updateCoursActif:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: `Cours ${actif ? 'activé' : 'désactivé'} avec succès`,
            });
          }
        }
      );
    });
  }

  /**
   * Mettre à jour la capacité d'un cours
   */
  async updateCoursCapacite(
    coursId: number,
    capaciteMax: number
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COURS_CAPACITE,
        [capaciteMax, coursId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in updateCoursCapacite:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Capacité mise à jour avec succès',
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // MISE À JOUR - COURS RÉCURRENTS
  // ============================================================================

  /**
   * Mettre à jour un cours récurrent
   */
  async updateCoursRecurrent(
    coursRecurrentId: number,
    data: UpdateCoursRecurrentData
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      const values = [
        data.jour_semaine,
        data.type_cours,
        data.heure_debut,
        data.heure_fin,
        data.actif !== undefined ? data.actif : 1,
        coursRecurrentId,
      ];

      this.mysqlConnector.query(
        queries.UPDATE_COURS_RECURRENT,
        values,
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in updateCoursRecurrent:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours récurrent non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Cours récurrent mis à jour avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Mettre à jour uniquement le type d'un cours récurrent
   */
  async updateCoursRecurrentType(
    coursRecurrentId: number,
    typeCours: string
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COURS_RECURRENT_TYPE,
        [typeCours, coursRecurrentId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in updateCoursRecurrentType:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours récurrent non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Type de cours mis à jour avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Mettre à jour les horaires d'un cours récurrent
   */
  async updateCoursRecurrentHoraires(
    coursRecurrentId: number,
    heureDebut: string,
    heureFin: string
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_COURS_RECURRENT_HORAIRES,
        [heureDebut, heureFin, coursRecurrentId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in updateCoursRecurrentHoraires:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours récurrent non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Horaires mis à jour avec succès',
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // SUPPRESSION - COURS
  // ============================================================================

  /**
   * Supprimer un cours (hard delete)
   */
  async deleteCours(coursId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_COURS,
        [coursId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in deleteCours:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Cours supprimé avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Désactiver un cours (soft delete)
   */
  async softDeleteCours(coursId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SOFT_DELETE_COURS,
        [coursId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in softDeleteCours:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Cours désactivé avec succès',
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // SUPPRESSION - COURS RÉCURRENTS
  // ============================================================================

  /**
   * Supprimer un cours récurrent (hard delete)
   */
  async deleteCoursRecurrent(coursRecurrentId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_COURS_RECURRENT,
        [coursRecurrentId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in deleteCoursRecurrent:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours récurrent non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Cours récurrent supprimé avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Désactiver un cours récurrent (soft delete)
   */
  async softDeleteCoursRecurrent(coursRecurrentId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.SOFT_DELETE_COURS_RECURRENT,
        [coursRecurrentId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in softDeleteCoursRecurrent:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Cours récurrent non trouvé',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Cours récurrent désactivé avec succès',
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // GÉNÉRATION DE COURS DEPUIS RÉCURRENT
  // ============================================================================

  /**
   * Générer un cours depuis un cours récurrent
   */
  async generateCoursFromRecurrent(
    coursRecurrentId: number,
    dateCours: Date | string
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GENERATE_COURS_FROM_RECURRENT,
        [dateCours, dateCours, coursRecurrentId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in generateCoursFromRecurrent:', error);
            reject(error);
          } else {
            resolve(result.insertId);
          }
        }
      );
    });
  }

  /**
   * Générer tous les cours de la semaine depuis les cours récurrents
   */
  async generateWeekCours(dateDebut: Date | string): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.GENERATE_WEEK_COURS,
        [dateDebut, dateDebut, dateDebut],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in generateWeekCours:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else {
            resolve({
              isConfirm: true,
              message: `${result.affectedRows} cours générés avec succès`,
              data: result.affectedRows,
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // GESTION DES PROFESSEURS
  // ============================================================================

  /**
   * Associer un professeur à un cours récurrent
   */
  async associerProfesseur(
    coursRecurrentId: number,
    professeurId: number
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_PROFESSEUR_COURS_RECURRENT,
        [coursRecurrentId, professeurId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in associerProfesseur:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Professeur associé avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Associer plusieurs professeurs à un cours récurrent
   */
  async associerProfesseurs(
    coursRecurrentId: number,
    professeurIds: number[]
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      const values = professeurIds.map((profId) => [coursRecurrentId, profId]);

      this.mysqlConnector.query(
        queries.INSERT_PROFESSEURS_COURS_RECURRENT_BATCH,
        [values],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in associerProfesseurs:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else {
            resolve({
              isConfirm: true,
              message: `${professeurIds.length} professeur(s) associé(s) avec succès`,
            });
          }
        }
      );
    });
  }

  /**
   * Supprimer tous les professeurs d'un cours récurrent
   */
  async deleteProfesseursByCoursRecurrent(
    coursRecurrentId: number
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_PROFESSEURS_BY_COURS_RECURRENT,
        [coursRecurrentId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in deleteProfesseursByCoursRecurrent:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Professeurs supprimés avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Supprimer un professeur spécifique d'un cours récurrent
   */
  async deleteProfesseurFromCoursRecurrent(
    coursRecurrentId: number,
    professeurId: number
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_PROFESSEUR_FROM_COURS_RECURRENT,
        [coursRecurrentId, professeurId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in deleteProfesseurFromCoursRecurrent:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Association non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Professeur supprimé du cours avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Créer un nouveau professeur
   */
  async createProfesseur(
    nom: string,
    prenom: string,
    email?: string
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_PROFESSEUR,
        [nom, prenom, email || null],
        (error, result: any) => {
          if (error) {
            console.error('[CoursWriteRepository] Error in createProfesseur:', error);
            reject(error);
          } else {
            resolve(result.insertId);
          }
        }
      );
    });
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ============================================================================

  /**
   * Convertir un nom de jour en numéro (0-6)
   */
  private getJourSemaineNumber(jourName: string): number {
    const jours: Record<string, number> = {
      dimanche: 0,
      lundi: 1,
      mardi: 2,
      mercredi: 3,
      jeudi: 4,
      vendredi: 5,
      samedi: 6,
    };
    return jours[jourName.toLowerCase()] ?? -1;
  }
}
