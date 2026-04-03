/**
 * Tests des resolvers GraphQL pour le service Statistiques
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { statistiquesResolvers } from '../statistiques.resolvers.js';
import { createMockPrisma } from './statistiques.mock.js';
import { GraphQLError } from 'graphql';

describe('Statistiques Resolvers', () => {
  let resolvers: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    resolvers = statistiquesResolvers(mockPrisma as any);
  });

  describe('Query - statistiquesGenerales', () => {
    it('devrait retourner les statistiques générales', async () => {
      const result = await resolvers.Query.statistiquesGenerales({}, {}, {});
      
      expect(result).toBeDefined();
      expect(result.total_utilisateurs).toBeDefined();
    });

    it('devrait gérer les erreurs de StatistiquesError', async () => {
      mockPrisma.utilisateurs.count.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(resolvers.Query.statistiquesGenerales({}, {}, {})).rejects.toThrow(GraphQLError);
    });
  });

  describe('Query - statistiquesParCours', () => {
    it('devrait retourner les statistiques par cours', async () => {
      const result = await resolvers.Query.statistiquesParCours({}, {}, {});
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait accepter des dates', async () => {
      const result = await resolvers.Query.statistiquesParCours(
        {},
        { dateDebut: '2024-01-01', dateFin: '2024-12-31' },
        {}
      );
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Query - frequentationUtilisateur', () => {
    it('devrait retourner la fréquentation d\'un utilisateur', async () => {
      const result = await resolvers.Query.frequentationUtilisateur({}, { utilisateurId: 1 }, {});
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait rejeter un ID invalide', async () => {
      await expect(
        resolvers.Query.frequentationUtilisateur({}, { utilisateurId: 0 }, {})
      ).rejects.toThrow(GraphQLError);
    });
  });

  describe('Query - progressionUtilisateur', () => {
    it('devrait retourner la progression d\'un utilisateur', async () => {
      const result = await resolvers.Query.progressionUtilisateur({}, { utilisateurId: 1 }, {});
      
      expect(result).toBeDefined();
      expect(result.utilisateur_id).toBe(1);
    });
  });

  describe('Query - statistiquesFinancieres', () => {
    it('devrait retourner les statistiques financières', async () => {
      const result = await resolvers.Query.statistiquesFinancieres({}, {}, {});
      
      expect(result).toBeDefined();
      expect(result.totalPaiementsMois).toBeDefined();
    });
  });

  describe('Query - statistiquesMembres', () => {
    it('devrait retourner les statistiques des membres', async () => {
      const result = await resolvers.Query.statistiquesMembres({}, {}, {});
      
      expect(result).toBeDefined();
      expect(result.nombreMembres).toBeDefined();
    });
  });

  describe('Query - tableauDeBord', () => {
    it('devrait retourner le tableau de bord complet', async () => {
      const result = await resolvers.Query.tableauDeBord({}, {}, {});
      
      expect(result).toBeDefined();
      expect(result.generales).toBeDefined();
      expect(result.financieres).toBeDefined();
      expect(result.membres).toBeDefined();
    });
  });
});
