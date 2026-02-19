/**
 * Types for the Orders feature
 *
 * This file contains all TypeScript types and interfaces used in the orders domain.
 */

// ============================================================================
// Feature-Specific Types
// ============================================================================

/**
 * Order status
 */
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded';

/**
 * Payment method
 */
export type PaymentMethod = 'card' | 'cash' | 'transfer' | 'stripe';

/**
 * Order item
 */
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  size?: string;
  color?: string;
}

/**
 * Basic order information
 */
export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  created_at: string;
  updated_at?: string;
}

/**
 * Detailed order information with items and user
 */
export interface OrderDetail extends Order {
  items: OrderItem[];
  user_name?: string;
  user_email?: string;
  shipping_address?: string;
  notes?: string;
  payment_intent_id?: string;
}

/**
 * Order form data for creation
 */
export interface OrderFormData {
  user_id: number;
  items: Array<{
    product_id: number;
    quantity: number;
    size?: string;
    color?: string;
  }>;
  payment_method?: PaymentMethod;
  shipping_address?: string;
  notes?: string;
}

/**
 * Order statistics
 */
export interface OrderStats {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  revenue_this_month: number;
  revenue_this_week: number;
  average_order_value: number;
  orders_by_status: Record<OrderStatus, number>;
  orders_by_month: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;
}

/**
 * Order filter options
 */
export interface OrderFilters {
  search?: string;
  status?: OrderStatus | null;
  user_id?: number | null;
  payment_method?: PaymentMethod | null;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

/**
 * Order sort options
 */
export type OrderSortBy =
  | 'created_at'
  | 'updated_at'
  | 'total_amount'
  | 'status'
  | 'user_name';

export type SortDirection = 'asc' | 'desc';

export interface OrderSortOptions {
  sortBy: OrderSortBy;
  direction: SortDirection;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * Order table row data
 */
export interface OrderTableRow {
  id: number;
  user_name: string;
  user_email?: string;
  total_amount: number;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  created_at: string;
  items_count: number;
}

/**
 * Order status update data
 */
export interface OrderStatusUpdate {
  order_id: number;
  status: OrderStatus;
  notes?: string;
}

/**
 * Order validation errors
 */
export interface OrderValidationErrors {
  user_id?: string;
  items?: string;
  total_amount?: string;
  payment_method?: string;
  shipping_address?: string;
}
