import { describe, it, expect } from '@jest/globals';
import { activityLevelsSchema, activityLevelsCreateSchema } from '../activities.validators.js';

describe('ActivityLevels Validators', () => {
  describe('activityLevelsSchema', () => {
    it('should validate a valid activity_levels', () => {
      const validActivityLevels = {
        id: 1,
        activity_id: 0,
        name: 'test name',
        level_order: 0,
      };

      const result = activityLevelsSchema.safeParse(validActivityLevels);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = activityLevelsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('activityLevelsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        activity_id: 1,
        name: 'test name',
        level_order: 1,
      };

      const result = activityLevelsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
