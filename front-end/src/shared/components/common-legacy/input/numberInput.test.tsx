import { describe, it, expect } from 'vitest';
import { PriceInput } from './numberInput';

describe('PriceInput', () => {
  it('should be defined', () => {
    expect(PriceInput).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(PriceInput).toBeTruthy();
  });
});
