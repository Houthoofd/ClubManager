import { CoursRecurrent } from '../../domain/entities/CoursRecurrent.js';
import { ICoursRecurrentRepository } from '../../domain/interfaces/ICoursRecurrentRepository.js';
import { PaginatedResult } from '../../domain/interfaces/IUserRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';

/**
 * DTO pour récupérer tous les cours récurrents avec pagination
 */
export interface GetAllCoursRecurrentsDTO {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Use Case: Récupérer tous les cours récurrents avec pagination
 *
 * Responsabilités:
 * 1. Valider les paramètres de pagination
 * 2. Récupérer tous les cours récurrents depuis le repository
 * 3. Appliquer la pagination et le tri
 * 4. Calculer les métadonnées de pagination (total, totalPages)
 * 5. Retourner le résultat paginé
 *
 * Ce use case permet de lister tous les cours récurrents (actifs et inactifs)
 * avec un contrôle précis sur la pagination et le tri.
 */
export class GetAllCoursRecurrentsUseCase {
  constructor(
    private readonly coursRecurrentRepository: ICoursRecurrentRepository
  ) {}

  /**
   * Exécute le use case de récupération de tous les cours récurrents
   *
   * @param dto - DTO contenant les options de pagination
   * @returns Résultat paginé avec les cours récurrents
   * @throws ValidationError si les paramètres sont invalides
   */
  async execute(
    dto: GetAllCoursRecurrentsDTO = {}
  ): Promise<PaginatedResult<CoursRecurrent>> {
    // 1. Validation des paramètres avec valeurs par défaut
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const sortBy = dto.sortBy ?? 'jour_semaine';
    const sortOrder = dto.sortOrder ?? 'ASC';

    this.validatePaginationParams(page, limit);

    // 2. Récupérer tous les cours récurrents
    const allCoursRecurrents = await this.coursRecurrentRepository.findAll();

    // 3. Appliquer le tri
    const sortedCoursRecurrents = this.sortCoursRecurrents(
      allCoursRecurrents,
      sortBy,
      sortOrder
    );

    // 4. Calculer la pagination
    const total = sortedCoursRecurrents.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // 5. Extraire les données de la page demandée
    const data = sortedCoursRecurrents.slice(offset, offset + limit);

    // 6. Retourner le résultat paginé
    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Valide les paramètres de pagination
   */
  private validatePaginationParams(page: number, limit: number): void {
    if (!Number.isInteger(page) || page < 1) {
      throw new ValidationError(
        'page',
        'Le numéro de page doit être un entier supérieur ou égal à 1'
      );
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new ValidationError(
        'limit',
        'La limite doit être un entier entre 1 et 100'
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

        case 'active':
          comparison = (a.active === b.active ? 0 : a.active ? -1 : 1);
          break;

        case 'created_at':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;

        case 'updated_at':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;

        default:
          // Par défaut, trier par jour de semaine
          comparison = a.jourSemaine.getNumero() - b.jourSemaine.getNumero();
          break;
      }

      return comparison * direction;
    });

    return sorted;
  }
}
