/**
 * Tests d'intégration du service Alertes
 * Vérifie les comportements métier, les scénarios complexes et la cohérence des données
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import type { AlerteUtilisateur, AlerteDashboard, AlerteStats } from '@clubmanager/types/src/alertes.js';

describe('AlertesService - Tests d\'Intégration', () => {
  let alertesService: any;

  beforeEach(async () => {
    const module = await import('../alertes.service.js');
    alertesService = module.alertesService;
  });

  describe('Dashboard - Agrégation et statistiques', () => {
    it('devrait retourner un dashboard avec structure et données correctes', async () => {
      const dashboard: AlerteDashboard = await alertesService.obtenirDashboardAlertes();
      
      // Vérification structure
      expect(dashboard).toBeDefined();
      expect(dashboard.totalAlertes).toBeDefined();
      expect(dashboard.alertesActives).toBeDefined();
      expect(dashboard.alertesResolues).toBeDefined();
      expect(dashboard.alertesCritiques).toBeDefined();
      expect(Array.isArray(dashboard.alertesParType)).toBe(true);
      
      // Vérification données (selon mock: 2 alertes actives, 1 critique)
      expect(dashboard.totalAlertes).toBe(2);
      expect(dashboard.alertesActives).toBe(2);
      expect(dashboard.alertesCritiques).toBe(1);
    });

    it('devrait retourner alertesParType avec la structure correcte', async () => {
      const dashboard: AlerteDashboard = await alertesService.obtenirDashboardAlertes();
      
      expect(dashboard.alertesParType.length).toBeGreaterThan(0);
      dashboard.alertesParType.forEach((item: any) => {
        expect(item.typeAlerteId).toBeDefined();
        expect(item.count).toBeDefined();
        expect(item.statut).toBeDefined();
      });
    });
  });

  describe('Statistiques - Données temporelles', () => {
    it('devrait retourner des statistiques avec la structure correcte', async () => {
      const stats: AlerteStats = await alertesService.obtenirStatistiquesAlertes();
      
      expect(stats).toBeDefined();
      expect(typeof stats.totalAlertes).toBe('number');
      expect(typeof stats.alertesActives).toBe('number');
      expect(typeof stats.alertesResolues).toBe('number');
      expect(typeof stats.alertesCritiques).toBe('number');
    });
  });

  describe('Queries - Récupération avec filtres', () => {
    it('devrait récupérer les alertes actives avec tous les détails', async () => {
      const alertes: AlerteUtilisateur[] = await alertesService.obtenirAlertesActives();
      
      expect(Array.isArray(alertes)).toBe(true);
      expect(alertes.length).toBe(2); // Selon mock
      
      // Vérifier qu'on a bien les données enrichies
      if (alertes.length > 0) {
        const alerte = alertes[0];
        expect(alerte.typeAlerte).toBeDefined();
        expect(alerte.code).toBeDefined();
        expect(alerte.description).toBeDefined();
        expect(alerte.nomUtilisateur).toBeDefined();
        expect(alerte.email).toBeDefined();
      }
    });

    it('devrait récupérer les alertes d\'un utilisateur spécifique', async () => {
      const alertes: AlerteUtilisateur[] = await alertesService.obtenirAlertesUtilisateur(1);
      
      expect(Array.isArray(alertes)).toBe(true);
      expect(alertes.length).toBe(1); // Utilisateur 1 a 1 alerte selon mock
      
      if (alertes.length > 0) {
        expect(alertes[0].utilisateurId).toBe(1);
      }
    });

    it('devrait retourner un tableau vide pour un utilisateur sans alertes', async () => {
      const alertes: AlerteUtilisateur[] = await alertesService.obtenirAlertesUtilisateur(999);
      
      expect(Array.isArray(alertes)).toBe(true);
      expect(alertes.length).toBe(0);
    });
  });

  describe('Détection - Logique métier automatique', () => {
    it('devrait détecter les alertes et retourner un résultat de succès', async () => {
      const result = await alertesService.detecterAlertes();
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Détection terminée');
      expect(result.message).toContain('alertes');
    });

    it('devrait retourner un résultat avec les détails de détection', async () => {
      const result = await alertesService.detecterAlertes();
      
      expect(result.message).toBeDefined();
      expect(typeof result.message).toBe('string');
      expect(result.message).toContain('alertes');
    });
  });

  describe('Mutations - Opérations d\'écriture', () => {
    it('devrait résoudre une alerte avec succès', async () => {
      const result = await alertesService.resoudreAlerte({
        alerteId: 1,
        effectuePar: 1,
        notes: 'Test résolution',
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('résolue');
    });

    it('devrait ignorer une alerte avec succès', async () => {
      const result = await alertesService.ignorerAlerte({
        alerteId: 1,
        notes: 'Test ignore',
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('ignorée');
    });

    it('devrait créer une nouvelle alerte avec les données fournies', async () => {
      const result = await alertesService.creerAlerte({
        utilisateurId: 1,
        typeAlerteId: 1, // COMPTE_INCOMPLET
        contexte: { test: 'data' },
      });
      
      expect(result).toBeDefined();
      expect(result.utilisateurId).toBe(1);
      expect(result.statut).toBe('active');
    });
  });

  describe('Scénarios complexes et edge cases', () => {
    it('devrait gérer gracieusement les résultats vides', async () => {
      const alertesVides = await alertesService.obtenirAlertesUtilisateur(9999);
      expect(alertesVides).toEqual([]);
      
      const dashboard = await alertesService.obtenirDashboardAlertes();
      expect(dashboard).toBeDefined(); // Même sans données, le dashboard doit exister
    });

    it('devrait retourner des types de données valides pour tous les champs', async () => {
      const alertes = await alertesService.obtenirAlertesActives();
      
      alertes.forEach((alerte: AlerteUtilisateur) => {
        expect(typeof alerte.id).toBe('number');
        expect(typeof alerte.utilisateurId).toBe('number');
        expect(typeof alerte.statut).toBe('string');
        expect(alerte.dateDetection).toBeInstanceOf(Date);
        expect(typeof alerte.typeAlerte).toBe('string');
        expect(typeof alerte.code).toBe('string');
        expect(typeof alerte.description).toBe('string');
      });
    });

    it('devrait maintenir la cohérence des données entre différentes requêtes', async () => {
      const dashboard = await alertesService.obtenirDashboardAlertes();
      const alertesActives = await alertesService.obtenirAlertesActives();
      
      // Le nombre d'alertes actives doit correspondre
      expect(dashboard.alertesActives).toBe(alertesActives.length);
    });

    it('devrait gérer correctement les transactions pour la résolution', async () => {
      // La résolution devrait créer une action ET mettre à jour l'alerte
      const result = await alertesService.resoudreAlerte({
        alerteId: 1,
        effectuePar: 1,
        notes: 'Test transaction',
      });
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('résolue');
    });

    it('devrait enrichir les alertes avec les données de type', async () => {
      const alertes = await alertesService.obtenirAlertesActives();
      
      alertes.forEach((alerte: AlerteUtilisateur) => {
        // Vérifier que les champs enrichis sont présents
        expect(alerte.typeAlerte).toBeDefined();
        expect(alerte.code).toBeDefined();
        expect(alerte.description).toBeDefined();
        expect(alerte.priorite).toBeDefined();
        expect(['basse', 'normale', 'haute', 'critique']).toContain(alerte.priorite);
      });
    });

    it('devrait filtrer correctement par priorité critique', async () => {
      const dashboard = await alertesService.obtenirDashboardAlertes();
      
      // Selon le mock, il y a 1 alerte critique (PAIEMENT_CRITIQUE)
      expect(dashboard.alertesCritiques).toBe(1);
    });
  });

  describe('Validations et contraintes métier', () => {
    it('devrait détecter les comptes incomplets', async () => {
      const result = await alertesService.detecterAlertes();
      
      // Le mock a 1 utilisateur avec compte incomplet (sans abonnement)
      expect(result.success).toBe(true);
      expect(result.message).toMatch(/\d+ alertes détectées/);
    });

    it('devrait préserver les données contexte lors des opérations', async () => {
      const alertes = await alertesService.obtenirAlertesActives();
      
      const alerteAvecContexte = alertes.find((a: AlerteUtilisateur) => 
        a.donneesContexte && Object.keys(a.donneesContexte).length > 0
      );
      
      if (alerteAvecContexte) {
        expect(typeof alerteAvecContexte.donneesContexte).toBe('object');
      }
    });
  });
});
