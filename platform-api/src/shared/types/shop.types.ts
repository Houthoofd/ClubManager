/**
 * Shop Types & Interfaces
 * Types for e-commerce, products, orders, and inventory management
 */

export enum OrderStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export enum ProductStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  DISCONTINUED = "DISCONTINUED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
}

export interface OrderFilters {
  userId?: number;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  tenantId?: string;
  minTotal?: number;
  maxTotal?: number;
}

export interface ProductFilters {
  categoryId?: number;
  status?: ProductStatus;
  search?: string;
  tenantId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export interface CreateOrderDTO {
  userId: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  tenantId: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  state?: string;
}

export interface CreateProductDTO {
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  stock?: number;
  sku?: string;
  images?: string[];
  specifications?: Record<string, any>;
  tenantId: string;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: number;
  stock?: number;
  status?: ProductStatus;
  images?: string[];
  specifications?: Record<string, any>;
}

export interface ProductSummary {
  id: number;
  name: string;
  price: number;
  stock: number;
  status: ProductStatus;
  categoryName?: string;
  image?: string;
}

export interface OrderSummary {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  currency: string;
  customerName: string;
  createdAt: Date;
  itemCount: number;
}

export interface InventoryItem {
  productId: number;
  productName: string;
  sku?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderLevel?: number;
  lastRestocked?: Date;
}

export interface ShopStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: ProductSummary[];
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: OrderSummary[];
}