/**
 * File writer - Writes generated test files to disk
 */

import fs from 'fs';
import path from 'path';
import { ensureDir, fileExists, logSuccess, logWarning, logError } from './utils.js';

/**
 * Write a test file to disk
 */
export function writeTestFile(testFilePath, content, options = {}) {
  const { overwrite = false, dryRun = false } = options;

  try {
    // Check if file already exists
    if (fileExists(testFilePath) && !overwrite) {
      logWarning(`Test file already exists: ${testFilePath}`);
      return {
        success: false,
        skipped: true,
        reason: 'File already exists',
        path: testFilePath,
      };
    }

    // Dry run - don't actually write
    if (dryRun) {
      logSuccess(`[DRY RUN] Would create: ${testFilePath}`);
      return {
        success: true,
        dryRun: true,
        path: testFilePath,
        size: content.length,
      };
    }

    // Ensure directory exists
    const dir = path.dirname(testFilePath);
    ensureDir(dir);

    // Write file
    fs.writeFileSync(testFilePath, content, 'utf-8');

    logSuccess(`Created test file: ${testFilePath}`);

    return {
      success: true,
      path: testFilePath,
      size: content.length,
      lines: content.split('\n').length,
    };
  } catch (error) {
    logError(`Failed to write test file: ${testFilePath}`);
    logError(error.message);

    return {
      success: false,
      error: error.message,
      path: testFilePath,
    };
  }
}

/**
 * Write multiple test files
 */
export function writeTestFiles(testFiles, options = {}) {
  const results = {
    total: testFiles.length,
    written: 0,
    skipped: 0,
    failed: 0,
    files: [],
  };

  testFiles.forEach((testFile) => {
    const result = writeTestFile(
      testFile.path,
      testFile.content,
      options
    );

    results.files.push(result);

    if (result.success) {
      if (result.dryRun || result.skipped) {
        results.skipped++;
      } else {
        results.written++;
      }
    } else {
      results.failed++;
    }
  });

  return results;
}

/**
 * Create test directory structure
 */
export function createTestDirectory(baseDir, subdirs = []) {
  const testDir = path.join(baseDir, '__tests__');

  try {
    // Create main __tests__ directory
    ensureDir(testDir);

    // Create subdirectories (hooks, utils, components, etc.)
    subdirs.forEach((subdir) => {
      const subdirPath = path.join(testDir, subdir);
      ensureDir(subdirPath);
    });

    return {
      success: true,
      path: testDir,
      subdirs,
    };
  } catch (error) {
    logError(`Failed to create test directory: ${testDir}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Backup existing test file before overwriting
 */
export function backupTestFile(testFilePath) {
  if (!fileExists(testFilePath)) {
    return { success: true, backed: false };
  }

  try {
    const backupPath = `${testFilePath}.backup`;
    const content = fs.readFileSync(testFilePath, 'utf-8');
    fs.writeFileSync(backupPath, content, 'utf-8');

    logSuccess(`Backed up existing file to: ${backupPath}`);

    return {
      success: true,
      backed: true,
      backupPath,
    };
  } catch (error) {
    logError(`Failed to backup file: ${testFilePath}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate a summary file of all generated tests
 */
export function writeSummaryFile(generatedTests, outputPath) {
  const summary = {
    generated: new Date().toISOString(),
    total: generatedTests.length,
    byType: {},
    files: generatedTests.map((test) => ({
      source: test.sourcePath,
      test: test.testPath,
      type: test.type,
      lines: test.lines,
    })),
  };

  // Count by type
  generatedTests.forEach((test) => {
    summary.byType[test.type] = (summary.byType[test.type] || 0) + 1;
  });

  try {
    const content = JSON.stringify(summary, null, 2);
    fs.writeFileSync(outputPath, content, 'utf-8');

    logSuccess(`Summary written to: ${outputPath}`);

    return {
      success: true,
      path: outputPath,
    };
  } catch (error) {
    logError(`Failed to write summary: ${outputPath}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Append to a test index file (for importing all tests)
 */
export function updateTestIndex(testDir, testFiles) {
  const indexPath = path.join(testDir, '__tests__', 'index.ts');

  try {
    let content = '';

    // Add header
    content += '/**\n';
    content += ' * Auto-generated test index\n';
    content += ' * This file imports all test files for coverage\n';
    content += ' */\n\n';

    // Add imports
    testFiles.forEach((file) => {
      const relativePath = path
        .relative(path.dirname(indexPath), file.path)
        .replace(/\\/g, '/')
        .replace(/\.test\.(ts|tsx)$/, '.test');

      content += `import './${relativePath}';\n`;
    });

    fs.writeFileSync(indexPath, content, 'utf-8');

    logSuccess(`Updated test index: ${indexPath}`);

    return {
      success: true,
      path: indexPath,
    };
  } catch (error) {
    logError(`Failed to update test index: ${indexPath}`);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Validate test file content before writing
 */
export function validateTestContent(content) {
  const issues = [];

  // Check for basic structure
  if (!content.includes('describe')) {
    issues.push('Missing describe block');
  }

  if (!content.includes('it(') && !content.includes('test(')) {
    issues.push('Missing test cases (it/test)');
  }

  if (!content.includes('expect')) {
    issues.push('Missing assertions (expect)');
  }

  // Check for imports
  if (!content.includes('import')) {
    issues.push('Missing imports');
  }

  // Check for TODO comments (warning, not error)
  const todoCount = (content.match(/TODO:/g) || []).length;

  return {
    valid: issues.length === 0,
    issues,
    warnings: todoCount > 0 ? [`${todoCount} TODO items found`] : [],
    todoCount,
  };
}

/**
 * Format test file content (prettier-like basic formatting)
 */
export function formatTestContent(content) {
  // Basic formatting - ensure proper line breaks
  let formatted = content;

  // Ensure blank line after imports
  formatted = formatted.replace(/(import .+;\n)(describe)/g, '$1\n$2');

  // Ensure blank line between describe blocks
  formatted = formatted.replace(/}\);\n(describe)/g, '});\n\n$1');

  // Remove multiple consecutive blank lines
  formatted = formatted.replace(/\n{3,}/g, '\n\n');

  // Ensure file ends with single newline
  formatted = formatted.trim() + '\n';

  return formatted;
}

/**
 * Check if test directory structure is valid
 */
export function validateTestStructure(projectRoot) {
  const issues = [];
  const warnings = [];

  // Check for vitest.config
  const vitestConfig = path.join(projectRoot, 'vitest.config.ts');
  if (!fileExists(vitestConfig)) {
    issues.push('Missing vitest.config.ts');
  }

  // Check for test setup files
  const setupFile = path.join(projectRoot, 'src', 'test', 'setup.ts');
  if (!fileExists(setupFile)) {
    warnings.push('No test setup file found at src/test/setup.ts');
  }

  // Check for package.json test scripts
  const packageJson = path.join(projectRoot, 'package.json');
  if (fileExists(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    if (!pkg.scripts?.test) {
      warnings.push('No test script in package.json');
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings,
  };
}

export default {
  writeTestFile,
  writeTestFiles,
  createTestDirectory,
  backupTestFile,
  writeSummaryFile,
  updateTestIndex,
  validateTestContent,
  formatTestContent,
  validateTestStructure,
};
