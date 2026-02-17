import { describe, it, expect } from '@jest/globals';
import { accountDeletionRequestsSchema, accountDeletionRequestsCreateSchema } from '../users.validators.js';

describe('AccountDeletionRequests Validators', () => {
  describe('accountDeletionRequestsSchema', () => {
    it('should validate a valid account_deletion_requests', () => {
      const validAccountDeletionRequests = {
        id: 1,
        user_id: 0,
      };

      const result = accountDeletionRequestsSchema.safeParse(validAccountDeletionRequests);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = accountDeletionRequestsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('accountDeletionRequestsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
      };

      const result = accountDeletionRequestsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
