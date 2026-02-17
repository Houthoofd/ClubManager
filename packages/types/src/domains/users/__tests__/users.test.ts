import { describe, it, expect } from '@jest/globals';
import { usersSchema, usersCreateSchema } from '../users.validators.js';

describe('Users Validators', () => {
  describe('usersSchema', () => {
    it('should validate a valid users', () => {
      const validUsers = {
        id: 1,
        first_name: 'test first_name',
        last_name: 'test last_name',
        email: 'test@example.com',
        password: 'test password',
      };

      const result = usersSchema.safeParse(validUsers);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = usersSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('usersCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        first_name: 'test first_name',
        last_name: 'test last_name',
        email: 'test@example.com',
        password: 'test password',
      };

      const result = usersCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
