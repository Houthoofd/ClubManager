/**
 * Tests unitaires du service Commandes
 * 
 * Ces tests vérifient la structure et l'isolation du service
 */

import { describe, it, expect } from '@jest/globals';
import { CommandesService, commandesService } from '../commandes.service.js';
import { commandesResolvers } from '../commandes.resolvers.js';

describe('Service Commandes - Tests unitaires', () => {
  describe('Structure du service', () => {
    it('devrait exporter une classe CommandesService', () => {
      expect(CommandesService).toBeDefined();
      expect(typeof CommandesService).toBe('function');
    });

    it('devrait exporter une instance commandesService', () => {
      expect(commandesService).toBeDefined();
      expect(commandesService).toBeInstanceOf(CommandesService);
    });

    it('devrait avoir toutes les méthodes de query', () => {
      expect(typeof commandesService.obtenirToutesCommandes).toBe('function');
      expect(typeof commandesService.obtenirCommandeParId).toBe('function');
      expect(typeof commandesService.obtenirCommandesUtilisateur).toBe('function');
      expect(typeof commandesService.obtenirCommandesParStatut).toBe('function');
    });

    it('devrait avoir toutes les méthodes de mutation', () => {
      expect(typeof commandesService.creerCommande).toBe('function');
      expect(typeof commandesService.modifierCommande).toBe('function');
      expect(typeof commandesService.modifierStatutCommande).toBe('function');
      expect(typeof commandesService.supprimerCommande).toBe('function');
    });

    it('devrait avoir toutes les méthodes de statistiques', () => {
      expect(typeof commandesService.obtenirStatistiques).toBe('function');
      expect(typeof commandesService.compterParStatut).toBe('function');
    });

    it('devrait avoir la méthode de recherche', () => {
      expect(typeof commandesService.rechercherCommandes).toBe('function');
    });
  });

  describe('Modules core', () => {
    it('devrait pouvoir importer le module queries', async () => {
      const queriesModule = await import('../core/queries.js');
      expect(queriesModule.obtenirToutesCommandes).toBeDefined();
      expect(queriesModule.obtenirCommandeParId).toBeDefined();
      expect(queriesModule.obtenirCommandesUtilisateur).toBeDefined();
      expect(queriesModule.obtenirCommandesParStatut).toBeDefined();
      expect(queriesModule.compterCommandesParStatut).toBeDefined();
    });

    it('devrait pouvoir importer le module mutations', async () => {
      const mutationsModule = await import('../core/mutations.js');
      expect(mutationsModule.creerCommande).toBeDefined();
      expect(mutationsModule.modifierCommande).toBeDefined();
      expect(mutationsModule.modifierStatutCommande).toBeDefined();
      expect(mutationsModule.supprimerCommande).toBeDefined();
    });

    it('devrait pouvoir importer le module stats', async () => {
      const statsModule = await import('../core/stats.js');
      expect(statsModule.obtenirStatistiquesCommandes).toBeDefined();
      expect(statsModule.obtenirComptesParStatut).toBeDefined();
    });

    it('devrait pouvoir importer le module search', async () => {
      const searchModule = await import('../core/search.js');
      expect(searchModule.rechercherCommandes).toBeDefined();
    });
  });

  describe('GraphQL Resolvers', () => {
    it('devrait avoir les queries GraphQL', () => {
      expect(commandesResolvers.Query).toBeDefined();
      expect(typeof commandesResolvers.Query.commandes).toBe('function');
      expect(typeof commandesResolvers.Query.commande).toBe('function');
      expect(typeof commandesResolvers.Query.commandesUtilisateur).toBe('function');
      expect(typeof commandesResolvers.Query.commandesParStatut).toBe('function');
      expect(typeof commandesResolvers.Query.statistiquesCommandes).toBe('function');
      expect(typeof commandesResolvers.Query.comptesCommandesParStatut).toBe('function');
      expect(typeof commandesResolvers.Query.rechercherCommandes).toBe('function');
    });

    it('devrait avoir les mutations GraphQL', () => {
      expect(commandesResolvers.Mutation).toBeDefined();
      expect(typeof commandesResolvers.Mutation.creerCommande).toBe('function');
      expect(typeof commandesResolvers.Mutation.modifierCommande).toBe('function');
      expect(typeof commandesResolvers.Mutation.modifierStatutCommande).toBe('function');
      expect(typeof commandesResolvers.Mutation.supprimerCommande).toBe('function');
    });
  });

  describe('Isolation du service', () => {
    it('devrait pouvoir créer plusieurs instances indépendantes', () => {
      const instance1 = new CommandesService();
      const instance2 = new CommandesService();
      
      expect(instance1).not.toBe(instance2);
      expect(instance1).toBeInstanceOf(CommandesService);
      expect(instance2).toBeInstanceOf(CommandesService);
    });

    it("devrait partager l'instance globale", () => {
      expect(commandesService).toBe(commandesService);
    });
  });
});
