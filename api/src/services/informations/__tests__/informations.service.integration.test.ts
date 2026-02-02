/**
 * Tests d'intégration pour le service Informations
 * Teste les opérations complètes avec le mock Prisma
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockPrisma } from './informations.mock.js';

// Mock Prisma
const mockPrisma = createMockPrisma();
jest.unstable_mockModule('../../../infrastructure/database/prisma-client.js', () => ({
  prisma: mockPrisma,
}));

describe('InformationsService - Tests d\'Intégration', () => {
  let informationsService: any;

  beforeEach(async () => {
    // Réinitialiser les mocks
    jest.clearAllMocks();
    mockPrisma._reset();

    // Importer le service après le mock
    const module = await import('../informations.service.js');
    informationsService = module.informationsService;
  });

  describe('Queries - Informations', () => {
    it('devrait récupérer toutes les informations actives', async () => {
      const result = await informationsService.obtenirToutesLesInformations();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((i: any) => i.status_id === 1)).toBe(true);
    });

    it('devrait récupérer une information par ID', async () => {
      const result = await informationsService.obtenirInformationParId(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.titre).toBeDefined();
    });

    it('devrait retourner null pour une information inexistante', async () => {
      const result = await informationsService.obtenirInformationParId(999);

      expect(result).toBeNull();
    });
  });

  describe('Mutations - Informations', () => {
    it('devrait ajouter une nouvelle information', async () => {
      const input = {
        titre: 'Nouvelle information',
        contenu: 'Contenu de test',
      };

      const result = await informationsService.ajouterInformation(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('succès');
      expect(result.data).toBeDefined();
      expect(result.data.titre).toBe(input.titre);
      expect(result.data.contenu).toBe(input.contenu);
      expect(result.data.status_id).toBe(1);
    });

    it('devrait modifier une information existante', async () => {
      const input = {
        titre: 'Titre modifié',
        contenu: 'Contenu modifié',
      };

      const result = await informationsService.modifierInformation(1, input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('modifiée');
      expect(result.data).toBeDefined();
      expect(result.data.titre).toBe(input.titre);
    });

    it('devrait échouer la modification d\'une information inexistante', async () => {
      const input = {
        titre: 'Titre',
        contenu: 'Contenu',
      };

      const result = await informationsService.modifierInformation(999, input);

      expect(result.success).toBe(false);
      expect(result.message).toContain('non trouvée');
    });

    it('devrait supprimer une information (soft delete)', async () => {
      const result = await informationsService.supprimerInformation(1);

      expect(result.success).toBe(true);
      expect(result.message).toContain('supprimée');
    });

    it('devrait échouer la suppression d\'une information inexistante', async () => {
      const result = await informationsService.supprimerInformation(999);

      expect(result.success).toBe(false);
      expect(result.message).toContain('non trouvée');
    });
  });

  describe('Queries - Référentiels', () => {
    it('devrait récupérer tous les status', async () => {
      const result = await informationsService.obtenirLesStatus();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nom');
    });

    it('devrait récupérer tous les plans tarifaires', async () => {
      const result = await informationsService.obtenirLesPlansTarifaires();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nom');
    });

    it('devrait récupérer tous les genres', async () => {
      const result = await informationsService.obtenirLesGenres();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nom');
    });

    it('devrait récupérer tous les grades', async () => {
      const result = await informationsService.obtenirLesGrades();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nom');
    });
  });

  describe('Scénarios complexes', () => {
    it('devrait gérer un cycle complet création-modification-suppression', async () => {
      // Création
      const createResult = await informationsService.ajouterInformation({
        titre: 'Test cycle',
        contenu: 'Contenu cycle',
      });
      expect(createResult.success).toBe(true);
      const infoId = createResult.data.id;

      // Modification
      const updateResult = await informationsService.modifierInformation(infoId, {
        titre: 'Test cycle modifié',
        contenu: 'Contenu modifié',
      });
      expect(updateResult.success).toBe(true);
      expect(updateResult.data.titre).toBe('Test cycle modifié');

      // Suppression
      const deleteResult = await informationsService.supprimerInformation(infoId);
      expect(deleteResult.success).toBe(true);
    });

    it('devrait récupérer les informations triées par date', async () => {
      const result = await informationsService.obtenirToutesLesInformations();

      // Vérifier que les dates sont en ordre décroissant
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].date_creation.getTime()).toBeGreaterThanOrEqual(
          result[i + 1].date_creation.getTime()
        );
      }
    });
  });
});
