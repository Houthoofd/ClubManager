/**
 * Container d'injection de dépendances
 *
 * Ce fichier est le point central où tous les composants de l'application
 * sont assemblés et connectés ensemble.
 *
 * Avantages de ce pattern :
 * - Toutes les dépendances sont gérées en un seul endroit
 * - Facile de remplacer une implémentation (ex: MockEmailService pour les tests)
 * - Respect du principe d'inversion de dépendance (SOLID)
 * - Configuration centralisée
 *
 * Alternative : Utiliser une bibliothèque comme TSyringe ou InversifyJS
 * pour une injection de dépendances plus automatique avec des décorateurs.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Infrastructure
import { UserRepository } from './infrastructure/database/repositories/UserRepository.js';

// Use Cases
import {
  CreateUserUseCase,
  IPasswordHasher,
  IEmailService,
  ITokenService,
} from './core/use-cases/users/CreateUser.usecase.js';
import { GetUserUseCase } from './core/use-cases/users/GetUser.usecase.js';
import { UpdateUserUseCase } from './core/use-cases/users/UpdateUser.usecase.js';

// Controllers
import {
  UserController,
  createUserController,
} from './presentation/http/controllers/UserController.js';

/**
 * Implémentation du service de hashage de mot de passe avec bcrypt
 */
class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

/**
 * Implémentation du service d'email
 * Note: Adapter selon votre système d'email existant (SendGrid, etc.)
 */
class EmailService implements IEmailService {
  async sendWelcomeEmail(
    email: string,
    name: string,
    verificationToken?: string
  ): Promise<void> {
    try {
      // TODO: Utiliser votre service d'email existant
      // Par exemple: await messageClient.envoyerEmail(...)

      console.log(`📧 [EmailService] Email de bienvenue envoyé à ${email}`);

      if (verificationToken) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        console.log(`🔗 [EmailService] Lien de vérification: ${verificationUrl}`);
      }

      // Simulation d'envoi d'email
      // Dans un cas réel, remplacer par votre implémentation :
      /*
      const { messageClient } = await import('./db/clients/messagerie/messageClient.js');
      await messageClient.envoyerEmail({
        destinataire: email,
        sujet: 'Bienvenue sur ClubManager',
        contenu: `Bonjour ${name}, bienvenue !`,
        html: `<h1>Bienvenue ${name}</h1>...`
      });
      */
    } catch (error) {
      console.error('❌ [EmailService] Erreur lors de l\'envoi de l\'email:', error);
      // Ne pas faire échouer la création de l'utilisateur si l'email échoue
      // L'erreur est loggée mais pas propagée
    }
  }
}

/**
 * Implémentation du service de génération de tokens JWT
 */
class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.expiresIn = process.env.JWT_VERIFICATION_EXPIRES_IN || '24h';
  }

  async generateEmailVerificationToken(userId: number, email: string): Promise<string> {
    try {
      const token = jwt.sign(
        {
          userId,
          email,
          type: 'email_verification',
        },
        this.secret,
        {
          expiresIn: this.expiresIn,
        }
      );

      return token;
    } catch (error) {
      console.error('❌ [TokenService] Erreur lors de la génération du token:', error);
      throw new Error('Impossible de générer le token de vérification');
    }
  }

  async verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
    try {
      const decoded = jwt.verify(token, this.secret) as {
        userId: number;
        email: string;
        type: string;
      };

      if (decoded.type !== 'email_verification') {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      console.error('❌ [TokenService] Token invalide:', error);
      return null;
    }
  }
}

/**
 * Container principal de l'application
 * Contient toutes les instances des composants
 */
class Container {
  // Repositories
  private _userRepository: UserRepository | null = null;

  // Services
  private _passwordHasher: BcryptPasswordHasher | null = null;
  private _emailService: EmailService | null = null;
  private _tokenService: JwtTokenService | null = null;

  // Use Cases
  private _createUserUseCase: CreateUserUseCase | null = null;
  private _getUserUseCase: GetUserUseCase | null = null;
  private _updateUserUseCase: UpdateUserUseCase | null = null;

  // Controllers
  private _userController: UserController | null = null;

