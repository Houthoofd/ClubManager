/**
 * Tests unitaires du service Compte
 * 
 * Ces tests vérifient la structure et l'isolation du service
 */

import { describe, it, expect } from '@jest/globals';
import { CompteService, compteService } from '../compte.service.js';
import { compteResolvers } from '../compte.resolvers.js';

describe('Service Compte - Tests unitaires', () => {
  describe('Structure du service', () => {
    it('devrait exporter une classe CompteService', () => {
      expect(CompteService).toBeDefined();
      expect(typeof CompteService).toBe('function');
    });

    it('devrait exporter une instance compteService', () => {
      expect(compteService).toBeDefined();
      expect(compteService).toBeInstanceOf(CompteService);
    });

    it('devrait avoir toutes les méthodes de query', () => {
      expect(typeof compteService.obtenirCompteParId).toBe('function');
      expect(typeof compteService.obtenirCompteParNomPrenom).toBe('function');
      expect(typeof compteService.obtenirInformationsCompte).toBe('function');
    });

    it('devrait avoir toutes les méthodes de mutation', () => {
      expect(typeof compteService.modifierCompte).toBe('function');
      expect(typeof compteService.modifierCompteAvecConversion).toBe('function');
      expect(typeof compteService.supprimerCompte).toBe('function');
      expect(typeof compteService.mettreAJourMotDePasse).toBe('function');
    });

    it('devrait avoir toutes les méthodes de conversion', () => {
      expect(typeof compteService.obtenirIdGenre).toBe('function');
      expect(typeof compteService.obtenirIdGrade).toBe('function');
      expect(typeof compteService.obtenirIdStatus).toBe('function');
      expect(typeof compteService.obtenirIdAbonnement).toBe('function');
      expect(typeof compteService.convertirNomsEnIds).toBe('function');
    });
  });

  describe('Modules core', () => {
    it('devrait pouvoir importer le module queries', async () => {
      const queriesModule = await import('../core/queries.js');
      expect(queriesModule.obtenirCompteParId).toBeDefined();
      expect(queriesModule.obtenirCompteParNomPrenom).toBeDefined();
      expect(queriesModule.obtenirInformationsCompte).toBeDefined();
    });

    it('devrait pouvoir importer le module mutations', async () => {
      const mutationsModule = await import('../core/mutations.js');
      expect(mutationsModule.modifierCompte).toBeDefined();
      expect(mutationsModule.supprimerCompte).toBeDefined();
      expect(mutationsModule.mettreAJourMotDePasse).toBeDefined();
    });

    it('devrait pouvoir importer le module conversions', async () => {
      const conversionsModule = await import('../core/conversions.js');
      expect(conversionsModule.obtenirIdGenreParNom).toBeDefined();
      expect(conversionsModule.obtenirIdGradeParNom).toBeDefined();
      expect(conversionsModule.obtenirIdStatusParNom).toBeDefined();
      expect(conversionsModule.obtenirIdAbonnementParNom).toBeDefined();
      expect(conversionsModule.convertirNomsEnIds).toBeDefined();
    });
  });

  describe('GraphQL Resolvers', () => {
    it('devrait avoir les queries GraphQL', () => {
      expect(compteResolvers.Query).toBeDefined();
      expect(typeof compteResolvers.Query.compte).toBe('function');
      expect(typeof compteResolvers.Query.compteParNom).toBe('function');
      expect(typeof compteResolvers.Query.informationsCompte).toBe('function');
    });

    it('devrait avoir les mutations GraphQL', () => {
      expect(compteResolvers.Mutation).toBeDefined();
      expect(typeof compteResolvers.Mutation.modifierCompte).toBe('function');
      expect(typeof compteResolvers.Mutation.modifierCompteAvecConversion).toBe('function');
      expect(typeof compteResolvers.Mutation.supprimerCompte).toBe('function');
      expect(typeof compteResolvers.Mutation.mettreAJourMotDePasse).toBe('function');
    });
  });

  describe('Isolation du service', () => {
    it('devrait pouvoir créer plusieurs instances indépendantes', () => {
      const instance1 = new CompteService();
      const instance2 = new CompteService();
      
      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(CompteService);
      expect(instance2).toBeInstanceOf(CompteService);
    });

    it("devrait partager l'instance globale", () => {
      expect(compteService).toBe(compteService);
    });
  });
});
