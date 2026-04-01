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

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Infrastructure - Repositories
import { UserRepository } from "./infrastructure/database/repositories/UserRepository.js";
import { CoursRepository } from "./infrastructure/database/repositories/CoursRepository.js";
import { CoursRecurrentRepository } from "./infrastructure/database/repositories/CoursRecurrentRepository.js";
import { InscriptionRepository } from "./infrastructure/database/repositories/InscriptionRepository.js";

// Use Cases - Users
import {
  CreateUserUseCase,
  IPasswordHasher,
  IEmailService,
  ITokenService,
} from "./core/use-cases/users/CreateUser.usecase.js";
import { GetUserUseCase } from "./core/use-cases/users/GetUser.usecase.js";
import { UpdateUserUseCase } from "./core/use-cases/users/UpdateUser.usecase.js";

// Use Cases - Cours
import { CreateCoursUseCase } from "./core/use-cases/cours/CreateCours.usecase.js";
import { GetCoursUseCase } from "./core/use-cases/cours/GetCours.usecase.js";
import { GetCoursForParticipantUseCase } from "./core/use-cases/cours/GetCoursForParticipant.usecase.js";
import { GetCoursParSemaineUseCase } from "./core/use-cases/cours/GetCoursParSemaine.usecase.js";
import { CreateInscriptionUseCase } from "./core/use-cases/cours/CreateInscription.usecase.js";
import { AnnulerInscriptionUseCase } from "./core/use-cases/cours/AnnulerInscription.usecase.js";
import { MarquerPresenceUseCase } from "./core/use-cases/cours/MarquerPresence.usecase.js";

