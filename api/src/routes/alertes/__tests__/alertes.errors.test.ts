/**
 * Tests de gestion d'erreurs pour les resolvers GraphQL Alertes
 * Vérifie la robustesse face aux erreurs DB, ressources inexistantes, conflits métier
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { alertesService } from '../core/services/alertes.service.js';
import { alertesResolvers } from '../core/resolvers/alertes.resolvers.js';

describe('Alertes Resolvers GraphQL - Gestion des erreurs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Erreurs base de données', () => {
    it('dashboardAlertes - devrait gérer une erreur de timeout', async () => {
      jest.spyOn(alertesService, 'obtenirDashboardAlertes').mockRejectedValue(
        new Error('Connection timeout')
      );

      await expect(alertesResolvers.Query.dashboardAlertes())
        .rejects.toThrow('Connection timeout');
    });

    it('alertesActives - devrait gérer une erreur de connexion', async () => {
      jest.spyOn(alertesService, 'obtenirAlertesActives').mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(alertesResolvers.Query.alertesActives())
        .rejects.toThrow('Database connection failed');
    });

    it('alertesUtilisateur - devrait gérer une erreur de requête SQL', async () => {
      jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockRejectedValue(
        new Error('SQL syntax error')
      );

      await expect(alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: 123 }))
        .rejects.toThrow('SQL syntax error');
    });
  });

  describe('Ressources inexistantes', () => {
    it('resoudreAlerte - devrait gérer une alerte inexistante', async () => {
      const input = {
        alerteId: 99999,
        effectuePar: 10,
        commentaire: 'Test'
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockRejectedValue(
        new Error('Alerte introuvable')
      );

      await expect(alertesResolvers.Mutation.resoudreAlerte({}, { input }))
        .rejects.toThrow('Alerte introuvable');
    });

    it('ignorerAlerte - devrait gérer une alerte inexistante', async () => {
      const input = {
        alerteId: 99999,
        effectuePar: 10,
        raison: 'Test'
      };

      jest.spyOn(alertesService, 'ignorerAlerte').mockRejectedValue(
        new Error('Alerte introuvable')
      );

      await expect(alertesResolvers.Mutation.ignorerAlerte({}, { input }))
        .rejects.toThrow('Alerte introuvable');
    });

    it('alertesUtilisateur - devrait retourner un tableau vide pour utilisateur inexistant', async () => {
      jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockResolvedValue([]);

      const result = await alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: 99999 });

      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('Conflits métier', () => {
    it('resoudreAlerte - devrait gérer une alerte déjà résolue', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 10,
        commentaire: 'Test'
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockRejectedValue(
        new Error('L\'alerte est déjà résolue')
      );

      await expect(alertesResolvers.Mutation.resoudreAlerte({}, { input }))
        .rejects.toThrow('L\'alerte est déjà résolue');
    });

    it('ignorerAlerte - devrait gérer une alerte déjà ignorée', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 10,
        raison: 'Test'
      };

      jest.spyOn(alertesService, 'ignorerAlerte').mockRejectedValue(
        new Error('L\'alerte est déjà ignorée')
      );

      await expect(alertesResolvers.Mutation.ignorerAlerte({}, { input }))
        .rejects.toThrow('L\'alerte est déjà ignorée');
    });

    it('resoudreAlerte - devrait gérer une alerte ignorée non résolvable', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 10,
        commentaire: 'Test'
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockRejectedValue(
        new Error('Impossible de résoudre une alerte ignorée')
      );

      await expect(alertesResolvers.Mutation.resoudreAlerte({}, { input }))
        .rejects.toThrow('Impossible de résoudre une alerte ignorée');
    });
  });

  describe('Erreurs inattendues', () => {
    it('dashboardAlertes - devrait gérer une erreur null', async () => {
      jest.spyOn(alertesService, 'obtenirDashboardAlertes').mockRejectedValue(null);

      await expect(alertesResolvers.Query.dashboardAlertes()).rejects.toEqual(null);
    });

    it('detecterAlertes - devrait gérer une erreur système', async () => {
      jest.spyOn(alertesService, 'detecterAlertes').mockRejectedValue(
        new Error('System error: out of memory')
      );

      await expect(alertesResolvers.Mutation.detecterAlertes())
        .rejects.toThrow('System error: out of memory');
    });
  });
});
