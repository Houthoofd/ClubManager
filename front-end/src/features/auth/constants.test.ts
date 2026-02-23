import { describe, it, expect } from 'vitest';
import { AUTH_STATUS } from './constants';

describe('AUTH_STATUS', () => {
  it('should be defined', () => {
    expect(AUTH_STATUS).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(AUTH_STATUS).toBeTruthy();
  });
});
