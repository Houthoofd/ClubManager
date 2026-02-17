import { describe, it, expect } from '@jest/globals';
import { productsSchema, productsCreateSchema } from '../shop.validators.js';

describe('Products Validators', () => {
  describe('productsSchema', () => {
    it('should validate a valid products', () => {
      const validProducts = {
        id: 1,
        name: 'test name',
        price: 0,
      };

      const result = productsSchema.safeParse(validProducts);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = productsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('productsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        name: 'test name',
        price: 1,
      };

      const result = productsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
