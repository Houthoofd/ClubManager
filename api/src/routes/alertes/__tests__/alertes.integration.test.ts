/**
 * Tests d'intégration des resolvers GraphQL Alertes avec vraie DB
 * Ces tests utilisent une base MySQL de test (copie de la structure de la DB principale)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDatabase, cleanupTestDatabase, teardownTestDatabase, getTestPrisma, seedTestAlertes } from '../../../tests/setup/testDatabase.js';
import { alertesService } from '../../../services/alertes/alertes.service.js';

describe('Alertes - Tests d\'intégration avec DB', () => {
  beforeAll(async () => {
    // Setup de la DB de test avant tous les tests
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Nettoyage final et fermeture de la connexion
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    // Nettoyer et re-seed avant chaque test
    await cleanupTestDatabase();
    await seedTestAlertes();
  });

  describe('Query.dashboardAlertes', () => {
    it('devrait retourner le dashboard avec les vraies données', async () => {
      const result = await alertesService.obtenirDashboardAlertes();

      expect(result).toBeDefined();
      expect(result.totalAlertes).toBeGreaterThanOrEqual(0);
      expect(result.alertesActives).toBeGreaterThanOrEqual(0);
      expect(result.alertesCritiques).toBeGreaterThanOrEqual(0);
      expect(typeof result.totalAlertes).toBe('number');
    });

    it('devrait inclure les alertes récentes', async () => {
      const result = await alertesService.obtenirDashboardAlertes() as any;

      expect(result).toHaveProperty('alertes_recentes');
      expect(Array.isArray(result.alertes_recentes)).toBe(true);
      
      if (result.alertes_recentes && result.alertes_recentes.length > 0) {
        const alerte = result.alertes_recentes[0];
        expect(alerte).toHaveProperty('id');
        expect(alerte).toHaveProperty('utilisateur_id');
        expect(alerte).toHaveProperty('statut');
      }
    });
  });

  describe('Query.alertesActives', () => {
    it('devrait retourner uniquement les alertes actives', async () => {
      const result = await alertesService.obtenirAlertesActives();

      expect(Array.isArray(result)).toBe(true);
      
      // Vérifier que toutes les alertes sont actives
      result.forEach((alerte: any) => {
        expect(alerte.statut).toBe('active');
        expect(alerte).toHaveProperty('id');
        expect(alerte).toHaveProperty('utilisateurId');
        expect(alerte).toHaveProperty('typeAlerte');
      });
    });

    it('devrait inclure les informations de l\'utilisateur', async () => {
      const result = await alertesService.obtenirAlertesActives();

      if (result.length > 0) {
        const alerte = result[0];
        expect(alerte).toHaveProperty('nomUtilisateur');
        expect(alerte).toHaveProperty('email');
      }
    });
  });

  describe('Query.alertesUtilisateur', () => {
    it('devrait retourner les alertes d\'un utilisateur spécifique', async () => {
      const utilisateurId = 1;
      const result = await alertesService.obtenirAlertesUtilisateur(utilisateurId);

      expect(Array.isArray(result)).toBe(true);
      
      // Vérifier que toutes les alertes appartiennent à l'utilisateur
      result.forEach((alerte: any) => {
        expect(alerte.utilisateurId).toBe(utilisateurId);
      });
    });

    it('devrait retourner un tableau vide pour un utilisateur sans alertes', async () => {
      const result = await alertesService.obtenirAlertesUtilisateur(99999);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('Mutation.detecterAlertes', () => {
    it('devrait détecter les nouvelles alertes', async () => {
      // Nettoyer les alertes existantes
      await cleanupTestDatabase();
      
      // Créer des utilisateurs avec problèmes
      const prisma = getTestPrisma();
      await prisma.utilisateurs.create({
        data: {
          first_name: 'Test',
          last_name: 'User',
          email: '', // Email manquant
          password: 'test',
          status_id: 1
        }
      });

      const result = await alertesService.detecterAlertes();

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('message');
    });
  });

  describe('Mutation.resoudreAlerte', () => {
    it('devrait résoudre une alerte existante', async () => {
      // Récupérer une alerte active
      const alertes = await alertesService.obtenirAlertesActives();
      expect(alertes.length).toBeGreaterThan(0);
      
      const alerteId = alertes[0].id;
      
      const input = {
        alerteId,
        effectuePar: 1,
        notes: 'Test de résolution'
      };

      const result = await alertesService.resoudreAlerte(input);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      // Vérifier que l'alerte est bien résolue
      const prisma = getTestPrisma();
      const alerteResolue = await prisma.alertes_utilisateurs.findUnique({
        where: { id: alerteId }
      });
      
      expect(alerteResolue?.statut).toBe('resolue');
      expect(alerteResolue?.resolu_par).toBe(1);
      expect(alerteResolue?.date_resolution).toBeDefined();
    });

    it('devrait rejeter une alerte inexistante', async () => {
      const input = {
        alerteId: 99999,
        effectuePar: 1,
        notes: 'Test'
      };

      await expect(alertesService.resoudreAlerte(input))
        .rejects.toThrow('Alerte introuvable');
    });

    it('devrait rejeter une alerte déjà résolue', async () => {
      // Créer et résoudre une alerte
      const alertes = await alertesService.obtenirAlertesActives();
      const alerteId = alertes[0].id;
      
      await alertesService.resoudreAlerte({
        alerteId,
        effectuePar: 1,
        notes: 'Première résolution'
      });

      // Tenter de la résoudre à nouveau
      await expect(alertesService.resoudreAlerte({
        alerteId,
        effectuePar: 1,
        notes: 'Deuxième résolution'
      })).rejects.toThrow();
    });
  });

  describe('Mutation.ignorerAlerte', () => {
    it('devrait ignorer une alerte existante', async () => {
      // Récupérer une alerte active
      const alertes = await alertesService.obtenirAlertesActives();
      expect(alertes.length).toBeGreaterThan(0);
      
      const alerteId = alertes[0].id;
      
      const input = {
        alerteId,
        effectuePar: 1,
        raison: 'Fausse alerte de test'
      };

      const result = await alertesService.ignorerAlerte(input);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      
      // Vérifier que l'alerte est bien ignorée
      const prisma = getTestPrisma();
      const alerteIgnoree = await prisma.alertes_utilisateurs.findUnique({
        where: { id: alerteId }
      });
      
      expect(alerteIgnoree?.statut).toBe('ignoree');
      expect(alerteIgnoree?.resolu_par).toBe(1);
    });

    it('devrait rejeter une alerte inexistante', async () => {
      const input = {
        alerteId: 99999,
        effectuePar: 1,
        raison: 'Test'
      };

      await expect(alertesService.ignorerAlerte(input))
        .rejects.toThrow('Alerte introuvable');
    });
  });

  describe('Tests de cohérence des données', () => {
    it('le total des alertes devrait correspondre à la somme des statuts', async () => {
      const dashboard = await alertesService.obtenirDashboardAlertes();
      
      const sommeStatuts = dashboard.alertesActives + dashboard.alertesResolues;
      
      // Le total peut être >= à la somme (alertes ignorées, etc.)
      expect(dashboard.totalAlertes).toBeGreaterThanOrEqual(sommeStatuts);
    });

    it('les alertes critiques devraient être incluses dans les alertes actives', async () => {
      const dashboard = await alertesService.obtenirDashboardAlertes();
      
      expect(dashboard.alertesCritiques).toBeLessThanOrEqual(dashboard.alertesActives);
    });

    it('résoudre une alerte devrait décrémenter alertesActives', async () => {
      const dashboardAvant = await alertesService.obtenirDashboardAlertes();
      const alertesActives = await alertesService.obtenirAlertesActives();
      
      if (alertesActives.length > 0) {
        await alertesService.resoudreAlerte({
          alerteId: alertesActives[0].id,
          effectuePar: 1,
          notes: 'Test'
        });
        
        const dashboardApres = await alertesService.obtenirDashboardAlertes();
        
        expect(dashboardApres.alertesActives).toBe(dashboardAvant.alertesActives - 1);
      }
    });
  });
});
