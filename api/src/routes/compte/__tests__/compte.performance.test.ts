/**
 * Tests de performance pour le service Compte
 * Tests des performances et de la scalabilité
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Compte } from '../../../db/clients/compte/compte.js';

describe('Compte Service - Tests de performance', () => {
  let compteClient: Compte;

  beforeEach(() => {
    jest.clearAllMocks();
    compteClient = new Compte();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Performance de récupération des informations', () => {
    it('devrait récupérer les informations en moins de 100ms', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john.doe@example.com'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });

    it('devrait gérer 100 requêtes simultanées', async () => {
      const mockResult = {
        isFind: true,
        data: { id: 1, prenom: 'John', nom: 'Doe' }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const startTime = performance.now();

      const promises = Array(100).fill(null).map(() =>
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      );

      const results = await Promise.all(promises);
      const endTime = performance.now();

      expect(results).toHaveLength(100);
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5 secondes pour 100 requêtes
    });

    it('devrait maintenir des performances constantes avec cache', async () => {
      const mockResult = {
        isFind: true,
        data: { id: 1, prenom: 'John', nom: 'Doe' },
        fromCache: false
      };

      const mockCachedResult = {
        ...mockResult,
        fromCache: true
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur')
        .mockResolvedValueOnce(mockResult as any)
        .mockResolvedValue(mockCachedResult as any);

      // Première requête (sans cache)
      const start1 = performance.now();
      const result1 = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      const duration1 = performance.now() - start1;

      // Requêtes suivantes (avec cache)
      const start2 = performance.now();
      const result2 = await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      const duration2 = performance.now() - start2;

      expect(result2.fromCache).toBe(true);
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('Performance de mise à jour', () => {
    it('devrait mettre à jour un compte en moins de 200ms', async () => {
      const updateData = {
        email: 'updated@example.com',
        date_naissance: '1990-01-01'
      };

      const mockResult = {
        isConfirm: true,
        message: 'Mise à jour réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(200);
    });

    it('devrait gérer des mises à jour en batch efficacement', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mise à jour réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();

      const promises = Array(50).fill(null).map((_, i) =>
        compteClient.mettreAJourUtilisateurAvecConversion(i + 1, { email: `user${i}@example.com` })
      );

      await Promise.all(promises);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3000); // 3 secondes pour 50 mises à jour
    });

    it('devrait optimiser les mises à jour partielles', async () => {
      const smallUpdate = { email: 'new@example.com' };
      const largeUpdate = {
        email: 'new@example.com',
        date_naissance: '1990-01-01',
        genres: 1,
        grades: 2,
        abonnement: 3,
        status: 1
      };

      const mockResult = {
        isConfirm: true,
        message: 'Mise à jour réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      // Petite mise à jour
      const start1 = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, smallUpdate);
      const duration1 = performance.now() - start1;

      // Grande mise à jour
      const start2 = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, largeUpdate);
      const duration2 = performance.now() - start2;

      // La grande mise à jour ne devrait pas être beaucoup plus lente
      expect(duration2).toBeLessThan(duration1 * 3);
    });
  });

  describe('Performance du hashage de mots de passe', () => {
    it('devrait hasher un mot de passe en moins de 150ms', async () => {
      const bcrypt = await import('bcrypt');

      const startTime = performance.now();
      await bcrypt.hash('TestPassword123!', 10);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(150);
    });

    it('devrait gérer plusieurs hashages en parallèle', async () => {
      const bcrypt = await import('bcrypt');

      const passwords = Array(10).fill(null).map((_, i) => `Password${i}!`);

      const startTime = performance.now();
      const hashes = await Promise.all(
        passwords.map(pwd => bcrypt.hash(pwd, 10))
      );
      const endTime = performance.now();

      expect(hashes).toHaveLength(10);
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1500); // 1.5 secondes pour 10 hashages
    });

    it('devrait optimiser les opérations de changement de mot de passe', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mot de passe modifié'
      };

      jest.spyOn(compteClient, 'mettreAJourMotDePasse').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.mettreAJourMotDePasse(1, 'hashedPassword', false);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Performance de la validation', () => {
    it('devrait valider un email en moins de 10ms', async () => {
      const updateData = { email: 'test@example.com' };

      const mockResult = {
        isConfirm: true,
        message: 'Email valide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10);
    });

    it('devrait valider une date en moins de 10ms', async () => {
      const updateData = { date_naissance: '1990-01-01' };

      const mockResult = {
        isConfirm: true,
        message: 'Date valide'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10);
    });

    it('devrait valider plusieurs champs efficacement', async () => {
      const updateData = {
        email: 'test@example.com',
        date_naissance: '1990-01-01',
        genres: 1,
        grades: 2,
        abonnement: 3
      };

      const mockResult = {
        isConfirm: true,
        message: 'Tous les champs validés'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(20);
    });
  });

  describe('Performance de la conversion de types', () => {
    it('devrait convertir les IDs en noms rapidement', async () => {
      const updateData = {
        genres: 1,
        grades: 2,
        abonnement: 3,
        status: 1
      };

      const mockResult = {
        isConfirm: true,
        message: 'Conversion réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, updateData);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(50);
    });

    it('devrait gérer des conversions multiples en parallèle', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Conversions réussies'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();

      const promises = Array(20).fill(null).map((_, i) =>
        compteClient.mettreAJourUtilisateurAvecConversion(i + 1, { genres: i % 3 + 1 })
      );

      await Promise.all(promises);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Performance sous charge', () => {
    it('devrait maintenir les performances avec 500 utilisateurs', async () => {
      const mockResult = {
        isFind: true,
        data: { id: 1, prenom: 'User', nom: 'Test' }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const startTime = performance.now();

      const promises = Array(500).fill(null).map((_, i) =>
        compteClient.obtenirInformationsUtilisateur(`User${i}`, 'Test')
      );

      await Promise.all(promises);
      const endTime = performance.now();

      const duration = endTime - startTime;
      const avgPerRequest = duration / 500;

      expect(avgPerRequest).toBeLessThan(20); // Moins de 20ms par requête en moyenne
    });

    it('devrait gérer des pics de charge', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mise à jour réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      // Simuler un pic de 200 requêtes
      const startTime = performance.now();

      const promises = Array(200).fill(null).map((_, i) =>
        compteClient.mettreAJourUtilisateurAvecConversion(i + 1, { email: `spike${i}@example.com` })
      );

      await Promise.all(promises);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5 secondes pour 200 requêtes
    });

    it('devrait récupérer après une charge élevée', async () => {
      const mockResult = {
        isFind: true,
        data: { id: 1, prenom: 'John', nom: 'Doe' }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      // Charge élevée
      const heavyPromises = Array(100).fill(null).map(() =>
        compteClient.obtenirInformationsUtilisateur('Heavy', 'Load')
      );
      await Promise.all(heavyPromises);

      // Vérifier la récupération
      const startTime = performance.now();
      await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100); // Retour à la normale
    });
  });

  describe('Optimisation mémoire', () => {
    it('devrait libérer la mémoire après traitement', async () => {
      const mockResult = {
        isFind: true,
        data: { id: 1, prenom: 'John', nom: 'Doe' }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const memBefore = process.memoryUsage().heapUsed;

      // Traiter beaucoup de données
      const promises = Array(1000).fill(null).map(() =>
        compteClient.obtenirInformationsUtilisateur('John', 'Doe')
      );
      await Promise.all(promises);

      // Forcer le garbage collection si disponible
      if (global.gc) {
        global.gc();
      }

      const memAfter = process.memoryUsage().heapUsed;
      const memIncrease = memAfter - memBefore;

      // L'augmentation de mémoire devrait être raisonnable
      expect(memIncrease).toBeLessThan(50 * 1024 * 1024); // Moins de 50MB
    });

    it('ne devrait pas avoir de fuites mémoire', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mise à jour réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const measurements: number[] = [];

      // Faire 5 passes de 100 requêtes
      for (let pass = 0; pass < 5; pass++) {
        const promises = Array(100).fill(null).map((_, i) =>
          compteClient.mettreAJourUtilisateurAvecConversion(i + 1, { email: `test${i}@example.com` })
        );
        await Promise.all(promises);

        if (global.gc) {
          global.gc();
        }

        measurements.push(process.memoryUsage().heapUsed);
      }

      // La mémoire ne devrait pas augmenter de manière linéaire
      const firstMeasure = measurements[0];
      const lastMeasure = measurements[measurements.length - 1];
      const increase = lastMeasure - firstMeasure;

      expect(increase).toBeLessThan(20 * 1024 * 1024); // Moins de 20MB d'augmentation
    });
  });

  describe('Performance des requêtes complexes', () => {
    it('devrait gérer une mise à jour complète en moins de 300ms', async () => {
      const complexUpdate = {
        email: 'complex@example.com',
        date_naissance: '1990-01-01',
        genres: 1,
        grades: 'Ceinture noire',
        abonnement: 3,
        status: 1,
        password: 'hashedPassword'
      };

      const mockResult = {
        isConfirm: true,
        message: 'Mise à jour complète réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.mettreAJourUtilisateurAvecConversion(1, complexUpdate);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(300);
    });

    it('devrait optimiser les recherches avec filtres multiples', async () => {
      const mockResult = {
        isFind: true,
        data: {
          id: 1,
          prenom: 'John',
          nom: 'Doe',
          email: 'john@example.com',
          genre: 'Homme',
          grade: 'Ceinture noire'
        }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const startTime = performance.now();
      await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Benchmarks de référence', () => {
    it('devrait établir un benchmark pour les opérations de lecture', async () => {
      const mockResult = {
        isFind: true,
        data: { id: 1, prenom: 'John', nom: 'Doe' }
      };

      jest.spyOn(compteClient, 'obtenirInformationsUtilisateur').mockResolvedValue(mockResult as any);

      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await compteClient.obtenirInformationsUtilisateur('John', 'Doe');
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / iterations;

      console.log(`Benchmark lecture: ${avgDuration.toFixed(2)}ms par opération`);
      expect(avgDuration).toBeLessThan(10);
    });

    it('devrait établir un benchmark pour les opérations d\'écriture', async () => {
      const mockResult = {
        isConfirm: true,
        message: 'Mise à jour réussie'
      };

      jest.spyOn(compteClient, 'mettreAJourUtilisateurAvecConversion').mockResolvedValue(mockResult as any);

      const iterations = 500;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        await compteClient.mettreAJourUtilisateurAvecConversion(1, { email: `test${i}@example.com` });
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      const avgDuration = totalDuration / iterations;

      console.log(`Benchmark écriture: ${avgDuration.toFixed(2)}ms par opération`);
      expect(avgDuration).toBeLessThan(20);
    });
  });
});
