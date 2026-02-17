import { describe, it, expect } from '@jest/globals';
import { membershipPlansSchema, membershipPlansCreateSchema } from '../memberships.validators.js';

describe('MembershipPlans Validators', () => {
  describe('membershipPlansSchema', () => {
    it('should validate a valid membership_plans', () => {
      const validMembershipPlans = {
        id: 1,
        name: 'test name',
        price: 0,
      };

      const result = membershipPlansSchema.safeParse(validMembershipPlans);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = membershipPlansSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('membershipPlansCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        name: 'test name',
        price: 1,
      };

      const result = membershipPlansCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
