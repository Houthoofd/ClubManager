/**
 * Tests for utils.js
 *
 * Tests utility functions used by the test generator
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import {
  getProjectRoot,
  fileExists,
  dirExists,
  ensureDir,
  getFilesRecursively,
  shouldIgnoreFile,
  getRelativePath,
  getTestFilePath,
  colorize,
  toPascalCase,
  toCamelCase,
  getFileNameWithoutExt,
  getFileExtension,
  formatFileSize,
  createProgressBar,
  pluralize,
  truncate,
  getImportPath,
  parseArgs,
} from '../utils.js';

describe('getProjectRoot', () => {
  it('should return a valid path', () => {
    const root = getProjectRoot();
    expect(root).toBeDefined();
    expect(typeof root).toBe('string');
    expect(path.isAbsolute(root)).toBe(true);
  });

  it('should navigate up from scripts/generators/tests/', () => {
    const root = getProjectRoot();
    // Should end with front-end or ClubManager
    expect(root.endsWith('front-end') || root.endsWith('ClubManager')).toBe(true);
  });
});

describe('fileExists', () => {
  it('should return true for existing files', () => {
    const testFile = path.join(getProjectRoot(), 'package.json');
    expect(fileExists(testFile)).toBe(true);
  });

  it('should return false for non-existing files', () => {
    expect(fileExists('/path/to/non/existing/file.txt')).toBe(false);
  });

  it('should handle invalid paths gracefully', () => {
    expect(fileExists('')).toBe(false);
  });
});

describe('dirExists', () => {
  it('should return true for existing directories', () => {
    const root = getProjectRoot();
    expect(dirExists(root)).toBe(true);
  });

  it('should return false for non-existing directories', () => {
    expect(dirExists('/path/to/non/existing/dir')).toBe(false);
  });

  it('should return false for files (not directories)', () => {
    const testFile = path.join(getProjectRoot(), 'package.json');
    if (fileExists(testFile)) {
      expect(dirExists(testFile)).toBe(false);
    }
  });
});

describe('getFileNameWithoutExt', () => {
  it('should remove .ts extension', () => {
    expect(getFileNameWithoutExt('/path/to/file.ts')).toBe('file');
  });

  it('should remove .tsx extension', () => {
    expect(getFileNameWithoutExt('/path/to/Component.tsx')).toBe('Component');
  });

  it('should remove .js extension', () => {
    expect(getFileNameWithoutExt('/path/to/script.js')).toBe('script');
  });

  it('should handle paths without extension', () => {
    expect(getFileNameWithoutExt('/path/to/file')).toBe('file');
  });

  it('should handle files with multiple dots', () => {
    expect(getFileNameWithoutExt('/path/to/file.test.ts')).toBe('file.test');
  });
});

describe('getFileExtension', () => {
  it('should return .ts extension', () => {
    expect(getFileExtension('/path/to/file.ts')).toBe('.ts');
  });

  it('should return .tsx extension', () => {
    expect(getFileExtension('/path/to/Component.tsx')).toBe('.tsx');
  });

  it('should return empty string for files without extension', () => {
    expect(getFileExtension('/path/to/file')).toBe('');
  });

  it('should handle files with multiple dots', () => {
    expect(getFileExtension('/path/to/file.test.ts')).toBe('.ts');
  });
});

describe('toPascalCase', () => {
  it('should convert kebab-case to PascalCase', () => {
    expect(toPascalCase('my-component')).toBe('MyComponent');
  });

  it('should convert snake_case to PascalCase', () => {
    expect(toPascalCase('my_component')).toBe('MyComponent');
  });

  it('should handle already PascalCase', () => {
    expect(toPascalCase('MyComponent')).toBe('MyComponent');
  });

  it('should handle single word', () => {
    expect(toPascalCase('component')).toBe('Component');
  });

  it('should handle multiple separators', () => {
    expect(toPascalCase('my-super_component')).toBe('MySuperComponent');
  });
});

describe('toCamelCase', () => {
  it('should convert kebab-case to camelCase', () => {
    expect(toCamelCase('my-component')).toBe('myComponent');
  });

  it('should convert snake_case to camelCase', () => {
    expect(toCamelCase('my_component')).toBe('myComponent');
  });

  it('should handle already camelCase', () => {
    expect(toCamelCase('myComponent')).toBe('myComponent');
  });

  it('should handle single word', () => {
    expect(toCamelCase('component')).toBe('component');
  });

  it('should handle PascalCase', () => {
    expect(toCamelCase('MyComponent')).toBe('myComponent');
  });
});

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should round to 2 decimal places', () => {
    expect(formatFileSize(1234567)).toContain('1.18');
  });
});

describe('createProgressBar', () => {
  it('should create progress bar at 0%', () => {
    const bar = createProgressBar(0, 100, 40);
    expect(bar).toContain('0%');
    expect(bar).toContain('(0/100)');
  });

  it('should create progress bar at 50%', () => {
    const bar = createProgressBar(50, 100, 40);
    expect(bar).toContain('50%');
    expect(bar).toContain('(50/100)');
  });

  it('should create progress bar at 100%', () => {
    const bar = createProgressBar(100, 100, 40);
    expect(bar).toContain('100%');
    expect(bar).toContain('(100/100)');
  });

  it('should use default width', () => {
    const bar = createProgressBar(50, 100);
    expect(bar).toBeDefined();
    expect(bar.length).toBeGreaterThan(20);
  });

  it('should handle small numbers', () => {
    const bar = createProgressBar(1, 10);
    expect(bar).toContain('10%');
    expect(bar).toContain('(1/10)');
  });
});

describe('pluralize', () => {
  it('should return singular for 1', () => {
    expect(pluralize('file', 1)).toBe('file');
  });

  it('should return plural for 0', () => {
    expect(pluralize('file', 0)).toBe('files');
  });

  it('should return plural for 2', () => {
    expect(pluralize('file', 2)).toBe('files');
  });

  it('should return plural for large numbers', () => {
    expect(pluralize('test', 100)).toBe('tests');
  });

  it('should work with different words', () => {
    expect(pluralize('component', 1)).toBe('component');
    expect(pluralize('component', 5)).toBe('components');
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 50)).toBe('hello');
  });

  it('should truncate long strings', () => {
    const long = 'a'.repeat(100);
    const truncated = truncate(long, 50);
    expect(truncated.length).toBe(50);
    expect(truncated.endsWith('...')).toBe(true);
  });

  it('should use default max length', () => {
    const long = 'a'.repeat(100);
    const truncated = truncate(long);
    expect(truncated.length).toBeLessThanOrEqual(50);
  });

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('should handle one character over', () => {
    const text = 'hello!';
    const truncated = truncate(text, 5);
    expect(truncated).toBe('he...');
  });
});

describe('colorize', () => {
  it('should add color codes', () => {
    const colored = colorize('text', 'red');
    expect(colored).toContain('text');
  });

  it('should handle unknown colors', () => {
    const text = colorize('text', 'unknownColor');
    expect(text).toBe('text');
  });

  it('should handle all standard colors', () => {
    const colors = ['red', 'green', 'yellow', 'blue', 'cyan', 'magenta', 'white', 'gray'];
    colors.forEach(color => {
      const result = colorize('test', color);
      expect(result).toBeDefined();
    });
  });

  it('should handle bright colors', () => {
    const result = colorize('test', 'bright');
    expect(result).toBeDefined();
  });
});

describe('parseArgs', () => {
  it('should parse positional arguments', () => {
    const result = parseArgs(['file1.ts', 'file2.ts']);
    expect(result._).toEqual(['file1.ts', 'file2.ts']);
  });

  it('should parse boolean flags', () => {
    const result = parseArgs(['--verbose', '--dry-run']);
    expect(result.flags.verbose).toBe(true);
    expect(result.flags['dry-run']).toBe(true);
  });

  it('should parse flags with values', () => {
    const result = parseArgs(['--feature', 'auth', '--type', 'hook']);
    expect(result.flags.feature).toBe('auth');
    expect(result.flags.type).toBe('hook');
  });

  it('should parse short flags', () => {
    const result = parseArgs(['-v', '-n']);
    expect(result.flags.v).toBe(true);
    expect(result.flags.n).toBe(true);
  });

  it('should handle mixed arguments', () => {
    const result = parseArgs(['file.ts', '--verbose', 'other.ts', '--type', 'hook']);
    expect(result._).toEqual(['file.ts', 'other.ts']);
    expect(result.flags.verbose).toBe(true);
    expect(result.flags.type).toBe('hook');
  });

  it('should handle empty args', () => {
    const result = parseArgs([]);
    expect(result._).toEqual([]);
    expect(result.flags).toEqual({});
  });

  it('should handle flag at end', () => {
    const result = parseArgs(['--all']);
    expect(result.flags.all).toBe(true);
  });
});

describe('shouldIgnoreFile', () => {
  it('should ignore test files', () => {
    expect(shouldIgnoreFile('file.test.ts')).toBe(true);
    expect(shouldIgnoreFile('file.spec.ts')).toBe(true);
  });

  it('should ignore .d.ts files', () => {
    expect(shouldIgnoreFile('types.d.ts')).toBe(true);
  });

  it('should not ignore regular files', () => {
    expect(shouldIgnoreFile('useAuth.ts')).toBe(false);
    expect(shouldIgnoreFile('Component.tsx')).toBe(false);
  });

  it('should ignore config files', () => {
    expect(shouldIgnoreFile('vite.config.ts')).toBe(true);
    expect(shouldIgnoreFile('vitest.config.ts')).toBe(true);
  });

  it('should ignore index files', () => {
    expect(shouldIgnoreFile('index.ts')).toBe(true);
    expect(shouldIgnoreFile('index.tsx')).toBe(true);
  });
});

describe('getImportPath', () => {
  it('should calculate relative import path', () => {
    const testPath = '/project/src/features/auth/__tests__/hooks/useAuth.test.ts';
    const sourcePath = '/project/src/features/auth/hooks/useAuth.ts';

    const importPath = getImportPath(testPath, sourcePath);

    expect(importPath).toBeDefined();
    expect(importPath.startsWith('.')).toBe(true);
  });

  it('should remove file extension', () => {
    const testPath = '/project/src/__tests__/file.test.ts';
    const sourcePath = '/project/src/file.ts';

    const importPath = getImportPath(testPath, sourcePath);

    expect(importPath.endsWith('.ts')).toBe(false);
  });

  it('should normalize path separators', () => {
    const testPath = '/project/src/__tests__/file.test.ts';
    const sourcePath = '/project/src/file.ts';

    const importPath = getImportPath(testPath, sourcePath);

    expect(importPath.includes('\\')).toBe(false);
  });
});

describe('getTestFilePath', () => {
  it('should generate test path for hook', () => {
    const sourcePath = path.join(getProjectRoot(), 'src/features/auth/hooks/useAuth.ts');
    const testPath = getTestFilePath(sourcePath, 'hook');

    expect(testPath).toContain('__tests__');
    expect(testPath).toContain('hooks');
    expect(testPath).toContain('useAuth.test.ts');
  });

  it('should generate test path for component', () => {
    const sourcePath = path.join(getProjectRoot(), 'src/features/auth/components/AuthGuard.tsx');
    const testPath = getTestFilePath(sourcePath, 'component');

    expect(testPath).toContain('__tests__');
    expect(testPath).toContain('components');
    expect(testPath).toContain('AuthGuard.test.tsx');
  });

  it('should handle shared files', () => {
    const sourcePath = path.join(getProjectRoot(), 'src/shared/hooks/useToggle.ts');
    const testPath = getTestFilePath(sourcePath, 'hook');

    expect(testPath).toContain('shared');
    expect(testPath).toContain('__tests__');
  });

  it('should handle core files', () => {
    const sourcePath = path.join(getProjectRoot(), 'src/core/utils/format.ts');
    const testPath = getTestFilePath(sourcePath, 'util');

    expect(testPath).toContain('core');
    expect(testPath).toContain('__tests__');
  });
});

describe('getRelativePath', () => {
  it('should return relative path from project root', () => {
    const projectRoot = getProjectRoot();
    const filePath = path.join(projectRoot, 'src/features/auth/useAuth.ts');
    const relativePath = getRelativePath(filePath);

    expect(relativePath.startsWith('src')).toBe(true);
    expect(relativePath.includes('useAuth.ts')).toBe(true);
  });

  it('should handle paths with backslashes', () => {
    const projectRoot = getProjectRoot();
    const filePath = path.join(projectRoot, 'src', 'features', 'auth', 'useAuth.ts');
    const relativePath = getRelativePath(filePath);

    expect(relativePath).toBeDefined();
  });
});

describe('Integration tests', () => {
  it('should handle complete file path workflow', () => {
    const projectRoot = getProjectRoot();
    const sourcePath = path.join(projectRoot, 'src/features/auth/hooks/useAuth.ts');

    // Get relative path
    const relativePath = getRelativePath(sourcePath);
    expect(relativePath).toContain('src');

    // Get test file path
    const testPath = getTestFilePath(sourcePath, 'hook');
    expect(testPath).toContain('__tests__');

    // Get import path
    const importPath = getImportPath(testPath, sourcePath);
    expect(importPath).toBeDefined();
  });

  it('should handle name transformations', () => {
    const original = 'my-component-name';

    const pascal = toPascalCase(original);
    expect(pascal).toBe('MyComponentName');

    const camel = toCamelCase(original);
    expect(camel).toBe('myComponentName');
  });

  it('should handle file operations', () => {
    const testFile = path.join(getProjectRoot(), 'package.json');

    expect(fileExists(testFile)).toBe(true);
    expect(getFileExtension(testFile)).toBe('.json');
    expect(getFileNameWithoutExt(testFile)).toBe('package');
  });
});

describe('Edge cases and error handling', () => {
  it('should handle empty strings', () => {
    expect(toPascalCase('')).toBe('');
    expect(toCamelCase('')).toBe('');
    expect(truncate('')).toBe('');
  });

  it('should handle special characters in paths', () => {
    const fileName = 'file-with-special_chars.test.ts';
    expect(shouldIgnoreFile(fileName)).toBe(true);
  });

  it('should handle very long file names', () => {
    const longName = 'a'.repeat(200) + '.ts';
    const truncated = truncate(longName, 50);
    expect(truncated.length).toBe(50);
  });

  it('should handle numeric values in formatFileSize', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
    expect(formatFileSize(-100)).toContain('Bytes');
  });

  it('should handle edge cases in progress bar', () => {
    expect(createProgressBar(0, 0)).toBeDefined();
    expect(createProgressBar(100, 100)).toContain('100%');
  });
});
