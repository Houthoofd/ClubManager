#!/usr/bin/env node

/**
 * ====================================================================
 * SERVICE TESTS COVERAGE EVALUATOR
 * ====================================================================
 *
 * Évalue rapidement la couverture des tests pour les services sans
 * avoir besoin de lancer la suite complète de tests avec coverage.
 *
 * Analyse:
 * - Nombre de services avec tests
 * - Nombre de fonctions testées vs total
 * - Estimation de la couverture
 * - Rapport détaillé par service
 *
 * Usage:
 *   node scripts/evaluate-service-tests-coverage.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as parser from "@babel/parser";
import traverse from "@babel/traverse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================================================================
// CONFIGURATION
// ====================================================================

const CONFIG = {
  sourceRoot: "src",
  servicePattern: ".service.ts",
  testPattern: ".service.test.ts",
  excludePaths: ["node_modules", "dist", "__tests__"],
};

// ====================================================================
// UTILITIES
// ====================================================================

function findFiles(dir, pattern, exclude = []) {
  const files = [];

  function traverse(currentDir) {
    if (!fs.existsSync(currentDir)) return;

    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Skip excluded paths
      if (exclude.some((ex) => fullPath.includes(ex))) continue;

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && fullPath.includes(pattern)) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function countFunctions(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    const functions = [];
    const exports = { named: [], default: null };

    traverse.default(ast, {
      ExportDefaultDeclaration(path) {
        if (path.node.declaration?.type === "Identifier") {
          exports.default = path.node.declaration.name;
        } else if (path.node.declaration?.type === "ObjectExpression") {
          path.node.declaration.properties.forEach((prop) => {
            if (prop.key?.name) exports.named.push(prop.key.name);
          });
        }
      },
      ExportNamedDeclaration(path) {
        if (path.node.declaration?.type === "VariableDeclaration") {
          path.node.declaration.declarations.forEach((decl) => {
            if (decl.id?.name) {
              exports.named.push(decl.id.name);
              functions.push(decl.id.name);
            }
          });
        } else if (path.node.declaration?.type === "FunctionDeclaration") {
          if (path.node.declaration.id?.name) {
            exports.named.push(path.node.declaration.id.name);
            functions.push(path.node.declaration.id.name);
          }
        }
      },
      FunctionDeclaration(path) {
        if (path.node.id?.name && !functions.includes(path.node.id.name)) {
          functions.push(path.node.id.name);
        }
      },
      VariableDeclarator(path) {
        if (
          path.node.id?.name &&
          path.node.init &&
          (path.node.init.type === "ArrowFunctionExpression" ||
            path.node.init.type === "FunctionExpression")
        ) {
          if (!functions.includes(path.node.id.name)) {
            functions.push(path.node.id.name);
          }
        }
      },
    });

    return { functions, exports };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
    return { functions: [], exports: { named: [], default: null } };
  }
}

function countTests(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf-8");

    // Count describe blocks (test suites for functions)
    const describeMatches = code.match(/describe\(['"`](\w+)['"`]/g) || [];
    const describedFunctions = describeMatches
      .map((m) => m.match(/describe\(['"`](\w+)['"`]/)?.[1])
      .filter(Boolean);

    // Count it/test blocks
    const itMatches = code.match(/\s+(it|test)\(/g) || [];
    const testCount = itMatches.length;

    // Check for skip/todo
    const skipMatches = code.match(/\.(skip|todo)\(/g) || [];
    const skipCount = skipMatches.length;

    return {
      describedFunctions,
      testCount,
      skipCount,
      activeTests: testCount - skipCount,
    };
  } catch (error) {
    return {
      describedFunctions: [],
      testCount: 0,
      skipCount: 0,
      activeTests: 0,
    };
  }
}

function estimateCoverage(serviceData) {
  const { functions, exports, tests } = serviceData;

  if (!tests) return 0;

  const exportedFunctions = [...exports.named];
  if (exports.default) exportedFunctions.push(exports.default);

  const testedFunctions = tests.describedFunctions.filter((fn) =>
    exportedFunctions.includes(fn)
  );

  const functionCoverage =
    exportedFunctions.length > 0
      ? (testedFunctions.length / exportedFunctions.length) * 100
      : 0;

  // Estimate line coverage based on tests count
  const estimatedLineCoverage = tests.activeTests > 0
    ? Math.min(95, 40 + tests.activeTests * 3)
    : 0;

  return Math.round((functionCoverage + estimatedLineCoverage) / 2);
}

// ====================================================================
// ANALYSIS
// ====================================================================

function analyzeServices() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║         SERVICE TESTS COVERAGE EVALUATION                      ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("\n");

  // Find all service files
  const serviceFiles = findFiles(
    CONFIG.sourceRoot,
    CONFIG.servicePattern,
    CONFIG.excludePaths
  ).filter((f) => !f.includes(".test."));

  console.log(`🔍 Found ${serviceFiles.length} service files\n`);

  const results = [];
  let totalFunctions = 0;
  let totalTestedFunctions = 0;
  let totalTests = 0;
  let totalSkipped = 0;

  for (const serviceFile of serviceFiles) {
    const testFile = serviceFile.replace(".ts", ".test.ts");
    const hasTests = fs.existsSync(testFile);

    const serviceData = countFunctions(serviceFile);
    const testData = hasTests ? countTests(testFile) : null;

    const exportedCount = serviceData.exports.named.length +
      (serviceData.exports.default ? 1 : 0);

    const testedCount = testData
      ? testData.describedFunctions.filter((fn) =>
          [...serviceData.exports.named, serviceData.exports.default].includes(fn)
        ).length
      : 0;

    const coverage = estimateCoverage({
      functions: serviceData.functions,
      exports: serviceData.exports,
      tests: testData,
    });

    totalFunctions += exportedCount;
    totalTestedFunctions += testedCount;
    totalTests += testData?.activeTests || 0;
    totalSkipped += testData?.skipCount || 0;

    results.push({
      name: path.relative(CONFIG.sourceRoot, serviceFile),
      hasTests,
      totalFunctions: exportedCount,
      testedFunctions: testedCount,
      testCount: testData?.testCount || 0,
      activeTests: testData?.activeTests || 0,
      skipped: testData?.skipCount || 0,
      coverage,
    });
  }

  return {
    services: results,
    summary: {
      totalServices: serviceFiles.length,
      servicesWithTests: results.filter((r) => r.hasTests).length,
      totalFunctions,
      totalTestedFunctions,
      totalTests,
      totalSkipped,
    },
  };
}

// ====================================================================
// REPORTING
// ====================================================================

function printReport(data) {
  const { services, summary } = data;

  // Summary
  console.log("📊 SUMMARY:\n");
  console.log(`   Total services:        ${summary.totalServices}`);
  console.log(`   With tests:            ${summary.servicesWithTests} (${Math.round((summary.servicesWithTests / summary.totalServices) * 100)}%)`);
  console.log(`   Without tests:         ${summary.totalServices - summary.servicesWithTests}`);
  console.log(`   Total functions:       ${summary.totalFunctions}`);
  console.log(`   Tested functions:      ${summary.totalTestedFunctions} (${Math.round((summary.totalTestedFunctions / summary.totalFunctions) * 100)}%)`);
  console.log(`   Total tests:           ${summary.totalTests}`);
  console.log(`   Skipped/TODO:          ${summary.totalSkipped}`);
  console.log("\n");

  // Detailed results
  console.log("📋 DETAILED RESULTS:\n");
  console.log("┌─────────────────────────────────────────────────────────┬───────┬────────┬───────┬──────────┐");
  console.log("│ Service                                                 │ Tests │ Fn/Tot │ Skip  │ Coverage │");
  console.log("├─────────────────────────────────────────────────────────┼───────┼────────┼───────┼──────────┤");

  services
    .sort((a, b) => b.coverage - a.coverage)
    .forEach((service) => {
      const name = service.name.padEnd(55).substring(0, 55);
      const tests = service.activeTests.toString().padStart(5);
      const functions = `${service.testedFunctions}/${service.totalFunctions}`.padStart(6);
      const skipped = service.skipped.toString().padStart(5);
      const coverage = `${service.coverage}%`.padStart(8);

      const statusIcon = service.hasTests ? "✓" : "✗";
      const coverageIcon =
        service.coverage >= 80 ? "🟢" :
        service.coverage >= 60 ? "🟡" :
        service.coverage >= 40 ? "🟠" :
        service.coverage > 0 ? "🔴" : "⚫";

      console.log(`│ ${statusIcon} ${name} │ ${tests} │ ${functions} │ ${skipped} │ ${coverageIcon} ${coverage} │`);
    });

  console.log("└─────────────────────────────────────────────────────────┴───────┴────────┴───────┴──────────┘");
  console.log("\n");

  // Coverage ranges
  const ranges = {
    high: services.filter((s) => s.coverage >= 80).length,
    good: services.filter((s) => s.coverage >= 60 && s.coverage < 80).length,
    medium: services.filter((s) => s.coverage >= 40 && s.coverage < 60).length,
    low: services.filter((s) => s.coverage > 0 && s.coverage < 40).length,
    none: services.filter((s) => s.coverage === 0).length,
  };

  console.log("📈 COVERAGE DISTRIBUTION:\n");
  console.log(`   🟢 High (≥80%):      ${ranges.high}`);
  console.log(`   🟡 Good (60-79%):    ${ranges.good}`);
  console.log(`   🟠 Medium (40-59%):  ${ranges.medium}`);
  console.log(`   🔴 Low (1-39%):      ${ranges.low}`);
  console.log(`   ⚫ None (0%):        ${ranges.none}`);
  console.log("\n");

  // Recommendations
  console.log("💡 RECOMMENDATIONS:\n");

  const needTests = services.filter((s) => !s.hasTests);
  if (needTests.length > 0) {
    console.log(`   ⚠️  ${needTests.length} service(s) need tests:`);
    needTests.forEach((s) => {
      console.log(`      • ${s.name}`);
    });
    console.log("");
  }

  const lowCoverage = services.filter((s) => s.hasTests && s.coverage < 60);
  if (lowCoverage.length > 0) {
    console.log(`   📊 ${lowCoverage.length} service(s) need more tests:`);
    lowCoverage.slice(0, 5).forEach((s) => {
      console.log(`      • ${s.name} (${s.coverage}%)`);
    });
    if (lowCoverage.length > 5) {
      console.log(`      ... and ${lowCoverage.length - 5} more`);
    }
    console.log("");
  }

  const skipped = services.filter((s) => s.skipped > 0);
  if (skipped.length > 0) {
    console.log(`   ⏭️  ${skipped.length} service(s) have skipped tests:`);
    skipped.forEach((s) => {
      console.log(`      • ${s.name} (${s.skipped} skipped)`);
    });
    console.log("");
  }

  // Overall score
  const avgCoverage = Math.round(
    services.reduce((sum, s) => sum + s.coverage, 0) / services.length
  );

  console.log("🎯 OVERALL SCORE:\n");
  console.log(`   Average Coverage:  ${avgCoverage}%`);
  console.log(`   Target Coverage:   80%`);
  console.log(`   Gap:               ${Math.max(0, 80 - avgCoverage)}%`);

  const grade =
    avgCoverage >= 80 ? "A (Excellent)" :
    avgCoverage >= 70 ? "B (Good)" :
    avgCoverage >= 60 ? "C (Fair)" :
    avgCoverage >= 50 ? "D (Needs Improvement)" :
    "F (Critical)";

  console.log(`   Grade:             ${grade}`);
  console.log("\n");
}

// ====================================================================
// MAIN
// ====================================================================

function main() {
  try {
    const data = analyzeServices();
    printReport(data);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
