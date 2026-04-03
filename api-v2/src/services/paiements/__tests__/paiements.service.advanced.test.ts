/**
 * Tests avancés pour le service Paiements
 * Performance, cas limites, scénarios complexes
 */

import { PaiementsService } from '../paiements.service.js';
import { PaiementsError } from '@clubmanager/types';
import {
  createMockPrisma,
  mockUtilisateur,
  mockPaiement,
  mockPaiementValide,
  mockEcheance
} from './paiements.mock.js';

describe('PaiementsService - Tests Avancés', () => {
  let paiementsService: PaiementsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    paiementsService = new PaiementsService(mockPrisma);
  });

  // ============================================
  // PERFORMANCE
  // ============================================

  describe('Tests de performance', () => {
    it('devrait gérer de grands volumes de paiements', async () => {
      const largeBatch = Array(1000).fill(mockPaiement).map((p, i) => ({
        ...p,
        id: i + 1
      }));

      mockPrisma.paiements.findMany.mockResolvedValue(largeBatch);
      mockPrisma.paiements.count.mockResolvedValue(1000);

      const startTime = Date.now();
      const result = await paiementsService.obtenirPaiements({ limit: 1000 });
      const executionTime = Date.now() - startTime;

      expect(result.paiements.length).toBe(1000);
      expect(executionTime).toBeLessThan(1000); // Moins d'1 seconde
    });

    it('devrait calculer les statistiques efficacement', async () => {
      const manyPaiements = Array(500).fill(mockPaiement).map((p, i) => ({
        ...p,
        id: i + 1,
        montant: 100 + i,
        statut: i % 3 === 0 ? 'validé' : i % 3 === 1 ? 'en attente' : 'refusé',
        methode_paiement: i % 2 === 0 ? 'stripe' : 'paypal'
      }));

      mockPrisma.paiements.findMany.mockResolvedValue(manyPaiements);

      const startTime = Date.now();
      const result = await paiementsService.statistiquesGenerales();
      const executionTime = Date.now() - startTime;

      expect(result.totalPaiements).toBe(500);
      expect(result.repartitionMethodes).toBeDefined();
      expect(executionTime).toBeLessThan(500);
    });

    it('devrait paginer efficacement les résultats', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(10000);

      // Requêtes multiples avec pagination
      for (let i = 0; i < 10; i++) {
        await paiementsService.obtenirPaiements({
          limit: 50,
          offset: i * 50
        });
      }

      expect(mockPrisma.paiements.findMany.mock.calls.length).toBe(10);
    });
  });

  // ============================================
  // CAS LIMITES
  // ============================================

  describe('Cas limites et edge cases', () => {
    it('devrait gérer un montant de 0.01 (minimum)', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        montant: 0.01
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 0.01,
        datePaiement: new Date()
      });

      expect(result.montant).toBe(0.01);
    });

    it('devrait gérer un montant de 999999.99 (maximum)', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        montant: 999999.99
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 999999.99,
        datePaiement: new Date()
      });

      expect(result.montant).toBe(999999.99);
    });

    it('devrait gérer des dates très anciennes', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.paiements.count.mockResolvedValue(0);

      const result = await paiementsService.obtenirPaiements({
        dateDebut: new Date('1900-01-01'),
        dateFin: new Date('1900-12-31')
      });

      expect(result.paiements).toHaveLength(0);
    });

    it('devrait gérer des dates futures', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.paiements.count.mockResolvedValue(0);

      const result = await paiementsService.obtenirPaiements({
        dateDebut: new Date('2099-01-01'),
        dateFin: new Date('2099-12-31')
      });

      expect(result.paiements).toHaveLength(0);
    });

    it('devrait gérer des utilisateurs sans paiements', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(0);

      const result = await paiementsService.statistiquesUtilisateur(999);

      expect(result.totalPaiements).toBe(0);
      expect(result.montantTotal).toBe(0);
      expect(result.moyenneMontant).toBe(0);
      expect(result.dernierPaiement).toBeNull();
    });
  });

  // ============================================
  // SCÉNARIOS COMPLEXES
  // ============================================

  describe('Scénarios complexes métier', () => {
    it('devrait gérer un cycle complet de paiement récurrent', async () => {
      // Mois 1: Créer paiement
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.paiements.findFirst.mockResolvedValue(null);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01'),
        periode_fin: new Date('2026-01-31')
      });

      const paiement1 = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 50,
        datePaiement: new Date('2026-01-01'),
        abonnementId: 1,
        periodeDebut: new Date('2026-01-01'),
        periodeFin: new Date('2026-01-31')
      });

      expect(paiement1.abonnement_id).toBe(1);

      // Mois 2: Nouveau paiement
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        id: 2,
        abonnement_id: 1,
        periode_debut: new Date('2026-02-01'),
        periode_fin: new Date('2026-02-28')
      });

      const paiement2 = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 50,
        datePaiement: new Date('2026-02-01'),
        abonnementId: 1,
        periodeDebut: new Date('2026-02-01'),
        periodeFin: new Date('2026-02-28')
      });

      expect(paiement2.id).not.toBe(paiement1.id);
    });

    it('devrait gérer des changements de statut multiples', async () => {
      // État initial: en attente
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);

      // Valider
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      await paiementsService.validerPaiement({ paiementId: 1 });

      // Tenter d'annuler après validation
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });

      await paiementsService.annulerPaiement(1);

      expect(mockPrisma.paiements.update.mock.calls.length).toBe(2);
    });

    it('devrait gérer des paiements multiples pour une commande', async () => {
      const commande = { ...mockPaiement, commande_id: 1, montant: 50 };
      
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.commandes.findUnique.mockResolvedValue({ id: 1, montant_total: 150 });

      // Premier paiement partiel
      mockPrisma.paiements.create.mockResolvedValueOnce({
        ...commande,
        id: 1,
        montant: 50
      });

      const paiement1 = await paiementsService.creerPaiement({
        commandeId: 1,
        utilisateurId: 1,
        montant: 50,
        datePaiement: new Date()
      });

      // Deuxième paiement partiel
      mockPrisma.paiements.create.mockResolvedValueOnce({
        ...commande,
        id: 2,
        montant: 50
      });

      const paiement2 = await paiementsService.creerPaiement({
        commandeId: 1,
        utilisateurId: 1,
        montant: 50,
        datePaiement: new Date()
      });

      // Troisième paiement final
      mockPrisma.paiements.create.mockResolvedValueOnce({
        ...commande,
        id: 3,
        montant: 50
      });

      const paiement3 = await paiementsService.creerPaiement({
        commandeId: 1,
        utilisateurId: 1,
        montant: 50,
        datePaiement: new Date()
      });

      expect(paiement1.commande_id).toBe(1);
      expect(paiement2.commande_id).toBe(1);
      expect(paiement3.commande_id).toBe(1);
    });
  });

  // ============================================
  // CALCULS COMPLEXES
  // ============================================

  describe('Calculs statistiques complexes', () => {
    it('devrait calculer correctement la moyenne avec décimales', async () => {
      const paiements = [
        { ...mockPaiement, montant: 33.33 },
        { ...mockPaiement, montant: 66.67 },
        { ...mockPaiement, montant: 100.00 }
      ];

      mockPrisma.paiements.findMany.mockResolvedValue(paiements);

      const result = await paiementsService.statistiquesGenerales();

      expect(result.moyenneMontant).toBeCloseTo(66.67, 2);
    });

    it('devrait grouper correctement par mois', async () => {
      const paiements = [
        { ...mockPaiement, date_paiement: new Date('2026-01-15'), montant: 100 },
        { ...mockPaiement, date_paiement: new Date('2026-01-20'), montant: 150 },
        { ...mockPaiement, date_paiement: new Date('2026-02-10'), montant: 200 }
      ];

      mockPrisma.paiements.findMany.mockResolvedValue(paiements);

      const result = await paiementsService.statistiquesParPeriode(
        new Date('2026-01-01'),
        new Date('2026-02-28'),
        'mois'
      );

      expect(result.donnees.length).toBe(2);
      expect(result.donnees[0].periode).toBe('2026-01');
      expect(result.donnees[1].periode).toBe('2026-02');
    });

    it('devrait calculer les statistiques par méthode de paiement', async () => {
      const paiements = [
        { ...mockPaiement, methode_paiement: 'stripe', montant: 100 },
        { ...mockPaiement, methode_paiement: 'stripe', montant: 150 },
        { ...mockPaiement, methode_paiement: 'paypal', montant: 200 },
        { ...mockPaiement, methode_paiement: null, montant: 50 }
      ];

      mockPrisma.paiements.findMany.mockResolvedValue(paiements);

      const result = await paiementsService.statistiquesGenerales();

      expect(result.repartitionMethodes).toBeDefined();
      const stripeStats = result.repartitionMethodes?.find(r => r.methode === 'stripe');
      expect(stripeStats?.count).toBe(2);
      expect(stripeStats?.montantTotal).toBe(250);
    });
  });

  // ============================================
  // GESTION DE LA CONCURRENCE
  // ============================================

  describe('Concurrence et opérations simultanées', () => {
    it('devrait gérer plusieurs validations simultanées', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      // Simuler 3 validations simultanées
      const promises = [
        paiementsService.validerPaiement({ paiementId: 1 }),
        paiementsService.validerPaiement({ paiementId: 2 }),
        paiementsService.validerPaiement({ paiementId: 3 })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(mockPrisma.paiements.update.mock.calls.length).toBe(3);
    });

    it('devrait gérer plusieurs créations simultanées', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockResolvedValue(mockPaiement);

      const promises = Array(5).fill(null).map((_, i) => 
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 100 + i,
          datePaiement: new Date()
        })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
    });
  });

  // ============================================
  // RÉCUPÉRATION D'ERREURS
  // ============================================

  describe('Récupération après erreurs', () => {
    it('devrait pouvoir recréer un paiement après échec', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      
      // Premier échec
      mockPrisma.paiements.create.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 100,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Network error');

      // Deuxième tentative réussie
      mockPrisma.paiements.create.mockResolvedValue(mockPaiement);

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 100,
        datePaiement: new Date()
      });

      expect(result).toBeDefined();
    });

    it('devrait maintenir la cohérence après erreur de validation', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockRejectedValueOnce(new Error('Lock timeout'));

      await expect(
        paiementsService.validerPaiement({ paiementId: 1 })
      ).rejects.toThrow('Lock timeout');

      // Le paiement devrait toujours être en attente
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      const paiement = await paiementsService.obtenirPaiementParId(1);
      expect(paiement?.statut).toBe('en attente');
    });
  });
});
