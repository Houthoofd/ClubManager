/**
 * Tests pour les resolvers GraphQL du service Paiements
 * Teste les queries et mutations GraphQL
 */

import { paiementsResolvers } from '../paiements.resolvers.js';
import { PaiementsError } from '@clubmanager/types';
import {
  createMockPrisma,
  mockPaiement,
  mockPaiementValide,
  mockEcheance
} from './paiements.mock.js';

describe('Paiements Resolvers - Tests GraphQL', () => {
  let resolvers: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    resolvers = paiementsResolvers(mockPrisma);
  });

  // ============================================
  // QUERIES
  // ============================================

  describe('Query: obtenirPaiements', () => {
    it('devrait retourner tous les paiements', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement, mockPaiementValide]);
      mockPrisma.paiements.count.mockResolvedValue(2);

      const result = await resolvers.Query.obtenirPaiements(null, {});

      expect(result.paiements).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('devrait gérer les erreurs et les transformer', async () => {
      mockPrisma.paiements.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        resolvers.Query.obtenirPaiements(null, {})
      ).rejects.toThrow('Database error');
    });

    it('devrait accepter des filtres', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiementValide]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirPaiements(null, {
        utilisateurId: 1,
        statut: 'validé',
        limit: 10
      });

      expect(result.paiements).toHaveLength(1);
    });
  });

  describe('Query: obtenirPaiementParId', () => {
    it('devrait retourner un paiement par son ID', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);

      const result = await resolvers.Query.obtenirPaiementParId(null, { id: 1 });

      expect(result.id).toBe(1);
      expect(result.montant).toBe(150);
    });

    it('devrait rejeter si le paiement n\'existe pas', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      await expect(
        resolvers.Query.obtenirPaiementParId(null, { id: 999 })
      ).rejects.toThrow('Paiement introuvable');
    });
  });

  describe('Query: obtenirPaiementsUtilisateur', () => {
    it('devrait retourner les paiements d\'un utilisateur', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.paiements.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirPaiementsUtilisateur(null, {
        utilisateurId: 1
      });

      expect(result.paiements).toHaveLength(1);
      expect(result.paiements[0].utilisateur_id).toBe(1);
    });
  });

  describe('Query: obtenirEcheances', () => {
    it('devrait retourner les échéances', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirEcheances(null, {});

      expect(result.echeances).toHaveLength(1);
    });

    it('devrait filtrer par utilisateur', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirEcheances(null, {
        utilisateurId: 1
      });

      expect(result.echeances[0].utilisateur_id).toBe(1);
    });
  });

  describe('Query: obtenirEcheancesUtilisateur', () => {
    it('devrait retourner les échéances d\'un utilisateur', async () => {
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([mockEcheance]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirEcheancesUtilisateur(null, {
        utilisateurId: 1,
        limit: 10
      });

      expect(result.echeances).toHaveLength(1);
    });
  });

  describe('Query: obtenirEcheancesEchues', () => {
    it('devrait retourner les échéances échues', async () => {
      const echeanceEchue = { ...mockEcheance, statut: 'échu' };
      mockPrisma.echeances_paiements.findMany.mockResolvedValue([echeanceEchue]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(1);

      const result = await resolvers.Query.obtenirEcheancesEchues(null, {});

      expect(result.echeances).toHaveLength(1);
    });
  });

  describe('Query: statistiquesPaiements', () => {
    it('devrait retourner les statistiques générales', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement, mockPaiementValide]);

      const result = await resolvers.Query.statistiquesPaiements(null, {});

      expect(result.totalPaiements).toBeGreaterThan(0);
      expect(result.montantTotal).toBeGreaterThan(0);
    });

    it('devrait accepter des filtres de date', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);

      const result = await resolvers.Query.statistiquesPaiements(null, {
        dateDebut: new Date('2026-01-01'),
        dateFin: new Date('2026-01-31')
      });

      expect(result.totalPaiements).toBeGreaterThan(0);
    });
  });

  describe('Query: statistiquesPaiementsUtilisateur', () => {
    it('devrait retourner les statistiques d\'un utilisateur', async () => {
      mockPrisma.paiements.findMany.mockResolvedValue([mockPaiement]);
      mockPrisma.echeances_paiements.count.mockResolvedValue(0);

      const result = await resolvers.Query.statistiquesPaiementsUtilisateur(null, {
        utilisateurId: 1
      });

      expect(result.utilisateurId).toBe(1);
      expect(result.totalPaiements).toBeGreaterThan(0);
    });
  });

  describe('Query: paiementExiste', () => {
    it('devrait retourner true si le paiement existe', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue({ id: 1 });

      const result = await resolvers.Query.paiementExiste(null, { id: 1 });

      expect(result).toBe(true);
    });

    it('devrait retourner false si le paiement n\'existe pas', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(null);

      const result = await resolvers.Query.paiementExiste(null, { id: 999 });

      expect(result).toBe(false);
    });
  });

  // ============================================
  // MUTATIONS
  // ============================================

  describe('Mutation: creerPaiement', () => {
    it('devrait créer un nouveau paiement', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.paiements.create.mockResolvedValue(mockPaiement);

      const input = {
        utilisateurId: 1,
        montant: 150,
        methodePaiement: 'stripe',
        datePaiement: new Date()
      };

      const result = await resolvers.Mutation.creerPaiement(null, { input });

      expect(result.montant).toBe(150);
      expect(result.statut).toBe('en attente');
    });

    it('devrait gérer les erreurs de validation', async () => {
      mockPrisma.utilisateurs.findUnique.mockResolvedValue(null);

      const input = {
        utilisateurId: 999,
        montant: 150,
        datePaiement: new Date()
      };

      await expect(
        resolvers.Mutation.creerPaiement(null, { input })
      ).rejects.toThrow('Utilisateur introuvable');
    });
  });

  describe('Mutation: validerPaiement', () => {
    it('devrait valider un paiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'validé',
        date_confirmation: new Date()
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const input = { paiementId: 1, referenceTransaction: 'REF-123' };

      const result = await resolvers.Mutation.validerPaiement(null, { input });

      expect(result.statut).toBe('validé');
      expect(result.date_confirmation).not.toBeNull();
    });

    it('devrait rejeter si le paiement n\'est pas en attente', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiementValide);

      const input = { paiementId: 2 };

      await expect(
        resolvers.Mutation.validerPaiement(null, { input })
      ).rejects.toThrow('Impossible de valider un paiement avec le statut validé');
    });
  });

  describe('Mutation: refuserPaiement', () => {
    it('devrait refuser un paiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'refusé'
      });

      const result = await resolvers.Mutation.refuserPaiement(null, {
        paiementId: 1,
        motif: 'Fonds insuffisants'
      });

      expect(result.statut).toBe('refusé');
    });
  });

  describe('Mutation: annulerPaiement', () => {
    it('devrait annuler un paiement', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiement,
        statut: 'annulé'
      });
      mockPrisma.echeances_paiements.updateMany.mockResolvedValue({ count: 0 });

      const result = await resolvers.Mutation.annulerPaiement(null, {
        paiementId: 1,
        motif: 'Demande client'
      });

      expect(result.statut).toBe('annulé');
    });
  });

  describe('Mutation: rembourserPaiement', () => {
    it('devrait rembourser un paiement validé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiementValide);
      mockPrisma.paiements.update.mockResolvedValue({
        ...mockPaiementValide,
        statut: 'remboursé'
      });

      const result = await resolvers.Mutation.rembourserPaiement(null, {
        paiementId: 2,
        motif: 'Produit défectueux'
      });

      expect(result.statut).toBe('remboursé');
    });

    it('devrait rejeter si le paiement n\'est pas validé', async () => {
      mockPrisma.paiements.findUnique.mockResolvedValue(mockPaiement);

      await expect(
        resolvers.Mutation.rembourserPaiement(null, {
          paiementId: 1
        })
      ).rejects.toThrow('Impossible de rembourser un paiement avec le statut en attente');
    });
  });

  // ============================================
  // GESTION DES ERREURS
  // ============================================

  describe('Gestion des erreurs', () => {
    it('devrait transformer les PaiementsError en Error GraphQL', async () => {
      mockPrisma.paiements.findMany.mockImplementation(() => {
        throw new PaiementsError('Erreur personnalisée', 'CUSTOM_ERROR');
      });

      await expect(
        resolvers.Query.obtenirPaiements(null, {})
      ).rejects.toThrow('Erreur personnalisée');
    });

    it('devrait propager les erreurs non-PaiementsError', async () => {
      mockPrisma.paiements.findMany.mockRejectedValue(new Error('Erreur système'));

      await expect(
        resolvers.Query.obtenirPaiements(null, {})
      ).rejects.toThrow('Erreur système');
    });
  });
});
