/**
 * Unit tests for shop helper utilities
 * Tests validation, stock calculations, and formatting functions
 */

import { describe, it, expect } from '@jest/globals';
import {
  NotFoundError,
  ValidationError,
  ShopValidationError,
  validateProductId,
  validateStockOperation,
  calculateNewStock,
  formatPrice,
  calculateTax,
} from '../shopHelpers.js';

describe('Shop Helper Utilities', () => {
  describe('Error Classes', () => {
    describe('NotFoundError', () => {
      it('should create NotFoundError with correct properties', () => {
        const error = new NotFoundError('Product not found');
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('NotFoundError');
        expect(error.message).toBe('Product not found');
      });
    });

    describe('ValidationError', () => {
      it('should create ValidationError with correct properties', () => {
        const error = new ValidationError('Invalid data');
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('ValidationError');
        expect(error.message).toBe('Invalid data');
      });
    });

    describe('ShopValidationError', () => {
      it('should create ShopValidationError with correct properties', () => {
        const error = new ShopValidationError('Invalid shop data');
        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.name).toBe('ShopValidationError');
        expect(error.message).toBe('Invalid shop data');
      });

      it('should be distinguishable from ValidationError', () => {
        const shopError = new ShopValidationError('Shop error');
        const validationError = new ValidationError('Validation error');

        expect(shopError).toBeInstanceOf(ShopValidationError);
        expect(validationError).not.toBeInstanceOf(ShopValidationError);
      });
    });
  });

  describe('validateProductId', () => {
    it('should not throw for valid product ID', () => {
      expect(() => validateProductId(1)).not.toThrow();
      expect(() => validateProductId(100)).not.toThrow();
      expect(() => validateProductId(999999)).not.toThrow();
    });

    it('should throw ValidationError for zero', () => {
      expect(() => validateProductId(0)).toThrow(ValidationError);
      expect(() => validateProductId(0)).toThrow('Invalid product ID');
    });

    it('should throw ValidationError for negative numbers', () => {
      expect(() => validateProductId(-1)).toThrow(ValidationError);
      expect(() => validateProductId(-100)).toThrow(ValidationError);
    });

    it('should throw ValidationError for null or undefined', () => {
      expect(() => validateProductId(null as any)).toThrow(ValidationError);
      expect(() => validateProductId(undefined as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for NaN', () => {
      expect(() => validateProductId(NaN)).toThrow(ValidationError);
    });
  });

  describe('validateStockOperation', () => {
    it('should not throw for valid quantity and operation', () => {
      expect(() => validateStockOperation(1, 'add')).not.toThrow();
      expect(() => validateStockOperation(100, 'remove')).not.toThrow();
      expect(() => validateStockOperation(50, 'update')).not.toThrow();
    });

    it('should throw ValidationError for zero quantity', () => {
      expect(() => validateStockOperation(0, 'add')).toThrow(ValidationError);
      expect(() => validateStockOperation(0, 'add')).toThrow('Invalid quantity for add operation');
    });

    it('should throw ValidationError for negative quantity', () => {
      expect(() => validateStockOperation(-1, 'add')).toThrow(ValidationError);
      expect(() => validateStockOperation(-50, 'remove')).toThrow(ValidationError);
    });

    it('should include operation name in error message', () => {
      expect(() => validateStockOperation(0, 'transfer')).toThrow('transfer operation');
      expect(() => validateStockOperation(-5, 'adjustment')).toThrow('adjustment operation');
    });

    it('should throw ValidationError for null or undefined quantity', () => {
      expect(() => validateStockOperation(null as any, 'add')).toThrow(ValidationError);
      expect(() => validateStockOperation(undefined as any, 'add')).toThrow(ValidationError);
    });
  });

  describe('calculateNewStock', () => {
    describe('add operation', () => {
      it('should add quantity to current stock', () => {
        expect(calculateNewStock(10, 5, 'add')).toBe(15);
        expect(calculateNewStock(0, 10, 'add')).toBe(10);
        expect(calculateNewStock(100, 50, 'add')).toBe(150);
      });

      it('should handle large numbers', () => {
        expect(calculateNewStock(1000000, 500000, 'add')).toBe(1500000);
      });

      it('should handle adding to zero stock', () => {
        expect(calculateNewStock(0, 1, 'add')).toBe(1);
      });
    });

    describe('remove operation', () => {
      it('should subtract quantity from current stock', () => {
        expect(calculateNewStock(10, 5, 'remove')).toBe(5);
        expect(calculateNewStock(100, 50, 'remove')).toBe(50);
        expect(calculateNewStock(20, 20, 'remove')).toBe(0);
      });

      it('should throw ValidationError when resulting stock is negative', () => {
        expect(() => calculateNewStock(10, 15, 'remove')).toThrow(ValidationError);
        expect(() => calculateNewStock(10, 15, 'remove')).toThrow('Insufficient stock');
      });

      it('should throw ValidationError when removing from zero stock', () => {
        expect(() => calculateNewStock(0, 1, 'remove')).toThrow(ValidationError);
        expect(() => calculateNewStock(0, 1, 'remove')).toThrow('Insufficient stock');
      });

      it('should allow removing all stock', () => {
        expect(calculateNewStock(10, 10, 'remove')).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('should handle decimal numbers correctly', () => {
        expect(calculateNewStock(10.5, 5.5, 'add')).toBe(16);
        expect(calculateNewStock(10.5, 5.5, 'remove')).toBe(5);
      });

      it('should handle very small quantities', () => {
        expect(calculateNewStock(0, 1, 'add')).toBe(1);
        expect(calculateNewStock(1, 1, 'remove')).toBe(0);
      });
    });
  });

  describe('formatPrice', () => {
    it('should format price in EUR currency', () => {
      const formatted = formatPrice(10);
      expect(formatted).toContain('10');
      expect(formatted).toContain('€');
    });

    it('should format decimal prices correctly', () => {
      const formatted = formatPrice(10.50);
      expect(formatted).toContain('10,50');
    });

    it('should format zero price', () => {
      const formatted = formatPrice(0);
      expect(formatted).toContain('0');
      expect(formatted).toContain('€');
    });

    it('should format large prices', () => {
      const formatted = formatPrice(1000);
      // French format uses space for thousands separator
      expect(formatted).toMatch(/1\s?000/);
      expect(formatted).toContain('€');
    });

    it('should format very large prices with proper separators', () => {
      const formatted = formatPrice(1234567.89);
      expect(formatted).toContain('€');
      // Should have thousands separators
      expect(formatted.length).toBeGreaterThan(10);
    });

    it('should handle negative prices', () => {
      const formatted = formatPrice(-10);
      expect(formatted).toContain('-');
      expect(formatted).toContain('10');
      expect(formatted).toContain('€');
    });

    it('should round to 2 decimal places', () => {
      const formatted = formatPrice(10.999);
      expect(formatted).toContain('11');
    });

    it('should handle very small amounts', () => {
      const formatted = formatPrice(0.01);
      expect(formatted).toContain('0,01');
      expect(formatted).toContain('€');
    });
  });

  describe('calculateTax', () => {
    describe('with default tax rate (21%)', () => {
      it('should calculate tax correctly', () => {
        expect(calculateTax(100)).toBe(21);
        expect(calculateTax(200)).toBe(42);
        expect(calculateTax(50)).toBe(10.5);
      });

      it('should handle zero amount', () => {
        expect(calculateTax(0)).toBe(0);
      });

      it('should handle decimal amounts', () => {
        expect(calculateTax(100.50)).toBeCloseTo(21.105, 2);
      });

      it('should handle large amounts', () => {
        expect(calculateTax(10000)).toBe(2100);
      });

      it('should handle very small amounts', () => {
        expect(calculateTax(1)).toBe(0.21);
      });
    });

    describe('with custom tax rate', () => {
      it('should calculate tax with 0% rate', () => {
        expect(calculateTax(100, 0)).toBe(0);
      });

      it('should calculate tax with 10% rate', () => {
        expect(calculateTax(100, 0.10)).toBe(10);
      });

      it('should calculate tax with 5.5% rate', () => {
        expect(calculateTax(100, 0.055)).toBe(5.5);
      });

      it('should calculate tax with 20% rate', () => {
        expect(calculateTax(100, 0.20)).toBe(20);
      });

      it('should handle fractional tax rates', () => {
        expect(calculateTax(100, 0.195)).toBe(19.5);
      });

      it('should handle 100% tax rate', () => {
        expect(calculateTax(100, 1)).toBe(100);
      });

      it('should handle tax rates greater than 100%', () => {
        expect(calculateTax(100, 1.5)).toBe(150);
      });
    });

    describe('edge cases', () => {
      it('should handle negative amounts', () => {
        expect(calculateTax(-100)).toBe(-21);
      });

      it('should handle negative tax rates', () => {
        expect(calculateTax(100, -0.21)).toBe(-21);
      });

      it('should return precise calculations for accounting', () => {
        const amount = 99.99;
        const tax = calculateTax(amount, 0.21);
        expect(tax).toBeCloseTo(20.9979, 4);
      });

      it('should handle very large amounts', () => {
        expect(calculateTax(1000000, 0.21)).toBe(210000);
      });

      it('should handle very small tax rates', () => {
        expect(calculateTax(1000, 0.001)).toBe(1);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should validate and calculate stock addition', () => {
      const productId = 123;
      const currentStock = 50;
      const quantity = 25;

      expect(() => validateProductId(productId)).not.toThrow();
      expect(() => validateStockOperation(quantity, 'add')).not.toThrow();
      const newStock = calculateNewStock(currentStock, quantity, 'add');
      expect(newStock).toBe(75);
    });

    it('should validate and calculate stock removal', () => {
      const productId = 456;
      const currentStock = 100;
      const quantity = 30;

      expect(() => validateProductId(productId)).not.toThrow();
      expect(() => validateStockOperation(quantity, 'remove')).not.toThrow();
      const newStock = calculateNewStock(currentStock, quantity, 'remove');
      expect(newStock).toBe(70);
    });

    it('should format price with tax calculation', () => {
      const basePrice = 100;
      const tax = calculateTax(basePrice, 0.21);
      const totalPrice = basePrice + tax;
      const formatted = formatPrice(totalPrice);

      expect(totalPrice).toBe(121);
      expect(formatted).toContain('121');
      expect(formatted).toContain('€');
    });

    it('should handle complete order flow', () => {
      // Product validation
      const productId = 789;
      validateProductId(productId);

      // Stock check and update
      const currentStock = 50;
      const orderQuantity = 10;
      validateStockOperation(orderQuantity, 'order');
      const newStock = calculateNewStock(currentStock, orderQuantity, 'remove');

      // Price calculation
      const unitPrice = 25.99;
      const subtotal = unitPrice * orderQuantity;
      const tax = calculateTax(subtotal, 0.21);
      const total = subtotal + tax;

      expect(newStock).toBe(40);
      expect(subtotal).toBeCloseTo(259.9, 2);
      expect(tax).toBeCloseTo(54.579, 2);
      expect(total).toBeCloseTo(314.479, 2);

      const formattedTotal = formatPrice(total);
      expect(formattedTotal).toContain('€');
    });
  });
});
