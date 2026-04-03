/**
 * Tests de couverture complète pour le service Paiements
 * Couvre tous les cas limites, branches et combinaisons pour atteindre 100%
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

describe('PaiementsService - Couverture 100%', () => {
  let paiementsService: PaiementsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    paiementsService = new PaiementsService(mockPrisma);
  });

  // ============================================
  // BRANCHES CONDITIONNELLES - obtenirPaiements
  // ============================================

  describe('obtenirPaiements - Toutes les combinaisons de filtres', () => {
    it('devrait filtrer avec dateDebut SANS dateFin', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirPaiements({
        dateDebut: new Date('2026-01-01')
      });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.date_paiement).toBeDefined();
      expect(whereClause.date_paiement.gte).toBeDefined();
      expect(whereClause.date_paiement.lte).toBeUndefined();
    });

    it('devrait filtrer avec dateFin SANS dateDebut', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirPaiements({
        dateFin: new Date('2026-01-31')
      });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.date_paiement).toBeDefined();
      expect(whereClause.date_paiement.gte).toBeUndefined();
      expect(whereClause.date_paiement.lte).toBeDefined();
    });

    it('devrait combiner TOUS les filtres ensemble', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirPaiements({
        utilisateurId: 1,
        statut: 'validé',
        dateDebut: new Date('2026-01-01'),
        dateFin: new Date('2026-01-31'),
        methodePaiement: 'stripe',
        abonnementId: 1,
        limit: 20,
        offset: 10
      });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
      expect(whereClause.statut).toBe('validé');
      expect(whereClause.methode_paiement).toBe('stripe');
      expect(whereClause.abonnement_id).toBe(1);
      expect(whereClause.date_paiement).toBeDefined();
    });

    it('devrait utiliser les valeurs par défaut pour limit et offset', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.paiements.count.mockResolvedValue(0);

      await paiementsService.obtenirPaiements({});

      const callArgs = mockPrisma.paiements.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(50); // valeur par défaut
      expect(callArgs.skip).toBe(0); // valeur par défaut
    });
  });

  // ============================================
  // RELATIONS NULL/UNDEFINED
  // ============================================

  describe('Relations Prisma null/undefined', () => {
    it('devrait gérer utilisateurs = null', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        utilisateurs: null
      });

      const result = await paiementsService.obtenirPaiementParId(1);

      expect(result?.utilisateur).toBeUndefined();
    });

    it('devrait gérer commandes = null', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        commandes: null
      });

      const result = await paiementsService.obtenirPaiementParId(1);

      expect(result?.commande).toBeUndefined();
    });

    it('devrait gérer plans_tarifaires = null', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        plans_tarifaires: null
      });

      const result = await paiementsService.obtenirPaiementParId(1);

      expect(result?.abonnement).toBeUndefined();
    });

    it('devrait gérer TOUTES les relations null en même temps', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        utilisateurs: null,
        commandes: null,
        plans_tarifaires: null
      });

      const result = await paiementsService.obtenirPaiementParId(1);

      expect(result?.utilisateur).toBeUndefined();
      expect(result?.commande).toBeUndefined();
      expect(result?.abonnement).toBeUndefined();
    });

    it('devrait gérer les relations null dans obtenirDernierPaiement', async () => {
      mockPrisma.paiements.findFirst.mockResolvedValue({
        ...mockPaiement,
        utilisateurs: null,
        commandes: null,
        plans_tarifaires: null
      });

      const result = await paiementsService.obtenirDernierPaiement(1);

      expect(result?.utilisateur).toBeUndefined();
      expect(result?.commande).toBeUndefined();
      expect(result?.abonnement).toBeUndefined();
    });
  });

  // ============================================
  // TOUTES LES MÉTHODES DE PAIEMENT
  // ============================================

  describe('Toutes les méthodes de paiement', () => {
    beforeEach(() => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
    });

    it('devrait créer un paiement avec PayPal', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        methode_paiement: 'paypal',
        paypal_order_id: 'PAYPAL-ORDER-123'
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 100,
        methodePaiement: 'paypal' as any,
        paypalOrderId: 'PAYPAL-ORDER-123',
        datePaiement: new Date()
      });

      expect(result.methode_paiement).toBe('paypal');
      expect(result.paypal_order_id).toBe('PAYPAL-ORDER-123');
    });

    it('devrait créer un paiement avec Bitcoin', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        methode_paiement: 'bitcoin',
        bitcoin_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 100,
        methodePaiement: 'bitcoin' as any,
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        datePaiement: new Date()
      });

      expect(result.methode_paiement).toBe('bitcoin');
      expect(result.bitcoin_address).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
    });

    it('devrait créer un paiement avec Virement', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        methode_paiement: 'virement'
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 100,
        methodePaiement: 'virement' as any,
        datePaiement: new Date()
      });

      expect(result.methode_paiement).toBe('virement');
    });

    it('devrait créer un paiement avec méthode Autre', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        methode_paiement: 'autre'
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 100,
        methodePaiement: 'autre' as any,
        datePaiement: new Date()
      });

      expect(result.methode_paiement).toBe('autre');
    });

    it('devrait créer un paiement SANS méthode de paiement', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        methode_paiement: null
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 100,
        datePaiement: new Date()
      });

      expect(result.methode_paiement).toBeNull();
    });
  });

  // ============================================
  // BRANCHES creerPaiement
  // ============================================

  describe('creerPaiement - Toutes les branches', () => {
    beforeEach(() => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
    });

    it('devrait créer avec commandeId SANS abonnementId', async () => {
      mockPrisma.commandes.findUnique.mockResolvedValue(mockCommande);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        commande_id: 1,
        abonnement_id: null
      });

      const result = await paiementsService.creerPaiement({
        commandeId: 1,
        utilisateurId: 1,
        montant: 150,
        datePaiement: new Date()
      });

      expect(result.commande_id).toBe(1);
      expect(result.abonnement_id).toBeNull();
    });

    it('devrait créer avec abonnementId SANS commandeId', async () => {
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(mockAbonnement);
      mockPrisma.paiements.findFirst.mockResolvedValue(null);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        commande_id: null,
        abonnement_id: 1
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 50,
        abonnementId: 1,
        periodeDebut: new Date('2026-01-01'),
        datePaiement: new Date()
      });

      expect(result.commande_id).toBeNull();
      expect(result.abonnement_id).toBe(1);
    });

    it('devrait créer SANS commandeId ni abonnementId', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        commande_id: null,
        abonnement_id: null
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 100,
        datePaiement: new Date()
      });

      expect(result.commande_id).toBeNull();
      expect(result.abonnement_id).toBeNull();
    });

    it('devrait créer avec periodeDebut SANS periodeFin', async () => {
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(mockAbonnement);
      mockPrisma.paiements.findFirst.mockResolvedValue(null);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01'),
        periode_fin: null
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 50,
        abonnementId: 1,
        periodeDebut: new Date('2026-01-01'),
        datePaiement: new Date()
      });

      expect(result.periode_debut).toBeDefined();
      expect(result.periode_fin).toBeNull();
    });

    it('devrait vérifier paiement existant seulement si periodeDebut fournie', async () => {
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(mockAbonnement);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        abonnement_id: 1
      });

      await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 50,
        abonnementId: 1,
        datePaiement: new Date()
        // PAS de periodeDebut
      });

      // findFirst ne devrait PAS être appelé
      expect(mockPrisma.paiements.findFirst.mock.calls.length).toBe(0);
    });
  });

  // ============================================
  // MONTANTS DÉCIMAUX EXTRÊMES
  // ============================================

  describe('Tous les montants décimaux', () => {
    beforeEach(() => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
    });

    it('devrait accepter 0.99', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        montant: 0.99
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 0.99,
        datePaiement: new Date()
      });

      expect(result.montant).toBe(0.99);
    });

    it('devrait accepter 99.99', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        montant: 99.99
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 99.99,
        datePaiement: new Date()
      });

      expect(result.montant).toBe(99.99);
    });

    it('devrait accepter 999.99', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        montant: 999.99
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 999.99,
        datePaiement: new Date()
      });

      expect(result.montant).toBe(999.99);
    });

    it('devrait accepter 9999.99', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        montant: 9999.99
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 9999.99,
        datePaiement: new Date()
      });

      expect(result.montant).toBe(9999.99);
    });

    it('devrait accepter 99999.99', async () => {
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        montant: 99999.99
      });

      const result = await paiementsService.creerPaiement({
        utilisateurId: 1,
        montant: 99999.99,
        datePaiement: new Date()
      });

      expect(result.montant).toBe(99999.99);
    });
  });

  // ============================================
  // DATES SPÉCIALES
  // ============================================

  describe('Cas limites de dates', () => {
    it('devrait gérer une date à minuit (00:00:00)', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const minuit = new Date('2026-01-15T00:00:00Z');
      await paiementsService.obtenirPaiements({
        dateDebut: minuit
      });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.date_paiement.gte).toEqual(minuit);
    });

    it('devrait gérer une date à 23:59:59', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const finJournee = new Date('2026-01-15T23:59:59Z');
      await paiementsService.obtenirPaiements({
        dateFin: finJournee
      });

      const whereClause = mockPrisma.paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.date_paiement.lte).toEqual(finJournee);
    });

    it('devrait gérer des dates avec millisecondes', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const dateAvecMs = new Date('2026-01-15T12:30:45.123Z');
      await paiementsService.obtenirPaiements({
        dateDebut: dateAvecMs
      });

      expect(mockPrisma.paiements.findMany.mock.calls.length).toBe(1);
    });
  });

  // ============================================
  // STATISTIQUES - Tous les groupBy
  // ============================================

  describe('statistiquesParPeriode - Tous les groupBy', () => {
    const paiements = [
      { ...mockPaiement, date_paiement: new Date('2026-01-15'), montant: 100, statut: 'validé' },
      { ...mockPaiement, date_paiement: new Date('2026-01-16'), montant: 150, statut: 'en attente' }
    ];

    it('devrait grouper par jour', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue(paiements);

      const result = await paiementsService.statistiquesParPeriode(
        new Date('2026-01-01'),
        new Date('2026-01-31'),
        'jour'
      );

      expect(result.periode.groupBy).toBe('jour');
      expect(result.donnees.length).toBeGreaterThan(0);
      expect(result.donnees[0].periode).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('devrait grouper par semaine', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue(paiements);

      const result = await paiementsService.statistiquesParPeriode(
        new Date('2026-01-01'),
        new Date('2026-01-31'),
        'semaine'
      );

      expect(result.periode.groupBy).toBe('semaine');
      expect(result.donnees.length).toBeGreaterThan(0);
      expect(result.donnees[0].periode).toMatch(/^\d{4}-S\d+$/);
    });

    it('devrait utiliser "mois" par défaut si groupBy non fourni', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue(paiements);

      const result = await paiementsService.statistiquesParPeriode(
        new Date('2026-01-01'),
        new Date('2026-12-31')
      );

      expect(result.periode.groupBy).toBe('mois');
      expect(result.donnees[0].periode).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  // ============================================
  // STATISTIQUES - Cas vides
  // ============================================

  describe('Statistiques avec données vides', () => {
    it('devrait retourner des tableaux vides pour montantParMois', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);

      const result = await paiementsService.statistiquesGenerales();

      expect(result.montantParMois).toEqual([]);
    });

    it('devrait retourner des tableaux vides pour repartitionMethodes', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);

      const result = await paiementsService.statistiquesGenerales();

      expect(result.repartitionMethodes).toEqual([]);
    });

    it('devrait gérer les paiements sans méthode de paiement dans les stats', async () => {
      const paiementsSansMethode = [
        { ...mockPaiement, methode_paiement: null, montant: 100 },
        { ...mockPaiement, methode_paiement: null, montant: 150 }
      ];

      mockPrisma.paiements.findMany.mockResolvedValue(paiementsSansMethode);

      const result = await paiementsService.statistiquesGenerales();

      // Les paiements sans méthode ne sont pas ajoutés à repartitionMethodes
      expect(result.repartitionMethodes).toEqual([]);
    });
  });

  // ============================================
  // ÉCHÉANCES - Toutes les branches
  // ============================================

  describe('obtenirEcheances - Toutes les branches', () => {
    it('devrait filtrer SANS utilisateurId', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirEcheances({
        abonnementId: 1
      });

      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBeUndefined();
      expect(whereClause.abonnement_id).toBe(1);
    });

    it('devrait filtrer SANS abonnementId', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirEcheances({
        utilisateurId: 1
      });

      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.utilisateur_id).toBe(1);
      expect(whereClause.abonnement_id).toBeUndefined();
    });

    it('devrait filtrer SANS statut', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      await paiementsService.obtenirEcheances({
        utilisateurId: 1,
        abonnementId: 1
      });

      const whereClause = mockPrisma.echeances_paiements.findMany.mock.calls[0][0].where;
      expect(whereClause.statut).toBeUndefined();
    });

    it('devrait utiliser les valeurs par défaut pour limit et offset', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(0);

      await paiementsService.obtenirEcheances({});

      const callArgs = mockPrisma.echeances_paiements.findMany.mock.calls[0][0];
      expect(callArgs.take).toBe(50);
      expect(callArgs.skip).toBe(0);
    });
  });

  // ============================================
  // RÉSULTATS updateMany
  // ============================================

  describe('Résultats updateMany variés', () => {
    it('devrait gérer updateMany avec count = 0', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01')
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      await paiementsService.validerPaiement({ paiementId: 1 });

      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(1);
    });

    it('devrait gérer updateMany avec count = 10', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01'),
        statut: 'validé'
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 10 });

      await paiementsService.annulerPaiement(1);

      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(1);
    });
  });

  // ============================================
  // AGGREGATE CASES
  // ============================================

  describe('Résultats aggregate variés', () => {
    it('devrait gérer aggregate avec _sum.montant = 0', async () => {
      mockPrisma.paiements.aggregate.mockResolvedValue({
        _sum: { montant: 0 }
      });

      const result = await paiementsService.obtenirMontantTotalUtilisateur(1);

      expect(result).toBe(0);
    });

    it('devrait gérer aggregate avec grande valeur', async () => {
      mockPrisma.paiements.aggregate.mockResolvedValue({
        _sum: { montant: 999999.99 }
      });

      const result = await paiementsService.obtenirMontantTotalUtilisateur(1);

      expect(result).toBe(999999.99);
    });
  });

  // ============================================
  // MÉTHODES UTILITAIRES - Tous les cas
  // ============================================

  describe('Méthodes utilitaires - Couverture complète', () => {
    it('devrait gérer paiementExiste avec ID 0', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      const result = await paiementsService.paiementExiste(0);

      expect(result).toBe(false);
    });

    it('devrait gérer compterPaiementsValides = 0', async () => {
      mockPrisma.paiements.count.mockResolvedValue(0);

      const result = await paiementsService.compterPaiementsValides(1);

      expect(result).toBe(0);
    });

    it('devrait gérer compterPaiementsValides > 0', async () => {
      mockPrisma.paiements.count.mockResolvedValue(25);

      const result = await paiementsService.compterPaiementsValides(1);

      expect(result).toBe(25);
    });
  });

  // ============================================
  // VALIDERPAIEMENT - Sans échéance
  // ============================================

  describe('validerPaiement - Sans abonnement/période', () => {
    it('ne devrait PAS appeler updateMany si pas d\'abonnement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        abonnement_id: null,
        periode_debut: null
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      await paiementsService.validerPaiement({ paiementId: 1 });

      // updateMany ne devrait PAS être appelé car pas d'abonnement_id
      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(0);
    });

    it('ne devrait PAS appeler updateMany si pas de periode_debut', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        abonnement_id: 1,
        periode_debut: null
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });

      await paiementsService.validerPaiement({ paiementId: 1 });

      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(0);
    });
  });

  // ============================================
  // ANNULERPAIEMENT - Branches échéances
  // ============================================

  describe('annulerPaiement - Gestion des échéances', () => {
    it('ne devrait PAS restaurer l\'échéance si paiement était en attente', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'en attente',
        abonnement_id: 1,
        periode_debut: new Date('2026-01-01')
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      await paiementsService.annulerPaiement(1);

      // updateMany ne devrait PAS être appelé car statut était 'en attente'
      expect(mockPrisma.echeances_paiements.updateMany.mock.calls.length).toBe(0);
    });
  });

  // ============================================
  // DESCRIPTION avec motifs
  // ============================================

  describe('Descriptions avec motifs', () => {
    it('devrait ajouter référence dans validerPaiement avec description existante', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        description: 'Description existante'
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé',
        description: 'Description existante - Ref: REF-123'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const result = await paiementsService.validerPaiement({
        paiementId: 1,
        referenceTransaction: 'REF-123'
      });

      expect(result.description).toContain('Ref: REF-123');
    });

    it('devrait gérer description null dans validerPaiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        description: null
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé',
        description: '- Ref: REF-123'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      await paiementsService.validerPaiement({
        paiementId: 1,
        referenceTransaction: 'REF-123'
      });

      expect(mockPrisma.paiements.update.mock.calls.length).toBe(1);
    });

    it('devrait gérer description null dans refuserPaiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        description: null
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'refusé'
      });

      await paiementsService.refuserPaiement(1, 'Motif de refus');

      expect(mockPrisma.paiements.update.mock.calls.length).toBe(1);
    });

    it('devrait gérer description null dans annulerPaiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        description: null
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      await paiementsService.annulerPaiement(1, 'Motif annulation');

      expect(mockPrisma.paiements.update.mock.calls.length).toBe(1);
    });

    it('devrait gérer description null dans rembourserPaiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiementValide,
        description: null
      });
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiementValide,
        statut: 'remboursé'
      });

      await paiementsService.rembourserPaiement(2, 'Motif remboursement');

      expect(mockPrisma.paiements.update.mock.calls.length).toBe(1);
    });
  });

  // ============================================
  // HASMORE pagination
  // ============================================

  describe('Pagination - calcul hasMore', () => {
    it('devrait retourner hasMore=true quand il reste des résultats', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(100);

      const result = await paiementsService.obtenirPaiements({
        limit: 10,
        offset: 0
      });

      expect(result.hasMore).toBe(true);
    });

    it('devrait retourner hasMore=false à la dernière page', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(100);

      const result = await paiementsService.obtenirPaiements({
        limit: 10,
        offset: 99
      });

      expect(result.hasMore).toBe(false);
    });
  });
});
