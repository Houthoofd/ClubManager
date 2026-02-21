/**
 * ====================================================================
 * SHOP SERVICES - BARREL EXPORT
 * ====================================================================
 *
 * Point d'entrée centralisé pour tous les services métier liés au shop/produits.
 *
 * Usage:
 * ```tsx
 * import { ProductService } from '@/features/shop/services';
 *
 * // Utiliser les fonctions du service
 * const price = ProductService.formatPrice(product.prix);
 * const isAvailable = ProductService.isInStock(product);
 * const cartTotal = ProductService.calculateCartSubtotal(cartItems);
 * ```
 *
 * Ou importer des fonctions spécifiques:
 * ```tsx
 * import { formatPrice, addToCart, validateCart } from '@/features/shop/services';
 * ```
 */

// ============================================================================
// Export everything from product.service.ts
// ============================================================================

export * from './product.service';
export { default as ProductService } from './product.service';

// ============================================================================
// Re-export types for convenience
// ============================================================================

export type {
  Product,
  CartItem,
  ProductFilters,
  ProductStats,
  Cart,
} from './product.service';
