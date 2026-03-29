import { User } from '../../domain/entities/User.js';
import { Email } from '../../domain/value-objects/Email.js';
import { IUserRepository } from '../../domain/interfaces/IUserRepository.js';
import {
  UserNotFoundError,
  EmailAlreadyExistsError,
  ValidationError,
} from '../../domain/errors/DomainError.js';

/**
 * DTO pour la mise à jour d'un utilisateur
 */
export interface UpdateUserDTO {
  userId: number;
  email?: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  dateNaissance?: Date;
  adresse?: string;
  codePostal?: string;
  ville?: string;
  photoUrl?: string;
}

/**
 * Use Case: Mettre à jour un utilisateur
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Récupérer l'utilisateur existant
 * 3. Vérifier que le nouvel email n'est pas déjà utilisé (si changement)
 * 4. Mettre à jour les informations via l'entité (logique métier)
 * 5. Persister les changements
 * 6. Retourner l'utilisateur mis à jour
 *
 * Note: Cette mise à jour concerne les informations de profil.
 * Le mot de passe, le rôle et le statut sont gérés par d'autres use cases
 * pour respecter le principe de responsabilité unique.
 */
export class UpdateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Exécute le use case de mise à jour d'utilisateur
   *
   * @param dto - DTO contenant les nouvelles informations
   * @returns L'utilisateur mis à jour
   * @throws UserNotFoundError si l'utilisateur n'existe pas
   * @throws EmailAlreadyExistsError si le nouvel email existe déjà
   */
  async execute(dto: UpdateUserDTO): Promise<User> {
    // 1. Validation de base du DTO
    this.validateDTO(dto);

    // 2. Récupérer l'utilisateur existant
    const user = await this.userRepository.findById(dto.userId);
    if (!user) {
      throw new UserNotFoundError(dto.userId);
    }

    // 3. Si l'email change, vérifier qu'il n'existe pas déjà
    if (dto.email && dto.email !== user.email.getValue()) {
      const newEmail = new Email(dto.email);
      const emailExists = await this.userRepository.emailExists(newEmail, dto.userId);

      if (emailExists) {
        throw new EmailAlreadyExistsError(dto.email);
      }

      // Note: Changer l'email nécessiterait une nouvelle vérification
      // Ce cas pourrait être géré par un use case séparé "ChangeEmail"
      // Pour l'instant, on bloque le changement d'email via ce use case
      throw new ValidationError(
        'email',
        'Le changement d\'email doit être effectué via un processus de vérification dédié'
      );
    }

    // 4. Préparer les données de mise à jour (ne garder que les champs fournis)
    const updateData: {
      nom?: string;
      prenom?: string;
      telephone?: string;
      dateNaissance?: Date;
      adresse?: string;
      codePostal?: string;
      ville?: string;
      photoUrl?: string;
    } = {};

    if (dto.nom !== undefined) {
      updateData.nom = dto.nom.trim();
    }

    if (dto.prenom !== undefined) {
      updateData.prenom = dto.prenom.trim();
    }

    if (dto.telephone !== undefined) {
      updateData.telephone = dto.telephone.trim();
    }

    if (dto.dateNaissance !== undefined) {
      updateData.dateNaissance = dto.dateNaissance;
    }

    if (dto.adresse !== undefined) {
      updateData.adresse = dto.adresse.trim();
    }

    if (dto.codePostal !== undefined) {
      updateData.codePostal = dto.codePostal.trim();
    }

    if (dto.ville !== undefined) {
      updateData.ville = dto.ville.trim();
    }

    if (dto.photoUrl !== undefined) {
      updateData.photoUrl = dto.photoUrl.trim();
    }

    // 5. Mettre à jour l'utilisateur via la méthode de l'entité
    // (qui contient les validations métier)
    user.updateProfile(updateData);

    // 6. Persister les changements
    const updatedUser = await this.userRepository.update(user);

    // 7. Retourner l'utilisateur mis à jour
    return updatedUser;
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: UpdateUserDTO): void {
    // Validation de l'ID utilisateur
    if (!dto.userId || dto.userId <= 0) {
      throw new ValidationError('userId', 'L\'ID utilisateur doit être un nombre positif');
    }

    if (!Number.isInteger(dto.userId)) {
      throw new ValidationError('userId', 'L\'ID utilisateur doit être un nombre entier');
    }

    // Au moins un champ doit être fourni pour la mise à jour
    const hasAtLeastOneField =
      dto.nom !== undefined ||
      dto.prenom !== undefined ||
      dto.telephone !== undefined ||
      dto.dateNaissance !== undefined ||
      dto.adresse !== undefined ||
      dto.codePostal !== undefined ||
      dto.ville !== undefined ||
      dto.photoUrl !== undefined;

    if (!hasAtLeastOneField) {
      throw new ValidationError(
        'update',
        'Au moins un champ doit être fourni pour la mise à jour'
      );
    }

    // Validation du téléphone si fourni
    if (dto.telephone !== undefined && dto.telephone.trim().length > 0) {
      const phoneRegex = /^[\d\s\+\-\(\)]+$/;
      if (!phoneRegex.test(dto.telephone)) {
        throw new ValidationError(
          'telephone',
          'Le numéro de téléphone contient des caractères invalides'
        );
      }
    }

    // Validation du code postal si fourni
    if (dto.codePostal !== undefined && dto.codePostal.trim().length > 0) {
      const codePostalRegex = /^\d{4,5}$/;
      if (!codePostalRegex.test(dto.codePostal)) {
        throw new ValidationError(
          'codePostal',
          'Le code postal doit contenir 4 ou 5 chiffres'
        );
      }
    }

    // Validation de la date de naissance si fournie
    if (dto.dateNaissance !== undefined) {
      const birthDate = new Date(dto.dateNaissance);
      const today = new Date();

      // Ne peut pas être dans le futur
      if (birthDate > today) {
        throw new ValidationError(
          'dateNaissance',
          'La date de naissance ne peut pas être dans le futur'
        );
      }

      // Ne peut pas être trop ancienne (plus de 150 ans)
      const maxAge = new Date();
      maxAge.setFullYear(maxAge.getFullYear() - 150);
      if (birthDate < maxAge) {
        throw new ValidationError(
          'dateNaissance',
          'La date de naissance est invalide'
        );
      }
    }

    // Validation de l'URL de la photo si fournie
    if (dto.photoUrl !== undefined && dto.photoUrl.trim().length > 0) {
      try {
        new URL(dto.photoUrl);
      } catch {
        throw new ValidationError(
          'photoUrl',
          'L\'URL de la photo n\'est pas valide'
        );
      }
    }
  }
}
