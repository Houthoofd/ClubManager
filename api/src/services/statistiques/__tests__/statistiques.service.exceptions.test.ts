/**
 * Tests des exceptions pour le service Statistiques
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { StatistiquesService } from '../statistiques.service.js';
import { StatistiquesError } from '@clubmanager/types';
import { createMockPrisma } from './statistiques.mock.js';

describe('StatistiquesService - Tests d\'Exceptions', () => {
  let service: StatistiquesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new StatistiquesService(mockPrisma as any);
  });

  describe('Validation des paramètres', () => {
    it('devrait rejeter un ID utilisateur invalide (0)', async () => {
      await expect(service.obtenirFrequentationUtilisateur(0)).rejects.toThrow(StatistiquesError);
    });

    it('devrait rejeter un ID utilisateur invalide (négatif)', async () => {
      await expect(service.obtenirFrequentationUtilisateur(-1)).rejects.toThrow(StatistiquesError);
    });

    it('devrait rejeter un utilisateur inexistant', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValueOnce(null);
      
      await expect(service.obtenirProgressionUtilisateur(9999)).rejects.toThrow(StatistiquesError);
    });

    it('devrait rejeter une période de jours invalide (0)', async () => {
      await expect(service.obtenirStatistiquesPresence(0)).rejects.toThrow(StatistiquesError);
    });

    it('devrait rejeter une période de jours invalide (trop grande)', async () => {
      await expect(service.obtenirStatistiquesPresence(500)).rejects.toThrow(StatistiquesError);
    });

    it('devrait rejeter une période de mois invalide (0)', async () => {
      await expect(service.obtenirStatistiquesPresenceParMois(0)).rejects.toThrow(StatistiquesError);
    });

    it('devrait rejeter une période de mois invalide (trop grande)', async () => {
      await expect(service.obtenirStatistiquesPresenceParMois(50)).rejects.toThrow(StatistiquesError);
    });
  });

  describe('Erreurs de base de données', () => {
    it('devrait gérer une erreur lors de la récupération des stats générales', async () => {
      mockPrisma.utilisateurs.count.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.obtenirStatistiquesGenerales()).rejects.toThrow();
    });

    it('devrait gérer une erreur lors de la récupération de la fréquentation', async () => {
      mockPrisma.inscriptions.findMany.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.obtenirFrequentationUtilisateur(1)).rejects.toThrow();
    });

    it('devrait gérer une erreur lors de la récupération de la progression', async () => {
      mockPrisma.utilisateurs.findUnique.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.obtenirProgressionUtilisateur(1)).rejects.toThrow();
    });

    it('devrait gérer une erreur lors de la récupération des stats financières', async () => {
      mockPrisma.paiements.findMany.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.obtenirStatistiquesFinancieres()).rejects.toThrow(StatistiquesError);
    });

    it('devrait gérer une erreur lors de la récupération des stats membres', async () => {
      mockPrisma.utilisateurs.count.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.obtenirStatistiquesMembres()).rejects.toThrow(StatistiquesError);
    });

    it('devrait gérer une erreur lors de la récupération du tableau de bord', async () => {
      mockPrisma.utilisateurs.count.mockRejectedValueOnce(new Error('DB Error'));
      
      await expect(service.obtenirTableauDeBord()).rejects.toThrow(StatistiquesError);
    });
  });

  describe('Codes d\'erreur', () => {
    it('devrait retourner le bon code d\'erreur pour ID invalide', async () => {
      try {
        await service.obtenirFrequentationUtilisateur(0);
      } catch (error) {
        expect(error).toBeInstanceOf(StatistiquesError);
        expect((error as StatistiquesError).code).toBe('INVALID_USER_ID');
        expect((error as StatistiquesError).statusCode).toBe(400);
      }
    });

    it('devrait retourner le bon code d\'erreur pour utilisateur introuvable', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValueOnce(null);
      
      try {
        await service.obtenirProgressionUtilisateur(9999);
      } catch (error) {
        expect(error).toBeInstanceOf(StatistiquesError);
        expect((error as StatistiquesError).code).toBe('USER_NOT_FOUND');
        expect((error as StatistiquesError).statusCode).toBe(404);
      }
    });

    it('devrait retourner le bon code d\'erreur pour période invalide', async () => {
      try {
        await service.obtenirStatistiquesPresence(0);
      } catch (error) {
        expect(error).toBeInstanceOf(StatistiquesError);
        expect((error as StatistiquesError).code).toBe('INVALID_DAY_RANGE');
      }
    });
  });
});
