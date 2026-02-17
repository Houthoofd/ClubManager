import { describe, it, expect } from '@jest/globals';
import { financialStatsSchema, financialStatsCreateSchema } from '../statistics.validators.js';

describe('FinancialStats Validators', () => {
  describe('financialStatsSchema', () => {
    it('should validate a valid financial_stats', () => {
      const validFinancialStats = {
        id: 1,
        period_type: 'daily',
        period_start: 'test period_start',
        period_end: 'test period_end',
      };

      const result = financialStatsSchema.safeParse(validFinancialStats);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = financialStatsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('financialStatsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        period_type: 'daily',
        period_start: 'test period_start',
        period_end: 'test period_end',
      };

      const result = financialStatsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
