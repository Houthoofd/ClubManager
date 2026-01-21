// Shop helper utilities

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ShopValidationError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'ShopValidationError';
  }
}

export function validateProductId(productId: number): void {
  if (!productId || productId <= 0) {
    throw new ValidationError('Invalid product ID');
  }
}

export function validateStockOperation(quantity: number, operation: string): void {
  if (!quantity || quantity <= 0) {
    throw new ValidationError(`Invalid quantity for ${operation} operation`);
  }
}

export function calculateNewStock(currentStock: number, quantity: number, operation: 'add' | 'remove'): number {
  if (operation === 'add') {
    return currentStock + quantity;
  } else {
    const newStock = currentStock - quantity;
    if (newStock < 0) {
      throw new ValidationError('Insufficient stock');
    }
    return newStock;
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

export function calculateTax(amount: number, taxRate: number = 0.21): number {
  return amount * taxRate;
}