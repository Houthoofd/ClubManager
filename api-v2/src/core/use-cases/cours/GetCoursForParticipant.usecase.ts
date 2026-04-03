import { Cours } from '../../domain/entities/Cours.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';

/**
 * DTO pour récupérer les cours d'un participant
 */
export interface GetCoursForParticipantDTO {
  participantId: number;
  limit?: number;
}

/**
 * Use Case: Récupérer les prochains cours d'un participant
 *
 * Responsabilités:
 * 1. Valider l'ID du participant
 * 2. Valider la limite si fournie
 * 3. Récupérer les cours du participant depuis le repository
 * 4. Retourner la liste des cours
 *
 * Ce use case permet à un participant de voir ses prochains cours
 * planifiés, avec une limite optionnelle pour ne récupérer que
 * les N prochains cours.
 */
export class GetCoursForParticipantUseCase {
  constructor(private readonly coursRepository: ICoursRepository) {}

  /**
   * Exécute le use case de récupération des cours d'un participant
   *
   * @param dto - DTO contenant l'ID du participant et une limite optionnelle
   * @returns Liste des cours du participant
   */
  async execute(dto: GetCoursForParticipantDTO): Promise<Cours[]> {
    // 1. Validation du DTO
    this.validateDTO(dto);

    // 2. Récupérer les cours du participant depuis le repository
    const cours = await this.coursRepository.findForParticipant(
      dto.participantId,
      dto.limit
    );

    // 3. Retourner la liste des cours
    return cours;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: GetCoursForParticipantDTO): void {
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

    // Validation de la limite si fournie
    if (dto.limit !== undefined && dto.limit !== null) {
      if (dto.limit <= 0) {
        throw new ValidationError(
          'limit',
          'La limite doit être un nombre positif'
        );
      }

      if (!Number.isInteger(dto.limit)) {
        throw new ValidationError(
          'limit',
          'La limite doit être un nombre entier'
        );
      }

      // Limite maximale raisonnable pour éviter les abus
      if (dto.limit > 100) {
        throw new ValidationError(
          'limit',
          'La limite ne peut pas dépasser 100 cours'
        );
      }
    }
  }
}
