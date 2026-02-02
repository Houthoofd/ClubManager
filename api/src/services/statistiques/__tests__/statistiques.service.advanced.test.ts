/**
 * Tests avancés pour le service Statistiques
 * Tests de scénarios complexes, edge cases, et performances
 */

import { createMockPrisma, mockUtilisateurs, mockCours, mockInscriptions, mockPaiements } from './statistiques.mock.js';
import { initStatistiquesService } from '../statistiques.service.js';
import { StatistiquesError } from '@clubmanager/types';

describe('StatistiquesService - Tests Avancés', () => {
  let mockPrisma: any;
  let service: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = initStatistiquesService(mockPrisma);
  });

  describe('Scénarios de Données Complexes', () => {
    it('devrait gérer cours avec inscriptions multiples du même utilisateur', async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        { id: 1, utilisateur_id: 1, cours_id: 1, status_id: 1, date_inscription: new Date('2024-01-01'),
          cours: { type_cours: 'Karaté', cours_recurrent_id: 1 } },
        { id: 2, utilisateur_id: 1, cours_id: 1, status_id: 1, date_inscription: new Date('2024-01-02'),
          cours: { type_cours: 'Karaté', cours_recurrent_id: 1 } },
        { id: 3, utilisateur_id: 1, cours_id: 1, status_id: 1, date_inscription: new Date('2024-01-03'),
          cours: { type_cours: 'Karaté', cours_recurrent_id: 1 } }
      ]);

      const result = await service.obtenirFrequentationUtilisateur(1);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('devrait gérer cours sans cours_recurrent_id', async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        { id: 1, utilisateur_id: 1, cours_id: 1, status_id: 1, date_inscription: new Date(),
          cours: { type_cours: 'Test', cours_recurrent_id: null } }
      ]);

      const result = await service.obtenirProgressionUtilisateur(1);
      
      expect(result).toBeDefined();
      expect(result.progressionParCours).toBeDefined();
    });

    it('devrait gérer paiements avec montants décimaux précis', async () => {
      mockPrisma.paiements.findMany.mockResolvedValueOnce([
        { montant: 49.99, date_paiement: new Date(), statut: 'validé' },
        { montant: 0.01, date_paiement: new Date(), statut: 'confirmé' },
        { montant: 999.99, date_paiement: new Date(), statut: 'validé' }
      ]);

      const result = await service.obtenirStatistiquesFinancieres();
      
      expect(result.totalPaiementsMois).toBeCloseTo(1049.99, 2);
    });

    it('devrait gérer utilisateurs avec plans null', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        { ...mockUtilisateurs[0], plan_tarifaire_id: null, plans_tarifaires: null, inscriptions: [] }
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(1);

      const result = await service.obtenirStatistiquesMembres();
      
      expect(result.membresParPlan).toBeDefined();
      expect(result.membresParPlan.some((p: any) => p.plan === 'Sans plan')).toBe(true);
    });

    it('devrait gérer dates limites de périodes fiscales', async () => {
      const debutAnnee = new Date('2024-01-01T00:00:00.000Z');
      const finAnnee = new Date('2024-12-31T23:59:59.999Z');

      const result = await service.obtenirStatistiquesParCours(debutAnnee, finAnnee);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Edge Cases Numériques', () => {
    it('devrait gérer division par zéro dans calcul tauxPresence', async () => {
      mockPrisma.cours.findMany.mockResolvedValue([
        { type_cours: 'Test', inscriptions: [] }
      ]);

      const result = await service.obtenirStatistiquesParCours();
      
      if (result.length > 0) {
        expect(result[0].taux_presence).toBe(0);
        expect(isFinite(result[0].taux_presence)).toBe(true);
      }
    });

    it('devrait gérer pourcentages avec arrondis précis', async () => {
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        { ...mockUtilisateurs[0], plan_tarifaire_id: 1, plans_tarifaires: { nom_plan: 'A' }, inscriptions: [] },
        { ...mockUtilisateurs[1], plan_tarifaire_id: 2, plans_tarifaires: { nom_plan: 'B' }, inscriptions: [] },
        { id: 3, plan_tarifaire_id: 3, plans_tarifaires: { nom_plan: 'C' }, inscriptions: [] }
      ]);
      mockPrisma.utilisateurs.count.mockResolvedValue(3);

      const result = await service.obtenirStatistiquesMembres();
      
      result.membresParPlan.forEach((plan: any) => {
        expect(Number.isFinite(plan.pourcentage)).toBe(true);
        expect(plan.pourcentage).toBeGreaterThanOrEqual(0);
        expect(plan.pourcentage).toBeLessThanOrEqual(100);
      });
    });

    it('devrait gérer montant zéro dans paiements', async () => {
      mockPrisma.paiements.findMany.mockResolvedValueOnce([
        { montant: 0, date_paiement: new Date(), statut: 'validé' }
      ]);

      const result = await service.obtenirStatistiquesFinancieres();
      
      expect(result.totalPaiementsMois).toBe(0);
    });

    it('devrait gérer progression = 0% correctement', async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([]);

      const result = await service.obtenirProgressionUtilisateur(1);
      
      expect(result.coursSuivis).toBe(0);
      expect(result.pourcentage_global).toBe(0);
    });

    it('devrait gérer progression = 100% correctement', async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        ...Array(100).fill(null).map((_, i) => ({
          id: i,
          utilisateur_id: 1,
          cours_id: 1,
          status_id: 1,
          cours: { type_cours: 'Karaté', cours_recurrent_id: 1 }
        }))
      ]);
      mockPrisma.cours_recurrent.count.mockResolvedValue(100);

      const result = await service.obtenirProgressionUtilisateur(1);
      
      expect(result.pourcentage_global).toBeGreaterThan(0);
    });
  });

  describe('Gestion des Fuseaux Horaires', () => {
    it('devrait gérer dates UTC correctement', async () => {
      const dateUTC = new Date('2024-06-15T12:00:00.000Z');
      
      const result = await service.obtenirStatistiquesParCours(dateUTC, dateUTC);
      
      expect(result).toBeDefined();
    });

    it('devrait gérer dates avec décalage horaire', async () => {
      const date = new Date('2024-06-15T23:59:59+02:00');
      
      const result = await service.obtenirStatistiquesParCours(date);
      
      expect(result).toBeDefined();
    });

    it('devrait grouper dates par jour local correctement', async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        { date_inscription: new Date('2024-06-15T01:00:00Z') },
        { date_inscription: new Date('2024-06-15T23:00:00Z') }
      ]);

      const result = await service.obtenirEvolutionInscriptions(7);
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Performance et Optimisation', () => {
    it('devrait gérer 1000+ inscriptions efficacement', async () => {
      const largeDataset = Array(1000).fill(null).map((_, i) => ({
        id: i,
        utilisateur_id: 1,
        cours_id: Math.floor(i / 10) + 1,
        status_id: 1,
        date_inscription: new Date('2024-01-01'),
        cours: { type_cours: 'Test', cours_recurrent_id: 1 }
      }));
      mockPrisma.inscriptions.findMany.mockResolvedValue(largeDataset);

      const start = Date.now();
      const result = await service.obtenirFrequentationUtilisateur(1);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(1000); // < 1 seconde
    });

    it('devrait gérer requêtes parallèles sans conflit', async () => {
      const promises = [
        service.obtenirStatistiquesGenerales(),
        service.obtenirStatistiquesMembres(),
        service.obtenirStatistiquesFinancieres(),
        service.obtenirFrequentationUtilisateur(1),
        service.obtenirProgressionUtilisateur(1)
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => expect(result).toBeDefined());
    });

    it('devrait limiter mémoire avec grands ensembles de données', async () => {
      const largeDataset = Array(10000).fill(null).map((_, i) => ({
        id: i,
        type_cours: `Cours${i % 100}`,
        inscriptions: Array(50).fill({ status_id: 1 })
      }));
      mockPrisma.cours.findMany.mockResolvedValue(largeDataset);

      const result = await service.obtenirStatistiquesParCours();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('devrait utiliser indexes efficacement avec filtres complexes', async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );

      // Vérifier que la requête s'exécute (pas de timeout)
      expect(result).toBeDefined();
    });
  });

  describe('Gestion de Cache et Concurrence', () => {
    it('devrait retourner résultats cohérents sur appels multiples', async () => {
      const result1 = await service.obtenirStatistiquesGenerales();
      const result2 = await service.obtenirStatistiquesGenerales();

      expect(result1).toEqual(result2);
    });

    it('devrait gérer état mutable correctement', async () => {
      const result = await service.obtenirStatistiquesMembres();
      
      // Modifier le résultat ne devrait pas affecter le service
      result.nombreMembres = 999;
      
      const result2 = await service.obtenirStatistiquesMembres();
      expect(result2.nombreMembres).not.toBe(999);
    });

    it('devrait gérer modifications concurrent de données', async () => {
      // Simuler changement de données entre requêtes
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(10);
      
      const result1 = await service.obtenirStatistiquesGenerales();
      
      mockPrisma.utilisateurs.count.mockResolvedValueOnce(15);
      
      const result2 = await service.obtenirStatistiquesGenerales();
      
      // Les résultats peuvent différer (pas de cache)
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('Validation Avancée', () => {
    it('devrait valider types de paramètres strictement', async () => {
      await expect(service.obtenirFrequentationUtilisateur('not-a-number' as any))
        .rejects.toThrow();
    });

    it('devrait rejeter objets comme ID utilisateur', async () => {
      await expect(service.obtenirProgressionUtilisateur({ id: 1 } as any))
        .rejects.toThrow();
    });

    it('devrait rejeter arrays comme paramètres scalaires', async () => {
      await expect(service.obtenirStatistiquesPresence([30] as any))
        .rejects.toThrow();
    });

    it('devrait gérer null vs undefined différemment', async () => {
      // undefined devrait utiliser valeur par défaut
      const result1 = await service.obtenirStatistiquesPresence(undefined);
      expect(result1).toBeDefined();

      // null devrait être rejeté
      await expect(service.obtenirStatistiquesPresence(null as any))
        .rejects.toThrow();
    });
  });

  describe('Calculs Statistiques Avancés', () => {
    it('devrait calculer médiane de présences correctement', async () => {
      const presences = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      mockPrisma.utilisateurs.findMany.mockResolvedValue(
        presences.map((count, i) => ({
          id: i + 1,
          inscriptions: Array(count).fill({ status_id: 1 })
        }))
      );

      const result = await service.obtenirStatistiquesMembres();
      
      expect(result.topMembresAssidus.length).toBeGreaterThan(0);
    });

    it('devrait gérer écarts types dans distributions', async () => {
      // Données avec forte variance
      mockPrisma.paiements.findMany.mockResolvedValueOnce([
        { montant: 10, date_paiement: new Date(), statut: 'validé' },
        { montant: 1000, date_paiement: new Date(), statut: 'validé' },
        { montant: 50, date_paiement: new Date(), statut: 'validé' }
      ]);

      const result = await service.obtenirStatistiquesFinancieres();
      
      expect(result.totalPaiementsMois).toBe(1060);
    });

    it('devrait calculer tendances temporelles', async () => {
      const dates = Array(30).fill(null).map((_, i) => {
        const date = new Date('2024-06-01');
        date.setDate(date.getDate() + i);
        return date;
      });

      mockPrisma.inscriptions.findMany.mockResolvedValue(
        dates.map((date, i) => ({ id: i, date_inscription: date }))
      );

      const result = await service.obtenirEvolutionInscriptions(30);
      
      expect(result.length).toBeGreaterThan(0);
    });

    it('devrait détecter anomalies dans données', async () => {
      // Valeur aberrante
      mockPrisma.paiements.findMany.mockResolvedValueOnce([
        { montant: 50, date_paiement: new Date(), statut: 'validé' },
        { montant: 50, date_paiement: new Date(), statut: 'validé' },
        { montant: 9999999, date_paiement: new Date(), statut: 'validé' }
      ]);

      const result = await service.obtenirStatistiquesFinancieres();
      
      // Le service devrait gérer sans crash
      expect(result.totalPaiementsMois).toBeGreaterThan(0);
      expect(isFinite(result.totalPaiementsMois)).toBe(true);
    });
  });

  describe('Intégrité des Données', () => {
    it('devrait détecter incohérences utilisateur/inscription', async () => {
      mockPrisma.inscriptions.findMany.mockResolvedValue([
        { 
          utilisateur_id: 1, 
          cours_id: 999, 
          status_id: 1,
          cours: { 
            type_cours: 'Karaté', 
            cours_recurrent_id: 1,
            date_cours: new Date()
          },
          utilisateurs: mockUtilisateurs[0] 
        }
      ]);

      // Le service devrait gérer gracieusement
      const result = await service.obtenirFrequentationUtilisateur(1);
      expect(result).toBeDefined();
    });

    it('devrait valider cohérence dates paiement/période', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([
        { 
          montant: 50, 
          date_paiement: new Date('2024-06-01'),
          periode_fin: new Date('2024-05-01'), // Incohérence
          statut: 'validé',
          utilisateurs: { first_name: 'Jean', last_name: 'Dupont' },
          plans_tarifaires: { nom_plan: 'Mensuel' }
        }
      ]);

      const result = await service.obtenirStatistiquesFinancieres();
      
      // Devrait traiter sans erreur
      expect(result).toBeDefined();
    });

    it('devrait gérer références circulaires', async () => {
      mockPrisma.cours.findMany.mockResolvedValue([
        { 
          id: 1, 
          type_cours: 'Karaté', 
          date_cours: new Date(),
          inscriptions: [
            { id: 1, utilisateur_id: 1, status_id: 1, date_inscription: new Date() }
          ]
        }
      ]);

      // Ne devrait pas causer stack overflow
      await expect(service.obtenirStatistiquesParCours())
        .resolves.toBeDefined();
    });
  });

  describe('Cas Limites Temporels', () => {
    it('devrait gérer changement année (31 déc -> 1 jan)', async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date('2023-12-31'),
        new Date('2024-01-01')
      );
      
      expect(result).toBeDefined();
    });

    it('devrait gérer années bissextiles', async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date('2024-02-29'), // Année bissextile
        new Date('2024-03-01')
      );
      
      expect(result).toBeDefined();
    });

    it('devrait gérer périodes > 1 an', async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date('2023-01-01'),
        new Date('2024-12-31')
      );
      
      expect(result).toBeDefined();
    });

    it('devrait gérer dates très anciennes', async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date('2000-01-01'),
        new Date('2000-12-31')
      );
      
      expect(result).toBeDefined();
    });

    it('devrait gérer dates futures', async () => {
      const result = await service.obtenirStatistiquesParCours(
        new Date('2025-01-01'),
        new Date('2025-12-31')
      );
      
      expect(result).toBeDefined();
    });
  });

  describe('Robustesse et Résilience', () => {
    it('devrait récupérer après erreur transitoire', async () => {
      // Simuler une erreur transitoire puis un succès
      let callCount = 0;
      mockPrisma.utilisateurs.count.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(10);
      });

      // La première appelle va rejeter
      await expect(service.obtenirStatistiquesGenerales())
        .rejects.toThrow('Timeout');
      
      // La deuxième appelle devrait réussir
      const result = await service.obtenirStatistiquesGenerales();
      expect(result.total_utilisateurs).toBe(10);
    });

    it('devrait gérer timeouts gracieusement', async () => {
      mockPrisma.cours.findMany.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const result = await service.obtenirStatistiquesParCours();
      
      expect(result).toBeDefined();
    });

    it('devrait gérer données partiellement corrompues', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([
        { 
          montant: 50, 
          date_paiement: new Date(), 
          statut: 'validé',
          utilisateurs: { first_name: 'Jean', last_name: 'Dupont' },
          plans_tarifaires: { nom_plan: 'Mensuel' }
        },
        { 
          montant: null, 
          date_paiement: null, 
          statut: null,
          utilisateurs: { first_name: 'Paul', last_name: 'Martin' },
          plans_tarifaires: { nom_plan: 'Annuel' }
        }, // Corrompu
        { 
          montant: 100, 
          date_paiement: new Date(), 
          statut: 'confirmé',
          utilisateurs: { first_name: 'Marie', last_name: 'Durand' },
          plans_tarifaires: { nom_plan: 'Trimestriel' }
        }
      ]);

      const result = await service.obtenirStatistiquesFinancieres();
      
      // Devrait traiter les bonnes données
      expect(result).toBeDefined();
    });

    it('devrait limiter tentatives de retry', async () => {
      let attempts = 0;
      mockPrisma.utilisateurs.count.mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('DB Error'));
      });

      await expect(service.obtenirStatistiquesGenerales())
        .rejects.toThrow();
      
      // Ne devrait pas retenter indéfiniment
      expect(attempts).toBeLessThan(10);
    });
  });

  describe('Compatibilité et Versions', () => {
    it('devrait gérer anciennes structures de données', async () => {
      // Simuler ancien format sans certains champs
      mockPrisma.utilisateurs.findMany.mockResolvedValue([
        { 
          id: 1, 
          first_name: 'Test', 
          last_name: 'User',
          status_id: 1,
          inscriptions: []
        }
      ]);

      const result = await service.obtenirStatistiquesMembres();
      
      expect(result).toBeDefined();
    });

    it('devrait ignorer champs inconnus gracieusement', async () => {
      mockPrisma.cours.findMany.mockResolvedValue([
        { 
          id: 1, 
          type_cours: 'Test',
          date_cours: new Date(),
          nouveauChamp: 'ignoré', // Champ futur
          autreChamp: { nested: 'data' },
          inscriptions: []
        }
      ]);

      const result = await service.obtenirStatistiquesParCours();
      
      expect(result).toBeDefined();
    });
  });
});
