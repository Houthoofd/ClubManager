/**
 * Dashboard Hooks - Aggregated statistics for dashboard views
 *
 * This file provides composite hooks that combine multiple statistics
 * queries for easy use in dashboard components.
 */

import {
  useMembersCount,
  useMonthlyPayments,
  useRecentPayments,
  usePendingPayments,
  useOverduePayments,
  useLastPayments,
  usePaymentsByMonth,
  useActivePlans,
  useRenewalRate,
  useMembersByPlan,
  useNewMembers,
  useMembersByGrade,
  useMembersByGender,
  useTopMembers,
  useBirthdays,
  useTopProducts,
  useWeeklySessions,
} from "./useStatistiques";

// ============================================================================
// Composite Dashboard Hooks
// ============================================================================

/**
 * Hook for main dashboard overview
 * Combines key metrics for the dashboard home page
 */
export const useDashboardOverview = () => {
  const membersCount = useMembersCount();
  const monthlyPayments = useMonthlyPayments();
  const weeklySessions = useWeeklySessions();
  const pendingPayments = usePendingPayments();

  return {
    // Members
    totalMembers: membersCount.data?.membersCount?.count ?? 0,
    membersLoading: membersCount.loading,

    // Payments
    monthlyRevenue: monthlyPayments.data?.monthlyPayments?.total ?? 0,
    monthlyPaymentsCount: monthlyPayments.data?.monthlyPayments?.count ?? 0,
    paymentsLoading: monthlyPayments.loading,

    // Sessions
    weeklySessionsTotal: weeklySessions.data?.weeklySessions?.total ?? 0,
    weeklySessionsByDay: weeklySessions.data?.weeklySessions?.by_day ?? {},
    sessionsLoading: weeklySessions.loading,

    // Pending Payments
    pendingPaymentsList: pendingPayments.data?.pendingPayments ?? [],
    pendingPaymentsLoading: pendingPayments.loading,

    // Overall loading state
    loading:
      membersCount.loading ||
      monthlyPayments.loading ||
      weeklySessions.loading ||
      pendingPayments.loading,

    // Refetch all
    refetchAll: () => {
      membersCount.refetch();
      monthlyPayments.refetch();
      weeklySessions.refetch();
      pendingPayments.refetch();
    },
  };
};

/**
 * Hook for members dashboard section
 * Provides comprehensive member statistics
 */
export const useMembersDashboard = () => {
  const membersCount = useMembersCount();
  const membersByGrade = useMembersByGrade();
  const membersByGender = useMembersByGender();
  const membersByPlan = useMembersByPlan();
  const newMembers = useNewMembers(10);
  const topMembers = useTopMembers(10);
  const birthdays = useBirthdays();

  return {
    totalMembers: membersCount.data?.membersCount?.count ?? 0,
    byGrade: membersByGrade.data?.membersByGrade ?? [],
    byGender: membersByGender.data?.membersByGender ?? [],
    byPlan: membersByPlan.data?.membersByPlan ?? [],
    newMembers: newMembers.data?.newMembers ?? [],
    topMembers: topMembers.data?.topMembers ?? [],
    upcomingBirthdays: birthdays.data?.birthdays ?? [],

    loading:
      membersCount.loading ||
      membersByGrade.loading ||
      membersByGender.loading ||
      membersByPlan.loading ||
      newMembers.loading ||
      topMembers.loading ||
      birthdays.loading,

    refetchAll: () => {
      membersCount.refetch();
      membersByGrade.refetch();
      membersByGender.refetch();
      membersByPlan.refetch();
      newMembers.refetch();
      topMembers.refetch();
      birthdays.refetch();
    },
  };
};

/**
 * Hook for payments dashboard section
 * Provides comprehensive payment statistics
 */
export const usePaymentsDashboard = () => {
  const monthlyPayments = useMonthlyPayments();
  const recentPayments = useRecentPayments(10);
  const pendingPayments = usePendingPayments();
  const overduePayments = useOverduePayments();
  const lastPayments = useLastPayments(10);
  const paymentsByMonth = usePaymentsByMonth();

  return {
    // Current month
    monthlyTotal: monthlyPayments.data?.monthlyPayments?.total ?? 0,
    monthlyCount: monthlyPayments.data?.monthlyPayments?.count ?? 0,

    // Lists
    recentPayments: recentPayments.data?.recentPayments ?? [],
    pendingPayments: pendingPayments.data?.pendingPayments ?? [],
    overduePayments: overduePayments.data?.overduePayments ?? [],
    lastPayments: lastPayments.data?.lastPayments ?? [],

    // Breakdown
    paymentsByMonth: paymentsByMonth.data?.paymentsByMonth ?? [],

    loading:
      monthlyPayments.loading ||
      recentPayments.loading ||
      pendingPayments.loading ||
      overduePayments.loading ||
      lastPayments.loading ||
      paymentsByMonth.loading,

    refetchAll: () => {
      monthlyPayments.refetch();
      recentPayments.refetch();
      pendingPayments.refetch();
      overduePayments.refetch();
      lastPayments.refetch();
      paymentsByMonth.refetch();
    },
  };
};

/**
 * Hook for subscriptions/plans dashboard section
 */
export const usePlansDashboard = () => {
  const activePlans = useActivePlans();
  const renewalRate = useRenewalRate();
  const membersByPlan = useMembersByPlan();

  return {
    activePlans: activePlans.data?.activePlans ?? [],
    renewalRate: renewalRate.data?.renewalRate?.rate ?? 0,
    membersByPlan: membersByPlan.data?.membersByPlan ?? [],

    loading:
      activePlans.loading || renewalRate.loading || membersByPlan.loading,

    refetchAll: () => {
      activePlans.refetch();
      renewalRate.refetch();
      membersByPlan.refetch();
    },
  };
};

/**
 * Hook for shop/products dashboard section
 */
export const useShopDashboard = () => {
  const topProducts = useTopProducts(10);

  return {
    topProducts: topProducts.data?.topProducts ?? [],
    loading: topProducts.loading,
    refetchAll: topProducts.refetch,
  };
};

// ============================================================================
// Re-export individual hooks for direct access
// ============================================================================

export {
  useMembersCount,
  useMonthlyPayments,
  useRecentPayments,
  usePendingPayments,
  useOverduePayments,
  useLastPayments,
  usePaymentsByMonth,
  useActivePlans,
  useRenewalRate,
  useMembersByPlan,
  useNewMembers,
  useMembersByGrade,
  useMembersByGender,
  useTopMembers,
  useBirthdays,
  useTopProducts,
  useWeeklySessions,
};

// Legacy aliases
export const usePaiementsMois = useMonthlyPayments;
export const usePaiementsRecents = useRecentPayments;
export const usePaiementsEnAttente = usePendingPayments;
export const usePaiementsEchus = useOverduePayments;
export const useDerniersPaiements = useLastPayments;
export const usePaiementsParMois = usePaymentsByMonth;
export const usePlansActifs = useActivePlans;
export const useTauxRenouvellement = useRenewalRate;
export const useNouveauxMembres = useNewMembers;
