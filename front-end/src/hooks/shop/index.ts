/**
 * Shop Hooks Module
 *
 * Centralized e-commerce, catalog, orders, and payment management hooks
 * All hooks migrated to GraphQL/Apollo Client
 */

// ============================================================================
// Products Hooks
// ============================================================================
export {
  useProducts,
  useProductById,
  useProductsByCategory,
} from "./useArticles";

// ============================================================================
// Orders Hooks
// ============================================================================
export {
  useOrders,
  useUserOrders,
  useOrderById,
  useCreateOrder,
  useUpdateOrderStatus,
  useOrdersByStatus,
  usePendingOrders,
  useCompletedOrders,
  // Legacy aliases
  useCommandes,
  useCommandeById,
  useCommandesUtilisateur,
  useCreerCommande,
  useModifierStatutCommande,
} from "./useCommandes";

// ============================================================================
// Payments Hooks
// ============================================================================
export {
  usePayments,
  useUserPayments,
  usePaymentById,
  useCreatePayment,
  useProcessPayment,
  usePaymentsByStatus,
  usePendingPayments,
  useCompletedPayments,
  useFailedPayments,
  useOrderPayments,
  useUserPaymentsTotal,
  // Legacy aliases
  usePaiements,
  usePaiementsUtilisateur,
  usePaiementById,
  useCreerPaiement,
  useProcesserPaiement,
} from "./usePaiements";

// ============================================================================
// Legacy Shop Hooks (Not yet migrated)
// ============================================================================
// TODO: Migrate remaining useMagasin hooks to GraphQL
// export { ... } from "./useMagasin";
