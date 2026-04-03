/**
 * Payment Interfaces
 * Exports toutes les interfaces du domaine Paiements
 */

// Payment Repository
export {
  IPaymentRepository,
  type CreatePaymentData,
  type UpdatePaymentData,
  type PaymentFilters,
  type PaymentStatistics,
} from './IPaymentRepository.js';

// Payment Schedule Repository
export {
  IPaymentScheduleRepository,
  type CreatePaymentScheduleData,
  type UpdatePaymentScheduleData,
  type PaymentScheduleFilters,
} from './IPaymentScheduleRepository.js';

// Payment Gateway Service
export {
  IPaymentGatewayService,
  type CreatePaymentIntentData,
  type CapturePaymentData,
  type RefundPaymentData,
  type PaymentIntentResult,
  type PaymentCaptureResult,
  type PaymentRefundResult,
  type PaymentStatusResult,
  type WebhookEvent,
  type WebhookVerificationResult,
  type CustomerData,
  type CreateCustomerResult,
  type PaymentMethodData,
  type CreatePaymentMethodResult,
} from './IPaymentGatewayService.js';
