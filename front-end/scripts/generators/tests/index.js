#!/usr/bin/env node

/**
 * Test Generator CLI - Main Entry Point
 *
 * Automatically generates test files for the ClubManager frontend
 *
 * Usage:
 *   node scripts/test-generator/index.js [options] [path]
 *
 * Options:
 *   --all              Generate tests for all files
 *   --feature <name>   Generate tests for specific feature
 *   --type <type>      Generate tests for specific type (hook, component, util, store)
 *   --overwrite        Overwrite existing test files
 *   --dry-run          Show what would be generated without writing files
 *   --verbose          Show detailed output
 *   --no-interactive   Skip interactive prompts
 *   --help             Show help message
 *
 * Examples:
 *   # Generate tests for all hooks
 *   node scripts/test-generator/index.js --type hook
 *
 *   # Generate tests for users feature
 *   node scripts/test-generator/index.js --feature users
 *
 *   # Generate tests for specific file
 *   node scripts/test-generator/index.js src/features/users/hooks/useUserSearch.ts
 *
 *   # Dry run for all files
 *   node scripts/test-generator/index.js --all --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "./config.js";
import { analyzeFile } from "./analyzer.js";
import { generateCompleteTest } from "./template-generator.js";
import {
  writeTestFile,
  writeTestFiles,
  writeSummaryFile,
  validateTestStructure,
} from "./file-writer.js";
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
  createProgressBar,
  pluralize,
  getTestStats,
} from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main function
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Show help
  if (args.flags.help || args.flags.h) {
    showHelp();
    process.exit(0);
  }

  // Get options
  const options = {
    all: args.flags.all || false,
    feature: args.flags.feature || null,
    type: args.flags.type || null,
    overwrite: args.flags.overwrite || false,
    dryRun: args.flags["dry-run"] || args.flags.n || false,
    verbose: args.flags.verbose || args.flags.v || false,
    interactive: !args.flags["no-interactive"],
    path: args._[0] || null,
  };

  // Show banner
  showBanner();

  // Validate project structure
  const projectRoot = getProjectRoot();
  const structureValidation = validateTestStructure(projectRoot);

  if (!structureValidation.valid) {
    logError("Project structure issues found:");
    structureValidation.issues.forEach((issue) => logError(`  - ${issue}`));

    if (options.interactive) {
      const shouldContinue = await confirm("Continue anyway?");
      if (!shouldContinue) {
        process.exit(1);
      }
    }
  }

  if (structureValidation.warnings.length > 0 && options.verbose) {
    logWarning("Warnings:");
    structureValidation.warnings.forEach((warning) => logWarning(`  - ${warning}`));
  }

  // Collect files to generate tests for
  const filesToTest = await collectFiles(options);

  if (filesToTest.length === 0) {
    logWarning("No files found to generate tests for.");
    process.exit(0);
  }

  // Show summary
  logInfo(`\nFound ${filesToTest.length} ${pluralize("file", filesToTest.length)} to process`);

  if (options.verbose) {
    const typeCount = filesToTest.reduce((acc, file) => {
      acc[file.type] = (acc[file.type] || 0) + 1;
      return acc;
    }, {});

    log("\nBreakdown by type:");
    Object.entries(typeCount).forEach(([type, count]) => {
      log(`  ${type}: ${count}`);
    });
  }

  // Confirm before proceeding (in interactive mode)
  if (options.interactive && !options.dryRun) {
    log("");
    const shouldProceed = await confirm("Proceed with test generation?");
    if (!shouldProceed) {
      logInfo("Cancelled.");
      process.exit(0);
    }
  }

  // Generate tests
  log("\n" + colorize("Generating tests...", "cyan"));
  const results = await generateTests(filesToTest, options);

  // Show results
  showResults(results, options);

  // Write summary file
  if (!options.dryRun && results.generated.length > 0) {
    const summaryPath = path.join(projectRoot, "test-generation-summary.json");
    writeSummaryFile(results.generated, summaryPath);
  }

  // Exit
  const exitCode = results.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

/**
 * Show banner
 */
