import { describe, it, expect } from '@jest/globals';
import { productCategoriesSchema, productCategoriesCreateSchema } from '../shop.validators.js';

describe('ProductCategories Validators', () => {
  describe('productCategoriesSchema', () => {
    it('should validate a valid product_categories', () => {
      const validProductCategories = {
        id: 1,
        name: 'test name',
      };

      const result = productCategoriesSchema.safeParse(validProductCategories);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = productCategoriesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('productCategoriesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        name: 'test name',
      };

      const result = productCategoriesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
