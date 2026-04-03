import {
  IRefreshTokenRepository,
} from '../../../domain/interfaces/auth/index.js';
import { AuthError } from '../../../domain/errors/auth/AuthError.js';

/**
 * DTO (Data Transfer Object) pour la déconnexion
 */
export interface LogoutDTO {
  userId: number;
  refreshToken?: string;
}

/**
 * Interface pour la réponse de déconnexion
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Use Case: Déconnecter un utilisateur
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que l'utilisateur existe
 * 3. Révoquer le refresh token spécifique (si fourni) ou tous les tokens de l'utilisateur
 * 4. Invalider la session
 * 5. Retourner la confirmation de déconnexion
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, etc.)
 */
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  /**
   * Exécute le use case de déconnexion
   *
   * @param dto - DTO contenant les données de déconnexion
   * @returns Réponse de déconnexion avec statut de succès
   * @throws AuthError si les données sont invalides ou l'opération échoue
   */
  async execute(dto: LogoutDTO): Promise<LogoutResponse> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    try {
      // 2. Révoquer le(s) token(s)
      if (dto.refreshToken) {
        // Révoquer le token spécifique
        await this.revokeSpecificToken(dto.refreshToken, dto.userId);

        return {
          success: true,
          message: 'Déconnexion réussie',
        };
      } else {
        // Révoquer tous les tokens de l'utilisateur
        const revokedCount = await this.revokeAllUserTokens(dto.userId);

        return {
          success: true,
          message: revokedCount > 0
            ? `Déconnexion réussie. ${revokedCount} session(s) fermée(s)`
            : 'Déconnexion réussie',
        };
      }
    } catch (error) {
      console.error('[LogoutUseCase] Erreur lors de la déconnexion:', error);

      // Si c'est déjà une AuthError, la relancer
      if (AuthError.isAuthError(error)) {
        throw error;
      }

      // Sinon, lancer une erreur générique
      throw AuthError.internalError('Erreur lors de la déconnexion');
    }
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: LogoutDTO): void {
    if (!dto.userId) {
      throw AuthError.missingField('userId');
    }

    if (!Number.isInteger(dto.userId) || dto.userId <= 0) {
      throw AuthError.invalidField('userId', 'Doit être un nombre entier positif');
    }

    if (dto.refreshToken !== undefined && typeof dto.refreshToken !== 'string') {
      throw AuthError.invalidField('refreshToken', 'Doit être une chaîne de caractères');
    }

    if (dto.refreshToken !== undefined && dto.refreshToken.trim().length === 0) {
      throw AuthError.invalidField('refreshToken', 'Ne peut pas être vide');
    }
  }

  /**
   * Révoque un token de rafraîchissement spécifique
   */
  private async revokeSpecificToken(
    tokenValue: string,
    userId: number
  ): Promise<void> {
    // Trouver le token
    const token = await this.refreshTokenRepository.findByToken(tokenValue);

    if (!token) {
      throw AuthError.tokenNotFound('Refresh token');
    }

    // Vérifier que le token appartient bien à l'utilisateur
    if (token.userId !== userId) {
      throw AuthError.forbidden('Ce token ne vous appartient pas');
    }

    // Vérifier si le token est déjà révoqué
    if (token.revokedAt) {
      throw AuthError.refreshTokenRevoked();
    }

    // Vérifier si le token est expiré
    if (new Date() > token.expiresAt) {
      throw AuthError.expiredToken('Refresh token');
    }

    // Révoquer le token
    await this.refreshTokenRepository.revoke(token.id);
  }

  /**
   * Révoque tous les tokens de rafraîchissement d'un utilisateur
   */
  private async revokeAllUserTokens(userId: number): Promise<number> {
    // Révoquer tous les tokens actifs de l'utilisateur
    const revokedCount = await this.refreshTokenRepository.revokeAllForUser(userId);

    return revokedCount;
  }
}
