/**
 * Tests unitaires pour le service Inscriptions
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('InscriptionsService - Tests Unitaires', () => {
  let inscriptionsService: any;
  let inscriptionsQueries: any;
  let inscriptionsMutations: any;
  let inscriptionsResolvers: any;

  beforeEach(async () => {
    const serviceModule = await import('../inscriptions.service.js');
    inscriptionsService = serviceModule.inscriptionsService;

    const resolversModule = await import('../inscriptions.resolvers.js');
    inscriptionsResolvers = resolversModule.inscriptionsResolvers;
    inscriptionsQueries = resolversModule.inscriptionsQueries;
    inscriptionsMutations = resolversModule.inscriptionsMutations;
  });

  describe('Structure du service', () => {
    it('devrait exporter la classe InscriptionsService et une instance', () => {
      expect(inscriptionsService).toBeDefined();
      expect(inscriptionsService.constructor.name).toBe('InscriptionsService');
    });

    it('devrait avoir toutes les méthodes requises', () => {
      // Queries
      expect(typeof inscriptionsService.obtenirToutesLesInscriptions).toBe('function');
      expect(typeof inscriptionsService.obtenirInscriptionParId).toBe('function');
      expect(typeof inscriptionsService.obtenirInscriptionsParUtilisateur).toBe('function');
      expect(typeof inscriptionsService.obtenirInscriptionsParCours).toBe('function');
      expect(typeof inscriptionsService.obtenirInscriptionsActives).toBe('function');

      // Mutations
      expect(typeof inscriptionsService.creerInscription).toBe('function');
      expect(typeof inscriptionsService.modifierInscription).toBe('function');
      expect(typeof inscriptionsService.supprimerInscription).toBe('function');
      expect(typeof inscriptionsService.annulerInscription).toBe('function');
      expect(typeof inscriptionsService.activerInscription).toBe('function');

      // Validation
      expect(typeof inscriptionsService.verifierDisponibilite).toBe('function');
      expect(typeof inscriptionsService.compterInscriptionsCours).toBe('function');
      expect(typeof inscriptionsService.verifierCoursComplet).toBe('function');

      // Statistiques
      expect(typeof inscriptionsService.obtenirStatistiques).toBe('function');
      expect(typeof inscriptionsService.obtenirInscriptionsParPeriode).toBe('function');
    });
  });

  describe('Core modules - Exports individuels', () => {
    it('devrait exporter les fonctions du module inscriptions', async () => {
      const coreInscriptions = await import('../core/inscriptions/index.js');
      
      expect(typeof coreInscriptions.obtenirToutesLesInscriptions).toBe('function');
      expect(typeof coreInscriptions.obtenirInscriptionParId).toBe('function');
      expect(typeof coreInscriptions.obtenirInscriptionsParUtilisateur).toBe('function');
      expect(typeof coreInscriptions.obtenirInscriptionsParCours).toBe('function');
      expect(typeof coreInscriptions.obtenirInscriptionsActives).toBe('function');
      expect(typeof coreInscriptions.creerInscription).toBe('function');
      expect(typeof coreInscriptions.modifierInscription).toBe('function');
      expect(typeof coreInscriptions.supprimerInscription).toBe('function');
      expect(typeof coreInscriptions.annulerInscription).toBe('function');
      expect(typeof coreInscriptions.activerInscription).toBe('function');
    });

    it('devrait exporter les fonctions du module validation', async () => {
      const coreValidation = await import('../core/validation/index.js');
      
      expect(typeof coreValidation.verifierDisponibiliteInscription).toBe('function');
      expect(typeof coreValidation.compterInscriptionsCours).toBe('function');
      expect(typeof coreValidation.verifierCoursComplet).toBe('function');
    });

    it('devrait exporter les fonctions du module statistiques', async () => {
      const coreStats = await import('../core/statistiques/index.js');
      
      expect(typeof coreStats.obtenirStatistiquesInscriptions).toBe('function');
      expect(typeof coreStats.obtenirInscriptionsParPeriode).toBe('function');
    });
  });

  describe('GraphQL Resolvers - Structure', () => {
    it('devrait avoir la structure correcte des resolvers', () => {
      expect(inscriptionsResolvers).toBeDefined();
      expect(inscriptionsResolvers.Query).toBeDefined();
      expect(inscriptionsResolvers.Mutation).toBeDefined();
    });

    it('devrait avoir toutes les queries', () => {
      expect(typeof inscriptionsQueries.obtenirToutesLesInscriptions).toBe('function');
      expect(typeof inscriptionsQueries.obtenirInscriptionParId).toBe('function');
      expect(typeof inscriptionsQueries.obtenirInscriptionsParUtilisateur).toBe('function');
      expect(typeof inscriptionsQueries.obtenirInscriptionsParCours).toBe('function');
      expect(typeof inscriptionsQueries.obtenirInscriptionsActives).toBe('function');
      expect(typeof inscriptionsQueries.verifierDisponibiliteInscription).toBe('function');
      expect(typeof inscriptionsQueries.compterInscriptionsCours).toBe('function');
      expect(typeof inscriptionsQueries.verifierCoursComplet).toBe('function');
      expect(typeof inscriptionsQueries.obtenirStatistiquesInscriptions).toBe('function');
      expect(typeof inscriptionsQueries.obtenirInscriptionsParPeriode).toBe('function');
    });

    it('devrait avoir toutes les mutations', () => {
      expect(typeof inscriptionsMutations.creerInscription).toBe('function');
      expect(typeof inscriptionsMutations.modifierInscription).toBe('function');
      expect(typeof inscriptionsMutations.supprimerInscription).toBe('function');
      expect(typeof inscriptionsMutations.annulerInscription).toBe('function');
      expect(typeof inscriptionsMutations.activerInscription).toBe('function');
    });
  });

  describe('Isolation et indépendance', () => {
    it('devrait pouvoir importer chaque module core indépendamment', async () => {
      const coreInscriptions = await import('../core/inscriptions/queries.js');
      const coreMutations = await import('../core/inscriptions/mutations.js');
      const coreValidation = await import('../core/validation/queries.js');
      const coreStats = await import('../core/statistiques/queries.js');

      expect(coreInscriptions).toBeDefined();
      expect(coreMutations).toBeDefined();
      expect(coreValidation).toBeDefined();
      expect(coreStats).toBeDefined();
    });

    it('devrait maintenir une instance singleton du service', async () => {
      const { inscriptionsService: instance1 } = await import('../inscriptions.service.js');
      const { inscriptionsService: instance2 } = await import('../inscriptions.service.js');

      expect(instance1).toBe(instance2);
    });
  });
});
