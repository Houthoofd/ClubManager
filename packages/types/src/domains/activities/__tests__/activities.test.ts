import { describe, it, expect } from '@jest/globals';
import { activitiesSchema, activitiesCreateSchema } from '../activities.validators.js';

describe('Activities Validators', () => {
  describe('activitiesSchema', () => {
    it('should validate a valid activities', () => {
      const validActivities = {
        id: 1,
        category_id: 0,
        name: 'test name',
      };

      const result = activitiesSchema.safeParse(validActivities);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = activitiesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('activitiesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        category_id: 1,
        name: 'test name',
      };

      const result = activitiesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
