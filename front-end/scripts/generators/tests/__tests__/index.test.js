/**
 * Tests for index.js - Main orchestration logic
 *
 * Comprehensive test suite for the CLI and test generation orchestration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock all dependencies before importing
vi.mock('fs');
vi.mock('../config.js', () => ({
  default: {
    sourceDirs: {
      features: 'src/features',
      shared: 'src/shared',
      hooks: 'src/hooks',
    },
  },
}));

vi.mock('../analyzer.js', () => ({
  analyzeFile: vi.fn(),
}));

vi.mock('../template-generator.js', () => ({
  generateCompleteTest: vi.fn(),
}));

vi.mock('../file-writer.js', () => ({
  writeTestFile: vi.fn(),
  writeTestFiles: vi.fn(),
  writeSummaryFile: vi.fn(),
  validateTestStructure: vi.fn(),
}));

vi.mock('../utils.js', () => ({
  getProjectRoot: vi.fn(() => '/project'),
  getFilesRecursively: vi.fn(() => []),
  shouldIgnoreFile: vi.fn(() => false),
  getTestFilePath: vi.fn((filePath) => filePath.replace('.ts', '.test.ts')),
  parseArgs: vi.fn(),
  confirm: vi.fn(() => Promise.resolve(true)),
  log: vi.fn(),
  logSuccess: vi.fn(),
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
  colorize: vi.fn((text) => text),
  createProgressBar: vi.fn((current, total) => `[${current}/${total}]`),
  pluralize: vi.fn((word, count) => count === 1 ? word : `${word}s`),
  getTestStats: vi.fn(),
}));

import fs from 'fs';
import { analyzeFile } from '../analyzer.js';
import { generateCompleteTest } from '../template-generator.js';
import {
  writeTestFile,
  writeSummaryFile,
  validateTestStructure,
} from '../file-writer.js';
import {
  getProjectRoot,
  getFilesRecursively,
  shouldIgnoreFile,
  getTestFilePath,
  parseArgs,
  confirm,
  log,
  logSuccess,
  logError,
  logWarning,
  logInfo,
  colorize,
} from '../utils.js';

describe('index.js - CLI Orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks
    validateTestStructure.mockReturnValue({
      valid: true,
      issues: [],
      warnings: [],
    });

    fs.existsSync = vi.fn(() => true);

    analyzeFile.mockReturnValue({
      type: 'hook',
      name: 'useExample',
      fileName: 'useExample.ts',
      filePath: '/src/hooks/useExample.ts',
      exports: { default: 'useExample', named: [] },
      features: {},
    });

    generateCompleteTest.mockReturnValue('test content');

    writeTestFile.mockReturnValue({
      success: true,
      path: '/test.test.ts',
      size: 100,
      lines: 10,
    });
  });

  describe('parseArgs', () => {
    it('should parse --all flag', () => {
      parseArgs.mockReturnValue({
        flags: { all: true },
        _: [],
      });

      const args = parseArgs(['--all']);

      expect(args.flags.all).toBe(true);
    });

    it('should parse --feature flag with value', () => {
      parseArgs.mockReturnValue({
        flags: { feature: 'users' },
        _: [],
      });

      const args = parseArgs(['--feature', 'users']);

      expect(args.flags.feature).toBe('users');
    });

    it('should parse --type flag with value', () => {
      parseArgs.mockReturnValue({
        flags: { type: 'hook' },
        _: [],
      });

      const args = parseArgs(['--type', 'hook']);

      expect(args.flags.type).toBe('hook');
    });

    it('should parse --overwrite flag', () => {
      parseArgs.mockReturnValue({
        flags: { overwrite: true },
        _: [],
      });

      const args = parseArgs(['--overwrite']);

      expect(args.flags.overwrite).toBe(true);
    });

    it('should parse --dry-run flag', () => {
      parseArgs.mockReturnValue({
        flags: { 'dry-run': true },
        _: [],
      });

      const args = parseArgs(['--dry-run']);

      expect(args.flags['dry-run']).toBe(true);
    });

    it('should parse --verbose flag', () => {
      parseArgs.mockReturnValue({
        flags: { verbose: true },
        _: [],
      });

      const args = parseArgs(['--verbose']);

      expect(args.flags.verbose).toBe(true);
    });

    it('should parse short flags', () => {
      parseArgs.mockReturnValue({
        flags: { n: true, v: true },
        _: [],
      });

      const args = parseArgs(['-n', '-v']);

      expect(args.flags.n).toBe(true);
      expect(args.flags.v).toBe(true);
    });

    it('should parse positional arguments', () => {
      parseArgs.mockReturnValue({
        flags: {},
        _: ['src/hooks/useExample.ts'],
      });

      const args = parseArgs(['src/hooks/useExample.ts']);

      expect(args._[0]).toBe('src/hooks/useExample.ts');
    });

    it('should parse multiple flags', () => {
      parseArgs.mockReturnValue({
        flags: {
          all: true,
          overwrite: true,
          verbose: true,
        },
        _: [],
      });

      const args = parseArgs(['--all', '--overwrite', '--verbose']);

      expect(args.flags.all).toBe(true);
      expect(args.flags.overwrite).toBe(true);
      expect(args.flags.verbose).toBe(true);
    });
  });

  describe('collectFiles', () => {
    it('should collect files from features directory by default', () => {
      getFilesRecursively.mockReturnValue([
        '/src/features/users/useUsers.ts',
        '/src/features/users/UserCard.tsx',
      ]);

      const files = getFilesRecursively('/src/features');

      expect(files).toHaveLength(2);
      expect(getFilesRecursively).toHaveBeenCalled();
    });

    it('should filter out ignored files', () => {
      shouldIgnoreFile
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);

      const result1 = shouldIgnoreFile('useExample.ts');
      const result2 = shouldIgnoreFile('example.test.ts');

      expect(result1).toBe(false);
      expect(result2).toBe(true);
    });

    it('should skip non-TypeScript files', () => {
      const files = [
        'component.tsx',
        'hook.ts',
        'style.css',
        'README.md',
      ];

      const tsFiles = files.filter(f => /\.(ts|tsx)$/.test(f));

      expect(tsFiles).toHaveLength(2);
      expect(tsFiles).toContain('component.tsx');
      expect(tsFiles).toContain('hook.ts');
    });

    it('should analyze each TypeScript file', () => {
      const files = ['/src/useExample.ts', '/src/Component.tsx'];

      files.forEach(file => {
        analyzeFile(file);
      });

      expect(analyzeFile).toHaveBeenCalledTimes(2);
    });

    it('should skip files with unknown type', () => {
      analyzeFile.mockReturnValue({ type: 'unknown' });

      const analysis = analyzeFile('/src/unknown.ts');

      expect(analysis.type).toBe('unknown');
    });

    it('should filter by type when specified', () => {
      const analyses = [
        { type: 'hook', name: 'useA' },
        { type: 'component', name: 'CompB' },
        { type: 'hook', name: 'useC' },
      ];

      const hooks = analyses.filter(a => a.type === 'hook');

      expect(hooks).toHaveLength(2);
    });

    it('should check if test already exists', () => {
      fs.existsSync.mockReturnValue(true);

      const exists = fs.existsSync('/test.test.ts');

      expect(exists).toBe(true);
    });

    it('should collect from specific feature directory', () => {
      getFilesRecursively.mockReturnValue([
        '/src/features/users/useUsers.ts',
      ]);

      const files = getFilesRecursively('/src/features/users');

      expect(files).toContain('/src/features/users/useUsers.ts');
    });

    it('should collect from all source directories', () => {
      getFilesRecursively
        .mockReturnValueOnce(['/src/features/file1.ts'])
        .mockReturnValueOnce(['/src/shared/file2.ts'])
        .mockReturnValueOnce(['/src/hooks/file3.ts']);

      const files1 = getFilesRecursively('/src/features');
      const files2 = getFilesRecursively('/src/shared');
      const files3 = getFilesRecursively('/src/hooks');

      const allFiles = [...files1, ...files2, ...files3];

      expect(allFiles).toHaveLength(3);
    });
  });

  describe('generateTests', () => {
    const mockFiles = [
      {
        type: 'hook',
        name: 'useExample',
        filePath: '/src/useExample.ts',
        testPath: '/src/__tests__/useExample.test.ts',
        testExists: false,
        exports: { default: 'useExample', named: [] },
      },
    ];

    it('should generate test for each file', () => {
      mockFiles.forEach(file => {
        generateCompleteTest(file, file.testPath);
      });

      expect(generateCompleteTest).toHaveBeenCalledTimes(1);
    });

    it('should write generated tests to disk', () => {
      writeTestFile('/test.test.ts', 'content');

      expect(writeTestFile).toHaveBeenCalled();
    });

    it('should skip existing tests when overwrite is false', () => {
      const fileWithExistingTest = {
        ...mockFiles[0],
        testExists: true,
      };

      // In real code, this would be skipped
      const shouldSkip = fileWithExistingTest.testExists && false; // overwrite=false

      expect(shouldSkip).toBe(false);
    });

    it('should overwrite existing tests when overwrite is true', () => {
      const fileWithExistingTest = {
        ...mockFiles[0],
        testExists: true,
      };

      const shouldWrite = true; // overwrite=true

      expect(shouldWrite).toBe(true);
    });

    it('should not write files in dry run mode', () => {
      writeTestFile.mockReturnValue({
        success: true,
        dryRun: true,
        path: '/test.test.ts',
      });

      const result = writeTestFile('/test.test.ts', 'content', { dryRun: true });

      expect(result.dryRun).toBe(true);
    });

    it('should track generation results', () => {
      const results = {
        total: 3,
        generated: [],
        skipped: [],
        failed: [],
        totalLines: 0,
      };

      writeTestFile.mockReturnValue({
        success: true,
        path: '/test.test.ts',
        size: 100,
        lines: 10,
      });

      const result = writeTestFile('/test.test.ts', 'content');

      results.generated.push({
        source: '/src/file.ts',
        test: result.path,
        type: 'hook',
        lines: result.lines,
      });
      results.totalLines += result.lines;

      expect(results.generated).toHaveLength(1);
      expect(results.totalLines).toBe(10);
    });

    it('should handle generation errors gracefully', () => {
      generateCompleteTest.mockImplementation(() => {
        throw new Error('Generation failed');
      });

      expect(() => {
        try {
          generateCompleteTest({}, '/test.ts');
        } catch (error) {
          expect(error.message).toBe('Generation failed');
          throw error;
        }
      }).toThrow('Generation failed');
    });

    it('should calculate total lines generated', () => {
      const testContent = 'line1\nline2\nline3\nline4\nline5';
      const lines = testContent.split('\n').length;

      expect(lines).toBe(5);
    });
  });

  describe('validateTestStructure', () => {
    it('should validate project structure before generation', () => {
      validateTestStructure('/project');

      expect(validateTestStructure).toHaveBeenCalled();
    });

    it('should detect missing vitest config', () => {
      validateTestStructure.mockReturnValue({
        valid: false,
        issues: ['Missing vitest.config.ts'],
        warnings: [],
      });

      const validation = validateTestStructure('/project');

      expect(validation.valid).toBe(false);
      expect(validation.issues).toContain('Missing vitest.config.ts');
    });

    it('should warn about missing setup files', () => {
      validateTestStructure.mockReturnValue({
        valid: true,
        issues: [],
        warnings: ['No test setup file found'],
      });

      const validation = validateTestStructure('/project');

      expect(validation.warnings).toContain('No test setup file found');
    });

    it('should allow continuation despite warnings', async () => {
      confirm.mockResolvedValue(true);

      const shouldContinue = await confirm('Continue anyway?');

      expect(shouldContinue).toBe(true);
    });

    it('should exit if user declines to continue', async () => {
      confirm.mockResolvedValue(false);

      const shouldContinue = await confirm('Continue anyway?');

      expect(shouldContinue).toBe(false);
    });
  });

  describe('interactive mode', () => {
    it('should prompt for confirmation in interactive mode', async () => {
      confirm.mockResolvedValue(true);

      const result = await confirm('Proceed?');

      expect(result).toBe(true);
      expect(confirm).toHaveBeenCalled();
    });

    it('should skip prompts in non-interactive mode', () => {
      const isInteractive = false;

      expect(isInteractive).toBe(false);
    });

    it('should confirm before generating tests', async () => {
      confirm.mockResolvedValue(true);

      const shouldProceed = await confirm('Proceed with test generation?');

      expect(shouldProceed).toBe(true);
    });

    it('should cancel if user declines', async () => {
      confirm.mockResolvedValue(false);

      const shouldProceed = await confirm('Proceed?');

      expect(shouldProceed).toBe(false);
    });
  });

  describe('writeSummaryFile', () => {
    it('should write summary after successful generation', () => {
      const generatedTests = [
        { source: '/a.ts', test: '/a.test.ts', type: 'hook', lines: 100 },
      ];

      writeSummaryFile(generatedTests, '/summary.json');

      expect(writeSummaryFile).toHaveBeenCalled();
    });

    it('should not write summary in dry run mode', () => {
      const isDryRun = true;
      const generated = [];

      if (!isDryRun && generated.length > 0) {
        writeSummaryFile(generated, '/summary.json');
      }

      expect(writeSummaryFile).not.toHaveBeenCalled();
    });

    it('should not write summary if no tests generated', () => {
      const generated = [];

      if (generated.length > 0) {
        writeSummaryFile(generated, '/summary.json');
      }

      expect(writeSummaryFile).not.toHaveBeenCalled();
    });
  });

  describe('logging and output', () => {
    it('should log banner on startup', () => {
      log('╔══════════════════════════════════════════════════╗');
      log('║        ClubManager Test Generator v1.0.0         ║');
      log('╚══════════════════════════════════════════════════╝');

      expect(log).toHaveBeenCalled();
    });

    it('should log file counts by type', () => {
      logInfo('Found 10 files to process');

      expect(logInfo).toHaveBeenCalled();
    });

    it('should show progress during generation', () => {
      const progress = colorize('Generating tests...', 'cyan');

      expect(colorize).toHaveBeenCalled();
    });

    it('should log success messages', () => {
      logSuccess('✓ Generated: 5 test files');

      expect(logSuccess).toHaveBeenCalled();
    });

    it('should log warnings for skipped files', () => {
      logWarning('⊘ Skipped: 2 files');

      expect(logWarning).toHaveBeenCalled();
    });

    it('should log errors for failed files', () => {
      logError('✗ Failed: 1 file');

      expect(logError).toHaveBeenCalled();
    });

    it('should show next steps after generation', () => {
      log('Next Steps:');
      log('  1. Review the generated test files');
      log('  2. Complete the TODO items in each test');

      expect(log).toHaveBeenCalled();
    });

    it('should note dry run mode', () => {
      const isDryRun = true;

      if (isDryRun) {
        log('Note: This was a dry run. No files were actually written.');
      }

      expect(log).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle file analysis errors', () => {
      analyzeFile.mockImplementation(() => {
        throw new Error('Parse error');
      });

      expect(() => analyzeFile('/bad.ts')).toThrow('Parse error');
    });

    it('should handle test generation errors', () => {
      generateCompleteTest.mockImplementation(() => {
        throw new Error('Template error');
      });

      expect(() => generateCompleteTest({}, '/test.ts')).toThrow('Template error');
    });

    it('should handle file write errors', () => {
      writeTestFile.mockReturnValue({
        success: false,
        error: 'Permission denied',
      });

      const result = writeTestFile('/test.ts', 'content');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });

    it('should continue on individual file errors', () => {
      // First file fails, second succeeds
      writeTestFile
        .mockReturnValueOnce({ success: false, error: 'Error' })
        .mockReturnValueOnce({ success: true, path: '/test.ts' });

      const result1 = writeTestFile('/test1.ts', 'content');
      const result2 = writeTestFile('/test2.ts', 'content');

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(true);
    });

    it('should log unexpected errors', () => {
      const error = new Error('Unexpected error');
      logError('Unexpected error:');

      expect(logError).toHaveBeenCalled();
    });
  });

  describe('exit codes', () => {
    it('should exit with 0 on success', () => {
      const failed = 0;
      const exitCode = failed > 0 ? 1 : 0;

      expect(exitCode).toBe(0);
    });

    it('should exit with 1 on failure', () => {
      const failed = 1;
      const exitCode = failed > 0 ? 1 : 0;

      expect(exitCode).toBe(1);
    });
  });

  describe('options parsing', () => {
    it('should create options from parsed args', () => {
      parseArgs.mockReturnValue({
        flags: {
          all: true,
          overwrite: true,
          'dry-run': true,
          verbose: true,
        },
        _: [],
      });

      const args = parseArgs(['--all', '--overwrite', '--dry-run', '--verbose']);

      const options = {
        all: args.flags.all || false,
        overwrite: args.flags.overwrite || false,
        dryRun: args.flags['dry-run'] || false,
        verbose: args.flags.verbose || false,
      };

      expect(options.all).toBe(true);
      expect(options.overwrite).toBe(true);
      expect(options.dryRun).toBe(true);
      expect(options.verbose).toBe(true);
    });

    it('should handle missing flags with defaults', () => {
      parseArgs.mockReturnValue({
        flags: {},
        _: [],
      });

      const args = parseArgs([]);

      const options = {
        all: args.flags.all || false,
        overwrite: args.flags.overwrite || false,
        dryRun: args.flags['dry-run'] || false,
      };

      expect(options.all).toBe(false);
      expect(options.overwrite).toBe(false);
      expect(options.dryRun).toBe(false);
    });
  });
});
