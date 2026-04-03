/**
 * Tests de base des resolvers GraphQL pour le service Alertes
 * Tests des fonctionnalités principales (happy path)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { alertesService } from '../../../services/alertes/alertes.service.js';
import { alertesResolvers } from '../../../services/alertes/alertes.resolvers.js';

describe('Alertes Resolvers GraphQL - Tests de base', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.dashboardAlertes', () => {
    it('devrait retourner le dashboard des alertes', async () => {
      const mockDashboard = {
        alertesActives: 5,
        alertesCritiques: 2,
        alertesResolues: 10,
        alertesIgnorees: 3
      };

      jest.spyOn(alertesService, 'obtenirDashboardAlertes').mockResolvedValue(mockDashboard as any);

      const result = await alertesResolvers.Query.dashboardAlertes();

      expect(result).toEqual(mockDashboard);
      expect(alertesService.obtenirDashboardAlertes).toHaveBeenCalledTimes(1);
    });

    it('devrait propager les erreurs du service', async () => {
      jest.spyOn(alertesService, 'obtenirDashboardAlertes').mockRejectedValue(
        new Error('Erreur base de données')
      );

      await expect(alertesResolvers.Query.dashboardAlertes()).rejects.toThrow('Erreur base de données');
    });
  });

  describe('Query.alertesActives', () => {
    it('devrait retourner les alertes actives', async () => {
      const mockAlertes = [
        { id: 1, type: 'INSCRIPTION_INCOMPLETE', severite: 'HAUTE', dateCreation: '2024-01-01' },
        { id: 2, type: 'PAIEMENT_RETARD', severite: 'MOYENNE', dateCreation: '2024-01-02' }
      ];

      jest.spyOn(alertesService, 'obtenirAlertesActives').mockResolvedValue(mockAlertes as any);

      const result = await alertesResolvers.Query.alertesActives();

      expect(result).toEqual(mockAlertes);
      expect(alertesService.obtenirAlertesActives).toHaveBeenCalledTimes(1);
    });
  });

  describe('Query.alertesUtilisateur', () => {
    it('devrait retourner les alertes d\'un utilisateur spécifique', async () => {
      const mockAlertes = [
        { id: 1, utilisateurId: 123, type: 'INSCRIPTION_INCOMPLETE', dateCreation: '2024-01-01' },
        { id: 2, utilisateurId: 123, type: 'PAIEMENT_RETARD', dateCreation: '2024-01-02' }
      ];

      jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockResolvedValue(mockAlertes as any);

      const result = await alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: 123 });

      expect(result).toEqual(mockAlertes);
      expect(alertesService.obtenirAlertesUtilisateur).toHaveBeenCalledWith(123);
    });
  });

  describe('Mutation.detecterAlertes', () => {
    it('devrait déclencher la détection des alertes', async () => {
      const mockResult = {
        success: true,
        alertesCreees: 3,
        message: 'Détection terminée'
      };

      jest.spyOn(alertesService, 'detecterAlertes').mockResolvedValue(mockResult as any);

      const result = await alertesResolvers.Mutation.detecterAlertes();

      expect(result).toEqual(mockResult);
      expect(alertesService.detecterAlertes).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mutation.resoudreAlerte', () => {
    it('devrait résoudre une alerte avec succès', async () => {
      const input = {
        alerteId: 1,
        effectuePar: 10,
        commentaire: 'Problème résolu'
      };

      const mockResult = {
        success: true,
        alerte: {
          id: 1,
          statut: 'RESOLUE',
          dateResolution: '2024-01-15'
        }
      };

      jest.spyOn(alertesService, 'resoudreAlerte').mockResolvedValue(mockResult as any);

      const result = await alertesResolvers.Mutation.resoudreAlerte({}, { input });

      expect(result).toEqual(mockResult);
      expect(alertesService.resoudreAlerte).toHaveBeenCalledWith(input);
    });
  });

  describe('Mutation.ignorerAlerte', () => {
    it('devrait ignorer une alerte avec succès', async () => {
      const input = {
        alerteId: 2,
        effectuePar: 10,
        raison: 'Fausse alerte'
      };

      const mockResult = {
        success: true,
        alerte: {
          id: 2,
          statut: 'IGNOREE',
          dateIgnore: '2024-01-15'
        }
      };

      jest.spyOn(alertesService, 'ignorerAlerte').mockResolvedValue(mockResult as any);

      const result = await alertesResolvers.Mutation.ignorerAlerte({}, { input });

      expect(result).toEqual(mockResult);
      expect(alertesService.ignorerAlerte).toHaveBeenCalledWith(input);
    });
  });
});
