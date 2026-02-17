import { describe, it, expect } from '@jest/globals';
import { orderItemsSchema, orderItemsCreateSchema } from '../shop.validators.js';

describe('OrderItems Validators', () => {
  describe('orderItemsSchema', () => {
    it('should validate a valid order_items', () => {
      const validOrderItems = {
        id: 1,
        order_id: 0,
        product_id: 0,
        unit_price: 0,
        total_price: 0,
      };

      const result = orderItemsSchema.safeParse(validOrderItems);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = orderItemsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('orderItemsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        order_id: 1,
        product_id: 1,
        unit_price: 1,
        total_price: 1,
      };

      const result = orderItemsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
