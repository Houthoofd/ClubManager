import { describe, it, expect } from 'vitest';
import { default } from './UserCard.types';

describe('default', () => {
  it('should be defined', () => {
    expect(default).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(default).toBeTruthy();
  });
});
