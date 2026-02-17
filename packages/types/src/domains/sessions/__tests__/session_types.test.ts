import { describe, it, expect } from '@jest/globals';
import { sessionTypesSchema, sessionTypesCreateSchema } from '../sessions.validators.js';

describe('SessionTypes Validators', () => {
  describe('sessionTypesSchema', () => {
    it('should validate a valid session_types', () => {
      const validSessionTypes = {
        id: 1,
        activity_id: 0,
        name: 'test name',
      };

      const result = sessionTypesSchema.safeParse(validSessionTypes);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = sessionTypesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('sessionTypesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        activity_id: 1,
        name: 'test name',
      };

      const result = sessionTypesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
