import {
  IAuthRepository,
  IPasswordResetTokenRepository,
  ISecurityRepository,
} from "../../../domain/interfaces/auth/index.js";
import { Email } from "../../../domain/value-objects/auth/Email.js";
import { Token } from "../../../domain/value-objects/auth/Token.js";
import { AuthError } from "../../../domain/errors/auth/AuthError.js";

/**
 * DTO (Data Transfer Object) pour la demande de réinitialisation de mot de passe
 */
export interface RequestPasswordResetDTO {
  email: string;
}

/**
 * Résultat de la demande de réinitialisation de mot de passe
 */
export interface RequestPasswordResetResult {
  success: boolean;
  message: string;
  resetToken?: string; // Retourné uniquement en développement/test
}

/**
 * Use Case: Demande de réinitialisation de mot de passe (mot de passe oublié)
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier les limites de taux (rate limiting)
 * 3. Vérifier que l'utilisateur existe
 * 4. Créer un token de réinitialisation
 * 5. Persister le token
 * 6. Enregistrer la tentative pour l'audit
 * 7. Retourner le résultat (toujours success pour éviter l'énumération d'emails)
 *
 * Cette classe orchestre la logique applicative selon les principes
 * de Clean Architecture avec injection de dépendances.
 */
export class RequestPasswordResetUseCase {
  private static readonly RATE_LIMIT_WINDOW_MINUTES = 15;
  private static readonly RATE_LIMIT_MAX_ATTEMPTS = 3;
  private static readonly TOKEN_EXPIRATION_HOURS = 1;

  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly securityRepository: ISecurityRepository,
  ) {}

  /**
   * Exécute le use case de demande de réinitialisation de mot de passe
   */
  async execute(
    dto: RequestPasswordResetDTO,
  ): Promise<RequestPasswordResetResult> {
    try {
      // 1. Valider les données d'entrée
      this.validateDTO(dto);

      // 2. Créer le Value Object Email avec validation
      const email = Email.create(dto.email);

      // 3. Vérifier les limites de taux (rate limiting)
      await this.checkRateLimit(email.getValue());

      // 4. Vérifier que l'utilisateur existe
      const user = await this.authRepository.findUserByEmail(email);

      // Si l'utilisateur n'existe pas, on retourne quand même un succès
      // pour éviter l'énumération d'emails (sécurité)
      if (!user) {
        // Enregistrer la tentative échouée pour l'audit
        await this.passwordResetTokenRepository.recordResetAttempt(
          email.getValue(),
          false,
        );

        // Retourner un message générique
        return {
          success: true,
          message:
            "Si cet email existe, vous recevrez un lien de réinitialisation.",
        };
      }

      // 5. Supprimer les anciens tokens de réinitialisation de cet utilisateur
      await this.passwordResetTokenRepository.deleteAllForUser(user.id!);

      // 6. Créer un nouveau token de réinitialisation
      const resetToken = Token.createSecure(
        "password-reset",
        RequestPasswordResetUseCase.TOKEN_EXPIRATION_HOURS,
      );

      // 7. Persister le token dans la base de données
      await this.passwordResetTokenRepository.create(user.id!, resetToken);

      // 8. Enregistrer la tentative réussie pour l'audit
      await this.passwordResetTokenRepository.recordResetAttempt(
        email.getValue(),
        true,
      );

      // 9. TODO: Envoyer l'email avec le lien de réinitialisation
      // Dans une implémentation complète, on utiliserait un événement ou un service d'email
      // Exemple: await this.emailService.sendPasswordResetEmail(user.email, resetToken);

      console.log(
        `[RequestPasswordResetUseCase] Token de réinitialisation créé pour l'utilisateur ${user.id}`,
      );

      // 10. Retourner le résultat
      // Note: En production, on ne devrait PAS retourner le token dans la réponse
      // Il devrait uniquement être envoyé par email
      // On le retourne ici pour faciliter les tests/développement
      return {
        success: true,
        message:
          "Si cet email existe, vous recevrez un lien de réinitialisation.",
        // Note: Le token ne devrait JAMAIS être retourné dans la réponse en production
        // Il doit être envoyé uniquement par email. Cette ligne est commentée pour des raisons de sécurité.
        // resetToken: resetToken.getValue(), // À décommenter uniquement pour les tests locaux
      };
    } catch (error) {
      // Si c'est déjà une AuthError, la relancer
      if (error instanceof AuthError) {
        throw error;
      }

      // Sinon, encapsuler dans une erreur générique
      console.error(
        "[RequestPasswordResetUseCase] Erreur lors de la demande de réinitialisation:",
        error,
      );
      throw AuthError.internalError(
        "Erreur lors de la demande de réinitialisation",
      );
    }
  }

  /**
   * Vérifie les limites de taux pour éviter les abus
   */
  private async checkRateLimit(email: string): Promise<void> {
    const recentAttempts = await this.securityRepository.getRecentResetAttempts(
      email,
      RequestPasswordResetUseCase.RATE_LIMIT_WINDOW_MINUTES,
    );

    if (recentAttempts >= RequestPasswordResetUseCase.RATE_LIMIT_MAX_ATTEMPTS) {
      throw AuthError.tooManyAttempts(
        RequestPasswordResetUseCase.RATE_LIMIT_WINDOW_MINUTES,
      );
    }
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: RequestPasswordResetDTO): void {
    if (!dto.email || dto.email.trim().length === 0) {
      throw AuthError.missingField("email");
    }
  }
}