function showBanner() {
  log("");
  log(colorize("╔══════════════════════════════════════════════════╗", "cyan"));
  log(colorize("║        ClubManager Test Generator v1.0.0         ║", "cyan"));
  log(colorize("╚══════════════════════════════════════════════════╝", "cyan"));
  log("");
}

/**
 * Show help message
 */
function showHelp() {
  log(`
${colorize("ClubManager Test Generator", "bright")}

${colorize("Usage:", "green")}
  node scripts/test-generator/index.js [options] [path]

${colorize("Options:", "green")}
  --all              Generate tests for all files
  --feature <name>   Generate tests for specific feature (users, shop, stats, etc.)
  --type <type>      Generate tests for specific type (hook, component, util, store)
  --overwrite        Overwrite existing test files
  --dry-run, -n      Show what would be generated without writing files
  --verbose, -v      Show detailed output
  --no-interactive   Skip interactive prompts
  --help, -h         Show this help message

${colorize("Examples:", "green")}
  # Generate tests for all hooks
  node scripts/test-generator/index.js --type hook

  # Generate tests for users feature
  node scripts/test-generator/index.js --feature users

  # Generate tests for specific file
  node scripts/test-generator/index.js src/features/users/hooks/useUserSearch.ts

  # Dry run for all files
  node scripts/test-generator/index.js --all --dry-run

  # Generate all tests and overwrite existing
  node scripts/test-generator/index.js --all --overwrite

${colorize("Supported File Types:", "green")}
  - hooks (useXxx.ts)
  - components (XxxComponent.tsx)
  - utilities (*.utils.ts, *.helpers.ts, *.formatters.ts)
  - stores (*-store.ts)
  - pages (*Page.tsx)
`);
}

/**
 * Collect files to generate tests for
 */
async function collectFiles(options) {
  const projectRoot = getProjectRoot();
  const filesToAnalyze = [];

  // Single file mode
  if (options.path) {
    const filePath = path.resolve(projectRoot, options.path);
    filesToAnalyze.push(filePath);
  }
  // Feature mode
  else if (options.feature) {
    const featureDir = path.join(projectRoot, "src", "features", options.feature);
    const files = getFilesRecursively(featureDir);
    filesToAnalyze.push(...files);
  }
  // All mode
  else if (options.all) {
    Object.values(config.sourceDirs).forEach((dir) => {
      const fullPath = path.join(projectRoot, dir);
      const files = getFilesRecursively(fullPath);
      filesToAnalyze.push(...files);
    });
  }
  // Default: features directory
  else {
    const featuresDir = path.join(projectRoot, config.sourceDirs.features);
    const files = getFilesRecursively(featuresDir);
    filesToAnalyze.push(...files);
  }

  // Filter and analyze files
  const analyzed = [];

  for (const filePath of filesToAnalyze) {
    const fileName = path.basename(filePath);

    // Skip ignored files
    if (shouldIgnoreFile(fileName)) {
      continue;
    }

    // Skip non-TypeScript files
    if (!/\.(ts|tsx)$/.test(fileName)) {
      continue;
    }

    try {
      const analysis = analyzeFile(filePath);

      // Skip unknown types
      if (analysis.type === "unknown") {
        if (options.verbose) {
          logWarning(`Skipping unknown file type: ${filePath}`);
        }
        continue;
      }

      // Filter by type if specified
      if (
        options.type &&
        analysis.type !== options.type &&
        !analysis.type.startsWith(options.type)
      ) {
        continue;
      }

      // Check if test already exists
      const testPath = getTestFilePath(filePath, analysis.type);
      const testExists = fs.existsSync(testPath);

      analyzed.push({
        ...analysis,
        testPath,
        testExists,
      });
    } catch (error) {
      if (options.verbose) {
        logError(`Failed to analyze ${filePath}: ${error.message}`);
      }
    }
  }

  return analyzed;
}

