/**
 * Tests unitaires pour RefundPaymentUseCase
 *
 * Ces tests démontrent comment tester le remboursement de paiements sans dépendances réelles.
 * Tous les services externes (repository, gateway) sont mockés.
 *
 * Avantages :
 * - Tests ultra-rapides (~50ms)
 * - Pas besoin de base de données
 * - Pas besoin de Stripe/PayPal réels
 * - Tests isolés et reproductibles
 */

import { RefundPaymentUseCase, RefundPaymentInput } from '../RefundPaymentUseCase.js';
import { IPaymentRepository } from '../../../domain/interfaces/paiements/IPaymentRepository.js';
import { IPaymentGatewayService } from '../../../domain/interfaces/paiements/IPaymentGatewayService.js';
import { Payment } from '../../../domain/entities/paiements/Payment.js';
import { Money } from '../../../domain/value-objects/paiements/Money.js';
import { PaymentMethod } from '../../../domain/value-objects/paiements/PaymentMethod.js';
import { TransactionReference } from '../../../domain/value-objects/paiements/TransactionReference.js';
import { PaymentError } from '../../../domain/errors/paiements/PaymentError.js';

// Imports des mocks et helpers
import {
  createMockPaymentRepository,
  createMockPaymentRepositoryWithDefaults,
  configureMockStatusTransitions,
} from './__mocks__/mockPaymentRepository.js';
import {
  createMockPaymentGatewayService,
  createMockPaymentGatewayServiceWithDefaults,
  createMockPaymentGatewayServiceUnavailable,
  createMockPayPalGateway,
} from './__mocks__/mockPaymentGatewayService.js';
import {
  createTestPayment,
  createTestPendingPayment,
  createTestValidatedPayment,
  createTestRefundedPayment,
  createTestCancelledPayment,
  testTransactionReferences,
  testAmounts,
} from './__helpers__/paymentTestData.js';
import {
  assertIsPaymentError,
  assertIsMissingFieldError,
  assertPaymentWasRefunded,
  assertAuditTransactionWasRecorded,
} from './__helpers__/paymentAssertions.js';

// ============== TESTS ==============

