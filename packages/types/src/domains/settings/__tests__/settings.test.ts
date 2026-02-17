import { describe, it, expect } from '@jest/globals';
import { settingsSchema, settingsCreateSchema } from '../settings.validators.js';

describe('Settings Validators', () => {
  describe('settingsSchema', () => {
    it('should validate a valid settings', () => {
      const validSettings = {
        id: 1,
        setting_key: 'test setting_key',
        setting_value: 'test setting_value',
      };

      const result = settingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = settingsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('settingsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        setting_key: 'test setting_key',
        setting_value: 'test setting_value',
      };

      const result = settingsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
