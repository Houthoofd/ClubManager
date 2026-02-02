/**
 * Tests unitaires du service Alertes
 * Vérifie la structure, les exports et l'isolation des modules
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('AlertesService - Tests Unitaires', () => {
  let alertesService: any;
  let AlertesService: any;

  beforeEach(async () => {
    const module = await import('../alertes.service.js');
    AlertesService = module.AlertesService;
    alertesService = module.alertesService;
  });

  describe('Structure du module principal', () => {
    it('devrait exporter la classe AlertesService et une instance', () => {
      expect(AlertesService).toBeDefined();
      expect(alertesService).toBeDefined();
      expect(alertesService).toBeInstanceOf(AlertesService);
    });

    it('devrait avoir toutes les méthodes requises', () => {
      expect(typeof alertesService.obtenirDashboardAlertes).toBe('function');
      expect(typeof alertesService.obtenirStatistiquesAlertes).toBe('function');
      expect(typeof alertesService.obtenirAlertesActives).toBe('function');
      expect(typeof alertesService.obtenirAlertesUtilisateur).toBe('function');
      expect(typeof alertesService.resoudreAlerte).toBe('function');
      expect(typeof alertesService.ignorerAlerte).toBe('function');
      expect(typeof alertesService.creerAlerte).toBe('function');
      expect(typeof alertesService.detecterAlertes).toBe('function');
    });
  });

  describe('Core modules - Exports individuels', () => {
    it('devrait exporter les fonctions du module stats', async () => {
      const stats = await import('../core/stats/index.js');
      expect(typeof stats.obtenirDashboardAlertes).toBe('function');
      expect(typeof stats.obtenirStatistiquesAlertes).toBe('function');
    });

    it('devrait exporter les fonctions du module queries', async () => {
      const queries = await import('../core/queries/index.js');
      expect(typeof queries.obtenirAlertesActives).toBe('function');
      expect(typeof queries.obtenirAlertesUtilisateur).toBe('function');
    });

    it('devrait exporter les fonctions du module mutations', async () => {
      const mutations = await import('../core/mutations/index.js');
      expect(typeof mutations.resoudreAlerte).toBe('function');
      expect(typeof mutations.ignorerAlerte).toBe('function');
      expect(typeof mutations.creerAlerte).toBe('function');
    });

    it('devrait exporter les fonctions du module detection', async () => {
      const detection = await import('../core/detection/index.js');
      expect(typeof detection.detecterAlertes).toBe('function');
    });
  });

  describe('GraphQL Resolvers - Structure', () => {
    it('devrait avoir la structure correcte des resolvers', async () => {
      const { alertesResolvers } = await import('../alertes.resolvers.js');
      
      expect(alertesResolvers).toBeDefined();
      expect(alertesResolvers.Query).toBeDefined();
      expect(alertesResolvers.Mutation).toBeDefined();
      
      // Vérifier les queries
      expect(typeof alertesResolvers.Query.dashboardAlertes).toBe('function');
      expect(typeof alertesResolvers.Query.alertesActives).toBe('function');
      expect(typeof alertesResolvers.Query.alertesUtilisateur).toBe('function');
      expect(typeof alertesResolvers.Query.statistiquesAlertes).toBe('function');
      
      // Vérifier les mutations
      expect(typeof alertesResolvers.Mutation.detecterAlertes).toBe('function');
      expect(typeof alertesResolvers.Mutation.resoudreAlerte).toBe('function');
      expect(typeof alertesResolvers.Mutation.ignorerAlerte).toBe('function');
      expect(typeof alertesResolvers.Mutation.creerAlerte).toBe('function');
    });

    it('devrait appeler les méthodes du service depuis les resolvers', async () => {
      const { alertesResolvers } = await import('../alertes.resolvers.js');
      
      // Tester un resolver Query
      const dashboardResult = await alertesResolvers.Query.dashboardAlertes();
      expect(dashboardResult).toBeDefined();
      expect(dashboardResult.totalAlertes).toBeDefined();
      
      // Tester un resolver Mutation
      const detectResult = await alertesResolvers.Mutation.detecterAlertes();
      expect(detectResult).toBeDefined();
      expect(detectResult.success).toBe(true);
    });
  });

  describe('Isolation et indépendance', () => {
    it('devrait pouvoir importer chaque module core indépendamment', async () => {
      const [stats, queries, mutations, detection] = await Promise.all([
        import('../core/stats/index.js'),
        import('../core/queries/index.js'),
        import('../core/mutations/index.js'),
        import('../core/detection/index.js'),
      ]);
      
      expect(stats).toBeDefined();
      expect(queries).toBeDefined();
      expect(mutations).toBeDefined();
      expect(detection).toBeDefined();
    });

    it('devrait maintenir une instance singleton du service', async () => {
      const module1 = await import('../alertes.service.js');
      const module2 = await import('../alertes.service.js');
      
      expect(module1.alertesService).toBe(module2.alertesService);
    });
  });
});
