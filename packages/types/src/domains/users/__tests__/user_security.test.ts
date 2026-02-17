import { describe, it, expect } from '@jest/globals';
import { userSecuritySchema, userSecurityCreateSchema } from '../users.validators.js';

describe('UserSecurity Validators', () => {
  describe('userSecuritySchema', () => {
    it('should validate a valid user_security', () => {
      const validUserSecurity = {
        id: 1,
        user_id: 0,
      };

      const result = userSecuritySchema.safeParse(validUserSecurity);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = userSecuritySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('userSecurityCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
      };

      const result = userSecurityCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
