import {
  useAttendanceStatsQuery,
  useTopMembersQuery,
  useMembersCountQuery,
  useMembersByGradeQuery,
  useMembersByGenderQuery,
  useBirthdaysQuery,
  useNewMembersQuery,
  useTopProductsQuery,
  useWeeklySessionsQuery,
  useMonthlyPaymentsQuery,
  useRecentPaymentsQuery,
  usePendingPaymentsQuery,
  useOverduePaymentsQuery,
  useLastPaymentsQuery,
  usePaymentsByMonthQuery,
  useActivePlansQuery,
  useRenewalRateQuery,
  useMembersByPlanQuery,
} from "@/core/api/apollo/generated/graphql";

// ============================================================================
// Attendance Statistics Hooks
// ============================================================================

/**
 * Get attendance statistics for a specific user
 */
export const useAttendanceStats = (userId: number | string) => {
  return useAttendanceStatsQuery({
    variables: { userId: Number(userId) },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get top members by attendance
 */
export const useTopMembers = (limit?: number) => {
  return useTopMembersQuery({
    variables: { limit },
    fetchPolicy: "cache-and-network",
  });
};

// ============================================================================
// Members Statistics Hooks
// ============================================================================

/**
 * Get total members count
 */
export const useMembersCount = () => {
  return useMembersCountQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get members distribution by grade
 */
export const useMembersByGrade = () => {
  return useMembersByGradeQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get members distribution by gender
 */
export const useMembersByGender = () => {
  return useMembersByGenderQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get upcoming member birthdays
 */
export const useBirthdays = () => {
  return useBirthdaysQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get recently registered members
 */
export const useNewMembers = (limit?: number) => {
  return useNewMembersQuery({
    variables: { limit },
    fetchPolicy: "cache-and-network",
  });
};

// ============================================================================
// Products Statistics Hooks
// ============================================================================

/**
 * Get top selling products
 */
export const useTopProducts = (limit?: number) => {
  return useTopProductsQuery({
    variables: { limit },
    fetchPolicy: "cache-and-network",
  });
};

// ============================================================================
// Sessions Statistics Hooks
// ============================================================================

/**
 * Get weekly sessions statistics
 */
export const useWeeklySessions = () => {
  return useWeeklySessionsQuery({
    fetchPolicy: "cache-and-network",
  });
};

// ============================================================================
// Payments Statistics Hooks
// ============================================================================

/**
 * Get current month payments statistics
 */
export const useMonthlyPayments = () => {
  return useMonthlyPaymentsQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get recent payments
 */
export const useRecentPayments = (limit?: number) => {
  return useRecentPaymentsQuery({
    variables: { limit },
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get pending payments
 */
export const usePendingPayments = () => {
  return usePendingPaymentsQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get overdue payments
 */
export const useOverduePayments = () => {
  return useOverduePaymentsQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get last payments
 */
export const useLastPayments = (limit?: number) => {
  return useLastPaymentsQuery({
    variables: { limit },
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get payments breakdown by month
 */
export const usePaymentsByMonth = () => {
  return usePaymentsByMonthQuery({
    fetchPolicy: "cache-and-network",
  });
};

// ============================================================================
// Plans/Subscriptions Statistics Hooks
// ============================================================================

/**
 * Get active subscription plans statistics
 */
export const useActivePlans = () => {
  return useActivePlansQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get subscription renewal rate
 */
export const useRenewalRate = () => {
  return useRenewalRateQuery({
    fetchPolicy: "cache-and-network",
  });
};

/**
 * Get members distribution by subscription plan
 */
export const useMembersByPlan = () => {
  return useMembersByPlanQuery({
    fetchPolicy: "cache-and-network",
  });
};

// ============================================================================
// Legacy Aliases (for backward compatibility)
// ============================================================================

export const useFrequentationByUserId = useAttendanceStats;
export const useTopAssidus = useTopMembers;
export const useMembresParGrade = useMembersByGrade;
export const useMembresParGenre = useMembersByGender;
export const useAnniversaires = useBirthdays;
export const useArticlesVendus = useTopProducts;
export const useCoursSemaine = useWeeklySessions;
export const usePaiementsMois = useMonthlyPayments;
export const usePaiementsRecents = useRecentPayments;
export const usePaiementsEnAttente = usePendingPayments;
export const usePaiementsEchus = useOverduePayments;
export const useDerniersPaiements = useLastPayments;
export const usePaiementsParMois = usePaymentsByMonth;
export const usePlansActifs = useActivePlans;
export const useTauxRenouvellement = useRenewalRate;
export const useNouveauxMembres = useNewMembers;
