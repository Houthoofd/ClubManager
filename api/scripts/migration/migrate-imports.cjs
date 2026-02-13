#!/usr/bin/env node

/**
 * Script de migration des imports vers path aliases
 *
 * Remplace les imports relatifs complexes (../../../../) par des path aliases (@/)
 *
 * ✅ COMPLÉTÉ : Tous les barrel exports ont été créés pour chaque module
 * - 19 modules dans routes/ ont maintenant leur index.ts
 * - 1 barrel export central dans routes/index.ts
 * - 1 barrel export global dans src/index.ts
 * - 1 barrel export infrastructure dans infrastructure/index.ts
 *
 * Usage:
 *   node scripts/migrate-imports.cjs
 *   node scripts/migrate-imports.cjs --dry-run
 *   node scripts/migrate-imports.cjs --file=src/routes/auth/core/services/auth.service.ts
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

// Configuration des remplacements
const IMPORT_REPLACEMENTS = [
  // Infrastructure
  {
    pattern:
      /from ['"](\.\.\/)+infrastructure\/database\/prisma-client\.js['"]/g,
    replacement: `from '@/infrastructure/database/prisma-client.js'`,
    description: "Prisma client",
  },
  {
    pattern:
      /from ['"](\.\.\/)+infrastructure\/external-services\/email\/index\.js['"]/g,
    replacement: `from '@/infrastructure/external-services/email/index.js'`,
    description: "Email client (index)",
  },
  {
    pattern:
      /from ['"](\.\.\/)+infrastructure\/external-services\/emailClient\.js['"]/g,
    replacement: `from '@/infrastructure/external-services/emailClient.js'`,
    description: "Email client (direct)",
  },
  {
    pattern:
      /from ['"](\.\.\/)+infrastructure\/external-services\/s3\/s3\.service\.js['"]/g,
    replacement: `from '@/infrastructure/external-services/s3/s3.service.js'`,
    description: "S3 service",
  },

  // Shared - Config
  {
    pattern: /from ['"](\.\.\/)+shared\/config\/sentry\.config\.js['"]/g,
    replacement: `from '@/shared/config/sentry.config.js'`,
    description: "Sentry config",
  },
  {
    pattern: /from ['"](\.\.\/)+shared\/config\/app\.config\.js['"]/g,
    replacement: `from '@/shared/config/app.config.js'`,
    description: "App config",
  },
  {
    pattern: /from ['"](\.\.\/)+shared\/config\/index\.js['"]/g,
    replacement: `from '@/shared/config/index.js'`,
    description: "Config index",
  },

  // Shared - Middleware
  {
    pattern: /from ['"](\.\.\/)+shared\/middleware\/auth\.middleware\.js['"]/g,
    replacement: `from '@/shared/middleware/auth.middleware.js'`,
    description: "Auth middleware",
  },
  {
    pattern:
      /from ['"](\.\.\/)+shared\/middleware\/validation\.middleware\.js['"]/g,
    replacement: `from '@/shared/middleware/validation.middleware.js'`,
    description: "Validation middleware",
  },
  {
    pattern:
      /from ['"](\.\.\/)+shared\/middleware\/audit-log\.middleware\.js['"]/g,
    replacement: `from '@/shared/middleware/audit-log.middleware.js'`,
    description: "Audit log middleware",
  },
  {
    pattern:
      /from ['"](\.\.\/)+shared\/middleware\/rate-limit\.middleware\.js['"]/g,
    replacement: `from '@/shared/middleware/rate-limit.middleware.js'`,
    description: "Rate limit middleware",
  },
  {
    pattern:
      /from ['"](\.\.\/)+shared\/middleware\/sentry\.middleware\.js['"]/g,
    replacement: `from '@/shared/middleware/sentry.middleware.js'`,
    description: "Sentry middleware",
  },
  {
    pattern: /from ['"](\.\.\/)+shared\/middleware\/index\.js['"]/g,
    replacement: `from '@/shared/middleware/index.js'`,
    description: "Middleware index",
  },

  // Shared - Errors
  {
    pattern: /from ['"](\.\.\/)+shared\/errors\/GraphQLErrors\.js['"]/g,
    replacement: `from '@/shared/errors/GraphQLErrors.js'`,
    description: "GraphQL errors",
  },
  {
    pattern: /from ['"](\.\.\/)+shared\/errors\/index\.js['"]/g,
    replacement: `from '@/shared/errors/index.js'`,
    description: "Errors index",
  },

  // Shared - Services
  {
    pattern: /from ['"](\.\.\/)+shared\/services\/audit-log\.service\.js['"]/g,
    replacement: `from '@/shared/services/audit-log.service.js'`,
    description: "Audit log service",
  },
  {
    pattern: /from ['"](\.\.\/)+shared\/services\/session\.service\.js['"]/g,
    replacement: `from '@/shared/services/session.service.js'`,
    description: "Session service",
  },
  {
    pattern: /from ['"](\.\.\/)+shared\/services\/index\.js['"]/g,
    replacement: `from '@/shared/services/index.js'`,
    description: "Services index",
  },

  // Shared - Types
  {
    pattern: /from ['"](\.\.\/)+shared\/types\/context\.types\.js['"]/g,
    replacement: `from '@/shared/types/context.types.js'`,
    description: "Context types",
  },
  {
    pattern: /from ['"](\.\.\/)+shared\/types\/index\.js['"]/g,
    replacement: `from '@/shared/types/index.js'`,
    description: "Types index",
  },

  // Shared - Utils
  {
    pattern: /from ['"](\.\.\/)+shared\/utils\//g,
    replacement: `from '@/shared/utils/`,
    description: "Shared utils",
  },

  // Shared - Index (barrel export)
  {
    pattern: /from ['"](\.\.\/)+shared\/index\.js['"]/g,
    replacement: `from '@/shared/index.js'`,
    description: "Shared index",
  },

  // Types
  {
    pattern: /from ['"](\.\.\/)+types\//g,
    replacement: `from '@/types/`,
    description: "Types directory",
  },
];

// Arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const specificFile = args
  .find((arg) => arg.startsWith("--file="))
  ?.split("=")[1];

let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

/**
 * Migrer les imports d'un fichier
 */
