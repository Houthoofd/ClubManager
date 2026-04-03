import { Inscription } from '../../domain/entities/Inscription.js';
import { IInscriptionRepository } from '../../domain/interfaces/IInscriptionRepository.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';
import {
  CoursNotFoundError,
  InscriptionAlreadyExistsError,
  CoursCompletError,
  CoursPasseError,
} from '../../domain/errors/CoursError.js';
import { UserNotFoundError } from '../../domain/errors/DomainError.js';

/**
 * DTO pour créer une inscription
 */
export interface CreateInscriptionDTO {
  coursId: number;
  utilisateurId: number;
}

/**
 * Configuration pour les limites d'inscription
 * (peut être injecté depuis la configuration de l'application)
 */
export interface InscriptionConfig {
  maxInscriptionsParCours?: number; // Par défaut: 20
}

/**
 * Use Case: Inscrire un utilisateur à un cours
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que le cours existe
 * 3. Vérifier que l'utilisateur existe
 * 4. Vérifier que le cours n'est pas passé
 * 5. Vérifier que l'utilisateur n'est pas déjà inscrit
 * 6. Vérifier que le cours n'est pas complet
 * 7. Vérifier que le cours n'est pas annulé
 * 8. Créer l'entité Inscription
 * 9. Persister l'inscription
 * 10. Retourner l'inscription créée
 *
 * Cette classe orchestre la logique applicative pour l'inscription
 * à un cours en appliquant toutes les règles métier nécessaires.
 */
export class CreateInscriptionUseCase {
  private readonly maxInscriptionsParCours: number;

  constructor(
    private readonly inscriptionRepository: IInscriptionRepository,
    private readonly coursRepository: ICoursRepository,
    private readonly userRepository: IUserRepository,
    config?: InscriptionConfig
  ) {
    this.maxInscriptionsParCours = config?.maxInscriptionsParCours ?? 20;
  }

  /**
   * Exécute le use case de création d'inscription
   *
   * @param dto - DTO contenant l'ID du cours et l'ID de l'utilisateur
   * @returns L'inscription créée avec son ID
   * @throws ValidationError si les données sont invalides
   * @throws CoursNotFoundError si le cours n'existe pas
   * @throws UserNotFoundError si l'utilisateur n'existe pas
   * @throws InscriptionAlreadyExistsError si l'utilisateur est déjà inscrit
   * @throws CoursCompletError si le cours est complet
   * @throws CoursPasseError si le cours est déjà passé
   */
  async execute(dto: CreateInscriptionDTO): Promise<Inscription> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Vérifier que le cours existe
    const cours = await this.coursRepository.findById(dto.coursId);
    if (!cours) {
      throw new CoursNotFoundError(dto.coursId);
    }

    // 3. Vérifier que l'utilisateur existe
    const user = await this.userRepository.findById(dto.utilisateurId);
    if (!user) {
      throw new UserNotFoundError(dto.utilisateurId);
    }

    // 4. Vérifier que le cours n'est pas passé
    if (cours.estPasse()) {
      throw new CoursPasseError(dto.coursId);
    }

    // 5. Vérifier que le cours n'est pas annulé
    if (cours.annule) {
      throw new ValidationError(
        'cours',
        `Le cours ${dto.coursId} est annulé, impossible de s'y inscrire`
      );
    }

    // 6. Vérifier que l'utilisateur n'est pas déjà inscrit
    const inscriptionExistante = await this.inscriptionRepository.findByCoursAndUtilisateur(
      dto.coursId,
      dto.utilisateurId
    );

    if (inscriptionExistante) {
      // Vérifier si l'inscription existante n'est pas annulée
      if (!inscriptionExistante.isAnnulee()) {
        throw new InscriptionAlreadyExistsError(dto.utilisateurId, dto.coursId);
      }
      // Si l'inscription est annulée, on peut en créer une nouvelle
    }

    // 7. Vérifier que le cours n'est pas complet
    await this.validateCoursNotFull(dto.coursId);

    // 8. Créer l'entité Inscription
    const inscription = Inscription.create({
      cours_id: dto.coursId,
      utilisateur_id: dto.utilisateurId,
      is_present: null,
      is_validate: null,
    });

    // 9. Persister l'inscription dans la base de données
    const savedInscription = await this.inscriptionRepository.save(inscription);

    // 10. Retourner l'inscription créée
    return savedInscription;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: CreateInscriptionDTO): void {
    if (!dto.coursId || dto.coursId <= 0) {
      throw new ValidationError(
        'coursId',
        "L'ID du cours doit être un nombre positif"
      );
    }

    if (!Number.isInteger(dto.coursId)) {
      throw new ValidationError(
        'coursId',
        "L'ID du cours doit être un nombre entier"
      );
    }

    if (!dto.utilisateurId || dto.utilisateurId <= 0) {
      throw new ValidationError(
        'utilisateurId',
        "L'ID de l'utilisateur doit être un nombre positif"
      );
    }

    if (!Number.isInteger(dto.utilisateurId)) {
      throw new ValidationError(
        'utilisateurId',
        "L'ID de l'utilisateur doit être un nombre entier"
      );
    }
  }

  /**
   * Vérifie que le cours n'est pas complet
   *
   * @param coursId - L'ID du cours à vérifier
   * @throws CoursCompletError si le cours est complet
   */
  private async validateCoursNotFull(coursId: number): Promise<void> {
    // Récupérer toutes les inscriptions pour ce cours
    const inscriptions = await this.inscriptionRepository.findByCours(coursId);

    // Compter uniquement les inscriptions actives (non annulées)
    const inscriptionsActives = inscriptions.filter(
      (inscription) => !inscription.isAnnulee()
    );

    // Vérifier si le cours est complet
    if (inscriptionsActives.length >= this.maxInscriptionsParCours) {
      throw new CoursCompletError(coursId);
    }
  }
}
