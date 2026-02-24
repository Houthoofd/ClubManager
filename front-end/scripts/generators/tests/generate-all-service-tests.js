#!/usr/bin/env node

/**
 * ====================================================================
 * BATCH SERVICE TEST GENERATOR
 * ====================================================================
 *
 * Génère automatiquement des tests pour tous les fichiers service du projet.
 *
 * Fonctionnalités :
 * - Recherche automatique de tous les fichiers *.service.ts
 * - Génération en batch avec rapport détaillé
 * - Skip des fichiers déjà testés (option --force pour régénérer)
 * - Statistiques de génération
 * - Support du dry-run
 *
 * Usage:
 *   node generate-all-service-tests.js [options]
 *
 * Options:
 *   --force       Régénère tous les tests même s'ils existent déjà
 *   --dry-run     Affiche ce qui serait généré sans créer les fichiers
 *   --verbose     Affiche plus de détails pendant la génération
 *   --path <dir>  Génère uniquement pour un dossier spécifique
 *
 * Exemples:
 *   npm run test:generate:services:all
 *   npm run test:generate:services:all -- --force
 *   npm run test:generate:services:all -- --path src/core/services
 *   npm run test:generate:services:all -- --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================================================
// CONFIGURATION
// ====================================================================

const DEFAULT_CONFIG = {
  sourceRoot: "src",
  servicePattern: "**/*.service.ts",
  excludePatterns: ["**/*.test.ts", "**/*.spec.ts", "**/node_modules/**", "**/dist/**"],
  generatorScript: "scripts/generators/tests/generate-service-tests-enhanced.js",
};

// ====================================================================
// ARGUMENT PARSING
// ====================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    force: false,
    dryRun: false,
    verbose: false,
    targetPath: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--force":
        options.force = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--path":
        if (i + 1 < args.length) {
          options.targetPath = args[i + 1];
          i++;
        }
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
    }
  }

  return options;
}

function printHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║       BATCH SERVICE TEST GENERATOR - HELP                      ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npm run test:generate:services:all [options]

Options:
  --force           Régénère tous les tests même s'ils existent déjà
  --dry-run         Affiche ce qui serait généré sans créer de fichiers
  --verbose, -v     Affiche plus de détails pendant la génération
  --path <dir>      Génère uniquement pour un dossier spécifique
  --help, -h        Affiche cette aide

Exemples:
  npm run test:generate:services:all
  npm run test:generate:services:all -- --force
  npm run test:generate:services:all -- --path src/core/services
  npm run test:generate:services:all -- --dry-run --verbose
