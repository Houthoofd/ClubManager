import { CoursRecurrent } from '../../domain/entities/CoursRecurrent.js';
import { Horaire } from '../../domain/value-objects/Horaire.js';
import { JourSemaine } from '../../domain/value-objects/JourSemaine.js';
import { ICoursRecurrentRepository } from '../../domain/interfaces/ICoursRecurrentRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';
import { CoursRecurrentNotFoundError } from '../../domain/errors/CoursError.js';

/**
 * DTO (Data Transfer Object) pour la mise à jour d'un cours récurrent
 */
export interface UpdateCoursRecurrentDTO {
  id: number;
  type_cours?: string;
  jour_semaine?: string | number;
  heure_debut?: string;
  heure_fin?: string;
  professeurs?: number[];
}

/**
 * Use Case: Mettre à jour un cours récurrent existant
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que le cours récurrent existe
 * 3. Vérifier qu'au moins un champ est fourni pour la mise à jour
 * 4. Valider les nouvelles valeurs si fournies
 * 5. Créer les Value Objects si horaires ou jour modifiés
 * 6. Vérifier qu'il n'y a pas de chevauchement si jour/horaire modifiés
 * 7. Mettre à jour l'entité CoursRecurrent
 * 8. Persister les modifications
 * 9. Retourner le cours récurrent mis à jour
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, etc.)
 */
export class UpdateCoursRecurrentUseCase {
  constructor(
    private readonly coursRecurrentRepository: ICoursRecurrentRepository
  ) {}

  /**
   * Exécute le use case de mise à jour d'un cours récurrent
   *
   * @param dto - DTO contenant les données à mettre à jour
   * @returns Le cours récurrent mis à jour
   * @throws ValidationError si les données sont invalides
   * @throws CoursRecurrentNotFoundError si le cours n'existe pas
   */
  async execute(dto: UpdateCoursRecurrentDTO): Promise<CoursRecurrent> {
    // 1. Validation de base du DTO
    this.validateDTO(dto);

    // 2. Vérifier que le cours récurrent existe
    const coursExistant = await this.coursRecurrentRepository.findById(dto.id);
    if (!coursExistant) {
      throw new CoursRecurrentNotFoundError(dto.id);
    }

    // 3. Vérifier qu'au moins un champ est fourni pour la mise à jour
    this.validateHasUpdates(dto);

    // 4. Construire les nouvelles valeurs
    const typeCours = dto.type_cours !== undefined
      ? dto.type_cours
      : coursExistant.typeCours;

    const jourSemaine = dto.jour_semaine !== undefined
      ? JourSemaine.create(dto.jour_semaine)
      : coursExistant.jourSemaine;

    const horaire = (dto.heure_debut !== undefined || dto.heure_fin !== undefined)
      ? Horaire.create(
          dto.heure_debut ?? coursExistant.heureDebut,
          dto.heure_fin ?? coursExistant.heureFin
        )
      : coursExistant.horaire;

    const professeurs = dto.professeurs !== undefined
      ? dto.professeurs
      : coursExistant.professeurs;

    // 5. Valider le type de cours si fourni
    if (dto.type_cours !== undefined) {
      this.validateTypeCours(dto.type_cours);
    }

    // 6. Vérifier les chevauchements si jour ou horaire modifiés
    const jourOuHoraireModifie =
      dto.jour_semaine !== undefined ||
      dto.heure_debut !== undefined ||
      dto.heure_fin !== undefined;

    if (jourOuHoraireModifie) {
      await this.validateNoOverlap(dto.id, jourSemaine, horaire);
    }

    // 7. Créer le cours récurrent mis à jour
    const coursRecurrentMisAJour = CoursRecurrent.fromPersistence({
      id: coursExistant.id,
      typeCours: typeCours,
      jourSemaine: jourSemaine,
      horaire: horaire,
      active: coursExistant.active,
      professeurs: professeurs,
      createdAt: coursExistant.createdAt,
      updatedAt: new Date(),
    });

    // 8. Persister les modifications
    const savedCours = await this.coursRecurrentRepository.update(coursRecurrentMisAJour);

    // 9. Retourner le cours récurrent mis à jour
    return savedCours;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: UpdateCoursRecurrentDTO): void {
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

  /**
   * Vérifie qu'au moins un champ est fourni pour la mise à jour
   */
  private validateHasUpdates(dto: UpdateCoursRecurrentDTO): void {
    const hasUpdates =
      dto.type_cours !== undefined ||
      dto.jour_semaine !== undefined ||
      dto.heure_debut !== undefined ||
      dto.heure_fin !== undefined ||
      dto.professeurs !== undefined;

    if (!hasUpdates) {
      throw new ValidationError(
        'update',
        'Au moins un champ doit être fourni pour la mise à jour'
      );
    }
  }

  /**
   * Valide le type de cours
   */
  private validateTypeCours(typeCours: string): void {
    if (!typeCours || typeCours.trim().length === 0) {
      throw new ValidationError('type_cours', 'Le type de cours est obligatoire');
    }

    if (typeCours.length > 255) {
      throw new ValidationError(
        'type_cours',
        'Le type de cours ne peut pas dépasser 255 caractères'
      );
    }
  }

  /**
   * Vérifie qu'il n'y a pas de chevauchement avec d'autres cours récurrents
   *
   * @param coursId - ID du cours en cours de modification (à exclure de la vérification)
   * @param jourSemaine - Nouveau jour de la semaine
   * @param horaire - Nouvel horaire
   * @throws ValidationError s'il y a un chevauchement
   */
  private async validateNoOverlap(
    coursId: number,
    jourSemaine: JourSemaine,
    horaire: Horaire
  ): Promise<void> {
    // Récupérer tous les cours récurrents du même jour
    const coursExistants = await this.coursRecurrentRepository.findByJourSemaine(
      jourSemaine.getNumero()
    );

    // Créer un cours temporaire pour tester les chevauchements
    const coursTemporaire = CoursRecurrent.fromPersistence({
      id: coursId,
      typeCours: 'temp',
      jourSemaine: jourSemaine,
      horaire: horaire,
      active: true,
      professeurs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Vérifier les chevauchements avec les cours existants actifs
    for (const coursExistant of coursExistants) {
      // Ne pas comparer avec soi-même et ne vérifier que les cours actifs
      if (coursExistant.id !== coursId && coursExistant.active) {
        if (coursTemporaire.chevauche(coursExistant)) {
          throw new ValidationError(
            'horaire',
            `L'horaire du cours (${horaire.toString()}) chevauche un cours récurrent existant ` +
              `"${coursExistant.typeCours}" (${coursExistant.horaire.toString()}) ` +
              `le ${jourSemaine.getNom()}`
          );
        }
      }
    }
  }
}
