/**
 * Tests GraphQL pour le module Auth
 * Tests des queries et mutations d'authentification
 */

import { PrismaClient } from '@prisma/client';
import { authResolvers } from '../core/resolvers/auth.resolvers.js';
import { Auth } from '../../../db/clients/auth/auth.js';
import { generateToken } from '../../../middleware/auth.js';

// Mock Prisma
const mockPrisma = {
  utilisateurs: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  password_reset_tokens: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  email_validation_tokens: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock Auth client
jest.mock('../../../db/clients/auth/auth.js');
jest.mock('../../../middleware/auth.js');

describe('Auth GraphQL Resolvers', () => {
  let resolvers: any;
  let mockContext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    resolvers = authResolvers(mockPrisma);

    // Mock context avec req/res pour les cookies
    mockContext = {
      prisma: mockPrisma,
      user: null,
      req: {},
      res: {
        cookie: jest.fn(),
        clearCookie: jest.fn(),
        setHeader: jest.fn(),
      },
    };
  });

  describe('Queries', () => {
    describe('verifyAuth', () => {
      it('devrait retourner l\'utilisateur si authentifié', async () => {
        mockContext.user = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          status_id: 2,
          role: 'Utilisateur',
          status: 'Utilisateur',
        };

        const result = await resolvers.Query.verifyAuth(null, {}, mockContext);

        expect(result.success).toBe(true);
        expect(result.user).toEqual(mockContext.user);
      });

      it('devrait lever une erreur si non authentifié', async () => {
        mockContext.user = null;

        await expect(
          resolvers.Query.verifyAuth(null, {}, mockContext)
        ).rejects.toThrow('Non authentifié');
      });
    });

    describe('verifyResetToken', () => {
      it('devrait vérifier un token valide', async () => {
        const mockAuthClient = {
          verifierTokenRecuperation: jest.fn().mockResolvedValue({
            user_id: 1,
            email: 'test@example.com',
            first_name: 'John',
            last_name: 'Doe',
            expires_at: new Date(Date.now() + 3600000),
          }),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

        const result = await resolvers.Query.verifyResetToken(
          null,
          { token: 'valid-token-123' },
          mockContext
        );

        expect(result.valid).toBe(true);
        expect(result.email).toBe('test@example.com');
        expect(result.userName).toBe('John Doe');
      });

      it('devrait retourner invalide pour un token expiré', async () => {
        const mockAuthClient = {
          verifierTokenRecuperation: jest.fn().mockResolvedValue(null),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

        const result = await resolvers.Query.verifyResetToken(
          null,
          { token: 'invalid-token' },
          mockContext
        );

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token invalide ou expiré');
      });
    });

    describe('checkAuthStatus', () => {
      it('devrait retourner authenticated true si utilisateur connecté', async () => {
        mockContext.user = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          status_id: 2,
          role: 'Utilisateur',
          status: 'Utilisateur',
        };

        const result = await resolvers.Query.checkAuthStatus(null, {}, mockContext);

        expect(result.authenticated).toBe(true);
        expect(result.user).toEqual(mockContext.user);
      });

      it('devrait retourner authenticated false si non connecté', async () => {
        const result = await resolvers.Query.checkAuthStatus(null, {}, mockContext);

        expect(result.authenticated).toBe(false);
        expect(result.message).toBe('Non authentifié');
      });
    });

    describe('confirmEmail', () => {
      it('devrait confirmer un email avec un token valide', async () => {
        const mockAuthClient = {
          verifierTokenValidation: jest.fn().mockResolvedValue(true),
          confirmerEmail: jest.fn().mockResolvedValue({
            success: true,
            message: 'Email confirmé',
          }),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

        const result = await resolvers.Query.confirmEmail(
          null,
          { token: 'valid-token', userId: '1' },
          mockContext
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Email confirmé avec succès');
        expect(result.redirect_to).toContain('confirmed=true');
      });

      it('devrait rejeter un token invalide', async () => {
        const mockAuthClient = {
          verifierTokenValidation: jest.fn().mockResolvedValue(false),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

        const result = await resolvers.Query.confirmEmail(
          null,
          { token: 'invalid-token', userId: '1' },
          mockContext
        );

        expect(result.success).toBe(false);
        expect(result.message).toBe('Token invalide ou expiré');
      });
    });

    describe('testAuth', () => {
      it('devrait retourner un message de succès', async () => {
        const result = await resolvers.Query.testAuth(null, {}, mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('working');
        expect(result.timestamp).toBeDefined();
      });
    });
  });

  describe('Mutations', () => {
    describe('login', () => {
      it('devrait connecter un utilisateur avec des credentials valides', async () => {
        const mockUser = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          status_id: 2,
          status: 'Utilisateur',
        };

        const mockAuthClient = {
          authentifierUtilisateur: jest.fn().mockResolvedValue({
            success: true,
            user: mockUser,
          }),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);
        (generateToken as jest.Mock).mockReturnValue('mock-jwt-token');

        const result = await resolvers.Mutation.login(
          null,
          { input: { email: 'test@example.com', password: 'password123' } },
          mockContext
        );

        expect(result.success).toBe(true);
        expect(result.message).toBe('Connexion réussie');
        expect(result.user).toEqual(mockUser);
        expect(result.token).toBe('mock-jwt-token');
        expect(mockContext.res.cookie).toHaveBeenCalledWith(
          'token',
          'mock-jwt-token',
          expect.any(Object)
        );
      });

      it('devrait rejeter des credentials invalides', async () => {
        const mockAuthClient = {
          authentifierUtilisateur: jest.fn().mockResolvedValue({
            success: false,
            message: 'Email ou mot de passe incorrect',
          }),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

        await expect(
          resolvers.Mutation.login(
            null,
            { input: { email: 'wrong@example.com', password: 'wrongpass' } },
            mockContext
          )
        ).rejects.toThrow('Email ou mot de passe incorrect');
      });

      it('devrait valider les champs requis', async () => {
        await expect(
          resolvers.Mutation.login(
            null,
            { input: { email: '', password: '' } },
            mockContext
          )
        ).rejects.toThrow('Email et mot de passe requis');
      });
    });

    describe('logout', () => {
      it('devrait déconnecter l\'utilisateur et supprimer les cookies', async () => {
        mockContext.user = { id: 1, email: 'test@example.com' };

        const result = await resolvers.Mutation.logout(null, {}, mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toContain('Déconnexion réussie');
        expect(result.cookiesCleared).toBeDefined();
        expect(result.cookiesCleared.length).toBeGreaterThan(0);
        expect(mockContext.res.clearCookie).toHaveBeenCalled();
        expect(mockContext.res.setHeader).toHaveBeenCalledWith(
          'Clear-Site-Data',
          '"cookies", "storage"'
        );
      });
    });

    describe('forgotPassword', () => {
      it('devrait envoyer un email de récupération pour un email valide', async () => {
        const mockAuthClient = {
          emailExiste: jest.fn().mockResolvedValue(true),
          rechercherUtilisateurParEmail: jest.fn().mockResolvedValue({
            id: 1,
            email: 'test@example.com',
            first_name: 'John',
          }),
          creerTokenRecuperation: jest.fn().mockResolvedValue({
            isConfirm: true,
          }),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);
        Auth.genererTokenSecurise = jest.fn().mockReturnValue('reset-token-123');

        // Mock EmailClient
        jest.mock('../../../db/clients/messagerie/emailClient.js', () => ({
          EmailClient: {
            getInstance: jest.fn().mockReturnValue({
              envoyerResetPassword: jest.fn().mockResolvedValue(true),
            }),
          },
        }));

        const result = await resolvers.Mutation.forgotPassword(
          null,
          { input: { email: 'test@example.com' } },
          mockContext
        );

        expect(result.message).toContain('vous recevrez un lien');
        expect(mockAuthClient.creerTokenRecuperation).toHaveBeenCalled();
      });

      it('devrait retourner un message générique pour un email inexistant', async () => {
        const mockAuthClient = {
          emailExiste: jest.fn().mockResolvedValue(false),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

        const result = await resolvers.Mutation.forgotPassword(
          null,
          { input: { email: 'nonexistent@example.com' } },
          mockContext
        );

        expect(result.message).toContain('vous recevrez un lien');
      });
    });

    describe('resetPassword', () => {
      it('devrait réinitialiser le mot de passe avec un token valide', async () => {
        const mockAuthClient = {
          verifierTokenRecuperation: jest.fn().mockResolvedValue({
            user_id: 1,
            email: 'test@example.com',
          }),
          reinitialiserMotDePasseAvecToken: jest.fn().mockResolvedValue({
            isConfirm: true,
          }),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);
        Auth.validerMotDePasse = jest.fn().mockReturnValue({ valid: true });
        Auth.hasherMotDePasse = jest.fn().mockResolvedValue('hashed-password');

        const result = await resolvers.Mutation.resetPassword(
          null,
          { input: { token: 'valid-token', newPassword: 'NewPass123!' } },
          mockContext
        );

        expect(result.message).toBe('Mot de passe réinitialisé avec succès');
        expect(result.error).toBeNull();
      });

      it('devrait rejeter un mot de passe invalide', async () => {
        const mockAuthClient = {
          verifierTokenRecuperation: jest.fn().mockResolvedValue({
            user_id: 1,
            email: 'test@example.com',
          }),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);
        Auth.validerMotDePasse = jest.fn().mockReturnValue({
          valid: false,
          errors: ['Mot de passe trop court'],
        });

        const result = await resolvers.Mutation.resetPassword(
          null,
          { input: { token: 'valid-token', newPassword: 'weak' } },
          mockContext
        );

        expect(result.error).toContain('Mot de passe invalide');
      });

      it('devrait rejeter un token invalide', async () => {
        const mockAuthClient = {
          verifierTokenRecuperation: jest.fn().mockResolvedValue(null),
        };

        (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

        const result = await resolvers.Mutation.resetPassword(
          null,
          { input: { token: 'invalid-token', newPassword: 'NewPass123!' } },
          mockContext
        );

        expect(result.error).toBe('Token invalide ou expiré');
      });
    });

    describe('refreshToken', () => {
      it('devrait générer un nouveau token pour un utilisateur authentifié', async () => {
        mockContext.user = {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          status_id: 2,
          role: 'Utilisateur',
          status: 'Utilisateur',
        };

        (generateToken as jest.Mock).mockReturnValue('new-jwt-token');

        const result = await resolvers.Mutation.refreshToken(null, {}, mockContext);

        expect(result.success).toBe(true);
        expect(result.message).toBe('Token rafraîchi avec succès');
        expect(result.token).toBe('new-jwt-token');
        expect(result.user).toEqual(mockContext.user);
        expect(mockContext.res.cookie).toHaveBeenCalledWith(
          'token',
          'new-jwt-token',
          expect.any(Object)
        );
      });

      it('devrait rejeter si non authentifié', async () => {
        mockContext.user = null;

        await expect(
          resolvers.Mutation.refreshToken(null, {}, mockContext)
        ).rejects.toThrow('Non authentifié');
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs serveur dans login', async () => {
      const mockAuthClient = {
        authentifierUtilisateur: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

      await expect(
        resolvers.Mutation.login(
          null,
          { input: { email: 'test@example.com', password: 'password123' } },
          mockContext
        )
      ).rejects.toThrow('Erreur serveur');
    });

    it('devrait gérer les erreurs serveur dans forgotPassword', async () => {
      const mockAuthClient = {
        emailExiste: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      (Auth as jest.MockedClass<typeof Auth>).mockImplementation(() => mockAuthClient as any);

      await expect(
        resolvers.Mutation.forgotPassword(
          null,
          { input: { email: 'test@example.com' } },
          mockContext
        )
      ).rejects.toThrow('Erreur serveur');
    });
  });
});
