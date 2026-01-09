/**
 * Repository des INSCRIPTIONS pour le module Cours
 * Responsabilité: Gestion des inscriptions et présences
 */

import type MysqlConnector from '../../../connector/mysqlconnector.js';
import type {
  Inscription,
  InscriptionRow,
  InscriptionData,
  CoursConfirmationResult,
  VerificationInscription,
} from '../types.js';
import * as queries from '../queries/index.js';

/**
 * Repository pour les opérations sur les inscriptions
 */
export class CoursInscriptionsRepository {
  constructor(private mysqlConnector: MysqlConnector) {}

  // ============================================================================
  // INSCRIPTION - CRÉATION
  // ============================================================================

  /**
   * Inscrire un utilisateur à un cours
   */
  async inscrireUtilisateur(
    utilisateurId: number,
    coursId: number,
    notes?: string
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.INSERT_INSCRIPTION,
        [utilisateurId, coursId, notes || null],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in inscrireUtilisateur:', error);
            if (error.code === 'ER_DUP_ENTRY') {
              resolve({
                isConfirm: false,
                message: 'Utilisateur déjà inscrit à ce cours',
              });
            } else {
              resolve({
                isConfirm: false,
                message: `Erreur lors de l'inscription: ${error.message}`,
              });
            }
          } else {
            resolve({
              isConfirm: true,
              message: 'Inscription réussie',
              data: result.insertId,
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // INSCRIPTION - SUPPRESSION
  // ============================================================================

  /**
   * Désinscrire un utilisateur d'un cours par ID d'inscription
   */
  async desinscrireUtilisateur(inscriptionId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_INSCRIPTION,
        [inscriptionId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in desinscrireUtilisateur:', error);
            resolve({
              isConfirm: false,
              message: `Erreur lors de la désinscription: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Inscription non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Désinscription réussie',
            });
          }
        }
      );
    });
  }

  /**
   * Désinscrire un utilisateur par utilisateur_id et cours_id
   */
  async desinscrireUtilisateurByCours(
    utilisateurId: number,
    coursId: number
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_INSCRIPTION_BY_USER_COURS,
        [utilisateurId, coursId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in desinscrireUtilisateurByCours:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Aucune inscription trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Désinscription réussie',
            });
          }
        }
      );
    });
  }

  /**
   * Supprimer toutes les inscriptions d'un cours
   */
  async deleteInscriptionsByCours(coursId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_INSCRIPTIONS_BY_COURS,
        [coursId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in deleteInscriptionsByCours:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else {
            resolve({
              isConfirm: true,
              message: `${result.affectedRows} inscription(s) supprimée(s)`,
              data: result.affectedRows,
            });
          }
        }
      );
    });
  }

  /**
   * Supprimer toutes les inscriptions d'un utilisateur
   */
  async deleteInscriptionsByUser(utilisateurId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.DELETE_INSCRIPTIONS_BY_USER,
        [utilisateurId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in deleteInscriptionsByUser:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else {
            resolve({
              isConfirm: true,
              message: `${result.affectedRows} inscription(s) supprimée(s)`,
              data: result.affectedRows,
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // PRÉSENCE - GESTION
  // ============================================================================

  /**
   * Marquer la présence d'un utilisateur
   */
  async marquerPresence(
    inscriptionId: number,
    present: boolean
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_INSCRIPTION_PRESENCE,
        [present ? 1 : 0, inscriptionId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in marquerPresence:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Inscription non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: `Présence ${present ? 'confirmée' : 'annulée'} avec succès`,
            });
          }
        }
      );
    });
  }

  /**
   * Valider la présence (marquer présent et statut validé)
   */
  async validerPresence(inscriptionId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.VALIDATE_INSCRIPTION_PRESENCE,
        [inscriptionId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in validerPresence:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Inscription non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Présence validée avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Annuler la présence (marquer absent)
   */
  async annulerPresence(inscriptionId: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CANCEL_INSCRIPTION_PRESENCE,
        [inscriptionId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in annulerPresence:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Inscription non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Présence annulée avec succès',
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // INSCRIPTION - MISE À JOUR
  // ============================================================================

  /**
   * Mettre à jour le statut d'une inscription
   */
  async updateInscriptionStatus(
    inscriptionId: number,
    statusId: number
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_INSCRIPTION_STATUS,
        [statusId, inscriptionId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in updateInscriptionStatus:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Inscription non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Statut mis à jour avec succès',
            });
          }
        }
      );
    });
  }

  /**
   * Mettre à jour les notes d'une inscription
   */
  async updateInscriptionNotes(
    inscriptionId: number,
    notes: string
  ): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.UPDATE_INSCRIPTION_NOTES,
        [notes, inscriptionId],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in updateInscriptionNotes:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else if (result.affectedRows === 0) {
            resolve({
              isConfirm: false,
              message: 'Inscription non trouvée',
            });
          } else {
            resolve({
              isConfirm: true,
              message: 'Notes mises à jour avec succès',
            });
          }
        }
      );
    });
  }

  // ============================================================================
  // VÉRIFICATION
  // ============================================================================

  /**
   * Vérifier si un utilisateur est inscrit à un cours
   */
  async verifierInscription(
    utilisateurId: number,
    coursId: number
  ): Promise<VerificationInscription> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CHECK_INSCRIPTION_EXISTS,
        [utilisateurId, coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in verifierInscription:', error);
            resolve({
              isBooked: false,
              isFind: false,
              message: `Erreur lors de la vérification: ${error.message}`,
            });
          } else {
            const exists = results[0]?.exists_count > 0;
            if (exists) {
              // Récupérer les détails de l'inscription
              this.mysqlConnector.query(
                queries.CHECK_DUPLICATE_INSCRIPTION,
                [utilisateurId, coursId],
                (err, inscriptions: any[]) => {
                  if (err || !inscriptions || inscriptions.length === 0) {
                    resolve({
                      isBooked: true,
                      isFind: true,
                      message: 'Utilisateur déjà inscrit',
                    });
                  } else {
                    resolve({
                      isBooked: true,
                      isFind: true,
                      message: 'Utilisateur déjà inscrit',
                      inscriptionId: inscriptions[0].id,
                      userId: utilisateurId,
                    });
                  }
                }
              );
            } else {
              resolve({
                isBooked: false,
                isFind: true,
                message: 'Utilisateur non inscrit',
              });
            }
          }
        }
      );
    });
  }

  /**
   * Récupérer une inscription par ID
   */
  async getInscriptionById(inscriptionId: number): Promise<Inscription | null> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        'SELECT * FROM inscriptions WHERE id = ?',
        [inscriptionId],
        (error, results: InscriptionRow[]) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in getInscriptionById:', error);
            reject(error);
          } else if (results.length === 0) {
            resolve(null);
          } else {
            resolve(results[0] as Inscription);
          }
        }
      );
    });
  }

  /**
   * Récupérer toutes les inscriptions d'un utilisateur
   */
  async getInscriptionsByUser(utilisateurId: number): Promise<Inscription[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        'SELECT * FROM inscriptions WHERE utilisateur_id = ? ORDER BY date_inscription DESC',
        [utilisateurId],
        (error, results: InscriptionRow[]) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in getInscriptionsByUser:', error);
            reject(error);
          } else {
            resolve(results as Inscription[]);
          }
        }
      );
    });
  }

  /**
   * Récupérer toutes les inscriptions d'un cours
   */
  async getInscriptionsByCours(coursId: number): Promise<Inscription[]> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        'SELECT * FROM inscriptions WHERE cours_id = ? ORDER BY date_inscription ASC',
        [coursId],
        (error, results: InscriptionRow[]) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in getInscriptionsByCours:', error);
            reject(error);
          } else {
            resolve(results as Inscription[]);
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
        queries.COUNT_INSCRIPTIONS_BY_COURS,
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in countInscriptionsByCours:', error);
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  /**
   * Compter les présents pour un cours
   */
  async countPresentsByCours(coursId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        'SELECT COUNT(*) as total FROM inscriptions WHERE cours_id = ? AND present = 1',
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in countPresentsByCours:', error);
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  /**
   * Compter les absents pour un cours
   */
  async countAbsentsByCours(coursId: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        'SELECT COUNT(*) as total FROM inscriptions WHERE cours_id = ? AND present = 0',
        [coursId],
        (error, results: any[]) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in countAbsentsByCours:', error);
            reject(error);
          } else {
            resolve(results[0]?.total || 0);
          }
        }
      );
    });
  }

  // ============================================================================
  // MAINTENANCE
  // ============================================================================

  /**
   * Nettoyer les anciennes inscriptions (cours passés de plus de X jours)
   */
  async cleanupOldInscriptions(daysOld: number): Promise<CoursConfirmationResult> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(
        queries.CLEANUP_OLD_INSCRIPTIONS,
        [daysOld],
        (error, result: any) => {
          if (error) {
            console.error('[CoursInscriptionsRepository] Error in cleanupOldInscriptions:', error);
            resolve({
              isConfirm: false,
              message: `Erreur: ${error.message}`,
            });
          } else {
            resolve({
              isConfirm: true,
              message: `${result.affectedRows} ancienne(s) inscription(s) supprimée(s)`,
              data: result.affectedRows,
            });
          }
        }
      );
    });
  }
}
