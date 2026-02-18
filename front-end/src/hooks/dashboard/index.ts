/**
 * Dashboard Module Exports
 *
 * This barrel file exports all dashboard-related hooks:
 * - Statistics hooks (members, payments, products, sessions, etc.)
 * - Composite dashboard hooks (overview, members, payments, plans, shop)
 */

// ============================================================================
// Composite Dashboard Hooks
// ============================================================================

export {
  useDashboardOverview,
  useMembersDashboard,
  usePaymentsDashboard,
  usePlansDashboard,
  useShopDashboard,
} from "./useDashboard";

// ============================================================================
// Statistics Hooks - Attendance
// ============================================================================

export {
  useAttendanceStats,
  useTopMembers,
  // Legacy aliases
  useFrequentationByUserId,
  useTopAssidus,
} from "./useStatistiques";

// ============================================================================
// Statistics Hooks - Members
// ============================================================================

export {
  useMembersCount,
  useMembersByGrade,
  useMembersByGender,
  useBirthdays,
  useNewMembers,
  // Legacy aliases
  useMembresParGrade,
  useMembresParGenre,
  useAnniversaires,
  useNouveauxMembres,
} from "./useStatistiques";

// ============================================================================
// Statistics Hooks - Products
// ============================================================================

export {
  useTopProducts,
  // Legacy aliases
  useArticlesVendus,
} from "./useStatistiques";

// ============================================================================
// Statistics Hooks - Sessions
// ============================================================================

export {
  useWeeklySessions,
  // Legacy aliases
  useCoursSemaine,
} from "./useStatistiques";

// ============================================================================
// Statistics Hooks - Payments
// ============================================================================

export {
  useMonthlyPayments,
  useRecentPayments,
  usePendingPayments,
  useOverduePayments,
  useLastPayments,
  usePaymentsByMonth,
  // Legacy aliases
  usePaiementsMois,
  usePaiementsRecents,
  usePaiementsEnAttente,
  usePaiementsEchus,
  useDerniersPaiements,
  usePaiementsParMois,
} from "./useStatistiques";

// ============================================================================
// Statistics Hooks - Plans
// ============================================================================

export {
  useActivePlans,
  useRenewalRate,
  useMembersByPlan,
  // Legacy aliases
  usePlansActifs,
  useTauxRenouvellement,
} from "./useStatistiques";
