/**
 * Payment Domain Types Index
 * Exports centralisés de tous les types du domaine Payment
 */

// Payment (paiements)
export * from "./Payment.types.js";

// PaymentSchedule (échéances de paiements)
export * from "./PaymentSchedule.types.js";

// PricingPlan (plans tarifaires)
export * from "./PricingPlan.types.js";

/**
 * Re-export des types les plus utilisés
 */

// Payment types
export type {
  Payment,
  PaymentWithRelations,
  PaymentPublic,
  PaymentBasic,
  PaymentListItem,
  PaymentDetail,
  PaymentHistoryItem,
  PaymentStats,
  PaymentMonthlySummary,
  CreatePaymentData,
  UpdatePaymentData,
} from "./Payment.types.js";

export {
  PaymentMethod,
  PaymentStatus,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./Payment.types.js";

// PaymentSchedule types
export type {
  PaymentSchedule,
  PaymentScheduleWithRelations,
  PaymentSchedulePublic,
  PaymentScheduleBasic,
  PaymentScheduleListItem,
  PaymentScheduleDetail,
  PaymentScheduleCalendarItem,
  PaymentScheduleUserDashboard,
  PaymentScheduleStats,
  PaymentScheduleUserSummary,
  CreatePaymentScheduleData,
  UpdatePaymentScheduleData,
} from "./PaymentSchedule.types.js";

export {
  ScheduleStatus,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_COLORS,
} from "./PaymentSchedule.types.js";

// PricingPlan types
export type {
  PricingPlan,
  PricingPlanWithRelations,
  PricingPlanPublic,
  PricingPlanBasic,
  PricingPlanListItem,
  PricingPlanDetail,
  PricingPlanOption,
  PricingPlanCard,
  PricingPlanStats,
  PricingPlanComparison,
  PricingPlanHistory,
  CreatePricingPlanData,
  UpdatePricingPlanData,
  PricingPlanFilterOptions,
} from "./PricingPlan.types.js";

export {
  DUREE_LABELS,
  getDureeLabel,
} from "./PricingPlan.types.js";
