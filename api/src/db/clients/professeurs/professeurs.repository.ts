/**
 * Repository principal pour le module professeurs
 * Orchestrateur qui coordonne les opérations de lecture, écriture et validation
 */

import { ProfesseursReadRepository } from './repositories/read.repository.js';
import { ProfesseursWriteRepository } from './repositories/write.repository.js';
import { ProfesseursValidationRepository } from './repositories/validation.repository.js';
import {
  Professeur,
  ProfesseurComplet,
  CoursRecurrent,
  Utilisateur,
  ConfirmationResult,
  VerifyResultWithData,
  ProfesseursSearchResult,
  PlanningCoursResult,
  AjouterProfesseurDTO,
  AjouterProfesseursBatchDTO,
  ModifierStatutProfesseurDTO,
  RetirerPromotionDTO,
  PROFESSEUR_STATUS_ID,
  UTILISATEUR_STATUS_ID,
} from './types.js';

/**
 * Repository principal pour la gestion des professeurs
 * Pattern Singleton
 */
export class ProfesseursRepository {
  private static instance: ProfesseursRepository;

  private readRepository: ProfesseursReadRepository;
  private writeRepository: ProfesseursWriteRepository;
  private validationRepository: ProfesseursValidationRepository;

  private constructor() {
    this.readRepository = new ProfesseursReadRepository();
    this.writeRepository = new ProfesseursWriteRepository();
    this.validationRepository = new ProfesseursValidationRepository();
  }

  /**
   * Récupère l'instance singleton du repository
   */
  public static getInstance(): ProfesseursRepository {
    if (!ProfesseursRepository.instance) {
      ProfesseursRepository.instance = new ProfesseursRepository();
    }
    return ProfesseursRepository.instance;
  }

  // ============================================================================
  // Opérations de lecture
  // ============================================================================

  /**
   * Récupère tous les professeurs
   */
  async obtenirLesProfesseurs(): Promise<VerifyResultWithData<Professeur[]>> {
    try {
      const professeurs = await this.readRepository.getAllProfesseurs();

      return {
        isFind: true,
        message: professeurs.length > 0 ? 'Professeurs trouvés' : 'Aucun professeur trouvé',
        data: professeurs,
      };
    } catch (error: any) {
      console.error('Erreur lors de la récupération des professeurs:', error);
      return {
        isFind: false,
        message: error.message || 'Erreur lors de la récupération des professeurs',
        data: [],
      };
    }
  }

  /**
   * Récupère un professeur par son ID
   */
  async obtenirProfesseurParId(id: number): Promise<Professeur | null> {
    try {
      // Valider l'existence
      const exists = await this.validationRepository.professeurExists(id);
      if (!exists) {
        console.log(`Professeur avec l'ID ${id} non trouvé.`);
        return null;
      }

      return await this.readRepository.getProfesseurById(id);
    } catch (error: any) {
      console.error(`Erreur lors de la récupération du professeur ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par son ID (peu importe le statut)
   */
  async obtenirUtilisateurParId(id: number): Promise<Utilisateur | null> {
    try {
      return await this.readRepository.getUtilisateurById(id);
    } catch (error: any) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${id}:`, error);
      throw error;
    }
  }

