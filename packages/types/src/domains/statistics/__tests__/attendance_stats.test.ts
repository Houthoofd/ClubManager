import { describe, it, expect } from '@jest/globals';
import { attendanceStatsSchema, attendanceStatsCreateSchema } from '../statistics.validators.js';

describe('AttendanceStats Validators', () => {
  describe('attendanceStatsSchema', () => {
    it('should validate a valid attendance_stats', () => {
      const validAttendanceStats = {
        id: 1,
        user_id: 0,
        period_start: 'test period_start',
        period_end: 'test period_end',
      };

      const result = attendanceStatsSchema.safeParse(validAttendanceStats);
      expect(result.success).toBe(true);
    });

    it('should fail without required fields', () => {
      const result = attendanceStatsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('attendanceStatsCreateSchema', () => {
    it('should validate a valid create input', () => {
      const validCreate = {
        user_id: 1,
        period_start: 'test period_start',
        period_end: 'test period_end',
      };

      const result = attendanceStatsCreateSchema.safeParse(validCreate);
      expect(result.success).toBe(true);
    });
  });
});
