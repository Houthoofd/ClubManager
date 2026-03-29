/**
 * Tests unitaires pour CreateUserUseCase
 *
 * Ces tests démontrent comment tester un use case sans dépendances réelles.
 * Tous les services externes (repository, email, etc.) sont mockés.
 *
 * Avantages :
 * - Tests ultra-rapides (~50ms au lieu de 5s)
 * - Pas besoin de base de données
 * - Pas besoin de serveur email
 * - Tests isolés et reproductibles
 */

import { CreateUserUseCase, CreateUserDTO } from '../CreateUser.usecase.js';
import { IUserRepository } from '../../../domain/interfaces/IUserRepository.js';
import { User, UserRole } from '../../../domain/entities/User.js';
import { Email } from '../../../domain/value-objects/Email.js';
import {
  EmailAlreadyExistsError,
  InvalidPasswordError,
  MinorNotAllowedError,
  InvalidEmailError,
} from '../../../domain/errors/DomainError.js';

// ============== MOCKS ==============

/**
 * Mock du UserRepository
 */
const createMockUserRepository = (): jest.Mocked<IUserRepository> => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findAll: jest.fn(),
  findByFilters: jest.fn(),
  findByRole: jest.fn(),
  findByStatus: jest.fn(),
  findUnverifiedEmails: jest.fn(),
  count: jest.fn(),
  countByFilters: jest.fn(),
  emailExists: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  search: jest.fn(),
  findInactiveUsers: jest.fn(),
  findByRegistrationDateRange: jest.fn(),
  updatePassword: jest.fn(),
  updateLastLogin: jest.fn(),
  updateEmailVerification: jest.fn(),
  transaction: jest.fn(),
});

/**
 * Mock du PasswordHasher
 */
const createMockPasswordHasher = () => ({
  hash: jest.fn(),
});

/**
 * Mock du EmailService
 */
const createMockEmailService = () => ({
  sendWelcomeEmail: jest.fn(),
});

/**
 * Mock du TokenService
 */
const createMockTokenService = () => ({
  generateEmailVerificationToken: jest.fn(),
});

// ============== TESTS ==============

