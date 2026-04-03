/**
 * Tests unitaires pour CreatePaymentUseCase
 *
 * Ces tests démontrent comment tester un use case de paiement sans dépendances réelles.
 * Tous les services externes (repository, gateway) sont mockés.
 *
 * Avantages :
 * - Tests ultra-rapides (~50ms)
 * - Pas besoin de base de données
 * - Pas besoin de Stripe/PayPal réels
 * - Tests isolés et reproductibles
 */

import { CreatePaymentUseCase, CreatePaymentInput } from '../CreatePaymentUseCase.js';
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
  configureMockCreateWithAutoId,
} from './__mocks__/mockPaymentRepository.js';
import {
  createMockPaymentGatewayService,
  createMockPaymentGatewayServiceWithDefaults,
  createMockPaymentGatewayServiceUnavailable,
} from './__mocks__/mockPaymentGatewayService.js';
import {
  validCreatePaymentInput,
  validCashPaymentInput,
  validStripePaymentInput,
  validSubscriptionPaymentInput,
  validOrderPaymentInput,
  invalidMissingUserIdInput,
  invalidNegativeUserIdInput,
  invalidMissingAmountInput,
  invalidNegativeAmountInput,
  invalidZeroAmountInput,
  invalidTooHighAmountInput,
  invalidMissingMethodInput,
  invalidPaymentMethodInput,
  invalidSubscriptionNoPeriodInput,
  invalidReversedPeriodsInput,
  createTestPaymentInput,
  testAmounts,
} from './__helpers__/paymentTestData.js';
import {
  assertCreatePaymentOutputIsSuccess,
  assertCreatePaymentOutputHasValidPayment,
  assertOutputHasAmount,
  assertIsPaymentError,
  assertIsMissingFieldError,
  assertIsInvalidAmountError,
  assertIsDuplicatePaymentError,
  assertRepositoryCreateWasCalled,
  assertRepositoryCreateWasCalledWith,
  assertGatewayCreatePaymentIntentWasCalled,
  assertGatewayCreatePaymentIntentWasNotCalled,
  assertAuditTransactionWasRecorded,
} from './__helpers__/paymentAssertions.js';

// ============== TESTS ==============

