import { Cours } from '../../domain/entities/Cours.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';

/**
 * DTO pour récupérer tous les cours d'une semaine spécifique
 */
export interface GetAllCoursParSemaineDTO {
  weekNumber: number;
  year?: number;
}

/**
 * Use Case: Récupérer tous les cours d'une semaine spécifique
 *
 * Responsabilités:
 * 1. Valider le numéro de semaine (1-53)
 * 2. Valider l'année si fournie (>= 2000), sinon utiliser l'année courante
 * 3. Calculer les dates de début et fin de la semaine
 * 4. Récupérer tous les cours de la semaine depuis le repository
 * 5. Trier les cours par date puis heure de début
 * 6. Retourner la liste des cours
 *
 * Ce use case permet d'afficher le planning général d'une semaine donnée,
 * sans filtre par participant. Utile pour visualiser tous les cours disponibles
 * et planifiés pour une semaine spécifique.
 *
 * @example
 * // Récupérer tous les cours de la semaine 15 de l'année courante
 * const cours = await useCase.execute({ weekNumber: 15 });
 *
 * @example
 * // Récupérer tous les cours de la semaine 20 de 2024
 * const cours = await useCase.execute({ weekNumber: 20, year: 2024 });
 */
export class GetAllCoursParSemaineUseCase {
  constructor(private readonly coursRepository: ICoursRepository) {}

  /**
   * Exécute le use case de récupération de tous les cours d'une semaine
   *
   * @param dto - DTO contenant le numéro de semaine et optionnellement l'année
   * @returns Liste de tous les cours de la semaine, triés par date puis heure
   */
  async execute(dto: GetAllCoursParSemaineDTO): Promise<Cours[]> {
    // 1. Validation du DTO
    this.validateDTO(dto);

    // 2. Déterminer l'année (année courante si non fournie)
    const year = dto.year ?? new Date().getFullYear();

    // 3. Calculer les dates de début et fin de la semaine
    const { debut, fin } = this.calculateWeekDates(dto.weekNumber, year);

    // 4. Récupérer tous les cours de la semaine depuis le repository
    const cours = await this.coursRepository.findByDateRange(debut, fin);

    // 5. Trier les cours par date puis par heure de début
    const coursTries = this.sortCours(cours);

    // 6. Retourner la liste des cours triés
    return coursTries;
  }

  /**
   * Valide le DTO d'entrée
   *
   * @param dto - DTO à valider
   * @throws ValidationError si les données sont invalides
   */
  private validateDTO(dto: GetAllCoursParSemaineDTO): void {
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

    // Validation de l'année si fournie
    if (dto.year !== undefined) {
      if (!Number.isInteger(dto.year)) {
        throw new ValidationError(
          'year',
          "L'année doit être un nombre entier"
        );
      }

      if (dto.year < 2000) {
        throw new ValidationError(
          'year',
          "L'année doit être supérieure ou égale à 2000"
        );
      }

      // Vérifier que l'année n'est pas trop dans le futur (max 10 ans)
      const currentYear = new Date().getFullYear();
      if (dto.year > currentYear + 10) {
        throw new ValidationError(
          'year',
          `L'année ne peut pas être supérieure à ${currentYear + 10}`
        );
      }
    }
  }

  /**
   * Calcule les dates de début et fin d'une semaine selon ISO 8601
   * (la semaine commence le lundi et se termine le dimanche)
   *
   * @param weekNumber - Numéro de la semaine (1-53)
   * @param year - Année
   * @returns Objet contenant les dates de début et fin de semaine
   */
  private calculateWeekDates(
    weekNumber: number,
    year: number
  ): { debut: Date; fin: Date } {
    // Trouver le premier jeudi de l'année (définition ISO 8601)
    // La semaine 1 est celle qui contient le premier jeudi de l'année
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOfWeek = firstDayOfYear.getDay();

    // Calculer le décalage pour atteindre le lundi de la semaine 1
    // Si le 1er janvier est un lundi (1), décalage = 0
    // Si c'est un mardi (2), décalage = -1 (revenir au lundi précédent)
    // Si c'est un dimanche (0), décalage = 1 (aller au lundi suivant)
    let daysToMonday: number;
    if (dayOfWeek === 0) {
      // Dimanche
      daysToMonday = 1;
    } else if (dayOfWeek === 1) {
      // Lundi
      daysToMonday = 0;
    } else {
      // Mardi à Samedi
      daysToMonday = -(dayOfWeek - 1);
    }

    // Si le 1er janvier est un vendredi, samedi ou dimanche,
    // la semaine 1 commence l'année suivante
    if (dayOfWeek >= 5 || dayOfWeek === 0) {
      daysToMonday += 7;
    }

    // Calculer le lundi de la semaine 1
    const firstMonday = new Date(year, 0, 1 + daysToMonday);

    // Calculer le lundi de la semaine demandée
    const mondayOfWeek = new Date(firstMonday);
    mondayOfWeek.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

    // Début de la semaine: lundi à 00:00:00
    const debut = new Date(mondayOfWeek);
    debut.setHours(0, 0, 0, 0);

    // Fin de la semaine: dimanche à 23:59:59
    const fin = new Date(mondayOfWeek);
    fin.setDate(mondayOfWeek.getDate() + 6);
    fin.setHours(23, 59, 59, 999);

    return { debut, fin };
  }

  /**
   * Trie les cours par date croissante puis par heure de début
   *
   * @param cours - Liste des cours à trier
   * @returns Liste des cours triés
   */
  private sortCours(cours: Cours[]): Cours[] {
    return cours.sort((a, b) => {
      // 1. Trier par date
      const dateA = a.dateCours.getTime();
      const dateB = b.dateCours.getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // 2. Si même date, trier par heure de début
      const heureA = a.heureDebut;
      const heureB = b.heureDebut;

      return heureA.localeCompare(heureB);
    });
  }
}
