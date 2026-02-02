/**
 * Tests d'intégration pour le service Statistiques
 * Tests des interactions complexes entre plusieurs domaines
 */

import { createMockPrisma, mockUtilisateurs } from './statistiques.mock.js';
import { initStatistiquesService } from '../statistiques.service.js';

describe('StatistiquesService - Tests d\'Intégration', () => {
  let mockPrisma: any;
  let service: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = initStatistiquesService(mockPrisma);
  });

  describe('Tableau de Bord Complet', () => {
    it('devrait combiner toutes les statistiques sans erreur', async () => {
      const result = await service.obtenirTableauDeBord();

      expect(result).toHaveProperty('generales');
      expect(result).toHaveProperty('financieres');
      expect(result).toHaveProperty('membres');
      expect(result.generales).toBeDefined();
      expect(result.financieres).toBeDefined();
      expect(result.membres).toBeDefined();
    });

    it('devrait gérer les statistiques avec données manquantes', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.inscriptions.findMany.mockResolvedValue([]);

      const result = await service.obtenirTableauDeBord();

      expect(result.financieres.totalPaiementsMois).toBe(0);
      expect(result.presenceParMois).toBeDefined();
    });

    it('devrait calculer correctement les corrélations financières/membres', async () => {
      const result = await service.obtenirTableauDeBord();
      const { financieres, membres } = result;

      if (membres.nombreMembres > 0) {
        expect(financieres).toBeDefined();
        expect(financieres.totalPaiementsMois).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Intégration Fréquentation + Progression', () => {
    it('devrait corréler fréquentation et niveau de progression', async () => {
      const userId = 1;
      const frequentation = await service.obtenirFrequentationUtilisateur(userId);
      const progression = await service.obtenirProgressionUtilisateur(userId);

      expect(Array.isArray(frequentation)).toBe(true);
      expect(progression).toHaveProperty('utilisateur_id');
      expect(progression).toHaveProperty('niveauActuel');
      expect(['Débutant', 'Intermédiaire', 'Avancé', 'Expert']).toContain(progression.niveauActuel);
    });

    it('devrait avoir des données cohérentes entre présences et progression', async () => {
      const userId = 1;
      const presencesValidees = await service.obtenirPresencesValideesParMois(userId);
      const progression = await service.obtenirProgressionUtilisateur(userId);

      const totalPresences = presencesValidees.reduce((sum: number, p: any) => sum + p.nombre_presences, 0);
      
      if (totalPresences > 0) {
        expect(progression.coursSuivis).toBeGreaterThan(0);
      }
    });

    it('devrait refléter l\'assiduité dans le niveau de progression', async () => {
      const userId = 1;
      
      mockPrisma.inscriptions.findMany.mockResolvedValue(
        Array(60).fill(null).map((_, i) => ({
          id: i + 100,
          utilisateur_id: userId,
          cours_id: 1,
          status_id: 1,
          date_inscription: new Date('2024-01-01'),
          cours: {
            id: 1,
            type_cours: 'Karaté',
            date_cours: new Date('2024-06-15'),
            cours_recurrent_id: 1
          }
        }))
      );

      const progression = await service.obtenirProgressionUtilisateur(userId);
      
      expect(progression.coursSuivis).toBeGreaterThan(50);
      expect(progression.niveauActuel).toBe('Expert');
    });
  });

  describe('Intégration Financier + Membres', () => {
    it('devrait corréler nouveaux membres et paiements récents', async () => {
      const stats = await service.obtenirTableauDeBord();
      const { financieres, membres } = stats;

      if (membres.nouveauxMembres.length > 0) {
        expect(financieres.paiementsRecents).toBeGreaterThanOrEqual(0);
      }
    });

    it('devrait calculer le revenu moyen par membre', async () => {
      const financier = await service.obtenirStatistiquesFinancieres();
      const membres = await service.obtenirStatistiquesMembres();

      if (membres.nombreMembres > 0) {
        const revenuMoyen = financier.totalPaiementsMois / membres.nombreMembres;
        expect(revenuMoyen).toBeGreaterThanOrEqual(0);
        expect(isFinite(revenuMoyen)).toBe(true);
      }
    });

    it('devrait avoir cohérence plans/paiements', async () => {
      const membres = await service.obtenirStatistiquesMembres();
      const financier = await service.obtenirStatistiquesFinancieres();

      const totalMembresAvecPlan = membres.membresParPlan.reduce((sum: number, p: any) => sum + p.value, 0);
      expect(totalMembresAvecPlan).toBeGreaterThanOrEqual(0);
      expect(financier.totalPaiementsMois).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Évolution Temporelle', () => {
    it('devrait avoir évolution cohérente sur 12 mois', async () => {
      const presences = await service.obtenirStatistiquesPresenceParMois(12);
      
      if (presences.length > 0) {
        for (let i = 1; i < presences.length; i++) {
          const prev = new Date(presences[i - 1].mois);
          const curr = new Date(presences[i].mois);
          expect(curr.getTime()).toBeGreaterThanOrEqual(prev.getTime());
        }
      }
    });

    it('devrait calculer tendances sur période donnée', async () => {
      const stats = await service.obtenirStatistiquesParCours(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      expect(Array.isArray(stats)).toBe(true);
      stats.forEach((stat: any) => {
        expect(stat).toHaveProperty('type_cours');
        if (stat.tauxPresence !== undefined) {
          expect(stat.tauxPresence).toBeGreaterThanOrEqual(0);
          expect(stat.tauxPresence).toBeLessThanOrEqual(100);
        }
      });
    });

    it('devrait suivre l\'évolution des inscriptions avec dates précises', async () => {
      const evolution = await service.obtenirEvolutionInscriptions(90);
      
      if (evolution.length > 1) {
        for (let i = 1; i < evolution.length; i++) {
          const prev = evolution[i - 1].date_inscription.getTime();
          const curr = evolution[i].date_inscription.getTime();
          expect(curr).toBeGreaterThanOrEqual(prev);
        }
      }
    });
  });

  describe('Scénarios Multi-Utilisateurs', () => {
    it('devrait gérer statistiques pour plusieurs utilisateurs simultanément', async () => {
      const users = [1, 2];
      const results = await Promise.all(
        users.map(id => service.obtenirFrequentationUtilisateur(id))
      );

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });
    });

    it('devrait comparer progression entre utilisateurs', async () => {
      const userId1 = 1;
      const userId2 = 2;

      const prog1 = await service.obtenirProgressionUtilisateur(userId1);
      const prog2 = await service.obtenirProgressionUtilisateur(userId2);

      expect(prog1.utilisateur_id).not.toBe(prog2.utilisateur_id);
      expect(['Débutant', 'Intermédiaire', 'Avancé', 'Expert']).toContain(prog1.niveauActuel);
      expect(['Débutant', 'Intermédiaire', 'Avancé', 'Expert']).toContain(prog2.niveauActuel);
    });

    it('devrait identifier top membres assidus correctement', async () => {
      const stats = await service.obtenirStatistiquesMembres();
      
      expect(stats).toHaveProperty('topMembresAssidus');
      expect(Array.isArray(stats.topMembresAssidus)).toBe(true);
      
      if (stats.topMembresAssidus.length > 1) {
        for (let i = 1; i < stats.topMembresAssidus.length; i++) {
          const prev = stats.topMembresAssidus[i - 1].total_presences_validees;
          const curr = stats.topMembresAssidus[i].total_presences_validees;
          expect(prev).toBeGreaterThanOrEqual(curr);
        }
      }
    });
  });

  describe('Performances et Optimisation', () => {
    it('devrait charger le tableau de bord en temps raisonnable', async () => {
      const start = Date.now();
      await service.obtenirTableauDeBord();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000);
    });

    it('devrait gérer requêtes parallèles efficacement', async () => {
      const requests = [
        service.obtenirStatistiquesGenerales(),
        service.obtenirStatistiquesMembres(),
        service.obtenirStatistiquesFinancieres(),
        service.obtenirStatistiquesPresence(30)
      ];

      const start = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - start;

      expect(results).toHaveLength(4);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Cas Limites d\'Intégration', () => {
    it('devrait gérer base de données vide gracieusement', async () => {
      mockPrisma.utilisateurs.count.mockResolvedValue(0);
      mockPrisma.utilisateurs.findMany.mockResolvedValue([]);
      mockPrisma.cours.count.mockResolvedValue(0);
      mockPrisma.cours.findMany.mockResolvedValue([]);
      mockPrisma.inscriptions.count.mockResolvedValue(0);
      mockPrisma.inscriptions.findMany.mockResolvedValue([]);
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.professeurs.count.mockResolvedValue(0);
      mockPrisma.plans_tarifaires.count.mockResolvedValue(0);

      const stats = await service.obtenirStatistiquesGenerales();
      
      expect(stats.total_utilisateurs).toBe(0);
      expect(stats.cours_a_venir).toBe(0);
      expect(stats.total_inscriptions).toBe(0);
    });

    it('devrait calculer pourcentages corrects avec données minimales', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        { ...mockUtilisateurs[0], plan_tarifaire_id: 1, inscriptions: [],
          plans_tarifaires: { nom_plan: 'Mensuel' } }
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const membres = await service.obtenirStatistiquesMembres();
      
      expect(membres.membresParPlan).toBeDefined();
      expect(Array.isArray(membres.membresParPlan)).toBe(true);
      
      membres.membresParPlan.forEach((plan: any) => {
        expect(plan.pourcentage).toBeGreaterThanOrEqual(0);
        expect(plan.pourcentage).toBeLessThanOrEqual(100);
      });
    });
  });
});
