import {
  IAuthRepository,
  IRefreshTokenRepository,
} from "../../../domain/interfaces/auth/index.js";
import { Email } from "../../../domain/value-objects/auth/Email.js";
import { Password } from "../../../domain/value-objects/auth/Password.js";
import { Token } from "../../../domain/value-objects/auth/Token.js";
import { AuthError } from "../../../domain/errors/auth/AuthError.js";
// Local interface for user public data (avoiding external dependency)
interface UserPublic {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  nom_utilisateur: string;
  email: string;
  email_verified: boolean;
  photo_url?: string;
  genre_id: number;
  grade_id?: number;
}

/**
 * DTO (Data Transfer Object) pour l'inscription d'un utilisateur
 */
export interface RegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Résultat de l'inscription d'un utilisateur
 */
export interface RegisterResult {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserPublic;
}

/**
 * Use Case: Inscription d'un nouvel utilisateur
 *
 * Responsabilités:
 * 1. Valider les données d'entrée
 * 2. Valider l'email et le mot de passe
 * 3. Vérifier que l'email n'existe pas déjà
 * 4. Créer l'utilisateur avec le mot de passe hashé
 * 5. Générer les tokens d'authentification (access et refresh)
 * 6. Retourner le résultat avec les tokens et les données utilisateur
 *
 * Cette classe orchestre la logique applicative selon les principes
 * de Clean Architecture avec injection de dépendances.
 */
export class RegisterUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  /**
   * Exécute le use case d'inscription
   */
  async execute(
    dto: RegisterDTO,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<RegisterResult> {
    try {
      // 1. Valider les données d'entrée
      this.validateDTO(dto);

      // 2. Créer les Value Objects avec validation
      const email = Email.create(dto.email);
      const password = await Password.create(dto.password);

      // 3. Vérifier que l'email n'existe pas déjà
      const emailExists = await this.authRepository.checkEmailExists(email);
      if (emailExists) {
        throw AuthError.emailAlreadyExists(email.getValue());
      }

      // 4. Créer l'utilisateur avec le mot de passe hashé
      const user = await this.authRepository.createUser({
        email,
        password,
        nom: dto.lastName.trim(),
        prenom: dto.firstName.trim(),
      });

      // Vérifier que l'utilisateur a été créé avec un ID
      if (!user.id) {
        throw AuthError.internalError(
          "Erreur lors de la création de l'utilisateur",
        );
      }

      // 5. Générer les tokens d'authentification
      const accessToken = Token.createJWT(
        {
          id: user.id,
          email: user.email.getValue(),
        },
        "access",
        "24h", // 24 heures
      );

      const refreshToken = Token.createJWT(
        {
          id: user.id,
          email: user.email.getValue(),
        },
        "refresh",
        "30d", // 30 jours
      );

      // 6. Persister le refresh token
      await this.refreshTokenRepository.create(user.id, refreshToken, metadata);

      // 7. Construire la réponse publique de l'utilisateur
      const userPublic: UserPublic = {
        id: user.id,
        userId: user.id.toString(),
        first_name: user.prenom,
        last_name: user.nom,
        nom_utilisateur: `${user.prenom.toLowerCase()}.${user.nom.toLowerCase()}`,
        email: user.email.getValue(),
        email_verified: false,
        genre_id: 0, // Par défaut
      };

      // 8. Retourner le résultat avec succès
      return {
        success: true,
        message: "Inscription réussie",
        accessToken: accessToken.getValue(),
        refreshToken: refreshToken.getValue(),
        user: userPublic,
      };
    } catch (error) {
      // Si c'est déjà une AuthError, la relancer
      if (error instanceof AuthError) {
        throw error;
      }

      // Sinon, encapsuler dans une erreur générique
      console.error("[RegisterUseCase] Erreur lors de l'inscription:", error);
      throw AuthError.internalError("Erreur lors de l'inscription");
    }
  }

  /**
   * Valide le DTO d'entrée
   */
  private validateDTO(dto: RegisterDTO): void {
    if (!dto.firstName || dto.firstName.trim().length === 0) {
      throw AuthError.missingField("firstName");
    }

    if (dto.firstName.trim().length < 2) {
      throw AuthError.invalidField(
        "firstName",
        "Le prénom doit contenir au moins 2 caractères",
      );
    }

    if (dto.firstName.trim().length > 50) {
      throw AuthError.invalidField(
        "firstName",
        "Le prénom ne peut pas dépasser 50 caractères",
      );
    }

    if (!dto.lastName || dto.lastName.trim().length === 0) {
      throw AuthError.missingField("lastName");
    }

    if (dto.lastName.trim().length < 2) {
      throw AuthError.invalidField(
        "lastName",
        "Le nom doit contenir au moins 2 caractères",
      );
    }

    if (dto.lastName.trim().length > 50) {
      throw AuthError.invalidField(
        "lastName",
        "Le nom ne peut pas dépasser 50 caractères",
      );
    }

    if (!dto.email || dto.email.trim().length === 0) {
      throw AuthError.missingField("email");
    }

    if (!dto.password || dto.password.length === 0) {
      throw AuthError.missingField("password");
    }
  }
}
