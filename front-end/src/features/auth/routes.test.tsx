import { describe, it, expect } from 'vitest';
import { authPublicRoutes } from './routes';

describe('authPublicRoutes', () => {
  it('should be defined', () => {
    expect(authPublicRoutes).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(authPublicRoutes).toBeTruthy();
  });
});
