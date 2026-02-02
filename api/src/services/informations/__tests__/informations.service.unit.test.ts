/**
 * Tests unitaires pour le service Informations
 * Vérifie la structure et l'isolation des modules
 */

import { describe, it, expect } from '@jest/globals';

describe('InformationsService - Tests Unitaires', () => {
  describe('Structure du module principal', () => {
    it('devrait exporter la classe InformationsService et une instance', async () => {
      const { InformationsService, informationsService } = await import('../informations.service.js');

      expect(InformationsService).toBeDefined();
      expect(typeof InformationsService).toBe('function');
      expect(informationsService).toBeInstanceOf(InformationsService);
    });

    it('devrait avoir toutes les méthodes requises', async () => {
      const { informationsService } = await import('../informations.service.js');

      // Queries Informations
      expect(typeof informationsService.obtenirToutesLesInformations).toBe('function');
      expect(typeof informationsService.obtenirInformationParId).toBe('function');

      // Mutations Informations
      expect(typeof informationsService.ajouterInformation).toBe('function');
      expect(typeof informationsService.modifierInformation).toBe('function');
      expect(typeof informationsService.supprimerInformation).toBe('function');

      // Queries Référentiels
      expect(typeof informationsService.obtenirLesStatus).toBe('function');
      expect(typeof informationsService.obtenirLesPlansTarifaires).toBe('function');
      expect(typeof informationsService.obtenirLesGenres).toBe('function');
      expect(typeof informationsService.obtenirLesGrades).toBe('function');
    });
  });

  describe('Core modules - Exports individuels', () => {
    it('devrait exporter les fonctions du module informations', async () => {
      const informationsModule = await import('../core/informations/index.js');

      expect(typeof informationsModule.obtenirToutesLesInformations).toBe('function');
      expect(typeof informationsModule.obtenirInformationParId).toBe('function');
      expect(typeof informationsModule.ajouterInformation).toBe('function');
      expect(typeof informationsModule.modifierInformation).toBe('function');
      expect(typeof informationsModule.supprimerInformation).toBe('function');
    });

    it('devrait exporter les fonctions du module référentiels', async () => {
      const referentielsModule = await import('../core/referentiels/index.js');

      expect(typeof referentielsModule.obtenirLesStatus).toBe('function');
      expect(typeof referentielsModule.obtenirLesPlansTarifaires).toBe('function');
      expect(typeof referentielsModule.obtenirLesGenres).toBe('function');
      expect(typeof referentielsModule.obtenirLesGrades).toBe('function');
    });
  });

  describe('GraphQL Resolvers - Structure', () => {
    it('devrait avoir la structure correcte des resolvers', async () => {
      const { informationsResolvers } = await import('../informations.resolvers.js');

      expect(informationsResolvers).toBeDefined();
      expect(informationsResolvers.Query).toBeDefined();
      expect(informationsResolvers.Mutation).toBeDefined();

      // Queries
      expect(typeof informationsResolvers.Query.obtenirToutesLesInformations).toBe('function');
      expect(typeof informationsResolvers.Query.obtenirInformationParId).toBe('function');
      expect(typeof informationsResolvers.Query.obtenirLesStatus).toBe('function');
      expect(typeof informationsResolvers.Query.obtenirLesPlansTarifaires).toBe('function');
      expect(typeof informationsResolvers.Query.obtenirLesGenres).toBe('function');
      expect(typeof informationsResolvers.Query.obtenirLesGrades).toBe('function');

      // Mutations
      expect(typeof informationsResolvers.Mutation.ajouterInformation).toBe('function');
      expect(typeof informationsResolvers.Mutation.modifierInformation).toBe('function');
      expect(typeof informationsResolvers.Mutation.supprimerInformation).toBe('function');
    });
  });

  describe('Isolation et indépendance', () => {
    it('devrait pouvoir importer chaque module core indépendamment', async () => {
      const [informationsModule, referentielsModule] = await Promise.all([
        import('../core/informations/index.js'),
        import('../core/referentiels/index.js'),
      ]);

      expect(informationsModule).toBeDefined();
      expect(referentielsModule).toBeDefined();
    });

    it('devrait maintenir une instance singleton du service', async () => {
      const { informationsService: instance1 } = await import('../informations.service.js');
      const { informationsService: instance2 } = await import('../informations.service.js');

      expect(instance1).toBe(instance2);
    });
  });
});
