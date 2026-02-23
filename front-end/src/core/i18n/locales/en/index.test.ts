import { describe, it, expect } from 'vitest';
import { en } from './index';

describe('en', () => {
  it('should be defined', () => {
    expect(en).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(en).toBeTruthy();
  });
});