  // ============== REPOSITORIES ==============

  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
      console.log('✅ [Container] UserRepository instancié');
    }
    return this._userRepository;
  }

  // ============== SERVICES ==============

  get passwordHasher(): BcryptPasswordHasher {
    if (!this._passwordHasher) {
      this._passwordHasher = new BcryptPasswordHasher();
      console.log('✅ [Container] PasswordHasher instancié');
    }
    return this._passwordHasher;
  }

  get emailService(): EmailService {
    if (!this._emailService) {
      this._emailService = new EmailService();
      console.log('✅ [Container] EmailService instancié');
    }
    return this._emailService;
  }

  get tokenService(): JwtTokenService {
    if (!this._tokenService) {
      this._tokenService = new JwtTokenService();
      console.log('✅ [Container] TokenService instancié');
    }
    return this._tokenService;
  }

  // ============== USE CASES ==============

  get createUserUseCase(): CreateUserUseCase {
    if (!this._createUserUseCase) {
      this._createUserUseCase = new CreateUserUseCase(
        this.userRepository,
        this.passwordHasher,
        this.emailService,
        this.tokenService
      );
      console.log('✅ [Container] CreateUserUseCase instancié');
    }
    return this._createUserUseCase;
  }

  get getUserUseCase(): GetUserUseCase {
    if (!this._getUserUseCase) {
      this._getUserUseCase = new GetUserUseCase(this.userRepository);
      console.log('✅ [Container] GetUserUseCase instancié');
    }
    return this._getUserUseCase;
  }

  get updateUserUseCase(): UpdateUserUseCase {
    if (!this._updateUserUseCase) {
      this._updateUserUseCase = new UpdateUserUseCase(this.userRepository);
      console.log('✅ [Container] UpdateUserUseCase instancié');
    }
    return this._updateUserUseCase;
  }

  // ============== CONTROLLERS ==============

  get userController(): UserController {
    if (!this._userController) {
      this._userController = createUserController(
        this.createUserUseCase,
        this.getUserUseCase,
        this.updateUserUseCase
      );
      console.log('✅ [Container] UserController instancié');
    }
    return this._userController;
  }

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Réinitialise toutes les instances (utile pour les tests)
   */
  reset(): void {
    this._userRepository = null;
    this._passwordHasher = null;
    this._emailService = null;
    this._tokenService = null;
    this._createUserUseCase = null;
    this._getUserUseCase = null;
    this._updateUserUseCase = null;
    this._userController = null;
    console.log('🔄 [Container] Container réinitialisé');
  }

  /**
   * Affiche l'état actuel du container (pour debug)
   */
  getStatus(): Record<string, boolean> {
    return {
      userRepository: this._userRepository !== null,
      passwordHasher: this._passwordHasher !== null,
      emailService: this._emailService !== null,
      tokenService: this._tokenService !== null,
      createUserUseCase: this._createUserUseCase !== null,
      getUserUseCase: this._getUserUseCase !== null,
      updateUserUseCase: this._updateUserUseCase !== null,
      userController: this._userController !== null,
    };
  }
}

/**
 * Instance unique du container (Singleton)
 * Cette instance est utilisée partout dans l'application
 */
export const container = new Container();

/**
 * Export de la classe pour les tests ou cas d'usage avancés
 */
export { Container };

/**
 * Exemple d'utilisation :
 *
 * ```typescript
 * // Dans votre fichier de routes
 * import { container } from './container.js';
 * import { createUserRoutes } from './presentation/http/routes/users.routes.js';
 *
 * const userController = container.userController;
 * const userRoutes = createUserRoutes(userController);
 *
 * app.use('/api/users', userRoutes);
 * ```
 *
 * Pour les tests :
 *
 * ```typescript
 * import { Container } from './container.js';
 *
 * describe('User Tests', () => {
 *   let testContainer: Container;
 *
 *   beforeEach(() => {
 *     testContainer = new Container();
 *     // Remplacer les services par des mocks si nécessaire
 *   });
 *
 *   afterEach(() => {
 *     testContainer.reset();
 *   });
 * });
 * ```
 */
