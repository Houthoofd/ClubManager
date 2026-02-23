import { describe, it, expect } from 'vitest';
import { appRoutes } from './app.routes';

describe('appRoutes', () => {
  it('should be defined', () => {
    expect(appRoutes).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(appRoutes).toBeTruthy();
  });
});
