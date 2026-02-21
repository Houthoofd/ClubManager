/**
 * ====================================================================
 * ORDER SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les services métier liés aux commandes.
 *
 * Usage:
 * ```tsx
 * import { OrderService } from '@/features/orders/services';
 *
 * // Utiliser les fonctions du service
 * const total = OrderService.calculateOrderTotal(items);
 * const isPaid = OrderService.isOrderPaid(order);
 * const schedule = OrderService.calculatePaymentSchedule(order);
 * ```
 *
 * Ou importer des fonctions spécifiques:
 * ```tsx
 * import { formatAmount, canCancelOrder, getOverdueOrders } from '@/features/orders/services';
 * ```
 */

// ============================================================================
// Export everything from order.service.ts
// ============================================================================

export * from "./order.service";
export { default as OrderService } from "./order.service";

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  OrderFilters,
  OrderStats,
  PaymentSchedule,
} from "./order.service";
