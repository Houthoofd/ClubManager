import { describe, it, expect } from '@jest/globals';
import { emailTemplatesSchema, emailTemplatesCreateSchema } from '../communications.validators.js';

describe('EmailTemplates Validators', () => {
  describe('emailTemplatesSchema', () => {
    it('should validate a valid email_templates', () => {
      const validEmailTemplates = {
        id: 1,
        name: 'test name',
        slug: 'test slug',
        email_type: 'welcome',
        subject: 'test subject',
        body_html: 'test body_html',
      };

      const result = emailTemplatesSchema.safeParse(validEmailTemplates);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = emailTemplatesSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('emailTemplatesCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        name: 'test name',
        slug: 'test slug',
        email_type: 'welcome',
        subject: 'test subject',
        body_html: 'test body_html',
      };

      const result = emailTemplatesCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