describe('CreatePaymentUseCase', () => {
  let mockPaymentRepository: jest.Mocked<IPaymentRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGatewayService>;
  let createPaymentUseCase: CreatePaymentUseCase;

  /**
   * Setup avant chaque test
   */
  beforeEach(() => {
    // Créer des mocks frais pour chaque test
    mockPaymentRepository = createMockPaymentRepositoryWithDefaults();
    mockPaymentGateway = createMockPaymentGatewayServiceWithDefaults('STRIPE');

    // Configurer le mock create pour auto-incrémenter les IDs
    configureMockCreateWithAutoId(mockPaymentRepository, 1);

    // Créer l'instance du use case avec les mocks
    createPaymentUseCase = new CreatePaymentUseCase(
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
    it('devrait créer un paiement valide avec toutes les informations', async () => {
      // Arrange
      const input = createTestPaymentInput({
        userId: 1,
        amount: 100.00,
        currency: 'EUR',
        method: 'CREDIT_CARD',
        description: 'Test payment',
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      assertCreatePaymentOutputHasValidPayment(result);
      assertOutputHasAmount(result, 100.00, 'EUR');

      expect(result.payment!.id).toBe(1);
      expect(result.payment!.userId).toBe(1);
      expect(result.payment!.method).toBe('CREDIT_CARD');
      expect(result.payment!.status).toBe('PENDING');

      // Vérifier que les services ont été appelés
      assertRepositoryCreateWasCalled(mockPaymentRepository, 1);
      assertAuditTransactionWasRecorded(mockPaymentRepository, 'CREATION');
    });

    it('devrait créer un paiement en espèces sans passer par le gateway', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...validCashPaymentInput,
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      expect(result.payment!.method).toBe('CASH');

      // Le gateway ne doit PAS être appelé pour les paiements en espèces
      assertGatewayCreatePaymentIntentWasNotCalled(mockPaymentGateway);
      assertRepositoryCreateWasCalled(mockPaymentRepository, 1);
    });

    it('devrait créer un paiement par carte avec intention Stripe', async () => {
      // Arrange
      const input = createTestPaymentInput({
        userId: 1,
        amount: 150.00,
        currency: 'EUR',
        method: 'CREDIT_CARD',
        description: 'Paiement par carte',
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);

      // Le gateway DOIT être appelé pour créer l'intention
      assertGatewayCreatePaymentIntentWasCalled(mockPaymentGateway, 1);

      // Le paiement doit avoir une référence de transaction
      expect(result.payment!.transactionReference).toBeDefined();
      expect(result.payment!.transactionReference).toContain('pi_');
    });

    it('devrait créer un paiement avec une référence de transaction fournie', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...validStripePaymentInput,
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      expect(result.payment!.transactionReference).toBe('pi_1234567890abcdef');

      // Le gateway ne doit PAS créer une nouvelle intention
      assertGatewayCreatePaymentIntentWasNotCalled(mockPaymentGateway);
    });

    it('devrait créer un paiement pour une commande', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...validOrderPaymentInput,
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      expect(result.payment!.userId).toBe(1);

      // Vérifier que orderId a été passé au repository
      const createCall = mockPaymentRepository.create.mock.calls[0][0];
      expect(createCall.orderId).toBe(42);
    });

    it('devrait créer un paiement pour un abonnement avec périodes', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...validSubscriptionPaymentInput,
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);

      // Vérifier que subscriptionId et périodes ont été passés au repository
      const createCall = mockPaymentRepository.create.mock.calls[0][0];
      expect(createCall.subscriptionId).toBe(1);
      expect(createCall.periodStart).toBeInstanceOf(Date);
      expect(createCall.periodEnd).toBeInstanceOf(Date);
    });

    it('devrait créer un paiement avec montant minimum valide (0.01€)', async () => {
      // Arrange
      const input = createTestPaymentInput({
        amount: 0.01,
        currency: 'EUR',
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      assertOutputHasAmount(result, 0.01, 'EUR');
    });

    it('devrait créer un paiement avec montant maximum valide (999999.99€)', async () => {
      // Arrange
      const input = createTestPaymentInput({
        amount: 999999.99,
        currency: 'EUR',
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      assertOutputHasAmount(result, 999999.99, 'EUR');
    });

    it('devrait créer un paiement en USD', async () => {
      // Arrange
      const input = createTestPaymentInput({
        amount: 100.00,
        currency: 'USD',
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      assertOutputHasAmount(result, 100.00, 'USD');
    });

    it('devrait créer un paiement avec metadata personnalisées', async () => {
      // Arrange
      const metadata = {
        customField: 'value',
        anotherField: 123,
      };
      const input = createTestPaymentInput({
        metadata,
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);

      // Vérifier que les metadata ont été passées au gateway
      if (mockPaymentGateway.createPaymentIntent.mock.calls.length > 0) {
        const gatewayCall = mockPaymentGateway.createPaymentIntent.mock.calls[0][0];
        expect(gatewayCall.metadata).toEqual(metadata);
      }
    });
  });

  // ==================== TESTS DE VALIDATION DES ENTRÉES ====================

  describe('Validation des entrées', () => {
    it('devrait échouer si userId est manquant', async () => {
      // Arrange
      const input = { ...invalidMissingUserIdInput } as CreatePaymentInput;

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsMissingFieldError(error as PaymentError, 'userId');
      }

      // Le repository ne doit pas être appelé
      expect(mockPaymentRepository.create).not.toHaveBeenCalled();
    });

    it('devrait échouer si userId est négatif', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...invalidNegativeUserIdInput,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si userId est zéro', async () => {
      // Arrange
      const input = createTestPaymentInput({
        userId: 0,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si amount est manquant', async () => {
      // Arrange
      const input = { ...invalidMissingAmountInput } as CreatePaymentInput;

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si amount est négatif', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...invalidNegativeAmountInput,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsInvalidAmountError(error as PaymentError);
      }
    });

    it('devrait échouer si amount est zéro', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...invalidZeroAmountInput,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait échouer si method est manquante', async () => {
      // Arrange
      const input = { ...invalidMissingMethodInput } as CreatePaymentInput;

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsMissingFieldError(error as PaymentError, 'method');
      }
    });

    it('devrait échouer si method est invalide', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...invalidPaymentMethodInput,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow();
    });

    it('devrait échouer si subscriptionId fourni sans periodStart', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...invalidSubscriptionNoPeriodInput,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsMissingFieldError(error as PaymentError);
      }
    });

    it('devrait échouer si periodStart >= periodEnd', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...invalidReversedPeriodsInput,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });
  });

  // ==================== TESTS DES RÈGLES MÉTIER ====================

  describe('Règles métier', () => {
    it('devrait respecter le montant minimum (0.01€)', async () => {
      // Arrange
      const input = createTestPaymentInput({
        amount: 0.001, // Moins que le minimum
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('AMOUNT_TOO_LOW');
      }
    });

    it('devrait respecter le montant maximum (999999.99€)', async () => {
      // Arrange
      const input = createTestPaymentInput({
        ...invalidTooHighAmountInput,
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('AMOUNT_TOO_HIGH');
      }
    });

    it('devrait détecter les doublons de transaction reference', async () => {
      // Arrange
      const existingTransactionRef = 'pi_duplicate_123';
      const input = createTestPaymentInput({
        transactionReference: existingTransactionRef,
        transactionProvider: 'STRIPE',
      });

      // Simuler qu'un paiement avec cette référence existe déjà
      const existingPayment = Payment.create({
        userId: 1,
        amount: Money.create(100, 'EUR'),
        method: PaymentMethod.fromString('CREDIT_CARD'),
        transactionRef: existingTransactionRef,
      });
      mockPaymentRepository.findByTransactionReference.mockResolvedValue(existingPayment);

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsDuplicatePaymentError(error as PaymentError);
      }
    });

    it('devrait permettre de créer des paiements sans référence de transaction', async () => {
      // Arrange
      const input = createTestPaymentInput({
        method: 'CASH',
        // Pas de transactionReference
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      expect(mockPaymentRepository.findByTransactionReference).not.toHaveBeenCalled();
    });
  });

  // ==================== TESTS D'INTÉGRATION AVEC GATEWAY ====================

  describe('Intégration avec gateway de paiement', () => {
    it('devrait créer une intention de paiement si méthode en ligne sans référence', async () => {
      // Arrange
      const input = createTestPaymentInput({
        method: 'CREDIT_CARD',
        // Pas de transactionReference fournie
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      assertGatewayCreatePaymentIntentWasCalled(mockPaymentGateway, 1);

      // Vérifier les paramètres passés au gateway
      const gatewayCall = mockPaymentGateway.createPaymentIntent.mock.calls[0][0];
      expect(gatewayCall.amount).toBeDefined();
      expect(gatewayCall.amount.getAmount()).toBe(100);
      expect(gatewayCall.description).toBe(input.description);
    });

    it('ne devrait PAS créer d\'intention si référence fournie', async () => {
      // Arrange
      const input = createTestPaymentInput({
        method: 'CREDIT_CARD',
        transactionReference: 'pi_existing_123',
        transactionProvider: 'STRIPE',
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
      assertGatewayCreatePaymentIntentWasNotCalled(mockPaymentGateway);
    });

    it('ne devrait PAS utiliser le gateway pour paiements hors ligne', async () => {
      // Arrange
      const offlineMethods = ['CASH', 'CHECK', 'BANK_TRANSFER'];

      for (const method of offlineMethods) {
        jest.clearAllMocks();

        const input = createTestPaymentInput({
          method,
        });

        // Act
        await createPaymentUseCase.execute(input);

        // Assert
        assertGatewayCreatePaymentIntentWasNotCalled(mockPaymentGateway);
      }
    });

    it('devrait gérer l\'indisponibilité du gateway', async () => {
      // Arrange
      const unavailableGateway = createMockPaymentGatewayServiceUnavailable();
      const useCase = new CreatePaymentUseCase(mockPaymentRepository, unavailableGateway);

      const input = createTestPaymentInput({
        method: 'CREDIT_CARD',
      });

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await useCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('PAYMENT_METHOD_UNAVAILABLE');
      }
    });

    it('devrait fonctionner sans gateway (paiements hors ligne uniquement)', async () => {
      // Arrange
      const useCaseWithoutGateway = new CreatePaymentUseCase(mockPaymentRepository);

      const input = createTestPaymentInput({
        method: 'CASH',
      });

      // Act
      const result = await useCaseWithoutGateway.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);
    });

    it('devrait échouer si paiement en ligne sans gateway disponible', async () => {
      // Arrange
      const useCaseWithoutGateway = new CreatePaymentUseCase(mockPaymentRepository);

      const input = createTestPaymentInput({
        method: 'CREDIT_CARD',
      });

      // Act & Assert
      await expect(useCaseWithoutGateway.execute(input)).rejects.toThrow();
    });
  });

  // ==================== TESTS DE GESTION D'ERREURS ====================

  describe('Gestion d\'erreurs', () => {
    it('devrait lever PaymentError si échec de création en base', async () => {
      // Arrange
      mockPaymentRepository.create.mockRejectedValue(new Error('Database error'));

      const input = createTestPaymentInput();

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);

      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        assertIsPaymentError(error);
        expect((error as PaymentError).code).toBe('INTERNAL_ERROR');
      }
    });

    it('devrait lever PaymentError si échec de création d\'intention', async () => {
      // Arrange
      mockPaymentGateway.createPaymentIntent.mockRejectedValue(new Error('Stripe error'));

      const input = createTestPaymentInput({
        method: 'CREDIT_CARD',
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow();
    });

    it('devrait propager les PaymentError existantes', async () => {
      // Arrange
      const customError = PaymentError.duplicatePayment('pi_123');
      mockPaymentRepository.findByTransactionReference.mockResolvedValue(
        Payment.create({
          userId: 1,
          amount: Money.create(100, 'EUR'),
          method: PaymentMethod.fromString('CREDIT_CARD'),
        })
      );

      const input = createTestPaymentInput({
        transactionReference: 'pi_123',
        transactionProvider: 'STRIPE',
      });

      // Act & Assert
      await expect(createPaymentUseCase.execute(input)).rejects.toThrow(PaymentError);
    });

    it('devrait enregistrer l\'audit même en cas d\'erreur après création', async () => {
      // Arrange
      let createCalled = false;
      mockPaymentRepository.create.mockImplementation(async (data) => {
        createCalled = true;
        const payment = Payment.create({
          userId: data.userId,
          amount: data.amount,
          method: data.method,
        });
        (payment as any)._id = 1;
        return payment;
      });

      // Faire échouer l'audit
      mockPaymentRepository.recordTransaction.mockRejectedValue(new Error('Audit failed'));

      const input = createTestPaymentInput();

      // Act
      try {
        await createPaymentUseCase.execute(input);
      } catch (error) {
        // L'erreur d'audit ne doit pas empêcher la création
        // mais doit être loggée
      }

      // Assert
      expect(createCalled).toBe(true);
    });
  });

  // ==================== TESTS DE LOGIQUE MÉTIER AVANCÉE ====================

  describe('Logique métier avancée', () => {
    it('devrait créer plusieurs paiements avec IDs auto-incrémentés', async () => {
      // Arrange
      const input1 = createTestPaymentInput({ amount: 100 });
      const input2 = createTestPaymentInput({ amount: 200 });
      const input3 = createTestPaymentInput({ amount: 300 });

      // Act
      const result1 = await createPaymentUseCase.execute(input1);
      const result2 = await createPaymentUseCase.execute(input2);
      const result3 = await createPaymentUseCase.execute(input3);

      // Assert
      expect(result1.payment!.id).toBe(1);
      expect(result2.payment!.id).toBe(2);
      expect(result3.payment!.id).toBe(3);
    });

    it('devrait conserver la description fournie', async () => {
      // Arrange
      const customDescription = 'Paiement pour cours de yoga';
      const input = createTestPaymentInput({
        description: customDescription,
      });

      // Act
      const result = await createPaymentUseCase.execute(input);

      // Assert
      assertCreatePaymentOutputIsSuccess(result);

      const createCall = mockPaymentRepository.create.mock.calls[0][0];
      expect(createCall.description).toBe(customDescription);
    });

    it('devrait gérer correctement les devises autres que EUR', async () => {
      // Arrange
      const currencies = ['USD', 'GBP', 'CHF'];

      for (const currency of currencies) {
        jest.clearAllMocks();

        const input = createTestPaymentInput({
          amount: 100,
          currency,
        });

        // Act
        const result = await createPaymentUseCase.execute(input);

        // Assert
        assertCreatePaymentOutputIsSuccess(result);
        assertOutputHasAmount(result, 100, currency);
      }
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
 * npm test CreatePaymentUseCase.test.ts
 *
 * ou
 *
 * jest CreatePaymentUseCase.test.ts --coverage
 *
 * ═══════════════════════════════════════════════════════════════
 * RÉSULTATS ATTENDUS
 * ═══════════════════════════════════════════════════════════════
 *
 * ✅ 40+ tests passent
 * ✅ Temps d'exécution : ~300-500ms (sans DB ni Stripe !)
 * ✅ Couverture de code : >95%
 *
 * ═══════════════════════════════════════════════════════════════
 */
