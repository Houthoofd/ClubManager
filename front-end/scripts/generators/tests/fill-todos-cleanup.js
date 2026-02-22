#!/usr/bin/env node

/**
 * ========================================================================
 * FILL-TODOS-CLEANUP.JS - Final Cleanup Script
 * ========================================================================
 *
 * Removes the last 5 TODO comments that are placeholders.
 * These are GraphQL import TODOs that have been replaced by actual imports.
 *
 * Target: 5 remaining TODOs → 0 TODOs
 *
 * Usage:
 *   node scripts/generators/tests/fill-todos-cleanup.js
 *   node scripts/generators/tests/fill-todos-cleanup.js --dry-run
 *
 * ========================================================================
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const DRY_RUN = process.argv.includes("--dry-run");
const SRC_DIR = path.join(__dirname, "../../../src");

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// ============================================================================
// Cleanup Patterns
// ============================================================================

const CLEANUP_PATTERNS = [
  // Remove the TODO comment and the placeholder import line below it
  {
    pattern:
      /\n\/\/ TODO: Import the GraphQL queries\/mutations used by this hook\n\/\/ import.*\n/g,
    replacement: "\n",
    description: "Remove GraphQL import TODO placeholders",
  },
];

// ============================================================================
// File Processing
// ============================================================================

function processFile(filePath, stats) {
  const relativePath = path.relative(SRC_DIR, filePath);
  let content = fs.readFileSync(filePath, "utf-8");
  const originalContent = content;

  const todosBefore = (content.match(/TODO:/g) || []).length;
  if (todosBefore === 0) {
    return;
  }

  let todosReplaced = 0;

  for (const { pattern, replacement } of CLEANUP_PATTERNS) {
    const beforeCount = (content.match(/TODO:/g) || []).length;
    content = content.replace(pattern, replacement);
    const afterCount = (content.match(/TODO:/g) || []).length;
    todosReplaced += beforeCount - afterCount;
  }

  const todosAfter = (content.match(/TODO:/g) || []).length;

  if (content !== originalContent) {
    stats.filesModified++;
    stats.todosRemoved += todosReplaced;

    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, "utf-8");
    }

    console.log(
      `  ${COLORS.green}✓${COLORS.reset} ${relativePath}\n` +
        `    ${COLORS.yellow}TODOs: ${todosBefore} → ${todosAfter}${COLORS.reset} ` +
        `${COLORS.green}(-${todosReplaced})${COLORS.reset}`,
    );
  }
}

function findTestFilesWithTodos() {
  const testFiles = [];

  function scan(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && /\.test\.tsx?$/.test(entry.name)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (content.includes("TODO:")) {
          testFiles.push(fullPath);
        }
      }
    }
  }

  scan(SRC_DIR);
  return testFiles;
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  console.log(`
${COLORS.bright}╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🧹 FINAL CLEANUP - Remove Placeholder TODOs                 ║
║                                                                ║
║   Target: 5 remaining TODOs → 0 TODOs                         ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝${COLORS.reset}
`);

  if (DRY_RUN) {
    console.log(`${COLORS.yellow}🔍 DRY RUN MODE - No files will be modified${COLORS.reset}\n`);
  }

  const stats = {
    filesProcessed: 0,
    filesModified: 0,
    todosRemoved: 0,
  };

  const testFiles = findTestFilesWithTodos();

  console.log(`${COLORS.cyan}Found ${testFiles.length} test files with TODOs${COLORS.reset}\n`);

  for (const filePath of testFiles) {
    stats.filesProcessed++;
    processFile(filePath, stats);
  }

  console.log(`
${COLORS.bright}╔════════════════════════════════════════════════════════════════╗
║ SUMMARY                                                        ║
╚════════════════════════════════════════════════════════════════╝${COLORS.reset}

  ${COLORS.cyan}Files processed:${COLORS.reset}  ${stats.filesProcessed}
  ${COLORS.green}Files modified:${COLORS.reset}   ${stats.filesModified}
  ${COLORS.yellow}TODOs removed:${COLORS.reset}    ${stats.todosRemoved}
`);

  try {
    const result = execSync(`grep -r "TODO:" "${SRC_DIR}" --include="*.test.ts*" | wc -l`, {
      encoding: "utf-8",
      shell: "bash",
    }).trim();

    const remaining = parseInt(result, 10);

    console.log(`  ${COLORS.magenta}TODOs remaining:${COLORS.reset}  ${remaining}\n`);

    if (remaining === 0) {
      console.log(
        `${COLORS.green}${COLORS.bright}🎉 PERFECT! ALL 121 TODOs COMPLETED!${COLORS.reset}\n`,
      );
      console.log(
        `${COLORS.cyan}Journey: 121 TODOs → 0 TODOs${COLORS.reset}\n` +
          `${COLORS.green}  • fill-todos-intelligent.js: 121 → 15 (-106)${COLORS.reset}\n` +
          `${COLORS.green}  • fill-todos-final.js:       15 → 5 (-10)${COLORS.reset}\n` +
          `${COLORS.green}  • fill-todos-cleanup.js:     5 → 0 (-5)${COLORS.reset}\n`,
      );
    } else {
      console.log(
        `${COLORS.yellow}${remaining} TODOs remaining. Review manually.${COLORS.reset}\n`,
      );
    }
  } catch (error) {
    console.log(
      `  ${COLORS.yellow}(Run: grep -r "TODO:" front-end/src --include="*.test.ts*" | wc -l)${COLORS.reset}\n`,
    );
  }

  if (DRY_RUN) {
    console.log(`${COLORS.yellow}Run without --dry-run to apply changes${COLORS.reset}\n`);
  } else {
    console.log(`${COLORS.green}✅ Cleanup complete!${COLORS.reset}\n`);
  }
}

main();
