/**
 * @file stripe.status-upgrade-service.test.ts
 * @description Tests unitaires pour le StatusUpgradeService
 *
 * PRIORITÉ 2 - IMPORTANT ⭐
 *
 * Couvre:
 * - Logique d'upgrade de statut utilisateur
 * - Validation des transitions de statut
 * - Calcul des montants par tier
 * - Vérification des permissions par statut
 * - Historique des upgrades
 * - Downgrade de statut
 * - Edge cases et validations
 *
 * Focus sur:
 * - Règles métier des statuts de membership
 * - Transitions valides/invalides
 * - Cohérence des données
 * - Audit trail des changements
 */

import { StatusUpgradeService } from '../StatusUpgradeService';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '../../../utils/email';
import * as Sentry from '@sentry/node';

// Mocks
jest.mock('@prisma/client');
jest.mock('../../../utils/email');
jest.mock('@sentry/node');

describe('StatusUpgradeService', () => {
  let statusUpgradeService: StatusUpgradeService;
  let mockPrisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      statusHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    } as any;

    statusUpgradeService = new StatusUpgradeService(mockPrisma as any);
  });

  describe('upgradeUserStatus', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      membershipStatus: 'PENDING',
    };

    it('devrait upgrader de PENDING à ACTIVE', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        membershipStatus: 'ACTIVE',
      } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      const result = await statusUpgradeService.upgradeUserStatus(1, 'ACTIVE');

      expect(result.membershipStatus).toBe('ACTIVE');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          membershipStatus: 'ACTIVE',
          activatedAt: expect.any(Date),
        },
      });
      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          fromStatus: 'PENDING',
          toStatus: 'ACTIVE',
          reason: 'upgrade',
        },
      });
    });

    it('devrait upgrader de ACTIVE à PREMIUM', async () => {
      const activeUser = { ...mockUser, membershipStatus: 'ACTIVE' };
      mockPrisma.user.findUnique.mockResolvedValue(activeUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...activeUser,
        membershipStatus: 'PREMIUM',
      } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      const result = await statusUpgradeService.upgradeUserStatus(1, 'PREMIUM');

      expect(result.membershipStatus).toBe('PREMIUM');
      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('PREMIUM'),
        expect.any(String)
      );
    });

    it('devrait upgrader de PREMIUM à VIP', async () => {
      const premiumUser = { ...mockUser, membershipStatus: 'PREMIUM' };
      mockPrisma.user.findUnique.mockResolvedValue(premiumUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...premiumUser,
        membershipStatus: 'VIP',
      } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      const result = await statusUpgradeService.upgradeUserStatus(1, 'VIP');

      expect(result.membershipStatus).toBe('VIP');
    });

    it('devrait rejeter un upgrade invalide (PENDING vers VIP)', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(
        statusUpgradeService.upgradeUserStatus(1, 'VIP')
      ).rejects.toThrow('Invalid status transition');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('devrait rejeter un downgrade (PREMIUM vers ACTIVE)', async () => {
      const premiumUser = { ...mockUser, membershipStatus: 'PREMIUM' };
      mockPrisma.user.findUnique.mockResolvedValue(premiumUser as any);

      await expect(
        statusUpgradeService.upgradeUserStatus(1, 'ACTIVE')
      ).rejects.toThrow('Cannot downgrade status');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('devrait rejeter un upgrade vers le même statut', async () => {
      const activeUser = { ...mockUser, membershipStatus: 'ACTIVE' };
      mockPrisma.user.findUnique.mockResolvedValue(activeUser as any);

      await expect(
        statusUpgradeService.upgradeUserStatus(1, 'ACTIVE')
      ).rejects.toThrow('User already has this status');

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it('devrait gérer les utilisateurs inexistants', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        statusUpgradeService.upgradeUserStatus(999, 'ACTIVE')
      ).rejects.toThrow('User not found');
    });

    it('devrait utiliser une transaction pour l\'upgrade', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, membershipStatus: 'ACTIVE' } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      await statusUpgradeService.upgradeUserStatus(1, 'ACTIVE');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('devrait rollback en cas d\'erreur', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, membershipStatus: 'ACTIVE' } as any);
      mockPrisma.statusHistory.create.mockRejectedValue(new Error('DB Error'));
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(
        statusUpgradeService.upgradeUserStatus(1, 'ACTIVE')
      ).rejects.toThrow();

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });

  describe('downgradeUserStatus', () => {
    it('devrait downgrader de VIP à PREMIUM', async () => {
      const vipUser = {
        id: 1,
        email: 'test@example.com',
        membershipStatus: 'VIP',
      };

      mockPrisma.user.findUnique.mockResolvedValue(vipUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...vipUser,
        membershipStatus: 'PREMIUM',
      } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      const result = await statusUpgradeService.downgradeUserStatus(1, 'PREMIUM', 'subscription_expired');

      expect(result.membershipStatus).toBe('PREMIUM');
      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          fromStatus: 'VIP',
          toStatus: 'PREMIUM',
          reason: 'subscription_expired',
        },
      });
    });

    it('devrait downgrader de PREMIUM à ACTIVE', async () => {
      const premiumUser = {
        id: 1,
        email: 'test@example.com',
        membershipStatus: 'PREMIUM',
      };

      mockPrisma.user.findUnique.mockResolvedValue(premiumUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...premiumUser,
        membershipStatus: 'ACTIVE',
      } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      await statusUpgradeService.downgradeUserStatus(1, 'ACTIVE', 'payment_failed');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          membershipStatus: 'ACTIVE',
          downgradedAt: expect.any(Date),
        },
      });
    });

    it('devrait downgrader à INACTIVE pour non-paiement', async () => {
      const activeUser = {
        id: 1,
        email: 'test@example.com',
        membershipStatus: 'ACTIVE',
      };

      mockPrisma.user.findUnique.mockResolvedValue(activeUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...activeUser,
        membershipStatus: 'INACTIVE',
      } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      await statusUpgradeService.downgradeUserStatus(1, 'INACTIVE', 'payment_failed');

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.stringContaining('compte inactif'),
        expect.any(String)
      );
    });

    it('devrait rejeter un downgrade invalide', async () => {
      const activeUser = {
        id: 1,
        membershipStatus: 'ACTIVE',
      };

      mockPrisma.user.findUnique.mockResolvedValue(activeUser as any);

      await expect(
        statusUpgradeService.downgradeUserStatus(1, 'VIP', 'test')
      ).rejects.toThrow('Invalid downgrade transition');
    });

    it('devrait enregistrer la raison du downgrade', async () => {
      const premiumUser = {
        id: 1,
        email: 'test@example.com',
        membershipStatus: 'PREMIUM',
      };

      mockPrisma.user.findUnique.mockResolvedValue(premiumUser as any);
      mockPrisma.user.update.mockResolvedValue({
        ...premiumUser,
        membershipStatus: 'ACTIVE',
      } as any);
      mockPrisma.statusHistory.create.mockResolvedValue({ id: 1 } as any);

      await statusUpgradeService.downgradeUserStatus(1, 'ACTIVE', 'subscription_cancelled');

      expect(mockPrisma.statusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          reason: 'subscription_cancelled',
        }),
      });
    });
  });

  describe('canUpgradeTo', () => {
    it('devrait autoriser PENDING → ACTIVE', () => {
      expect(statusUpgradeService.canUpgradeTo('PENDING', 'ACTIVE')).toBe(true);
    });

    it('devrait autoriser ACTIVE → PREMIUM', () => {
      expect(statusUpgradeService.canUpgradeTo('ACTIVE', 'PREMIUM')).toBe(true);
    });

    it('devrait autoriser PREMIUM → VIP', () => {
      expect(statusUpgradeService.canUpgradeTo('PREMIUM', 'VIP')).toBe(true);
    });

    it('devrait rejeter PENDING → PREMIUM', () => {
      expect(statusUpgradeService.canUpgradeTo('PENDING', 'PREMIUM')).toBe(false);
    });

    it('devrait rejeter PENDING → VIP', () => {
      expect(statusUpgradeService.canUpgradeTo('PENDING', 'VIP')).toBe(false);
    });

    it('devrait rejeter ACTIVE → VIP', () => {
      expect(statusUpgradeService.canUpgradeTo('ACTIVE', 'VIP')).toBe(false);
    });

    it('devrait rejeter les downgrades', () => {
      expect(statusUpgradeService.canUpgradeTo('PREMIUM', 'ACTIVE')).toBe(false);
      expect(statusUpgradeService.canUpgradeTo('VIP', 'PREMIUM')).toBe(false);
      expect(statusUpgradeService.canUpgradeTo('VIP', 'ACTIVE')).toBe(false);
    });

    it('devrait rejeter le même statut', () => {
      expect(statusUpgradeService.canUpgradeTo('ACTIVE', 'ACTIVE')).toBe(false);
    });
  });

  describe('getUpgradePrice', () => {
    it('devrait retourner le prix pour PENDING → ACTIVE', () => {
      const price = statusUpgradeService.getUpgradePrice('PENDING', 'ACTIVE');
      expect(price).toEqual({
        amount: 1000, // 10 EUR
        currency: 'eur',
        description: 'Activation du compte',
      });
    });

    it('devrait retourner le prix pour ACTIVE → PREMIUM', () => {
      const price = statusUpgradeService.getUpgradePrice('ACTIVE', 'PREMIUM');
      expect(price).toEqual({
        amount: 2999, // 29.99 EUR
        currency: 'eur',
        description: 'Upgrade vers Premium',
      });
    });

    it('devrait retourner le prix pour PREMIUM → VIP', () => {
      const price = statusUpgradeService.getUpgradePrice('PREMIUM', 'VIP');
      expect(price).toEqual({
        amount: 9999, // 99.99 EUR
        currency: 'eur',
        description: 'Upgrade vers VIP',
      });
    });

    it('devrait rejeter les transitions invalides', () => {
      expect(() => {
        statusUpgradeService.getUpgradePrice('PENDING', 'VIP');
      }).toThrow('Invalid upgrade transition');
    });
  });

  describe('getStatusPermissions', () => {
    it('devrait retourner les permissions pour PENDING', () => {
      const permissions = statusUpgradeService.getStatusPermissions('PENDING');
      expect(permissions).toEqual({
        canAccessCourses: false,
        canBookClasses: false,
        canAccessShop: false,
        maxBookingsPerWeek: 0,
        discountRate: 0,
      });
    });

    it('devrait retourner les permissions pour ACTIVE', () => {
      const permissions = statusUpgradeService.getStatusPermissions('ACTIVE');
      expect(permissions).toEqual({
        canAccessCourses: true,
        canBookClasses: true,
        canAccessShop: true,
        maxBookingsPerWeek: 2,
        discountRate: 0,
      });
    });

    it('devrait retourner les permissions pour PREMIUM', () => {
      const permissions = statusUpgradeService.getStatusPermissions('PREMIUM');
      expect(permissions).toEqual({
        canAccessCourses: true,
        canBookClasses: true,
        canAccessShop: true,
        maxBookingsPerWeek: 5,
        discountRate: 10,
      });
    });

    it('devrait retourner les permissions pour VIP', () => {
      const permissions = statusUpgradeService.getStatusPermissions('VIP');
      expect(permissions).toEqual({
        canAccessCourses: true,
        canBookClasses: true,
        canAccessShop: true,
        maxBookingsPerWeek: -1, // Illimité
        discountRate: 20,
        priorityBooking: true,
        personalTrainer: true,
      });
    });

    it('devrait retourner les permissions pour INACTIVE', () => {
      const permissions = statusUpgradeService.getStatusPermissions('INACTIVE');
      expect(permissions).toEqual({
        canAccessCourses: false,
        canBookClasses: false,
        canAccessShop: false,
        maxBookingsPerWeek: 0,
        discountRate: 0,
      });
    });
  });

  describe('getStatusHistory', () => {
    it('devrait récupérer l\'historique des statuts', async () => {
      const mockHistory = [
        {
          id: 1,
          userId: 1,
          fromStatus: 'PENDING',
          toStatus: 'ACTIVE',
          reason: 'upgrade',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 2,
          userId: 1,
          fromStatus: 'ACTIVE',
          toStatus: 'PREMIUM',
          reason: 'upgrade',
          createdAt: new Date('2024-02-01'),
        },
      ];

      mockPrisma.statusHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await statusUpgradeService.getStatusHistory(1);

      expect(result).toEqual(mockHistory);
      expect(mockPrisma.statusHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('devrait retourner un tableau vide si pas d\'historique', async () => {
      mockPrisma.statusHistory.findMany.mockResolvedValue([]);

      const result = await statusUpgradeService.getStatusHistory(1);

      expect(result).toEqual([]);
    });

    it('devrait limiter les résultats', async () => {
      mockPrisma.statusHistory.findMany.mockResolvedValue([]);

      await statusUpgradeService.getStatusHistory(1, { limit: 5 });

      expect(mockPrisma.statusHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });
  });

  describe('getNextAvailableStatus', () => {
    it('devrait retourner ACTIVE pour PENDING', () => {
      const next = statusUpgradeService.getNextAvailableStatus('PENDING');
      expect(next).toBe('ACTIVE');
    });

    it('devrait retourner PREMIUM pour ACTIVE', () => {
      const next = statusUpgradeService.getNextAvailableStatus('ACTIVE');
      expect(next).toBe('PREMIUM');
    });

    it('devrait retourner VIP pour PREMIUM', () => {
      const next = statusUpgradeService.getNextAvailableStatus('PREMIUM');
      expect(next).toBe('VIP');
    });

    it('devrait retourner null pour VIP (niveau max)', () => {
      const next = statusUpgradeService.getNextAvailableStatus('VIP');
      expect(next).toBeNull();
    });

    it('devrait retourner null pour INACTIVE', () => {
      const next = statusUpgradeService.getNextAvailableStatus('INACTIVE');
      expect(next).toBeNull();
    });
  });

  describe('calculateUpgradePath', () => {
    it('devrait calculer le chemin PENDING → VIP', () => {
      const path = statusUpgradeService.calculateUpgradePath('PENDING', 'VIP');
      expect(path).toEqual([
        { from: 'PENDING', to: 'ACTIVE', price: 1000 },
        { from: 'ACTIVE', to: 'PREMIUM', price: 2999 },
        { from: 'PREMIUM', to: 'VIP', price: 9999 },
      ]);
    });

    it('devrait calculer le chemin ACTIVE → VIP', () => {
      const path = statusUpgradeService.calculateUpgradePath('ACTIVE', 'VIP');
      expect(path).toEqual([
        { from: 'ACTIVE', to: 'PREMIUM', price: 2999 },
        { from: 'PREMIUM', to: 'VIP', price: 9999 },
      ]);
    });

    it('devrait calculer le chemin direct PENDING → ACTIVE', () => {
      const path = statusUpgradeService.calculateUpgradePath('PENDING', 'ACTIVE');
      expect(path).toEqual([
        { from: 'PENDING', to: 'ACTIVE', price: 1000 },
      ]);
    });

    it('devrait retourner tableau vide pour statut identique', () => {
      const path = statusUpgradeService.calculateUpgradePath('ACTIVE', 'ACTIVE');
      expect(path).toEqual([]);
    });

    it('devrait rejeter les downgrades', () => {
      expect(() => {
        statusUpgradeService.calculateUpgradePath('PREMIUM', 'ACTIVE');
      }).toThrow('Cannot calculate downgrade path');
    });
  });

  describe('getTotalUpgradeCost', () => {
    it('devrait calculer le coût total PENDING → VIP', () => {
      const cost = statusUpgradeService.getTotalUpgradeCost('PENDING', 'VIP');
      expect(cost).toBe(13998); // 10 + 29.99 + 99.99 = 139.98 EUR
    });

    it('devrait calculer le coût total ACTIVE → VIP', () => {
      const cost = statusUpgradeService.getTotalUpgradeCost('ACTIVE', 'VIP');
      expect(cost).toBe(12998); // 29.99 + 99.99 = 129.98 EUR
    });

    it('devrait calculer le coût pour upgrade direct', () => {
      const cost = statusUpgradeService.getTotalUpgradeCost('PENDING', 'ACTIVE');
      expect(cost).toBe(1000); // 10 EUR
    });

    it('devrait retourner 0 pour statut identique', () => {
      const cost = statusUpgradeService.getTotalUpgradeCost('ACTIVE', 'ACTIVE');
      expect(cost).toBe(0);
    });
  });

  describe('isStatusActive', () => {
    it('devrait retourner true pour ACTIVE', () => {
      expect(statusUpgradeService.isStatusActive('ACTIVE')).toBe(true);
    });

    it('devrait retourner true pour PREMIUM', () => {
      expect(statusUpgradeService.isStatusActive('PREMIUM')).toBe(true);
    });

    it('devrait retourner true pour VIP', () => {
      expect(statusUpgradeService.isStatusActive('VIP')).toBe(true);
    });

    it('devrait retourner false pour PENDING', () => {
      expect(statusUpgradeService.isStatusActive('PENDING')).toBe(false);
    });

    it('devrait retourner false pour INACTIVE', () => {
      expect(statusUpgradeService.isStatusActive('INACTIVE')).toBe(false);
    });
  });

  describe('compareStatuses', () => {
    it('devrait retourner 1 si status1 > status2', () => {
      expect(statusUpgradeService.compareStatuses('PREMIUM', 'ACTIVE')).toBe(1);
      expect(statusUpgradeService.compareStatuses('VIP', 'PREMIUM')).toBe(1);
    });

    it('devrait retourner -1 si status1 < status2', () => {
      expect(statusUpgradeService.compareStatuses('ACTIVE', 'PREMIUM')).toBe(-1);
      expect(statusUpgradeService.compareStatuses('PENDING', 'ACTIVE')).toBe(-1);
    });

    it('devrait retourner 0 si status1 === status2', () => {
      expect(statusUpgradeService.compareStatuses('ACTIVE', 'ACTIVE')).toBe(0);
      expect(statusUpgradeService.compareStatuses('PREMIUM', 'PREMIUM')).toBe(0);
    });
  });

  describe('validateStatusTransition', () => {
    it('devrait valider une transition valide', () => {
      expect(() => {
        statusUpgradeService.validateStatusTransition('PENDING', 'ACTIVE');
      }).not.toThrow();
    });

    it('devrait rejeter une transition invalide', () => {
      expect(() => {
        statusUpgradeService.validateStatusTransition('PENDING', 'VIP');
      }).toThrow('Invalid status transition');
    });

    it('devrait rejeter un downgrade', () => {
      expect(() => {
        statusUpgradeService.validateStatusTransition('PREMIUM', 'ACTIVE');
      }).toThrow('Downgrade not allowed');
    });
  });

  describe('getStatusBenefits', () => {
    it('devrait lister les bénéfices du statut ACTIVE', () => {
      const benefits = statusUpgradeService.getStatusBenefits('ACTIVE');
      expect(benefits).toContain('Accès aux cours');
      expect(benefits).toContain('Réservation de 2 cours par semaine');
      expect(benefits).toContain('Accès à la boutique');
    });

    it('devrait lister les bénéfices du statut PREMIUM', () => {
      const benefits = statusUpgradeService.getStatusBenefits('PREMIUM');
      expect(benefits).toContain('Accès aux cours');
      expect(benefits).toContain('Réservation de 5 cours par semaine');
      expect(benefits).toContain('10% de réduction');
    });

    it('devrait lister les bénéfices du statut VIP', () => {
      const benefits = statusUpgradeService.getStatusBenefits('VIP');
      expect(benefits).toContain('Réservations illimitées');
      expect(benefits).toContain('20% de réduction');
      expect(benefits).toContain('Réservation prioritaire');
      expect(benefits).toContain('Coach personnel');
    });
  });

  describe('Edge Cases', () => {
    it('devrait gérer les statuts null/undefined', () => {
      expect(() => {
        statusUpgradeService.canUpgradeTo(null as any, 'ACTIVE');
      }).toThrow('Invalid status');

      expect(() => {
        statusUpgradeService.canUpgradeTo('ACTIVE', undefined as any);
      }).toThrow('Invalid status');
    });

    it('devrait gérer les statuts inconnus', () => {
      expect(() => {
        statusUpgradeService.canUpgradeTo('UNKNOWN' as any, 'ACTIVE');
      }).toThrow('Unknown status');
    });

    it('devrait gérer les erreurs de base de données', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(
        statusUpgradeService.upgradeUserStatus(1, 'ACTIVE')
      ).rejects.toThrow('DB Error');

      expect(Sentry.captureException).toHaveBeenCalled();
    });
  });
});
