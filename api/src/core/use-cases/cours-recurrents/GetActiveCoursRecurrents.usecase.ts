import { CoursRecurrent } from '../../domain/entities/CoursRecurrent.js';
import { ICoursRecurrentRepository } from '../../domain/interfaces/ICoursRecurrentRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';

/**
 * DTO pour récupérer les cours récurrents actifs
 */
export interface GetActiveCoursRecurrentsDTO {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Use Case: Récupérer tous les cours récurrents actifs
 *
 * Responsabilités:
 * 1. Valider les paramètres de tri
 * 2. Récupérer les cours récurrents actifs depuis le repository
 * 3. Appliquer le tri selon les paramètres
 * 4. Retourner la liste triée des cours actifs
 *
 * Ce use case est utilisé pour afficher les cours actuellement disponibles
 * dans le planning, excluant les cours désactivés.
 */
export class GetActiveCoursRecurrentsUseCase {
  constructor(
    private readonly coursRecurrentRepository: ICoursRecurrentRepository
  ) {}

  /**
   * Exécute le use case de récupération des cours récurrents actifs
   *
   * @param dto - DTO contenant les options de tri
   * @returns Liste des cours récurrents actifs triés
   * @throws ValidationError si les paramètres sont invalides
   */
  async execute(dto: GetActiveCoursRecurrentsDTO = {}): Promise<CoursRecurrent[]> {
    // 1. Validation des paramètres avec valeurs par défaut
    const sortBy = dto.sortBy ?? 'jour_semaine';
    const sortOrder = dto.sortOrder ?? 'ASC';

    this.validateSortParams(sortOrder);

    // 2. Récupérer tous les cours récurrents actifs
    const activeCoursRecurrents = await this.coursRecurrentRepository.findActive();

    // 3. Appliquer le tri
    const sortedCoursRecurrents = this.sortCoursRecurrents(
      activeCoursRecurrents,
      sortBy,
      sortOrder
    );

    // 4. Retourner la liste triée
    return sortedCoursRecurrents;
  }

  /**
   * Valide les paramètres de tri
   */
  private validateSortParams(sortOrder: string): void {
    if (sortOrder !== 'ASC' && sortOrder !== 'DESC') {
      throw new ValidationError(
        'sortOrder',
        'L\'ordre de tri doit être "ASC" ou "DESC"'
      );
    }
  }

  /**
   * Trie les cours récurrents selon le critère spécifié
   */
  private sortCoursRecurrents(
    coursRecurrents: CoursRecurrent[],
    sortBy: string,
    sortOrder: 'ASC' | 'DESC'
  ): CoursRecurrent[] {
    const sorted = [...coursRecurrents]; // Copie pour ne pas modifier l'original
    const direction = sortOrder === 'ASC' ? 1 : -1;

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'jour_semaine':
          comparison = a.jourSemaine.getNumero() - b.jourSemaine.getNumero();
          // Si même jour, trier par heure de début
          if (comparison === 0) {
            comparison = a.heureDebut.localeCompare(b.heureDebut);
          }
          break;

        case 'heure_debut':
          comparison = a.heureDebut.localeCompare(b.heureDebut);
          break;

        case 'heure_fin':
          comparison = a.heureFin.localeCompare(b.heureFin);
          break;

        case 'type_cours':
          comparison = a.typeCours.localeCompare(b.typeCours);
          break;

        case 'created_at':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;

        case 'updated_at':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;

        default:
          // Par défaut, trier par jour de semaine puis heure de début
          comparison = a.jourSemaine.getNumero() - b.jourSemaine.getNumero();
          if (comparison === 0) {
            comparison = a.heureDebut.localeCompare(b.heureDebut);
          }
          break;
      }

      return comparison * direction;
    });

    return sorted;
  }
}
