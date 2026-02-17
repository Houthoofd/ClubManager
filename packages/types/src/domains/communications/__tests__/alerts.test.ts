import { describe, it, expect } from '@jest/globals';
import { alertsSchema, alertsCreateSchema } from '../communications.validators.js';

describe('Alerts Validators', () => {
  describe('alertsSchema', () => {
    it('should validate a valid alerts', () => {
      const validAlerts = {
        id: 1,
        user_id: 0,
        alert_type: 'membership_expiring',
        title: 'test title',
        message: 'test message',
      };

      const result = alertsSchema.safeParse(validAlerts);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = alertsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('alertsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        alert_type: 'membership_expiring',
        title: 'test title',
        message: 'test message',
      };

      const result = alertsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
