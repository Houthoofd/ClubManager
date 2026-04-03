/**
 * Index des mocks réutilisables pour les tests du module Paiements
 *
 * Ce fichier centralise l'export de tous les mocks pour faciliter les imports.
 *
 * @example
 * ```typescript
 * import {
 *   createMockPaymentRepository,
 *   createMockPaymentGatewayService,
 * } from './__mocks__/index.js';
 * ```
 */

// ============== PAYMENT REPOSITORY MOCKS ==============

export {
  createMockPaymentRepository,
  createMockPaymentRepositoryWithDefaults,
  configureMockCreateWithAutoId,
  configureMockStatusTransitions,
} from "./mockPaymentRepository.js";

// ============== PAYMENT GATEWAY MOCKS ==============

export {
  createMockPaymentGatewayService,
  createMockPaymentGatewayServiceWithDefaults,
  createMockPaymentGatewayServiceUnavailable,
  createMockPayPalGateway,
  configureMockPaymentFailure,
  configureMockInvalidWebhook,
  configureMockPaymentStatusSequence,
} from "./mockPaymentGatewayService.js";
