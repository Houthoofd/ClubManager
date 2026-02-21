/**
 * Shop Hooks - Barrel Export
 *
 * Re-exports e-commerce, catalog, orders, and payments hooks from features/shop.
 */

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
} from "@/features/shop/hooks";
