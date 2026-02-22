/**
 * Tests for file-writer.js
 *
 * Comprehensive test suite for file writing and validation logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  writeTestFile,
  writeTestFiles,
  createTestDirectory,
  backupTestFile,
  writeSummaryFile,
  updateTestIndex,
  validateTestContent,
  formatTestContent,
  validateTestStructure,
} from '../file-writer.js';

// Mock fs module
vi.mock('fs');

// Mock utils
vi.mock('../utils.js', () => ({
  ensureDir: vi.fn(),
  fileExists: vi.fn(),
  logSuccess: vi.fn(),
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

import { ensureDir, fileExists, logSuccess, logWarning, logError } from '../utils.js';

describe('file-writer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('writeTestFile', () => {
    const testFilePath = '/path/to/test.test.ts';
    const testContent = 'import { describe } from "vitest";\n\ndescribe("test", () => {});';

    it('should write file successfully', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn();

      const result = writeTestFile(testFilePath, testContent);

      expect(result.success).toBe(true);
      expect(result.path).toBe(testFilePath);
      expect(result.size).toBe(testContent.length);
      expect(result.lines).toBe(testContent.split('\n').length);
      expect(fs.writeFileSync).toHaveBeenCalledWith(testFilePath, testContent, 'utf-8');
    });

    it('should create parent directory before writing', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn();

      writeTestFile(testFilePath, testContent);

      expect(ensureDir).toHaveBeenCalled();
    });

    it('should skip if file exists and overwrite is false', () => {
      fileExists.mockReturnValue(true);
      fs.writeFileSync = vi.fn();

      const result = writeTestFile(testFilePath, testContent, { overwrite: false });

      expect(result.success).toBe(false);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('File already exists');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should overwrite if file exists and overwrite is true', () => {
      fileExists.mockReturnValue(true);
      fs.writeFileSync = vi.fn();

      const result = writeTestFile(testFilePath, testContent, { overwrite: true });

      expect(result.success).toBe(true);
      expect(result.skipped).toBeUndefined();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should not write in dry run mode', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn();

      const result = writeTestFile(testFilePath, testContent, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.size).toBe(testContent.length);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should return error on write failure', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn(() => {
        throw new Error('Permission denied');
      });

      const result = writeTestFile(testFilePath, testContent);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
      expect(result.path).toBe(testFilePath);
    });

    it('should log success when file is written', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn();

      writeTestFile(testFilePath, testContent);

      expect(logSuccess).toHaveBeenCalledWith(expect.stringContaining('Created test file'));
    });

    it('should log warning when file is skipped', () => {
      fileExists.mockReturnValue(true);

      writeTestFile(testFilePath, testContent, { overwrite: false });

      expect(logWarning).toHaveBeenCalledWith(expect.stringContaining('already exists'));
    });

    it('should log error on failure', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn(() => {
        throw new Error('Disk full');
      });

      writeTestFile(testFilePath, testContent);

      expect(logError).toHaveBeenCalled();
    });

    it('should calculate correct line count', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn();
      const multiLineContent = 'line1\nline2\nline3\nline4\nline5';

      const result = writeTestFile(testFilePath, multiLineContent);

      expect(result.lines).toBe(5);
    });

    it('should handle empty content', () => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn();

      const result = writeTestFile(testFilePath, '');

      expect(result.success).toBe(true);
      expect(result.size).toBe(0);
      expect(result.lines).toBe(1);
    });
  });

  describe('writeTestFiles', () => {
    const testFiles = [
      { path: '/test1.test.ts', content: 'test1 content' },
      { path: '/test2.test.ts', content: 'test2 content' },
      { path: '/test3.test.ts', content: 'test3 content' },
    ];

    beforeEach(() => {
      fileExists.mockReturnValue(false);
      fs.writeFileSync = vi.fn();
    });

    it('should write multiple files successfully', () => {
      const results = writeTestFiles(testFiles);

      expect(results.total).toBe(3);
      expect(results.written).toBe(3);
      expect(results.skipped).toBe(0);
      expect(results.failed).toBe(0);
      expect(results.files).toHaveLength(3);
    });

    it('should track skipped files', () => {
      fileExists.mockReturnValue(true);

      const results = writeTestFiles(testFiles, { overwrite: false });

      expect(results.total).toBe(3);
      expect(results.written).toBe(0);
      expect(results.skipped).toBe(3);
      expect(results.failed).toBe(0);
    });

    it('should track failed files', () => {
      fs.writeFileSync = vi.fn(() => {
        throw new Error('Write error');
      });

      const results = writeTestFiles(testFiles);

      expect(results.total).toBe(3);
      expect(results.written).toBe(0);
      expect(results.skipped).toBe(0);
      expect(results.failed).toBe(3);
    });

    it('should handle mixed results', () => {
      fileExists
        .mockReturnValueOnce(false) // first file: new
        .mockReturnValueOnce(true)  // second file: exists
        .mockReturnValueOnce(false); // third file: new

      fs.writeFileSync = vi.fn()
        .mockImplementationOnce(() => {}) // first: success
        .mockImplementationOnce(() => { throw new Error('error'); }); // third: fail

      const results = writeTestFiles(testFiles, { overwrite: false });

      expect(results.total).toBe(3);
      expect(results.written).toBe(1);
      expect(results.skipped).toBe(1);
      expect(results.failed).toBe(1);
    });

    it('should handle empty array', () => {
      const results = writeTestFiles([]);

      expect(results.total).toBe(0);
      expect(results.written).toBe(0);
      expect(results.files).toHaveLength(0);
    });

    it('should respect dry run option', () => {
      const results = writeTestFiles(testFiles, { dryRun: true });

      expect(results.total).toBe(3);
      expect(results.skipped).toBe(3);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should include file details in results', () => {
      const results = writeTestFiles(testFiles);

      results.files.forEach((file, index) => {
        expect(file.path).toBe(testFiles[index].path);
      });
    });
  });

  describe('createTestDirectory', () => {
    beforeEach(() => {
      ensureDir.mockImplementation(() => {});
    });

    it('should create main test directory', () => {
      const baseDir = '/src/features/users';

      const result = createTestDirectory(baseDir);

      expect(result.success).toBe(true);
      expect(result.path).toBe('/src/features/users/__tests__');
      expect(ensureDir).toHaveBeenCalled();
    });

    it('should create subdirectories', () => {
      const baseDir = '/src/features/users';
      const subdirs = ['hooks', 'components', 'utils'];

      const result = createTestDirectory(baseDir, subdirs);

      expect(result.success).toBe(true);
      expect(result.subdirs).toEqual(subdirs);
      expect(ensureDir).toHaveBeenCalledTimes(4); // main + 3 subdirs
    });

    it('should handle errors', () => {
      ensureDir.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = createTestDirectory('/test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should create nested subdirectories', () => {
      const baseDir = '/src/features/shop';
      const subdirs = ['hooks/cart', 'components/checkout'];

      const result = createTestDirectory(baseDir, subdirs);

      expect(result.success).toBe(true);
      expect(ensureDir).toHaveBeenCalled();
    });

    it('should handle empty subdirectories array', () => {
      const result = createTestDirectory('/test', []);

      expect(result.success).toBe(true);
      expect(ensureDir).toHaveBeenCalledTimes(1);
    });
  });

  describe('backupTestFile', () => {
    const testFilePath = '/test.test.ts';
    const testContent = 'original content';

    it('should create backup of existing file', () => {
      fileExists.mockReturnValue(true);
      fs.readFileSync = vi.fn(() => testContent);
      fs.writeFileSync = vi.fn();

      const result = backupTestFile(testFilePath);

      expect(result.success).toBe(true);
      expect(result.backed).toBe(true);
      expect(result.backupPath).toBe(`${testFilePath}.backup`);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        `${testFilePath}.backup`,
        testContent,
        'utf-8'
      );
    });

    it('should skip backup if file does not exist', () => {
      fileExists.mockReturnValue(false);
      fs.readFileSync = vi.fn();
      fs.writeFileSync = vi.fn();

      const result = backupTestFile(testFilePath);

      expect(result.success).toBe(true);
      expect(result.backed).toBe(false);
      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    it('should handle backup errors', () => {
      fileExists.mockReturnValue(true);
      fs.readFileSync = vi.fn(() => {
        throw new Error('Read error');
      });

      const result = backupTestFile(testFilePath);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Read error');
    });

    it('should log success on backup', () => {
      fileExists.mockReturnValue(true);
      fs.readFileSync = vi.fn(() => testContent);
      fs.writeFileSync = vi.fn();

      backupTestFile(testFilePath);

      expect(logSuccess).toHaveBeenCalledWith(expect.stringContaining('Backed up'));
    });

    it('should handle write errors during backup', () => {
      fileExists.mockReturnValue(true);
      fs.readFileSync = vi.fn(() => testContent);
      fs.writeFileSync = vi.fn(() => {
        throw new Error('Write error');
      });

      const result = backupTestFile(testFilePath);

      expect(result.success).toBe(false);
    });
  });

  describe('writeSummaryFile', () => {
    const generatedTests = [
      { sourcePath: '/src/a.ts', testPath: '/src/__tests__/a.test.ts', type: 'hook', lines: 100 },
      { sourcePath: '/src/b.ts', testPath: '/src/__tests__/b.test.ts', type: 'component', lines: 150 },
      { sourcePath: '/src/c.ts', testPath: '/src/__tests__/c.test.ts', type: 'hook', lines: 80 },
    ];

    beforeEach(() => {
      fs.writeFileSync = vi.fn();
    });

    it('should write summary JSON file', () => {
      const outputPath = '/summary.json';

      const result = writeSummaryFile(generatedTests, outputPath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(outputPath);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        outputPath,
        expect.any(String),
        'utf-8'
      );
    });

    it('should include test counts by type', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        const summary = JSON.parse(content);
        expect(summary.byType.hook).toBe(2);
        expect(summary.byType.component).toBe(1);
      });

      writeSummaryFile(generatedTests, '/summary.json');
    });

    it('should include total count', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        const summary = JSON.parse(content);
        expect(summary.total).toBe(3);
      });

      writeSummaryFile(generatedTests, '/summary.json');
    });

    it('should include generation timestamp', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        const summary = JSON.parse(content);
        expect(summary.generated).toBeDefined();
        expect(new Date(summary.generated)).toBeInstanceOf(Date);
      });

      writeSummaryFile(generatedTests, '/summary.json');
    });

    it('should include file details', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        const summary = JSON.parse(content);
        expect(summary.files).toHaveLength(3);
        expect(summary.files[0]).toHaveProperty('source');
        expect(summary.files[0]).toHaveProperty('test');
        expect(summary.files[0]).toHaveProperty('type');
        expect(summary.files[0]).toHaveProperty('lines');
      });

      writeSummaryFile(generatedTests, '/summary.json');
    });

    it('should handle write errors', () => {
      fs.writeFileSync = vi.fn(() => {
        throw new Error('Disk full');
      });

      const result = writeSummaryFile(generatedTests, '/summary.json');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Disk full');
    });

    it('should handle empty test array', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        const summary = JSON.parse(content);
        expect(summary.total).toBe(0);
        expect(summary.files).toHaveLength(0);
        expect(summary.byType).toEqual({});
      });

      writeSummaryFile([], '/summary.json');
    });

    it('should format JSON with proper indentation', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        expect(content).toContain('\n');
        expect(content).toContain('  '); // 2-space indentation
      });

      writeSummaryFile(generatedTests, '/summary.json');
    });
  });

  describe('updateTestIndex', () => {
    const testDir = '/src/features/users';
    const testFiles = [
      { path: '/src/features/users/__tests__/hooks/useUsers.test.ts' },
      { path: '/src/features/users/__tests__/components/UserCard.test.tsx' },
    ];

    beforeEach(() => {
      fs.writeFileSync = vi.fn();
    });

    it('should create index file with imports', () => {
      const result = updateTestIndex(testDir, testFiles);

      expect(result.success).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should include header comment', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        expect(content).toContain('Auto-generated test index');
      });

      updateTestIndex(testDir, testFiles);
    });

    it('should include imports for all test files', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        expect(content).toContain("import './");
        testFiles.forEach(() => {
          expect(content.match(/import/g).length).toBeGreaterThan(0);
        });
      });

      updateTestIndex(testDir, testFiles);
    });

    it('should use relative paths', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        expect(content).toContain('./hooks/useUsers.test');
        expect(content).toContain('./components/UserCard.test');
      });

      updateTestIndex(testDir, testFiles);
    });

    it('should handle write errors', () => {
      fs.writeFileSync = vi.fn(() => {
        throw new Error('Permission denied');
      });

      const result = updateTestIndex(testDir, testFiles);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should normalize path separators', () => {
      fs.writeFileSync = vi.fn((path, content) => {
        expect(content).not.toContain('\\');
        expect(content).toContain('/');
      });

      updateTestIndex(testDir, testFiles);
    });
  });

  describe('validateTestContent', () => {
    it('should validate correct test content', () => {
      const content = `
import { describe, it, expect } from 'vitest';

describe('test', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
      `;

      const validation = validateTestContent(content);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect missing describe block', () => {
      const content = `
import { it, expect } from 'vitest';

it('should work', () => {
  expect(true).toBe(true);
});
      `;

      const validation = validateTestContent(content);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing describe block');
    });

    it('should detect missing test cases', () => {
      const content = `
import { describe, expect } from 'vitest';

describe('test', () => {
  // No tests
});
      `;

      const validation = validateTestContent(content);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing test cases (it/test)');
    });

    it('should detect missing assertions', () => {
      const content = `
import { describe, it } from 'vitest';

describe('test', () => {
  it('should work', () => {
    // No expect
  });
});
      `;

      const validation = validateTestContent(content);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing assertions (expect)');
    });

    it('should detect missing imports', () => {
      const content = `
describe('test', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
      `;

      const validation = validateTestContent(content);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing imports');
    });

    it('should count TODO comments', () => {
      const content = `
import { describe, it, expect } from 'vitest';

describe('test', () => {
  it('should work', () => {
    // TODO: Implement test
    expect(true).toBe(true);
  });

  it('another test', () => {
    // TODO: Add more assertions
    expect(true).toBe(true);
  });
});
      `;

      const validation = validateTestContent(content);

      expect(validation.todoCount).toBe(2);
      expect(validation.warnings).toContain('2 TODO items found');
    });

    it('should accept test() instead of it()', () => {
      const content = `
import { describe, test, expect } from 'vitest';

describe('test', () => {
  test('should work', () => {
    expect(true).toBe(true);
  });
});
      `;

      const validation = validateTestContent(content);

      expect(validation.valid).toBe(true);
    });

    it('should return empty warnings when no TODOs', () => {
      const content = `
import { describe, it, expect } from 'vitest';

describe('test', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
      `;

      const validation = validateTestContent(content);

      expect(validation.warnings).toHaveLength(0);
      expect(validation.todoCount).toBe(0);
    });
  });

  describe('formatTestContent', () => {
    it('should add blank line after imports', () => {
      const content = `import { describe } from 'vitest';
describe('test', () => {});`;

      const formatted = formatTestContent(content);

      expect(formatted).toContain("'vitest';\n\ndescribe");
    });

    it('should add blank line between describe blocks', () => {
      const content = `describe('test1', () => {});
describe('test2', () => {});`;

      const formatted = formatTestContent(content);

      expect(formatted).toContain('});\n\ndescribe');
    });

    it('should remove multiple consecutive blank lines', () => {
      const content = `line1\n\n\n\nline2`;

      const formatted = formatTestContent(content);

      expect(formatted).toBe('line1\n\nline2\n');
    });

    it('should ensure single newline at end', () => {
      const content = 'content';

      const formatted = formatTestContent(content);

      expect(formatted).toBe('content\n');
      expect(formatted.endsWith('\n')).toBe(true);
      expect(formatted.endsWith('\n\n')).toBe(false);
    });

    it('should handle already formatted content', () => {
      const content = `import { describe } from 'vitest';

describe('test', () => {});
`;

      const formatted = formatTestContent(content);

      expect(formatted).toBe(content);
    });

    it('should handle empty content', () => {
      const formatted = formatTestContent('');

      expect(formatted).toBe('\n');
    });
  });

  describe('validateTestStructure', () => {
    const projectRoot = '/project';

    beforeEach(() => {
      fileExists.mockReturnValue(true);
      fs.readFileSync = vi.fn(() => JSON.stringify({
        scripts: { test: 'vitest' }
      }));
    });

    it('should validate complete project structure', () => {
      const validation = validateTestStructure(projectRoot);

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it('should detect missing vitest config', () => {
      fileExists.mockImplementation((path) => {
        return !path.includes('vitest.config.ts');
      });

      const validation = validateTestStructure(projectRoot);

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing vitest.config.ts');
    });

    it('should warn about missing setup file', () => {
      fileExists.mockImplementation((path) => {
        return !path.includes('setup.ts');
      });

      const validation = validateTestStructure(projectRoot);

      expect(validation.warnings).toContain('No test setup file found at src/test/setup.ts');
    });

    it('should warn about missing test script', () => {
      fs.readFileSync = vi.fn(() => JSON.stringify({
        scripts: {}
      }));

      const validation = validateTestStructure(projectRoot);

      expect(validation.warnings).toContain('No test script in package.json');
    });

    it('should handle missing package.json', () => {
      fileExists.mockImplementation((path) => {
        return !path.includes('package.json');
      });

      const validation = validateTestStructure(projectRoot);

      expect(validation.valid).toBe(true);
    });

    it('should return both issues and warnings', () => {
      fileExists.mockImplementation((path) => {
        if (path.includes('vitest.config.ts')) return false;
        if (path.includes('setup.ts')) return false;
        return true;
      });

      const validation = validateTestStructure(projectRoot);

      expect(validation.valid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });
  });
});
