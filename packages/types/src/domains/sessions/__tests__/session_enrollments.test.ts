import { describe, it, expect } from '@jest/globals';
import { sessionEnrollmentsSchema, sessionEnrollmentsCreateSchema } from '../sessions.validators.js';

describe('SessionEnrollments Validators', () => {
  describe('sessionEnrollmentsSchema', () => {
    it('should validate a valid session_enrollments', () => {
      const validSessionEnrollments = {
        id: 1,
        user_id: 0,
        session_id: 0,
      };

      const result = sessionEnrollmentsSchema.safeParse(validSessionEnrollments);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = sessionEnrollmentsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('sessionEnrollmentsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        session_id: 1,
      };

      const result = sessionEnrollmentsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
