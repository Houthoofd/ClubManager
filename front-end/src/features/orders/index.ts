/**
 * Orders Feature - Main Barrel Export
 *
 * This file serves as the main entry point for the orders feature,
 * exporting all public APIs, components, hooks, types, and constants.
 *
 * Usage:
 *   import { OrdersPage, useOrders, ORDER_STATUS } from '@/features/orders';
 */

// ============================================================================
// Pages
// ============================================================================

export { default as OrdersPage } from "./pages/OrdersPage";
export { default as PaymentPage } from "./pages/PaymentPage";

// ============================================================================
// Components
// ============================================================================

export { default as FiltrageCommandes } from "./components/FiltrageCommandes";
export { default as StatistiquesCommandes } from "./components/StatistiquesCommandes";
export { default as TableauCommandes } from "./components/TableauCommandes";

// ============================================================================
// Hooks (re-exported from shop feature)
// ============================================================================

// Note: Order hooks are part of the shop feature and should be imported from there
// Example: import { useOrders, useOrderById } from '@/features/shop';

// ============================================================================
// Types
// ============================================================================

export type {
  // Order types
  OrderStatus,
  PaymentMethod,
  Order,
  OrderDetail,
  OrderItem,
  OrderFormData,

  // Statistics
  OrderStats,

  // Filtering & Sorting
  OrderFilters,
  OrderSortBy,
  SortDirection,
  OrderSortOptions,

  // Pagination
  PaginationOptions,

  // Table data
  OrderTableRow,

  // Updates
  OrderStatusUpdate,

  // Validation
  OrderValidationErrors,
} from "@clubmanager/types";

// ============================================================================
// Constants
// ============================================================================

export {
  // Order status
  ORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_ICONS,

  // Payment methods
  PAYMENT_METHODS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_ICONS,

  // Validation rules
  MIN_ORDER_AMOUNT,
  MAX_ORDER_AMOUNT,
  MAX_ITEMS_PER_ORDER,
  MIN_ITEM_QUANTITY,
  MAX_ITEM_QUANTITY,

  // UI constants
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
  ORDER_TABLE_COLUMNS,
  DATE_RANGE_PRESETS,
  DATE_RANGE_PRESET_LABELS,

  // Messages
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  WARNING_MESSAGES,
  CONFIRMATION_MESSAGES,
  INFO_MESSAGES,

  // API/GraphQL
  QUERY_KEYS,
  MUTATION_KEYS,
  CACHE_INVALIDATION_DELAY,
  PENDING_ORDERS_POLLING_INTERVAL,

  // Feature flags
  FEATURES,

  // All constants grouped
  ORDERS_CONSTANTS,
} from "./constants";
