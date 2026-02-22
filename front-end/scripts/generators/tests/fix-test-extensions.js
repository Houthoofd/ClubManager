#!/usr/bin/env node

/**
 * ========================================================================
 * FIX-TEST-EXTENSIONS.JS - Rename .test.ts to .test.tsx for JSX files
 * ========================================================================
 *
 * Problem: 73 test files have .test.ts extension but contain JSX code
 * Solution: Rename them to .test.tsx so they can compile properly
 *
 * Usage:
 *   node scripts/generators/tests/fix-test-extensions.js
 *   node scripts/generators/tests/fix-test-extensions.js --dry-run
 *
 * ========================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

const SRC_DIR = path.join(__dirname, "../../../src");
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  red: "\x1b[31m",
};

// ============================================================================
// JSX Detection
// ============================================================================

/**
 * Check if a file contains JSX code
 */
function containsJSX(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Check for JSX patterns
    const jsxPatterns = [
      /<[A-Z][a-zA-Z0-9]*[\s/>]/, // JSX components: <Component
      /<[a-z]+\s+[a-zA-Z]+=/, // JSX with props: <div className=
      /return\s*\(/m, // return ( usually followed by JSX
      /React\.createElement/, // React.createElement
      /<MockedProvider/i, // Apollo MockedProvider
      /<\w+Provider/i, // Common providers
      /wrapper.*children.*React\.ReactNode/, // Common wrapper pattern
    ];

    for (const pattern of jsxPatterns) {
      if (pattern.test(content)) {
        return true;
      }
    }

    // Check for obvious JSX blocks
    if (content.includes("</")) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// File Processing
// ============================================================================

/**
 * Find all .test.ts files
 */
function findTestTsFiles() {
  const testFiles = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
        testFiles.push(fullPath);
      }
    }
  }

  scan(SRC_DIR);
  return testFiles;
}

/**
 * Rename a test file from .test.ts to .test.tsx
 */
function renameTestFile(filePath, stats) {
  const relativePath = path.relative(SRC_DIR, filePath);
  const newPath = filePath.replace(/\.test\.ts$/, ".test.tsx");

  if (VERBOSE) {
    console.log(`\n${COLORS.cyan}Checking:${COLORS.reset} ${relativePath}`);
  }

  // Check if it contains JSX
  if (!containsJSX(filePath)) {
    if (VERBOSE) {
      console.log(`  ${COLORS.yellow}⊘${COLORS.reset} No JSX detected, skipping`);
    }
    return;
  }

  stats.filesWithJSX++;

  if (!DRY_RUN) {
    try {
      fs.renameSync(filePath, newPath);
      stats.filesRenamed++;
      console.log(
        `  ${COLORS.green}✓${COLORS.reset} ${relativePath}\n` +
          `    ${COLORS.cyan}→${COLORS.reset} ${path.relative(SRC_DIR, newPath)}`
      );
    } catch (error) {
      stats.errors++;
      console.log(
        `  ${COLORS.red}✗${COLORS.reset} Failed to rename: ${error.message}`
      );
    }
  } else {
    stats.filesRenamed++;
    console.log(
      `  ${COLORS.green}✓${COLORS.reset} Would rename: ${relativePath}\n` +
        `    ${COLORS.cyan}→${COLORS.reset} ${path.relative(SRC_DIR, newPath)}`
    );
  }
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log(`
${COLORS.bright}╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🔧 FIX TEST FILE EXTENSIONS                                 ║
║                                                                ║
║   Rename .test.ts → .test.tsx for files with JSX             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

  if (DRY_RUN) {
    console.log(`${COLORS.yellow}🔍 DRY RUN MODE - No files will be modified${COLORS.reset}\n`);
  }

  const stats = {
    filesProcessed: 0,
    filesWithJSX: 0,
    filesRenamed: 0,
    errors: 0,
  };

  // Find all .test.ts files
  const testFiles = findTestTsFiles();

  console.log(`${COLORS.cyan}Found ${testFiles.length} .test.ts files${COLORS.reset}\n`);

  // Process each file
  for (const filePath of testFiles) {
    stats.filesProcessed++;
    renameTestFile(filePath, stats);
  }

  // Summary
  console.log(`
${COLORS.bright}╔════════════════════════════════════════════════════════════════╗
║ SUMMARY                                                        ║
╚════════════════════════════════════════════════════════════════╝${COLORS.reset}

  ${COLORS.cyan}Files processed:${COLORS.reset}    ${stats.filesProcessed}
  ${COLORS.yellow}Files with JSX:${COLORS.reset}     ${stats.filesWithJSX}
  ${COLORS.green}Files renamed:${COLORS.reset}      ${stats.filesRenamed}
  ${COLORS.red}Errors:${COLORS.reset}             ${stats.errors}
`);

  if (stats.filesRenamed > 0) {
    console.log(
      `${COLORS.green}${COLORS.bright}✨ Fixed ${stats.filesRenamed} test file extensions!${COLORS.reset}\n`
    );

    if (!DRY_RUN) {
      console.log(`${COLORS.cyan}Next steps:${COLORS.reset}`);
      console.log(`  1. Run tests: ${COLORS.yellow}npm test${COLORS.reset}`);
      console.log(
        `  2. Check coverage: ${COLORS.yellow}npm run test:coverage${COLORS.reset}`
      );
      console.log(`  3. Commit changes\n`);
    } else {
      console.log(`${COLORS.yellow}Run without --dry-run to apply changes${COLORS.reset}\n`);
    }
  } else {
    console.log(
      `${COLORS.green}${COLORS.bright}✅ All test files already have correct extensions!${COLORS.reset}\n`
    );
  }
}

main();
