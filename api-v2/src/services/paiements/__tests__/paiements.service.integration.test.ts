/**
 * Tests d'intégration pour le service Paiements
 * Teste les flux complets et interactions entre méthodes
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
  mockEcheance
} from './paiements.mock.js';

describe('PaiementsService - Tests d\'Intégration', () => {
  let paiementsService: PaiementsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    paiementsService = new PaiementsService(mockPrisma);
  });

  // ============================================
  // FLUX COMPLET - CRÉATION ET VALIDATION
  // ============================================

  describe('Flux: Création et validation d\'un paiement', () => {
    it('devrait créer un paiement puis le valider', async () => {
      // Étape 1: Créer un paiement
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.commandes.findUnique.mockResolvedValue(mockCommande);
      mockPrisma.paiements.create.mockResolvedValue(mockPaiement);

      const nouveauPaiement = await paiementsService.creerPaiement({
        commandeId: 1,
        utilisateurId: 1,
        montant: 150,
        methodePaiement: 'stripe' as any,
        datePaiement: new Date()
      });

      expect(nouveauPaiement.statut).toBe('en attente');
      expect(nouveauPaiement.date_confirmation).toBeNull();

      // Étape 2: Valider le paiement
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé',
        date_confirmation: new Date()
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const paiementValide = await paiementsService.validerPaiement({
        paiementId: 1,
        referenceTransaction: 'REF-123'
      });

      expect(paiementValide.statut).toBe('validé');
      expect(paiementValide.date_confirmation).not.toBeNull();
    });
  });

  // ============================================
  // FLUX COMPLET - ABONNEMENT
  // ============================================

  describe('Flux: Gestion d\'un abonnement', () => {
    it('devrait créer un paiement d\'abonnement et mettre à jour l\'échéance', async () => {
      // Créer le paiement d'abonnement
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(mockAbonnement);
      mockPrisma.paiements.findFirst.mockResolvedValue(null);
      
      const paiementAbonnement = {
        ...mockPaiement,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01'),
        periode_fin: new Date('2026-01-31')
      };
      
      mockPrisma.paiements.create.mockResolvedValue(paiementAbonnement);

      const paiement = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 50,
        methodePaiement: 'paypal' as any,
        datePaiement: new Date('2026-01-01'),
        abonnementId: 1,
        periodeDebut: new Date('2026-01-01'),
        periodeFin: new Date('2026-01-31')
      });

      expect(paiement.abonnement_id).toBe(1);

      // Valider le paiement et mettre à jour l'échéance
      mockPrisma.paiements.findUnique.mockResolvedValue(paiementAbonnement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...paiementAbonnement,
        statut: 'validé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 1 });

      await paiementsService.validerPaiement({ paiementId: 1 });

      // Vérifier que l'échéance a été mise à jour
      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(1);
      const updateCall = mockPrisma.echeances_paiements.updateMany.mock.calls[0][0];
      expect(updateCall.data.statut).toBe('payé');
    });

    it('devrait annuler un paiement validé et restaurer l\'échéance', async () => {
      const paiementValideAbonnement = {
        ...mockPaiementValide,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01'),
        statut: 'validé'
      };

      mockPrisma.paiements.findUnique.mockResolvedValue(paiementValideAbonnement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...paiementValideAbonnement,
        statut: 'annulé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 1 });

      await paiementsService.annulerPaiement(2, 'Test annulation');

      // Vérifier que l'échéance a été remise en attente
      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(1);
      const updateCall = mockPrisma.echeances_paiements.updateMany.mock.calls[0][0];
      expect(updateCall.data.statut).toBe('en attente');
      expect(updateCall.data.date_paiement).toBeNull();
    });
  });

  // ============================================
  // FLUX COMPLET - STATISTIQUES
  // ============================================

  describe('Flux: Calcul des statistiques', () => {
    it('devrait calculer les statistiques après plusieurs paiements', async () => {
      const paiements = [
        mockPaiement,
        mockPaiementValide,
        { ...mockPaiement, id: 3, statut: 'refusé' }
      ];

      mockPrisma.paiements.findMany.mockResolvedValue(paiements);

      const stats = await paiementsService.statistiquesGenerales();

      expect(stats.totalPaiements).toBe(3);
      expect(stats.paiementsValides).toBeGreaterThanOrEqual(1);
      expect(stats.paiementsRefuses).toBeGreaterThanOrEqual(1);
      expect(stats.montantTotal).toBeGreaterThan(0);
    });

    it('devrait calculer les statistiques utilisateur après paiements', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement, mockPaiementValide]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(2);

      const stats = await paiementsService.statistiquesUtilisateur(1);

      expect(stats.utilisateurId).toBe(1);
      expect(stats.totalPaiements).toBe(2);
      expect(stats.paiementsEnRetard).toBe(2);
    });
  });

  // ============================================
  // FLUX COMPLET - REMBOURSEMENT
  // ============================================

  describe('Flux: Validation puis remboursement', () => {
    it('devrait valider un paiement puis le rembourser', async () => {
      // Valider
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue(mockPaiementValide);
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const paiementValide = await paiementsService.validerPaiement({ paiementId: 1 });
      expect(paiementValide.statut).toBe('validé');

      // Rembourser
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiementValide);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiementValide,
        statut: 'remboursé'
      });

      const paiementRembourse = await paiementsService.rembourserPaiement(2, 'Client insatisfait');
      expect(paiementRembourse.statut).toBe('remboursé');
    });
  });

  // ============================================
  // FLUX COMPLET - RECHERCHE ET FILTRAGE
  // ============================================

  describe('Flux: Recherche et filtrage complexe', () => {
    it('devrait filtrer par utilisateur et statut', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiementValide]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirPaiements({
        utilisateurId: 1,
        statut: 'validé'
      });

      expect(result.paiements).toHaveLength(1);
      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
      expect(whereClause.statut).toBe('validé');
    });

    it('devrait filtrer par période et méthode de paiement', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirPaiements({
        dateDebut: new Date('2026-01-01'),
        dateFin: new Date('2026-01-31'),
        methodePaiement: 'stripe'
      });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.date_paiement).toBeDefined();
      expect(whereClause.methode_paiement).toBe('stripe');
    });
  });

  // ============================================
  // FLUX COMPLET - ÉCHÉANCES
  // ============================================

  describe('Flux: Gestion des échéances', () => {
    it('devrait récupérer les échéances à venir d\'un utilisateur', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirEcheancesUtilisateur(1);

      expect(result.echeances).toHaveLength(1);
      expect(result.echeances[0].statut).toBe('en attente');
    });

    it('devrait récupérer toutes les échéances échues', async () => {
      const echeanceEchue = { ...mockEcheance, statut: 'échu', date_echeance: new Date('2025-12-01') };
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([echeanceEchue]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirEcheancesEchues();

      expect(result.echeances).toHaveLength(1);
      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.statut).toBe('échu');
    });
  });

  // ============================================
  // FLUX COMPLET - MÉTHODES UTILITAIRES
  // ============================================

  describe('Flux: Utilisation des méthodes utilitaires', () => {
    it('devrait vérifier l\'existence puis récupérer le paiement', async () => {
      mockPrisma.paiements.findUnique
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(mockPaiement);

      const existe = await paiementsService.paiementExiste(1);
      expect(existe).toBe(true);

      const paiement = await paiementsService.obtenirPaiementParId(1);
      expect(paiement?.id).toBe(1);
    });

    it('devrait vérifier les paiements en attente puis les récupérer', async () => {
      mockPrisma.paiements.count.mockResolvedValue(2);
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(2);

      const aEnAttente = await paiementsService.aDesPaiementsEnAttente(1);
      expect(aEnAttente).toBe(true);

      const result = await paiementsService.obtenirPaiementsUtilisateur({
        utilisateurId: 1,
        statut: 'en attente'
      });
      expect(result.paiements.length).toBeGreaterThan(0);
    });

    it('devrait calculer le montant total puis compter les paiements valides', async () => {
      mockPrisma.paiements.aggregate.mockResolvedValue({ _sum: { montant: 500 } });
      mockPrisma.paiements.count.mockResolvedValue(10);

      const montantTotal = await paiementsService.obtenirMontantTotalUtilisateur(1);
      expect(montantTotal).toBe(500);

      const nombrePaiements = await paiementsService.compterPaiementsValides(1);
      expect(nombrePaiements).toBe(10);
    });
  });
});
