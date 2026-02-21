/**
 * ProductCard Component Types
 *
 * Type definitions for the ProductCard component
 */

export interface ProductCardProps {
  /** Unique product identifier */
  id: string | number;

  /** Product name */
  name: string;

  /** Product description */
  description?: string;

  /** Product price */
  price: number | string;

  /** Product category */
  category?: string;

  /** Array of product image URLs */
  images?: string[];

  /** Total stock quantity */
  stock: number;

  /** Available sizes */
  sizes?: string[];

  /** Optional click handler */
  onClick?: (productId: string | number) => void;

  /** Optional add to cart handler */
  onAddToCart?: (productId: string | number) => void;

  /** Optional actions menu (kebab, buttons, etc.) */
  actions?: React.ReactNode;

  /** Additional CSS classes */
  className?: string;

  /** Whether to show add to cart button */
  showAddToCart?: boolean;

  /** Compact mode (smaller, less details) */
  compact?: boolean;
}

export interface ProductCardImageProps {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
}

export interface ProductCardPriceProps {
  price: number | string;
  originalPrice?: number | string;
  discount?: number;
}

export interface ProductCardStockProps {
  stock: number;
  showLabel?: boolean;
}

export interface ProductCardActionsProps {
  productId: string | number;
  onAddToCart?: (productId: string | number) => void;
  onViewDetails?: (productId: string | number) => void;
  stock: number;
}
