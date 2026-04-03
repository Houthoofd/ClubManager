/**
 * Payment Use Cases
 * Exports tous les use cases du domaine Paiements
 */

// Create Payment
export {
  CreatePaymentUseCase,
  type CreatePaymentInput,
  type CreatePaymentOutput,
} from "./CreatePaymentUseCase.js";

// Validate Payment
export {
  ValidatePaymentUseCase,
  type ValidatePaymentInput,
  type ValidatePaymentOutput,
} from "./ValidatePaymentUseCase.js";

// Refund Payment
export {
  RefundPaymentUseCase,
  type RefundPaymentInput,
  type RefundPaymentOutput,
} from "./RefundPaymentUseCase.js";

// Get Payment
export {
  GetPaymentUseCase,
  type GetPaymentInput,
  type GetPaymentOutput,
} from "./GetPaymentUseCase.js";

// Cancel Payment
export {
  CancelPaymentUseCase,
  type CancelPaymentInput,
  type CancelPaymentOutput,
} from "./CancelPaymentUseCase.js";

// Get User Payments
export {
  GetUserPaymentsUseCase,
  type GetUserPaymentsInput,
  type GetUserPaymentsOutput,
} from "./GetUserPaymentsUseCase.js";

// Get Payment Schedules
export {
  GetPaymentSchedulesUseCase,
  type GetPaymentSchedulesInput,
  type GetPaymentSchedulesOutput,
} from "./GetPaymentSchedulesUseCase.js";

// Pay Schedule
export {
  PayScheduleUseCase,
  type PayScheduleInput,
  type PayScheduleOutput,
} from "./PayScheduleUseCase.js";

// Get Overdue Schedules
export {
  GetOverdueSchedulesUseCase,
  type GetOverdueSchedulesInput,
  type GetOverdueSchedulesOutput,
} from "./GetOverdueSchedulesUseCase.js";

// Get Payment Statistics
export {
  GetPaymentStatisticsUseCase,
  type GetPaymentStatisticsInput,
  type GetPaymentStatisticsOutput,
} from "./GetPaymentStatisticsUseCase.js";