/**
 * Generate tests for all analyzed files
 */
async function generateTests(files, options) {
  const results = {
    total: files.length,
    generated: [],
    skipped: [],
    failed: [],
    totalLines: 0,
  };

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // Show progress
    if (!options.verbose) {
      const progress = createProgressBar(i + 1, files.length);
      process.stdout.write(`\r${progress}`);
    }

    try {
      // Skip if test exists and not overwriting
      if (file.testExists && !options.overwrite) {
        if (options.verbose) {
          logWarning(`Skipping (exists): ${file.testPath}`);
        }
        results.skipped.push({
          source: file.filePath,
          test: file.testPath,
          reason: "Test already exists",
        });
        continue;
      }

      // Generate test content
      const testContent = generateCompleteTest(file, file.testPath);
      const lines = testContent.split("\n").length;

      // Write test file
      const writeResult = writeTestFile(file.testPath, testContent, {
        overwrite: options.overwrite,
        dryRun: options.dryRun,
      });

      if (writeResult.success) {
        results.generated.push({
          source: file.filePath,
          test: file.testPath,
          type: file.type,
          lines,
        });
        results.totalLines += lines;
      } else if (writeResult.skipped) {
        results.skipped.push({
          source: file.filePath,
          test: file.testPath,
          reason: writeResult.reason,
        });
      } else {
        results.failed.push({
          source: file.filePath,
          test: file.testPath,
          error: writeResult.error,
        });
      }
    } catch (error) {
      if (options.verbose) {
        logError(`Failed to generate test for ${file.filePath}: ${error.message}`);
      }
      results.failed.push({
        source: file.filePath,
        error: error.message,
      });
    }
  }

  // Clear progress bar
  if (!options.verbose) {
    process.stdout.write("\r" + " ".repeat(60) + "\r");
  }

  return results;
}

/**
 * Show generation results
 */
function showResults(results, options) {
  log("\n" + colorize("═".repeat(50), "cyan"));
  log(colorize("Results:", "bright"));
  log(colorize("═".repeat(50), "cyan"));

  log(`\nTotal files processed: ${results.total}`);

  if (results.generated.length > 0) {
    logSuccess(
      `✓ Generated: ${results.generated.length} test ${pluralize("file", results.generated.length)}`,
    );
    log(`  Total lines: ${results.totalLines}`);

    if (options.verbose) {
      log("\n  Files generated:");
      results.generated.forEach(({ test, type, lines }) => {
        log(`    - ${test} (${type}, ${lines} lines)`);
      });
    }
  }

  if (results.skipped.length > 0) {
    logWarning(`⊘ Skipped: ${results.skipped.length} ${pluralize("file", results.skipped.length)}`);

    if (options.verbose) {
      log("\n  Files skipped:");
      results.skipped.forEach(({ test, reason }) => {
        log(`    - ${test} (${reason})`);
      });
    }
  }

  if (results.failed.length > 0) {
    logError(`✗ Failed: ${results.failed.length} ${pluralize("file", results.failed.length)}`);

    if (options.verbose) {
      log("\n  Files failed:");
      results.failed.forEach(({ source, error }) => {
        log(`    - ${source}: ${error}`);
      });
    }
  }

  // Show next steps
  if (results.generated.length > 0) {
    log("\n" + colorize("Next Steps:", "green"));
    log("  1. Review the generated test files");
    log("  2. Complete the TODO items in each test");
    log("  3. Run tests: npm test");
    log("  4. Check coverage: npm run test:coverage");
  }

  if (options.dryRun) {
    log("\n" + colorize("Note: This was a dry run. No files were actually written.", "yellow"));
  }

  log("");
}

// Run main function
main().catch((error) => {
  logError("Unexpected error:");
  console.error(error);
  process.exit(1);
});
