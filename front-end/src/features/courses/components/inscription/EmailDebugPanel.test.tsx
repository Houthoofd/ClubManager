import { describe, it, expect } from 'vitest';
import { EmailDebugPanel } from './EmailDebugPanel';

describe('EmailDebugPanel', () => {
  it('should be defined', () => {
    expect(EmailDebugPanel).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(EmailDebugPanel).toBeTruthy();
  });
});
