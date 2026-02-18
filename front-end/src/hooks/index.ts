/**
 * Hooks Module - Central Export
 *
 * Organized hook exports for the ClubManager application.
 * All hooks are categorized into logical modules for better maintainability.
 *
 * @module hooks
 */

// ============================================================================
// Auth Hooks - Authentication & User Account Management
// ============================================================================
export {
  useAuth,
  useCompte,
  useCompteData,
  useConnexion,
  useVerification,
  useAuthRedirect,
} from "./auth";

// ============================================================================
// Courses Hooks - Course, Session & Enrollment Management
// ============================================================================
export {
  useCours,
  useInscriptionsCours,
  useParticipants,
  useProfesseurs,
  useInscriptionValidation,
} from "./courses";

// ============================================================================
// Shop Hooks - E-commerce, Catalog, Orders & Payments
// ============================================================================
export {
  // Products
  useProducts,
  useProductById,
  useProductsByCategory,
  // Orders
  useOrders,
  useUserOrders,
  useOrderById,
  useCreateOrder,
  useUpdateOrderStatus,
  usePendingOrders,
  useCompletedOrders,
  // Payments
  usePayments,
  useUserPayments,
  usePaymentById,
  useCreatePayment,
  useProcessPayment,
} from "./shop";

// ============================================================================
// Communication Hooks - Messaging, Notifications & Communication
// ============================================================================
export {
  // Messages
  useMessageTypes,
  useCreateMessageType,
  useUpdateMessageType,
  useDeleteMessageType,
  useMessagesReceived,
  useMessagesTrashed,
  useUnreadMessagesCount,
  useSendMessage,
  useMarkMessageAsRead,
  useDeleteReceivedMessage,
  useRestoreMessage,
  useMessages,
  // Notifications
  useNotifications,
  useCreateNotification,
  useMarkNotificationAsRead,
  useUnreadNotificationsCount,
  // Messaging
  useMessaging,
  useConversation,
  useSendDirectMessage,
  useSendGroupMessage,
} from "./communication";

// ============================================================================
// Dashboard Hooks - Analytics & Statistics
// ============================================================================
export {
  // Composite Dashboard Hooks
  useDashboardOverview,
  useMembersDashboard,
  usePaymentsDashboard,
  usePlansDashboard,
  useShopDashboard,
  // Attendance
  useAttendanceStats,
  useTopMembers,
  // Members
  useMembersCount,
  useMembersByGrade,
  useMembersByGender,
  useBirthdays,
  useNewMembers,
  // Products
  useTopProducts,
  // Sessions
  useWeeklySessions,
  // Payments
  useMonthlyPayments,
  useRecentPayments,
  usePendingPayments,
  useOverduePayments,
  useLastPayments,
  usePaymentsByMonth,
  // Plans
  useActivePlans,
  useRenewalRate,
  useMembersByPlan,
} from "./dashboard";

// ============================================================================
// Admin Hooks - Administrative & User Management
// ============================================================================
export { useUsers, useUserById, useAllUsers } from "./admin";

// ============================================================================
// Utils Hooks - Common Application Utilities
// ============================================================================
export {
  // Reference Data
  useGrades,
  useStatuses,
  useGenders,
  useSubscriptions,
  useAllReferenceData,
  // File Upload
  useFileUpload,
  useImageUpload,
  useMultipleImageUpload,
  // Toast
  useToast,
  // Email Debug
  useEmailDebug,
  // Alerts
  useDashboardAlertes,
  useAlertesActives,
  useAlertesUtilisateur,
  useStatistiquesAlertes,
  useDetecterAlertes,
  useResoudreAlerte,
  useIgnorerAlerte,
  useCreerAlerte,
} from "./utils";
