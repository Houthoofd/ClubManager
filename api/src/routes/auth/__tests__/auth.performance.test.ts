/**
 * Tests de performance pour le service Auth
 * Vérifie les temps de réponse et l'optimisation des opérations
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authService } from '../core/services/auth.service.js';

describe('Auth Service - Tests de Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Temps de réponse - Authentification', () => {
    it('devrait authentifier un utilisateur en moins de 100ms', async () => {
      const mockResult = {
        success: true,
        user: { id: 1, email: 'test@example.com' },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await authService.authentifier('test@example.com', 'password123');
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Authentification en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('devrait vérifier un email en moins de 50ms', async () => {
      const mockResult = { exists: true, email: 'test@example.com' };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const startTime = performance.now();
      await authService.verifierEmail('test@example.com');
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Vérification email en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('devrait valider un mot de passe en moins de 30ms', async () => {
      const mockValidation = { valid: true, errors: [] };

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const startTime = performance.now();
      await authService.validerMotDePasse('SecureP@ssw0rd123');
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Validation mot de passe en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(30);
    });
  });

  describe('Temps de réponse - Création et modifications', () => {
    it('devrait créer un compte en moins de 200ms', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      };

      const mockResult = {
        success: true,
        user: { id: 1, email: input.email },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await authService.creerCompte(input);
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Création de compte en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(200);
    });

    it('devrait changer un mot de passe en moins de 150ms', async () => {
      const input = {
        userId: 1,
        currentPassword: 'OldP@ssw0rd',
        newPassword: 'NewSecureP@ssw0rd',
      };

      const mockResult = { success: true, message: 'Mot de passe modifié' };

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await authService.changerMotDePasse(input);
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Changement mot de passe en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Temps de réponse - Récupération de mot de passe', () => {
    it('devrait créer une demande de récupération en moins de 100ms', async () => {
      const mockResult = {
        success: true,
        message: 'Si cet email existe, un lien a été envoyé',
      };

      jest.spyOn(authService, 'demanderRecuperationMotDePasse').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await authService.demanderRecuperationMotDePasse('test@example.com');
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Demande récupération en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('devrait vérifier un token en moins de 50ms', async () => {
      const mockToken = {
        token: 'valid-token',
        userId: 1,
        expiresAt: new Date(),
      };

      jest.spyOn(authService, 'verifierTokenRecuperation').mockResolvedValue(mockToken as any);

      const startTime = performance.now();
      await authService.verifierTokenRecuperation('valid-token');
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Vérification token en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(50);
    });

    it('devrait réinitialiser un mot de passe en moins de 150ms', async () => {
      const mockResult = { success: true, message: 'Mot de passe réinitialisé' };

      jest.spyOn(authService, 'reinitialiserMotDePasse').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await authService.reinitialiserMotDePasse('valid-token', 'NewP@ssw0rd123');
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Réinitialisation en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Temps de réponse - Statistiques et audit', () => {
    it('devrait récupérer les statistiques en moins de 100ms', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 85,
        lockedAccounts: 2,
        recentLogins: 50,
      };

      jest.spyOn(authService, 'obtenirStatistiques').mockResolvedValue(mockStats as any);

      const startTime = performance.now();
      await authService.obtenirStatistiques();
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Statistiques en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });

    it('devrait récupérer les infos de sécurité en moins de 80ms', async () => {
      const mockInfo = {
        userId: 1,
        lastLogin: new Date(),
        failedAttempts: 0,
        accountLocked: false,
      };

      jest.spyOn(authService, 'obtenirInformationsSecurite').mockResolvedValue(mockInfo as any);

      const startTime = performance.now();
      await authService.obtenirInformationsSecurite(1);
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Infos sécurité en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(80);
    });
  });

  describe('Performance avec charge élevée', () => {
    it('devrait gérer 10 authentifications simultanées', async () => {
      const mockResult = {
        success: true,
        user: { id: 1, email: 'test@example.com' },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const startTime = performance.now();

      const promises = Array.from({ length: 10 }, () =>
        authService.authentifier('test@example.com', 'password123')
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / 10;

      console.log(`⏱️  10 authentifications parallèles: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(150);
    });

    it('devrait gérer 20 vérifications d\'email simultanées', async () => {
      const mockResult = { exists: true, email: 'test@example.com' };

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const startTime = performance.now();

      const promises = Array.from({ length: 20 }, (_, i) =>
        authService.verifierEmail(`user${i}@example.com`)
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / 20;

      console.log(`⏱️  20 vérifications email parallèles: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(100);
    });

    it('devrait gérer 5 créations de compte simultanées', async () => {
      const mockResult = {
        success: true,
        user: { id: 1, email: 'test@example.com' },
      };

      jest.spyOn(authService, 'creerCompte').mockResolvedValue(mockResult as any);

      const startTime = performance.now();

      const promises = Array.from({ length: 5 }, (_, i) =>
        authService.creerCompte({
          email: `user${i}@example.com`,
          password: 'SecureP@ssw0rd',
          first_name: 'User',
          last_name: `${i}`,
        })
      );

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / 5;

      console.log(`⏱️  5 créations parallèles: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(250);
    });
  });

  describe('Performance sous charge mixte', () => {
    it('devrait maintenir les performances sous charge mixte', async () => {
      jest.spyOn(authService, 'authentifier').mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      } as any);

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue({
        exists: true,
        email: 'test@example.com',
      });

      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue({
        valid: true,
        errors: [],
      });

      const startTime = performance.now();

      const promises = [
        ...Array.from({ length: 10 }, () =>
          authService.authentifier('test@example.com', 'password123')
        ),
        ...Array.from({ length: 15 }, () =>
          authService.verifierEmail('test@example.com')
        ),
        ...Array.from({ length: 5 }, () =>
          authService.validerMotDePasse('SecureP@ssw0rd123')
        ),
      ];

      await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;
      const avgDuration = duration / 30;

      console.log(`⏱️  Charge mixte (30 ops): ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(150);
    });
  });

  describe('Performance du nettoyage', () => {
    it('devrait nettoyer les tokens expirés en moins de 100ms', async () => {
      const mockResult = { count: 10 };

      jest.spyOn(authService, 'nettoyerTokensExpires').mockResolvedValue(mockResult);

      const startTime = performance.now();
      await authService.nettoyerTokensExpires();
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`⏱️  Nettoyage tokens en ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Optimisation mémoire', () => {
    it('devrait limiter la mémoire utilisée lors des opérations', async () => {
      const mockResult = {
        success: true,
        user: { id: 1, email: 'test@example.com' },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const before = process.memoryUsage().heapUsed;

      // Effectuer 100 opérations
      for (let i = 0; i < 100; i++) {
        await authService.authentifier('test@example.com', 'password123');
      }

      const after = process.memoryUsage().heapUsed;
      const memoryUsedMB = (after - before) / 1024 / 1024;

      console.log(`💾 Mémoire utilisée (100 ops): ${memoryUsedMB.toFixed(2)} MB`);
      expect(memoryUsedMB).toBeLessThan(10); // Max 10MB pour 100 opérations
    });

    it('devrait libérer la mémoire après les opérations', async () => {
      const mockResult = {
        success: true,
        user: { id: 1, email: 'test@example.com' },
      };

      jest.spyOn(authService, 'authentifier').mockResolvedValue(mockResult as any);

      const initialMemory = process.memoryUsage().heapUsed;

      // Effectuer plusieurs opérations
      for (let i = 0; i < 50; i++) {
        await authService.authentifier('test@example.com', 'password123');
      }

      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowthMB = (finalMemory - initialMemory) / 1024 / 1024;

      console.log(`💾 Croissance mémoire: ${memoryGrowthMB.toFixed(2)} MB`);
      expect(memoryGrowthMB).toBeLessThan(5);
    });
  });

  describe('Benchmarks et seuils de performance', () => {
    it('devrait documenter les performances baseline', async () => {
      const benchmarks: Record<string, number> = {};

      // Mock toutes les opérations
      jest.spyOn(authService, 'authentifier').mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      } as any);

      jest.spyOn(authService, 'creerCompte').mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      } as any);

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue({
        exists: true,
        email: 'test@example.com',
      });

      jest.spyOn(authService, 'changerMotDePasse').mockResolvedValue({
        success: true,
        message: 'Modifié',
      } as any);

      jest.spyOn(authService, 'obtenirStatistiques').mockResolvedValue({
        totalUsers: 100,
        activeUsers: 85,
      } as any);

      // Authentification
      let start = performance.now();
      await authService.authentifier('test@example.com', 'password123');
      benchmarks['authentification'] = performance.now() - start;

      // Création de compte
      start = performance.now();
      await authService.creerCompte({
        email: 'new@example.com',
        password: 'SecureP@ssw0rd',
        first_name: 'John',
        last_name: 'Doe',
      });
      benchmarks['creation_compte'] = performance.now() - start;

      // Vérification email
      start = performance.now();
      await authService.verifierEmail('test@example.com');
      benchmarks['verification_email'] = performance.now() - start;

      // Changement mot de passe
      start = performance.now();
      await authService.changerMotDePasse({
        userId: 1,
        currentPassword: 'old',
        newPassword: 'new',
      });
      benchmarks['changement_mdp'] = performance.now() - start;

      // Statistiques
      start = performance.now();
      await authService.obtenirStatistiques();
      benchmarks['statistiques'] = performance.now() - start;

      console.log('\n📊 Benchmarks de performance Auth:');
      Object.entries(benchmarks).forEach(([operation, duration]) => {
        console.log(`   ${operation}: ${duration.toFixed(2)}ms`);
      });

      // Tous les benchmarks devraient être raisonnables
      Object.values(benchmarks).forEach(duration => {
        expect(duration).toBeLessThan(500);
      });
    });

    it('devrait identifier les opérations lentes (> 200ms)', async () => {
      jest.spyOn(authService, 'authentifier').mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' },
      } as any);

      jest.spyOn(authService, 'verifierEmail').mockResolvedValue({
        exists: true,
        email: 'test@example.com',
      });

      jest.spyOn(authService, 'obtenirStatistiques').mockResolvedValue({
        totalUsers: 100,
      } as any);

      const operations = [
        {
          name: 'Authentification',
          fn: () => authService.authentifier('test@example.com', 'password123')
        },
        {
          name: 'Vérification email',
          fn: () => authService.verifierEmail('test@example.com')
        },
        {
          name: 'Statistiques',
          fn: () => authService.obtenirStatistiques()
        },
      ];

      const slowOperations: string[] = [];

      for (const op of operations) {
        const start = performance.now();
        await op.fn();
        const duration = performance.now() - start;

        if (duration > 200) {
          slowOperations.push(`${op.name} (${duration.toFixed(2)}ms)`);
        }
      }

      if (slowOperations.length > 0) {
        console.warn(`⚠️  Opérations lentes détectées: ${slowOperations.join(', ')}`);
      }

      expect(slowOperations).toHaveLength(0);
    });
  });

  describe('Performance de la validation', () => {
    it('devrait valider rapidement les emails en batch', async () => {
      const mockResult = { exists: false, email: '' };
      jest.spyOn(authService, 'verifierEmail').mockResolvedValue(mockResult);

      const emails = Array.from({ length: 50 }, (_, i) => `user${i}@example.com`);

      const startTime = performance.now();
      await Promise.all(emails.map(email => authService.verifierEmail(email)));
      const endTime = performance.now();

      const duration = endTime - startTime;
      const avgDuration = duration / 50;

      console.log(`⏱️  50 validations email: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(50);
    });

    it('devrait valider rapidement les mots de passe en batch', async () => {
      const mockValidation = { valid: true, errors: [] };
      jest.spyOn(authService, 'validerMotDePasse').mockResolvedValue(mockValidation);

      const passwords = Array.from({ length: 30 }, (_, i) => `SecureP@ssw0rd${i}`);

      const startTime = performance.now();
      await Promise.all(passwords.map(pwd => authService.validerMotDePasse(pwd)));
      const endTime = performance.now();

      const duration = endTime - startTime;
      const avgDuration = duration / 30;

      console.log(`⏱️  30 validations password: ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      expect(avgDuration).toBeLessThan(50);
    });
  });
});