// Controllers
import {
  UserController,
  createUserController,
} from "./presentation/http/controllers/UserController.js";
import { CoursController } from "./presentation/http/controllers/CoursController.js";

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
    verificationToken?: string,
  ): Promise<void> {
    try {
      // TODO: Utiliser votre service d'email existant
      // Par exemple: await messageClient.envoyerEmail(...)

      console.log(`📧 [EmailService] Email de bienvenue envoyé à ${email}`);

      if (verificationToken) {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
        console.log(
          `🔗 [EmailService] Lien de vérification: ${verificationUrl}`,
        );
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
      console.error(
        "❌ [EmailService] Erreur lors de l'envoi de l'email:",
        error,
      );
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
    this.secret =
      process.env.JWT_SECRET || "your-secret-key-change-in-production";
    this.expiresIn = process.env.JWT_VERIFICATION_EXPIRES_IN || "24h";
  }

  async generateEmailVerificationToken(
    userId: number,
    email: string,
  ): Promise<string> {
    try {
      const token = jwt.sign(
        {
          userId,
          email,
          type: "email_verification",
        },
        this.secret,
        {
          expiresIn: this.expiresIn,
        },
      );

      return token;
    } catch (error) {
      console.error(
        "❌ [TokenService] Erreur lors de la génération du token:",
        error,
      );
      throw new Error("Impossible de générer le token de vérification");
    }
  }

  async verifyToken(
    token: string,
  ): Promise<{ userId: number; email: string } | null> {
    try {
      const decoded = jwt.verify(token, this.secret) as {
        userId: number;
        email: string;
        type: string;
      };

      if (decoded.type !== "email_verification") {
        return null;
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      console.error("❌ [TokenService] Token invalide:", error);
      return null;
    }
  }
}

/**
 * Container principal de l'application
 * Contient toutes les instances des composants
 */
class Container {
  // Repositories - Users
  private _userRepository: UserRepository | null = null;

  // Repositories - Cours
  private _coursRepository: CoursRepository | null = null;
  private _coursRecurrentRepository: CoursRecurrentRepository | null = null;
  private _inscriptionRepository: InscriptionRepository | null = null;

  // Services
  private _passwordHasher: BcryptPasswordHasher | null = null;
  private _emailService: EmailService | null = null;
  private _tokenService: JwtTokenService | null = null;

  // Use Cases - Users
  private _createUserUseCase: CreateUserUseCase | null = null;
  private _getUserUseCase: GetUserUseCase | null = null;
  private _updateUserUseCase: UpdateUserUseCase | null = null;

  // Use Cases - Cours
  private _createCoursUseCase: CreateCoursUseCase | null = null;
  private _getCoursUseCase: GetCoursUseCase | null = null;
  private _getCoursForParticipantUseCase: GetCoursForParticipantUseCase | null =
    null;
  private _getCoursParSemaineUseCase: GetCoursParSemaineUseCase | null = null;
  private _createInscriptionUseCase: CreateInscriptionUseCase | null = null;
  private _annulerInscriptionUseCase: AnnulerInscriptionUseCase | null = null;
  private _marquerPresenceUseCase: MarquerPresenceUseCase | null = null;

  // Controllers - Users
  private _userController: UserController | null = null;

  // Controllers - Cours
  private _coursController: CoursController | null = null;

  // ============== REPOSITORIES ==============

  get userRepository(): UserRepository {
    if (!this._userRepository) {
      this._userRepository = new UserRepository();
      console.log("✅ [Container] UserRepository instancié");
    }
    return this._userRepository;
  }

  get coursRepository(): CoursRepository {
    if (!this._coursRepository) {
      this._coursRepository = new CoursRepository();
      console.log("✅ [Container] CoursRepository instancié");
    }
    return this._coursRepository;
  }

  get coursRecurrentRepository(): CoursRecurrentRepository {
    if (!this._coursRecurrentRepository) {
      this._coursRecurrentRepository = new CoursRecurrentRepository();
      console.log("✅ [Container] CoursRecurrentRepository instancié");
    }
    return this._coursRecurrentRepository;
  }

  get inscriptionRepository(): InscriptionRepository {
    if (!this._inscriptionRepository) {
      this._inscriptionRepository = new InscriptionRepository();
      console.log("✅ [Container] InscriptionRepository instancié");
    }
    return this._inscriptionRepository;
  }

  // ============== SERVICES ==============

  get passwordHasher(): BcryptPasswordHasher {
    if (!this._passwordHasher) {
      this._passwordHasher = new BcryptPasswordHasher();
      console.log("✅ [Container] PasswordHasher instancié");
    }
    return this._passwordHasher;
  }

  get emailService(): EmailService {
    if (!this._emailService) {
      this._emailService = new EmailService();
      console.log("✅ [Container] EmailService instancié");
    }
    return this._emailService;
  }

  get tokenService(): JwtTokenService {
    if (!this._tokenService) {
      this._tokenService = new JwtTokenService();
      console.log("✅ [Container] TokenService instancié");
    }
    return this._tokenService;
  }

  // ============== USE CASES ==============

  // Users
  get createUserUseCase(): CreateUserUseCase {
    if (!this._createUserUseCase) {
      this._createUserUseCase = new CreateUserUseCase(
        this.userRepository,
        this.passwordHasher,
        this.emailService,
        this.tokenService,
      );
      console.log("✅ [Container] CreateUserUseCase instancié");
    }
    return this._createUserUseCase;
  }

  get getUserUseCase(): GetUserUseCase {
    if (!this._getUserUseCase) {
      this._getUserUseCase = new GetUserUseCase(this.userRepository);
      console.log("✅ [Container] GetUserUseCase instancié");
    }
    return this._getUserUseCase;
  }

  get updateUserUseCase(): UpdateUserUseCase {
    if (!this._updateUserUseCase) {
      this._updateUserUseCase = new UpdateUserUseCase(this.userRepository);
      console.log("✅ [Container] UpdateUserUseCase instancié");
    }
    return this._updateUserUseCase;
  }

  // Cours
  get createCoursUseCase(): CreateCoursUseCase {
    if (!this._createCoursUseCase) {
      this._createCoursUseCase = new CreateCoursUseCase(
        this.coursRepository,
        this.coursRecurrentRepository,
      );
      console.log("✅ [Container] CreateCoursUseCase instancié");
    }
    return this._createCoursUseCase;
  }

  get getCoursUseCase(): GetCoursUseCase {
    if (!this._getCoursUseCase) {
      this._getCoursUseCase = new GetCoursUseCase(this.coursRepository);
      console.log("✅ [Container] GetCoursUseCase instancié");
    }
    return this._getCoursUseCase;
  }

  get getCoursForParticipantUseCase(): GetCoursForParticipantUseCase {
    if (!this._getCoursForParticipantUseCase) {
      this._getCoursForParticipantUseCase = new GetCoursForParticipantUseCase(
        this.coursRepository,
      );
      console.log("✅ [Container] GetCoursForParticipantUseCase instancié");
    }
    return this._getCoursForParticipantUseCase;
  }

  get getCoursParSemaineUseCase(): GetCoursParSemaineUseCase {
    if (!this._getCoursParSemaineUseCase) {
      this._getCoursParSemaineUseCase = new GetCoursParSemaineUseCase(
        this.coursRepository,
      );
      console.log("✅ [Container] GetCoursParSemaineUseCase instancié");
    }
    return this._getCoursParSemaineUseCase;
  }

  get createInscriptionUseCase(): CreateInscriptionUseCase {
    if (!this._createInscriptionUseCase) {
      this._createInscriptionUseCase = new CreateInscriptionUseCase(
        this.inscriptionRepository,
        this.coursRepository,
        this.userRepository,
      );
      console.log("✅ [Container] CreateInscriptionUseCase instancié");
    }
    return this._createInscriptionUseCase;
  }

  get annulerInscriptionUseCase(): AnnulerInscriptionUseCase {
    if (!this._annulerInscriptionUseCase) {
      this._annulerInscriptionUseCase = new AnnulerInscriptionUseCase(
        this.inscriptionRepository,
        this.coursRepository,
      );
      console.log("✅ [Container] AnnulerInscriptionUseCase instancié");
    }
    return this._annulerInscriptionUseCase;
  }

  get marquerPresenceUseCase(): MarquerPresenceUseCase {
    if (!this._marquerPresenceUseCase) {
      this._marquerPresenceUseCase = new MarquerPresenceUseCase(
        this.inscriptionRepository,
        this.coursRepository,
      );
      console.log("✅ [Container] MarquerPresenceUseCase instancié");
    }
    return this._marquerPresenceUseCase;
  }

  // ============== CONTROLLERS ==============

  get userController(): UserController {
    if (!this._userController) {
      this._userController = createUserController(
        this.createUserUseCase,
        this.getUserUseCase,
        this.updateUserUseCase,
      );
      console.log("✅ [Container] UserController instancié");
    }
    return this._userController;
  }

  get coursController(): CoursController {
    if (!this._coursController) {
      this._coursController = new CoursController(
        this.createCoursUseCase,
        this.getCoursUseCase,
        this.getCoursForParticipantUseCase,
        this.getCoursParSemaineUseCase,
        this.createInscriptionUseCase,
        this.annulerInscriptionUseCase,
        this.marquerPresenceUseCase,
      );
      console.log("✅ [Container] CoursController instancié");
    }
    return this._coursController;
  }

  // Note: CoursRecurrentController nécessite encore ses use cases (qui n'existent pas encore)
  // TODO: Ajouter coursRecurrentController quand les use cases seront disponibles

  // ============== MÉTHODES UTILITAIRES ==============

  /**
   * Réinitialise toutes les instances (utile pour les tests)
   */
  reset(): void {
    // Repositories
    this._userRepository = null;
    this._coursRepository = null;
    this._coursRecurrentRepository = null;
    this._inscriptionRepository = null;

    // Services
    this._passwordHasher = null;
    this._emailService = null;
    this._tokenService = null;

    // Use Cases - Users
    this._createUserUseCase = null;
    this._getUserUseCase = null;
    this._updateUserUseCase = null;

    // Use Cases - Cours
    this._createCoursUseCase = null;
    this._getCoursUseCase = null;
    this._getCoursForParticipantUseCase = null;
    this._getCoursParSemaineUseCase = null;
    this._createInscriptionUseCase = null;
    this._annulerInscriptionUseCase = null;
    this._marquerPresenceUseCase = null;

    // Controllers
    this._userController = null;
    this._coursController = null;

    console.log("🔄 [Container] Container réinitialisé");
  }

  /**
   * Affiche l'état actuel du container (pour debug)
   */
  getStatus(): Record<string, boolean> {
    return {
      // Repositories
      userRepository: this._userRepository !== null,
      coursRepository: this._coursRepository !== null,
      coursRecurrentRepository: this._coursRecurrentRepository !== null,
      inscriptionRepository: this._inscriptionRepository !== null,

      // Services
      passwordHasher: this._passwordHasher !== null,
      emailService: this._emailService !== null,
      tokenService: this._tokenService !== null,

      // Use Cases - Users
      createUserUseCase: this._createUserUseCase !== null,
      getUserUseCase: this._getUserUseCase !== null,
      updateUserUseCase: this._updateUserUseCase !== null,

      // Use Cases - Cours
      createCoursUseCase: this._createCoursUseCase !== null,
      getCoursUseCase: this._getCoursUseCase !== null,
      getCoursForParticipantUseCase:
        this._getCoursForParticipantUseCase !== null,
      getCoursParSemaineUseCase: this._getCoursParSemaineUseCase !== null,
      createInscriptionUseCase: this._createInscriptionUseCase !== null,
      annulerInscriptionUseCase: this._annulerInscriptionUseCase !== null,
      marquerPresenceUseCase: this._marquerPresenceUseCase !== null,

      // Controllers
      userController: this._userController !== null,
      coursController: this._coursController !== null,
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
 * import { createCoursRoutes } from './presentation/http/routes/cours.routes.js';
 *
 * const userController = container.userController;
 * const coursController = container.coursController;
 *
 * const userRoutes = createUserRoutes(userController);
 * const coursRoutes = createCoursRoutes(coursController);
 *
 * app.use('/api/users', userRoutes);
 * app.use('/api/cours', coursRoutes);
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
