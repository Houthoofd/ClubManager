import { describe, it, expect } from '@jest/globals';
import { userActivitiesSchema, userActivitiesCreateSchema } from '../activities.validators.js';

describe('UserActivities Validators', () => {
  describe('userActivitiesSchema', () => {
    it('should validate a valid user_activities', () => {
      const validUserActivities = {
        id: 1,
        user_id: 0,
        activity_id: 0,
      };

      const result = userActivitiesSchema.safeParse(validUserActivities);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = userActivitiesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('userActivitiesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        activity_id: 1,
      };

      const result = userActivitiesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
