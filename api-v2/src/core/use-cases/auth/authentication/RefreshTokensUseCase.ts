import { Token } from '../../../domain/value-objects/auth/Token.js';
import {
  IAuthRepository,
  IRefreshTokenRepository,
} from '../../../domain/interfaces/auth/index.js';
import { AuthError } from '../../../domain/errors/auth/AuthError.js';

/**
 * DTO (Data Transfer Object) pour le rafraîchissement des tokens
 */
export interface RefreshTokensDTO {
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface pour la réponse de rafraîchissement des tokens
 */
export interface RefreshTokensResponse {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
}

/**
 * Use Case: Renouveler les tokens d'authentification
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Vérifier que le refresh token existe et est valide
 * 3. Vérifier que le refresh token n'est pas révoqué
 * 4. Vérifier que le refresh token n'est pas expiré
 * 5. Récupérer l'utilisateur associé au token
 * 6. Vérifier que le compte utilisateur est toujours actif
 * 7. Créer un nouveau access token
 * 8. Créer un nouveau refresh token (rotation)
 * 9. Révoquer l'ancien refresh token
 * 10. Enregistrer le nouveau refresh token
 * 11. Retourner la réponse avec les nouveaux tokens
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, etc.)
 */
export class RefreshTokensUseCase {
  private static readonly ACCESS_TOKEN_EXPIRY = '1h';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly ACCESS_TOKEN_EXPIRY_SECONDS = 3600; // 1 heure

  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository
  ) {}

  /**
   * Exécute le use case de rafraîchissement des tokens
   *
   * @param dto - DTO contenant le refresh token et les métadonnées
   * @returns Réponse avec les nouveaux tokens
   * @throws AuthError si le token est invalide, expiré, révoqué, ou si l'utilisateur n'existe pas
   */
  async execute(dto: RefreshTokensDTO): Promise<RefreshTokensResponse> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Vérifier que le refresh token existe
    const storedToken = await this.refreshTokenRepository.findByToken(dto.refreshToken);

    if (!storedToken) {
      throw AuthError.tokenNotFound('Refresh token');
    }

    // 3. Vérifier que le refresh token n'est pas révoqué
    if (storedToken.revokedAt) {
      throw AuthError.refreshTokenRevoked();
    }

    // 4. Vérifier que le refresh token n'est pas expiré
    if (new Date() > storedToken.expiresAt) {
      throw AuthError.expiredToken('Refresh token');
    }

    // 5. Récupérer l'utilisateur associé au token
    const user = await this.authRepository.findUserById(storedToken.userId);

    if (!user) {
      throw AuthError.userNotFound(storedToken.userId);
    }

    // 6. Vérifier que le compte utilisateur est toujours actif
    this.checkUserStatus(user);

    // 7. Créer un nouveau access token
    const newAccessToken = Token.createJWT(
      {
        id: user.id!,
        email: user.email.getValue(),
        role: user.role,
      },
      'access',
      RefreshTokensUseCase.ACCESS_TOKEN_EXPIRY
    );

    // 8. Créer un nouveau refresh token (rotation)
    const newRefreshToken = Token.createJWT(
      {
        id: user.id!,
        email: user.email.getValue(),
      },
      'refresh',
      RefreshTokensUseCase.REFRESH_TOKEN_EXPIRY
    );

    // 9. Révoquer l'ancien refresh token
    await this.refreshTokenRepository.revoke(storedToken.id);

    // 10. Enregistrer le nouveau refresh token
    await this.refreshTokenRepository.create(user.id!, newRefreshToken, {
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    // 11. Retourner la réponse avec les nouveaux tokens
    return {
      success: true,
      accessToken: newAccessToken.getValue(),
      refreshToken: newRefreshToken.getValue(),
      expiresIn: RefreshTokensUseCase.ACCESS_TOKEN_EXPIRY_SECONDS,
    };
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: RefreshTokensDTO): void {
    if (!dto.refreshToken || dto.refreshToken.trim().length === 0) {
      throw AuthError.missingToken('Refresh token');
    }

    if (typeof dto.refreshToken !== 'string') {
      throw AuthError.invalidToken('Refresh token doit être une chaîne de caractères');
    }
  }

  /**
   * Vérifie le statut du compte utilisateur
   */
  private checkUserStatus(user: any): void {
    if (user.isSuspended()) {
      throw AuthError.accountLocked('Compte suspendu');
    }

    if (!user.isActive()) {
      throw AuthError.userInactive(user.id!);
    }
  }
}
