import {
  IAuthRepository,
  IPasswordResetTokenRepository,
  IRefreshTokenRepository,
} from "../../../domain/interfaces/auth/index.js";
import { Password } from "../../../domain/value-objects/auth/Password.js";
import { AuthError } from "../../../domain/errors/auth/AuthError.js";

/**
 * DTO (Data Transfer Object) pour la réinitialisation de mot de passe
 */
export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
}

/**
 * Résultat de la réinitialisation de mot de passe
 */
export interface ResetPasswordResult {
  success: boolean;
  message: string;
}

/**
 * Use Case: Réinitialisation de mot de passe avec token
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que le token existe et est valide
 * 3. Vérifier que le token n'a pas expiré
 * 4. Vérifier que le token n'a pas déjà été utilisé
 * 5. Valider le nouveau mot de passe
 * 6. Mettre à jour le mot de passe de l'utilisateur
 * 7. Marquer le token comme utilisé
 * 8. Révoquer tous les refresh tokens (sécurité)
 * 9. Retourner le résultat
 *
 * Cette classe orchestre la logique applicative selon les principes
 * de Clean Architecture avec injection de dépendances.
 */
export class ResetPasswordUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  /**
   * Exécute le use case de réinitialisation de mot de passe
   */
  async execute(dto: ResetPasswordDTO): Promise<ResetPasswordResult> {
    try {
      // 1. Valider les données d'entrée
      this.validateDTO(dto);

      // 2. Vérifier que le token existe dans la base de données
      const resetToken = await this.passwordResetTokenRepository.findByToken(
        dto.token,
      );
      if (!resetToken) {
        throw AuthError.invalidToken(
          "Token de réinitialisation invalide ou expiré",
        );
      }

      // 3. Vérifier que le token n'a pas expiré
      const now = new Date();
      if (resetToken.expiresAt < now) {
        throw AuthError.expiredToken("Token de réinitialisation");
      }

      // 4. Vérifier que le token n'a pas déjà été utilisé
      if (resetToken.usedAt) {
        throw AuthError.invalidToken("Ce token a déjà été utilisé");
      }

      // 5. Récupérer l'utilisateur associé au token
      const user = await this.authRepository.findUserById(resetToken.userId);
      if (!user) {
        throw AuthError.userNotFound(resetToken.userId);
      }

      // 6. Valider et créer le nouveau mot de passe (validation automatique)
      const newPassword = await Password.create(dto.newPassword);

      // 7. Mettre à jour le mot de passe dans la base de données
      await this.authRepository.updatePassword(resetToken.userId, newPassword);

      // 8. Marquer le token comme utilisé
      await this.passwordResetTokenRepository.markAsUsed(resetToken.id);

      // 9. Révoquer tous les refresh tokens pour des raisons de sécurité
      // L'utilisateur devra se reconnecter sur tous ses appareils
      const revokedCount = await this.refreshTokenRepository.revokeAllForUser(
        resetToken.userId,
      );

      console.log(
        `[ResetPasswordUseCase] Mot de passe réinitialisé pour l'utilisateur ${resetToken.userId}. ${revokedCount} token(s) révoqué(s).`,
      );

      // 10. Retourner le résultat avec succès
      return {
        success: true,
        message:
          "Mot de passe réinitialisé avec succès. Veuillez vous connecter.",
      };
    } catch (error) {
      // Si c'est déjà une AuthError, la relancer
      if (error instanceof AuthError) {
        throw error;
      }

      // Sinon, encapsuler dans une erreur générique
      console.error(
        "[ResetPasswordUseCase] Erreur lors de la réinitialisation:",
        error,
      );
      throw AuthError.internalError(
        "Erreur lors de la réinitialisation du mot de passe",
      );
    }
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: ResetPasswordDTO): void {
    if (!dto.token || dto.token.trim().length === 0) {
      throw AuthError.missingField("token");
    }

    if (dto.token.trim().length < 16) {
      throw AuthError.invalidField(
        "token",
        "Token de réinitialisation invalide",
      );
    }

    if (!dto.newPassword || dto.newPassword.length === 0) {
      throw AuthError.missingField("newPassword");
    }
  }
}
