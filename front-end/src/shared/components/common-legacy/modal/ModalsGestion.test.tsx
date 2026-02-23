import { describe, it, expect } from 'vitest';
import { ModalConfirmation } from './ModalsGestion';

describe('ModalConfirmation', () => {
  it('should be defined', () => {
    expect(ModalConfirmation).toBeDefined();
  });

  it('should have expected structure', () => {
    expect(ModalConfirmation).toBeTruthy();
  });
});
