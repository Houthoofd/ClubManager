/**
 * ProductStats Types
 *
 * Type definitions for ProductStats component.
 */

export interface ProductStatsProps {
  /** Total number of products */
  totalProducts?: number;

  /** Total number of categories */
  totalCategories?: number;

  /** Number of products with low stock */
  lowStockProducts?: number;

  /** Number of products out of stock */
  outOfStockProducts?: number;

  /** Whether to show total products stat */
  showTotal?: boolean;

  /** Whether to show total categories stat */
  showCategories?: boolean;

  /** Whether to show low stock stat */
  showLowStock?: boolean;

  /** Whether to show out of stock stat */
  showOutOfStock?: boolean;

  /** Layout variant */
  variant?: "horizontal" | "vertical";

  /** Additional CSS classes */
  className?: string;
}
