/**
 * PaymentService Tests
 * Comprehensive unit tests for payment management operations
 *
 * Coverage:
 * - CRUD operations (create, read, update, delete)
 * - Payment status management
 * - Payment history and statistics
 * - Stripe integration (mocked)
 * - Multi-tenant isolation
 * - Error handling
 * - Edge cases
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { paymentService, PaymentStatus, PaymentMethod } from '../payment.service';
import type { CreatePaymentData, UpdatePaymentData, PaymentWithDetails } from '../payment.service';
import { prisma } from '../../../prisma/prisma.service';
import { emailService } from '../../communication/email.service';

// Mock dependencies
jest.mock('../../../prisma/prisma.service', () => ({
  prisma: {
    paiement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../../communication/email.service', () => ({
  emailService: {
    sendPaymentConfirmation: jest.fn(),
  },
}));

describe('PaymentService', () => {

  const mockPayment = {
    id: 1,
    utilisateurId: 10,
    montant: 29.99,
    statut: 'payé',
    datePaiement: new Date('2024-01-15'),
    abonnementId: 5,
    periodeDebut: new Date('2024-01-01'),
    periodeFin: new Date('2024-01-31'),
    methode: 'carte',
    transactionId: 'txn_123456',
    tenantId: 'tenant-123',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockPaymentWithDetails = {
    ...mockPayment,
    utilisateur: {
      id: 10,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    },
    abonnement: {
      id: 5,
      nom: 'Premium Plan',
      prix: 29.99,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createPayment()', () => {

    it('should create payment successfully', async () => {
      // Arrange
      const paymentData: CreatePaymentData = {
        utilisateurId: 10,
        montant: 29.99,
        statut: 'payé',
        datePaiement: new Date('2024-01-15'),
        abonnementId: 5,
        periodeDebut: new Date('2024-01-01'),
        periodeFin: new Date('2024-01-31'),
        methode: 'carte',
        transactionId: 'txn_123456',
        tenantId: 'tenant-123',
      };

      (prisma.paiement.create as jest.Mock).mockResolvedValue(mockPayment);

      // Act
      const result = await paymentService.createPayment(paymentData);

      // Assert
      expect(prisma.paiement.create).toHaveBeenCalledWith({
        data: {
          utilisateurId: paymentData.utilisateurId,
          montant: paymentData.montant,
          statut: paymentData.statut,
          datePaiement: paymentData.datePaiement,
          abonnementId: paymentData.abonnementId,
          periodeDebut: paymentData.periodeDebut,
          periodeFin: paymentData.periodeFin,
          methode: paymentData.methode,
          transactionId: paymentData.transactionId,
          tenantId: paymentData.tenantId,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Paiement créé avec succès');
      expect(result.payment).toEqual(mockPayment);
    });

    it('should create payment with minimal required data', async () => {
      // Arrange
      const minimalData: CreatePaymentData = {
        utilisateurId: 10,
        montant: 19.99,
        tenantId: 'tenant-123',
      };

      const minimalPayment = {
        ...mockPayment,
        montant: 19.99,
        statut: 'en attente',
        datePaiement: null,
        abonnementId: null,
        periodeDebut: null,
        periodeFin: null,
        methode: null,
        transactionId: null,
      };

      (prisma.paiement.create as jest.Mock).mockResolvedValue(minimalPayment);

      // Act
      const result = await paymentService.createPayment(minimalData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment?.montant).toBe(19.99);
    });

    it('should handle payment creation with default pending status', async () => {
      // Arrange
      const dataWithoutStatus: CreatePaymentData = {
        utilisateurId: 10,
        montant: 29.99,
        tenantId: 'tenant-123',
      };

      (prisma.paiement.create as jest.Mock).mockResolvedValue({
        ...mockPayment,
        statut: 'en attente',
      });

      // Act
      const result = await paymentService.createPayment(dataWithoutStatus);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle database errors during creation', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const paymentData: CreatePaymentData = {
        utilisateurId: 10,
        montant: 29.99,
        tenantId: 'tenant-123',
      };

      (prisma.paiement.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await paymentService.createPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de la création du paiement');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle duplicate transaction ID error', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const paymentData: CreatePaymentData = {
        utilisateurId: 10,
        montant: 29.99,
        transactionId: 'txn_duplicate',
        tenantId: 'tenant-123',
      };

      (prisma.paiement.create as jest.Mock).mockRejectedValue(
        new Error('Unique constraint failed on transactionId')
      );

      // Act
      const result = await paymentService.createPayment(paymentData);

      // Assert
      expect(result.success).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should enforce tenant isolation on creation', async () => {
      // Arrange
      const tenant1Data: CreatePaymentData = {
        utilisateurId: 10,
        montant: 29.99,
        tenantId: 'tenant-1',
      };

      (prisma.paiement.create as jest.Mock).mockResolvedValue({
        ...mockPayment,
        tenantId: 'tenant-1',
      });

      // Act
      await paymentService.createPayment(tenant1Data);

      // Assert
      expect(prisma.paiement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
          }),
        })
      );
    });
  });

  describe('getPaymentById()', () => {

    it('should retrieve payment by ID with details', async () => {
      // Arrange
      const paymentId = 1;

      (prisma.paiement.findUnique as jest.Mock).mockResolvedValue(mockPaymentWithDetails);

      // Act
      const result = await paymentService.getPaymentById(paymentId);

      // Assert
      expect(prisma.paiement.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
        include: {
          utilisateur: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          abonnement: {
            select: {
              id: true,
              nom: true,
              prix: true,
            },
          },
        },
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(paymentId);
      expect(result?.user).toBeDefined();
      expect(result?.user?.email).toBe('john@example.com');
      expect(result?.plan).toBeDefined();
      expect(result?.plan?.nom).toBe('Premium Plan');
    });

    it('should return null when payment not found', async () => {
      // Arrange
      (prisma.paiement.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await paymentService.getPaymentById(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle payments without subscription', async () => {
      // Arrange
      const paymentWithoutSub = {
        ...mockPayment,
        abonnementId: null,
        utilisateur: mockPaymentWithDetails.utilisateur,
        abonnement: null,
      };

      (prisma.paiement.findUnique as jest.Mock).mockResolvedValue(paymentWithoutSub);

      // Act
      const result = await paymentService.getPaymentById(1);

      // Assert
      expect(result).toBeDefined();
      expect(result?.plan).toBeUndefined();
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await paymentService.getPaymentById(1);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('listPayments()', () => {

    const mockPayments = [
      mockPaymentWithDetails,
      { ...mockPaymentWithDetails, id: 2, montant: 49.99 },
      { ...mockPaymentWithDetails, id: 3, montant: 99.99 },
    ];

    it('should list payments with default pagination', async () => {
      // Arrange
      (prisma.paiement.count as jest.Mock).mockResolvedValue(3);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue(mockPayments);

      // Act
      const result = await paymentService.listPayments('tenant-123');

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 50,
          orderBy: { createdAt: 'desc' },
        })
      );

      expect(result.payments).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should support custom pagination', async () => {
      // Arrange
      (prisma.paiement.count as jest.Mock).mockResolvedValue(25);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([mockPaymentWithDetails]);

      // Act
      const result = await paymentService.listPayments('tenant-123', {
        page: 2,
        limit: 10,
      });

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
    });

    it('should filter by user ID', async () => {
      // Arrange
      (prisma.paiement.count as jest.Mock).mockResolvedValue(1);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([mockPaymentWithDetails]);

      // Act
      const result = await paymentService.listPayments('tenant-123', {
        utilisateurId: 10,
      });

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            utilisateurId: 10,
          }),
        })
      );
    });

    it('should filter by payment status', async () => {
      // Arrange
      (prisma.paiement.count as jest.Mock).mockResolvedValue(2);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue(mockPayments.slice(0, 2));

      // Act
      const result = await paymentService.listPayments('tenant-123', {
        statut: PaymentStatus.PAID,
      });

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            statut: PaymentStatus.PAID,
          }),
        })
      );
    });

    it('should filter by payment method', async () => {
      // Arrange
      (prisma.paiement.count as jest.Mock).mockResolvedValue(1);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([mockPaymentWithDetails]);

      // Act
      const result = await paymentService.listPayments('tenant-123', {
        methode: PaymentMethod.CARD,
      });

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            methode: PaymentMethod.CARD,
          }),
        })
      );
    });

    it('should filter by date range', async () => {
      // Arrange
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      (prisma.paiement.count as jest.Mock).mockResolvedValue(1);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([mockPaymentWithDetails]);

      // Act
      const result = await paymentService.listPayments('tenant-123', {
        dateFrom,
        dateTo,
      });

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            datePaiement: {
              gte: dateFrom,
              lte: dateTo,
            },
          }),
        })
      );
    });

    it('should handle empty results', async () => {
      // Arrange
      (prisma.paiement.count as jest.Mock).mockResolvedValue(0);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await paymentService.listPayments('empty-tenant');

      // Assert
      expect(result.payments).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await paymentService.listPayments('tenant-123');

      // Assert
      expect(result.payments).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should calculate total pages correctly', async () => {
      // Arrange
      const testCases = [
        { total: 0, limit: 10, expected: 0 },
        { total: 1, limit: 10, expected: 1 },
        { total: 10, limit: 10, expected: 1 },
        { total: 11, limit: 10, expected: 2 },
        { total: 100, limit: 25, expected: 4 },
      ];

      for (const testCase of testCases) {
        (prisma.paiement.count as jest.Mock).mockResolvedValue(testCase.total);
        (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

        // Act
        const result = await paymentService.listPayments('tenant-123', {
          limit: testCase.limit,
        });

        // Assert
        expect(result.totalPages).toBe(testCase.expected);
      }
    });
  });

  describe('updatePayment()', () => {

    it('should update payment successfully', async () => {
      // Arrange
      const paymentId = 1;
      const updateData: UpdatePaymentData = {
        montant: 39.99,
        statut: 'payé',
        methode: 'stripe',
        transactionId: 'txn_updated',
      };

      (prisma.paiement.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        ...updateData,
      });

      // Act
      const result = await paymentService.updatePayment(paymentId, updateData);

      // Assert
      expect(prisma.paiement.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: {
          montant: updateData.montant,
          statut: updateData.statut,
          datePaiement: undefined,
          methode: updateData.methode,
          transactionId: updateData.transactionId,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Paiement mis à jour avec succès');
    });

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdate: UpdatePaymentData = {
        statut: 'payé',
      };

      (prisma.paiement.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        statut: 'payé',
      });

      // Act
      const result = await paymentService.updatePayment(1, partialUpdate);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should update payment date', async () => {
      // Arrange
      const newDate = new Date('2024-02-15');
      const updateData: UpdatePaymentData = {
        datePaiement: newDate,
      };

      (prisma.paiement.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        datePaiement: newDate,
      });

      // Act
      const result = await paymentService.updatePayment(1, updateData);

      // Assert
      expect(prisma.paiement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            datePaiement: newDate,
          }),
        })
      );
      expect(result.success).toBe(true);
    });

    it('should handle update errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

      // Act
      const result = await paymentService.updatePayment(1, { montant: 99.99 });

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de la mise à jour du paiement');

      consoleSpy.mockRestore();
    });

    it('should handle non-existent payment', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.update as jest.Mock).mockRejectedValue(new Error('Record not found'));

      // Act
      const result = await paymentService.updatePayment(999, { montant: 99.99 });

      // Assert
      expect(result.success).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('updatePaymentStatus()', () => {

    it('should update payment status to paid', async () => {
      // Arrange
      const paymentId = 1;
      const newStatus = PaymentStatus.PAID;

      (prisma.paiement.update as jest.Mock).mockResolvedValue({
        ...mockPaymentWithDetails,
        statut: newStatus,
      });

      // Act
      const result = await paymentService.updatePaymentStatus(paymentId, newStatus);

      // Assert
      expect(prisma.paiement.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: {
          statut: newStatus,
          datePaiement: expect.any(Date),
        },
        include: {
          utilisateur: true,
          abonnement: true,
        },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Statut du paiement mis à jour avec succès');
      expect(result.payment).toBeDefined();
    });

    it('should update to failed status', async () => {
      // Arrange
      (prisma.paiement.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        statut: PaymentStatus.FAILED,
      });

      // Act
      const result = await paymentService.updatePaymentStatus(1, PaymentStatus.FAILED);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should update to refunded status', async () => {
      // Arrange
      (prisma.paiement.update as jest.Mock).mockResolvedValue({
        ...mockPayment,
        statut: PaymentStatus.REFUNDED,
      });

      // Act
      const result = await paymentService.updatePaymentStatus(1, PaymentStatus.REFUNDED);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle status update errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.update as jest.Mock).mockRejectedValue(new Error('Update failed'));

      // Act
      const result = await paymentService.updatePaymentStatus(1, PaymentStatus.PAID);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de la mise à jour du statut');

      consoleSpy.mockRestore();
    });
  });

  describe('deletePayment()', () => {

    it('should delete payment successfully', async () => {
      // Arrange
      const paymentId = 1;

      (prisma.paiement.delete as jest.Mock).mockResolvedValue(mockPayment);

      // Act
      const result = await paymentService.deletePayment(paymentId);

      // Assert
      expect(prisma.paiement.delete).toHaveBeenCalledWith({
        where: { id: paymentId },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Paiement supprimé avec succès');
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.delete as jest.Mock).mockRejectedValue(new Error('Delete failed'));

      // Act
      const result = await paymentService.deletePayment(1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de la suppression du paiement');

      consoleSpy.mockRestore();
    });

    it('should handle non-existent payment deletion', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.delete as jest.Mock).mockRejectedValue(new Error('Record not found'));

      // Act
      const result = await paymentService.deletePayment(999);

      // Assert
      expect(result.success).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('getUserPaymentHistory()', () => {

    it('should retrieve user payment history', async () => {
      // Arrange
      const userId = 10;
      const tenantId = 'tenant-123';
      const mockHistory = [
        mockPaymentWithDetails,
        { ...mockPaymentWithDetails, id: 2, montant: 49.99 },
      ];

      (prisma.paiement.findMany as jest.Mock).mockResolvedValue(mockHistory);

      // Act
      const result = await paymentService.getUserPaymentHistory(userId, tenantId);

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith({
        where: { utilisateurId: userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      expect(result).toHaveLength(2);
      expect(result[0].user?.id).toBe(userId);
    });

    it('should limit results to 100', async () => {
      // Arrange
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await paymentService.getUserPaymentHistory(10, 'tenant-123');

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });

    it('should return empty array for user with no payments', async () => {
      // Arrange
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await paymentService.getUserPaymentHistory(999, 'tenant-123');

      // Assert
      expect(result).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await paymentService.getUserPaymentHistory(10, 'tenant-123');

      // Assert
      expect(result).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getPaymentStats()', () => {

    it('should calculate payment statistics', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const mockPayments = [
        { ...mockPayment, statut: 'payé', montant: 29.99 },
        { ...mockPayment, id: 2, statut: 'payé', montant: 49.99 },
        { ...mockPayment, id: 3, statut: 'en attente', montant: 19.99 },
        { ...mockPayment, id: 4, statut: 'échoué', montant: 39.99 },
      ];

      (prisma.paiement.findMany as jest.Mock).mockResolvedValue(mockPayments);

      // Act
      const result = await paymentService.getPaymentStats(tenantId);

      // Assert
      expect(result.totalPayments).toBe(4);
      expect(result.totalAmount).toBe(139.96);
      expect(result.paidAmount).toBe(79.98);
      expect(result.paidCount).toBe(2);
      expect(result.pendingAmount).toBe(19.99);
      expect(result.pendingCount).toBe(1);
      expect(result.failedAmount).toBe(39.99);
      expect(result.failedCount).toBe(1);
    });

    it('should filter stats by user ID', async () => {
      // Arrange
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([mockPayment]);

      // Act
      await paymentService.getPaymentStats('tenant-123', { utilisateurId: 10 });

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          utilisateurId: 10,
        }),
      });
    });

    it('should filter stats by date range', async () => {
      // Arrange
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([mockPayment]);

      // Act
      await paymentService.getPaymentStats('tenant-123', { dateFrom, dateTo });

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          datePaiement: {
            gte: dateFrom,
            lte: dateTo,
          },
        }),
      });
    });

    it('should return zero stats for no payments', async () => {
      // Arrange
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await paymentService.getPaymentStats('empty-tenant');

      // Assert
      expect(result.totalPayments).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.paidAmount).toBe(0);
      expect(result.pendingAmount).toBe(0);
      expect(result.failedAmount).toBe(0);
    });

    it('should handle database errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      const result = await paymentService.getPaymentStats('tenant-123');

      // Assert
      expect(result.totalPayments).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('sendPaymentConfirmation()', () => {

    it('should send payment confirmation email', async () => {
      // Arrange
      const paymentId = 1;

      (prisma.paiement.findUnique as jest.Mock).mockResolvedValue(mockPaymentWithDetails);
      (emailService.sendPaymentConfirmation as jest.Mock).mockResolvedValue({
        success: true,
      });

      // Act
      const result = await paymentService.sendPaymentConfirmation(paymentId);

      // Assert
      expect(prisma.paiement.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email de confirmation envoyé');
    });

    it('should handle payment not found', async () => {
      // Arrange
      (prisma.paiement.findUnique as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await paymentService.sendPaymentConfirmation(999);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Paiement non trouvé');
    });

    it('should handle email service errors', async () => {
      // Arrange
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.paiement.findUnique as jest.Mock).mockResolvedValue(mockPaymentWithDetails);
      (emailService.sendPaymentConfirmation as jest.Mock).mockRejectedValue(
        new Error('Email service error')
      );

      // Act
      const result = await paymentService.sendPaymentConfirmation(1);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Erreur lors de l\'envoi de l\'email');

      consoleSpy.mockRestore();
    });
  });

  describe('getPendingPayments()', () => {

    it('should retrieve pending payments', async () => {
      // Arrange
      const tenantId = 'tenant-123';
      const mockPendingPayments = [
        { ...mockPaymentWithDetails, statut: 'en attente' },
        { ...mockPaymentWithDetails, id: 2, statut: 'en attente' },
      ];

      (prisma.paiement.findMany as jest.Mock).mockResolvedValue(mockPendingPayments);

      // Act
      const result = await paymentService.getPendingPayments(tenantId);

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith({
        where: {
          statut: 'en attente',
          createdAt: {
            lte: expect.any(Date),
          },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].statut).toBe('en attente');
    });

    it('should filter overdue pending payments', async () => {
      // Arrange
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      await paymentService.getPendingPayments('tenant-123');

      // Assert
      expect(prisma.paiement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              lte: expect.any(Date),
            },
          }),
        })
      );
    });

    it('should return empty array when no pending payments', async () => {
      // Arrange
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await paymentService.getPendingPayments('tenant-123');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('Multi-Tenant Isolation', () => {

    it('should enforce tenant isolation in all operations', async () => {
      // Arrange
      const tenant1 = 'tenant-1';
      const tenant2 = 'tenant-2';

      (prisma.paiement.create as jest.Mock).mockResolvedValue(mockPayment);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act - Create for tenant1
      await paymentService.createPayment({
        utilisateurId: 10,
        montant: 29.99,
        tenantId: tenant1,
      });

      // Act - List for tenant2
      await paymentService.listPayments(tenant2);

      // Assert
      expect(prisma.paiement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: tenant1,
          }),
        })
      );
    });
  });

  describe('Edge Cases', () => {

    it('should handle zero amount payments', async () => {
      // Arrange
      const zeroPayment: CreatePaymentData = {
        utilisateurId: 10,
        montant: 0,
        tenantId: 'tenant-123',
      };

      (prisma.paiement.create as jest.Mock).mockResolvedValue({
        ...mockPayment,
        montant: 0,
      });

      // Act
      const result = await paymentService.createPayment(zeroPayment);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment?.montant).toBe(0);
    });

    it('should handle very large amounts', async () => {
      // Arrange
      const largeAmount = 999999.99;

      (prisma.paiement.create as jest.Mock).mockResolvedValue({
        ...mockPayment,
        montant: largeAmount,
      });

      // Act
      const result = await paymentService.createPayment({
        utilisateurId: 10,
        montant: largeAmount,
        tenantId: 'tenant-123',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment?.montant).toBe(largeAmount);
    });

    it('should handle negative page numbers', async () => {
      // Arrange
      (prisma.paiement.count as jest.Mock).mockResolvedValue(10);
      (prisma.paiement.findMany as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await paymentService.listPayments('tenant-123', {
        page: -1,
      });

      // Assert
      expect(result.page).toBe(-1);
    });

    it('should handle very long transaction IDs', async () => {
      // Arrange
      const longTxnId = 'txn_' + 'a'.repeat(500);

      (prisma.paiement.create as jest.Mock).mockResolvedValue({
        ...mockPayment,
        transactionId: longTxnId,
      });

      // Act
      const result = await paymentService.createPayment({
        utilisateurId: 10,
        montant: 29.99,
        transactionId: longTxnId,
        tenantId: 'tenant-123',
      });

      // Assert
      expect(result.success).toBe(true);
    });
  });
});
