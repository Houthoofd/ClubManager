/**
 * Repository de validation pour le module professeurs
 * Gère toutes les opérations de validation sur les professeurs
 */

import MysqlConnector from '../../../connector/mysqlconnector.js';
import {
  USER_EXISTS,
  PROFESSEUR_EXISTS,
  PROFESSEUR_EXISTS_IN_TABLE,
  USERS_EXIST,
  COURS_RECURRENT_EXISTS,
  IS_USER_ALREADY_PROFESSEUR,
  CAN_USER_BE_PROMOTED,
  GET_USER_STATUS,
  EMAIL_EXISTS,
  IS_EMAIL_UNIQUE,
  IS_PROFESSEUR_ASSIGNED_TO_COURS,
  HAS_ACTIVE_COURS,
  COUNT_PROFESSEUR_COURS,
  COURS_HAS_PROFESSEUR,
  CAN_DEMOTE_PROFESSEUR,
  CHECK_PROFESSEUR_DEPENDENCIES,
  CHECK_USER_PERMISSIONS,
  CHECK_DUPLICATE_PROFESSEUR,
  USERNAME_EXISTS,
  VALIDATE_USER_DATA,
  GRADE_EXISTS,
  GENRE_EXISTS,
} from '../queries/index.js';

export class ProfesseursValidationRepository {
  private mysqlConnector: MysqlConnector;

  constructor() {
    this.mysqlConnector = MysqlConnector.getInstance();
  }

  // ============================================================================
  // Validation d'existence
  // ============================================================================

