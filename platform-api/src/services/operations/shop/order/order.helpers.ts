/**
 * Order Helpers
 * Utility functions for order operations
 */

import { OrderStatus } from '../../../types/shop.types.js';

/**
 * Calculate order subtotal
 */
export function calculateSubtotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculate tax amount
 */
export function calculateTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate * 100) / 100;
}

/**
 * Calculate order total with tax
 */
export function calculateTotal(subtotal: number, tax: number, shipping = 0): number {
  return Math.round((subtotal + tax + shipping) * 100) / 100;
}

/**
 * Format order number
 */
export function formatOrderNumber(id: number, prefix = 'ORD'): string {
  return `${prefix}-${String(id).padStart(8, '0')}`;
}

/**
 * Get order status label in French
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'En attente',
    [OrderStatus.CONFIRMED]: 'Confirmée',
    [OrderStatus.PROCESSING]: 'En traitement',
    [OrderStatus.SHIPPED]: 'Expédiée',
    [OrderStatus.DELIVERED]: 'Livrée',
    [OrderStatus.CANCELLED]: 'Annulée'
  };
  return labels[status];
}

/**
 * Get order status color
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'orange',
    [OrderStatus.CONFIRMED]: 'blue',
    [OrderStatus.PROCESSING]: 'purple',
    [OrderStatus.SHIPPED]: 'cyan',
    [OrderStatus.DELIVERED]: 'green',
    [OrderStatus.CANCELLED]: 'red'
  };
  return colors[status];
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED
  ].includes(status);
}

/**
 * Check if order can be modified
 */
export function canModifyOrder(status: OrderStatus): boolean {
  return status === OrderStatus.PENDING;
}

/**
 * Check if order can be refunded
 */
export function canRefundOrder(status: OrderStatus): boolean {
  return status === OrderStatus.DELIVERED;
}

/**
 * Check if order is final (cannot be changed)
 */
export function isOrderFinal(status: OrderStatus): boolean {
  return [
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED
  ].includes(status);
}

/**
 * Check if order is in progress
 */
export function isOrderInProgress(status: OrderStatus): boolean {
  return [
    OrderStatus.CONFIRMED
  ].includes(status);
}

/**
 * Calculate order item subtotal
 */
export function calculateItemSubtotal(price: number, quantity: number): number {
  return Math.round(price * quantity * 100) / 100;
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(subtotal: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  return Math.round(subtotal * (discountPercent / 100) * 100) / 100;
}

/**
 * Calculate final price after discount
 */
export function applyDiscount(price: number, discountPercent: number): number {
  const discount = calculateDiscount(price, discountPercent);
  return Math.round((price - discount) * 100) / 100;
}

/**
 * Validate order items
 */
export function validateOrderItems(
  items: Array<{ productId: number; quantity: number }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  items.forEach((item, index) => {
    if (!item.productId || item.productId <= 0) {
      errors.push(`Item ${index + 1}: Invalid product ID`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Quantity must be positive`);
    }
    if (!Number.isInteger(item.quantity)) {
      errors.push(`Item ${index + 1}: Quantity must be an integer`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Group order items by product
 */
export function groupOrderItems<T extends { productId: number; quantity: number }>(
  items: T[]
): Map<number, T[]> {
  const grouped = new Map<number, T[]>();

  items.forEach(item => {
    const existing = grouped.get(item.productId) || [];
    grouped.set(item.productId, [...existing, item]);
  });

  return grouped;
}

/**
 * Calculate total quantity of items
 */
export function calculateTotalQuantity(
  items: Array<{ quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Calculate average order value
 */
export function calculateAverageOrderValue(orders: Array<{ totalAmount: number }>): number {
  if (orders.length === 0) return 0;
  const total = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  return Math.round((total / orders.length) * 100) / 100;
}

/**
 * Get order age in days
 */
export function getOrderAge(createdAt: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - createdAt.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if order is recent (within X days)
 */
export function isRecentOrder(createdAt: Date, days = 7): boolean {
  return getOrderAge(createdAt) <= days;
}

/**
 * Format order summary
 */
export function formatOrderSummary(order: {
  id: number;
  totalAmount: number;
  status: OrderStatus;
  itemCount: number;
}): string {
  return `Order #${order.id} - ${order.itemCount} item(s) - ${order.totalAmount.toFixed(2)}€ - ${getOrderStatusLabel(order.status)}`;
}

/**
 * Calculate shipping cost based on weight or total
 */
export function calculateShipping(
  total: number,
  freeShippingThreshold = 50
): number {
  if (total >= freeShippingThreshold) return 0;
  return 5.99; // Default shipping cost
}

/**
 * Check if order qualifies for free shipping
 */
export function qualifiesForFreeShipping(
  total: number,
  threshold = 50
): boolean {
  return total >= threshold;
}

/**
 * Get next valid statuses for current status
 */
export function getNextValidStatuses(currentStatus: OrderStatus): OrderStatus[] {
  const transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: []
  };
  return transitions[currentStatus] || [];
}

/**
 * Validate status transition
 */
export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const validNext = getNextValidStatuses(from);
  return validNext.includes(to);
}

/**
 * Calculate order processing time in hours
 */
export function calculateProcessingTime(
  createdAt: Date,
  completedAt: Date
): number {
  const diffMs = completedAt.getTime() - createdAt.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
}

/**
 * Generate order invoice number
 */
export function generateInvoiceNumber(
  orderId: number,
  year: number,
  month: number
): string {
  const monthStr = String(month).padStart(2, '0');
  const orderStr = String(orderId).padStart(6, '0');
  return `INV-${year}${monthStr}-${orderStr}`;
}

/**
 * Parse order filters from query params
 */
export function parseOrderFilters(query: any): {
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
} {
  const filters: any = {};

  if (query.status && Object.values(OrderStatus).includes(query.status)) {
    filters.status = query.status;
  }

  if (query.startDate) {
    const date = new Date(query.startDate);
    if (!isNaN(date.getTime())) {
      filters.startDate = date;
    }
  }

  if (query.endDate) {
    const date = new Date(query.endDate);
    if (!isNaN(date.getTime())) {
      filters.endDate = date;
    }
  }

  if (query.minAmount) {
    const amount = parseFloat(query.minAmount);
    if (!isNaN(amount) && amount >= 0) {
      filters.minAmount = amount;
    }
  }

  if (query.maxAmount) {
    const amount = parseFloat(query.maxAmount);
    if (!isNaN(amount) && amount >= 0) {
      filters.maxAmount = amount;
    }
  }

  return filters;
}

/**
 * Sort orders by priority
 */
export function sortOrdersByPriority<T extends { status: OrderStatus; createdAt: Date }>(
  orders: T[]
): T[] {
  const priorityOrder: Record<string, number> = {
    "confirmée": 1,
    "en attente": 2,
    "livrée": 3,
    "annulée": 4
  };

  return [...orders].sort((a, b) => {
    const priorityDiff = priorityOrder[a.status] - priorityOrder[b.status];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by date (oldest first)
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}
