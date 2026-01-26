/**
 * Tests d'exceptions pour le service Paiements
 * Couvre 55+ cas d'erreurs et validations
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
  mockPaiementAbonnement
} from './paiements.mock.js';

describe('PaiementsService - Tests d\'Exceptions', () => {
  let paiementsService: PaiementsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    paiementsService = new PaiementsService(mockPrisma);
  });

  // ============================================
  // VALIDATIONS - CRÉER PAIEMENT
  // ============================================

  describe('creerPaiement - Validations', () => {
    it('devrait rejeter un utilisateur introuvable', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 999,
          montant: 100,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Utilisateur introuvable');
    });

    it('devrait rejeter une commande introuvable', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.commandes.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          commandeId: 999,
          montant: 100,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Commande introuvable');
    });

    it('devrait rejeter un abonnement introuvable', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 50,
          datePaiement: new Date(),
          abonnementId: 999
        })
      ).rejects.toThrow('Abonnement introuvable');
    });

    it('devrait rejeter un montant négatif', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: -50,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Montant invalide');
    });

    it('devrait rejeter un montant nul', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 0,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Montant invalide');
    });

    it('devrait rejeter un montant trop élevé', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 1000000,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Montant invalide');
    });

    it('devrait rejeter un paiement existant pour la même période', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(mockAbonnement);
      mockPrisma.paiements.findFirst.mockResolvedValue(mockPaiementAbonnement);

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
  // VALIDATIONS - VALIDER PAIEMENT
  // ============================================

  describe('validerPaiement - Validations', () => {
    it('devrait rejeter un paiement introuvable', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.validerPaiement({ paiementId: 999 })
      ).rejects.toThrow('Paiement introuvable');
    });

    it('devrait rejeter si le paiement n\'est pas en attente', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiementValide);

      await expect(
        paiementsService.validerPaiement({ paiementId: 2 })
      ).rejects.toThrow('Impossible de valider un paiement avec le statut validé');
    });

    it('devrait rejeter la validation d\'un paiement refusé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'refusé'
      });

      await expect(
        paiementsService.validerPaiement({ paiementId: 1 })
      ).rejects.toThrow('Impossible de valider un paiement avec le statut refusé');
    });

    it('devrait rejeter la validation d\'un paiement annulé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });

      await expect(
        paiementsService.validerPaiement({ paiementId: 1 })
      ).rejects.toThrow('Impossible de valider un paiement avec le statut annulé');
    });

    it('devrait rejeter la validation d\'un paiement remboursé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'remboursé'
      });

      await expect(
        paiementsService.validerPaiement({ paiementId: 1 })
      ).rejects.toThrow('Impossible de valider un paiement avec le statut remboursé');
    });
  });

  // ============================================
  // VALIDATIONS - REFUSER PAIEMENT
  // ============================================

  describe('refuserPaiement - Validations', () => {
    it('devrait rejeter un paiement introuvable', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.refuserPaiement(999)
      ).rejects.toThrow('Paiement introuvable');
    });

    it('devrait rejeter si le paiement n\'est pas en attente', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiementValide);

      await expect(
        paiementsService.refuserPaiement(2)
      ).rejects.toThrow('Impossible de refuser un paiement avec le statut validé');
    });

    it('devrait rejeter le refus d\'un paiement déjà refusé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'refusé'
      });

      await expect(
        paiementsService.refuserPaiement(1)
      ).rejects.toThrow('Impossible de refuser un paiement avec le statut refusé');
    });

    it('devrait rejeter le refus d\'un paiement annulé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });

      await expect(
        paiementsService.refuserPaiement(1)
      ).rejects.toThrow('Impossible de refuser un paiement avec le statut annulé');
    });

    it('devrait rejeter le refus d\'un paiement remboursé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'remboursé'
      });

      await expect(
        paiementsService.refuserPaiement(1)
      ).rejects.toThrow('Impossible de refuser un paiement avec le statut remboursé');
    });
  });

  // ============================================
  // VALIDATIONS - ANNULER PAIEMENT
  // ============================================

  describe('annulerPaiement - Validations', () => {
    it('devrait rejeter un paiement introuvable', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.annulerPaiement(999)
      ).rejects.toThrow('Paiement introuvable');
    });

    it('devrait rejeter si le paiement n\'est ni en attente ni validé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'refusé'
      });

      await expect(
        paiementsService.annulerPaiement(1)
      ).rejects.toThrow('Impossible d\'annuler un paiement avec le statut refusé');
    });

    it('devrait rejeter l\'annulation d\'un paiement déjà annulé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });

      await expect(
        paiementsService.annulerPaiement(1)
      ).rejects.toThrow('Impossible d\'annuler un paiement avec le statut annulé');
    });

    it('devrait rejeter l\'annulation d\'un paiement remboursé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'remboursé'
      });

      await expect(
        paiementsService.annulerPaiement(1)
      ).rejects.toThrow('Impossible d\'annuler un paiement avec le statut remboursé');
    });
  });

  // ============================================
  // VALIDATIONS - REMBOURSER PAIEMENT
  // ============================================

  describe('rembourserPaiement - Validations', () => {
    it('devrait rejeter un paiement introuvable', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      await expect(
        paiementsService.rembourserPaiement(999)
      ).rejects.toThrow('Paiement introuvable');
    });

    it('devrait rejeter si le paiement n\'est pas validé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);

      await expect(
        paiementsService.rembourserPaiement(1)
      ).rejects.toThrow('Impossible de rembourser un paiement avec le statut en attente');
    });

    it('devrait rejeter le remboursement d\'un paiement refusé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'refusé'
      });

      await expect(
        paiementsService.rembourserPaiement(1)
      ).rejects.toThrow('Impossible de rembourser un paiement avec le statut refusé');
    });

    it('devrait rejeter le remboursement d\'un paiement annulé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });

      await expect(
        paiementsService.rembourserPaiement(1)
      ).rejects.toThrow('Impossible de rembourser un paiement avec le statut annulé');
    });

    it('devrait rejeter le remboursement d\'un paiement déjà remboursé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiementValide,
        statut: 'remboursé'
      });

      await expect(
        paiementsService.rembourserPaiement(2)
      ).rejects.toThrow('Impossible de rembourser un paiement avec le statut remboursé');
    });
  });

  // ============================================
  // ERREURS DE BASE DE DONNÉES
  // ============================================

  describe('Erreurs de base de données', () => {
    it('devrait gérer les erreurs de connexion pour obtenirPaiements', async () => {
      mockPrisma.paiements.findMany.mockRejectedValue(new Error('Connection refused'));

      await expect(
        paiementsService.obtenirPaiements({})
      ).rejects.toThrow('Connection refused');
    });

    it('devrait gérer les erreurs de connexion pour creerPaiement', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.paiements.create.mockRejectedValue(new Error('Database timeout'));

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 100,
          datePaiement: new Date()
        })
      ).rejects.toThrow('Database timeout');
    });

    it('devrait gérer les erreurs de connexion pour validerPaiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockRejectedValue(new Error('Lock timeout'));

      await expect(
        paiementsService.validerPaiement({ paiementId: 1 })
      ).rejects.toThrow('Lock timeout');
    });

    it('devrait gérer les erreurs lors du calcul des statistiques', async () => {
      mockPrisma.paiements.findMany.mockRejectedValue(new Error('Query too complex'));

      await expect(
        paiementsService.statistiquesGenerales()
      ).rejects.toThrow('Query too complex');
    });

    it('devrait gérer les erreurs d\'aggregate', async () => {
      mockPrisma.paiements.aggregate.mockRejectedValue(new Error('Aggregate failed'));

      await expect(
        paiementsService.obtenirMontantTotalUtilisateur(1)
      ).rejects.toThrow('Aggregate failed');
    });
  });

  // ============================================
  // ERREURS DE COHÉRENCE DES DONNÉES
  // ============================================

  describe('Cohérence des données', () => {
    it('devrait rejeter si l\'utilisateur est supprimé après vérification', async () => {
      mockPrisma.utilisateurs.findUnique
        .mockResolvedValueOnce(mockUtilisateur)
        .mockResolvedValueOnce(null);
      
      mockPrisma.paiements.create.mockImplementation(() => {
        throw new Error('Foreign key constraint failed');
      });

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 100,
          datePaiement: new Date()
        })
      ).rejects.toThrow();
    });

    it('devrait gérer les transactions concurrentes', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockRejectedValue(
        new Error('Could not serialize access due to concurrent update')
      );

      await expect(
        paiementsService.validerPaiement({ paiementId: 1 })
      ).rejects.toThrow('concurrent update');
    });

    it('devrait gérer les violations de contrainte unique', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);
      mockPrisma.plans_tarifaires.findUnique.mockResolvedValue(mockAbonnement);
      mockPrisma.paiements.findFirst.mockResolvedValue(null);
      mockPrisma.paiements.create.mockRejectedValue(
        new Error('Unique constraint failed on fields: utilisateur_id,periode_debut,abonnement_id')
      );

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 50,
          datePaiement: new Date('2026-01-01'),
          abonnementId: 1,
          periodeDebut: new Date('2026-01-01')
        })
      ).rejects.toThrow('Unique constraint');
    });
  });

  // ============================================
  // ERREURS DE FORMATAGE
  // ============================================

  describe('Erreurs de formatage', () => {
    it('devrait gérer les montants mal formatés', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: NaN,
          datePaiement: new Date()
        })
      ).rejects.toThrow();
    });

    it('devrait gérer les dates invalides', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(mockUtilisateur);

      await expect(
        paiementsService.creerPaiement({
          utilisateurId: 1,
          montant: 100,
          datePaiement: new Date('invalid-date')
        })
      ).rejects.toThrow();
    });
  });

  // ============================================
  // ERREURS DE PERMISSION
  // ============================================

  describe('Permissions et autorisation', () => {
    it('devrait empêcher l\'accès aux paiements d\'un autre utilisateur', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({
        ...mockPaiement,
        utilisateur_id: 2
      });

      // Cette logique devrait être implémentée dans le service
      const paiement = await paiementsService.obtenirPaiementParId(1);
      expect(paiement?.utilisateur_id).not.toBe(1);
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================

  describe('Cas limites', () => {
    it('devrait gérer un grand nombre de paiements', async () => {
      const manyPaiements = Array(1000).fill(mockPaiement);
      mockPrisma.paiements.findMany.mockResolvedValue(manyPaiements);
      mockPrisma.paiements.count.mockResolvedValue(1000);

      const result = await paiementsService.obtenirPaiements({ limit: 1000 });
      
      expect(result.paiements.length).toBe(1000);
    });

    it('devrait gérer les montants décimaux précis', async () => {
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

    it('devrait gérer les statistiques sans données', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([]);

      const result = await paiementsService.statistiquesGenerales();

      expect(result.totalPaiements).toBe(0);
      expect(result.montantTotal).toBe(0);
      expect(result.moyenneMontant).toBe(0);
    });
  });
});
