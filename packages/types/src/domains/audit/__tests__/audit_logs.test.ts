import { describe, it, expect } from '@jest/globals';
import { auditLogsSchema, auditLogsCreateSchema } from '../audit.validators.js';

describe('AuditLogs Validators', () => {
  describe('auditLogsSchema', () => {
    it('should validate a valid audit_logs', () => {
      const validAuditLogs = {
        id: 1,
        action: 'test action',
      };

      const result = auditLogsSchema.safeParse(validAuditLogs);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = auditLogsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('auditLogsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        action: 'test action',
      };

      const result = auditLogsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
