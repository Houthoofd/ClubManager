/**
 * Tests de validation des inputs pour les resolvers GraphQL Alertes
 * Vérifie la gestion des données invalides, manquantes ou limites
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { alertesService } from '../../../services/alertes/alertes.service.js';
import { alertesResolvers } from '../../../services/alertes/alertes.resolvers.js';

describe('Alertes Resolvers GraphQL - Validation des inputs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.alertesUtilisateur - validation', () => {
    it('devrait gérer un ID utilisateur invalide (négatif)', async () => {
      jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockResolvedValue([]);

      const result = await alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: -1 });

      expect(result).toEqual([]);
    });

    it('devrait gérer un ID utilisateur à 0', async () => {
      jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockResolvedValue([]);

      const result = await alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: 0 });

      expect(result).toEqual([]);
    });

    it('devrait gérer un très grand ID utilisateur', async () => {
      jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockResolvedValue([]);

      const result = await alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: 999999999 });

      expect(result).toEqual([]);
    });
  });

  describe('Mutation.resoudreAlerte - validation', () => {
    it('devrait rejeter un alerteId négatif', async () => {
      const input = {
        alerteId: -1,
        effectuePar: 10,
        commentaire: 'Test'
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockRejectedValue(
        new Error('ID de l\'alerte invalide')
      );

      await expect(alertesResolvers.Mutation.resoudreAlerte({}, { input }))
        .rejects.toThrow('ID de l\'alerte invalide');
    });

    it('devrait rejeter un alerteId à 0', async () => {
      const input = {
        alerteId: 0,
        effectuePar: 10,
        commentaire: 'Test'
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockRejectedValue(
        new Error('ID de l\'alerte invalide')
      );

      await expect(alertesResolvers.Mutation.resoudreAlerte({}, { input }))
        .rejects.toThrow('ID de l\'alerte invalide');
    });

    it('devrait rejeter un effectuePar négatif', async () => {
      const input = {
        alerteId: 1,
        effectuePar: -1,
        commentaire: 'Test'
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockRejectedValue(
        new Error('L\'ID de l\'utilisateur effectuant la résolution est requis')
      );

      await expect(alertesResolvers.Mutation.resoudreAlerte({}, { input }))
        .rejects.toThrow('L\'ID de l\'utilisateur effectuant la résolution est requis');
    });

    it('devrait rejeter un effectuePar à 0', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 0,
        commentaire: 'Test'
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockRejectedValue(
        new Error('L\'ID de l\'utilisateur effectuant la résolution est requis')
      );

      await expect(alertesResolvers.Mutation.resoudreAlerte({}, { input }))
        .rejects.toThrow('L\'ID de l\'utilisateur effectuant la résolution est requis');
    });

    it('devrait gérer un commentaire vide', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 10,
        commentaire: ''
      };

      const mockResult = {
        success: true,
        alerte: { id: 1, statut: 'RESOLUE' }
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockResolvedValue(mockResult as any);

      const result = await alertesResolvers.Mutation.resoudreAlerte({}, { input });

      expect(result.success).toBe(true);
    });

    it('devrait gérer un commentaire très long', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 10,
        commentaire: 'a'.repeat(5000)
      };

      const mockResult = {
        success: true,
        alerte: { id: 1, statut: 'RESOLUE' }
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockResolvedValue(mockResult as any);

      const result = await alertesResolvers.Mutation.resoudreAlerte({}, { input });

      expect(result.success).toBe(true);
    });
  });

  describe('Mutation.ignorerAlerte - validation', () => {
    it('devrait rejeter un alerteId négatif', async () => {
      const input = {
        alerteId: -1,
        effectuePar: 10,
        raison: 'Test'
      };

      jest.spyOn(alertesService, 'ignorerAlerte').mockRejectedValue(
        new Error('ID de l\'alerte invalide')
      );

      await expect(alertesResolvers.Mutation.ignorerAlerte({}, { input }))
        .rejects.toThrow('ID de l\'alerte invalide');
    });

    it('devrait rejeter un effectuePar invalide', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 0,
        raison: 'Test'
      };

      jest.spyOn(alertesService, 'ignorerAlerte').mockRejectedValue(
        new Error('L\'ID de l\'utilisateur est requis')
      );

      await expect(alertesResolvers.Mutation.ignorerAlerte({}, { input }))
        .rejects.toThrow('L\'ID de l\'utilisateur est requis');
    });

    it('devrait gérer une raison vide', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 10,
        raison: ''
      };

      const mockResult = {
        success: true,
        alerte: { id: 1, statut: 'IGNOREE' }
      };

      jest.spyOn(alertesService, 'ignorerAlerte').mockResolvedValue(mockResult as any);

      const result = await alertesResolvers.Mutation.ignorerAlerte({}, { input });

      expect(result.success).toBe(true);
    });
  });
});
