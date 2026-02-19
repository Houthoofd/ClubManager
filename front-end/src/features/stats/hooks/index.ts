// Stats Feature Hooks - Barrel Export

// Re-export all dashboard hooks from the centralized hooks directory
export {
  // Composite Dashboard Hooks
  useDashboardOverview,
  useMembersDashboard,
  usePaymentsDashboard,
  usePlansDashboard,
  useShopDashboard,

  // Attendance & Statistics
  useAttendanceStats,
  useTopMembers,
  useFrequentationByUserId,
  useTopAssidus,

  // Members Statistics
  useMembersCount,
  useMembersByGrade,
  useMembersByGender,
  useBirthdays,
  useNewMembers,
  useMembresParGrade,
  useMembresParGenre,
  useAnniversaires,
  useNouveauxMembres,

  // Products Statistics
  useTopProducts,
  useArticlesVendus,

  // Sessions Statistics
  useWeeklySessions,

  // Payments Statistics
  useMonthlyPayments,
  useRecentPayments,
  usePendingPayments,
  useOverduePayments,
  useLastPayments,
  usePaymentsByMonth,
  usePaiementsMois,
  usePaiementsRecents,
  usePaiementsEnAttente,
  usePaiementsEchus,
  useDerniersPaiements,
  usePaiementsParMois,

  // Plans Statistics
  useActivePlans,
  useRenewalRate,
  useMembersByPlan,
  usePlansActifs,
  useTauxRenouvellement,
} from "@/hooks/dashboard";

// Helper hooks for stats formatting
export { useAuthRedirect } from "@/hooks";
