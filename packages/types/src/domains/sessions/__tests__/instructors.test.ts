import { describe, it, expect } from '@jest/globals';
import { instructorsSchema, instructorsCreateSchema } from '../sessions.validators.js';

describe('Instructors Validators', () => {
  describe('instructorsSchema', () => {
    it('should validate a valid instructors', () => {
      const validInstructors = {
        id: 1,
        user_id: 0,
      };

      const result = instructorsSchema.safeParse(validInstructors);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = instructorsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('instructorsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
      };

      const result = instructorsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
