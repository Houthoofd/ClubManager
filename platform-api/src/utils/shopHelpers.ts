/**
 * Shop Helpers
 * Utility functions for shop operations
 */

/**
 * Validate product ID
 */
export function validateProductId(productId: number): void {
  if (!Number.isInteger(productId) || productId <= 0) {
    throw new ShopValidationError("Invalid product ID", "productId");
  }
}

/**
 * Validate stock operation
 */
export function validateStockOperation(
  currentStock: number,
  operation: "add" | "remove" | "set",
  quantity: number,
): { valid: boolean; error?: string } {
  if (!Number.isInteger(quantity) || quantity < 0) {
    return { valid: false, error: "Quantity must be a non-negative integer" };
  }

  if (operation === "remove" && currentStock < quantity) {
    return {
      valid: false,
      error: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`,
    };
  }

  return { valid: true };
}

/**
 * Calculate new stock after operation
 */
export function calculateNewStock(
  currentStock: number,
  operation: "add" | "remove" | "set",
  quantity: number,
): number {
  switch (operation) {
    case "add":
      return currentStock + quantity;
    case "remove":
      return Math.max(0, currentStock - quantity);
    case "set":
      return quantity;
    default:
      throw new Error(`Invalid operation: ${operation}`);
  }
}

/**
 * Check if product needs reorder
 */
export function needsReorder(
  currentStock: number,
  threshold: number = 5,
): boolean {
  return currentStock <= threshold;
}

/**
 * Shop Validation Error
 */
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
 * Not Found Error
 */
export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = "NotFoundError";
  }
}

/**
 * Insufficient Stock Error
 */
export class InsufficientStockError extends Error {
  constructor(
    productId: number,
    available: number,
    requested: number,
  ) {
    super(
      `Insufficient stock for product ${productId}. Available: ${available}, Requested: ${requested}`,
    );
    this.name = "InsufficientStockError";
  }
}
