import { describe, it, expect } from '@jest/globals';
import { activityCategoriesSchema, activityCategoriesCreateSchema } from '../activities.validators.js';

describe('ActivityCategories Validators', () => {
  describe('activityCategoriesSchema', () => {
    it('should validate a valid activity_categories', () => {
      const validActivityCategories = {
        id: 1,
        name: 'test name',
      };

      const result = activityCategoriesSchema.safeParse(validActivityCategories);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = activityCategoriesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('activityCategoriesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        name: 'test name',
      };

      const result = activityCategoriesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
