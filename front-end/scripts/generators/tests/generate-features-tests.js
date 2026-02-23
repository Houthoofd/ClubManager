#!/usr/bin/env node

/**
 * Generate Tests for All Features
 *
 * This script generates tests for all features in the project,
 * organized by type (hooks, components, services, pages)
 *
 * Usage:
 *   node generate-features-tests.js [options]
 *
 * Options:
 *   --type <type>       Generate only specific type (hooks|components|services|pages)
 *   --feature <name>    Generate only for specific feature
 *   --dry-run           Preview without making changes
 *   --verbose           Detailed logging
 *
 * Examples:
 *   node generate-features-tests.js --type hooks
 *   node generate-features-tests.js --feature auth
 *   node generate-features-tests.js --type components --feature courses
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const FEATURES_DIR = path.join(__dirname, "../../../src/features");
const GENERATOR_SCRIPT = path.join(__dirname, "generate-complete-tests.js");

const TYPES = {
  hooks: {
    pattern: "hooks",
    priority: 1,
    expectedGain: 10,
  },
  components: {
    pattern: "components",
    priority: 2,
    expectedGain: 15,
  },
  services: {
    pattern: "services",
    priority: 3,
    expectedGain: 8,
  },
  pages: {
    pattern: "pages",
    priority: 4,
    expectedGain: 7,
  },
};

// ============================================================================
// Parse CLI Arguments
// ============================================================================

const args = process.argv.slice(2);
const options = {
  type: null,
  feature: null,
  dryRun: args.includes("--dry-run"),
  verbose: args.includes("--verbose"),
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--type" && args[i + 1]) {
    options.type = args[i + 1];
  }
  if (args[i] === "--feature" && args[i + 1]) {
    options.feature = args[i + 1];
  }
}

// ============================================================================
// Utilities
// ============================================================================

class Logger {
  static header(msg) {
    console.log("\n" + "=".repeat(70));
    console.log(msg);
    console.log("=".repeat(70) + "\n");
  }

  static section(msg) {
    console.log("\n" + "-".repeat(70));
    console.log(msg);
    console.log("-".repeat(70) + "\n");
  }

  static success(msg) {
    console.log(`✅ ${msg}`);
  }

  static error(msg) {
    console.log(`❌ ${msg}`);
  }

  static warning(msg) {
    console.log(`⚠️  ${msg}`);
  }

  static info(msg) {
    console.log(`ℹ️  ${msg}`);
  }

  static progress(current, total, msg) {
    console.log(`[${current}/${total}] ${msg}`);
  }
}

// ============================================================================
// Feature Discovery
// ============================================================================

function discoverFeatures() {
  if (!fs.existsSync(FEATURES_DIR)) {
    Logger.error(`Features directory not found: ${FEATURES_DIR}`);
    return [];
  }

  const features = fs
    .readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .filter((name) => !name.startsWith(".") && !name.startsWith("_"));

  return features;
}

function discoverTypeDirectories(feature, type) {
  const featurePath = path.join(FEATURES_DIR, feature);
  const typePath = path.join(featurePath, type);

  if (!fs.existsSync(typePath)) {
    return [];
  }

  // Check if directory has actual files (not just test directories)
  const hasSourceFiles = hasNonTestFiles(typePath);

  return hasSourceFiles ? [typePath] : [];
}

function hasNonTestFiles(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith("__test") || entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
        continue;
      }

      if (entry.isFile() && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
        return true;
      }

      if (entry.isDirectory() && entry.name !== "__tests__") {
        const subPath = path.join(dir, entry.name);
        if (hasNonTestFiles(subPath)) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    return false;
  }
}

// ============================================================================
// Test Generation
// ============================================================================

function generateTestsForDirectory(dir, feature, type, dryRun = false) {
  Logger.info(`Generating tests for: ${dir}`);

  if (dryRun) {
    Logger.info("  (Dry run - no files will be created)");
    return { success: true, skipped: true };
  }

  try {
    const command = `node "${GENERATOR_SCRIPT}" --dir "${dir}" ${options.verbose ? "--verbose" : ""}`;

    if (options.verbose) {
      Logger.info(`  Executing: ${command}`);
    }

    execSync(command, {
      stdio: options.verbose ? "inherit" : "pipe",
      cwd: path.join(__dirname, "../../.."),
    });

    return { success: true, skipped: false };
  } catch (error) {
    Logger.error(`  Failed: ${error.message}`);
    return { success: false, skipped: false, error };
  }
}

// ============================================================================
// Main Workflow
// ============================================================================

class FeaturesTestGenerator {
  constructor() {
    this.stats = {
      features: 0,
      directories: 0,
      generated: 0,
      skipped: 0,
      failed: 0,
    };
  }

  run() {
    Logger.header("🚀 GENERATE TESTS FOR ALL FEATURES");

    this.printConfiguration();

    const features = this.getFeaturesToProcess();
    const types = this.getTypesToProcess();

    if (features.length === 0) {
      Logger.error("No features found to process");
      return;
    }

    Logger.info(`Found ${features.length} feature(s) to process`);
    Logger.info(`Types to generate: ${types.join(", ")}`);
    console.log("");

    this.processFeatures(features, types);

    this.printSummary();
  }

  printConfiguration() {
    Logger.section("⚙️  CONFIGURATION");

    console.log(`Features Directory: ${FEATURES_DIR}`);
    console.log(`Type Filter:        ${options.type || "All"}`);
    console.log(`Feature Filter:     ${options.feature || "All"}`);
    console.log(`Dry Run:            ${options.dryRun ? "Yes" : "No"}`);
    console.log(`Verbose:            ${options.verbose ? "Yes" : "No"}`);
  }

  getFeaturesToProcess() {
    const allFeatures = discoverFeatures();

    if (options.feature) {
      if (allFeatures.includes(options.feature)) {
        return [options.feature];
      } else {
        Logger.error(`Feature "${options.feature}" not found`);
        Logger.info(`Available features: ${allFeatures.join(", ")}`);
        return [];
      }
    }

    return allFeatures;
  }

  getTypesToProcess() {
    if (options.type) {
      if (TYPES[options.type]) {
        return [options.type];
      } else {
        Logger.error(`Invalid type "${options.type}"`);
        Logger.info(`Valid types: ${Object.keys(TYPES).join(", ")}`);
        process.exit(1);
      }
    }

    return Object.keys(TYPES).sort((a, b) => TYPES[a].priority - TYPES[b].priority);
  }

  processFeatures(features, types) {
    Logger.section("📝 GENERATING TESTS");

    let totalProcessed = 0;
    const totalItems = features.length * types.length;

    for (const feature of features) {
      Logger.info(`\n📁 Feature: ${feature}`);
      this.stats.features++;

      for (const type of types) {
        totalProcessed++;
        Logger.progress(totalProcessed, totalItems, `Processing ${type}`);

        const directories = discoverTypeDirectories(feature, type);

        if (directories.length === 0) {
          Logger.info(`  No ${type} directory found - skipping`);
          this.stats.skipped++;
          continue;
        }

        for (const dir of directories) {
          this.stats.directories++;
          const result = generateTestsForDirectory(dir, feature, type, options.dryRun);

          if (result.success && !result.skipped) {
            this.stats.generated++;
            Logger.success(`  Tests generated for ${type}`);
          } else if (result.skipped) {
            this.stats.skipped++;
          } else {
            this.stats.failed++;
          }
        }
      }
    }
  }

  printSummary() {
    Logger.section("📊 SUMMARY");

    console.log(`Features Processed:     ${this.stats.features}`);
    console.log(`Directories Found:      ${this.stats.directories}`);
    console.log(`Tests Generated:        ${this.stats.generated}`);
    console.log(`Skipped:                ${this.stats.skipped}`);
    console.log(`Failed:                 ${this.stats.failed}`);
    console.log("");

    const totalExpectedGain = this.stats.generated * 2; // Rough estimate: 2% per directory

    if (this.stats.generated > 0) {
      Logger.success("✨ Test generation completed!");
      Logger.info(`Estimated coverage gain: +${totalExpectedGain}%`);
      console.log("");
      Logger.info("Next steps:");
      console.log("  1. Run tests: npm test");
      console.log("  2. Check coverage: npm run test:coverage");
      console.log("  3. Review and improve generated tests");
    } else if (this.stats.skipped > 0 && this.stats.failed === 0) {
      Logger.warning("No new tests generated (all directories already have tests or were skipped)");
    } else {
      Logger.error("Test generation failed");
    }
  }
}

// ============================================================================
// Entry Point
// ============================================================================

const generator = new FeaturesTestGenerator();
generator.run();
