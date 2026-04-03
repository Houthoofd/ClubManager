import { Inscription } from '../../domain/entities/Inscription.js';
import { IInscriptionRepository } from '../../domain/interfaces/IInscriptionRepository.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';
import {
  InscriptionNotFoundError,
  CoursNotFoundError,
} from '../../domain/errors/CoursError.js';

/**
 * DTO pour marquer la présence/absence
 */
export interface MarquerPresenceDTO {
  inscriptionId: number;
  isPresent: boolean;
}

/**
 * Use Case: Marquer la présence ou l'absence d'un participant à un cours
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que l'inscription existe
 * 3. Vérifier que l'inscription n'est pas annulée
 * 4. Récupérer le cours associé
 * 5. Vérifier que le cours n'est pas dans le futur
 * 6. Appeler la méthode appropriée (marquerPresent/marquerAbsent) de l'entité
 * 7. Persister les changements
 * 8. Retourner l'inscription mise à jour
 *
 * Cette classe orchestre la logique applicative pour marquer la présence
 * à un cours en appliquant toutes les règles métier nécessaires.
 * La présence ne peut être marquée que pour des cours passés ou en cours.
 */
export class MarquerPresenceUseCase {
  constructor(
    private readonly inscriptionRepository: IInscriptionRepository,
    private readonly coursRepository: ICoursRepository
  ) {}

  /**
   * Exécute le use case de marquage de présence
   *
   * @param dto - DTO contenant l'ID de l'inscription et le statut de présence
   * @returns L'inscription mise à jour
   * @throws ValidationError si les données sont invalides
   * @throws InscriptionNotFoundError si l'inscription n'existe pas
   * @throws CoursNotFoundError si le cours n'existe pas
   */
  async execute(dto: MarquerPresenceDTO): Promise<Inscription> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Vérifier que l'inscription existe
    const inscription = await this.inscriptionRepository.findById(dto.inscriptionId);
    if (!inscription) {
      throw new InscriptionNotFoundError(dto.inscriptionId);
    }

    // 3. Vérifier que l'inscription n'est pas annulée
    if (inscription.isAnnulee()) {
      throw new ValidationError(
        'inscription',
        `Impossible de marquer la présence pour l'inscription ${dto.inscriptionId} car elle est annulée`
      );
    }

    // 4. Récupérer le cours associé
    const cours = await this.coursRepository.findById(inscription.cours_id);
    if (!cours) {
      throw new CoursNotFoundError(inscription.cours_id);
    }

    // 5. Vérifier que le cours n'est pas dans le futur
    if (cours.estFutur() && !cours.estEnCours()) {
      throw new ValidationError(
        'cours',
        `Impossible de marquer la présence pour le cours ${cours.id} car il n'a pas encore commencé`
      );
    }

    // 6. Vérifier que le cours n'est pas annulé
    if (cours.annule) {
      throw new ValidationError(
        'cours',
        `Impossible de marquer la présence pour le cours ${cours.id} car il est annulé`
      );
    }

    // 7. Appeler la méthode métier appropriée de l'entité
    if (dto.isPresent) {
      inscription.marquerPresent();
    } else {
      inscription.marquerAbsent();
    }

    // 8. Persister les changements dans la base de données
    const updatedInscription = await this.inscriptionRepository.update(inscription);

    // 9. Retourner l'inscription mise à jour
    return updatedInscription;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: MarquerPresenceDTO): void {
    if (!dto.inscriptionId || dto.inscriptionId <= 0) {
      throw new ValidationError(
        'inscriptionId',
        "L'ID de l'inscription doit être un nombre positif"
      );
    }

    if (!Number.isInteger(dto.inscriptionId)) {
      throw new ValidationError(
        'inscriptionId',
        "L'ID de l'inscription doit être un nombre entier"
      );
    }

    if (typeof dto.isPresent !== 'boolean') {
      throw new ValidationError(
        'isPresent',
        'Le statut de présence doit être un booléen (true ou false)'
      );
    }
  }
}
