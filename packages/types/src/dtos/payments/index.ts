/**
 * Payments DTOs Index
 * Exports centralisés de tous les DTOs du domaine Payments
 */

// Payment DTOs
export * from "./PaymentDto.js";

// Payment Schedule DTOs
export * from "./PaymentScheduleDto.js";

// Pricing Plan DTOs
export * from "./PricingPlanDto.js";

/**
 * Re-export des DTOs les plus utilisés
 */

// Payment
export type {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
  PaymentListItemDto,
  RefundPaymentDto,
  SearchPaymentDto,
  PaymentStatsDto,
  StripePaymentIntentDto,
} from "./PaymentDto.js";

// Payment Schedule
export type {
  CreatePaymentScheduleDto,
  UpdatePaymentScheduleDto,
  PaymentScheduleResponseDto,
  PaymentScheduleListItemDto,
  BulkCreatePaymentScheduleDto,
  SearchPaymentScheduleDto,
  OverdueSchedulesDto,
  MarkAsPaidDto,
  PaymentScheduleStatsDto,
} from "./PaymentScheduleDto.js";

// Pricing Plan
export type {
  CreatePricingPlanDto,
  UpdatePricingPlanDto,
  PricingPlanResponseDto,
  PricingPlanListItemDto,
  SearchPricingPlanDto,
  PricingPlanStatsDto,
  ComparePricingPlansDto,
  TogglePricingPlanDto,
} from "./PricingPlanDto.js";
