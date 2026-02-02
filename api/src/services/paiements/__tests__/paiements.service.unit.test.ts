/**
 * Tests unitaires pour le service Paiements
 * Couvre 26+ méthodes du service
 */

import { PaiementsService } from '../paiements.service.js';
import { PaiementsError } from '@clubmanager/types';
import {
  createMockPrisma,
  mockUtilisateur,
  mockCommande,
  mockAbonnement,
  mockPaiement,
  mockPaiementValide,
  mockPaiementAbonnement,
  mockEcheance,
  mockEcheanceEchue,
  mockEcheancePayee,
  formatPaiement,
  formatEcheance
} from './paiements.mock.js';

describe('PaiementsService - Tests Unitaires', () => {
  let paiementsService: PaiementsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    paiementsService = new PaiementsService(mockPrisma);
  });

  afterEach(() => {
    // Réinitialiser les mocks
    Object.values(mockPrisma.paiements).forEach((fn: any) => fn.mockReset?.());
    Object.values(mockPrisma.echeances_paiements).forEach((fn: any) => fn.mockReset?.());
    Object.values(mockPrisma.utilisateurs).forEach((fn: any) => fn.mockReset?.());
  });

  // ============================================
  // QUERIES - PAIEMENTS
  // ============================================

  describe('obtenirPaiements', () => {
    it('devrait récupérer tous les paiements avec pagination', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement, mockPaiementValide]);
      mockPrisma.paiements.count.mockResolvedValue(2);

      const result = await paiementsService.obtenirPaiements({});

      expect(result.paiements).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
      expect(mockPrisma.paiements.findMany.mock.calls.length).toBe(1);
      expect(mockPrisma.paiements.count.mock.calls.length).toBe(1);
    });

    it('devrait filtrer les paiements par utilisateur', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirPaiements({ utilisateurId: 1 });

      expect(result.paiements).toHaveLength(1);
      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
    });

    it('devrait filtrer les paiements par statut', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiementValide]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirPaiements({ statut: 'validé' });

      expect(result.paiements).toHaveLength(1);
      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.statut).toBe('validé');
    });

    it('devrait filtrer par méthode de paiement', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirPaiements({ methodePaiement: 'stripe' });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.methode_paiement).toBe('stripe');
    });

    it('devrait gérer la pagination', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(100);

      const result = await paiementsService.obtenirPaiements({ limit: 10, offset: 20 });

      expect(result.hasMore).toBe(true);
      const callArgs = mockPrisma.paiements.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(10);
      expect(callArgs.skip).toBe(20);
    });
  });

  describe('obtenirPaiementParId', () => {
    it('devrait récupérer un paiement par son ID', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);

      const result = await paiementsService.obtenirPaiementParId(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.montant).toBe(150);
      expect(mockPrisma.paiements.findUnique.mock.calls[0][0].where.id).toBe(1);
    });

    it('devrait retourner null si le paiement n\'existe pas', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      const result = await paiementsService.obtenirPaiementParId(999);

      expect(result).toBeNull();
    });

    it('devrait inclure les relations utilisateur, commande et abonnement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);

      const result = await paiementsService.obtenirPaiementParId(1);

      expect(result?.utilisateur).toBeDefined();
      expect(result?.utilisateur?.email).toBe('jean.dupont@example.com');
      expect(result?.commande).toBeDefined();
      expect(result?.commande?.numero_commande).toBe('CMD-2026-001');
    });
  });

  describe('obtenirPaiementsUtilisateur', () => {
    it('devrait récupérer les paiements d\'un utilisateur', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement, mockPaiementAbonnement]);
      mockPrisma.paiements.count.mockResolvedValue(2);

      const result = await paiementsService.obtenirPaiementsUtilisateur({
        utilisateurId: 1
      });

      expect(result.paiements).toHaveLength(2);
      expect(result.total).toBe(2);
      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
    });

    it('devrait filtrer par statut pour un utilisateur', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiementValide]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirPaiementsUtilisateur({
        utilisateurId: 1,
        statut: 'validé'
      });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
      expect(whereClause.statut).toBe('validé');
    });
  });

  // ============================================
  // QUERIES - ÉCHÉANCES
  // ============================================

  describe('obtenirEcheances', () => {
    it('devrait récupérer toutes les échéances', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance, mockEcheanceEchue]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(2);

      const result = await paiementsService.obtenirEcheances({});

      expect(result.echeances).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(mockPrisma.echeances_paiements.findMany.mock.calls.length).toBe(1);
    });

    it('devrait filtrer les échéances par utilisateur', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirEcheances({ utilisateurId: 1 });

      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
    });

    it('devrait filtrer les échéances par statut', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheanceEchue]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirEcheances({ statut: 'échu' });

      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.statut).toBe('échu');
    });
  });

  describe('obtenirEcheancesUtilisateur', () => {
    it('devrait récupérer les échéances d\'un utilisateur', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirEcheancesUtilisateur(1);

      expect(result.echeances).toHaveLength(1);
      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
    });

    it('devrait respecter la limite spécifiée', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirEcheancesUtilisateur(1, 10);

      const callArgs = mockPrisma.echeances_paiements.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(10);
    });
  });

  describe('obtenirEcheancesEchues', () => {
    it('devrait récupérer uniquement les échéances échues', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheanceEchue]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirEcheancesEchues();

      expect(result.echeances).toHaveLength(1);
      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.statut).toBe('échu');
      expect(whereClause.date_echeance).toBeDefined();
      expect(whereClause.date_echeance.lte).toBeDefined();
    });
  });

  // ============================================
  // MUTATIONS
  // ============================================

  describe('creerPaiement', () => {
    it('devrait créer un nouveau paiement', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.commandes.findUnique.mockResolvedValue(mockCommande);
      mockPrisma.paiements.create.mockResolvedValue(mockPaiement);

      const input = {
        commandeId: 1,
        utilisateurId: 1,
        montant: 150,
        methodePaiement: 'stripe' as any,
        datePaiement: new Date('2026-01-15')
      };

      const result = await paiementsService.creerPaiement(input);

      expect(result).toBeDefined();
      expect(result.montant).toBe(150);
      expect(mockPrisma.paiements.create.mock.calls.length).toBe(1);
    });

    it('devrait créer un paiement pour abonnement', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(mockAbonnement);
      mockPrisma.paiements.findFirst.mockResolvedValue(null);
      mockPrisma.paiements.create.mockResolvedValue(mockPaiementAbonnement);

      const input = {
        utilisateurId: 1,
        montant: 50,
        methodePaiement: 'paypal' as any,
        datePaiement: new Date('2026-01-01'),
        abonnementId: 1,
        periodeDebut: new Date('2026-01-01'),
        periodeFin: new Date('2026-01-31')
      };

      const result = await paiementsService.creerPaiement(input);

      expect(result.abonnement_id).toBe(1);
      expect(result.montant).toBe(50);
    });
  });

  describe('validerPaiement', () => {
    it('devrait valider un paiement en attente', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé',
        date_confirmation: new Date()
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const input = {
        paiementId: 1,
        referenceTransaction: 'REF-123'
      };

      const result = await paiementsService.validerPaiement(input);

      expect(result.statut).toBe('validé');
      expect(mockPrisma.paiements.update.mock.calls.length).toBe(1);
    });

    it('devrait mettre à jour l\'échéance associée', async () => {
      const paiementAvecEcheance = {
        ...mockPaiement,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01')
      };
      
      mockPrisma.paiements.findUnique.mockResolvedValue(paiementAvecEcheance);
      mockPrisma.paiements.update.mockResolvedValue({
        ...paiementAvecEcheance,
        statut: 'validé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 1 });

      await paiementsService.validerPaiement({ paiementId: 1 });

      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(1);
      const whereClause = mockPrisma.echeances_paiements.updateMany.mock.calls[0][0].where;
      expect(whereClause.statut).toBe('en attente');
    });
  });

  describe('refuserPaiement', () => {
    it('devrait refuser un paiement en attente', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'refusé',
        description: `${mockPaiement.description} - Motif: Fonds insuffisants`
      });

      const result = await paiementsService.refuserPaiement(1, 'Fonds insuffisants');

      expect(result.statut).toBe('refusé');
      expect(result.description).toContain('Fonds insuffisants');
    });
  });

  describe('annulerPaiement', () => {
    it('devrait annuler un paiement en attente', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé',
        description: `${mockPaiement.description} - Motif: Annulation client`
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const result = await paiementsService.annulerPaiement(1, 'Annulation client');

      expect(result.statut).toBe('annulé');
      expect(result.description).toContain('Annulation client');
    });

    it('devrait remettre l\'échéance en attente si paiement était validé', async () => {
      const paiementValideAvecEcheance = {
        ...mockPaiementValide,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01')
      };

      mockPrisma.paiements.findUnique.mockResolvedValue(paiementValideAvecEcheance);
      mockPrisma.paiements.update.mockResolvedValue({
        ...paiementValideAvecEcheance,
        statut: 'annulé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 1 });

      await paiementsService.annulerPaiement(2);

      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(1);
      const dataClause = mockPrisma.echeances_paiements.updateMany.mock.calls[0][0].data;
      expect(dataClause.statut).toBe('en attente');
      expect(dataClause.date_paiement).toBeNull();
    });
  });

  describe('rembourserPaiement', () => {
    it('devrait rembourser un paiement validé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiementValide);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiementValide,
        statut: 'remboursé',
        description: `${mockPaiementValide.description} - Motif: Produit non conforme`
      });

      const result = await paiementsService.rembourserPaiement(2, 'Produit non conforme');

      expect(result.statut).toBe('remboursé');
      expect(result.description).toContain('Produit non conforme');
    });
  });

  // ============================================
  // STATISTIQUES
  // ============================================

  describe('statistiquesGenerales', () => {
    it('devrait calculer les statistiques générales', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([
        mockPaiement,
        mockPaiementValide,
        mockPaiementAbonnement
      ]);

      const result = await paiementsService.statistiquesGenerales();

      expect(result.totalPaiements).toBe(3);
      expect(result.montantTotal).toBeGreaterThan(0);
      expect(result.paiementsValides).toBeGreaterThanOrEqual(0);
      expect(result.moyenneMontant).toBeGreaterThan(0);
    });

    it('devrait filtrer par période', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);

      await paiementsService.statistiquesGenerales(
        new Date('2026-01-01'),
        new Date('2026-01-31')
      );

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.date_paiement).toBeDefined();
      expect(whereClause.date_paiement.gte).toBeDefined();
      expect(whereClause.date_paiement.lte).toBeDefined();
    });
  });

  describe('statistiquesUtilisateur', () => {
    it('devrait calculer les statistiques d\'un utilisateur', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement, mockPaiementValide]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await paiementsService.statistiquesUtilisateur(1);

      expect(result.utilisateurId).toBe(1);
      expect(result.totalPaiements).toBe(2);
      expect(result.montantTotal).toBeGreaterThan(0);
      expect(result.paiementsEnRetard).toBe(1);
    });
  });

  // ============================================
  // MÉTHODES UTILITAIRES
  // ============================================

  describe('paiementExiste', () => {
    it('devrait retourner true si le paiement existe', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({ id: 1 });

      const result = await paiementsService.paiementExiste(1);

      expect(result).toBe(true);
    });

    it('devrait retourner false si le paiement n\'existe pas', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      const result = await paiementsService.paiementExiste(999);

      expect(result).toBe(false);
    });
  });

  describe('aDesPaiementsEnAttente', () => {
    it('devrait retourner true si des paiements sont en attente', async () => {
      mockPrisma.paiements.count.mockResolvedValue(2);

      const result = await paiementsService.aDesPaiementsEnAttente(1);

      expect(result).toBe(true);
    });

    it('devrait retourner false si aucun paiement en attente', async () => {
      mockPrisma.paiements.count.mockResolvedValue(0);

      const result = await paiementsService.aDesPaiementsEnAttente(1);

      expect(result).toBe(false);
    });
  });

  describe('obtenirMontantTotalUtilisateur', () => {
    it('devrait calculer le montant total payé', async () => {
      mockPrisma.paiements.aggregate.mockResolvedValue({
        _sum: { montant: 500 }
      });

      const result = await paiementsService.obtenirMontantTotalUtilisateur(1);

      expect(result).toBe(500);
    });

    it('devrait retourner 0 si aucun paiement', async () => {
      mockPrisma.paiements.aggregate.mockResolvedValue({
        _sum: { montant: null }
      });

      const result = await paiementsService.obtenirMontantTotalUtilisateur(1);

      expect(result).toBe(0);
    });
  });

  describe('compterPaiementsValides', () => {
    it('devrait compter les paiements valides', async () => {
      mockPrisma.paiements.count.mockResolvedValue(5);

      const result = await paiementsService.compterPaiementsValides(1);

      expect(result).toBe(5);
    });
  });

  describe('obtenirDernierPaiement', () => {
    it('devrait récupérer le dernier paiement', async () => {
      mockPrisma.paiements.findFirst.mockResolvedValue(mockPaiementValide);

      const result = await paiementsService.obtenirDernierPaiement(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(2);
      const callArgs = mockPrisma.paiements.findFirst.mock.calls[0][0];
      expect(callArgs.orderBy.date_paiement).toBe('desc');
    });

    it('devrait retourner null si aucun paiement', async () => {
      mockPrisma.paiements.findFirst.mockResolvedValue(null);

      const result = await paiementsService.obtenirDernierPaiement(999);

      expect(result).toBeNull();
    });
  });
});
