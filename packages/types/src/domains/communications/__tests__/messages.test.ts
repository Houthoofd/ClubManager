import { describe, it, expect } from '@jest/globals';
import { messagesSchema, messagesCreateSchema } from '../communications.validators.js';

describe('Messages Validators', () => {
  describe('messagesSchema', () => {
    it('should validate a valid messages', () => {
      const validMessages = {
        id: 1,
        sender_id: 0,
        recipient_id: 0,
        content: 'test content',
      };

      const result = messagesSchema.safeParse(validMessages);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = messagesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('messagesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        sender_id: 1,
        recipient_id: 1,
        content: 'test content',
      };

      const result = messagesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
