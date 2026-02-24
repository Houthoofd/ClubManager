#!/usr/bin/env node

/**
 * ====================================================================
 * Fix Apollo Client Imports for Vitest SSR Compatibility
 * ====================================================================
 *
 * This script fixes the GraphQL Codegen output to use named imports
 * instead of namespace imports, which don't work in Vitest SSR.
 *
 * PROBLEM:
 * - GraphQL Codegen generates: import * as Apollo from '@apollo/client'
 * - Then uses: Apollo.useQuery<...>(...)
 * - In Vitest SSR: Apollo.useQuery is undefined
 *
 * SOLUTION:
 * - Replace: import * as Apollo from '@apollo/client'
 * - With: import { useQuery, useLazyQuery, useMutation, ... } from '@apollo/client'
 * - Replace: Apollo.useQuery → useQuery
 * - Replace: Apollo.QueryHookOptions → QueryHookOptions
 *
 * USAGE:
 * - Run after codegen: npm run codegen && node scripts/fix-apollo-imports.js
 * - Or add to package.json: "codegen": "graphql-codegen && node scripts/fix-apollo-imports.js"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Configuration
// ============================================================================

const GENERATED_FILE = path.resolve(__dirname, "../src/core/api/apollo/generated/graphql.ts");

const BACKUP_SUFFIX = ".backup";

// ============================================================================
// Import Replacements
// ============================================================================

const APOLLO_HOOKS = [
  "useQuery",
  "useLazyQuery",
  "useMutation",
  "useSubscription",
  "useFragment",
  "useBackgroundQuery",
  "useReadQuery",
  "useSuspenseQuery",
];

const APOLLO_TYPES = [
  "QueryHookOptions",
  "LazyQueryHookOptions",
  "MutationHookOptions",
  "SubscriptionHookOptions",
  "QueryResult",
  "LazyQueryResult",
  "LazyQueryResultTuple",
  "MutationResult",
  "MutationTuple",
  "SubscriptionResult",
  "OperationVariables",
  "DefaultContext",
  "ApolloCache",
  "ApolloClient",
  "DocumentNode",
  "TypedDocumentNode",
  "NormalizedCacheObject",
];

// ============================================================================
// Main Function
// ============================================================================

function fixApolloImports() {
  console.log("🔧 Fixing Apollo Client imports for Vitest SSR compatibility...\n");

  // Check if file exists
  if (!fs.existsSync(GENERATED_FILE)) {
    console.error(`❌ Error: File not found: ${GENERATED_FILE}`);
    process.exit(1);
  }

  // Read file
  console.log(`📖 Reading: ${path.relative(process.cwd(), GENERATED_FILE)}`);
  let content = fs.readFileSync(GENERATED_FILE, "utf8");

  // Create backup
  const backupFile = GENERATED_FILE + BACKUP_SUFFIX;
  console.log(`💾 Creating backup: ${path.relative(process.cwd(), backupFile)}`);
  fs.writeFileSync(backupFile, content, "utf8");

  // Track changes
  let changesMade = 0;

  // ============================================================================
  // Step 1: Replace namespace import with named imports
  // ============================================================================

  const namespaceImportRegex = /import \* as Apollo from ['"]@apollo\/client['"];/;

  if (namespaceImportRegex.test(content)) {
    console.log("\n✅ Found namespace import, adding destructuring after import...");

    // Keep the original import but add destructuring right after it
    const destructuring = `\n// Destructure for Vitest SSR compatibility\nconst {\n  ${APOLLO_HOOKS.join(",\n  ")},\n} = Apollo;`;

    // Find the import line and add destructuring after it
    const importMatch = content.match(/import \* as Apollo from ['"]@apollo\/client['"];/);
    if (importMatch) {
      const importStatement = importMatch[0];
      content = content.replace(importStatement, importStatement + destructuring);
      changesMade++;
    }
  }

  // ============================================================================
  // Step 2: Replace Apollo.useQuery → useQuery (and other hooks)
  // ============================================================================

  console.log("\n🔄 Replacing Apollo.* references with direct references...");

  APOLLO_HOOKS.forEach((hook) => {
    const regex = new RegExp(`Apollo\\.${hook}`, "g");
    const matches = content.match(regex);
    if (matches) {
      console.log(`   - Apollo.${hook} → ${hook} (${matches.length} occurrences)`);
      content = content.replace(regex, hook);
      changesMade += matches.length;
    }
  });

  // ============================================================================
  // Step 3: Replace Apollo.TypeName → TypeName
  // ============================================================================

  APOLLO_TYPES.forEach((type) => {
    const regex = new RegExp(`Apollo\\.${type}`, "g");
    const matches = content.match(regex);
    if (matches) {
      console.log(`   - Apollo.${type} → ${type} (${matches.length} occurrences)`);
      content = content.replace(regex, type);
      changesMade += matches.length;
    }
  });

  // ============================================================================
  // Step 4: Add comment at top of file
  // ============================================================================

  const header = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 *
 * This file is generated by GraphQL Code Generator.
 * Apollo Client imports have been automatically fixed for Vitest SSR compatibility.
 *
 * To regenerate: npm run codegen
 *
 * @see scripts/fix-apollo-imports.js
 */

`;

  // Insert after first import (gql)
  const firstImportIndex = content.indexOf("import { gql }");
  if (firstImportIndex !== -1) {
    content = content.slice(0, firstImportIndex) + header + content.slice(firstImportIndex);
    changesMade++;
  }

  // ============================================================================
  // Save changes
  // ============================================================================

  if (changesMade > 0) {
    console.log(`\n💾 Writing changes to file...`);
    fs.writeFileSync(GENERATED_FILE, content, "utf8");

    console.log(`\n✅ SUCCESS! Fixed ${changesMade} Apollo import references.`);
    console.log(`📝 Backup saved to: ${path.relative(process.cwd(), backupFile)}\n`);
  } else {
    console.log("\n⚠️  No changes needed - file already uses named imports.\n");
  }
}

// ============================================================================
// Utility: Restore from backup
// ============================================================================

function restoreBackup() {
  const backupFile = GENERATED_FILE + BACKUP_SUFFIX;

  if (!fs.existsSync(backupFile)) {
    console.error("❌ No backup file found.");
    process.exit(1);
  }

  console.log("🔄 Restoring from backup...");
  const backup = fs.readFileSync(backupFile, "utf8");
  fs.writeFileSync(GENERATED_FILE, backup, "utf8");
  console.log("✅ Restored successfully!");
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);

if (args.includes("--restore")) {
  restoreBackup();
} else if (args.includes("--help") || args.includes("-h")) {
  console.log(`
Usage: node scripts/fix-apollo-imports.js [options]

Options:
  (no args)    Fix Apollo imports in generated GraphQL file
  --restore    Restore from backup
  --help, -h   Show this help message

Examples:
  npm run codegen && node scripts/fix-apollo-imports.js
  node scripts/fix-apollo-imports.js --restore
  `);
} else {
  fixApolloImports();
}