  /**
   * Vérifie si un utilisateur existe
   */
  async userExists(userId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(USER_EXISTS, [userId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  /**
   * Vérifie si un professeur existe (par ID utilisateur)
   */
  async professeurExists(userId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(PROFESSEUR_EXISTS, [userId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence du professeur ${userId}:`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  /**
   * Vérifie si un professeur existe dans la table professeurs
   */
  async professeurExistsInTable(professeurId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(PROFESSEUR_EXISTS_IN_TABLE, [professeurId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence dans la table professeurs (ID ${professeurId}):`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  /**
   * Vérifie si plusieurs utilisateurs existent et retourne les IDs trouvés
   */
  async usersExist(userIds: number[]): Promise<number[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }

    return new Promise<number[]>((resolve, reject) => {
      this.mysqlConnector.query(USERS_EXIST, [userIds], (error, results) => {
        if (error) {
          console.error('Erreur lors de la vérification d\'existence des utilisateurs:', error.message);
          reject(error);
          return;
        }

        const existingIds = results.map((row: any) => row.id);
        resolve(existingIds);
      });
    });
  }

  /**
   * Vérifie si un cours récurrent existe
   */
  async coursRecurrentExists(coursId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(COURS_RECURRENT_EXISTS, [coursId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence du cours ${coursId}:`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  // ============================================================================
  // Validation de statut
  // ============================================================================

  /**
   * Vérifie si un utilisateur est déjà professeur
   */
  async isUserAlreadyProfesseur(userId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(IS_USER_ALREADY_PROFESSEUR, [userId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification du statut professeur de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        const isProfesseur = results[0]?.count > 0;
        resolve(isProfesseur);
      });
    });
  }

  /**
   * Vérifie si un utilisateur peut être promu professeur
   */
  async canUserBePromoted(userId: number): Promise<{ canPromote: boolean; reason?: string }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(CAN_USER_BE_PROMOTED, [userId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification de promotion de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        if (results.length === 0) {
          resolve({
            canPromote: false,
            reason: 'Utilisateur non trouvé ou déjà professeur',
          });
        } else {
          resolve({
            canPromote: true,
          });
        }
      });
    });
  }

  /**
   * Récupère le statut actuel d'un utilisateur
   */
  async getUserStatus(userId: number): Promise<number | null> {
    return new Promise<number | null>((resolve, reject) => {
      this.mysqlConnector.query(GET_USER_STATUS, [userId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la récupération du statut de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        if (results.length > 0) {
          resolve(results[0].status_id);
        } else {
          resolve(null);
        }
      });
    });
  }

  // ============================================================================
  // Validation d'email
  // ============================================================================

  /**
   * Vérifie si un email existe déjà (pour éviter les doublons)
   */
  async emailExists(email: string, excludeUserId?: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const params = excludeUserId !== undefined ? [email, excludeUserId] : [email, 0];

      this.mysqlConnector.query(EMAIL_EXISTS, params, (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence de l'email ${email}:`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  /**
   * Vérifie si un email est unique dans le système
   */
  async isEmailUnique(email: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(IS_EMAIL_UNIQUE, [email], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'unicité de l'email ${email}:`, error.message);
          reject(error);
          return;
        }

        const isUnique = results[0]?.count === 0;
        resolve(isUnique);
      });
    });
  }

  // ============================================================================
  // Validation des cours
  // ============================================================================

  /**
   * Vérifie si un professeur est assigné à un cours
   */
  async isProfesseurAssignedToCours(professeurId: number, coursId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(IS_PROFESSEUR_ASSIGNED_TO_COURS, [professeurId, coursId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'assignation au cours:`, error.message);
          reject(error);
          return;
        }

        const isAssigned = results[0]?.count > 0;
        resolve(isAssigned);
      });
    });
  }

  /**
   * Vérifie si un professeur a des cours actifs
   */
  async hasActiveCours(professeurId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(HAS_ACTIVE_COURS, [professeurId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification des cours actifs du professeur ${professeurId}:`, error.message);
          reject(error);
          return;
        }

        const hasActive = results[0]?.count > 0;
        resolve(hasActive);
      });
    });
  }

  /**
   * Compte le nombre de cours d'un professeur
   */
  async countProfesseurCours(professeurId: number): Promise<number> {
    return new Promise<number>((resolve, reject) => {
      this.mysqlConnector.query(COUNT_PROFESSEUR_COURS, [professeurId], (error, results) => {
        if (error) {
          console.error(`Erreur lors du comptage des cours du professeur ${professeurId}:`, error.message);
          reject(error);
          return;
        }

        const count = results[0]?.count || 0;
        resolve(count);
      });
    });
  }

  /**
   * Vérifie si un cours a déjà un professeur assigné
   */
  async coursHasProfesseur(coursId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(COURS_HAS_PROFESSEUR, [coursId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification du professeur du cours ${coursId}:`, error.message);
          reject(error);
          return;
        }

        const hasProfesseur = results[0]?.count > 0;
        resolve(hasProfesseur);
      });
    });
  }

  // ============================================================================
  // Validation de contraintes métier
  // ============================================================================

  /**
   * Vérifie si un professeur peut être rétrogradé (pas de cours actifs)
   */
  async canDemoteProfesseur(professeurId: number): Promise<{ canDemote: boolean; reason?: string }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(CAN_DEMOTE_PROFESSEUR, [professeurId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification de rétrogradation du professeur ${professeurId}:`, error.message);
          reject(error);
          return;
        }

        const activeCoursCount = results[0]?.active_cours_count || 0;

        if (activeCoursCount > 0) {
          resolve({
            canDemote: false,
            reason: `Le professeur a ${activeCoursCount} cours actifs`,
          });
        } else {
          resolve({
            canDemote: true,
          });
        }
      });
    });
  }

  /**
   * Vérifie les dépendances d'un professeur avant suppression
   */
  async checkProfesseurDependencies(professeurId: number): Promise<{
    coursCount: number;
    coursPonctuelsCount: number;
    hasDependencies: boolean;
  }> {
    return new Promise((resolve, reject) => {
      this.mysqlConnector.query(CHECK_PROFESSEUR_DEPENDENCIES, [professeurId, professeurId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification des dépendances du professeur ${professeurId}:`, error.message);
          reject(error);
          return;
        }

        const coursCount = results[0]?.cours_count || 0;
        const coursPonctuelsCount = results[0]?.cours_ponctuels_count || 0;
        const hasDependencies = coursCount > 0 || coursPonctuelsCount > 0;

        resolve({
          coursCount,
          coursPonctuelsCount,
          hasDependencies,
        });
      });
    });
  }

  /**
   * Vérifie si un utilisateur a les permissions nécessaires (admin ou professeur)
   */
  async checkUserPermissions(userId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(CHECK_USER_PERMISSIONS, [userId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification des permissions de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        const hasPermissions = results.length > 0;
        resolve(hasPermissions);
      });
    });
  }

  // ============================================================================
  // Validation de doublons
  // ============================================================================

  /**
   * Vérifie les doublons de nom/prénom dans la table professeurs
   */
  async checkDuplicateProfesseur(nom: string, prenom: string, excludeId?: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const params = excludeId !== undefined ? [nom, prenom, excludeId] : [nom, prenom, 0];

      this.mysqlConnector.query(CHECK_DUPLICATE_PROFESSEUR, params, (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification des doublons professeur:`, error.message);
          reject(error);
          return;
        }

        const hasDuplicate = results[0]?.count > 0;
        resolve(hasDuplicate);
      });
    });
  }

  /**
   * Vérifie si un nom d'utilisateur existe déjà
   */
  async usernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      const params = excludeUserId !== undefined ? [username, excludeUserId] : [username, 0];

      this.mysqlConnector.query(USERNAME_EXISTS, params, (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence du nom d'utilisateur ${username}:`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  // ============================================================================
  // Validation de données
  // ============================================================================

  /**
   * Valide les données d'un utilisateur (champs requis présents et valides)
   */
  async validateUserData(userId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(VALIDATE_USER_DATA, [userId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la validation des données de l'utilisateur ${userId}:`, error.message);
          reject(error);
          return;
        }

        const isValid = results[0]?.is_valid === 1;
        resolve(isValid);
      });
    });
  }

  /**
   * Vérifie si un grade existe
   */
  async gradeExists(gradeId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(GRADE_EXISTS, [gradeId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence du grade ${gradeId}:`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  /**
   * Vérifie si un genre existe
   */
  async genreExists(genreId: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      this.mysqlConnector.query(GENRE_EXISTS, [genreId], (error, results) => {
        if (error) {
          console.error(`Erreur lors de la vérification d'existence du genre ${genreId}:`, error.message);
          reject(error);
          return;
        }

        const exists = results[0]?.count > 0;
        resolve(exists);
      });
    });
  }

  // ============================================================================
  // Validations composées (logique métier)
  // ============================================================================

  /**
   * Valide qu'un utilisateur peut être promu professeur
   * (existe, pas déjà professeur, données valides)
   */
  async validatePromotionToProfesseur(userId: number): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Vérifie que l'utilisateur existe
      const userExistsResult = await this.userExists(userId);
      if (!userExistsResult) {
        errors.push(`L'utilisateur avec l'ID ${userId} n'existe pas.`);
      }

      // Vérifie qu'il n'est pas déjà professeur
      const isAlreadyProfesseur = await this.isUserAlreadyProfesseur(userId);
      if (isAlreadyProfesseur) {
        errors.push(`L'utilisateur ${userId} est déjà professeur.`);
      }

      // Vérifie que les données sont valides
      if (userExistsResult) {
        const dataValid = await this.validateUserData(userId);
        if (!dataValid) {
          errors.push(`Les données de l'utilisateur ${userId} sont incomplètes ou invalides.`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('Erreur lors de la validation de promotion:', error);
      throw error;
    }
  }

  /**
   * Valide qu'un professeur peut être rétrogradé
   * (existe, est professeur, pas de cours actifs)
   */
  async validateDemotionFromProfesseur(professeurId: number): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Vérifie que le professeur existe
      const professeurExistsResult = await this.professeurExists(professeurId);
      if (!professeurExistsResult) {
        errors.push(`Le professeur avec l'ID ${professeurId} n'existe pas.`);
      }

      // Vérifie qu'il n'a pas de cours actifs
      const demoteCheck = await this.canDemoteProfesseur(professeurId);
      if (!demoteCheck.canDemote) {
        errors.push(demoteCheck.reason || 'Le professeur ne peut pas être rétrogradé.');
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      console.error('Erreur lors de la validation de rétrogradation:', error);
      throw error;
    }
  }
}