function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  let newContent = content;
  let fileModified = false;
  let replacementsInFile = 0;

  // Appliquer tous les remplacements
  for (const { pattern, replacement, description } of IMPORT_REPLACEMENTS) {
    const matches = content.match(pattern);
    if (matches) {
      newContent = newContent.replace(pattern, replacement);
      fileModified = true;
      replacementsInFile += matches.length;

      if (isDryRun || process.env.VERBOSE) {
        console.log(`  ✓ ${description}: ${matches.length} remplacement(s)`);
      }
    }
  }

  if (fileModified) {
    modifiedFiles++;
    totalReplacements += replacementsInFile;

    console.log(`\n📝 ${filePath}`);
    console.log(`   ${replacementsInFile} import(s) modernisé(s)`);

    if (!isDryRun) {
      fs.writeFileSync(filePath, newContent, "utf-8");
      console.log(`   ✅ Fichier sauvegardé`);
    } else {
      console.log(`   ℹ️  DRY RUN - Pas de modification`);
    }
  }
}

/**
 * Main
 */
async function main() {
  console.log("🚀 Migration des imports vers path aliases\n");

  if (isDryRun) {
    console.log("⚠️  MODE DRY RUN - Aucune modification ne sera effectuée\n");
  }

  let files;

  if (specificFile) {
    files = [path.join(process.cwd(), "src", specificFile)];
    console.log(`📁 Fichier spécifique: ${specificFile}\n`);
  } else {
    // Trouver tous les fichiers TypeScript dans src/routes et src/shared
    files = await glob("src/**/*.ts", {
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/__tests__/**",
        "**/generated/**",
      ],
      cwd: process.cwd(),
      absolute: true,
    });

    console.log(`📁 ${files.length} fichiers TypeScript trouvés\n`);
  }

  // Migrer chaque fichier
  for (const file of files) {
    totalFiles++;
    migrateFile(file);
  }

  // Résumé
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ DE LA MIGRATION");
  console.log("=".repeat(60));
  console.log(`Fichiers analysés:  ${totalFiles}`);
  console.log(`Fichiers modifiés:  ${modifiedFiles}`);
  console.log(`Total remplacements: ${totalReplacements}`);

  if (isDryRun) {
    console.log("\n⚠️  MODE DRY RUN - Aucune modification effectuée");
    console.log("💡 Exécutez sans --dry-run pour appliquer les changements");
  } else {
    console.log("\n✅ Migration terminée avec succès !");
  }

  console.log("\n💡 PROCHAINES ÉTAPES:");
  console.log("  1. Vérifier que les tests passent: npm test");
  console.log("  2. Vérifier la compilation: npm run build");
  console.log(
    '  3. Commit les changements: git add . && git commit -m "refactor: migrate to path aliases"',
  );
}

// Exécution
main().catch((error) => {
  console.error("❌ Erreur:", error);
  process.exit(1);
});
