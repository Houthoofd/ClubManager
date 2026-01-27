/**
 * Tests de cohérence des schémas pour les resolvers GraphQL Alertes
 * Vérifie la structure et les types des données retournées
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { alertesService } from '../../../services/alertes/alertes.service.js';
import { alertesResolvers } from '../../../services/alertes/alertes.resolvers.js';

describe('Alertes Resolvers GraphQL - Cohérence des données', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dashboardAlertes - devrait avoir la structure attendue', async () => {
    const mockDashboard = {
      alertesActives: 5,
      alertesCritiques: 2,
      alertesResolues: 10,
      alertesIgnorees: 3
    };

    jest.spyOn(alertesService, 'obtenirDashboardAlertes').mockResolvedValue(mockDashboard as any);

    const result = await alertesResolvers.Query.dashboardAlertes();

    expect(result).toHaveProperty('alertesActives');
    expect(result).toHaveProperty('alertesCritiques');
    expect(result).toHaveProperty('alertesResolues');
    expect(result).toHaveProperty('alertesIgnorees');
    expect(typeof result.alertesActives).toBe('number');
  });

  it('alertesActives - devrait retourner un tableau', async () => {
    jest.spyOn(alertesService, 'obtenirAlertesActives').mockResolvedValue([]);

    const result = await alertesResolvers.Query.alertesActives();

    expect(Array.isArray(result)).toBe(true);
  });

  it('resoudreAlerte - la réponse devrait contenir success et alerte', async () => {
    const input = {
      alerteId: 1,
      effectuePar: 10,
      commentaire: 'Test'
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

    const result = await alertesResolvers.Mutation.resoudreAlerte({}, { input }) as any;

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('alerte');
    expect(result.success).toBe(true);
    expect(result.alerte).toHaveProperty('id');
    expect(result.alerte).toHaveProperty('statut');
  });

  it('ignorerAlerte - la réponse devrait contenir success et alerte', async () => {
    const input = {
      alerteId: 2,
      effectuePar: 10,
      raison: 'Test'
    };

    const mockResult = {
      success: true,
      alerte: {
        id: 2,
        statut: 'IGNOREE'
      }
    };

    jest.spyOn(alertesService, 'ignorerAlerte').mockResolvedValue(mockResult as any);

    const result = await alertesResolvers.Mutation.ignorerAlerte({}, { input }) as any;

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('alerte');
    expect(typeof result.success).toBe('boolean');
  });

  it('detecterAlertes - devrait retourner success et message', async () => {
    const mockResult = {
      success: true,
      alertesCreees: 5,
      message: 'OK'
    };

    jest.spyOn(alertesService, 'detecterAlertes').mockResolvedValue(mockResult as any);

    const result = await alertesResolvers.Mutation.detecterAlertes() as any;

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(typeof result.success).toBe('boolean');
    expect(typeof result.message).toBe('string');
  });
});
