/**
 * Shop Types & Interfaces
 * Types for shop, products, orders, and inventory management
 */

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  DISCONTINUED = "DISCONTINUED",
}

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PREPARING = "PREPARING",
  READY = "READY",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum OrderItemStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
}

export interface ProductFilters {
  categoryId?: number;
  status?: ProductStatus;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  tenantId?: string;
}

export interface OrderFilters {
  userId?: number;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  tenantId?: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  stock: number;
  categoryId?: number;
  imageUrl?: string;
  status?: ProductStatus;
  tenantId: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: number;
  imageUrl?: string;
  status?: ProductStatus;
}

export interface CreateOrderDTO {
  userId: number;
  items: OrderItemDTO[];
  notes?: string;
  tenantId: number;
}

export interface OrderItemDTO {
  productId: number;
  quantity: number;
  price?: number; // Optional, will use product price if not provided
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  totalValue: number;
  lowStockProducts: Array<{
    id: number;
    name: string;
    stock: number;
  }>;
}

export interface InventoryUpdate {
  productId: number;
  quantity: number;
  type: "ADD" | "REMOVE" | "SET";
  reason?: string;
}
