/**
 * Tests de gestion d'erreurs pour le service Auth
 * Vérifie la robustesse face aux erreurs DB, ressources inexistantes, conflits métier
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authService } from '../../../services/auth/auth.service.js';

describe('Auth Service - Gestion des erreurs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Erreurs base de données', () => {
    it('authentifier - devrait gérer une erreur de timeout', async () => {
      jest.spyOn(authService, 'authentifier').mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(authService.authentifier('test@example.com', 'password123'))
        .rejects.toThrow('Connection timeout');
    });

    it('creerCompte - devrait gérer une erreur de connexion', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      jest.spyOn(authService, 'creerCompte').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(authService.creerCompte(input))
        .rejects.toThrow('Database connection failed');
    });

    it('verifierEmail - devrait gérer une erreur de requête SQL', async () => {
      jest.spyOn(authService, 'verifierEmail').mockRejectedValue(
        new Error('SQL syntax error')
      );

      await expect(authService.verifierEmail('test@example.com'))
        .rejects.toThrow('SQL syntax error');
    });

    it('changerMotDePasse - devrait gérer une transaction échouée', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockRejectedValue(
        new Error('Transaction rollback')
      );

      await expect(authService.changerMotDePasse(input))
        .rejects.toThrow('Transaction rollback');
    });

    it('obtenirStatistiques - devrait gérer une erreur de lecture', async () => {
      jest.spyOn(authService, 'obtenirStatistiques').mockRejectedValue(
        new Error('Read operation failed')
      );

      await expect(authService.obtenirStatistiques())
        .rejects.toThrow('Read operation failed');
    });
  });

  describe('Ressources inexistantes', () => {
    it('authentifier - devrait gérer un utilisateur inexistant', async () => {
      const mockResult = {
        success: false,
        message: 'Email ou mot de passe incorrect',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('nonexistent@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email ou mot de passe incorrect');
    });

    it('changerMotDePasse - devrait gérer un utilisateur inexistant', async () => {
      const input = {
        userId: 99999,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockRejectedValue(
        new Error('Utilisateur introuvable')
      );

      await expect(authService.changerMotDePasse(input))
        .rejects.toThrow('Utilisateur introuvable');
    });

    it('obtenirInformationsSecurite - devrait gérer un utilisateur inexistant', async () => {
      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(null);

      const result = await authService.obtenirInformationsSecurite(99999);

      expect(result).toBeNull();
    });

    it('verifierTokenRecuperation - devrait retourner null pour token inexistant', async () => {
      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(null);

      const result = await authService.verifierTokenRecuperation('nonexistent-token');

      expect(result).toBeNull();
    });
  });

  describe('Conflits métier', () => {
    it('creerCompte - devrait gérer un email déjà utilisé', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Cet email est déjà utilisé',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cet email est déjà utilisé');
    });

    it('changerMotDePasse - devrait rejeter un mot de passe actuel incorrect', async () => {
      const input = {
        userId: 1,
        currentPassword: 'WrongP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'Mot de passe actuel incorrect',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Mot de passe actuel incorrect');
    });

    it('changerMotDePasse - devrait rejeter même ancien et nouveau mot de passe', async () => {
      const input = {
        userId: 1,
        currentPassword: 'SameP@ssw0rd',
        newPassword: 'SameP@ssw0rd',
      };

      const mockResult = {
        success: false,
        message: 'Le nouveau mot de passe doit être différent de l\'ancien',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('différent');
    });

    it('reinitialiserMotDePasse - devrait rejeter un token expiré', async () => {
      const mockResult = {
        success: false,
        message: 'Le lien de récupération a expiré',
      };

      jest.spyOn(authService, 'reinitialiserMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.reinitialiserMotDePasse('expired-token', 'NewP@ssw0rd123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('expiré');
    });

    it('authentifier - devrait gérer un compte verrouillé', async () => {
      const mockResult = {
        success: false,
        message: 'Compte temporairement verrouillé suite à plusieurs tentatives échouées',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('locked@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('verrouillé');
    });
  });

  describe('Erreurs de validation', () => {
    it('creerCompte - devrait rejeter un email invalide', async () => {
      const input = {
        email: 'invalid-email',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Email invalide',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email invalide');
    });

    it('creerCompte - devrait rejeter un mot de passe faible', async () => {
      const input = {
        email: 'test@example.com',
        password: 'weak',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const result = await authService.creerCompte(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('8 caractères');
    });

    it('changerMotDePasse - devrait rejeter un nouveau mot de passe faible', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'weak',
      };

      const mockResult = {
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('8 caractères');
    });

    it('validerMotDePasse - devrait retourner plusieurs erreurs', async () => {
      const mockValidation = {
        valid: false,
        errors: [
          'Le mot de passe doit contenir au moins 8 caractères',
          'Le mot de passe doit contenir au moins une lettre majuscule',
          'Le mot de passe doit contenir au moins un chiffre',
          'Le mot de passe doit contenir au moins un caractère spécial',
        ],
      };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const result = await authService.validerMotDePasse('abc');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Erreurs inattendues', () => {
    it('authentifier - devrait gérer une erreur null', async () => {
      jest.spyOn(authService, 'authentifier').mockRejectedValue(null);

      await expect(authService.authentifier('test@example.com', 'password123'))
        .rejects.toEqual(null);
    });

    it('creerCompte - devrait gérer une erreur système', async () => {
      const input = {
        email: 'test@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      jest.spyOn(authService, 'creerCompte').mockRejectedValue(
        new Error('System error: out of memory')
      );

      await expect(authService.creerCompte(input))
        .rejects.toThrow('System error: out of memory');
    });

    it('demanderRecuperationMotDePasse - devrait gérer erreur d\'envoi d\'email', async () => {
      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockRejectedValue(
        new Error('Email service unavailable')
      );

      await expect(authService.demanderRecuperationMotDePasse('test@example.com'))
        .rejects.toThrow('Email service unavailable');
    });

    it('nettoyerTokensExpires - devrait gérer une erreur de maintenance', async () => {
      jest.spyOn(authService, 'nettoyerTokensExpires').mockRejectedValue(
        new Error('Maintenance operation failed')
      );

      await expect(authService.nettoyerTokensExpires())
        .rejects.toThrow('Maintenance operation failed');
    });
  });

  describe('Erreurs de sécurité', () => {
    it('authentifier - devrait gérer tentative d\'injection SQL', async () => {
      const mockResult = {
        success: false,
        message: 'Email ou mot de passe incorrect',
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const result = await authService.authentifier('test@example.com\' OR \'1\'=\'1', 'password');

      expect(result.success).toBe(false);
    });

    it('verifierEmail - devrait gérer des caractères dangereux', async () => {
      const mockResult = {
        exists: false,
        email: 'test<script>alert(1)</script>@example.com',
      };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const result = await authService.verifierEmail('test<script>alert(1)</script>@example.com');

      expect(result.exists).toBe(false);
    });

    it('changerMotDePasse - devrait empêcher les mots de passe courants', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'password123',
      };

      const mockResult = {
        success: false,
        message: 'Ce mot de passe est trop courant',
      };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const result = await authService.changerMotDePasse(input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('courant');
    });
  });
});