describe('CreateUserUseCase', () => {
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: ReturnType<typeof createMockPasswordHasher>;
  let mockEmailService: ReturnType<typeof createMockEmailService>;
  let mockTokenService: ReturnType<typeof createMockTokenService>;
  let createUserUseCase: CreateUserUseCase;

  // Données de test valides
  const validUserData: CreateUserDTO = {
    email: 'john.doe@example.com',
    password: 'SecurePassword123!',
    nom: 'Doe',
    prenom: 'John',
    telephone: '0612345678',
    dateNaissance: new Date('1990-05-15'),
    adresse: '123 Rue de la Paix',
    codePostal: '75001',
    ville: 'Paris',
  };

  /**
   * Setup avant chaque test
   */
  beforeEach(() => {
    // Créer des mocks frais pour chaque test
    mockUserRepository = createMockUserRepository();
    mockPasswordHasher = createMockPasswordHasher();
    mockEmailService = createMockEmailService();
    mockTokenService = createMockTokenService();

    // Créer l'instance du use case avec les mocks
    createUserUseCase = new CreateUserUseCase(
      mockUserRepository,
      mockPasswordHasher,
      mockEmailService,
      mockTokenService
    );

    // Configuration par défaut des mocks
    mockUserRepository.findByEmail.mockResolvedValue(null); // Email n'existe pas
    mockPasswordHasher.hash.mockResolvedValue('hashed_password_123');
    mockEmailService.sendWelcomeEmail.mockResolvedValue(undefined);
    mockTokenService.generateEmailVerificationToken.mockResolvedValue('token_abc123');
    mockUserRepository.save.mockImplementation(async (user: User) => {
      // Simuler que la DB retourne l'utilisateur avec un ID
      return User.fromPersistence({
        ...user.toObject(),
        id: 1,
        email: user.email,
      } as any);
    });
  });

  /**
   * Nettoyage après chaque test
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== TESTS DE SUCCÈS ====================

  describe('Scénarios de succès', () => {
    it('devrait créer un utilisateur valide avec toutes les informations', async () => {
      // Act
      const result = await createUserUseCase.execute(validUserData);

      // Assert
      expect(result).toBeDefined();
      expect(result.user).toBeInstanceOf(User);
      expect(result.user.email.getValue()).toBe('john.doe@example.com');
      expect(result.user.nom).toBe('Doe');
      expect(result.user.prenom).toBe('John');
      expect(result.verificationToken).toBe('token_abc123');

      // Vérifier que les services ont été appelés correctement
      expect(mockUserRepository.findByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 'john.doe@example.com',
        })
      );

      expect(mockPasswordHasher.hash).toHaveBeenCalledTimes(1);
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('SecurePassword123!');

      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User));

      expect(mockTokenService.generateEmailVerificationToken).toHaveBeenCalledTimes(1);
    });

    it('devrait créer un utilisateur avec les informations minimales', async () => {
      // Arrange
      const minimalData: CreateUserDTO = {
        email: 'minimal@example.com',
        password: 'ValidPass123!',
        nom: 'Minimal',
        prenom: 'User',
      };

      // Act
      const result = await createUserUseCase.execute(minimalData);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email.getValue()).toBe('minimal@example.com');
      expect(result.user.nom).toBe('Minimal');
      expect(result.user.prenom).toBe('User');
      expect(result.user.telephone).toBeUndefined();
      expect(result.user.adresse).toBeUndefined();
    });

    it('devrait normaliser l\'email en minuscules', async () => {
      // Arrange
      const dataWithUppercaseEmail: CreateUserDTO = {
        ...validUserData,
        email: 'JOHN.DOE@EXAMPLE.COM',
      };

      // Act
      const result = await createUserUseCase.execute(dataWithUppercaseEmail);

      // Assert
      expect(result.user.email.getValue()).toBe('john.doe@example.com');
    });

    it('devrait hasher le mot de passe avant de sauvegarder', async () => {
      // Act
      await createUserUseCase.execute(validUserData);

      // Assert
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('SecurePassword123!');

      // Vérifier que l'utilisateur sauvegardé contient le hash
      const savedUser = mockUserRepository.save.mock.calls[0][0];
      expect(savedUser.passwordHash).toBe('hashed_password_123');
    });

    it('devrait envoyer un email de bienvenue (asynchrone)', async () => {
      // Act
      await createUserUseCase.execute(validUserData);

      // Wait a bit for async email sending
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Assert
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
    });
  });

  // ==================== TESTS D'ERREUR ====================

  describe('Scénarios d\'erreur', () => {
    it('devrait échouer si l\'email existe déjà', async () => {
      // Arrange
      const existingUser = User.create({
        email: new Email('john.doe@example.com'),
        nom: 'Existing',
        prenom: 'User',
        role: UserRole.MEMBRE,
      });
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(createUserUseCase.execute(validUserData)).rejects.toThrow(
        EmailAlreadyExistsError
      );

      // Vérifier que save n'a pas été appelé
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('devrait échouer si l\'email est invalide', async () => {
      // Arrange
      const invalidEmailData: CreateUserDTO = {
        ...validUserData,
        email: 'invalid-email',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(invalidEmailData)).rejects.toThrow(
        InvalidEmailError
      );
    });

    it('devrait échouer si le mot de passe est trop court', async () => {
      // Arrange
      const shortPasswordData: CreateUserDTO = {
        ...validUserData,
        password: 'Short1!',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(shortPasswordData)).rejects.toThrow(
        InvalidPasswordError
      );
    });

    it('devrait échouer si le mot de passe n\'a pas de majuscule', async () => {
      // Arrange
      const noUppercaseData: CreateUserDTO = {
        ...validUserData,
        password: 'lowercase123!',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(noUppercaseData)).rejects.toThrow(
        InvalidPasswordError
      );
    });

    it('devrait échouer si le mot de passe n\'a pas de chiffre', async () => {
      // Arrange
      const noNumberData: CreateUserDTO = {
        ...validUserData,
        password: 'NoNumberHere!',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(noNumberData)).rejects.toThrow(
        InvalidPasswordError
      );
    });

    it('devrait échouer si le mot de passe n\'a pas de caractère spécial', async () => {
      // Arrange
      const noSpecialCharData: CreateUserDTO = {
        ...validUserData,
        password: 'NoSpecialChar123',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(noSpecialCharData)).rejects.toThrow(
        InvalidPasswordError
      );
    });

    it('devrait échouer pour un mineur sans autorisation parentale', async () => {
      // Arrange
      const minorData: CreateUserDTO = {
        ...validUserData,
        dateNaissance: new Date('2010-01-01'), // 14 ans
        requireParentalConsent: false,
      };

      // Act & Assert
      await expect(createUserUseCase.execute(minorData)).rejects.toThrow(
        MinorNotAllowedError
      );
    });

    it('devrait créer un utilisateur mineur avec autorisation parentale', async () => {
      // Arrange
      const minorWithConsentData: CreateUserDTO = {
        ...validUserData,
        dateNaissance: new Date('2008-01-01'), // 16 ans
        requireParentalConsent: true,
      };

      // Act
      const result = await createUserUseCase.execute(minorWithConsentData);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.isMajeur()).toBe(false);
    });
  });

  // ==================== TESTS DE VALIDATION ====================

  describe('Validation des données', () => {
    it('devrait échouer si l\'email est manquant', async () => {
      // Arrange
      const noEmailData: any = {
        ...validUserData,
        email: '',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(noEmailData)).rejects.toThrow();
    });

    it('devrait échouer si le nom est manquant', async () => {
      // Arrange
      const noNameData: any = {
        ...validUserData,
        nom: '',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(noNameData)).rejects.toThrow();
    });

    it('devrait échouer si le prénom est manquant', async () => {
      // Arrange
      const noFirstNameData: any = {
        ...validUserData,
        prenom: '',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(noFirstNameData)).rejects.toThrow();
    });

    it('devrait valider le format du code postal', async () => {
      // Arrange
      const invalidPostalCodeData: CreateUserDTO = {
        ...validUserData,
        codePostal: 'ABC',
      };

      // Act & Assert
      await expect(createUserUseCase.execute(invalidPostalCodeData)).rejects.toThrow();
    });
  });

  // ==================== TESTS D'INTÉGRATION DES SERVICES ====================

  describe('Intégration des services', () => {
    it('ne devrait pas bloquer la création si l\'envoi d\'email échoue', async () => {
      // Arrange
      mockEmailService.sendWelcomeEmail.mockRejectedValue(
        new Error('Service email indisponible')
      );

      // Act
      const result = await createUserUseCase.execute(validUserData);

      // Assert
      expect(result.user).toBeDefined();
      expect(mockUserRepository.save).toHaveBeenCalled();
    });

    it('devrait continuer si la génération du token échoue', async () => {
      // Arrange
      mockTokenService.generateEmailVerificationToken.mockRejectedValue(
        new Error('Erreur token')
      );

      // Act
      const result = await createUserUseCase.execute(validUserData);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.verificationToken).toBeUndefined();
    });

    it('devrait échouer si la sauvegarde en base échoue', async () => {
      // Arrange
      mockUserRepository.save.mockRejectedValue(new Error('Erreur DB'));

      // Act & Assert
      await expect(createUserUseCase.execute(validUserData)).rejects.toThrow('Erreur DB');
    });
  });

  // ==================== TESTS DE LOGIQUE MÉTIER ====================

  describe('Logique métier', () => {
    it('devrait créer un utilisateur avec le rôle MEMBRE par défaut', async () => {
      // Act
      const result = await createUserUseCase.execute(validUserData);

      // Assert
      expect(result.user.role).toBe(UserRole.MEMBRE);
    });

    it('devrait accepter un rôle personnalisé', async () => {
      // Arrange
      const professorData: CreateUserDTO = {
        ...validUserData,
        role: UserRole.PROFESSEUR,
      };

      // Act
      const result = await createUserUseCase.execute(professorData);

      // Assert
      expect(result.user.role).toBe(UserRole.PROFESSEUR);
    });

    it('devrait créer l\'utilisateur avec le statut EN_ATTENTE', async () => {
      // Act
      const result = await createUserUseCase.execute(validUserData);

      // Assert
      expect(result.user.isActive()).toBe(false);
      expect(result.user.hasVerifiedEmail()).toBe(false);
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════
 * EXÉCUTION DES TESTS
 * ═══════════════════════════════════════════════════════════════
 *
 * Pour exécuter ces tests :
 *
 * npm test CreateUser.usecase.test.ts
 *
 * ou
 *
 * jest CreateUser.usecase.test.ts --coverage
 *
 * ═══════════════════════════════════════════════════════════════
 * RÉSULTATS ATTENDUS
 * ═══════════════════════════════════════════════════════════════
 *
 * ✅ 20+ tests passent
 * ✅ Temps d'exécution : ~200-500ms (sans DB !)
 * ✅ Couverture de code : >90%
 *
 * ═══════════════════════════════════════════════════════════════
 */
