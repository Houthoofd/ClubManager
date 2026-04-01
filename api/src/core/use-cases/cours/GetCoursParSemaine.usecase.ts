import { Cours } from '../../domain/entities/Cours.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';

/**
 * DTO pour récupérer les cours d'une semaine spécifique
 */
export interface GetCoursParSemaineDTO {
  participantId: number;
  weekNumber: number;
}

/**
 * Use Case: Récupérer les cours d'un participant pour une semaine spécifique
 *
 * Responsabilités:
 * 1. Valider l'ID du participant
 * 2. Valider le numéro de semaine (1-53)
 * 3. Récupérer les cours de la semaine depuis le repository
 * 4. Retourner la liste des cours
 *
 * Ce use case permet à un participant de visualiser tous ses cours
 * planifiés pour une semaine donnée (identifiée par son numéro de semaine).
 * Utile pour afficher une vue hebdomadaire du planning.
 */
export class GetCoursParSemaineUseCase {
  constructor(private readonly coursRepository: ICoursRepository) {}

  /**
   * Exécute le use case de récupération des cours par semaine
   *
   * @param dto - DTO contenant l'ID du participant et le numéro de semaine
   * @returns Liste des cours du participant pour cette semaine
   */
  async execute(dto: GetCoursParSemaineDTO): Promise<Cours[]> {
    // 1. Validation du DTO
    this.validateDTO(dto);

    // 2. Récupérer les cours de la semaine depuis le repository
    const cours = await this.coursRepository.findByWeek(
      dto.participantId,
      dto.weekNumber
    );

    // 3. Retourner la liste des cours
    return cours;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: GetCoursParSemaineDTO): void {
    // Validation du participant ID
    if (!dto.participantId || dto.participantId <= 0) {
      throw new ValidationError(
        'participantId',
        "L'ID du participant doit être un nombre positif"
      );
    }

    if (!Number.isInteger(dto.participantId)) {
      throw new ValidationError(
        'participantId',
        "L'ID du participant doit être un nombre entier"
      );
    }

    // Validation du numéro de semaine
    if (!dto.weekNumber) {
      throw new ValidationError(
        'weekNumber',
        'Le numéro de semaine est obligatoire'
      );
    }

    if (!Number.isInteger(dto.weekNumber)) {
      throw new ValidationError(
        'weekNumber',
        'Le numéro de semaine doit être un nombre entier'
      );
    }

    // Le numéro de semaine doit être entre 1 et 53 (année avec 53 semaines possibles)
    if (dto.weekNumber < 1 || dto.weekNumber > 53) {
      throw new ValidationError(
        'weekNumber',
        'Le numéro de semaine doit être compris entre 1 et 53'
      );
    }
  }
}