`);
}

// ====================================================================
// FILE DISCOVERY
// ====================================================================

function findServiceFiles(rootPath, targetPath = null) {
  const serviceFiles = [];
  const searchPath = targetPath || rootPath;

  function traverse(dir) {
    if (!fs.existsSync(dir)) {
      console.warn(`⚠️  Directory not found: ${dir}`);
      return;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip excluded patterns
      if (shouldExclude(fullPath)) continue;

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".service.ts")) {
        // Skip test files
        if (!entry.name.includes(".test.") && !entry.name.includes(".spec.")) {
          serviceFiles.push(fullPath);
        }
      }
    }
  }

  function shouldExclude(filePath) {
    const normalized = filePath.replace(/\\/g, "/");
    return DEFAULT_CONFIG.excludePatterns.some((pattern) => {
      const regex = new RegExp(pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*"));
      return regex.test(normalized);
    });
  }

  traverse(searchPath);
  return serviceFiles;
}

// ====================================================================
// TEST GENERATION
// ====================================================================

function generateTestForService(servicePath, options) {
  const testPath = servicePath.replace(/\.ts$/, ".test.ts");

  // Check if test already exists
  if (fs.existsSync(testPath) && !options.force) {
    return {
      path: servicePath,
      status: "skipped",
      reason: "Test file already exists (use --force to regenerate)",
      testPath,
    };
  }

  if (options.dryRun) {
    return {
      path: servicePath,
      status: "would-generate",
      testPath,
    };
  }

  try {
    // Call the enhanced generator
    const generatorPath = path.join(process.cwd(), DEFAULT_CONFIG.generatorScript);

    if (options.verbose) {
      console.log(`   Calling generator: ${generatorPath}`);
      console.log(`   Service file: ${servicePath}`);
    }

    const output = execSync(`node "${generatorPath}" "${servicePath}"`, {
      encoding: "utf-8",
      stdio: options.verbose ? "inherit" : "pipe",
    });

    return {
      path: servicePath,
      status: "generated",
      testPath,
      output: options.verbose ? output : null,
    };
  } catch (error) {
    return {
      path: servicePath,
      status: "error",
      error: error.message,
      testPath,
    };
  }
}

// ====================================================================
// REPORTING
// ====================================================================

function printReport(results, options) {
  const stats = {
    total: results.length,
    generated: results.filter((r) => r.status === "generated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    errors: results.filter((r) => r.status === "error").length,
    wouldGenerate: results.filter((r) => r.status === "would-generate").length,
  };

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║             SERVICE TEST GENERATION REPORT                     ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Summary
  console.log("📊 SUMMARY:");
  console.log(`   Total services found:  ${stats.total}`);

  if (options.dryRun) {
    console.log(`   Would generate:        ${stats.wouldGenerate}`);
    console.log(`   Would skip:            ${stats.skipped}`);
  } else {
    console.log(`   ✅ Generated:          ${stats.generated}`);
    console.log(`   ⏭️  Skipped:            ${stats.skipped}`);
    console.log(`   ❌ Errors:             ${stats.errors}`);
  }

  console.log("\n");

  // Generated files
  if (stats.generated > 0) {
    console.log("✅ GENERATED:");
    results
      .filter((r) => r.status === "generated")
      .forEach((r) => {
        console.log(`   ✓ ${path.relative(process.cwd(), r.testPath)}`);
      });
    console.log("\n");
  }

  // Would generate files (dry-run)
  if (stats.wouldGenerate > 0) {
    console.log("📝 WOULD GENERATE:");
    results
      .filter((r) => r.status === "would-generate")
      .forEach((r) => {
        console.log(`   → ${path.relative(process.cwd(), r.testPath)}`);
      });
    console.log("\n");
  }

  // Skipped files
  if (stats.skipped > 0 && options.verbose) {
    console.log("⏭️  SKIPPED:");
    results
      .filter((r) => r.status === "skipped")
      .forEach((r) => {
        console.log(`   - ${path.relative(process.cwd(), r.path)}`);
        console.log(`     Reason: ${r.reason}`);
      });
    console.log("\n");
  }

  // Errors
  if (stats.errors > 0) {
    console.log("❌ ERRORS:");
    results
      .filter((r) => r.status === "error")
      .forEach((r) => {
        console.log(`   ✗ ${path.relative(process.cwd(), r.path)}`);
        console.log(`     Error: ${r.error}`);
      });
    console.log("\n");
  }

  // Next steps
  console.log("💡 NEXT STEPS:");

  if (options.dryRun) {
    console.log("   1. Review the files that would be generated above");
    console.log("   2. Run without --dry-run to generate the tests:");
    console.log("      npm run test:generate:services:all");
  } else if (stats.generated > 0) {
    console.log("   1. Review and customize the generated tests");
    console.log("   2. Run tests to verify they work:");
    console.log("      npm test -- --run");
    console.log("   3. Fix any failing tests manually");
    console.log("   4. Check test coverage:");
    console.log("      npm run test:coverage");
  }

  if (stats.skipped > 0 && !options.force) {
    console.log(`   • ${stats.skipped} test(s) already exist. Use --force to regenerate.`);
  }

  console.log("\n");

  return stats;
}

// ====================================================================
// MAIN EXECUTION
// ====================================================================

async function main() {
  const options = parseArgs();

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║         GENERATING TESTS FOR ALL SERVICES...                   ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  if (options.dryRun) {
    console.log("🔍 DRY RUN MODE - No files will be created\n");
  }

  if (options.force) {
    console.log("⚡ FORCE MODE - Regenerating all tests\n");
  }

  if (options.targetPath) {
    console.log(`📁 Target path: ${options.targetPath}\n`);
  }

  // Find all service files
  console.log("🔍 Searching for service files...\n");
  const serviceFiles = findServiceFiles(DEFAULT_CONFIG.sourceRoot, options.targetPath);

  if (serviceFiles.length === 0) {
    console.log("❌ No service files found.\n");
    process.exit(1);
  }

  console.log(`✅ Found ${serviceFiles.length} service file(s):\n`);
  serviceFiles.forEach((file) => {
    console.log(`   • ${path.relative(process.cwd(), file)}`);
  });
  console.log("\n");

  // Generate tests
  console.log("⚙️  Generating tests...\n");
  const results = [];

  for (let i = 0; i < serviceFiles.length; i++) {
    const servicePath = serviceFiles[i];
    const relativePath = path.relative(process.cwd(), servicePath);

    if (!options.verbose) {
      process.stdout.write(
        `   [${i + 1}/${serviceFiles.length}] ${relativePath}... `
      );
    }

    const result = generateTestForService(servicePath, options);
    results.push(result);

    if (!options.verbose) {
      const statusIcon = {
        generated: "✅",
        skipped: "⏭️ ",
        error: "❌",
        "would-generate": "📝",
      };
      console.log(statusIcon[result.status] || "?");
    }
  }

  // Print report
  const stats = printReport(results, options);

  // Exit with appropriate code
  if (stats.errors > 0) {
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
main().catch((error) => {
  console.error("\n❌ Fatal error:", error.message);
  console.error(error.stack);
  process.exit(1);
});
