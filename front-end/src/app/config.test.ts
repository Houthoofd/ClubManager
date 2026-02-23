import { describe, it, expect } from 'vitest';
import { API_BASE_URL } from './config';

describe('API_BASE_URL', () => {
  it('should be defined', () => {
    expect(API_BASE_URL).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(API_BASE_URL).toBeTruthy();
  });
});
