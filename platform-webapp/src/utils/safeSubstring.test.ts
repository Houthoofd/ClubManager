import { safeSubstring } from './safeSubstring';

test('safeSubstring handles null and undefined', () => {
  expect(safeSubstring(null, 0, 5)).toBe('');
  expect(safeSubstring(undefined, 0, 5)).toBe('');
});

test('safeSubstring works with valid strings', () => {
  expect(safeSubstring('hello', 0, 2)).toBe('he');
  expect(safeSubstring('world', 1, 4)).toBe('orl');
});
