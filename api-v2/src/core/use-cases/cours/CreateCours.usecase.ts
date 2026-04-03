import { Cours } from '../../domain/entities/Cours.js';
import { Horaire } from '../../domain/value-objects/Horaire.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { ICoursRecurrentRepository } from '../../domain/interfaces/ICoursRecurrentRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';
import { CoursRecurrentNotFoundError } from '../../domain/errors/CoursError.js';

/**
 * DTO (Data Transfer Object) pour la création d'un cours
 */
export interface CreateCoursDTO {
  date_cours: Date;
  type_cours: string;
  heure_debut: string;
  heure_fin: string;
  cours_recurrent_id: number;
}

/**
 * Use Case: Créer un nouveau cours
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que le cours récurrent existe
 * 3. Créer le Value Object Horaire (validation automatique)
 * 4. Vérifier qu'il n'y a pas de chevauchement avec d'autres cours
 * 5. Créer l'entité Cours avec les règles métier
 * 6. Persister le cours
 * 7. Retourner le cours créé
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, etc.)
 */
export class CreateCoursUseCase {
  constructor(
    private readonly coursRepository: ICoursRepository,
    private readonly coursRecurrentRepository: ICoursRecurrentRepository
  ) {}

  /**
   * Exécute le use case de création de cours
   *
   * @param dto - DTO contenant les données du cours à créer
   * @returns Le cours créé avec son ID
   * @throws ValidationError si les données sont invalides
   * @throws CoursRecurrentNotFoundError si le cours récurrent n'existe pas
   */
  async execute(dto: CreateCoursDTO): Promise<Cours> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Vérifier que le cours récurrent existe
    const coursRecurrent = await this.coursRecurrentRepository.findById(
      dto.cours_recurrent_id
    );

    if (!coursRecurrent) {
      throw new CoursRecurrentNotFoundError(dto.cours_recurrent_id);
    }

    // 3. Créer le Value Object Horaire (validation automatique des horaires)
    const horaire = Horaire.create(dto.heure_debut, dto.heure_fin);

    // 4. Vérifier qu'il n'y a pas de chevauchement avec d'autres cours
    await this.validateNoOverlap(dto.date_cours, horaire);

    // 5. Créer l'entité Cours avec les règles métier
    // La validation de la date (pas dans le passé) est faite dans l'entité
    const cours = Cours.create({
      dateCours: dto.date_cours,
      typeCours: dto.type_cours,
      horaire: horaire,
      coursRecurrentId: dto.cours_recurrent_id,
    });

    // 6. Persister le cours dans la base de données
    const savedCours = await this.coursRepository.save(cours);

    // 7. Retourner le cours créé
    return savedCours;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: CreateCoursDTO): void {
    if (!dto.date_cours) {
      throw new ValidationError('date_cours', 'La date du cours est obligatoire');
    }

    if (!(dto.date_cours instanceof Date) || isNaN(dto.date_cours.getTime())) {
      throw new ValidationError('date_cours', 'La date du cours est invalide');
    }

    if (!dto.type_cours || dto.type_cours.trim().length === 0) {
      throw new ValidationError('type_cours', 'Le type de cours est obligatoire');
    }

    if (!dto.heure_debut || dto.heure_debut.trim().length === 0) {
      throw new ValidationError('heure_debut', "L'heure de début est obligatoire");
    }

    if (!dto.heure_fin || dto.heure_fin.trim().length === 0) {
      throw new ValidationError('heure_fin', "L'heure de fin est obligatoire");
    }

    if (!dto.cours_recurrent_id || dto.cours_recurrent_id <= 0) {
      throw new ValidationError(
        'cours_recurrent_id',
        "L'identifiant du cours récurrent est invalide"
      );
    }

    if (!Number.isInteger(dto.cours_recurrent_id)) {
      throw new ValidationError(
        'cours_recurrent_id',
        "L'identifiant du cours récurrent doit être un nombre entier"
      );
    }
  }

  /**
   * Vérifie qu'il n'y a pas de chevauchement avec d'autres cours le même jour
   *
   * @param dateCours - La date du cours à créer
   * @param horaire - L'horaire du cours à créer
   * @throws ValidationError s'il y a un chevauchement
   */
  private async validateNoOverlap(dateCours: Date, horaire: Horaire): Promise<void> {
    // Récupérer tous les cours du même jour
    const coursExistants = await this.coursRepository.findByDate(dateCours);

    // Créer un cours temporaire pour tester les chevauchements
    const nouveauCours = Cours.create({
      dateCours: dateCours,
      typeCours: 'temp', // Type temporaire pour la validation
      horaire: horaire,
      coursRecurrentId: 1, // ID temporaire pour la validation
    });

    // Vérifier les chevauchements avec les cours existants non annulés
    for (const coursExistant of coursExistants) {
      // Ne vérifier que les cours actifs (non annulés)
      if (!coursExistant.annule && nouveauCours.chevauche(coursExistant)) {
        throw new ValidationError(
          'horaire',
          `L'horaire du cours (${horaire.toString()}) chevauche un cours existant ` +
            `(${coursExistant.horaire.toString()}) le même jour`
        );
      }
    }
  }
}
