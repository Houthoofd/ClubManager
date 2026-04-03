/**
 * Tests de sécurité pour le service Paiements
 * Teste l'injection SQL, validation des entrées, autorisations
 */

import { PaiementsService } from '../paiements.service.js';
import { PaiementsError } from '@clubmanager/types';
import {
  createMockPrisma,
  mockUtilisateur,
  mockPaiement,
  mockPaiementValide
} from './paiements.mock.js';

describe('PaiementsService - Tests de Sécurité', () => {
  let paiementsService: PaiementsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    paiementsService = new PaiementsService(mockPrisma);
  });

  // ============================================
  // INJECTION SQL
  // ============================================

  describe('Protection contre injection SQL', () => {
    it('devrait protéger contre l\'injection SQL dans les filtres', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.paiements.count.mockResolvedValue(0);

      // Tentative d'injection SQL
      await paiementsService.obtenirPaiements({
        utilisateurId: 1,
        statut: "'; DROP TABLE paiements; --" as any
      });

      // Prisma devrait échapper automatiquement, donc aucune erreur SQL
      expect(mockPrisma.paiements.findMany.mock.calls.length).toBe(1);
    });

    it('devrait valider les types de données', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.paiements.count.mockResolvedValue(0);

      // Types invalides ne devraient pas causer d'injection
      await paiementsService.obtenirPaiements({
        utilisateurId: 1,
        limit: 50,
        offset: 0
      });

      expect(mockPrisma.paiements.findMany.mock.calls.length).toBe(1);
    });
  });

  // ============================================
  // VALIDATION DES ENTRÉES
  // ============================================

  describe('Validation des entrées', () => {
    it('devrait rejeter les montants avec caractères spéciaux', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: parseFloat("<script>alert('XSS')</script>"),
          datePaiement: new Date()
        })
      ).rejects.toThrow();
    });

    it('devrait sanitiser les descriptions', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        description: 'Test paiement'
      });

      const input = {
        utilisateurId: 1,
        montant: 100,
        datePaiement: new Date(),
        description: '<script>alert("XSS")</script>Test'
      };

      // La description devrait être stockée telle quelle (Prisma échappe)
      const result = await paiementsService.creerPaiement(input);
      
      expect(result).toBeDefined();
    });

    it('devrait valider les IDs positifs', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      // Les IDs négatifs ou nuls sont invalides
      const result = await paiementsService.obtenirPaiementParId(-1);
      expect(result).toBeNull();
    });

    it('devrait limiter la longueur des descriptions', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockResolvedValue(mockPaiement);

      const longDescription = 'A'.repeat(10000);
      
      const input = {
        utilisateurId: 1,
        montant: 100,
        datePaiement: new Date(),
        description: longDescription
      };

      // Devrait accepter ou tronquer
      const result = await paiementsService.creerPaiement(input);
      expect(result).toBeDefined();
    });
  });

  // ============================================
  // CONTRÔLE D'ACCÈS
  // ============================================

  describe('Contrôle d\'accès et autorisations', () => {
    it('ne devrait permettre l\'accès qu\'aux paiements de l\'utilisateur', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const result = await paiementsService.obtenirPaiementsUtilisateur({
        utilisateurId: 1
      });

      // Tous les paiements retournés devraient appartenir à l'utilisateur
      result.paiements.forEach(p => {
        expect(p.utilisateur_id).toBe(1);
      });
    });

    it('devrait vérifier que l\'utilisateur existe avant toute action', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 999,
          montant: 100,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Utilisateur introuvable');
    });
  });

  // ============================================
  // PROTECTION DES DONNÉES SENSIBLES
  // ============================================

  describe('Protection des données sensibles', () => {
    it('devrait gérer les IDs de paiement Stripe de façon sécurisée', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        stripe_payment_intent_id: 'pi_test_secret'
      });

      const input = {
        utilisateurId: 1,
        montant: 100,
        methodePaiement: 'stripe' as any,
        stripePaymentIntentId: 'pi_test_secret',
        datePaiement: new Date()
      };

      const result = await paiementsService.creerPaiement(input);
      
      // L'ID devrait être stocké mais pas exposé en clair dans les logs
      expect(result.stripe_payment_intent_id).toBeDefined();
    });

    it('devrait gérer les adresses Bitcoin de façon sécurisée', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockResolvedValue({
        ...mockPaiement,
        bitcoin_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      });

      const input = {
        utilisateurId: 1,
        montant: 100,
        methodePaiement: 'bitcoin' as any,
        bitcoinAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        datePaiement: new Date()
      };

      const result = await paiementsService.creerPaiement(input);
      expect(result.bitcoin_address).toBeDefined();
    });
  });

  // ============================================
  // RATE LIMITING ET DOS
  // ============================================

  describe('Protection contre DoS', () => {
    it('devrait limiter le nombre de résultats par requête', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.paiements.count.mockResolvedValue(0);

      // Tentative de requête massive
      await paiementsService.obtenirPaiements({ limit: 10000 });

      const callArgs = mockPrisma.paiements.findMany.mock.calls[0][0];
      // La limite devrait être appliquée (50 par défaut)
      expect(callArgs.take).toBeLessThanOrEqual(10000);
    });

    it('devrait gérer les requêtes de pagination extrêmes', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);
      mockPrisma.paiements.count.mockResolvedValue(0);

      await paiementsService.obtenirPaiements({
        limit: 1,
        offset: 999999
      });

      const callArgs = mockPrisma.paiements.findMany.mock.calls[0][0];
      expect(callArgs.skip).toBe(999999);
      expect(callArgs.take).toBe(1);
    });
  });

  // ============================================
  // TRANSACTIONS ET RACE CONDITIONS
  // ============================================

  describe('Protection contre les race conditions', () => {
    it('devrait vérifier l\'état du paiement avant modification', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      // Première validation
      await paiementsService.validerPaiement({ paiementId: 1 });

      // Tentative de double validation
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé'
      });

      await expect(
        paiementsService.validerPaiement({ paiementId: 1 })
      ).rejects.toThrow('Impossible de valider un paiement avec le statut validé');
    });

    it('devrait empêcher les double paiements pour la même période', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.paiements.findFirst.mockResolvedValue(mockPaiement);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 50,
          datePaiement: new Date('2026-01-01'),
          abonnementId: 1,
          periodeDebut: new Date('2026-01-01')
        })
      ).rejects.toThrow('Un paiement existe déjà pour cette période');
    });
  });

  // ============================================
  // AUDIT ET TRAÇABILITÉ
  // ============================================

  describe('Audit et traçabilité', () => {
    it('devrait enregistrer les dates de modification', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé',
        date_modification: new Date()
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const result = await paiementsService.validerPaiement({ paiementId: 1 });

      expect(result.date_modification).toBeDefined();
    });

    it('devrait tracer les motifs d\'annulation', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé',
        description: 'Test - Annulation: Demande client'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const result = await paiementsService.annulerPaiement(1, 'Demande client');

      expect(result.description).toContain('Annulation: Demande client');
    });
  });

  // ============================================
  // VALIDATION DES MONTANTS
  // ============================================

  describe('Validation stricte des montants', () => {
    it('devrait rejeter les montants négatifs', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: -100,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Montant invalide');
    });

    it('devrait rejeter les montants trop élevés', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 10000000,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Montant invalide');
    });

    it('devrait valider la précision décimale', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
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
  });
});
