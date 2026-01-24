/**
 * Tests d'intégration du service Alertes
 * Vérifie les comportements métier, les scénarios complexes et la cohérence des données
 *
 * Note: Utilise le mock Prisma local défini dans alertes.mock.ts
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { AlerteUtilisateur, AlerteDashboard, AlerteStats } from '@clubmanager/types';
import { createMockPrisma } from './alertes.mock.js';
import * as alertesQueries from '../core/queries/index.js';
import * as alertesMutations from '../core/mutations/index.js';
import * as alertesDetection from '../core/detection/index.js';
import * as alertesStats from '../core/stats/index.js';

describe('AlertesService - Tests d\'Intégration avec Mock Local', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockPrisma._reset();
  });


  describe('Dashboard - Agrégation et statistiques', () => {
    it('devrait retourner un dashboard avec structure et données correctes', async () => {
      const dashboard: AlerteDashboard = await alertesStats.obtenirDashboardAlertes(mockPrisma);
      
      // Vérification structure
      expect(dashboard).toBeDefined();
      expect(dashboard.totalAlertes).toBeDefined();
      expect(dashboard.alertesActives).toBeDefined();
      expect(dashboard.alertesResolues).toBeDefined();
      expect(dashboard.alertesCritiques).toBeDefined();
      expect(Array.isArray(dashboard.alertesParType)).toBe(true);
      
      // Cohérence des données
      expect(dashboard.alertesActives).toBeLessThanOrEqual(dashboard.totalAlertes);
    });

    it('devrait retourner des statistiques avec données cohérentes', async () => {
      const stats: AlerteStats = await alertesStats.obtenirStatistiquesAlertes(mockPrisma);
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalAlertes).toBe('number');
      expect(typeof stats.alertesActives).toBe('number');
      expect(typeof stats.alertesResolues).toBe('number');
      expect(stats.alertesActives + stats.alertesResolues).toBeLessThanOrEqual(stats.totalAlertes);
    });
  });

  describe('Queries - Alertes utilisateurs', () => {
    it('devrait récupérer les alertes actives avec données complètes', async () => {
      const alertes: AlerteUtilisateur[] = await alertesQueries.obtenirAlertesActives(mockPrisma);
      
      expect(Array.isArray(alertes)).toBe(true);
      expect(alertes.length).toBeGreaterThan(0);
      
      const alerte = alertes[0];
      expect(alerte).toHaveProperty('id');
      expect(alerte).toHaveProperty('utilisateurId');
      expect(alerte).toHaveProperty('typeAlerte');
      expect(alerte).toHaveProperty('priorite');
      expect(alerte).toHaveProperty('statut');
      expect(alerte.statut).toBe('active');
    });

    it('devrait récupérer les alertes d\'un utilisateur spécifique', async () => {
      const alertes: AlerteUtilisateur[] = await alertesQueries.obtenirAlertesUtilisateur(1, mockPrisma);
      
      expect(Array.isArray(alertes)).toBe(true);
      expect(alertes.length).toBeGreaterThan(0);
      expect(alertes.every((a: AlerteUtilisateur) => a.utilisateurId === 1)).toBe(true);
    });

    it('devrait retourner un tableau vide pour un utilisateur sans alertes', async () => {
      const alertes: AlerteUtilisateur[] = await alertesQueries.obtenirAlertesUtilisateur(999, mockPrisma);
      expect(Array.isArray(alertes)).toBe(true);
      expect(alertes.length).toBe(0);
    });
  });

  describe('Detection - Alertes automatiques', () => {
    it('devrait détecter des alertes avec succès', async () => {
      const result = await alertesDetection.detecterAlertes(mockPrisma);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toBeDefined();
    });

    it('devrait retourner un message de succès même sans nouvelles alertes', async () => {
      const result = await alertesDetection.detecterAlertes(mockPrisma);
      
      expect(result.success).toBe(true);
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Mutations - Actions sur alertes', () => {
    it('devrait résoudre une alerte avec succès', async () => {
      const result = await alertesMutations.resoudreAlerte({
        alerteId: 1,
        notes: 'Problème résolu',
        effectuePar: 1,
      }, mockPrisma);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('succès');
    });

    it('devrait ignorer une alerte', async () => {
      const result = await alertesMutations.ignorerAlerte({
        alerteId: 1,
        notes: 'Alerte ignorée',
      }, mockPrisma);
      
      expect(result.success).toBe(true);
    });

    it('devrait créer une nouvelle alerte', async () => {
      const alerte = await alertesMutations.creerAlerte({
        utilisateurId: 2,
        typeAlerteId: 1,
        contexte: { test: true },
      }, mockPrisma);
      
      expect(alerte).toBeDefined();
      expect(alerte.utilisateurId).toBe(2);
      expect(alerte.statut).toBe('active');
    });
  });

  describe('Scénarios complexes', () => {
    it('devrait maintenir la cohérence entre queries et dashboard', async () => {
      const alertesVides = await alertesQueries.obtenirAlertesUtilisateur(9999, mockPrisma);
      expect(alertesVides.length).toBe(0);
      
      const dashboard = await alertesStats.obtenirDashboardAlertes(mockPrisma);
      expect(dashboard.totalAlertes).toBeGreaterThan(0);
      
      const alertes = await alertesQueries.obtenirAlertesActives(mockPrisma);
      expect(alertes.length).toBe(dashboard.alertesActives);
    });

    it('devrait gérer les priorités dans le tri des alertes', async () => {
      const alertes = await alertesQueries.obtenirAlertesActives(mockPrisma);
      
      // Vérifier que toutes les alertes ont une priorité valide
      const priorites = ['critique', 'haute', 'normale', 'basse'];
      expect(alertes.every(a => priorites.includes(a.priorite))).toBe(true);
      
      // Vérifier qu'il y a au moins une alerte
      expect(alertes.length).toBeGreaterThan(0);
    });

    it('devrait refléter les changements après résolution', async () => {
      const dashboard = await alertesStats.obtenirDashboardAlertes(mockPrisma);
      const alertesActives = await alertesQueries.obtenirAlertesActives(mockPrisma);
      
      expect(alertesActives.length).toBe(dashboard.alertesActives);
      
      // Résoudre une alerte
      if (alertesActives.length > 0) {
        const result = await alertesMutations.resoudreAlerte({
          alerteId: alertesActives[0].id,
          notes: 'Test résolution',
          effectuePar: 1,
        }, mockPrisma);
        
        expect(result.success).toBe(true);
        
        const alertesApres = await alertesQueries.obtenirAlertesActives(mockPrisma);
        expect(alertesApres.length).toBeLessThan(alertesActives.length);
      }
    });

    it('devrait avoir un dashboard cohérent après détection', async () => {
      const dashboard = await alertesStats.obtenirDashboardAlertes(mockPrisma);
      
      expect(dashboard.alertesCritiques).toBeLessThanOrEqual(dashboard.alertesActives);
      expect(dashboard.alertesActives).toBeLessThanOrEqual(dashboard.totalAlertes);
    });

    it('devrait exécuter la détection sans erreur', async () => {
      const result = await alertesDetection.detecterAlertes(mockPrisma);
      
      expect(result.success).toBe(true);
      
      // Vérifier que la détection n'a pas cassé les données
      const alertes = await alertesQueries.obtenirAlertesActives(mockPrisma);
      expect(Array.isArray(alertes)).toBe(true);
    });
  });
});