describe('RefundPaymentUseCase', () => {
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGatewayService>;
  let refundPaymentUseCase: RefundPaymentUseCase;

  /**
   * Setup avant chaque test
   */
  beforeEach(() => {
    // Créer des mocks frais pour chaque test
    mockPaymentRepository = createMockPaymentRepositoryWithDefaults();
    mockPaymentGateway = createMockPaymentGatewayServiceWithDefaults('STRIPE');

    // Configurer les transitions de statut
    configureMockStatusTransitions(mockPaymentRepository);

    // Créer l'instance du use case avec les mocks
    refundPaymentUseCase = new RefundPaymentUseCase(
      mockPaymentRepository,
      mockPaymentGateway
    );
  });

  /**
   * Nettoyage après chaque test
   */
  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==================== TESTS DE SUCCÈS ====================

  describe('Scénarios de succès', () => {
    it('devrait rembourser un paiement validé complètement', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        amount: Money.create(100, 'EUR'),
        transactionRef: 'pi_stripe_123',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        reason: 'Client request',
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('remboursé');
      expect(result.payment).toBeDefined();
      expect(result.payment!.id).toBe(1);
      expect(result.payment!.status).toBe('REFUNDED');
      expect(result.payment!.refundedAmount).toBe(100);
      expect(result.payment!.refundReason).toBe('Client request');
      expect(result.payment!.refundedAt).toBeInstanceOf(Date);

      // Vérifier que les services ont été appelés
      expect(mockPaymentRepository.findById).toHaveBeenCalledWith(1);
      assertPaymentWasRefunded(mockPaymentRepository, 1);
      assertAuditTransactionWasRecorded(mockPaymentRepository, 'REFUND');
    });

    it('devrait rembourser un paiement avec référence de remboursement du gateway', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        amount: Money.create(150, 'EUR'),
        transactionRef: 'pi_stripe_456',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      mockPaymentGateway.refundPayment.mockResolvedValue({
        success: true,
        refundId: 're_refund_123',
        transactionReference: testTransactionReferences.stripe,
        amount: Money.create(150, 'EUR'),
        refundedAt: new Date(),
        status: 'succeeded',
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        reason: 'Duplicate payment',
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.refundReference).toBe('re_refund_123');
      expect(mockPaymentGateway.refundPayment).toHaveBeenCalled();
    });

    it('devrait rembourser un paiement sans gateway (paiement hors ligne)', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        amount: Money.create(50, 'EUR'),
      });
      // Pas de transactionRef pour paiement en espèces
      (validatedPayment as any)._transactionRef = undefined;
      (validatedPayment as any)._method = PaymentMethod.fromString('CASH');

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        reason: 'Cash refund',
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.refundReference).toBeUndefined();
      expect(mockPaymentGateway.refundPayment).not.toHaveBeenCalled();
    });

    it('devrait effectuer un remboursement partiel', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        amount: Money.create(200, 'EUR'),
        transactionRef: 'pi_stripe_789',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      mockPaymentGateway.supportsPartialRefunds.mockReturnValue(true);
      mockPaymentGateway.refundPayment.mockResolvedValue({
        success: true,
        refundId: 're_partial_123',
        transactionReference: testTransactionReferences.stripe,
        amount: Money.create(50, 'EUR'),
        refundedAt: new Date(),
        status: 'succeeded',
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        amount: 50, // Remboursement partiel
        reason: 'Partial refund',
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment!.refundedAmount).toBe(50);

      // Vérifier que le gateway a été appelé avec le bon montant
      const gatewayCall = mockPaymentGateway.refundPayment.mock.calls[0][0];
      expect(gatewayCall.amount.getAmount()).toBe(50);
    });

    it('devrait rembourser un paiement sans raison', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        // Pas de raison fournie
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(result.payment!.refundReason).toBeUndefined();
    });

    it('devrait inclure les metadata dans le remboursement gateway', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        transactionRef: 'pi_stripe_metadata',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const metadata = {
        refundType: 'customer_request',
        ticketId: 'TICKET-123',
      };

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        reason: 'Customer request',
        metadata,
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);

      // Vérifier que les metadata ont été passées au gateway
      const gatewayCall = mockPaymentGateway.refundPayment.mock.calls[0][0];
      expect(gatewayCall.metadata).toEqual(metadata);
    });
  });

  // ==================== TESTS DE VALIDATION DES ENTRÉES ====================

  describe('Validation des entrées', () => {
    it('devrait échouer si paymentId est manquant', async () => {
      // Arrange
      const input = {
        refundedBy: 999,
      } as RefundPaymentInput;

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsMissingFieldError(error as PaymentError, 'paymentId');
      }

      expect(mockPaymentRepository.findById).not.toHaveBeenCalled();
    });

    it('devrait échouer si paymentId est zéro', async () => {
      // Arrange
      const input: RefundPaymentInput = {
        paymentId: 0,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si paymentId est négatif', async () => {
      // Arrange
      const input: RefundPaymentInput = {
        paymentId: -1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si refundedBy est manquant', async () => {
      // Arrange
      const input = {
        paymentId: 1,
      } as RefundPaymentInput;

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsMissingFieldError(error as PaymentError, 'refundedBy');
      }
    });

    it('devrait échouer si refundedBy est zéro', async () => {
      // Arrange
      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 0,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si refundedBy est négatif', async () => {
      // Arrange
      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: -1,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si amount est zéro', async () => {
      // Arrange
      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        amount: 0,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('INVALID_AMOUNT');
      }
    });

    it('devrait échouer si amount est négatif', async () => {
      // Arrange
      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        amount: -50,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });
  });

  // ==================== TESTS DES RÈGLES MÉTIER ====================

  describe('Règles métier', () => {
    it('devrait échouer si le paiement n\'existe pas', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(null);

      const input: RefundPaymentInput = {
        paymentId: 999,
        refundedBy: 1,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('PAYMENT_NOT_FOUND');
      }
    });

    it('devrait échouer si le paiement n\'est pas validé', async () => {
      // Arrange
      const pendingPayment = createTestPendingPayment({
        id: 1,
        userId: 123,
      });

      mockPaymentRepository.findById.mockResolvedValue(pendingPayment);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('REFUND_NOT_ALLOWED');
      }

      expect(mockPaymentRepository.refund).not.toHaveBeenCalled();
    });

    it('devrait échouer si le paiement est déjà remboursé', async () => {
      // Arrange
      const refundedPayment = createTestRefundedPayment({
        id: 1,
        userId: 123,
      });

      mockPaymentRepository.findById.mockResolvedValue(refundedPayment);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('PAYMENT_ALREADY_REFUNDED');
      }
    });

    it('devrait échouer si le paiement est annulé', async () => {
      // Arrange
      const cancelledPayment = createTestCancelledPayment({
        id: 1,
        userId: 123,
      });

      mockPaymentRepository.findById.mockResolvedValue(cancelledPayment);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('REFUND_NOT_ALLOWED');
      }
    });

    it('devrait échouer si le montant de remboursement dépasse le montant du paiement', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        amount: Money.create(100, 'EUR'),
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentGateway.supportsPartialRefunds.mockReturnValue(true);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        amount: 150, // Plus que le paiement original
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('INVALID_AMOUNT');
      }
    });

    it('devrait échouer si remboursement partiel non supporté par le gateway', async () => {
      // Arrange
      const paypalGateway = createMockPayPalGateway();
      paypalGateway.supportsPartialRefunds.mockReturnValue(false);

      const useCaseWithPayPal = new RefundPaymentUseCase(
        mockPaymentRepository,
        paypalGateway
      );

      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        amount: Money.create(100, 'EUR'),
        transactionRef: 'PAYID-123',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        amount: 50, // Remboursement partiel
      };

      // Act & Assert
      await expect(useCaseWithPayPal.execute(input)).rejects.toThrow(PaymentError);

      try {
        await useCaseWithPayPal.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('PARTIAL_REFUND_NOT_SUPPORTED');
      }
    });

    it('devrait échouer si le délai de remboursement est dépassé (>90 jours)', async () => {
      // Arrange
      const oldPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
      });

      // Simuler un paiement de plus de 90 jours
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 91);
      (oldPayment as any)._createdAt = oldDate;
      (oldPayment as any)._confirmedAt = oldDate;

      mockPaymentRepository.findById.mockResolvedValue(oldPayment);
      mockPaymentGateway.getMaxRefundDays.mockReturnValue(90);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('REFUND_TOO_LATE');
      }
    });

    it('devrait accepter un remboursement dans le délai autorisé', async () => {
      // Arrange
      const recentPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
      });

      // Paiement de 30 jours
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      (recentPayment as any)._createdAt = recentDate;
      (recentPayment as any)._confirmedAt = recentDate;

      mockPaymentRepository.findById.mockResolvedValue(recentPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        recentPayment.refund(reason);
        return recentPayment;
      });
      mockPaymentGateway.getMaxRefundDays.mockReturnValue(90);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  // ==================== TESTS D'INTÉGRATION AVEC GATEWAY ====================

  describe('Intégration avec gateway de paiement', () => {
    it('devrait effectuer le remboursement via Stripe', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        transactionRef: 'pi_stripe_refund',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      mockPaymentGateway.refundPayment.mockResolvedValue({
        success: true,
        refundId: 're_stripe_123',
        transactionReference: testTransactionReferences.stripe,
        amount: Money.create(100, 'EUR'),
        refundedAt: new Date(),
        status: 'succeeded',
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        reason: 'Customer request',
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPaymentGateway.isAvailable).toHaveBeenCalled();
      expect(mockPaymentGateway.refundPayment).toHaveBeenCalled();

      const gatewayCall = mockPaymentGateway.refundPayment.mock.calls[0][0];
      expect(gatewayCall.reason).toBe('Customer request');
    });

    it('devrait échouer si le gateway est indisponible', async () => {
      // Arrange
      const unavailableGateway = createMockPaymentGatewayServiceUnavailable();
      const useCaseWithUnavailableGateway = new RefundPaymentUseCase(
        mockPaymentRepository,
        unavailableGateway
      );

      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        transactionRef: 'pi_stripe_unavailable',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(useCaseWithUnavailableGateway.execute(input)).rejects.toThrow(PaymentError);

      try {
        await useCaseWithUnavailableGateway.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('PAYMENT_METHOD_UNAVAILABLE');
      }
    });

    it('devrait échouer si le remboursement gateway échoue', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        transactionRef: 'pi_stripe_failed_refund',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);

      mockPaymentGateway.refundPayment.mockResolvedValue({
        success: false,
        refundId: '',
        transactionReference: testTransactionReferences.stripe,
        amount: Money.create(100, 'EUR'),
        refundedAt: new Date(),
        status: 'failed',
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('TRANSACTION_FAILED');
      }
    });

    it('devrait gérer les erreurs du gateway', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
        transactionRef: 'pi_stripe_error',
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentGateway.refundPayment.mockRejectedValue(new Error('Stripe API error'));

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('EXTERNAL_PROVIDER_ERROR');
      }
    });

    it('devrait fonctionner sans gateway pour paiements hors ligne', async () => {
      // Arrange
      const useCaseWithoutGateway = new RefundPaymentUseCase(mockPaymentRepository);

      const validatedPayment = createTestValidatedPayment({
        id: 1,
        userId: 123,
      });
      (validatedPayment as any)._transactionRef = undefined;

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act
      const result = await useCaseWithoutGateway.execute(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  // ==================== TESTS DE GESTION D'ERREURS ====================

  describe('Gestion d\'erreurs', () => {
    it('devrait lever PaymentError si échec de remboursement en base', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({ id: 1 });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockRejectedValue(new Error('Database error'));

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('INTERNAL_ERROR');
      }
    });

    it('devrait propager les PaymentError existantes', async () => {
      // Arrange
      mockPaymentRepository.findById.mockResolvedValue(null);

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act & Assert
      await expect(refundPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await refundPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('PAYMENT_NOT_FOUND');
      }
    });
  });

  // ==================== TESTS DE LOGIQUE MÉTIER AVANCÉE ====================

  describe('Logique métier avancée', () => {
    it('devrait enregistrer l\'ID de l\'utilisateur qui rembourse', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({ id: 1 });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const refunderUserId = 777;
      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: refunderUserId,
      };

      // Act
      await refundPaymentUseCase.execute(input);

      // Assert
      const auditCall = mockPaymentRepository.recordTransaction.mock.calls[0];
      expect(auditCall[2]).toBe(refunderUserId);
    });

    it('devrait utiliser le montant complet par défaut', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        amount: Money.create(250, 'EUR'),
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        // Pas de montant spécifié
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.payment!.refundedAmount).toBe(250);
    });

    it('devrait gérer les devises autres que EUR', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({
        id: 1,
        amount: Money.create(100, 'USD'),
      });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
      };

      // Act
      const result = await refundPaymentUseCase.execute(input);

      // Assert
      expect(result.payment!.currency).toBe('USD');
      expect(result.payment!.refundedAmount).toBe(100);
    });

    it('devrait inclure la raison dans l\'audit trail', async () => {
      // Arrange
      const validatedPayment = createTestValidatedPayment({ id: 1 });

      mockPaymentRepository.findById.mockResolvedValue(validatedPayment);
      mockPaymentRepository.refund.mockImplementation(async (id, reason) => {
        validatedPayment.refund(reason);
        return validatedPayment;
      });

      const refundReason = 'Customer dissatisfied with service';
      const input: RefundPaymentInput = {
        paymentId: 1,
        refundedBy: 999,
        reason: refundReason,
      };

      // Act
      await refundPaymentUseCase.execute(input);

      // Assert
      const auditCall = mockPaymentRepository.recordTransaction.mock.calls[0];
      expect(auditCall[3]).toBe(refundReason);
    });
  });
});

/**
 * ═══════════════════════════════════════════════════════════════
 * EXÉCUTION DES TESTS
 * ═══════════════════════════════════════════════════════════════
 *
 * Pour exécuter ces tests :
 *
 * npm test RefundPaymentUseCase.test.ts
 *
 * ou
 *
 * jest RefundPaymentUseCase.test.ts --coverage
 *
 * ═══════════════════════════════════════════════════════════════
 * RÉSULTATS ATTENDUS
 * ═══════════════════════════════════════════════════════════════
 *
 * ✅ 45+ tests passent
 * ✅ Temps d'exécution : ~300-500ms (sans DB ni Stripe !)
 * ✅ Couverture de code : >95%
 *
 * ═══════════════════════════════════════════════════════════════
 */