  /**
   * Recherche des professeurs par terme
   */
  async rechercherProfesseurs(
    searchTerm: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ProfesseursSearchResult> {
    try {
      return await this.readRepository.searchProfesseurs(searchTerm, limit, offset);
    } catch (error: any) {
      console.error('Erreur lors de la recherche des professeurs:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre total de professeurs
   */
  async compterProfesseurs(): Promise<number> {
    try {
      return await this.readRepository.countProfesseurs();
    } catch (error: any) {
      console.error('Erreur lors du comptage des professeurs:', error);
      throw error;
    }
  }

  // ============================================================================
  // Opérations de lecture du planning
  // ============================================================================

  /**
   * Récupère le planning des cours d'un professeur
   */
  async obtenirPlanningCoursProfesseur(inputId: number): Promise<VerifyResultWithData<CoursRecurrent[]>> {
    try {
      const planning = await this.readRepository.getPlanningCoursProfesseur(inputId);

      return {
        isFind: true,
        message: planning.cours.length > 0
          ? 'Planning des cours trouvé'
          : 'Aucun cours trouvé pour cet utilisateur/professeur',
        data: planning.cours,
      };
    } catch (error: any) {
      console.error(`Erreur lors de la récupération du planning pour l'ID ${inputId}:`, error);
      return {
        isFind: false,
        message: error.message || 'Erreur lors de la récupération du planning',
        data: [],
      };
    }
  }

  /**
   * Récupère les cours d'un professeur
   */
  async obtenirCoursProfesseur(professeurId: number): Promise<CoursRecurrent[]> {
    try {
      return await this.readRepository.getCoursProfesseurByDateRange(professeurId);
    } catch (error: any) {
      console.error(`Erreur lors de la récupération des cours du professeur ${professeurId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // Opérations d'écriture - Gestion du statut
  // ============================================================================

  /**
   * Modifie le statut d'un professeur
   */
  async modifierStatutProfesseur(id: number, status_id: number): Promise<ConfirmationResult> {
    try {
      // Valider l'existence de l'utilisateur
      const userExists = await this.validationRepository.userExists(id);
      if (!userExists) {
        return {
          isConfirm: false,
          message: `L'utilisateur avec l'ID ${id} n'existe pas.`,
        };
      }

      const dto: ModifierStatutProfesseurDTO = { id, status_id };
      return await this.writeRepository.modifierStatutProfesseur(dto);
    } catch (error: any) {
      console.error(`Erreur lors de la modification du statut du professeur ${id}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors de la modification du statut.',
      };
    }
  }

  /**
   * Ajoute/promeut un ou plusieurs utilisateurs en professeurs
   */
  async ajouterUnProfesseur(userData: AjouterProfesseursBatchDTO | AjouterProfesseurDTO): Promise<ConfirmationResult> {
    try {
      // Extraire les IDs à valider
      let userIds: number[] = [];

      if ('utilisateurs' in userData && Array.isArray(userData.utilisateurs)) {
        userIds = userData.utilisateurs.map((u) =>
          typeof u === 'object' ? u.id : Number(u)
        );
      } else if ('id' in userData) {
        userIds = [userData.id];
      }

      // Valider que tous les utilisateurs existent
      const existingIds = await this.validationRepository.usersExist(userIds);
      const missingIds = userIds.filter(id => !existingIds.includes(id));

      if (missingIds.length > 0) {
        return {
          isConfirm: false,
          message: `Les utilisateurs suivants n'existent pas: ${missingIds.join(', ')}`,
        };
      }

      // Vérifier quels utilisateurs sont déjà professeurs
      const alreadyProfesseurs: number[] = [];
      for (const id of userIds) {
        const isAlready = await this.validationRepository.isUserAlreadyProfesseur(id);
        if (isAlready) {
          alreadyProfesseurs.push(id);
        }
      }

      if (alreadyProfesseurs.length === userIds.length) {
        return {
          isConfirm: true,
          message: 'Tous les utilisateurs sont déjà professeurs.',
        };
      }

      // Procéder à l'ajout
      return await this.writeRepository.ajouterUnProfesseur(userData);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de professeur(s):', error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors de l\'ajout de professeur(s).',
      };
    }
  }

  /**
   * Retire la promotion professeur d'un utilisateur
   */
  async retirerPromotionProfesseur(id: number): Promise<ConfirmationResult> {
    try {
      // Valider que le professeur existe
      const professeurExists = await this.validationRepository.professeurExists(id);
      if (!professeurExists) {
        return {
          isConfirm: false,
          message: `Le professeur avec l'ID ${id} n'existe pas.`,
        };
      }

      // Valider qu'il peut être rétrogradé (pas de cours actifs)
      const validation = await this.validationRepository.validateDemotionFromProfesseur(id);
      if (!validation.isValid) {
        return {
          isConfirm: false,
          message: `Impossible de retirer la promotion: ${validation.errors.join(', ')}`,
        };
      }

      const dto: RetirerPromotionDTO = { id };
      return await this.writeRepository.retirerPromotionProfesseur(dto);
    } catch (error: any) {
      console.error(`Erreur lors du retrait de promotion du professeur ${id}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors du retrait de la promotion.',
      };
    }
  }

  /**
   * Promeut un utilisateur au rang de professeur
   */
  async promouvoirUtilisateur(userId: number): Promise<ConfirmationResult> {
    try {
      // Valider la promotion
      const validation = await this.validationRepository.validatePromotionToProfesseur(userId);
      if (!validation.isValid) {
        return {
          isConfirm: false,
          message: `Impossible de promouvoir: ${validation.errors.join(', ')}`,
        };
      }

      return await this.writeRepository.promoteUserToProfesseur(userId);
    } catch (error: any) {
      console.error(`Erreur lors de la promotion de l'utilisateur ${userId}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors de la promotion.',
      };
    }
  }

  // ============================================================================
  // Opérations d'écriture - Gestion des cours
  // ============================================================================

  /**
   * Assigne un professeur à un cours
   */
  async assignerProfesseurACours(coursId: number, professeurId: number): Promise<ConfirmationResult> {
    try {
      // Valider que le professeur existe
      const professeurExists = await this.validationRepository.professeurExists(professeurId);
      if (!professeurExists) {
        return {
          isConfirm: false,
          message: `Le professeur avec l'ID ${professeurId} n'existe pas.`,
        };
      }

      // Valider que le cours existe
      const coursExists = await this.validationRepository.coursRecurrentExists(coursId);
      if (!coursExists) {
        return {
          isConfirm: false,
          message: `Le cours avec l'ID ${coursId} n'existe pas.`,
        };
      }

      // Vérifier si déjà assigné
      const isAlreadyAssigned = await this.validationRepository.isProfesseurAssignedToCours(professeurId, coursId);
      if (isAlreadyAssigned) {
        return {
          isConfirm: true,
          message: 'Le professeur est déjà assigné à ce cours.',
        };
      }

      return await this.writeRepository.assignProfesseurToCours(coursId, professeurId);
    } catch (error: any) {
      console.error(`Erreur lors de l'assignation du professeur ${professeurId} au cours ${coursId}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors de l\'assignation du professeur au cours.',
      };
    }
  }

  /**
   * Retire un professeur d'un cours
   */
  async retirerProfesseurDuCours(coursId: number, professeurId: number): Promise<ConfirmationResult> {
    try {
      // Valider que le professeur est assigné au cours
      const isAssigned = await this.validationRepository.isProfesseurAssignedToCours(professeurId, coursId);
      if (!isAssigned) {
        return {
          isConfirm: false,
          message: 'Le professeur n\'est pas assigné à ce cours.',
        };
      }

      return await this.writeRepository.removeProfesseurFromCours(coursId, professeurId);
    } catch (error: any) {
      console.error(`Erreur lors du retrait du professeur ${professeurId} du cours ${coursId}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors du retrait du professeur du cours.',
      };
    }
  }

  /**
   * Retire un professeur de tous ses cours
   */
  async retirerProfesseurDeTousLesCours(professeurId: number): Promise<ConfirmationResult> {
    try {
      // Valider que le professeur existe
      const professeurExists = await this.validationRepository.professeurExists(professeurId);
      if (!professeurExists) {
        return {
          isConfirm: false,
          message: `Le professeur avec l'ID ${professeurId} n'existe pas.`,
        };
      }

      return await this.writeRepository.removeProfesseurFromAllCours(professeurId);
    } catch (error: any) {
      console.error(`Erreur lors du retrait du professeur ${professeurId} de tous ses cours:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors du retrait du professeur de tous ses cours.',
      };
    }
  }

  // ============================================================================
  // Opérations d'écriture - Mise à jour des informations
  // ============================================================================

  /**
   * Met à jour les informations d'un utilisateur/professeur
   */
  async mettreAJourUtilisateur(
    userId: number,
    firstName: string,
    lastName: string,
    email: string,
    genreId: number,
    dateOfBirth: string,
    gradeId: number
  ): Promise<ConfirmationResult> {
    try {
      // Valider que l'utilisateur existe
      const userExists = await this.validationRepository.userExists(userId);
      if (!userExists) {
        return {
          isConfirm: false,
          message: `L'utilisateur avec l'ID ${userId} n'existe pas.`,
        };
      }

      // Valider l'email (s'il est différent)
      const emailExists = await this.validationRepository.emailExists(email, userId);
      if (emailExists) {
        return {
          isConfirm: false,
          message: 'Cet email est déjà utilisé par un autre utilisateur.',
        };
      }

      // Valider le grade
      const gradeExists = await this.validationRepository.gradeExists(gradeId);
      if (!gradeExists) {
        return {
          isConfirm: false,
          message: `Le grade avec l'ID ${gradeId} n'existe pas.`,
        };
      }

      // Valider le genre
      const genreExists = await this.validationRepository.genreExists(genreId);
      if (!genreExists) {
        return {
          isConfirm: false,
          message: `Le genre avec l'ID ${genreId} n'existe pas.`,
        };
      }

      return await this.writeRepository.updateUserInfo(
        userId,
        firstName,
        lastName,
        email,
        genreId,
        dateOfBirth,
        gradeId
      );
    } catch (error: any) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur ${userId}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors de la mise à jour de l\'utilisateur.',
      };
    }
  }

  /**
   * Met à jour l'email d'un utilisateur
   */
  async mettreAJourEmail(userId: number, email: string): Promise<ConfirmationResult> {
    try {
      // Valider l'unicité de l'email
      const emailExists = await this.validationRepository.emailExists(email, userId);
      if (emailExists) {
        return {
          isConfirm: false,
          message: 'Cet email est déjà utilisé par un autre utilisateur.',
        };
      }

      return await this.writeRepository.updateUserEmail(userId, email);
    } catch (error: any) {
      console.error(`Erreur lors de la mise à jour de l'email de l'utilisateur ${userId}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors de la mise à jour de l\'email.',
      };
    }
  }

  /**
   * Met à jour le grade d'un utilisateur
   */
  async mettreAJourGrade(userId: number, gradeId: number): Promise<ConfirmationResult> {
    try {
      // Valider que le grade existe
      const gradeExists = await this.validationRepository.gradeExists(gradeId);
      if (!gradeExists) {
        return {
          isConfirm: false,
          message: `Le grade avec l'ID ${gradeId} n'existe pas.`,
        };
      }

      return await this.writeRepository.updateUserGrade(userId, gradeId);
    } catch (error: any) {
      console.error(`Erreur lors de la mise à jour du grade de l'utilisateur ${userId}:`, error);
      return {
        isConfirm: false,
        message: error.message || 'Erreur lors de la mise à jour du grade.',
      };
    }
  }

  // ============================================================================
  // Opérations de validation (exposées publiquement)
  // ============================================================================

  /**
   * Vérifie si un utilisateur existe
   */
  async utilisateurExiste(userId: number): Promise<boolean> {
    try {
      return await this.validationRepository.userExists(userId);
    } catch (error: any) {
      console.error(`Erreur lors de la vérification d'existence de l'utilisateur ${userId}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si un professeur existe
   */
  async professeurExiste(userId: number): Promise<boolean> {
    try {
      return await this.validationRepository.professeurExists(userId);
    } catch (error: any) {
      console.error(`Erreur lors de la vérification d'existence du professeur ${userId}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur est déjà professeur
   */
  async estDejaProfesseur(userId: number): Promise<boolean> {
    try {
      return await this.validationRepository.isUserAlreadyProfesseur(userId);
    } catch (error: any) {
      console.error(`Erreur lors de la vérification du statut professeur de l'utilisateur ${userId}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si un professeur a des cours actifs
   */
  async aProfesseurDesCoursActifs(professeurId: number): Promise<boolean> {
    try {
      return await this.validationRepository.hasActiveCours(professeurId);
    } catch (error: any) {
      console.error(`Erreur lors de la vérification des cours actifs du professeur ${professeurId}:`, error);
      return false;
    }
  }

  /**
   * Compte le nombre de cours d'un professeur
   */
  async compterCoursProfesseur(professeurId: number): Promise<number> {
    try {
      return await this.validationRepository.countProfesseurCours(professeurId);
    } catch (error: any) {
      console.error(`Erreur lors du comptage des cours du professeur ${professeurId}:`, error);
      return 0;
    }
  }

  /**
   * Vérifie si un email est unique
   */
  async emailEstUnique(email: string): Promise<boolean> {
    try {
      return await this.validationRepository.isEmailUnique(email);
    } catch (error: any) {
      console.error(`Erreur lors de la vérification d'unicité de l'email:`, error);
      return false;
    }
  }

  // ============================================================================
  // Utilitaires
  // ============================================================================

  /**
   * Obtient le statut d'un utilisateur
   */
  async obtenirStatutUtilisateur(userId: number): Promise<number | null> {
    try {
      return await this.validationRepository.getUserStatus(userId);
    } catch (error: any) {
      console.error(`Erreur lors de la récupération du statut de l'utilisateur ${userId}:`, error);
      return null;
    }
  }

  /**
   * Vérifie les dépendances d'un professeur
   */
  async verifierDependancesProfesseur(professeurId: number): Promise<{
    coursCount: number;
    coursPonctuelsCount: number;
    hasDependencies: boolean;
  }> {
    try {
      return await this.validationRepository.checkProfesseurDependencies(professeurId);
    } catch (error: any) {
      console.error(`Erreur lors de la vérification des dépendances du professeur ${professeurId}:`, error);
      return {
        coursCount: 0,
        coursPonctuelsCount: 0,
        hasDependencies: false,
      };
    }
  }
}

/**
 * Fonction helper pour obtenir l'instance singleton du repository
 */
export function getProfesseursRepository(): ProfesseursRepository {
  return ProfesseursRepository.getInstance();
}
