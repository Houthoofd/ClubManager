import { describe, it, expect } from 'vitest';
import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
  it('should be defined', () => {
    expect(ActionButton).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(ActionButton).toBeTruthy();
  });
});
