/**
 * Repository d'écriture pour le module professeurs
 * Gère toutes les opérations d'écriture sur les professeurs
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import {
  ConfirmationResult,
  AjouterProfesseurDTO,
  AjouterProfesseursBatchDTO,
  ModifierStatutProfesseurDTO,
  RetirerPromotionDTO,
  Utilisateur,
  PROFESSEUR_STATUS_ID,
  UTILISATEUR_STATUS_ID,
} from '../types.js';
import {
  UPDATE_USER_STATUS,
  PROMOTE_USER_TO_PROFESSEUR,
  DEMOTE_PROFESSEUR_TO_USER,
  PROMOTE_USERS_TO_PROFESSEUR_BATCH,
  ASSIGN_PROFESSEUR_TO_COURS,
  REMOVE_PROFESSEUR_FROM_COURS,
  REMOVE_PROFESSEUR_FROM_ALL_COURS,
  CREATE_PROFESSEUR_ENTRY,
  DELETE_PROFESSEUR_ENTRY,
  UPDATE_PROFESSEUR_ENTRY,
  UPDATE_USER_INFO,
  UPDATE_USER_EMAIL,
  UPDATE_USER_GRADE,
  SOFT_DELETE_USER,
  HARD_DELETE_USER,
} from '../queries/index.js';

export class ProfesseursWriteRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // Gestion du statut professeur
  // ============================================================================

  /**
   * Modifie le statut d'un professeur/utilisateur
   */
  async modifierStatutProfesseur(dto: ModifierStatutProfesseurDTO): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(UPDATE_USER_STATUS, [dto.status_id, dto.id], (error) => {
        if (error) {
          console.error(`Erreur lors de la modification du statut de l'utilisateur ${dto.id}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Statut de l'utilisateur ${dto.id} modifié avec succès (status_id: ${dto.status_id}).`);
        resolve({
          isConfirm: true,
          message: 'Statut modifié avec succès.',
        });
      });
    });
  }

  /**
   * Promeut un utilisateur au rang de professeur
   */
  async promoteUserToProfesseur(userId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(PROMOTE_USER_TO_PROFESSEUR, [userId], (error) => {
        if (error) {
          console.error(`Erreur lors de la promotion de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Utilisateur ${userId} promu professeur avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Utilisateur promu professeur avec succès.',
        });
      });
    });
  }

  /**
   * Retire la promotion professeur d'un utilisateur
   */
  async retirerPromotionProfesseur(dto: RetirerPromotionDTO): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(DEMOTE_PROFESSEUR_TO_USER, [dto.id], (error) => {
        if (error) {
          console.error(`Erreur lors du retrait de la promotion du professeur ${dto.id}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Promotion retirée pour le professeur ${dto.id}.`);
        resolve({
          isConfirm: true,
          message: 'Promotion retirée avec succès. Le professeur a été retiré de tous ses cours.',
        });
      });
    });
  }

  /**
   * Ajoute/promeut un ou plusieurs utilisateurs en professeurs
   */
  async ajouterUnProfesseur(userData: AjouterProfesseursBatchDTO | AjouterProfesseurDTO): Promise<ConfirmationResult> {
    console.log('[ajouterUnProfesseur] userData reçu:', userData);

    let users: AjouterProfesseurDTO[] = [];

    if ('utilisateurs' in userData && Array.isArray(userData.utilisateurs)) {
      // Batch: plusieurs utilisateurs
      if (typeof userData.utilisateurs[0] === 'object') {
        users = userData.utilisateurs as AjouterProfesseurDTO[];
      } else {
        // Convertir les IDs en objets
        users = (userData.utilisateurs as number[]).map((id) => ({ id: Number(id) }));
      }
    } else {
      // Un seul utilisateur
      users = [userData as AjouterProfesseurDTO];
    }

    console.log('[ajouterUnProfesseur] users à traiter:', users);

    return new Promise<ConfirmationResult>((resolve, reject) => {
      let processed = 0;
      let errors: string[] = [];
      let successCount = 0;

      if (users.length === 0) {
        resolve({
          isConfirm: false,
          message: 'Aucun utilisateur à promouvoir.',
        });
        return;
      }

      users.forEach((user, idx) => {
        console.log(`[ajouterUnProfesseur] Traitement user ${idx}:`, user);

        // Vérifier si l'utilisateur existe
        const selectSql = `SELECT * FROM utilisateurs WHERE id = ?`;
        this.mysqlConnector.query(selectSql, [user.id], (error, results) => {
          if (error) {
            console.log(`[ajouterUnProfesseur] Erreur SELECT id ${user.id}:`, error);
            errors.push(`Erreur vérification id ${user.id}: ${error.message}`);
            checkDone();
            return;
          }

          console.log(`[ajouterUnProfesseur] Résultat SELECT id ${user.id}:`, results);

          if (results.length > 0) {
            const utilisateur = results[0];
            console.log(`[ajouterUnProfesseur] Utilisateur trouvé id ${user.id}:`, utilisateur);

            if (utilisateur.status_id === PROFESSEUR_STATUS_ID) {
              console.log(`[ajouterUnProfesseur] Utilisateur déjà professeur id ${user.id}`);
              successCount++;
              checkDone();
            } else {
              // Promouvoir l'utilisateur
              this.mysqlConnector.query(PROMOTE_USER_TO_PROFESSEUR, [utilisateur.id], (updateError) => {
                if (updateError) {
                  console.log(`[ajouterUnProfesseur] Erreur UPDATE id ${user.id}:`, updateError);
                  errors.push(`Erreur update id ${user.id}: ${updateError.message}`);
                } else {
                  console.log(`[ajouterUnProfesseur] Promotion réussie id ${user.id}`);
                  successCount++;
                }
                checkDone();
              });
            }
          } else {
            console.log(`[ajouterUnProfesseur] Utilisateur NON trouvé id ${user.id}`);
            errors.push(`Utilisateur id ${user.id} non trouvé, ajout impossible.`);
            checkDone();
          }
        });
      });

      function checkDone() {
        processed++;
        console.log(`[ajouterUnProfesseur] processed: ${processed}/${users.length}`);
        if (processed === users.length) {
          if (errors.length === 0) {
            console.log('[ajouterUnProfesseur] Tous promus');
            resolve({
              isConfirm: true,
              message: 'Tous les utilisateurs ont été promus professeurs.',
            });
          } else if (successCount > 0) {
            console.log('[ajouterUnProfesseur] Promotion partielle, erreurs:', errors);
            resolve({
              isConfirm: true,
              message: `Promotion partielle. ${successCount} réussis. Erreurs: ${errors.join('; ')}`,
            });
          } else {
            console.log('[ajouterUnProfesseur] Aucune promotion, erreurs:', errors);
            resolve({
              isConfirm: false,
              message: `Aucune promotion. Erreurs: ${errors.join('; ')}`,
            });
          }
        }
      }
    });
  }

  /**
   * Promeut plusieurs utilisateurs en batch
   */
  async promoteUsersToProfesseurBatch(userIds: number[]): Promise<ConfirmationResult> {
    if (userIds.length === 0) {
      return Promise.resolve({
        isConfirm: false,
        message: 'Aucun utilisateur à promouvoir.',
      });
    }

    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(PROMOTE_USERS_TO_PROFESSEUR_BATCH, [userIds], (error, results) => {
        if (error) {
          console.error('Erreur lors de la promotion en batch:', error.message);
          reject(error);
          return;
        }

        const affectedRows = results.affectedRows || 0;
        console.log(`✅ ${affectedRows} utilisateurs promus professeurs avec succès.`);

        resolve({
          isConfirm: true,
          message: `${affectedRows} utilisateurs promus professeurs avec succès.`,
        });
      });
    });
  }

  // ============================================================================
  // Gestion des cours
  // ============================================================================

  /**
   * Assigne un professeur à un cours récurrent
   */
  async assignProfesseurToCours(coursId: number, professeurId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(ASSIGN_PROFESSEUR_TO_COURS, [coursId, professeurId], (error) => {
        if (error) {
          console.error(`Erreur lors de l'assignation du professeur ${professeurId} au cours ${coursId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Professeur ${professeurId} assigné au cours ${coursId} avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Professeur assigné au cours avec succès.',
        });
      });
    });
  }

  /**
   * Retire un professeur d'un cours récurrent
   */
  async removeProfesseurFromCours(coursId: number, professeurId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(REMOVE_PROFESSEUR_FROM_COURS, [coursId, professeurId], (error) => {
        if (error) {
          console.error(`Erreur lors du retrait du professeur ${professeurId} du cours ${coursId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Professeur ${professeurId} retiré du cours ${coursId} avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Professeur retiré du cours avec succès.',
        });
      });
    });
  }

  /**
   * Retire un professeur de tous ses cours récurrents
   */
  async removeProfesseurFromAllCours(professeurId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(REMOVE_PROFESSEUR_FROM_ALL_COURS, [professeurId], (error, results) => {
        if (error) {
          console.error(`Erreur lors du retrait du professeur ${professeurId} de tous ses cours:`, error.message);
          reject(error);
          return;
        }

        const affectedRows = results.affectedRows || 0;
        console.log(`✅ Professeur ${professeurId} retiré de ${affectedRows} cours.`);

        resolve({
          isConfirm: true,
          message: `Professeur retiré de ${affectedRows} cours avec succès.`,
        });
      });
    });
  }

  // ============================================================================
  // Gestion de la table professeurs
  // ============================================================================

  /**
   * Crée une entrée dans la table professeurs
   */
  async createProfesseurEntry(nom: string, prenom: string, email: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.mysqlConnector.query(CREATE_PROFESSEUR_ENTRY, [nom, prenom, email], (error, results) => {
        if (error) {
          console.error('Erreur lors de la création de l\'entrée professeur:', error.message);
          reject(error);
          return;
        }

        const insertId = results.insertId;
        console.log(`✅ Entrée professeur créée avec l'ID ${insertId}.`);
        resolve(insertId);
      });
    });
  }

  /**
   * Supprime une entrée de la table professeurs
   */
  async deleteProfesseurEntry(professeurId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(DELETE_PROFESSEUR_ENTRY, [professeurId], (error) => {
        if (error) {
          console.error(`Erreur lors de la suppression de l'entrée professeur ${professeurId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Entrée professeur ${professeurId} supprimée avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Entrée professeur supprimée avec succès.',
        });
      });
    });
  }

  /**
   * Met à jour les informations d'un professeur dans la table professeurs
   */
  async updateProfesseurEntry(professeurId: number, nom: string, prenom: string, email: string): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(UPDATE_PROFESSEUR_ENTRY, [nom, prenom, email, professeurId], (error) => {
        if (error) {
          console.error(`Erreur lors de la mise à jour de l'entrée professeur ${professeurId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Entrée professeur ${professeurId} mise à jour avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Entrée professeur mise à jour avec succès.',
        });
      });
    });
  }

  // ============================================================================
  // Mise à jour des informations utilisateur
  // ============================================================================

  /**
   * Met à jour les informations de base d'un utilisateur
   */
  async updateUserInfo(
    userId: number,
    firstName: string,
    lastName: string,
    email: string,
    genreId: number,
    dateOfBirth: string,
    gradeId: number
  ): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(
        UPDATE_USER_INFO,
        [firstName, lastName, email, genreId, dateOfBirth, gradeId, userId],
        (error) => {
          if (error) {
            console.error(`Erreur lors de la mise à jour de l'utilisateur ${userId}:`, error.message);
            reject(error);
            return;
          }

          console.log(`✅ Utilisateur ${userId} mis à jour avec succès.`);
          resolve({
            isConfirm: true,
            message: 'Informations utilisateur mises à jour avec succès.',
          });
        }
      );
    });
  }

  /**
   * Met à jour uniquement l'email d'un utilisateur
   */
  async updateUserEmail(userId: number, email: string): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(UPDATE_USER_EMAIL, [email, userId], (error) => {
        if (error) {
          console.error(`Erreur lors de la mise à jour de l'email de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Email de l'utilisateur ${userId} mis à jour avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Email mis à jour avec succès.',
        });
      });
    });
  }

  /**
   * Met à jour uniquement le grade d'un utilisateur
   */
  async updateUserGrade(userId: number, gradeId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(UPDATE_USER_GRADE, [gradeId, userId], (error) => {
        if (error) {
          console.error(`Erreur lors de la mise à jour du grade de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Grade de l'utilisateur ${userId} mis à jour avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Grade mis à jour avec succès.',
        });
      });
    });
  }

  // ============================================================================
  // Suppression
  // ============================================================================

  /**
   * Supprime un utilisateur (soft delete via status)
   */
  async softDeleteUser(userId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(SOFT_DELETE_USER, [userId], (error) => {
        if (error) {
          console.error(`Erreur lors de la suppression soft de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Utilisateur ${userId} supprimé (soft delete) avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Utilisateur supprimé avec succès.',
        });
      });
    });
  }

  /**
   * Supprime définitivement un utilisateur (hard delete)
   */
  async hardDeleteUser(userId: number): Promise<ConfirmationResult> {
    return new Promise<ConfirmationResult>((resolve, reject) => {
      this.mysqlConnector.query(HARD_DELETE_USER, [userId], (error) => {
        if (error) {
          console.error(`Erreur lors de la suppression définitive de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        console.log(`✅ Utilisateur ${userId} supprimé définitivement avec succès.`);
        resolve({
          isConfirm: true,
          message: 'Utilisateur supprimé définitivement avec succès.',
        });
      });
    });
  }
}
