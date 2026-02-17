import { describe, it, expect } from '@jest/globals';
import { paymentsSchema, paymentsCreateSchema } from '../memberships.validators.js';

describe('Payments Validators', () => {
  describe('paymentsSchema', () => {
    it('should validate a valid payments', () => {
      const validPayments = {
        id: 1,
        user_id: 0,
        amount: 0,
      };

      const result = paymentsSchema.safeParse(validPayments);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = paymentsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('paymentsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        amount: 1,
      };

      const result = paymentsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
