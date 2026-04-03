import { User } from '../../../domain/entities/User.js';
import { Email } from '../../../domain/value-objects/auth/Email.js';
import { Password } from '../../../domain/value-objects/auth/Password.js';
import { Token } from '../../../domain/value-objects/auth/Token.js';
import {
  IAuthRepository,
  IRefreshTokenRepository,
  ISecurityRepository,
} from '../../../domain/interfaces/auth/index.js';
import { AuthError } from '../../../domain/errors/auth/AuthError.js';

/**
 * DTO (Data Transfer Object) pour la connexion
 */
export interface LoginDTO {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Interface pour la réponse de connexion
 */
export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id: number;
    email: string;
    nom: string;
    prenom: string;
    role: string;
    status: string;
    emailVerifie: boolean;
    photoUrl?: string;
  };
}

/**
 * Use Case: Authentifier un utilisateur
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Créer les Value Objects Email et Password
 * 3. Vérifier les limites de taux (rate limiting)
 * 4. Trouver l'utilisateur par email
 * 5. Vérifier le mot de passe
 * 6. Vérifier que le compte est actif et non suspendu
 * 7. Créer les tokens d'accès et de rafraîchissement
 * 8. Enregistrer la tentative de connexion
 * 9. Mettre à jour la date de dernière connexion
 * 10. Retourner la réponse avec les tokens et les données utilisateur
 *
 * Cette classe orchestre la logique applicative sans contenir
 * de détails techniques (DB, etc.)
 */
export class LoginUseCase {
  private static readonly RATE_LIMIT_MINUTES = 15;
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly ACCESS_TOKEN_EXPIRY = '1h';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly securityRepository: ISecurityRepository
  ) {}

  /**
   * Exécute le use case de connexion
   *
   * @param dto - DTO contenant les données de connexion
   * @returns Réponse de connexion avec tokens et données utilisateur
   * @throws AuthError si les identifiants sont invalides, le compte est verrouillé, etc.
   */
  async execute(dto: LoginDTO): Promise<LoginResponse> {
    // 1. Validation des données d'entrée
    this.validateDTO(dto);

    // 2. Créer les Value Objects Email et Password (pour validation)
    const email = Email.create(dto.email);

    // 3. Vérifier les limites de taux (rate limiting)
    await this.checkRateLimit(email);

    // 4. Trouver l'utilisateur par email
    const user = await this.authRepository.findUserByEmail(email);

    if (!user) {
      // Enregistrer la tentative échouée
      await this.recordFailedAttempt(email, dto.ipAddress, dto.userAgent, 'USER_NOT_FOUND');
      throw AuthError.invalidCredentials();
    }

    // 5. Vérifier le mot de passe
    const isPasswordValid = await this.verifyPassword(dto.password, user);

    if (!isPasswordValid) {
      // Enregistrer la tentative échouée
      await this.recordFailedAttempt(email, dto.ipAddress, dto.userAgent, 'INVALID_PASSWORD');
      throw AuthError.invalidCredentials();
    }

    // 6. Vérifier que le compte est actif
    this.checkUserStatus(user);

    // 7. Créer les tokens d'accès et de rafraîchissement
    const { accessToken, refreshToken } = this.createTokens(user);

    // 8. Enregistrer la tentative de connexion réussie
    await this.recordSuccessfulAttempt(user, dto.ipAddress, dto.userAgent);

    // 9. Mettre à jour la date de dernière connexion
    user.recordLogin();

    // 10. Sauvegarder le refresh token
    await this.refreshTokenRepository.create(user.id!, refreshToken, {
      ipAddress: dto.ipAddress,
      userAgent: dto.userAgent,
    });

    // 11. Retourner la réponse
    return {
      success: true,
      message: 'Connexion réussie',
      accessToken: accessToken.getValue(),
      refreshToken: refreshToken.getValue(),
      user: {
        id: user.id!,
        email: user.email.getValue(),
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        status: user.status,
        emailVerifie: user.emailVerifie,
        photoUrl: user.photoUrl,
      },
    };
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: LoginDTO): void {
    if (!dto.email || dto.email.trim().length === 0) {
      throw AuthError.missingField('email');
    }

    if (!dto.password || dto.password.trim().length === 0) {
      throw AuthError.missingField('password');
    }
  }

  /**
   * Vérifie les limites de taux pour éviter le brute force
   */
  private async checkRateLimit(email: Email): Promise<void> {
    const attempts = await this.securityRepository.getRecentAuthAttempts(
      email,
      LoginUseCase.RATE_LIMIT_MINUTES
    );

    if (attempts >= LoginUseCase.MAX_ATTEMPTS) {
      const retryAfter = LoginUseCase.RATE_LIMIT_MINUTES;
      throw AuthError.tooManyAttempts(retryAfter);
    }
  }

  /**
   * Vérifie le mot de passe de l'utilisateur
   */
  private async verifyPassword(plainPassword: string, user: User): Promise<boolean> {
    if (!user.passwordHash) {
      return false;
    }

    try {
      const storedPassword = Password.fromHash(user.passwordHash);
      return await storedPassword.verify(plainPassword);
    } catch (error) {
      console.error('[LoginUseCase] Erreur lors de la vérification du mot de passe:', error);
      return false;
    }
  }

  /**
   * Vérifie le statut du compte utilisateur
   */
  private checkUserStatus(user: User): void {
    if (user.isSuspended()) {
      throw AuthError.accountLocked('Compte suspendu');
    }

    if (!user.isActive()) {
      throw AuthError.userInactive(user.id!);
    }

    // Optionnel: Vérifier si l'email est vérifié
    // if (!user.hasVerifiedEmail()) {
    //   throw AuthError.emailNotVerified();
    // }
  }

  /**
   * Crée les tokens d'accès et de rafraîchissement
   */
  private createTokens(user: User): {
    accessToken: Token;
    refreshToken: Token;
  } {
    // Créer le token d'accès (JWT)
    const accessToken = Token.createJWT(
      {
        id: user.id!,
        email: user.email.getValue(),
        role: user.role,
      },
      'access',
      LoginUseCase.ACCESS_TOKEN_EXPIRY
    );

    // Créer le token de rafraîchissement (JWT)
    const refreshToken = Token.createJWT(
      {
        id: user.id!,
        email: user.email.getValue(),
      },
      'refresh',
      LoginUseCase.REFRESH_TOKEN_EXPIRY
    );

    return { accessToken, refreshToken };
  }

  /**
   * Enregistre une tentative de connexion échouée
   */
  private async recordFailedAttempt(
    email: Email,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    try {
      await this.authRepository.recordAuthAttempt({
        email: email.getValue(),
        success: false,
        ipAddress,
        userAgent,
        failureReason: reason,
        attemptedAt: new Date(),
      });
    } catch (error) {
      console.error('[LoginUseCase] Erreur lors de l\'enregistrement de la tentative:', error);
      // Ne pas bloquer le flux principal si l'audit échoue
    }
  }

  /**
   * Enregistre une tentative de connexion réussie
   */
  private async recordSuccessfulAttempt(
    user: User,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await this.authRepository.recordAuthAttempt({
        email: user.email.getValue(),
        userId: user.id,
        success: true,
        ipAddress,
        userAgent,
        attemptedAt: new Date(),
      });
    } catch (error) {
      console.error('[LoginUseCase] Erreur lors de l\'enregistrement de la tentative:', error);
      // Ne pas bloquer le flux principal si l'audit échoue
    }
  }
}
