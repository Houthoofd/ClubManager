import { describe, it, expect } from '@jest/globals';
import { emailLogsSchema, emailLogsCreateSchema } from '../communications.validators.js';

describe('EmailLogs Validators', () => {
  describe('emailLogsSchema', () => {
    it('should validate a valid email_logs', () => {
      const validEmailLogs = {
        id: 1,
        recipient_email: 'test@example.com',
        email_type: 'welcome',
        subject: 'test subject',
        body: 'test body',
      };

      const result = emailLogsSchema.safeParse(validEmailLogs);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = emailLogsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('emailLogsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        recipient_email: 'test@example.com',
        email_type: 'welcome',
        subject: 'test subject',
        body: 'test body',
      };

      const result = emailLogsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
