/**
 * Shop Validators
 * Validation logic for shop, products, and orders
 */

import {
  ProductStatus,
  OrderStatus,
  CreateProductDTO,
  UpdateProductDTO,
  CreateOrderDTO,
  OrderItemDTO,
} from "@clubmanager/types";

export class ShopValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ShopValidationError";
  }
}

/**
 * Validate product creation data
 */
export function validateCreateProduct(data: CreateProductDTO): void {
  if (!data.name || data.name.trim().length === 0) {
    throw new ShopValidationError("Product name is required", "name");
  }

  if (data.name.length > 200) {
    throw new ShopValidationError(
      "Product name must be less than 200 characters",
      "name",
    );
  }

  if (data.price === undefined || data.price === null) {
    throw new ShopValidationError("Product price is required", "price");
  }

  if (data.price < 0) {
    throw new ShopValidationError("Product price must be positive", "price");
  }

  if (data.price > 999999.99) {
    throw new ShopValidationError("Product price is too high", "price");
  }

  if (data.stock === undefined || data.stock === null) {
    throw new ShopValidationError("Product stock is required", "stock");
  }

  if (data.stock < 0) {
    throw new ShopValidationError("Product stock cannot be negative", "stock");
  }

  if (!Number.isInteger(data.stock)) {
    throw new ShopValidationError("Product stock must be an integer", "stock");
  }

  if (data.description && data.description.length > 2000) {
    throw new ShopValidationError(
      "Product description must be less than 2000 characters",
      "description",
    );
  }

  if (data.imageUrl && data.imageUrl.length > 500) {
    throw new ShopValidationError(
      "Image URL must be less than 500 characters",
      "imageUrl",
    );
  }

  if (data.status && !Object.values(ProductStatus).includes(data.status)) {
    throw new ShopValidationError("Invalid product status", "status");
  }

  if (!data.tenantId || data.tenantId <= 0) {
    throw new ShopValidationError("Valid tenant ID is required", "tenantId");
  }
}

/**
 * Validate product update data
 */
export function validateUpdateProduct(data: UpdateProductDTO): void {
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      throw new ShopValidationError("Product name cannot be empty", "name");
    }
    if (data.name.length > 200) {
      throw new ShopValidationError(
        "Product name must be less than 200 characters",
        "name",
      );
    }
  }

  if (data.price !== undefined) {
    if (data.price < 0) {
      throw new ShopValidationError("Product price must be positive", "price");
    }
    if (data.price > 999999.99) {
      throw new ShopValidationError("Product price is too high", "price");
    }
  }

  if (data.stock !== undefined) {
    if (data.stock < 0) {
      throw new ShopValidationError(
        "Product stock cannot be negative",
        "stock",
      );
    }
    if (!Number.isInteger(data.stock)) {
      throw new ShopValidationError(
        "Product stock must be an integer",
        "stock",
      );
    }
  }

  if (data.description !== undefined && data.description.length > 2000) {
    throw new ShopValidationError(
      "Product description must be less than 2000 characters",
      "description",
    );
  }

  if (data.imageUrl !== undefined && data.imageUrl.length > 500) {
    throw new ShopValidationError(
      "Image URL must be less than 500 characters",
      "imageUrl",
    );
  }

  if (
    data.status !== undefined &&
    !Object.values(ProductStatus).includes(data.status)
  ) {
    throw new ShopValidationError("Invalid product status", "status");
  }
}

/**
 * Validate order item
 */
export function validateOrderItem(item: OrderItemDTO): void {
  if (!item.productId || item.productId <= 0) {
    throw new ShopValidationError("Valid product ID is required", "productId");
  }

  if (!item.quantity || item.quantity <= 0) {
    throw new ShopValidationError(
      "Quantity must be greater than 0",
      "quantity",
    );
  }

  if (!Number.isInteger(item.quantity)) {
    throw new ShopValidationError("Quantity must be an integer", "quantity");
  }

  if (item.quantity > 1000) {
    throw new ShopValidationError(
      "Quantity cannot exceed 1000 per item",
      "quantity",
    );
  }

  if (item.price !== undefined) {
    if (item.price < 0) {
      throw new ShopValidationError("Item price must be positive", "price");
    }
    if (item.price > 999999.99) {
      throw new ShopValidationError("Item price is too high", "price");
    }
  }
}

/**
 * Validate order creation data
 */
export function validateCreateOrder(data: CreateOrderDTO): void {
  if (!data.userId || data.userId <= 0) {
    throw new ShopValidationError("Valid user ID is required", "userId");
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new ShopValidationError(
      "Order must contain at least one item",
      "items",
    );
  }

  if (data.items.length > 100) {
    throw new ShopValidationError(
      "Order cannot contain more than 100 items",
      "items",
    );
  }

  // Validate each item
  data.items.forEach((item, index) => {
    try {
      validateOrderItem(item);
    } catch (error) {
      if (error instanceof ShopValidationError) {
        throw new ShopValidationError(
          `Item ${index + 1}: ${error.message}`,
          `items[${index}].${error.field}`,
        );
      }
      throw error;
    }
  });

  if (data.notes && data.notes.length > 1000) {
    throw new ShopValidationError(
      "Order notes must be less than 1000 characters",
      "notes",
    );
  }

  if (!data.tenantId || data.tenantId <= 0) {
    throw new ShopValidationError("Valid tenant ID is required", "tenantId");
  }
}

/**
 * Validate order status transition
 */
export function validateOrderStatusTransition(
  currentStatus: OrderStatus,
  newStatus: OrderStatus,
): void {
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
    [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
    [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed.includes(newStatus)) {
    throw new ShopValidationError(
      `Cannot transition from ${currentStatus} to ${newStatus}`,
      "status",
    );
  }
}

/**
 * Validate stock availability
 */
export function validateStockAvailability(
  requested: number,
  available: number,
  productName: string,
): void {
  if (requested > available) {
    throw new ShopValidationError(
      `Insufficient stock for ${productName}. Requested: ${requested}, Available: ${available}`,
      "stock",
    );
  }
}

/**
 * Validate product ID
 */
export function validateProductId(id: number): void {
  if (!id || id <= 0 || !Number.isInteger(id)) {
    throw new ShopValidationError("Valid product ID is required", "productId");
  }
}

/**
 * Validate order ID
 */
export function validateOrderId(id: number): void {
  if (!id || id <= 0 || !Number.isInteger(id)) {
    throw new ShopValidationError("Valid order ID is required", "orderId");
  }
}
