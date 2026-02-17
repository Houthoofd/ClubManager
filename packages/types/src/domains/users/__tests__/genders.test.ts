import { describe, it, expect } from '@jest/globals';
import { gendersSchema, gendersCreateSchema } from '../users.validators.js';

describe('Genders Validators', () => {
  describe('gendersSchema', () => {
    it('should validate a valid genders', () => {
      const validGenders = {
        id: 1,
        name: 'test name',
      };

      const result = gendersSchema.safeParse(validGenders);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = gendersSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('gendersCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        name: 'test name',
      };

      const result = gendersCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
