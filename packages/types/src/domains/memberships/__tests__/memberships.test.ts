import { describe, it, expect } from '@jest/globals';
import { membershipsSchema, membershipsCreateSchema } from '../memberships.validators.js';

describe('Memberships Validators', () => {
  describe('membershipsSchema', () => {
    it('should validate a valid memberships', () => {
      const validMemberships = {
        id: 1,
        user_id: 0,
        plan_id: 0,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-01-01T00:00:00Z',
      };

      const result = membershipsSchema.safeParse(validMemberships);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = membershipsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('membershipsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        plan_id: 1,
        start_date: 'test start_date',
        end_date: 'test end_date',
      };

      const result = membershipsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
