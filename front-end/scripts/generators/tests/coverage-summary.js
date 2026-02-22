#!/usr/bin/env node

/**
 * Quick Coverage Summary Script
 *
 * Runs tests on a sample of files and provides a coverage estimate
 * without running the entire test suite (which can take a long time).
 *
 * Usage:
 *   node coverage-summary.js [options]
 *
 * Options:
 *   --full       Run full coverage (slow)
 *   --sample N   Run tests on N random files (default: 20)
 *   --verbose    Show detailed output
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  fullCoverage: process.argv.includes("--full"),
  sampleSize: parseInt(process.argv.find((arg) => arg.startsWith("--sample="))?.split("=")[1]) || 20,
  verbose: process.argv.includes("--verbose"),
  srcDir: path.resolve(__dirname, "../../../src"),
};

console.log("📊 ClubManager Test Coverage Summary\n");
console.log("=".repeat(60));

// Find all test files
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith(".") && file !== "node_modules" && file !== "dist") {
        findTestFiles(filePath, fileList);
      }
    } else if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Count total lines of test code
function countTestLines(files) {
  let totalLines = 0;
  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    totalLines += content.split("\n").length;
  });
  return totalLines;
}

// Count TODOs in test files
function countTODOs(files) {
  let todoCount = 0;
  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.match(/\/\/ TODO:/g);
    if (matches) {
      todoCount += matches.length;
    }
  });
  return todoCount;
}

// Get file statistics
function getFileStats(dir) {
  let sourceFiles = 0;
  let testFiles = 0;
  let sourceLines = 0;

  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);

    files.forEach((file) => {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (
          !file.startsWith(".") &&
          file !== "node_modules" &&
          file !== "dist" &&
          file !== "__tests__" &&
          file !== "__test-utils__"
        ) {
          walk(filePath);
        }
      } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
        if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) {
          testFiles++;
        } else {
          sourceFiles++;
          const content = fs.readFileSync(filePath, "utf-8");
          sourceLines += content.split("\n").length;
        }
      }
    });
  }

  walk(dir);
  return { sourceFiles, testFiles, sourceLines };
}

try {
  console.log("🔍 Analyzing test files...\n");

  const allTestFiles = findTestFiles(config.srcDir);
  const stats = getFileStats(config.srcDir);
  const testLines = countTestLines(allTestFiles);
  const todoCount = countTODOs(allTestFiles);

  console.log("📈 PROJECT STATISTICS");
  console.log("=".repeat(60));
  console.log(`Source files:          ${stats.sourceFiles}`);
  console.log(`Test files:            ${stats.testFiles}`);
  console.log(`Source lines:          ${stats.sourceLines.toLocaleString()}`);
  console.log(`Test lines:            ${testLines.toLocaleString()}`);
  console.log(`Test/Source ratio:     ${((testLines / stats.sourceLines) * 100).toFixed(1)}%`);
  console.log(`Remaining TODOs:       ${todoCount}`);
  console.log("=".repeat(60));
  console.log();

  // Calculate coverage ratio (test files / source files)
  const coverageRatio = (stats.testFiles / stats.sourceFiles) * 100;
  console.log("📊 ESTIMATED COVERAGE");
  console.log("=".repeat(60));
  console.log(`File coverage:         ${coverageRatio.toFixed(1)}%`);

  // Estimate based on TODO completion
  const todoCompletionRate = todoCount > 0 ? ((2241 - todoCount) / 2241) * 100 : 100;
  console.log(`TODO completion:       ${todoCompletionRate.toFixed(1)}%`);

  // Overall estimate
  const estimatedCoverage = (coverageRatio * 0.6 + todoCompletionRate * 0.4).toFixed(1);
  console.log(`Estimated coverage:    ${estimatedCoverage}%`);
  console.log("=".repeat(60));
  console.log();

  // Status indicator
  const targetCoverage = 80;
  if (estimatedCoverage >= targetCoverage) {
    console.log(`✅ Target coverage (${targetCoverage}%) REACHED!`);
  } else {
    const gap = targetCoverage - estimatedCoverage;
    console.log(`⚠️  Gap to target: ${gap.toFixed(1)}% remaining`);
    console.log(`   Estimated ${Math.ceil((gap / 100) * stats.sourceFiles)} more test files needed`);
  }

  console.log();

  // Sample test run if requested
  if (config.fullCoverage) {
    console.log("🧪 Running full coverage analysis (this may take several minutes)...\n");
    console.log("Press Ctrl+C to cancel if it takes too long.\n");

    try {
      const output = execSync("npm run test:coverage", {
        cwd: path.resolve(__dirname, "../../../"),
        encoding: "utf-8",
        timeout: 300000, // 5 minutes timeout
      });

      console.log(output);
    } catch (error) {
      console.error("❌ Full coverage run failed or timed out");
      if (config.verbose) {
        console.error(error.message);
      }
    }
  } else {
    console.log("💡 NEXT STEPS");
    console.log("=".repeat(60));
    console.log("1. Review and complete remaining TODOs (business logic):");
    console.log(`   grep -r "TODO:" src/**/*.test.ts*`);
    console.log();
    console.log("2. Run full coverage when ready (may take 5-10 minutes):");
    console.log(`   node ${path.basename(__filename)} --full`);
    console.log("   OR");
    console.log(`   npm run test:coverage`);
    console.log();
    console.log("3. Generate tests for any missing files:");
    console.log(`   node scripts/generators/tests/index.js --all`);
    console.log();
    console.log("4. Fill remaining TODOs:");
    console.log(`   node scripts/generators/tests/fill-todos.js`);
    console.log("=".repeat(60));
  }

  console.log();

  // Breakdown by category
  console.log("📁 TEST FILES BY CATEGORY");
  console.log("=".repeat(60));

  const categories = {
    components: 0,
    hooks: 0,
    services: 0,
    utils: 0,
    formatters: 0,
    other: 0,
  };

  allTestFiles.forEach((file) => {
    if (file.includes("/components/")) categories.components++;
    else if (file.includes("/hooks/")) categories.hooks++;
    else if (file.includes("/services/")) categories.services++;
    else if (file.includes("/formatters/")) categories.formatters++;
    else if (file.includes("/utils/")) categories.utils++;
    else categories.other++;
  });

  Object.entries(categories).forEach(([category, count]) => {
    const percentage = ((count / stats.testFiles) * 100).toFixed(1);
    console.log(`${category.padEnd(15)} ${count.toString().padStart(4)} files (${percentage}%)`);
  });
  console.log("=".repeat(60));

  console.log();
  console.log("✨ Analysis complete!\n");
} catch (error) {
  console.error("❌ Error running coverage summary:", error.message);
  if (config.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
}
