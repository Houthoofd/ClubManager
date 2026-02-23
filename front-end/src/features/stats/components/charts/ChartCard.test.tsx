import { describe, it, expect } from 'vitest';
import { ChartCard } from './ChartCard';

describe('ChartCard', () => {
  it('should be defined', () => {
    expect(ChartCard).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(ChartCard).toBeTruthy();
  });
});
