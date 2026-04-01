import { Cours } from '../../domain/entities/Cours.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { CoursNotFoundError } from '../../domain/errors/CoursError.js';

/**
 * DTO pour récupérer un cours
 */
export interface GetCoursDTO {
  coursId: number;
}

/**
 * Use Case: Récupérer un cours par son ID
 *
 * Responsabilités:
 * 1. Valider l'ID fourni
 * 2. Récupérer le cours depuis le repository
 * 3. Gérer le cas où le cours n'existe pas
 * 4. Retourner le cours trouvé
 *
 * Ce use case est simple mais illustre l'importance de la séparation
 * des responsabilités : même une opération simple passe par le use case
 * pour maintenir la cohérence de l'architecture.
 */
export class GetCoursUseCase {
  constructor(private readonly coursRepository: ICoursRepository) {}

  /**
   * Exécute le use case de récupération de cours
   *
   * @param dto - DTO contenant l'ID du cours
   * @returns Le cours trouvé
   * @throws CoursNotFoundError si le cours n'existe pas
   */
  async execute(dto: GetCoursDTO): Promise<Cours> {
    // 1. Validation de l'ID
    this.validateDTO(dto);

    // 2. Récupérer le cours depuis le repository
    const cours = await this.coursRepository.findById(dto.coursId);

    // 3. Vérifier si le cours existe
    if (!cours) {
      throw new CoursNotFoundError(dto.coursId);
    }

    // 4. Retourner le cours
    return cours;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: GetCoursDTO): void {
    if (!dto.coursId || dto.coursId <= 0) {
      throw new Error("L'ID du cours doit être un nombre positif");
    }

    if (!Number.isInteger(dto.coursId)) {
      throw new Error("L'ID du cours doit être un nombre entier");
    }
  }
}
