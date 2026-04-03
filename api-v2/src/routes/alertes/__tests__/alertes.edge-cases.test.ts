/**
 * Tests des cas limites (edge cases) pour les resolvers GraphQL Alertes
 * Vérifie le comportement avec des données vides, limites, ou extrêmes
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { alertesService } from '../../../services/alertes/alertes.service.js';
import { alertesResolvers } from '../../../services/alertes/alertes.resolvers.js';

describe('Alertes Resolvers GraphQL - Edge cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dashboardAlertes - devrait gérer un dashboard sans données', async () => {
    const mockDashboard = {
      alertesActives: 0,
      alertesCritiques: 0,
      alertesResolues: 0,
      alertesIgnorees: 0,
      total: 0
    };

    jest.spyOn(alertesService, 'obtenirDashboardAlertes').mockResolvedValue(mockDashboard as any);

    const result = await alertesResolvers.Query.dashboardAlertes();

    expect(result).toEqual(mockDashboard);
    expect(result.alertesActives).toBe(0);
  });

  it('alertesActives - devrait gérer aucune alerte active', async () => {
    jest.spyOn(alertesService, 'obtenirAlertesActives').mockResolvedValue([]);

    const result = await alertesResolvers.Query.alertesActives();

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('alertesUtilisateur - devrait gérer utilisateur sans alertes', async () => {
    jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockResolvedValue([]);

    const result = await alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: 123 });

    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });

  it('detecterAlertes - devrait gérer détection sans nouvelles alertes', async () => {
    const mockResult = {
      success: true,
      alertesCreees: 0,
      message: 'Aucune nouvelle alerte détectée'
    };

    jest.spyOn(alertesService, 'detecterAlertes').mockResolvedValue(mockResult as any);

    const result = await alertesResolvers.Mutation.detecterAlertes() as any;

    expect(result.success).toBe(true);
    expect(result.alertesCreees).toBe(0);
  });

  it('alertesActives - devrait gérer une seule alerte', async () => {
    const mockAlertes = [
      { id: 1, type: 'PAIEMENT_RETARD', severite: 'HAUTE' }
    ];

    jest.spyOn(alertesService, 'obtenirAlertesActives').mockResolvedValue(mockAlertes as any);

    const result = await alertesResolvers.Query.alertesActives();

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });

  it('alertesUtilisateur - devrait gérer très grand nombre d\'alertes', async () => {
    const mockAlertes = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      utilisateurId: 123,
      type: 'TEST'
    }));

    jest.spyOn(alertesService, 'obtenirAlertesUtilisateur').mockResolvedValue(mockAlertes as any);

    const result = await alertesResolvers.Query.alertesUtilisateur({}, { utilisateurId: 123 });

    expect(result.length).toBe(1000);
  });
});
