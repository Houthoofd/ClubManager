import { IInscriptionRepository } from '../../domain/interfaces/IInscriptionRepository.js';
import { ICoursRepository } from '../../domain/interfaces/ICoursRepository.js';
import { ValidationError } from '../../domain/errors/DomainError.js';
import {
  InscriptionNotFoundError,
  CoursNotFoundError,
} from '../../domain/errors/CoursError.js';

/**
 * DTO pour annuler une inscription
 */
export interface AnnulerInscriptionDTO {
  inscriptionId: number;
  utilisateurId: number;
}

/**
 * Use Case: Annuler une inscription à un cours
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que l'inscription existe
 * 3. Vérifier que l'inscription appartient à l'utilisateur
 * 4. Vérifier que l'inscription n'est pas déjà annulée
 * 5. Récupérer le cours associé
 * 6. Vérifier que le cours n'a pas commencé
 * 7. Appeler la méthode annuler() de l'entité Inscription
 * 8. Persister les changements
 * 9. Retourner le résultat
 *
 * Cette classe orchestre la logique applicative pour l'annulation
 * d'une inscription en appliquant toutes les règles métier nécessaires.
 */
export class AnnulerInscriptionUseCase {
  constructor(
    private readonly inscriptionRepository: IInscriptionRepository,
    private readonly coursRepository: ICoursRepository
  ) {}

  /**
   * Exécute le use case d'annulation d'inscription
   *
   * @param dto - DTO contenant l'ID de l'inscription et l'ID de l'utilisateur
   * @returns true si l'annulation a réussi
   * @throws ValidationError si les données sont invalides
   * @throws InscriptionNotFoundError si l'inscription n'existe pas
   * @throws CoursNotFoundError si le cours n'existe pas
   */
  async execute(dto: AnnulerInscriptionDTO): Promise<boolean> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Vérifier que l'inscription existe
    const inscription = await this.inscriptionRepository.findById(dto.inscriptionId);
    if (!inscription) {
      throw new InscriptionNotFoundError(dto.inscriptionId);
    }

    // 3. Vérifier que l'inscription appartient à l'utilisateur
    if (inscription.utilisateur_id !== dto.utilisateurId) {
      throw new ValidationError(
        'utilisateurId',
        `L'inscription ${dto.inscriptionId} n'appartient pas à l'utilisateur ${dto.utilisateurId}`
      );
    }

    // 4. Vérifier que l'inscription n'est pas déjà annulée
    if (inscription.isAnnulee()) {
      throw new ValidationError(
        'inscription',
        `L'inscription ${dto.inscriptionId} est déjà annulée`
      );
    }

    // 5. Récupérer le cours associé
    const cours = await this.coursRepository.findById(inscription.cours_id);
    if (!cours) {
      throw new CoursNotFoundError(inscription.cours_id);
    }

    // 6. Vérifier que le cours n'a pas commencé
    if (cours.estPasse() || cours.estEnCours()) {
      throw new ValidationError(
        'cours',
        `Impossible d'annuler l'inscription car le cours ${cours.id} a déjà commencé ou est passé`
      );
    }

    // 7. Vérifier que le cours n'est pas annulé (optionnel, car on peut annuler une inscription même si le cours est annulé)
    // Pour l'instant, on autorise l'annulation même si le cours est annulé

    // 8. Appeler la méthode métier annuler() de l'entité
    inscription.annuler();

    // 9. Persister les changements dans la base de données
    await this.inscriptionRepository.update(inscription);

    // 10. Retourner le résultat
    return true;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: AnnulerInscriptionDTO): void {
    if (!dto.inscriptionId || dto.inscriptionId <= 0) {
      throw new ValidationError(
        'inscriptionId',
        "L'ID de l'inscription doit être un nombre positif"
      );
    }

    if (!Number.isInteger(dto.inscriptionId)) {
      throw new ValidationError(
        'inscriptionId',
        "L'ID de l'inscription doit être un nombre entier"
      );
    }

    if (!dto.utilisateurId || dto.utilisateurId <= 0) {
      throw new ValidationError(
        'utilisateurId',
        "L'ID de l'utilisateur doit être un nombre positif"
      );
    }

    if (!Number.isInteger(dto.utilisateurId)) {
      throw new ValidationError(
        'utilisateurId',
        "L'ID de l'utilisateur doit être un nombre entier"
      );
    }
  }
}
