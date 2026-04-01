import { CoursRecurrent } from '../../domain/entities/CoursRecurrent.js';
import { ICoursRecurrentRepository } from '../../domain/interfaces/ICoursRecurrentRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';
import { CoursRecurrentNotFoundError } from '../../domain/errors/CoursError.js';

/**
 * DTO (Data Transfer Object) pour l'activation d'un cours récurrent
 */
export interface ActivateCoursRecurrentDTO {
  id: number;
}

/**
 * Use Case: Activer un cours récurrent
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que le cours récurrent existe
 * 3. Vérifier que le cours n'est pas déjà actif
 * 4. Activer le cours récurrent (appel méthode métier)
 * 5. Persister les modifications
 * 6. Retourner le cours récurrent activé
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, etc.)
 */
export class ActivateCoursRecurrentUseCase {
  constructor(
    private readonly coursRecurrentRepository: ICoursRecurrentRepository
  ) {}

  /**
   * Exécute le use case d'activation d'un cours récurrent
   *
   * @param dto - DTO contenant l'ID du cours à activer
   * @returns Le cours récurrent activé
   * @throws ValidationError si les données sont invalides ou si le cours est déjà actif
   * @throws CoursRecurrentNotFoundError si le cours n'existe pas
   */
  async execute(dto: ActivateCoursRecurrentDTO): Promise<CoursRecurrent> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Vérifier que le cours récurrent existe
    const coursRecurrent = await this.coursRecurrentRepository.findById(dto.id);
    if (!coursRecurrent) {
      throw new CoursRecurrentNotFoundError(dto.id);
    }

    // 3. Vérifier que le cours n'est pas déjà actif
    if (coursRecurrent.isActive()) {
      throw new ValidationError(
        'active',
        `Le cours récurrent ${dto.id} est déjà actif`
      );
    }

    // 4. Activer le cours récurrent (appel méthode métier)
    coursRecurrent.activer();

    // 5. Persister les modifications
    const savedCours = await this.coursRecurrentRepository.update(coursRecurrent);

    // 6. Retourner le cours récurrent activé
    return savedCours;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: ActivateCoursRecurrentDTO): void {
    if (!dto.id || dto.id <= 0) {
      throw new ValidationError(
        'id',
        "L'identifiant du cours récurrent est invalide"
      );
    }

    if (!Number.isInteger(dto.id)) {
      throw new ValidationError(
        'id',
        "L'identifiant du cours récurrent doit être un nombre entier"
      );
    }
  }
}
