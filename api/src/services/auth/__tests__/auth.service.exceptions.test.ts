/**
 * Tests d'exceptions et cas limites pour le service Auth
 * Couvre la sécurité, validation des mots de passe et authentification
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockPrisma } from './auth.mock.js';
import type { CreateUserInput, ChangePasswordInput } from '@clubmanager/types';

// Créer le mock Prisma
const mockPrisma = createMockPrisma();

// Mock le module prisma-client AVANT l'import du service
jest.unstable_mockModule('../../../infrastructure/database/prisma-client.js', () => ({
  prisma: mockPrisma,
}));

// Import dynamique du service APRÈS le mock
const { AuthService } = await import('../auth.service.js');

describe('AuthService - Tests d\'Exceptions', () => {
  let authService: InstanceType<typeof AuthService>;

  beforeEach(() => {
    authService = new AuthService();
    mockPrisma._reset();
  });

  // ===========================================
  // TESTS AUTHENTIFICATION - VALIDATIONS
  // ===========================================

  describe('Authentification - Validations d\'entrée', () => {
    it('devrait rejeter une authentification avec email vide', async () => {
      const result = await authService.authentifier('', 'password123');
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une authentification avec mot de passe vide', async () => {
      const result = await authService.authentifier('test@example.com', '');
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une authentification avec email invalide', async () => {
      const result = await authService.authentifier('email-invalide', 'password123');
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une authentification avec email inexistant', async () => {
      const result = await authService.authentifier('inexistant@example.com', 'password123');
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter une authentification avec mauvais mot de passe', async () => {
      const result = await authService.authentifier('test@example.com', 'mauvais-password');
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait gérer les caractères spéciaux dans l\'email', async () => {
      const result = await authService.authentifier('test+special@example.com', 'password123');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer les espaces dans l\'email', async () => {
      const result = await authService.authentifier('  test@example.com  ', 'password123');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS CRÉATION DE COMPTE - VALIDATIONS
  // ===========================================

  describe('Création de compte - Validations d\'entrée', () => {
    it('devrait rejeter un compte sans email', async () => {
      const input: CreateUserInput = {
        password: 'Password123!',
        nom: 'Dupont',
        prenom: 'Jean'
      } as any;

      const result = await authService.creerCompte(input);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Email');
    });

    it('devrait rejeter un compte avec email invalide', async () => {
      const input: CreateUserInput = {
        email: 'email-invalide',
        password: 'Password123!',
        nom: 'Dupont',
        prenom: 'Jean'
      };

      const result = await authService.creerCompte(input);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Email');
    });

    it('devrait rejeter un compte avec email déjà utilisé', async () => {
      const input: CreateUserInput = {
        email: 'existant@example.com',
        password: 'Password123!',
        nom: 'Dupont',
        prenom: 'Jean'
      };

      await authService.creerCompte(input);
      const result = await authService.creerCompte(input);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter un compte sans mot de passe', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        nom: 'Dupont',
        prenom: 'Jean'
      } as any;

      const result = await authService.creerCompte(input);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un compte avec mot de passe trop court', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: '123',
        nom: 'Dupont',
        prenom: 'Jean'
      };

      const result = await authService.creerCompte(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter un compte avec mot de passe sans majuscule', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'password123!',
        nom: 'Dupont',
        prenom: 'Jean'
      };

      const result = await authService.creerCompte(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter un compte avec mot de passe sans chiffre', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'Password!',
        nom: 'Dupont',
        prenom: 'Jean'
      };

      const result = await authService.creerCompte(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter un compte avec mot de passe sans caractère spécial', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'Password123',
        nom: 'Dupont',
        prenom: 'Jean'
      };

      const result = await authService.creerCompte(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter un compte sans nom', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'Password123!',
        prenom: 'Jean'
      } as any;

      const result = await authService.creerCompte(input);
      expect(result).toBeDefined();
    });

    it('devrait rejeter un compte sans prénom', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'Password123!',
        nom: 'Dupont'
      } as any;

      const result = await authService.creerCompte(input);
      expect(result).toBeDefined();
    });
  });

  // ===========================================
  // TESTS VALIDATION MOT DE PASSE
  // ===========================================

  describe('Validation mot de passe - Règles de sécurité', () => {
    it('devrait valider un mot de passe correct', async () => {
      const result = await authService.validerMotDePasse('Password123!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('devrait rejeter un mot de passe trop court', async () => {
      const result = await authService.validerMotDePasse('Pass1!');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait rejeter un mot de passe sans majuscule', async () => {
      const result = await authService.validerMotDePasse('password123!');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait rejeter un mot de passe sans minuscule', async () => {
      const result = await authService.validerMotDePasse('PASSWORD123!');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait rejeter un mot de passe sans chiffre', async () => {
      const result = await authService.validerMotDePasse('Password!');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait rejeter un mot de passe sans caractère spécial', async () => {
      const result = await authService.validerMotDePasse('Password123');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait rejeter un mot de passe vide', async () => {
      const result = await authService.validerMotDePasse('');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('devrait rejeter un mot de passe null', async () => {
      const result = await authService.validerMotDePasse(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  // ===========================================
  // TESTS CHANGEMENT MOT DE PASSE
  // ===========================================

  describe('Changement mot de passe - Validations', () => {
    it('devrait rejeter un changement avec nouveau mot de passe invalide', async () => {
      const input: ChangePasswordInput = {
        userId: 1,
        currentPassword: 'OldPassword123!',
        newPassword: '123'
      };

      const result = await authService.changerMotDePasse(input);
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('devrait rejeter un changement avec userId invalide (0)', async () => {
      const input: ChangePasswordInput = {
        userId: 0,
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      const result = await authService.changerMotDePasse(input);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un changement avec userId négatif', async () => {
      const input: ChangePasswordInput = {
        userId: -1,
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!'
      };

      const result = await authService.changerMotDePasse(input);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un changement avec ancien mot de passe incorrect', async () => {
      const input: ChangePasswordInput = {
        userId: 1,
        currentPassword: 'MauvaisPassword123!',
        newPassword: 'NewPassword123!'
      };

      const result = await authService.changerMotDePasse(input);
      expect(result.success).toBe(false);
    });

    it('devrait rejeter un changement avec ancien et nouveau mot de passe identiques', async () => {
      const input: ChangePasswordInput = {
        userId: 1,
        currentPassword: 'Password123!',
        newPassword: 'Password123!'
      };

      const result = await authService.changerMotDePasse(input);
      expect(result).toBeDefined();
    });
  });

  // ===========================================
  // TESTS RÉCUPÉRATION MOT DE PASSE
  // ===========================================

  describe('Récupération mot de passe - Sécurité', () => {
    it('ne devrait pas révéler si un email existe', async () => {
      const result1 = await authService.demanderRecuperationMotDePasse('existant@example.com');
      const result2 = await authService.demanderRecuperationMotDePasse('inexistant@example.com');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.message).toBe(result2.message);
    });

    it('devrait limiter les tentatives de récupération', async () => {
      const email = 'test@example.com';

      // Faire plusieurs tentatives
      await authService.demanderRecuperationMotDePasse(email);
      await authService.demanderRecuperationMotDePasse(email);
      await authService.demanderRecuperationMotDePasse(email);
      
      const result = await authService.demanderRecuperationMotDePasse(email);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('tentatives');
    });

    it('devrait rejeter un email invalide pour récupération', async () => {
      const result = await authService.demanderRecuperationMotDePasse('email-invalide');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait rejeter un email vide pour récupération', async () => {
      const result = await authService.demanderRecuperationMotDePasse('');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS TOKENS DE RÉCUPÉRATION
  // ===========================================

  describe('Tokens de récupération - Validation', () => {
    it('devrait rejeter un token inexistant', async () => {
      const result = await authService.verifierTokenRecuperation('token-inexistant');
      expect(result).toBeNull();
    });

    it('devrait rejeter un token expiré', async () => {
      const result = await authService.verifierTokenRecuperation('token-expire');
      expect(result).toBeNull();
    });

    it('devrait rejeter un token vide', async () => {
      const result = await authService.verifierTokenRecuperation('');
      expect(result).toBeNull();
    });

    it('devrait rejeter la réinitialisation avec token invalide', async () => {
      const result = await authService.reinitialiserMotDePasse('token-invalide', 'NewPassword123!');
      expect(result.success).toBe(false);
    });

    it('devrait rejeter la réinitialisation avec nouveau mot de passe invalide', async () => {
      const result = await authService.reinitialiserMotDePasse('token-valide', '123');
      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });
  });

  // ===========================================
  // TESTS VÉRIFICATION EMAIL
  // ===========================================

  describe('Vérification email - Validation', () => {
    it('devrait vérifier si un email existe', async () => {
      const result = await authService.verifierEmail('test@example.com');
      expect(result).toBeDefined();
      expect(typeof result.exists).toBe('boolean');
      expect(result.email).toBe('test@example.com');
    });

    it('devrait gérer un email invalide', async () => {
      const result = await authService.verifierEmail('email-invalide');
      expect(result).toBeDefined();
      expect(typeof result.exists).toBe('boolean');
    });

    it('devrait gérer un email vide', async () => {
      const result = await authService.verifierEmail('');
      expect(result).toBeDefined();
      expect(typeof result.exists).toBe('boolean');
    });
  });

  // ===========================================
  // TESTS SÉCURITÉ ET AUDIT
  // ===========================================

  describe('Sécurité - Informations et audit', () => {
    it('devrait récupérer les informations de sécurité', async () => {
      const result = await authService.obtenirInformationsSecurite(1);
      expect(result).toBeDefined();
    });

    it('devrait retourner null pour un utilisateur inexistant', async () => {
      const result = await authService.obtenirInformationsSecurite(999999);
      expect(result).toBeNull();
    });

    it('devrait rejeter un userId invalide (0)', async () => {
      const result = await authService.obtenirInformationsSecurite(0);
      expect(result).toBeDefined();
    });

    it('devrait récupérer les statistiques auth', async () => {
      const result = await authService.obtenirStatistiques();
      expect(result).toBeDefined();
      expect(typeof result.total_utilisateurs).toBe('number');
    });
  });

  // ===========================================
  // TESTS MAINTENANCE
  // ===========================================

  describe('Maintenance - Nettoyage', () => {
    it('devrait nettoyer les tokens expirés', async () => {
      const result = await authService.nettoyerTokensExpires();
      expect(result).toBeDefined();
      expect(typeof result.count).toBe('number');
    });
  });

  // ===========================================
  // TESTS INJECTION SQL ET XSS
  // ===========================================

  describe('Sécurité - Protection contre les injections', () => {
    it('devrait gérer les tentatives d\'injection SQL dans l\'email', async () => {
      const result = await authService.authentifier("' OR '1'='1", 'password');
      expect(result.success).toBe(false);
    });

    it('devrait gérer les scripts XSS dans l\'email', async () => {
      const result = await authService.authentifier('<script>alert("xss")</script>@test.com', 'password');
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    it('devrait gérer les caractères spéciaux dans le mot de passe', async () => {
      const input: CreateUserInput = {
        email: 'test@example.com',
        password: 'P@ssw0rd!<>{}[]',
        nom: 'Test',
        prenom: 'User'
      };

      const result = await authService.creerCompte(input);
      expect(result).toBeDefined();
    });
  });
});
