import { CoursRecurrent } from '../../domain/entities/CoursRecurrent.js';
import { Horaire } from '../../domain/value-objects/Horaire.js';
import { JourSemaine } from '../../domain/value-objects/JourSemaine.js';
import { ICoursRecurrentRepository } from '../../domain/interfaces/ICoursRecurrentRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';

/**
 * DTO (Data Transfer Object) pour la création d'un cours récurrent
 */
export interface CreateCoursRecurrentDTO {
  type_cours: string;
  jour_semaine: string | number;
  heure_debut: string;
  heure_fin: string;
  professeurs?: number[];
}

/**
 * Use Case: Créer un nouveau cours récurrent
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Créer les Value Objects (JourSemaine, Horaire)
 * 3. Vérifier qu'il n'y a pas de chevauchement avec d'autres cours actifs du même jour
 * 4. Créer l'entité CoursRecurrent avec les règles métier
 * 5. Persister le cours récurrent
 * 6. Retourner le cours récurrent créé
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, etc.). Le cours récurrent est créé
 * actif par défaut.
 */
export class CreateCoursRecurrentUseCase {
  constructor(
    private readonly coursRecurrentRepository: ICoursRecurrentRepository
  ) {}

  /**
   * Exécute le use case de création de cours récurrent
   *
   * @param dto - DTO contenant les données du cours récurrent à créer
   * @returns Le cours récurrent créé avec son ID
   * @throws ValidationError si les données sont invalides
   * @throws HoraireInvalideError si les horaires sont invalides
   * @throws JourSemaineInvalideError si le jour de semaine est invalide
   */
  async execute(dto: CreateCoursRecurrentDTO): Promise<CoursRecurrent> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Créer les Value Objects (validation automatique)
    const jourSemaine = JourSemaine.create(dto.jour_semaine);
    const horaire = Horaire.create(dto.heure_debut, dto.heure_fin);

    // 3. Normaliser les professeurs (tableau vide si non fourni)
    const professeurs = dto.professeurs ?? [];

    // 4. Vérifier qu'il n'y a pas de chevauchement avec d'autres cours actifs
    await this.validateNoOverlap(jourSemaine, horaire);

    // 5. Créer l'entité CoursRecurrent avec les règles métier
    // Le cours est créé actif par défaut
    const coursRecurrent = CoursRecurrent.create({
      typeCours: dto.type_cours.trim(),
      jourSemaine: jourSemaine,
      horaire: horaire,
      active: true,
      professeurs: professeurs,
    });

    // 6. Persister le cours récurrent dans la base de données
    const savedCoursRecurrent = await this.coursRecurrentRepository.save(
      coursRecurrent
    );

    // 7. Retourner le cours récurrent créé
    return savedCoursRecurrent;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: CreateCoursRecurrentDTO): void {
    // Validation type_cours
    if (!dto.type_cours || dto.type_cours.trim().length === 0) {
      throw new ValidationError(
        'type_cours',
        'Le type de cours est obligatoire'
      );
    }

    if (dto.type_cours.trim().length < 3) {
      throw new ValidationError(
        'type_cours',
        'Le type de cours doit contenir au moins 3 caractères'
      );
    }

    if (dto.type_cours.length > 255) {
      throw new ValidationError(
        'type_cours',
        'Le type de cours ne peut pas dépasser 255 caractères'
      );
    }

    // Validation jour_semaine
    if (dto.jour_semaine === undefined || dto.jour_semaine === null) {
      throw new ValidationError(
        'jour_semaine',
        'Le jour de la semaine est obligatoire'
      );
    }

    if (typeof dto.jour_semaine === 'string' && dto.jour_semaine.trim().length === 0) {
      throw new ValidationError(
        'jour_semaine',
        'Le jour de la semaine ne peut pas être vide'
      );
    }

    // Validation heure_debut
    if (!dto.heure_debut || dto.heure_debut.trim().length === 0) {
      throw new ValidationError(
        'heure_debut',
        "L'heure de début est obligatoire"
      );
    }

    // Validation heure_fin
    if (!dto.heure_fin || dto.heure_fin.trim().length === 0) {
      throw new ValidationError(
        'heure_fin',
        "L'heure de fin est obligatoire"
      );
    }

    // Validation professeurs (optionnel)
    if (dto.professeurs !== undefined) {
      if (!Array.isArray(dto.professeurs)) {
        throw new ValidationError(
          'professeurs',
          'La liste des professeurs doit être un tableau'
        );
      }

      for (const profId of dto.professeurs) {
        if (!Number.isInteger(profId) || profId <= 0) {
          throw new ValidationError(
            'professeurs',
            `L'identifiant du professeur ${profId} est invalide`
          );
        }
      }

      // Vérifier qu'il n'y a pas de doublons
      const uniqueProfesseurs = new Set(dto.professeurs);
      if (uniqueProfesseurs.size !== dto.professeurs.length) {
        throw new ValidationError(
          'professeurs',
          'La liste des professeurs contient des doublons'
        );
      }
    }
  }

  /**
   * Vérifie qu'il n'y a pas de chevauchement avec d'autres cours actifs le même jour
   *
   * @param jourSemaine - Le jour de la semaine du cours à créer
   * @param horaire - L'horaire du cours à créer
   * @throws ValidationError s'il y a un chevauchement
   */
  private async validateNoOverlap(
    jourSemaine: JourSemaine,
    horaire: Horaire
  ): Promise<void> {
    // Récupérer tous les cours récurrents du même jour
    const coursExistants = await this.coursRecurrentRepository.findByJourSemaine(
      jourSemaine.getNumero()
    );

    // Créer un cours récurrent temporaire pour tester les chevauchements
    const nouveauCoursRecurrent = CoursRecurrent.create({
      typeCours: 'temp', // Type temporaire pour la validation
      jourSemaine: jourSemaine,
      horaire: horaire,
      active: true,
      professeurs: [],
    });

    // Vérifier les chevauchements avec les cours existants actifs
    for (const coursExistant of coursExistants) {
      // Ne vérifier que les cours actifs
      if (
        coursExistant.isActive() &&
        nouveauCoursRecurrent.chevauche(coursExistant)
      ) {
        throw new ValidationError(
          'horaire',
          `L'horaire du cours (${horaire.toString()}) chevauche un cours récurrent actif ` +
            `(${coursExistant.typeCours} - ${coursExistant.horaire.toString()}) ` +
            `le ${jourSemaine.getNom()}`
        );
      }
    }
  }
}
