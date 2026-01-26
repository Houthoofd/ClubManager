/**
 * Tests unitaires pour le service Statistiques
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { StatistiquesService } from '../statistiques.service.js';
import { createMockPrisma } from './statistiques.mock.js';

describe('StatistiquesService - Tests Unitaires', () => {
  let service: StatistiquesService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new StatistiquesService(mockPrisma as any);
  });

  describe('Statistiques Générales', () => {
    it('devrait récupérer les statistiques générales', async () => {
      const stats = await service.obtenirStatistiquesGenerales();
      
      expect(stats).toBeDefined();
      expect(stats.total_utilisateurs).toBeGreaterThanOrEqual(0);
      expect(stats.cours_a_venir).toBeGreaterThanOrEqual(0);
      expect(stats.total_inscriptions).toBeGreaterThanOrEqual(0);
      expect(stats.total_professeurs).toBeGreaterThanOrEqual(0);
    });

    it('devrait récupérer les statistiques par cours', async () => {
      const stats = await service.obtenirStatistiquesParCours();
      
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('Fréquentation', () => {
    it('devrait récupérer la fréquentation d\'un utilisateur', async () => {
      const freq = await service.obtenirFrequentationUtilisateur(1);
      
      expect(Array.isArray(freq)).toBe(true);
    });

    it('devrait récupérer les présences par mois', async () => {
      const presences = await service.obtenirPresencesParMois(1);
      
      expect(Array.isArray(presences)).toBe(true);
    });

    it('devrait récupérer les présences validées par mois', async () => {
      const presences = await service.obtenirPresencesValideesParMois(1);
      
      expect(Array.isArray(presences)).toBe(true);
    });

    it('devrait récupérer les présences non validées par mois', async () => {
      const presences = await service.obtenirPresencesNonValideesParMois(1);
      
      expect(Array.isArray(presences)).toBe(true);
    });

    it('devrait récupérer les statistiques de présence par mois', async () => {
      const stats = await service.obtenirStatistiquesPresenceParMois();
      
      expect(Array.isArray(stats)).toBe(true);
    });

    it('devrait récupérer les statistiques de présence globales', async () => {
      const stats = await service.obtenirStatistiquesPresence();
      
      expect(Array.isArray(stats)).toBe(true);
    });
  });

  describe('Progression', () => {
    it('devrait récupérer la progression d\'un utilisateur', async () => {
      const progression = await service.obtenirProgressionUtilisateur(1);
      
      expect(progression).toBeDefined();
      expect(progression.utilisateur_id).toBe(1);
      expect(typeof progression.coursSuivis).toBe('number');
      expect(Array.isArray(progression.progressionParCours)).toBe(true);
      expect(progression.niveauActuel).toBeDefined();
    });

    it('devrait récupérer l\'évolution des inscriptions', async () => {
      const evolution = await service.obtenirEvolutionInscriptions();
      
      expect(Array.isArray(evolution)).toBe(true);
    });
  });

  describe('Financières', () => {
    it('devrait récupérer les statistiques financières', async () => {
      const stats = await service.obtenirStatistiquesFinancieres();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalPaiementsMois).toBe('number');
      expect(typeof stats.paiementsRecents).toBe('number');
      expect(typeof stats.paiementsEnAttente).toBe('number');
      expect(typeof stats.tauxRenouvellement).toBe('number');
      expect(Array.isArray(stats.paiementsParMois)).toBe(true);
    });
  });

  describe('Membres', () => {
    it('devrait récupérer les statistiques des membres', async () => {
      const stats = await service.obtenirStatistiquesMembres();
      
      expect(stats).toBeDefined();
      expect(typeof stats.nombreMembres).toBe('number');
      expect(Array.isArray(stats.nouveauxMembres)).toBe(true);
      expect(Array.isArray(stats.membresParPlan)).toBe(true);
      expect(Array.isArray(stats.topMembresAssidus)).toBe(true);
    });
  });

  describe('Tableau de Bord', () => {
    it('devrait récupérer le tableau de bord complet', async () => {
      const dashboard = await service.obtenirTableauDeBord();
      
      expect(dashboard).toBeDefined();
      expect(dashboard.generales).toBeDefined();
      expect(dashboard.financieres).toBeDefined();
      expect(dashboard.membres).toBeDefined();
      expect(Array.isArray(dashboard.presenceParMois)).toBe(true);
      expect(Array.isArray(dashboard.articlesPlusVendus)).toBe(true);
    });
  });
});
