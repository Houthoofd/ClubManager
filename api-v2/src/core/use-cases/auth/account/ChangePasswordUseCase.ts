import {
  IAuthRepository,
  IRefreshTokenRepository,
} from "../../../domain/interfaces/auth/index.js";
import { Password } from "../../../domain/value-objects/auth/Password.js";
import { AuthError } from "../../../domain/errors/auth/AuthError.js";

/**
 * DTO (Data Transfer Object) pour le changement de mot de passe
 */
export interface ChangePasswordDTO {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

/**
 * Résultat du changement de mot de passe
 */
export interface ChangePasswordResult {
  success: boolean;
  message: string;
}

/**
 * Use Case: Changement de mot de passe (utilisateur authentifié)
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Récupérer l'utilisateur depuis la base de données
 * 3. Vérifier que le mot de passe actuel est correct
 * 4. Valider le nouveau mot de passe
 * 5. Vérifier que le nouveau mot de passe est différent de l'ancien
 * 6. Mettre à jour le mot de passe
 * 7. Révoquer tous les refresh tokens (sécurité)
 * 8. Retourner le résultat
 *
 * Cette classe orchestre la logique applicative selon les principes
 * de Clean Architecture avec injection de dépendances.
 */
export class ChangePasswordUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  /**
   * Exécute le use case de changement de mot de passe
   */
  async execute(dto: ChangePasswordDTO): Promise<ChangePasswordResult> {
    try {
      // 1. Valider les données d'entrée
      this.validateDTO(dto);

      // 2. Récupérer l'utilisateur depuis la base de données
      const user = await this.authRepository.findUserById(dto.userId);
      if (!user) {
        throw AuthError.userNotFound(dto.userId);
      }

      // 3. Vérifier que l'utilisateur a un mot de passe
      if (!user.passwordHash) {
        throw AuthError.internalError("Mot de passe utilisateur non défini");
      }

      // 4. Vérifier que le mot de passe actuel est correct
      const currentPasswordObj = Password.fromHash(user.passwordHash);
      const isCurrentPasswordValid = await currentPasswordObj.verify(
        dto.currentPassword,
      );

      if (!isCurrentPasswordValid) {
        throw AuthError.incorrectPassword();
      }

      // 5. Valider et créer le nouveau mot de passe (validation automatique)
      const newPassword = await Password.create(dto.newPassword);

      // 6. Vérifier que le nouveau mot de passe est différent de l'ancien
      const isSamePassword = await currentPasswordObj.verify(dto.newPassword);
      if (isSamePassword) {
        throw AuthError.invalidField(
          "newPassword",
          "Le nouveau mot de passe doit être différent de l'ancien",
        );
      }

      // 7. Mettre à jour le mot de passe dans la base de données
      await this.authRepository.updatePassword(dto.userId, newPassword);

      // 8. Révoquer tous les refresh tokens pour des raisons de sécurité
      // L'utilisateur devra se reconnecter sur tous ses appareils
      const revokedCount = await this.refreshTokenRepository.revokeAllForUser(
        dto.userId,
      );

      console.log(
        `[ChangePasswordUseCase] Mot de passe changé pour l'utilisateur ${dto.userId}. ${revokedCount} token(s) révoqué(s).`,
      );

      // 9. Retourner le résultat avec succès
      return {
        success: true,
        message: "Mot de passe modifié avec succès. Veuillez vous reconnecter.",
      };
    } catch (error) {
      // Si c'est déjà une AuthError, la relancer
      if (error instanceof AuthError) {
        throw error;
      }

      // Sinon, encapsuler dans une erreur générique
      console.error(
        "[ChangePasswordUseCase] Erreur lors du changement de mot de passe:",
        error,
      );
      throw AuthError.internalError(
        "Erreur lors du changement de mot de passe",
      );
    }
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: ChangePasswordDTO): void {
    if (!dto.userId || typeof dto.userId !== "number" || dto.userId <= 0) {
      throw AuthError.invalidField(
        "userId",
        "Identifiant utilisateur invalide",
      );
    }

    if (!dto.currentPassword || dto.currentPassword.length === 0) {
      throw AuthError.missingField("currentPassword");
    }

    if (!dto.newPassword || dto.newPassword.length === 0) {
      throw AuthError.missingField("newPassword");
    }

    if (dto.currentPassword === dto.newPassword) {
      throw AuthError.invalidField(
        "newPassword",
        "Le nouveau mot de passe doit être différent de l'ancien",
      );
    }
  }
}
