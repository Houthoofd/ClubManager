import { describe, it, expect } from '@jest/globals';
import { ordersSchema, ordersCreateSchema } from '../shop.validators.js';

describe('Orders Validators', () => {
  describe('ordersSchema', () => {
    it('should validate a valid orders', () => {
      const validOrders = {
        id: 1,
        user_id: 0,
        order_number: 'test order_number',
        total_amount: 0,
      };

      const result = ordersSchema.safeParse(validOrders);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = ordersSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('ordersCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        order_number: 'test order_number',
        total_amount: 1,
      };

      const result = ordersCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
