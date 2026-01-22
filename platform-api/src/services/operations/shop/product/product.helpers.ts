/**
 * Product Helpers
 * Utility functions for product operations
 */

import { ProductStatus } from '@clubmanager/types';

/**
 * Calculate product discount price
 */
export function calculateDiscountPrice(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error('Discount percent must be between 0 and 100');
  }
  return Math.round((price * (1 - discountPercent / 100)) * 100) / 100;
}

/**
 * Calculate total value of product
 */
export function calculateProductValue(price: number, stock: number): number {
  return Math.round(price * stock * 100) / 100;
}

/**
 * Format price for display
 */
export function formatPrice(price: number, currency = '€'): string {
  return `${price.toFixed(2)} ${currency}`;
}

/**
 * Check if product is available
 */
export function isProductAvailable(status: ProductStatus, stock: number): boolean {
  return status === ProductStatus.ACTIVE && stock > 0;
}

/**
 * Check if product is low stock
 */
export function isLowStock(stock: number, threshold = 10): boolean {
  return stock > 0 && stock <= threshold;
}

/**
 * Get stock status
 */
export function getStockStatus(stock: number, lowThreshold = 10): 'out_of_stock' | 'low_stock' | 'in_stock' {
  if (stock === 0) return 'out_of_stock';
  if (stock <= lowThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Get stock status label
 */
export function getStockStatusLabel(stock: number, lowThreshold = 10): string {
  const status = getStockStatus(stock, lowThreshold);
  const labels = {
    out_of_stock: 'Rupture de stock',
    low_stock: 'Stock faible',
    in_stock: 'En stock'
  };
  return labels[status];
}

/**
 * Calculate stock percentage
 */
export function calculateStockPercentage(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((current / max) * 100);
}

/**
 * Validate price range
 */
export function isValidPriceRange(minPrice?: number, maxPrice?: number): boolean {
  if (minPrice !== undefined && maxPrice !== undefined) {
    return minPrice <= maxPrice;
  }
  return true;
}

/**
 * Generate product SKU
 */
export function generateSKU(name: string, id: number): string {
  const prefix = name
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 3);
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${id}-${timestamp}`;
}

/**
 * Parse product search query
 */
export function parseSearchQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(term => term.length > 2);
}

/**
 * Calculate reorder quantity
 */
export function calculateReorderQuantity(
  currentStock: number,
  minStock: number,
  maxStock: number
): number {
  if (currentStock >= minStock) return 0;
  return maxStock - currentStock;
}

/**
 * Check if reorder is needed
 */
export function needsReorder(currentStock: number, reorderPoint: number): boolean {
  return currentStock <= reorderPoint;
}

/**
 * Calculate average rating
 */
export function calculateAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
}

/**
 * Format stock quantity
 */
export function formatStockQuantity(stock: number, unit = 'pcs'): string {
  return `${stock} ${unit}`;
}

/**
 * Check if product can be ordered
 */
export function canOrder(status: ProductStatus, stock: number, quantity: number): boolean {
  return status === ProductStatus.ACTIVE && stock >= quantity;
}

/**
 * Calculate bulk discount
 */
export function calculateBulkDiscount(
  quantity: number,
  price: number,
  discountTiers: Array<{ minQuantity: number; discountPercent: number }>
): number {
  const sortedTiers = discountTiers.sort((a, b) => b.minQuantity - a.minQuantity);

  for (const tier of sortedTiers) {
    if (quantity >= tier.minQuantity) {
      return calculateDiscountPrice(price, tier.discountPercent);
    }
  }

  return price;
}

/**
 * Validate stock operation
 */
export function validateStockOperation(
  currentStock: number,
  operation: 'add' | 'remove',
  quantity: number
): { valid: boolean; error?: string } {
  if (quantity <= 0) {
    return { valid: false, error: 'Quantity must be positive' };
  }

  if (operation === 'remove' && currentStock < quantity) {
    return { valid: false, error: 'Insufficient stock' };
  }

  return { valid: true };
}

/**
 * Calculate new stock after operation
 */
export function calculateNewStock(
  currentStock: number,
  operation: 'add' | 'remove' | 'set',
  quantity: number
): number {
  switch (operation) {
    case 'add':
      return currentStock + quantity;
    case 'remove':
      return Math.max(0, currentStock - quantity);
    case 'set':
      return Math.max(0, quantity);
    default:
      return currentStock;
  }
}

/**
 * Get product status color
 */
export function getStatusColor(status: ProductStatus): string {
  const colors: Record<ProductStatus, string> = {
    [ProductStatus.ACTIVE]: 'green',
    [ProductStatus.INACTIVE]: 'gray',    [ProductStatus.OUT_OF_STOCK]: 'red',    [ProductStatus.DISCONTINUED]: 'red'
  };
  return colors[status];
}

/**
 * Get product status label
 */
export function getStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    [ProductStatus.ACTIVE]: 'Actif',
    [ProductStatus.INACTIVE]: 'Inactif',    [ProductStatus.OUT_OF_STOCK]: 'En rupture',    [ProductStatus.DISCONTINUED]: 'Discontinué'
  };
  return labels[status];
}

/**
 * Check if status transition is allowed
 */
export function canTransitionStatus(from: ProductStatus, to: ProductStatus): boolean {
  const allowedTransitions: Record<ProductStatus, ProductStatus[]> = {
    [ProductStatus.ACTIVE]: [ProductStatus.INACTIVE, ProductStatus.OUT_OF_STOCK, ProductStatus.DISCONTINUED],
    [ProductStatus.INACTIVE]: [ProductStatus.ACTIVE, ProductStatus.DISCONTINUED],
    [ProductStatus.OUT_OF_STOCK]: [ProductStatus.ACTIVE, ProductStatus.DISCONTINUED],
    [ProductStatus.DISCONTINUED]: []
  };

  return allowedTransitions[from].includes(to);
}

/**
 * Sanitize product name
 */
export function sanitizeProductName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Generate product slug
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if price is valid
 */
export function isValidPrice(price: number): boolean {
  return price >= 0 && price <= 999999.99 && Number.isFinite(price);
}

/**
 * Round price to 2 decimals
 */
export function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}
